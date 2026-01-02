import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  profilePhoto?: string | null;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void; // 🆕 ADICIONAR
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user');
      const storedToken = await AsyncStorage.getItem('@token');

      console.log('=== LOAD STORED DATA ===');
      console.log('Has user:', !!storedUser);
      console.log('Has token:', !!storedToken);

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        console.log('Loaded user:', userData.email);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('=== LOGIN ===');
      console.log('Email:', email);
      
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;

      console.log('Login successful');
      console.log('User ID:', userData.id);

      await AsyncStorage.setItem('@token', token);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('Token and user saved');
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('=== REGISTER ===');
      console.log('Email:', email);
      
      const response = await authAPI.register(name, email, password);
      const { token, user: userData } = response.data;

      console.log('Registration successful');
      console.log('User ID:', userData.id);

      await AsyncStorage.setItem('@token', token);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('Token and user saved + header configured');
      setUser(userData);
    } catch (error: any) {
      console.error('Register error:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    }
  };

  const logout = async () => {
    try {
      console.log('=== LOGOUT ===');
      console.log('Current user:', user?.email);
      
      await AsyncStorage.removeItem('@token');
      await AsyncStorage.removeItem('@user');
      
      delete api.defaults.headers.common['Authorization'];
      
      console.log('Token and user removed');
      console.log('==============');
      
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // 🆕 FUNÇÃO PARA ATUALIZAR USUÁRIO
  const updateUser = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      console.log('User updated in context and storage');
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};