import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Achievement from '../models/Achievement.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import { ACHIEVEMENTS, getAchievementById } from '../utils/achievementDefinitions.js';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export const getUserAchievements = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userAchievements = await Achievement.find({ userId: req.userId });
    
    const achievements = ACHIEVEMENTS.map(def => {
      const userAch = userAchievements.find(a => a.achievementId === def.id);
      return {
        ...def,
        unlocked: !!userAch,
        unlockedAt: userAch?.unlockedAt,
        seen: userAch?.seen ?? true
      };
    });

    const stats = {
      total: ACHIEVEMENTS.length,
      unlocked: userAchievements.length,
      percentage: Math.round((userAchievements.length / ACHIEVEMENTS.length) * 100),
      unseen: userAchievements.filter(a => !a.seen).length
    };

    res.json({ achievements, stats });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkAndUnlockAchievements = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🎯 === VERIFICANDO CONQUISTAS PARA USER:', req.userId, '===');
    
    const newlyUnlocked = await checkAllAchievements(req.userId);
    
    console.log('📊 Conquistas desbloqueadas:', newlyUnlocked.length);
    console.log('🏆 Detalhes:', JSON.stringify(newlyUnlocked, null, 2));

    res.json({ 
      newAchievements: newlyUnlocked,
      count: newlyUnlocked.length 
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAchievementAsSeen = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { achievementId } = req.params;

    if (!achievementId) {
      return res.status(400).json({ message: 'Achievement ID is required' });
    }

    await Achievement.findOneAndUpdate(
      { userId: req.userId, achievementId: achievementId },
      { seen: true }
    );

    res.json({ message: 'Achievement marked as seen' });
  } catch (error) {
    console.error('Error marking achievement as seen:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function checkAllAchievements(userId: string): Promise<any[]> {
  const newAchievements: any[] = [];

  const unlockedAchievements = await Achievement.find({ userId });
  const unlockedIds = unlockedAchievements.map(a => a.achievementId);

  // TRANSAÇÕES
  const transactionCount = await Transaction.countDocuments({ userId });
  
  for (const ach of ACHIEVEMENTS.filter(a => a.category === 'transactions')) {
    if (!unlockedIds.includes(ach.id) && transactionCount >= ach.requirement) {
      const newAch = await unlockAchievement(userId, ach.id);
      if (newAch) newAchievements.push({ ...ach, ...newAch });
    }
  }

  // ECONOMIA
  const allTransactions = await Transaction.find({ userId });
  let totalBalance = 0;
  allTransactions.forEach(t => {
    if (t.type === 'income') totalBalance += t.amount;
    else if (t.type === 'expense') totalBalance -= t.amount;
  });

  for (const ach of ACHIEVEMENTS.filter(a => a.category === 'savings')) {
    if (!unlockedIds.includes(ach.id) && totalBalance >= ach.requirement) {
      const newAch = await unlockAchievement(userId, ach.id);
      if (newAch) newAchievements.push({ ...ach, ...newAch });
    }
  }

  // ORÇAMENTOS
  const budgetCount = await Budget.countDocuments({ userId });
  
  for (const ach of ACHIEVEMENTS.filter(a => a.category === 'budgets' && a.id !== 'budget_respected')) {
    if (!unlockedIds.includes(ach.id) && budgetCount >= ach.requirement) {
      const newAch = await unlockAchievement(userId, ach.id);
      if (newAch) newAchievements.push({ ...ach, ...newAch });
    }
  }

  // METAS
  const goalCount = await Goal.countDocuments({ userId });
  const completedGoals = await Goal.countDocuments({ userId, status: 'completed' });

  if (!unlockedIds.includes('first_goal') && goalCount >= 1) {
    const newAch = await unlockAchievement(userId, 'first_goal');
    if (newAch) newAchievements.push({ ...getAchievementById('first_goal'), ...newAch });
  }

  if (!unlockedIds.includes('goal_completed') && completedGoals >= 1) {
    const newAch = await unlockAchievement(userId, 'goal_completed');
    if (newAch) newAchievements.push({ ...getAchievementById('goal_completed'), ...newAch });
  }

  if (!unlockedIds.includes('goals_3_completed') && completedGoals >= 3) {
    const newAch = await unlockAchievement(userId, 'goals_3_completed');
    if (newAch) newAchievements.push({ ...getAchievementById('goals_3_completed'), ...newAch });
  }

  // MÊS POSITIVO
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTransactions = await Transaction.find({
    userId,
    date: { $gte: monthStart, $lte: monthEnd }
  });

  let monthBalance = 0;
  monthTransactions.forEach(t => {
    if (t.type === 'income') monthBalance += t.amount;
    else if (t.type === 'expense') monthBalance -= t.amount;
  });

  if (!unlockedIds.includes('positive_month') && monthBalance > 0 && monthTransactions.length > 0) {
    const newAch = await unlockAchievement(userId, 'positive_month');
    if (newAch) newAchievements.push({ ...getAchievementById('positive_month'), ...newAch });
  }

  // 100% CATEGORIZADAS NO MÊS
  const uncategorized = monthTransactions.filter(t => !t.categoryId);
  if (!unlockedIds.includes('categorized_month') && monthTransactions.length > 0 && uncategorized.length === 0) {
    const newAch = await unlockAchievement(userId, 'categorized_month');
    if (newAch) newAchievements.push({ ...getAchievementById('categorized_month'), ...newAch });
  }

  // RECORRÊNCIAS
  const recurringCount = await Transaction.countDocuments({ 
    userId, 
    'recurringConfig.frequency': { $exists: true, $ne: null } 
  });

  if (!unlockedIds.includes('recurrence_master') && recurringCount >= 5) {
    const newAch = await unlockAchievement(userId, 'recurrence_master');
    if (newAch) newAchievements.push({ ...getAchievementById('recurrence_master'), ...newAch });
  }

  return newAchievements;
}

async function unlockAchievement(userId: string, achievementId: string) {
  try {
    const existing = await Achievement.findOne({ userId, achievementId });
    if (existing) return null;

    const achievement = new Achievement({
      userId,
      achievementId,
      unlockedAt: new Date(),
      seen: false
    });

    await achievement.save();
    console.log(`🏆 Achievement unlocked: ${achievementId} for user ${userId}`);
    
    return achievement.toObject();
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return null;
  }
}