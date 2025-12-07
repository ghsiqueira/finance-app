import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { addDays, addWeeks, addMonths, addYears, startOfMonth, endOfMonth, isAfter } from 'date-fns';

export const getRecurringTransactions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🔍 Buscando recorrências para userId:', req.userId);

    const recurringTransactions = await Transaction.find({
      userId: req.userId,
      'recurringConfig.frequency': { $exists: true, $ne: null }
    })
      .populate('categoryId')
      .populate('budgetId')
      .sort({ date: -1 });

    console.log('✅ Retornando', recurringTransactions.length, 'recorrências');
    recurringTransactions.forEach(t => {
      console.log(`  - ${t.description}: isRecurring=${t.isRecurring}, frequency=${t.recurringConfig?.frequency}`);
    });

    res.json(recurringTransactions);
  } catch (error) {
    console.error('Error getting recurring transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const pauseRecurrence = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('⏸️ Tentando pausar recorrência:', id);

    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    });

    if (!transaction) {
      console.log('❌ Recorrência não encontrada');
      return res.status(404).json({ message: 'Recorrência não encontrada' });
    }

    if (!transaction.recurringConfig?.frequency) {
      console.log('❌ Transação não tem recurringConfig válido');
      return res.status(400).json({ message: 'Esta transação não tem recorrência configurada' });
    }

    console.log('📝 Estado ANTES:', { isRecurring: transaction.isRecurring });

    transaction.isRecurring = false;
    transaction.markModified('isRecurring');
    await transaction.save();

    console.log('✅ Estado DEPOIS do save:', { isRecurring: transaction.isRecurring });

    const updated = await Transaction.findById(id)
      .populate('categoryId')
      .populate('budgetId');

    console.log('✅ Estado RECARREGADO:', { isRecurring: updated?.isRecurring });

    res.json(updated);
  } catch (error) {
    console.error('Error pausing recurrence:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resumeRecurrence = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('▶️ Tentando retomar recorrência:', id);

    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    });

    if (!transaction) {
      console.log('❌ Transação não encontrada');
      return res.status(404).json({ message: 'Transação não encontrada' });
    }

    if (!transaction.recurringConfig?.frequency) {
      console.log('❌ Transação não tem recurringConfig válido');
      return res.status(400).json({ message: 'Transação não tem configuração de recorrência' });
    }

    console.log('📝 Estado ANTES:', { isRecurring: transaction.isRecurring });

    transaction.isRecurring = true;
    transaction.markModified('isRecurring');
    await transaction.save();

    console.log('✅ Estado DEPOIS do save:', { isRecurring: transaction.isRecurring });

    const updated = await Transaction.findById(id)
      .populate('categoryId')
      .populate('budgetId');

    console.log('✅ Estado RECARREGADO:', { isRecurring: updated?.isRecurring });

    res.json(updated);
  } catch (error) {
    console.error('Error resuming recurrence:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRecurrence = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('🗑️ Tentando cancelar recorrência:', id);

    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    });

    if (!transaction) {
      console.log('❌ Transação não encontrada');
      return res.status(404).json({ message: 'Transação não encontrada' });
    }

    console.log('📝 Estado ANTES:', { 
      isRecurring: transaction.isRecurring, 
      hasConfig: !!transaction.recurringConfig 
    });

    transaction.isRecurring = false;
    transaction.set('recurringConfig', undefined);
    transaction.markModified('isRecurring');
    await transaction.save();

    console.log('✅ Estado DEPOIS:', { 
      isRecurring: transaction.isRecurring, 
      hasConfig: !!transaction.recurringConfig 
    });

    res.json({ 
      message: 'Recorrência cancelada. A transação foi mantida.',
      transaction 
    });
  } catch (error) {
    console.error('Error deleting recurrence:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateRecurringTransactions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const recurringTransactions = await Transaction.find({
      userId: req.userId,
      isRecurring: true,
      'recurringConfig.frequency': { $exists: true, $ne: null }
    }).populate('categoryId');

    console.log('🔄 Encontradas', recurringTransactions.length, 'recorrências ativas');

    let created = 0;

    for (const template of recurringTransactions) {
      if (!template.recurringConfig?.frequency) {
        continue;
      }

      const { frequency, dayOfMonth } = template.recurringConfig;
      let nextDate = new Date(template.date);

      while (nextDate < monthEnd) {
        switch (frequency) {
          case 'daily':
            nextDate = addDays(nextDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(nextDate, 1);
            break;
          case 'biweekly':
            nextDate = addWeeks(nextDate, 2);
            break;
          case 'monthly':
            nextDate = addMonths(nextDate, 1);
            if (dayOfMonth) {
              const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
              nextDate.setDate(Math.min(dayOfMonth, daysInMonth));
            }
            break;
          case 'yearly':
            nextDate = addYears(nextDate, 1);
            break;
        }

        if (nextDate >= monthStart && nextDate <= monthEnd) {
          const startOfDay = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
          const endOfDay = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() + 1);

          const query: any = {
            userId: req.userId,
            description: template.description,
            amount: template.amount,
            type: template.type,
            date: { $gte: startOfDay, $lt: endOfDay }
          };

          if (template.categoryId) {
            query.categoryId = template.categoryId;
          }

          const exists = await Transaction.findOne(query);

          if (!exists) {
            const newTransaction = new Transaction({
              userId: template.userId,
              categoryId: template.categoryId,
              budgetId: template.budgetId,
              type: template.type,
              amount: template.amount,
              originalAmount: template.originalAmount,
              currency: template.currency,
              description: template.description,
              date: nextDate,
              isRecurring: false, 
            });

            await newTransaction.save();
            created++;
          }
        }
      }
    }

    res.json({ 
      message: created > 0 
        ? `${created} transação(ões) recorrente(s) gerada(s) para este mês`
        : 'Nenhuma transação nova gerada',
      created 
    });
  } catch (error) {
    console.error('Error generating recurring transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addRecurrenceToTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { frequency, dayOfMonth, isBusinessDay } = req.body;

    console.log('➕ Adicionando recorrência à transação:', id);

    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório' });
    }

    if (!frequency) {
      return res.status(400).json({ message: 'Frequência é obrigatória' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    });

    if (!transaction) {
      console.log('❌ Transação não encontrada');
      return res.status(404).json({ message: 'Transação não encontrada' });
    }

    console.log('📝 Estado ANTES:', { 
      isRecurring: transaction.isRecurring, 
      hasConfig: !!transaction.recurringConfig 
    });

    transaction.isRecurring = true;
    transaction.recurringConfig = {
      frequency,
      dayOfMonth: dayOfMonth || undefined,
      isBusinessDay: isBusinessDay || false
    };
    transaction.markModified('isRecurring');
    transaction.markModified('recurringConfig');
    await transaction.save();

    console.log('✅ Estado DEPOIS:', { 
      isRecurring: transaction.isRecurring, 
      config: transaction.recurringConfig 
    });

    const updated = await Transaction.findById(id)
      .populate('categoryId')
      .populate('budgetId');

    res.json(updated);
  } catch (error) {
    console.error('Error adding recurrence to transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const editRecurrence = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { frequency, dayOfMonth, isBusinessDay } = req.body;

    console.log('✏️ Editando recorrência:', id);

    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório' });
    }

    if (!frequency) {
      return res.status(400).json({ message: 'Frequência é obrigatória' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId
    });

    if (!transaction) {
      console.log('❌ Transação não encontrada');
      return res.status(404).json({ message: 'Transação não encontrada' });
    }

    if (!transaction.recurringConfig?.frequency) {
      console.log('❌ Transação não tem recurringConfig válido');
      return res.status(400).json({ message: 'Esta transação não é recorrente' });
    }

    console.log('📝 Config ANTES:', transaction.recurringConfig);

    transaction.recurringConfig = {
      frequency,
      dayOfMonth: dayOfMonth || undefined,
      isBusinessDay: isBusinessDay || false
    };
    transaction.markModified('recurringConfig');
    await transaction.save();

    console.log('✅ Config DEPOIS:', transaction.recurringConfig);

    const updated = await Transaction.findById(id)
      .populate('categoryId')
      .populate('budgetId');

    res.json(updated);
  } catch (error) {
    console.error('Error editing recurrence:', error);
    res.status(500).json({ message: 'Server error' });
  }
};