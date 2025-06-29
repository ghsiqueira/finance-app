// src/store/budgetStore.ts - CORRIGIDO

import { create } from 'zustand';
import { Budget } from '../types';

interface BudgetFilters {
  status?: 'active' | 'expired' | 'future';
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  categoryId?: string;
  isExceeded?: boolean;
  nearLimit?: boolean;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  activeBudgetsCount: number;
  budgetsExceeded: number;
  budgetsNearLimit: number;
}

interface Alert {
  budgetId: string;
  budgetName: string;
  type: 'exceeded' | 'near_limit' | 'expired';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface BudgetStore {
  budgets: Budget[];
  filteredBudgets: Budget[];
  selectedBudget: Budget | null;
  filters: BudgetFilters;
  summary: BudgetSummary | null;
  isLoading: boolean;
  error: string | null;
  
  alerts: Alert[];
  
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  toggleBudgetStatus: (id: string) => void;
  
  setFilters: (filters: Partial<BudgetFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  
  selectBudget: (budget: Budget | null) => void;
  
  calculateSummary: () => void;
  updateBudgetProgress: (budgetId: string, spent: number) => void;
  
  generateAlerts: () => void;
  dismissAlert: (budgetId: string) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  getBudgetsByCategory: (categoryId: string) => Budget[];
  getBudgetsByStatus: (status: 'active' | 'expired' | 'future') => Budget[];
  getExceededBudgets: () => Budget[];
  getBudgetsNearLimit: (threshold?: number) => Budget[];
  getBudgetProgress: (budgetId: string) => {
    percentage: number;
    remaining: number;
    isExceeded: boolean;
    daysRemaining: number;
  } | null;
  
  reset: () => void;
}

// Função auxiliar para verificar se orçamento excedeu
const isBudgetExceeded = (budget: Budget): boolean => {
  return budget.spent > budget.amount || budget.status === 'exceeded';
};

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  filteredBudgets: [],
  selectedBudget: null,
  filters: {},
  summary: null,
  isLoading: false,
  error: null,
  alerts: [],

  setBudgets: (budgets) => {
    set({ budgets });
    get().applyFilters();
    get().calculateSummary();
    get().generateAlerts();
  },

  addBudget: (budget) => {
    const { budgets } = get();
    const newBudgets = [...budgets, budget];
    
    set({ budgets: newBudgets });
    get().applyFilters();
    get().calculateSummary();
    get().generateAlerts();
  },

  updateBudget: (id, updates) => {
    const { budgets } = get();
    const updatedBudgets = budgets.map(b => 
      b._id === id ? { ...b, ...updates } : b
    );
    
    set({ budgets: updatedBudgets });
    get().applyFilters();
    get().calculateSummary();
    get().generateAlerts();
    
    const { selectedBudget } = get();
    if (selectedBudget && selectedBudget._id === id) {
      set({ selectedBudget: { ...selectedBudget, ...updates } });
    }
  },

  removeBudget: (id) => {
    const { budgets, alerts } = get();
    const updatedBudgets = budgets.filter(b => b._id !== id);
    const updatedAlerts = alerts.filter(a => a.budgetId !== id);
    
    set({ 
      budgets: updatedBudgets,
      alerts: updatedAlerts,
    });
    get().applyFilters();
    get().calculateSummary();
    
    const { selectedBudget } = get();
    if (selectedBudget && selectedBudget._id === id) {
      set({ selectedBudget: null });
    }
  },

  toggleBudgetStatus: (id) => {
    const { budgets } = get();
    const updatedBudgets = budgets.map(b => 
      b._id === id ? { ...b, isActive: !b.isActive } : b
    );
    
    set({ budgets: updatedBudgets });
    get().applyFilters();
    get().calculateSummary();
    get().generateAlerts();
  },

  setFilters: (newFilters) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({ filters: updatedFilters });
    get().applyFilters();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  },

  applyFilters: () => {
    const { budgets, filters } = get();
    let filtered = [...budgets];
    const now = new Date();

    if (filters.status) {
      filtered = filtered.filter(b => {
        const endDate = new Date(b.endDate);
        const startDate = new Date(b.startDate);
        
        switch (filters.status) {
          case 'active':
            return b.isActive && startDate <= now && endDate >= now;
          case 'expired':
            return endDate < now;
          case 'future':
            return startDate > now;
          default:
            return true;
        }
      });
    }

    if (filters.period) {
      filtered = filtered.filter(b => b.period === filters.period);
    }

    if (filters.categoryId) {
      filtered = filtered.filter(b => b.categoryId === filters.categoryId);
    }

    if (filters.isExceeded) {
      // ✅ CORRIGIDO: Usar função auxiliar ao invés de propriedade
      filtered = filtered.filter(b => isBudgetExceeded(b));
    }

    if (filters.nearLimit) {
      filtered = filtered.filter(b => {
        const threshold = b.alertThreshold || 80;
        return b.spentPercentage >= threshold && !isBudgetExceeded(b);
      });
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    set({ filteredBudgets: filtered });
  },

  selectBudget: (budget) => {
    set({ selectedBudget: budget });
  },

  calculateSummary: () => {
    const { budgets } = get();
    const now = new Date();
    
    const activeBudgets = budgets.filter(b => {
      const endDate = new Date(b.endDate);
      const startDate = new Date(b.startDate);
      return b.isActive && startDate <= now && endDate >= now;
    });

    const totalBudget = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    // ✅ CORRIGIDO: Usar função auxiliar
    const budgetsExceeded = activeBudgets.filter(b => isBudgetExceeded(b)).length;
    const budgetsNearLimit = activeBudgets.filter(b => {
      const threshold = b.alertThreshold || 80;
      return b.spentPercentage >= threshold && !isBudgetExceeded(b);
    }).length;

    const summary: BudgetSummary = {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      activeBudgetsCount: activeBudgets.length,
      budgetsExceeded,
      budgetsNearLimit,
    };

    set({ summary });
  },

  updateBudgetProgress: (budgetId, spent) => {
    const { budgets } = get();
    const updatedBudgets = budgets.map(b => {
      if (b._id === budgetId) {
        const spentPercentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
        const remaining = Math.max(0, b.amount - spent);
        
        // Atualizar status baseado na porcentagem
        let status: 'safe' | 'warning' | 'critical' | 'exceeded' = 'safe';
        if (spentPercentage >= 100) status = 'exceeded';
        else if (spentPercentage >= (b.alertThreshold || 80)) status = 'critical';
        else if (spentPercentage >= (b.alertThreshold || 80) * 0.8) status = 'warning';
        
        return {
          ...b,
          spent,
          spentPercentage,
          remaining,
          status,
        };
      }
      return b;
    });
    
    set({ budgets: updatedBudgets });
    get().applyFilters();
    get().calculateSummary();
    get().generateAlerts();
  },

  generateAlerts: () => {
    const { budgets } = get();
    const now = new Date();
    const alerts: Alert[] = [];

    budgets.forEach(budget => {
      const endDate = new Date(budget.endDate);
      const startDate = new Date(budget.startDate);
      const isActive = budget.isActive && startDate <= now && endDate >= now;
      
      if (!isActive) return;

      // ✅ CORRIGIDO: Usar função auxiliar
      if (isBudgetExceeded(budget)) {
        alerts.push({
          budgetId: budget._id,
          budgetName: budget.name,
          type: 'exceeded',
          message: `Orçamento "${budget.name}" foi excedido em ${budget.spentPercentage - 100}%`,
          severity: 'high',
        });
      }
      else if (budget.spentPercentage >= (budget.alertThreshold || 80)) {
        alerts.push({
          budgetId: budget._id,
          budgetName: budget.name,
          type: 'near_limit',
          message: `Orçamento "${budget.name}" está ${budget.spentPercentage}% usado`,
          severity: budget.spentPercentage >= 95 ? 'high' : 'medium',
        });
      }

      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        alerts.push({
          budgetId: budget._id,
          budgetName: budget.name,
          type: 'expired',
          message: `Orçamento "${budget.name}" expira em ${daysUntilExpiry} dias`,
          severity: 'medium',
        });
      }
    });

    set({ alerts });
  },

  dismissAlert: (budgetId) => {
    const { alerts } = get();
    const updatedAlerts = alerts.filter(a => a.budgetId !== budgetId);
    set({ alerts: updatedAlerts });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getBudgetsByCategory: (categoryId) => {
    const { filteredBudgets } = get();
    return filteredBudgets.filter(b => b.categoryId === categoryId);
  },

  getBudgetsByStatus: (status) => {
    const { budgets } = get();
    const now = new Date();
    
    return budgets.filter(b => {
      const endDate = new Date(b.endDate);
      const startDate = new Date(b.startDate);
      
      switch (status) {
        case 'active':
          return b.isActive && startDate <= now && endDate >= now;
        case 'expired':
          return endDate < now;
        case 'future':
          return startDate > now;
        default:
          return true;
      }
    });
  },

  getExceededBudgets: () => {
    const { filteredBudgets } = get();
    // ✅ CORRIGIDO: Usar função auxiliar
    return filteredBudgets.filter(b => isBudgetExceeded(b));
  },

  getBudgetsNearLimit: (threshold = 80) => {
    const { filteredBudgets } = get();
    return filteredBudgets.filter(b => 
      b.spentPercentage >= threshold && !isBudgetExceeded(b)
    );
  },

  getBudgetProgress: (budgetId) => {
    const { budgets } = get();
    const budget = budgets.find(b => b._id === budgetId);
    
    if (!budget) return null;

    const now = new Date();
    const endDate = new Date(budget.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      percentage: budget.spentPercentage,
      remaining: budget.remaining,
      isExceeded: isBudgetExceeded(budget), // ✅ CORRIGIDO
      daysRemaining,
    };
  },

  reset: () => {
    set({
      budgets: [],
      filteredBudgets: [],
      selectedBudget: null,
      filters: {},
      summary: null,
      isLoading: false,
      error: null,
      alerts: [],
    });
  },
}));