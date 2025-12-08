import type { Response } from 'express';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import type { AuthRequest } from '../middleware/auth.js';
import { checkAllAchievements } from './achievementController.js';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { 
      categoryId, 
      budgetId, 
      type, 
      amount, 
      originalAmount,
      currency,
      description, 
      date, 
      isRecurring, 
      recurringConfig, 
      location,
      receipt 
    } = req.body;
    
    console.log('📝 Criando transação:', { description, isRecurring, recurringConfig });
    
    if (!amount || !description || !type) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: amount, description, type' 
      });
    }

    if (!['income', 'expense', 'transfer'].includes(type)) {
      return res.status(400).json({ 
        message: 'Type deve ser "income", "expense" ou "transfer"' 
      });
    }

    if (categoryId) {
      const category = await Category.findOne({ 
        _id: categoryId, 
        userId: req.userId 
      });

      if (!category) {
        return res.status(404).json({ 
          message: 'Categoria não encontrada' 
        });
      }
    }

    if (budgetId) {
      const budget = await Budget.findOne({ 
        _id: budgetId, 
        userId: req.userId 
      });

      if (!budget) {
        return res.status(404).json({ 
          message: 'Orçamento não encontrado' 
        });
      }

      if (categoryId && budget.categoryId.toString() !== categoryId.toString()) {
        return res.status(400).json({ 
          message: 'Orçamento não corresponde à categoria selecionada' 
        });
      }
    }
    
    const transactionData: any = {
      userId: req.userId,
      type,
      amount,
      originalAmount: originalAmount || amount,
      currency: currency || 'BRL',
      description,
      date: date || new Date(),
      isRecurring: isRecurring || false,
      location,
      receipt
    };

    if (categoryId) {
      transactionData.categoryId = categoryId;
    }

    if (budgetId) {
      transactionData.budgetId = budgetId;
    }

    if (recurringConfig && recurringConfig.frequency) {
      transactionData.recurringConfig = recurringConfig;
      console.log('✅ Salvando com recurringConfig:', recurringConfig);
    }

    const transaction = new Transaction(transactionData);
    await transaction.save();

    try {
      await checkAllAchievements(req.userId);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }

    console.log('✅ Transação salva:', { 
      id: transaction._id, 
      isRecurring: transaction.isRecurring,
      hasConfig: !!transaction.recurringConfig 
    });

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('categoryId')
      .populate('budgetId');
    
    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { 
      startDate, 
      endDate, 
      type, 
      categoryId,
      categories, 
      minAmount,
      maxAmount,
      search, 
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query: any = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (type) {
      query.type = type;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (categories) {
      const categoryArray = Array.isArray(categories) 
        ? categories 
        : (categories as string).split(',');
      query.categoryId = { $in: categoryArray };
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount as string);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount as string);
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const transactions = await Transaction.find(query)
      .populate('categoryId')
      .sort(sortOptions);

    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    })
      .populate('categoryId')
      .populate('budgetId');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const {
      amount,
      originalAmount,
      currency,
      description,
      date,
      type,
      categoryId,
      budgetId,
      recurringConfig,
      location,
      receipt
    } = req.body;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (categoryId) {
      const category = await Category.findOne({ 
        _id: categoryId, 
        userId: req.userId 
      });

      if (!category) {
        return res.status(404).json({ 
          message: 'Categoria não encontrada' 
        });
      }
    }

    if (budgetId) {
      const budget = await Budget.findOne({ 
        _id: budgetId, 
        userId: req.userId 
      });

      if (!budget) {
        return res.status(404).json({ 
          message: 'Orçamento não encontrado' 
        });
      }

      const catId = categoryId || transaction.categoryId;
      if (budget.categoryId.toString() !== catId.toString()) {
        return res.status(400).json({ 
          message: 'Orçamento não corresponde à categoria selecionada' 
        });
      }
    }

    if (amount !== undefined) transaction.amount = amount;
    if (originalAmount !== undefined) transaction.originalAmount = originalAmount;
    if (currency !== undefined) transaction.currency = currency;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (type !== undefined) transaction.type = type;
    if (categoryId !== undefined) transaction.categoryId = categoryId;
    if (budgetId !== undefined) transaction.budgetId = budgetId;
    if (location !== undefined) transaction.location = location;
    if (receipt !== undefined) transaction.receipt = receipt;

    if (recurringConfig) {
      transaction.recurringConfig = recurringConfig;
      transaction.isRecurring = !!recurringConfig.frequency;
    }

    await transaction.save();

    await transaction.populate('categoryId');
    if (transaction.budgetId) {
      await transaction.populate('budgetId');
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const allTransactions = await Transaction.find({ userId });
    const monthlyTransactions = await Transaction.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let balance = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    allTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
      } else if (t.type === 'expense') {
        balance -= t.amount;
      }
    });

    monthlyTransactions.forEach(t => {
      if (t.type === 'income') {
        monthlyIncome += t.amount;
      } else if (t.type === 'expense') {
        monthlyExpenses += t.amount;
      }
    });

    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('categoryId');

    res.json({
      balance,
      monthlyIncome,
      monthlyExpenses,
      recentTransactions
    });
  } catch (error) {
    console.error('Error in getDashboard:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.userId;
    const { period, category } = req.query;

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (period) {
      case 'last3':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last6':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const query: any = {
      userId,
      date: { $gte: startDate, $lte: endDate }
    };

    if (category) {
      const categoryDoc = await Category.findOne({ userId, name: category });
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      }
    }

    const transactions = await Transaction.find(query).populate('categoryId');

    const expensesByCategory: { [key: string]: { name: string, amount: number, color: string } } = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
        const cat = transaction.categoryId as any;
        const categoryName = cat?.name || 'Sem Categoria';
        const categoryColor = cat?.color || '#999999';
        
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = {
            name: categoryName,
            amount: 0,
            color: categoryColor
          };
        }
        expensesByCategory[categoryName].amount += transaction.amount;
      }
    });

    const expensesByCategoryArray = Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount);

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthQuery: any = {
        userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      };

      if (category) {
        const categoryDoc = await Category.findOne({ userId, name: category });
        if (categoryDoc) {
          monthQuery.categoryId = categoryDoc._id;
        }
      }

      const monthTransactions = await Transaction.find(monthQuery);

      let income = 0;
      let expenses = 0;

      monthTransactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expenses += t.amount;
      });

      last6Months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        income,
        expenses,
        balance: income - expenses
      });
    }

    res.json({
      currentMonth: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses
      },
      expensesByCategory: expensesByCategoryArray,
      last6Months
    });
  } catch (error) {
    console.error('Error in getReports:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};