import type { Response } from 'express';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import type { AuthRequest } from '../middleware/auth.js';
import { checkAllAchievements } from './achievementController.js';

const getNextRenewalDate = (renewalDay: number, currentDate: Date = new Date()): Date => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(renewalDay, lastDayOfMonth);
  
  let nextRenewal = new Date(year, month, actualDay);
  
  if (currentDate.getDate() >= actualDay) {
    const nextMonth = month + 1;
    const nextMonthLastDay = new Date(year, nextMonth + 1, 0).getDate();
    const nextActualDay = Math.min(renewalDay, nextMonthLastDay);
    nextRenewal = new Date(year, nextMonth, nextActualDay);
  }
  
  return nextRenewal;
};

const getDaysUntilRenewal = (renewalDay: number, currentDate: Date = new Date()): number => {
  const nextRenewal = getNextRenewalDate(renewalDay, currentDate);
  const diffTime = nextRenewal.getTime() - currentDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const createBudget = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { categoryId, name, amount, period, rollover, endDate, renewalDay } = req.body;
    
    const existingBudget = await Budget.findOne({
      userId: req.userId,
      categoryId
    });

    if (existingBudget) {
      return res.status(400).json({ message: 'Já existe um orçamento para esta categoria' });
    }

    const budget = new Budget({
      userId: req.userId,
      categoryId,
      name,
      amount,
      period: period || 'monthly',
      rollover: rollover || false,
      startDate: new Date(),
      endDate: endDate || undefined,
      renewalDay: renewalDay || 1
    });

    await budget.save();
    try {
      await checkAllAchievements(req.userId);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }

    const populatedBudget = await Budget.findById(budget._id).populate('categoryId')
    
    res.status(201).json(populatedBudget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.userId;

    const budgets = await Budget.find({ userId })
      .populate('categoryId')
      .sort({ createdAt: -1 });

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const transactions = await Transaction.find({
          userId,
          budgetId: budget._id.toString(),
          type: 'expense',
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        });

        const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;

        const renewalDay = budget.renewalDay || 1;
        const nextRenewal = getNextRenewalDate(renewalDay, now);
        const daysUntilRenewal = getDaysUntilRenewal(renewalDay, now);
        const dailyAverage = daysUntilRenewal > 0 ? remaining / daysUntilRenewal : 0;
        
        return {
          ...budget.toObject(),
          spent,
          remaining,
          percentage,
          daysUntilRenewal,
          dailyAverage: dailyAverage > 0 ? dailyAverage : 0,
          nextRenewal
        };
      })
    );
    
    res.json(budgetsWithSpent);
  } catch (error) {
    console.error('Error in getBudgets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBudget = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.userId;
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Budget ID is required' });
    }

    const budget = await Budget.findOne({
      _id: id,
      userId
    }).populate('categoryId');
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId,
      budgetId: budget._id.toString(),
      type: 'expense',
      date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
    });

    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      ...budget.toObject(),
      spent,
      remaining: budget.amount - spent,
      percentage: (spent / budget.amount) * 100
    });
  } catch (error) {
    console.error('Error in getBudget:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBudget = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Budget ID is required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true }
    ).populate('categoryId');
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Budget ID is required' });
    }

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};