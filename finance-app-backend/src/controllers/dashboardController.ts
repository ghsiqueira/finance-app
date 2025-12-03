import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    console.log('\n=== DASHBOARD SUMMARY REQUEST ===');
    console.log('User ID:', req.userId);
    console.log('Current Month:', startOfMonth, 'to', endOfMonth);

    const currentMonthTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('categoryId');

    console.log('Total transactions this month:', currentMonthTransactions.length);

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = currentIncome - currentExpenses;

    console.log('Current Income:', currentIncome);
    console.log('Current Expenses:', currentExpenses);
    console.log('Current Balance:', currentBalance);

    const lastMonthTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expensesChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;
    const balanceChange = (lastIncome - lastExpenses) > 0 
      ? ((currentBalance - (lastIncome - lastExpenses)) / (lastIncome - lastExpenses)) * 100 
      : 0;

    console.log('\n=== TOP CATEGORIES CALCULATION ===');
    
    const expenseTransactions = currentMonthTransactions.filter(t => {
      const hasCategory = t.type === 'expense' && t.categoryId;
      if (t.type === 'expense' && !t.categoryId) {
        console.log('Transaction without category:', {
          id: t._id,
          description: t.description,
          amount: t.amount
        });
      }
      return hasCategory;
    });

    console.log('Expense transactions with category:', expenseTransactions.length);

    const categoryMap = new Map();

    for (const transaction of expenseTransactions) {
      const category = transaction.categoryId as any;
      const catId = category?._id?.toString() || category?.toString();
      
      if (!catId) {
        console.log('Transaction with invalid categoryId:', transaction._id);
        continue;
      }

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          category: category,
          total: 0,
          count: 0
        });
      }
      
      const cat = categoryMap.get(catId);
      cat.total += transaction.amount;
      cat.count += 1;
    }

    console.log('Unique categories found:', categoryMap.size);

    const allCategoriesSorted = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total);

    const expensesByCategory = allCategoriesSorted.slice(0, 5);

    console.log('Top categories (sorted):', expensesByCategory.map(c => ({
      name: c.category?.name,
      total: c.total
    })));

    const topCategories = expensesByCategory.map(item => {
      const category = item.category;
      return {
        categoryId: item.categoryId,
        name: category?.name || 'Sem Categoria',
        icon: category?.icon || 'help-circle',
        color: category?.color || '#999999',
        total: item.total,
        count: item.count,
        percentage: currentExpenses > 0 ? (item.total / currentExpenses) * 100 : 0
      };
    });

    const allCategories = allCategoriesSorted.map(item => {
      const category = item.category;
      return {
        categoryId: item.categoryId,
        name: category?.name || 'Sem Categoria',
        icon: category?.icon || 'help-circle',
        color: category?.color || '#999999',
        total: item.total,
        count: item.count,
        percentage: currentExpenses > 0 ? (item.total / currentExpenses) * 100 : 0
      };
    });

    console.log('Final top categories:', topCategories.length);
    console.log('All categories:', allCategories.length);

    console.log('\n=== BUDGET ALERTS ===');
    const budgets = await Budget.find({ userId: req.userId }).populate('categoryId');
    console.log('Total budgets:', budgets.length);
    
    const budgetAlerts = [];

    for (const budget of budgets) {
      const categoryId = typeof budget.categoryId === 'object' && budget.categoryId !== null
        ? (budget.categoryId as any)._id
        : budget.categoryId;

      const spent = currentMonthTransactions
        .filter(t => t.type === 'expense' && t.categoryId?.toString() === categoryId?.toString())
        .reduce((sum, t) => sum + t.amount, 0);

      const budgetLimit = (budget as any).monthlyLimit || 0;
      const percentage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

      if (percentage >= 80) {
        budgetAlerts.push({
          budgetId: budget._id,
          categoryName: (budget.categoryId as any)?.name || 'Categoria',
          categoryIcon: (budget.categoryId as any)?.icon || 'warning',
          categoryColor: (budget.categoryId as any)?.color || '#FF6B6B',
          limit: budgetLimit,
          spent: spent,
          percentage: percentage,
          remaining: budgetLimit - spent,
          severity: percentage >= 100 ? 'critical' : percentage >= 90 ? 'high' : 'medium'
        });
      }
    }

    console.log('Budget alerts:', budgetAlerts.length);

    console.log('\n=== GOALS PROGRESS ===');
    const goals = await Goal.find({
      $or: [
        { userId: req.userId },
        { 'members.userId': req.userId }
      ],
      isCompleted: false
    }).populate('categoryId').sort({ deadline: 1 }).limit(5);

    console.log('Active goals:', goals.length);

    const goalsProgress = goals.map(goal => {
      const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = goal.targetAmount - goal.currentAmount;
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        goalId: goal._id,
        name: goal.name,
        categoryIcon: (goal.categoryId as any)?.icon || 'flag',
        categoryColor: (goal.categoryId as any)?.color || '#4ECDC4',
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        percentage: percentage,
        remaining: remaining,
        deadline: goal.deadline,
        daysLeft: daysLeft,
        isShared: goal.isShared,
        membersCount: goal.members?.length || 0
      };
    });

    const user = await User.findById(req.userId);
    const userEmail = user?.email?.toLowerCase() || '';

    const goalInvites = await Goal.find({
      'invites.email': userEmail,
      'invites.status': 'pending'
    });

    const pendingInvitesCount = goalInvites.length;
    console.log('Pending invites:', pendingInvitesCount);

    const recentTransactions = await Transaction.find({ userId: req.userId })
      .populate('categoryId')
      .sort({ date: -1 })
      .limit(5);

    console.log('Recent transactions:', recentTransactions.length);

    const summary = {
      monthSummary: {
        month: now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentBalance,
        incomeChange: Math.round(incomeChange * 10) / 10,
        expensesChange: Math.round(expensesChange * 10) / 10,
        balanceChange: Math.round(balanceChange * 10) / 10
      },
      topCategories,
      allCategories, 
      budgetAlerts,
      goalsProgress,
      pendingInvitesCount,
      recentTransactions,
      stats: {
        totalTransactions: currentMonthTransactions.length,
        averageExpense: currentMonthTransactions.filter(t => t.type === 'expense').length > 0
          ? currentExpenses / currentMonthTransactions.filter(t => t.type === 'expense').length
          : 0,
        activeGoals: goals.length,
        activeBudgets: budgets.length
      }
    };

    console.log('\n=== RESPONSE SUMMARY ===');
    console.log('Top Categories Count:', topCategories.length);
    console.log('All Categories Count:', allCategories.length);
    console.log('Budget Alerts Count:', budgetAlerts.length);
    console.log('Goals Progress Count:', goalsProgress.length);
    console.log('Recent Transactions Count:', recentTransactions.length);
    console.log('===========================\n');

    res.json(summary);
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};