import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Bill from '../models/Bill.js';
import Transaction from '../models/Transaction.js';

const calculateNextDueDate = (currentDate: Date, frequency: string, isBusinessDay: boolean): Date => {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'bimonthly':
      nextDate.setMonth(nextDate.getMonth() + 2);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semiannual':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  if (isBusinessDay) {
    const dayOfWeek = nextDate.getDay();
    if (dayOfWeek === 0) { 
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (dayOfWeek === 6) { 
      nextDate.setDate(nextDate.getDate() + 2);
    }
  }

  return nextDate;
};

export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { status, type } = req.query;
    
    const filter: any = { userId: req.userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const bills = await Bill.find(filter)
      .populate('categoryId')
      .sort({ dueDate: 1 });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Error fetching bills' });
  }
};

export const getById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('categoryId');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Error fetching bill' });
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bill = new Bill({
      ...req.body,
      userId: req.userId,
      status: 'pending',
    });

    await bill.save();
    await bill.populate('categoryId');

    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill' });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    ).populate('categoryId');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ message: 'Error updating bill' });
  }
};

export const deleteBill = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bill = await Bill.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Error deleting bill' });
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({ message: 'Bill already paid' });
    }

    const transaction = new Transaction({
      userId: req.userId,
      description: bill.name,
      amount: bill.amount,
      type: bill.type === 'pay' ? 'expense' : 'income',
      date: new Date(),
      categoryId: bill.categoryId,
    });

    await transaction.save();

    bill.status = 'paid';
    bill.paidAt = new Date();
    bill.transactionId = transaction._id as any;
    await bill.save();

    if (bill.recurrence?.enabled && bill.recurrence.frequency) {
      const nextDueDate = calculateNextDueDate(
        bill.dueDate,
        bill.recurrence.frequency,
        bill.recurrence.isBusinessDay || false
      );

      const nextBill = new Bill({
        userId: bill.userId,
        name: bill.name,
        description: bill.description,
        amount: bill.amount,
        dueDate: nextDueDate,
        categoryId: bill.categoryId,
        type: bill.type,
        status: 'pending',
        recurrence: bill.recurrence,
      });

      await nextBill.save();
    }

    await bill.populate('categoryId');
    res.json({ bill, transaction });
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    res.status(500).json({ message: 'Error marking bill as paid' });
  }
};

export const getUpcoming = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const bills = await Bill.find({
      userId: req.userId,
      status: 'pending',
      dueDate: {
        $gte: today,
        $lte: nextWeek,
      },
    })
      .populate('categoryId')
      .sort({ dueDate: 1 });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching upcoming bills:', error);
    res.status(500).json({ message: 'Error fetching upcoming bills' });
  }
};

export const getOverdue = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Bill.updateMany(
      {
        userId: req.userId,
        status: 'pending',
        dueDate: { $lt: today },
      },
      { status: 'overdue' }
    );

    const bills = await Bill.find({
      userId: req.userId,
      status: 'overdue',
    })
      .populate('categoryId')
      .sort({ dueDate: 1 });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching overdue bills:', error);
    res.status(500).json({ message: 'Error fetching overdue bills' });
  }
};