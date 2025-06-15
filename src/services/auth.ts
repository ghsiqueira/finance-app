import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
    currency: string;
    language: string;
  };
}

class AuthService {
  // 🔐 LOGIN
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post('/auth/login', data);
      const { user, token } = response.data;

      // Salvar no storage seguro
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  }

  // 📝 REGISTRO
  async register(data: RegisterData): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    }
  }

  // 📧 ESQUECI A SENHA
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao enviar email');
    }
  }

  // 🔄 RESET DE SENHA
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao redefinir senha');
    }
  }

  // 🚪 LOGOUT
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  // 👤 OBTER USUÁRIO LOGADO
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  // ✅ VERIFICAR SE ESTÁ LOGADO
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();