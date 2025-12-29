import type { Response } from 'express';
import Goal from '../models/Goal.js';
import User from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, targetAmount, deadline, categoryId, autoSplit = true } = req.body;

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: 'Name, target amount, and deadline are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const monthsRemaining = Math.max(
      1,
      Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    const monthlyTarget = targetAmount / monthsRemaining;

    const goal = new Goal({
      userId: req.userId,
      name,
      targetAmount,
      currentAmount: 0,
      deadline: deadlineDate,
      categoryId: categoryId || undefined,
      isCompleted: false,
      autoSplit,
      members: [{
        userId: req.userId,
        email: user.email,
        name: user.name,
        role: 'owner',
        currentContribution: 0,
        joinedAt: new Date()
      }]
    });

    await goal.save();

    await goal.populate('categoryId');

    console.log('Goal created with owner as member');
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    console.log('GET GOALS - User ID:', req.userId);
    
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const ownGoals = await Goal.find({ userId: req.userId })
      .populate('categoryId')

    const sharedGoals = await Goal.find({
      'members.userId': req.userId,
      userId: { $ne: req.userId } 
    })
    .populate('categoryId')

    const allGoals = [...ownGoals, ...sharedGoals].sort((a, b) => {
      return b._id.toString().localeCompare(a._id.toString());
    });

    console.log('Own goals:', ownGoals.length);
    console.log('Shared goals:', sharedGoals.length);
    console.log('Total goals:', allGoals.length);
    
    res.json(allGoals);
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    console.log('GET GOAL - User ID:', req.userId);
    console.log('GET GOAL - Goal ID:', id);

    const goal = await Goal.findOne({
      _id: id,
      $or: [
        { userId: req.userId },
        { 'members.userId': req.userId }
      ]
    })
    .populate('categoryId')

    if (!goal) {
      console.log('GET GOAL - Not found or no access');
      return res.status(404).json({ message: 'Goal not found' });
    }

    console.log('GET GOAL - Found:', goal.name);
    res.json(goal);
  } catch (error) {
    console.error('Error getting goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { name, targetAmount, deadline, categoryId } = req.body;

    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (deadline !== undefined) goal.deadline = new Date(deadline);
    if (categoryId !== undefined) goal.categoryId = categoryId;

    await goal.save();
    await goal.populate('categoryId');

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addProgress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { amount } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.currentAmount += amount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
      goal.currentAmount = goal.targetAmount;
    }

    await goal.save();

    await goal.populate('categoryId');

    res.json(goal);
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const shareGoal = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== SHARE GOAL REQUEST ===');
    console.log('User ID:', req.userId);
    console.log('Goal ID from params:', req.params.id);
    console.log('Request body:', req.body);

    if (!req.userId) {
      console.log('ERROR: No userId');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { invites } = req.body;

    if (!id) {
      console.log('ERROR: No goal ID');
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      console.log('ERROR: Invalid invites array');
      return res.status(400).json({ message: 'Invites array is required' });
    }

    console.log('Searching for goal with ID:', id);
    const goal = await Goal.findOne({ _id: id });

    if (!goal) {
      console.log('ERROR: Goal not found');
      return res.status(404).json({ message: 'Goal not found' });
    }

    const member = goal.members.find(m => m.userId.toString() === req.userId);
    const canShare = member?.role === 'owner' || member?.role === 'admin' || member?.role === 'contributor';

    if (!canShare) {
      return res.status(403).json({ message: 'You do not have permission to share this goal' });
    }

    const currentUser = await User.findById(req.userId);
    console.log('Current user found:', !!currentUser);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newInvites = [];

    for (const invite of invites) {
      const { email, role, contributionLimit } = invite;
      const emailLower = email.toLowerCase().trim();
      
      console.log('Processing invite:', { email: emailLower, role, contributionLimit });

      if (emailLower === currentUser.email.toLowerCase()) {
        console.log('Skipping: same as current user');
        continue;
      }

      const alreadyMember = goal.members.some(m => m.email.toLowerCase() === emailLower);
      if (alreadyMember) {
        console.log('Skipping: already a member');
        continue;
      }

      const alreadyInvited = goal.invites.some(
        i => i.email.toLowerCase() === emailLower && i.status === 'pending'
      );
      if (alreadyInvited) {
        console.log('Skipping: already invited');
        continue;
      }

      const newInvite: any = {
        email: emailLower,
        invitedBy: req.userId,
        invitedAt: new Date(),
        status: 'pending',
        role: role || 'viewer'
      };

      if (contributionLimit !== undefined && contributionLimit !== null) {
        newInvite.contributionLimit = contributionLimit;
      }

      goal.invites.push(newInvite);

      newInvites.push({ email: emailLower, role: role || 'viewer' });
      console.log('Added invite for:', emailLower);
    }

    console.log('New invites count:', newInvites.length);

    if (newInvites.length === 0) {
      console.log('ERROR: No new invites');
      return res.status(400).json({ message: 'No new invites to send' });
    }

    goal.isShared = true;

    if (goal.members.length === 0) {
      console.log('Adding owner as first member');
      goal.members.push({
        userId: req.userId,
        email: currentUser.email,
        name: currentUser.name,
        role: 'owner',
        currentContribution: 0,
        joinedAt: new Date()
      } as any);
    }

    console.log('Saving goal...');
    await goal.save();
    await goal.populate('categoryId');
    console.log('Goal saved successfully');

    res.json({ 
      message: `${newInvites.length} invite(s) sent successfully`,
      invites: newInvites,
      goal
    });
  } catch (error) {
    console.error('=== SHARE GOAL ERROR ===');
    console.error('Error:', error);
    console.error('======================');
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
};

export const getGoalInvites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const goals = await Goal.find({
      'invites.email': user.email.toLowerCase(),
      'invites.status': 'pending'
    }).populate('userId', 'name email');

    const invites = goals.map(goal => {
      const invite = goal.invites.find(
        i => i.email.toLowerCase() === user.email.toLowerCase() && i.status === 'pending'
      );

      return {
        goalId: goal._id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        invitedBy: {
          name: (goal.userId as any).name,
          email: (goal.userId as any).email
        },
        role: invite?.role || 'viewer',
        contributionLimit: invite?.contributionLimit
      };
    });

    res.json(invites);
  } catch (error) {
    console.error('Error getting goal invites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondToInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { accept } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const goal = await Goal.findOne({
      _id: id,
      'invites.email': user.email.toLowerCase(),
      'invites.status': 'pending'
    });

    if (!goal) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    const invite = goal.invites.find(
      i => i.email.toLowerCase() === user.email.toLowerCase() && i.status === 'pending'
    );

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (accept) {
      invite.status = 'accepted';

      const newMember: any = {
        userId: req.userId,
        email: user.email,
        name: user.name,
        role: invite.role || 'viewer',
        currentContribution: 0,
        joinedAt: new Date()
      };

      if (invite.contributionLimit !== undefined && invite.contributionLimit !== null) {
        newMember.contributionLimit = invite.contributionLimit;
      }

      goal.members.push(newMember);

      await goal.save();
      res.json({ message: 'Invite accepted', goal });
    } else {
      invite.status = 'rejected';
      await goal.save();
      res.json({ message: 'Invite rejected' });
    }
  } catch (error) {
    console.error('Error responding to invite:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSharedGoals = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const goals = await Goal.find({
      'members.userId': req.userId
    }).populate('categoryId');

    res.json(goals);
  } catch (error) {
    console.error('Error getting shared goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addProgressToSharedGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { amount } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const goal = await Goal.findOne({
      _id: id,
      'members.userId': req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found or you are not a member' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const member = goal.members.find(m => m.userId.toString() === req.userId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (member.contributionLimit) {
      const newContribution = member.currentContribution + amount;
      if (newContribution > member.contributionLimit) {
        return res.status(400).json({ 
          message: `Contribution limit exceeded. You can only contribute ${member.contributionLimit - member.currentContribution} more.`,
          limit: member.contributionLimit,
          current: member.currentContribution,
          remaining: member.contributionLimit - member.currentContribution
        });
      }
    }

    goal.currentAmount += amount;
    member.currentContribution += amount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
      goal.currentAmount = goal.targetAmount;
    }

    goal.progressHistory.push({
      amount,
      addedBy: req.userId,
      addedByName: user.name,
      date: new Date()
    } as any);

    await goal.save();

    await goal.populate('categoryId');

    res.json(goal);
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, memberId } = req.params;

    if (!id || !memberId) {
      return res.status(400).json({ message: 'Goal ID and Member ID are required' });
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const currentMember = goal.members.find(m => m.userId.toString() === req.userId);
    
    const isSelfRemoval = req.userId === memberId;
    const isOwner = currentMember?.role === 'owner';

    if (!isSelfRemoval && !isOwner) {
      return res.status(403).json({ message: 'Only owner can remove other members' });
    }

    const memberToRemove = goal.members.find(m => m.userId.toString() === memberId);
    if (!memberToRemove) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (memberToRemove.role === 'owner' && !isSelfRemoval) {
      return res.status(400).json({ message: 'Cannot remove owner' });
    }

    goal.members = goal.members.filter(m => m.userId.toString() !== memberId);

    if (goal.members.length === 0) {
      goal.isShared = false;
    }

    await goal.save();

    res.json({ message: 'Member removed successfully', goal });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const leaveSharedGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    const goal = await Goal.findOne({
      _id: id,
      'members.userId': req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found or you are not a member' });
    }

    const member = goal.members.find(m => m.userId.toString() === req.userId);
    
    if (member?.role === 'owner') {
      return res.status(400).json({ 
        message: 'Owner cannot leave the goal. Transfer ownership or delete the goal instead.' 
      });
    }

    goal.members = goal.members.filter(m => m.userId.toString() !== req.userId);

    if (goal.members.length === 0) {
      goal.isShared = false;
    }

    await goal.save();

    res.json({ message: 'Successfully left the goal' });
  } catch (error) {
    console.error('Error leaving goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, memberId } = req.params;
    const { role, contributionLimit } = req.body;

    if (!id || !memberId) {
      return res.status(400).json({ message: 'Goal ID and Member ID are required' });
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const currentMember = goal.members.find(m => m.userId.toString() === req.userId);
    if (!currentMember || currentMember.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can update member roles' });
    }

    const memberToUpdate = goal.members.find(m => m.userId.toString() === memberId);
    if (!memberToUpdate) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (memberToUpdate.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    if (role) {
      if (!['admin', 'contributor', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      memberToUpdate.role = role;
    }

    if (contributionLimit !== undefined) {
      memberToUpdate.contributionLimit = contributionLimit;
    }

    await goal.save();

    res.json({ message: 'Member updated successfully', goal });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};