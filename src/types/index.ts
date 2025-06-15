// 👤 TIPOS DE USUÁRIO
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
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// 📊 TIPOS DE CATEGORIA
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 💰 TIPOS DE TRANSAÇÃO
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  category?: Category;
  date: string;
  notes?: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 💳 TIPOS DE ORÇAMENTO
export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number; // Mudança aqui: era currentSpent, agora é spent
  categoryId: string;
  category?: Category;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number;
  autoRenew: boolean;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 🎯 TIPOS DE META
export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  categoryId?: string;
  category?: Category;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  reminders: GoalReminder[];
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalReminder {
  id: string;
  date: string;
  message: string;
  sent: boolean;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  notes?: string;
  date: string;
  createdAt: string;
}

// 📈 TIPOS DE ESTATÍSTICAS
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  expensesByCategory: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  incomeVsExpenses: {
    month: string;
    income: number;
    expenses: number;
  }[];
  recentTransactions: Transaction[];
  budgetStatus: {
    budgetId: string;
    budgetName: string;
    amount: number;
    spent: number;
    percentage: number;
    status: 'ok' | 'warning' | 'exceeded';
  }[];
  upcomingGoals: Goal[];
}

// 🔄 TIPOS DE RESPOSTA DA API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 📱 TIPOS DE NAVEGAÇÃO
export type RootStackParamList = {
  // Autenticação
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  
  // Principal
  Main: undefined;
  Dashboard: undefined;
  Transactions: undefined;
  CreateTransaction: { type?: 'income' | 'expense' };
  EditTransaction: { transactionId: string };
  Categories: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
  Budgets: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  Goals: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
  Profile: undefined;
  Settings: undefined;
};

// 📋 TIPOS DE FORMULÁRIO
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TransactionForm {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  date: Date;
  notes?: string;
}

export interface BudgetForm {
  name: string;
  amount: string;
  categoryId: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  alertThreshold: string;
  autoRenew: boolean;
}

export interface GoalForm {
  name: string;
  description?: string;
  targetAmount: string;
  targetDate: Date;
  categoryId?: string;
  priority: 'low' | 'medium' | 'high';
}