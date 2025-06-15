import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 🌐 CONFIGURAÇÃO BASE DA API
const API_BASE_URL = 'http://localhost:3000/api'; // Substitua pela URL do seu backend

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 INTERCEPTOR PARA TOKEN DE AUTENTICAÇÃO
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao buscar token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 📨 INTERCEPTOR DE RESPOSTA PARA TRATAR ERROS
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpar storage e redirecionar para login
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      // Aqui você pode adicionar navegação para tela de login
    }
    return Promise.reject(error);
  }
);

export default api;