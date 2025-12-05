import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Budget from '../models/Budget.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const getInsights = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      currentMonthTransactions,
      lastMonthTransactions,
      activeGoals,
      activeBudgets,
    ] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd }
      }).populate('categoryId'),
      Transaction.find({
        userId: req.userId,
        date: { $gte: lastMonthStart, $lte: lastMonthEnd }
      }).populate('categoryId'),
      Goal.find({
        $or: [
          { userId: req.userId },
          { 'members.userId': req.userId }
        ],
        isCompleted: false,
        deadline: { $gte: now }
      }),
      Budget.find({
        userId: req.userId,
        month: format(now, 'yyyy-MM')
      }).populate('categoryId')
    ]);

    const insights: any[] = [];

    // Calcula receitas e despesas do mês atual
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = currentIncome - currentExpenses;

    const lastExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 🔴 INSIGHT 1: SALDO NEGATIVO
    if (currentBalance < 0) {
      insights.push({
        type: 'error',
        icon: '🚨',
        title: 'Atenção: Saldo negativo!',
        description: `Você gastou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(currentBalance))} a mais do que recebeu este mês`,
        color: '#FF3B30'
      });
    }

    // 🟡 INSIGHT 2: GASTANDO MAIS QUE GANHA
    if (currentIncome > 0 && currentExpenses > currentIncome * 0.9) {
      const percentage = ((currentExpenses / currentIncome) * 100).toFixed(0);
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Gastos muito altos',
        description: `Você está gastando ${percentage}% da sua renda. Tente economizar mais!`,
        color: '#FF9500'
      });
    }

    // 💰 INSIGHT 3: ECONOMIZANDO BEM
    if (currentIncome > 0 && currentBalance > currentIncome * 0.2) {
      const savedPercentage = ((currentBalance / currentIncome) * 100).toFixed(0);
      insights.push({
        type: 'success',
        icon: '💰',
        title: 'Excelente economia!',
        description: `Você economizou ${savedPercentage}% da sua renda este mês (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBalance)})`,
        color: '#34C759'
      });
    }

    // 📈 INSIGHT 4: COMPARAÇÃO COM MÊS ANTERIOR
    if (lastExpenses > 0) {
      const percentageChange = ((currentExpenses - lastExpenses) / lastExpenses) * 100;
      
      if (percentageChange > 15) {
        insights.push({
          type: 'warning',
          icon: '📈',
          title: 'Gastos aumentaram',
          description: `Você gastou ${percentageChange.toFixed(0)}% a mais que o mês passado (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentExpenses - lastExpenses)})`,
          color: '#FF3B30'
        });
      } else if (percentageChange < -15) {
        insights.push({
          type: 'success',
          icon: '✅',
          title: 'Reduzindo gastos!',
          description: `Você economizou ${Math.abs(percentageChange).toFixed(0)}% comparado ao mês passado (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(currentExpenses - lastExpenses))})`,
          color: '#34C759'
        });
      }
    }

    // 📊 INSIGHT 5: CATEGORIA COM MAIOR CRESCIMENTO
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.categoryId)
      .reduce((acc: any, t: any) => {
        const categoryName = t.categoryId.name;
        if (!acc[categoryName]) {
          acc[categoryName] = { current: 0, last: 0 };
        }
        acc[categoryName].current += t.amount;
        return acc;
      }, {});

    lastMonthTransactions
      .filter(t => t.type === 'expense' && t.categoryId)
      .forEach((t: any) => {
        const categoryName = t.categoryId.name;
        if (!categoryExpenses[categoryName]) {
          categoryExpenses[categoryName] = { current: 0, last: 0 };
        }
        categoryExpenses[categoryName].last += t.amount;
      });

    let maxIncrease = { category: '', percentage: 0, amount: 0 };
    let maxDecrease = { category: '', percentage: 0, amount: 0 };

    Object.keys(categoryExpenses).forEach(category => {
      const current = categoryExpenses[category].current;
      const last = categoryExpenses[category].last;
      
      if (last > 0) {
        const percentage = ((current - last) / last) * 100;
        if (percentage > maxIncrease.percentage && percentage > 20) {
          maxIncrease = { category, percentage, amount: current - last };
        }
        if (percentage < maxDecrease.percentage && percentage < -20) {
          maxDecrease = { category, percentage: Math.abs(percentage), amount: Math.abs(current - last) };
        }
      }
    });

    if (maxIncrease.category) {
      insights.push({
        type: 'info',
        icon: '📊',
        title: `${maxIncrease.category} em alta`,
        description: `Gastos com ${maxIncrease.category} subiram ${maxIncrease.percentage.toFixed(0)}% (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maxIncrease.amount)})`,
        color: '#FF9500'
      });
    }

    if (maxDecrease.category) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: `Economizou em ${maxDecrease.category}`,
        description: `Reduziu ${maxDecrease.percentage.toFixed(0)}% os gastos com ${maxDecrease.category} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maxDecrease.amount)})`,
        color: '#34C759'
      });
    }

    // 🎯 INSIGHT 6: PROGRESSO DAS METAS
    for (const goal of activeGoals) {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      
      if (percentage >= 90 && percentage < 100) {
        insights.push({
          type: 'success',
          icon: '🎯',
          title: 'Quase lá!',
          description: `Faltam apenas ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)} para a meta "${goal.name}"`,
          color: '#34C759'
        });
      } else if (percentage >= 50 && percentage < 75) {
        insights.push({
          type: 'info',
          icon: '🎯',
          title: 'Meta no caminho',
          description: `Você já atingiu ${percentage.toFixed(0)}% da meta "${goal.name}"`,
          color: '#007AFF'
        });
      }
    }

    // 💼 INSIGHT 7: ORÇAMENTOS
    for (const budget of activeBudgets) {
      const budgetCategory = budget.categoryId as any;
      const categoryIdStr = budgetCategory._id.toString();
      
      const transactions = currentMonthTransactions.filter(
        t => t.type === 'expense' && t.categoryId && (t.categoryId as any)._id.toString() === categoryIdStr
      );
      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const percentage = (spent / budget.amount) * 100;

      if (percentage > 90 && percentage < 100) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Orçamento quase estourado',
          description: `${percentage.toFixed(0)}% do orçamento de ${budgetCategory.name} já usado`,
          color: '#FF9500'
        });
      } else if (percentage >= 100) {
        insights.push({
          type: 'error',
          icon: '🚨',
          title: 'Orçamento estourado!',
          description: `Você gastou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent - budget.amount)} a mais em ${budgetCategory.name}`,
          color: '#FF3B30'
        });
      }
    }

    // 👍 INSIGHT 8: MENSAGEM POSITIVA (só se não tiver nenhum alerta)
    if (insights.length === 0) {
      if (currentExpenses === 0 && currentIncome === 0) {
        insights.push({
          type: 'info',
          icon: '📝',
          title: 'Comece a registrar!',
          description: 'Adicione suas transações para receber insights personalizados sobre suas finanças',
          color: '#007AFF'
        });
      } else {
        insights.push({
          type: 'info',
          icon: '👍',
          title: 'Tudo sob controle!',
          description: 'Suas finanças estão equilibradas. Continue assim!',
          color: '#007AFF'
        });
      }
    }

    res.json({ insights });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
};