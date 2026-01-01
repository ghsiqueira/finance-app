import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import CreditCard from '../models/CreditCard.js';
import Purchase from '../models/Purchase.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';

// Função auxiliar para calcular mês da fatura
const getInvoiceMonth = (purchaseDate: Date, closingDay: number): string => {
  const date = new Date(purchaseDate);
  const day = date.getDate();
  
  // Se compra foi depois do fechamento, vai pra próxima fatura
  if (day > closingDay) {
    date.setMonth(date.getMonth() + 1);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// ✅ CORRIGIDO: Função auxiliar para formatar mês da fatura
const formatInvoiceMonth = (invoiceMonth: string): string => {
  const [year, month] = invoiceMonth.split('-');
  
  // Verificar se split retornou valores válidos
  if (!year || !month) {
    return invoiceMonth; // Fallback: retornar original
  }
  
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const monthIndex = parseInt(month) - 1;
  const shortYear = year.slice(-2);
  return `${monthNames[monthIndex]}/${shortYear}`;
};

// LISTAR TODOS OS CARTÕES
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cards = await CreditCard.find({
      userId: req.userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Para cada cartão, calcular saldo usado
    const cardsWithBalance = await Promise.all(
      cards.map(async (card) => {
        if (!req.userId) {
          return {
            ...card.toObject(),
            used: 0,
            available: card.limit,
            usagePercentage: 0,
          };
        }

        const purchases = await Purchase.find({
          userId: req.userId,
          creditCardId: card._id,
          status: 'pending',
        });

        const used = purchases.reduce((sum, p) => sum + p.amount, 0);
        const available = card.limit - used;

        return {
          ...card.toObject(),
          used,
          available,
          usagePercentage: (used / card.limit) * 100,
        };
      })
    );

    res.json(cardsWithBalance);
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    res.status(500).json({ message: 'Error fetching credit cards' });
  }
};

// BUSCAR UM CARTÃO
export const getById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const card = await CreditCard.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!card) {
      return res.status(404).json({ message: 'Credit card not found' });
    }

    // Calcular saldo
    const purchases = await Purchase.find({
      userId: req.userId,
      creditCardId: card._id,
      status: 'pending',
    });

    const used = purchases.reduce((sum, p) => sum + p.amount, 0);
    const available = card.limit - used;

    res.json({
      ...card.toObject(),
      used,
      available,
      usagePercentage: (used / card.limit) * 100,
    });
  } catch (error) {
    console.error('Error fetching credit card:', error);
    res.status(500).json({ message: 'Error fetching credit card' });
  }
};

// CRIAR CARTÃO
export const create = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const card = new CreditCard({
      ...req.body,
      userId: req.userId,
    });

    await card.save();
    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating credit card:', error);
    res.status(500).json({ message: 'Error creating credit card' });
  }
};

// ATUALIZAR CARTÃO
export const update = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const card = await CreditCard.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ message: 'Credit card not found' });
    }

    res.json(card);
  } catch (error) {
    console.error('Error updating credit card:', error);
    res.status(500).json({ message: 'Error updating credit card' });
  }
};

// DELETAR CARTÃO (soft delete)
export const deleteCard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const card = await CreditCard.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ message: 'Credit card not found' });
    }

    res.json({ message: 'Credit card deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit card:', error);
    res.status(500).json({ message: 'Error deleting credit card' });
  }
};

// ADICIONAR COMPRA NO CARTÃO
export const addPurchase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { creditCardId, description, amount, purchaseDate, categoryId, installments } = req.body;

    // Verificar se cartão existe
    const card = await CreditCard.findOne({
      _id: creditCardId,
      userId: req.userId,
    });

    if (!card) {
      return res.status(404).json({ message: 'Credit card not found' });
    }

    const totalInstallments = installments || 1;
    const installmentAmount = amount / totalInstallments;
    const date = new Date(purchaseDate);

    // Calcular mês base da primeira fatura
    const baseInvoiceMonth = getInvoiceMonth(date, card.closingDay);

    // Criar compra principal
    const mainPurchase = new Purchase({
      userId: req.userId,
      creditCardId,
      description,
      amount: installmentAmount,
      purchaseDate: date,
      categoryId,
      installments: {
        total: totalInstallments,
        current: 1,
      },
      invoiceMonth: baseInvoiceMonth,
    });

    await mainPurchase.save();

    // Se parcelado, criar parcelas futuras
    if (totalInstallments > 1) {
      const futurePurchases = [];
      
      // ✅ CORRIGIDO: Extrair e verificar ano e mês base
      const invoiceParts = baseInvoiceMonth.split('-').map(Number);
      const baseYear = invoiceParts[0];
      const baseMonth = invoiceParts[1];
      
      // Verificar se valores são válidos
      if (!baseYear || !baseMonth) {
        throw new Error('Invalid invoice month format');
      }
      
      for (let i = 2; i <= totalInstallments; i++) {
        // Calcular próximo mês diretamente
        let nextMonth = baseMonth + (i - 1);
        let nextYear = baseYear;
        
        // Ajustar ano se necessário
        while (nextMonth > 12) {
          nextMonth -= 12;
          nextYear += 1;
        }
        
        const nextInvoiceMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
        
        // Data da parcela (para referência visual)
        const futureDate = new Date(date);
        futureDate.setMonth(date.getMonth() + (i - 1));

        const futurePurchase = new Purchase({
          userId: req.userId,
          creditCardId,
          description: `${description} (${i}/${totalInstallments})`,
          amount: installmentAmount,
          purchaseDate: futureDate,
          categoryId,
          installments: {
            total: totalInstallments,
            current: i,
          },
          parentPurchaseId: mainPurchase._id,
          invoiceMonth: nextInvoiceMonth,
        });

        futurePurchases.push(futurePurchase);
      }

      await Purchase.insertMany(futurePurchases);
    }

    await mainPurchase.populate('categoryId');
    res.status(201).json(mainPurchase);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ message: 'Error adding purchase' });
  }
};

// LISTAR COMPRAS DE UM CARTÃO
export const getPurchases = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { invoiceMonth, status } = req.query;
    
    const filter: any = {
      userId: req.userId,
      creditCardId: req.params.id,
    };

    if (invoiceMonth) filter.invoiceMonth = invoiceMonth;
    if (status) filter.status = status;

    const purchases = await Purchase.find(filter)
      .populate('categoryId')
      .sort({ purchaseDate: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Error fetching purchases' });
  }
};

// OBTER FATURAS DO CARTÃO
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const purchases = await Purchase.find({
      userId: req.userId,
      creditCardId: req.params.id,
    } as any);

    // Agrupar por mês
    const invoicesMap = new Map();

    purchases.forEach((purchase) => {
      const month = purchase.invoiceMonth;
      if (!invoicesMap.has(month)) {
        invoicesMap.set(month, {
          month,
          total: 0,
          purchases: [],
          status: 'open',
        });
      }

      const invoice = invoicesMap.get(month);
      invoice.total += purchase.amount;
      invoice.purchases.push(purchase);

      // Se todas as compras estão pagas, fatura está paga
      if (purchase.status === 'paid') {
        const allPaid = invoice.purchases.every((p: any) => p.status === 'paid');
        if (allPaid) invoice.status = 'paid';
      }
    });

    const invoices = Array.from(invoicesMap.values()).sort((a, b) => 
      b.month.localeCompare(a.month)
    );

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

// PAGAR FATURA
export const payInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { invoiceMonth } = req.body;

    const filter: any = {
      userId: req.userId,
      creditCardId: req.params.id,
      invoiceMonth,
      status: 'pending',
    };

    // Buscar todas as compras do mês
    const purchases = await Purchase.find(filter);

    if (purchases.length === 0) {
      return res.status(404).json({ message: 'No pending purchases for this invoice' });
    }

    const total = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Buscar cartão
    const card = await CreditCard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Credit card not found' });
    }

    // Buscar categoria "Fatura" ou "Cartão de Crédito"
    let category = await Category.findOne({
      userId: req.userId,
      name: { $in: ['Fatura', 'Cartão de Crédito', 'Faturas'] },
      type: 'expense',
    });

    // Se não encontrar, criar categoria automaticamente
    if (!category) {
      category = new Category({
        userId: req.userId,
        name: 'Fatura',
        type: 'expense',
        icon: 'card',
        color: '#FF9500',
      });
      await category.save();
    }

    // Formatar descrição com mês abreviado
    const formattedMonth = formatInvoiceMonth(invoiceMonth);
    const description = `Fatura ${card.name} - ${formattedMonth}`;

    // Criar transação de pagamento
    const transaction = new Transaction({
      userId: req.userId,
      description,
      amount: total,
      type: 'expense',
      date: new Date(),
      categoryId: category._id,
    });

    await transaction.save();

    const updateFilter: any = {
      userId: req.userId,
      creditCardId: req.params.id,
      invoiceMonth,
      status: 'pending',
    };

    // Marcar compras como pagas
    await Purchase.updateMany(updateFilter, { status: 'paid' });

    res.json({
      message: 'Invoice paid successfully',
      transaction,
      total,
    });
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ message: 'Error paying invoice' });
  }
};

// DASHBOARD (resumo geral)
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cards = await CreditCard.find({
      userId: req.userId,
      isActive: true,
    });

    let totalLimit = 0;
    let totalUsed = 0;
    const cardsSummary = [];

    for (const card of cards) {
      if (!req.userId) continue;

      const purchases = await Purchase.find({
        userId: req.userId,
        creditCardId: card._id,
        status: 'pending',
      });

      const used = purchases.reduce((sum, p) => sum + p.amount, 0);
      const available = card.limit - used;

      totalLimit += card.limit;
      totalUsed += used;

      cardsSummary.push({
        id: card._id,
        name: card.name,
        brand: card.brand,
        color: card.color,
        limit: card.limit,
        used,
        available,
        usagePercentage: (used / card.limit) * 100,
      });
    }

    const totalAvailable = totalLimit - totalUsed;

    res.json({
      totalLimit,
      totalUsed,
      totalAvailable,
      usagePercentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
      cards: cardsSummary,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
};