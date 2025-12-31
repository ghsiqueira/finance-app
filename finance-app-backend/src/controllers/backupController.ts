import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';

// EXPORTAR DADOS
export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('📦 Exportando dados do usuário:', req.userId);

    // Buscar todos os dados do usuário
    const [user, transactions, categories, budgets, goals] = await Promise.all([
      User.findById(req.userId).select('name email'),
      Transaction.find({ userId: req.userId }),
      Category.find({ userId: req.userId }),
      Budget.find({ userId: req.userId }),
      Goal.find({ userId: req.userId }),
    ]);

    // Montar objeto de backup
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        name: user?.name,
        email: user?.email,
      },
      data: {
        transactions,
        categories,
        budgets,
        goals,
      },
      stats: {
        transactions: transactions.length,
        categories: categories.length,
        budgets: budgets.length,
        goals: goals.length,
      }
    };

    console.log('✅ Backup criado:', backup.stats);
    res.json(backup);

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    res.status(500).json({ message: 'Erro ao exportar dados' });
  }
};

// IMPORTAR DADOS
export const importData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { data, clearExisting } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Dados de backup não fornecidos' });
    }

    console.log('📥 Importando dados para usuário:', req.userId);

    // Se clearExisting = true, deleta tudo antes
    if (clearExisting) {
      console.log('🗑️  Limpando dados existentes...');
      await Promise.all([
        Transaction.deleteMany({ userId: req.userId }),
        Category.deleteMany({ userId: req.userId }),
        Budget.deleteMany({ userId: req.userId }),
        Goal.deleteMany({ userId: req.userId }),
      ]);
    }

    let stats = {
      transactions: 0,
      categories: 0,
      budgets: 0,
      goals: 0,
    };

    // Importar categorias
    if (data.categories && data.categories.length > 0) {
      const categories = data.categories.map((cat: any) => ({
        ...cat,
        userId: req.userId,
        _id: undefined, // Remove _id antigo
      }));
      await Category.insertMany(categories);
      stats.categories = categories.length;
    }

    // Importar transações
    if (data.transactions && data.transactions.length > 0) {
      const transactions = data.transactions.map((txn: any) => ({
        ...txn,
        userId: req.userId,
        _id: undefined,
      }));
      await Transaction.insertMany(transactions);
      stats.transactions = transactions.length;
    }

    // Importar orçamentos
    if (data.budgets && data.budgets.length > 0) {
      const budgets = data.budgets.map((budget: any) => ({
        ...budget,
        userId: req.userId,
        _id: undefined,
      }));
      await Budget.insertMany(budgets);
      stats.budgets = budgets.length;
    }

    // Importar metas
    if (data.goals && data.goals.length > 0) {
      const goals = data.goals.map((goal: any) => ({
        ...goal,
        userId: req.userId,
        _id: undefined,
      }));
      await Goal.insertMany(goals);
      stats.goals = goals.length;
    }

    console.log('✅ Dados importados:', stats);
    res.json({ 
      message: 'Dados importados com sucesso!',
      stats 
    });

  } catch (error) {
    console.error('❌ Erro ao importar dados:', error);
    res.status(500).json({ message: 'Erro ao importar dados' });
  }
};