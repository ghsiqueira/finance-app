import api from './api';
import { 
  Transaction, 
  Category, 
  Budget, 
  Goal, 
  DashboardStats,
  PaginatedResponse,
  ApiResponse 
} from '../types';
import { 
  mockCategories, 
  mockTransactions, 
  mockDashboardStats,
  simulateApiDelay 
} from '../utils/mockData';

// 🔧 CONFIGURAÇÃO PARA USAR MOCK OU API REAL
const USE_MOCK_DATA = true; // Mude para false quando conectar com backend real

class FinanceService {
  // 📊 DASHBOARD
  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(800);
      return mockDashboardStats;
    }
    
    try {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar estatísticas');
    }
  }

  // 📂 CATEGORIAS
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(500);
      return mockCategories;
    }
    
    try {
      const response = await api.get('/categories');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar categorias');
    }
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      const newCategory: Category = {
        id: Math.random().toString(),
        name: data.name || '',
        icon: data.icon || 'ellipse',
        color: data.color || '#6b7280',
        type: data.type || 'expense',
        isDefault: false,
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Adicionar à lista mock
      mockCategories.push(newCategory);
      return newCategory;
    }
    
    try {
      const response = await api.post('/categories', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar categoria');
    }
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      const index = mockCategories.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error('Categoria não encontrada');
      }
      
      const updatedCategory = {
        ...mockCategories[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      mockCategories[index] = updatedCategory;
      return updatedCategory;
    }
    
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar categoria');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(500);
      
      const index = mockCategories.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error('Categoria não encontrada');
      }
      
      const category = mockCategories[index];
      if (category.isDefault) {
        throw new Error('Categorias padrão não podem ser excluídas');
      }
      
      mockCategories.splice(index, 1);
      return;
    }
    
    try {
      await api.delete(`/categories/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar categoria');
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(400);
      
      const category = mockCategories.find(c => c.id === id);
      if (!category) {
        throw new Error('Categoria não encontrada');
      }
      
      return category;
    }
    
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar categoria');
    }
  }

  // 💰 TRANSAÇÕES
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: 'income' | 'expense' | 'all';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaginatedResponse<Transaction>> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(700);
      
      let filteredTransactions = [...mockTransactions];
      
      // Aplicar filtros
      if (params?.type && params.type !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === params.type);
      }
      
      if (params?.categoryId) {
        filteredTransactions = filteredTransactions.filter(t => t.categoryId === params.categoryId);
      }
      
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        filteredTransactions = filteredTransactions.filter(t => 
          t.description.toLowerCase().includes(searchLower) ||
          t.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      // Paginação
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filteredTransactions.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredTransactions.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }
    
    try {
      // Para a API real, filtrar o parâmetro 'all'
      const apiParams = { ...params };
      if (apiParams.type === 'all') {
        delete apiParams.type;
      }
      
      const response = await api.get('/transactions', { params: apiParams });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar transações');
    }
  }

  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(800);
      
      const category = mockCategories.find(c => c.id === data.categoryId);
      const newTransaction: Transaction = {
        id: Math.random().toString(),
        description: data.description || '',
        amount: data.amount || 0,
        type: data.type || 'expense',
        categoryId: data.categoryId || '',
        category,
        date: data.date || new Date().toISOString(),
        notes: data.notes,
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Adicionar à lista mock para simular persistência
      mockTransactions.unshift(newTransaction);
      return newTransaction;
    }
    
    try {
      const response = await api.post('/transactions', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar transação');
    }
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      const index = mockTransactions.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Transação não encontrada');
      }
      
      const updatedTransaction = {
        ...mockTransactions[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      mockTransactions[index] = updatedTransaction;
      return updatedTransaction;
    }
    
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar transação');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(500);
      
      const index = mockTransactions.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Transação não encontrada');
      }
      
      mockTransactions.splice(index, 1);
      return;
    }
    
    try {
      await api.delete(`/transactions/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar transação');
    }
  }

  // 💳 ORÇAMENTOS
  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await api.get('/budgets');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar orçamentos');
    }
  }

  async createBudget(data: Partial<Budget>): Promise<Budget> {
    try {
      const response = await api.post('/budgets', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar orçamento');
    }
  }

  async updateBudget(id: string, data: Partial<Budget>): Promise<Budget> {
    try {
      const response = await api.put(`/budgets/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar orçamento');
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      await api.delete(`/budgets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar orçamento');
    }
  }

  // 🎯 METAS
  async getGoals(): Promise<Goal[]> {
    try {
      const response = await api.get('/goals');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar metas');
    }
  }

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    try {
      const response = await api.post('/goals', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar meta');
    }
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    try {
      const response = await api.put(`/goals/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar meta');
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      await api.delete(`/goals/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar meta');
    }
  }

  async addGoalContribution(goalId: string, data: { amount: number; notes?: string }): Promise<Goal> {
    try {
      const response = await api.post(`/goals/${goalId}/contributions`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar contribuição');
    }
  }
}

export default new FinanceService();