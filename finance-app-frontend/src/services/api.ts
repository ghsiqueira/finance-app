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
    if (token && !config.headers.Authorization) {
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
    api.post('/auth/verify-reset-code', data),
  resetPassword: (data: { email: string; code: string; newPassword: string }) => 
    api.post('/auth/reset-password', data),
  deleteAccount: (password: string) => 
    api.delete('/auth/delete-account', { data: { password } }),
  updateProfile: async (data: { name: string; email: string }) => {
    return api.put('/auth/profile', data);
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return api.put('/auth/password', data);
  },
  uploadProfilePhoto: (formData: FormData) => {
    return api.post('/auth/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProfilePhoto: () => {
    return api.delete('/auth/profile/photo');
  },
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
    api.post(`/goals/${id}/shared-progress`, { amount }),
  share: (id: string, data: any) => api.post(`/goals/${id}/share`, data),
  shareGoal: (id: string, invites: any) => api.post(`/goals/${id}/share`, { invites }),
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
  respondToInvite: (goalId: string, accept: boolean) => 
    api.post(`/goals/${goalId}/invite/respond`, { accept })
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

export const insightsAPI = {
  getSummary: () => api.get('/insights/summary'),
};

export const recurrenceAPI = {
  getAll: () => api.get('/recurrence'),
  pause: (id: string) => api.patch(`/recurrence/${id}/pause`),
  resume: (id: string) => api.patch(`/recurrence/${id}/resume`),
  delete: (id: string, deleteFuture?: boolean) => {
    const params = deleteFuture ? { deleteFuture: true } : {};
    return api.delete(`/recurrence/${id}`, { params });
  },
  generate: () => api.post('/recurrence/generate'),
  addToTransaction: (id: string, config: { 
    frequency: string; 
    dayOfMonth?: number; 
    isBusinessDay?: boolean 
  }) => api.patch(`/recurrence/${id}/add`, config),
  editRecurrence: (id: string, config: { 
    frequency: string; 
    dayOfMonth?: number; 
    isBusinessDay?: boolean 
  }) => api.patch(`/recurrence/${id}/edit`, config),
};

export const backupAPI = {
  export: () => api.get('/backup/export'),
  import: (data: any, clearExisting: boolean = true) => 
    api.post('/backup/import', { data, clearExisting }),
};

export const billAPI = {
  getAll: (params?: any) => api.get('/bills', { params }),
  getById: (id: string) => api.get(`/bills/${id}`),
  create: (data: any) => api.post('/bills', data),
  update: (id: string, data: any) => api.put(`/bills/${id}`, data),
  delete: (id: string) => api.delete(`/bills/${id}`),
  markAsPaid: (id: string) => api.post(`/bills/${id}/pay`),
  getUpcoming: () => api.get('/bills/upcoming'),
  getOverdue: () => api.get('/bills/overdue'),
};

export const creditCardAPI = {
  getDashboard: () => api.get('/credit-cards/dashboard'),

  getAll: () => api.get('/credit-cards'),
  getById: (id: string) => api.get(`/credit-cards/${id}`),
  create: (data: any) => api.post('/credit-cards', data),
  update: (id: string, data: any) => api.put(`/credit-cards/${id}`, data),
  delete: (id: string) => api.delete(`/credit-cards/${id}`),

  addPurchase: (data: any) => api.post('/credit-cards/purchases', data),
  getPurchases: (cardId: string, params?: any) => 
    api.get(`/credit-cards/${cardId}/purchases`, { params }),

  getInvoices: (cardId: string) => api.get(`/credit-cards/${cardId}/invoices`),
  payInvoice: (cardId: string, invoiceMonth: string) => 
    api.post(`/credit-cards/${cardId}/pay-invoice`, { invoiceMonth }),
};

export { API_URL };