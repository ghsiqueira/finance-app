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
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      // Simular dados de orçamentos com gastos calculados
      const mockBudgets: Budget[] = [
        {
          id: '1',
          name: 'Alimentação Mensal',
          amount: 500,
          spent: 150.80,
          categoryId: '1',
          category: mockCategories[0],
          period: 'monthly',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          alertThreshold: 80,
          autoRenew: true,
          userId: 'user1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Transporte Semanal',
          amount: 200,
          spent: 25.50,
          categoryId: '2',
          category: mockCategories[1],
          period: 'weekly',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          alertThreshold: 75,
          autoRenew: false,
          userId: 'user1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Lazer Mensal',
          amount: 300,
          spent: 320,
          categoryId: '6',
          category: mockCategories[5],
          period: 'monthly',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          alertThreshold: 90,
          autoRenew: true,
          userId: 'user1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      return mockBudgets;
    }
    
    try {
      const response = await api.get('/budgets');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar orçamentos');
    }
  }

  async createBudget(data: Partial<Budget>): Promise<Budget> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(800);
      
      const category = mockCategories.find(c => c.id === data.categoryId);
      const newBudget: Budget = {
        id: Math.random().toString(),
        name: data.name || '',
        amount: data.amount || 0,
        spent: 0,
        categoryId: data.categoryId || '',
        category,
        period: data.period || 'monthly',
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || new Date().toISOString(),
        alertThreshold: data.alertThreshold || 80,
        autoRenew: data.autoRenew || false,
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return newBudget;
    }
    
    try {
      const response = await api.post('/budgets', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar orçamento');
    }
  }

  async updateBudget(id: string, data: Partial<Budget>): Promise<Budget> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      // Simular atualização
      const updatedBudget: Budget = {
        id,
        name: data.name || 'Orçamento Atualizado',
        amount: data.amount || 0,
        spent: data.spent || 0,
        categoryId: data.categoryId || '',
        category: data.category,
        period: data.period || 'monthly',
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || new Date().toISOString(),
        alertThreshold: data.alertThreshold || 80,
        autoRenew: data.autoRenew || false,
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return updatedBudget;
    }
    
    try {
      const response = await api.put(`/budgets/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar orçamento');
    }
  }

  async deleteBudget(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(500);
      // Simular exclusão
      return;
    }
    
    try {
      await api.delete(`/budgets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar orçamento');
    }
  }

  async getBudgetById(id: string): Promise<Budget> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(400);
      
      // Retornar um orçamento mock baseado no ID
      const category = mockCategories[0];
      const mockBudget: Budget = {
        id,
        name: 'Orçamento de Teste',
        amount: 1000,
        spent: 250,
        categoryId: category.id,
        category,
        period: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        alertThreshold: 80,
        autoRenew: false,
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return mockBudget;
    }
    
    try {
      const response = await api.get(`/budgets/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar orçamento');
    }
  }

  // 🎯 METAS
  async getGoals(): Promise<Goal[]> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      // Dados mock de metas
      const mockGoals: Goal[] = [
        {
          id: '1',
          name: 'Viagem de Férias',
          description: 'Economizar para viagem ao Japão',
          targetAmount: 5000,
          currentAmount: 1200,
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          status: 'active',
          reminders: [],
          userId: 'user1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Fundo de Emergência',
          description: 'Reserva para emergências',
          targetAmount: 10000,
          currentAmount: 3500,
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          status: 'active',
          reminders: [],
          userId: 'user1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      return mockGoals;
    }
    
    try {
      const response = await api.get('/goals');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar metas');
    }
  }

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(800);
      
      const newGoal: Goal = {
        id: Math.random().toString(),
        name: data.name || '',
        description: data.description,
        targetAmount: data.targetAmount || 0,
        currentAmount: 0,
        targetDate: data.targetDate || new Date().toISOString(),
        categoryId: data.categoryId,
        category: data.categoryId ? mockCategories.find(c => c.id === data.categoryId) : undefined,
        priority: data.priority || 'medium',
        status: 'active',
        reminders: [],
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return newGoal;
    }
    
    try {
      const response = await api.post('/goals', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar meta');
    }
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      const updatedGoal: Goal = {
        id,
        name: data.name || 'Meta Atualizada',
        description: data.description,
        targetAmount: data.targetAmount || 0,
        currentAmount: data.currentAmount || 0,
        targetDate: data.targetDate || new Date().toISOString(),
        categoryId: data.categoryId,
        category: data.categoryId ? mockCategories.find(c => c.id === data.categoryId) : undefined,
        priority: data.priority || 'medium',
        status: data.status || 'active',
        reminders: data.reminders || [],
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return updatedGoal;
    }
    
    try {
      const response = await api.put(`/goals/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar meta');
    }
  }

  async deleteGoal(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(500);
      return;
    }
    
    try {
      await api.delete(`/goals/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar meta');
    }
  }

  async getGoalById(id: string): Promise<Goal> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(400);
      
      const mockGoal: Goal = {
        id,
        name: 'Meta de Teste',
        description: 'Descrição da meta de teste',
        targetAmount: 5000,
        currentAmount: 1500,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'active',
        reminders: [],
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return mockGoal;
    }
    
    try {
      const response = await api.get(`/goals/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar meta');
    }
  }

  async addGoalContribution(goalId: string, data: { amount: number; notes?: string }): Promise<Goal> {
    if (USE_MOCK_DATA) {
      await simulateApiDelay(600);
      
      // Simular adição de contribuição
      const mockGoal: Goal = {
        id: goalId,
        name: 'Meta Atualizada',
        description: 'Meta com nova contribuição',
        targetAmount: 5000,
        currentAmount: 1500 + data.amount,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'active',
        reminders: [],
        userId: 'user1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return mockGoal;
    }
    
    try {
      const response = await api.post(`/goals/${goalId}/contributions`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar contribuição');
    }
  }
}

export default new FinanceService();