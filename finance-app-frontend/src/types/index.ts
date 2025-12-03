export interface User {
  id: string;
  name: string;
  email: string;
  theme: 'light' | 'dark';
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isActive: boolean;
}

export interface Transaction {
  id: string;
  categoryId: string;
  budgetId?: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    dayOfMonth?: number;
    isBusinessDay?: boolean;
  };
}

export interface Budget {
  id: string;
  categoryId: string;
  name: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  monthlyTarget: number;
}