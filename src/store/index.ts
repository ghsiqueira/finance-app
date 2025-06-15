import { create } from 'zustand';
import { User } from '../services/auth';

interface AppState {
  // 👤 ESTADO DO USUÁRIO
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 🎨 TEMA
  theme: 'light' | 'dark';

  // 🔄 AÇÕES
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 📊 ESTADO INICIAL
  user: null,
  isAuthenticated: false,
  isLoading: false,
  theme: 'light',

  // 🔄 AÇÕES
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setTheme: (theme) => set({ theme }),
  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
}));

// 💰 STORE PARA DADOS FINANCEIROS
interface FinanceState {
  transactions: any[];
  budgets: any[];
  goals: any[];
  categories: any[];
  
  // Estatísticas
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  
  // Ações
  setTransactions: (transactions: any[]) => void;
  setBudgets: (budgets: any[]) => void;
  setGoals: (goals: any[]) => void;
  setCategories: (categories: any[]) => void;
  updateStats: (stats: { totalBalance: number; monthlyIncome: number; monthlyExpenses: number }) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  // 📊 ESTADO INICIAL
  transactions: [],
  budgets: [],
  goals: [],
  categories: [],
  totalBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,

  // 🔄 AÇÕES
  setTransactions: (transactions) => set({ transactions }),
  setBudgets: (budgets) => set({ budgets }),
  setGoals: (goals) => set({ goals }),
  setCategories: (categories) => set({ categories }),
  updateStats: (stats) => set({
    totalBalance: stats.totalBalance,
    monthlyIncome: stats.monthlyIncome,
    monthlyExpenses: stats.monthlyExpenses,
  }),
}));