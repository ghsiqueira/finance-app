import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (!__DEV__) {
    // TODO: Quando tiver backend em produção, mudar aqui
    return 'https://seu-backend-em-producao.com/api';
  }

  // DESENVOLVIMENTO: Detectar automaticamente
  const localhost = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';
  const expoDebuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
  const apiHost = expoDebuggerHost || localhost;
  
  return `http://${apiHost}:3000/api`;
};

const API_URL = getApiUrl();

console.log('🌐 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  verifyResetCode: (data: { email: string; code: string }) => 
    api.post('/auth/verify-code', data),
  resetPassword: (data: { email: string; code: string; password: string }) => 
    api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
};

export const transactionAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getReports: (params?: any) => api.get('/reports/summary', { params }),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  initialize: async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.length === 0) {
        const defaultCategories = [
          { name: 'Alimentação', icon: 'restaurant', color: '#FF6B35', type: 'expense' },
          { name: 'Transporte', icon: 'car', color: '#4A90E2', type: 'expense' },
          { name: 'Salário', icon: 'cash', color: '#4CAF50', type: 'income' },
        ];
        for (const category of defaultCategories) {
          await api.post('/categories', category);
        }
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  },
};

export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  getById: (id: string) => api.get(`/budgets/${id}`),
  create: (data: any) => api.post('/budgets', data),
  update: (id: string, data: any) => api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

export const goalAPI = {
  getAll: () => api.get('/goals'),
  getById: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  addProgress: (id: string, data: any) => api.post(`/goals/${id}/progress`, data),
  addSharedProgress: (id: string, amount: number) => 
    api.post(`/goals/${id}/progress`, { amount }),
  share: (id: string, data: any) => api.post(`/goals/${id}/share`, data),
  shareGoal: (id: string, data: any) => api.post(`/goals/${id}/share`, data),
  updateMember: (goalId: string, memberId: string, data: any) => 
    api.put(`/goals/${goalId}/members/${memberId}`, data),
  updateMemberRole: (goalId: string, memberId: string, role: string, limit?: number) => 
    api.put(`/goals/${goalId}/members/${memberId}`, { role, contributionLimit: limit }),
  removeMember: (goalId: string, memberId: string) => 
    api.delete(`/goals/${goalId}/members/${memberId}`),
  leaveGoal: (id: string) => api.post(`/goals/${id}/leave`),
  getInvites: () => api.get('/goals/invites'),
  respondInvite: (inviteId: string, data: any) => 
    api.post(`/goals/invites/${inviteId}/respond`, data),
  respondToInvite: (inviteId: string, data: any) => 
    api.post(`/goals/invites/${inviteId}/respond`, data),
};

export const reportAPI = {
  getSummary: (params?: any) => api.get('/reports/summary', { params }),
  getByCategory: (params?: any) => api.get('/reports/by-category', { params }),
  getMonthly: (params?: any) => api.get('/reports/monthly', { params }),
};

export const dashboardAPI = {
  getSummary: (params?: any) => api.get('/dashboard/summary', { params }), 
  getRecentTransactions: (params?: any) => api.get('/transactions', { params }),
  getGoalsProgress: () => api.get('/goals'),
};

export const exportAPI = {
  exportCSV: (params?: any) => api.get('/export/csv', { params, responseType: 'blob' }),
  exportExcel: (params?: any) => api.get('/export/excel', { params, responseType: 'blob' }),
  exportPDF: (params?: any) => api.get('/export/pdf', { params, responseType: 'blob' }),
};