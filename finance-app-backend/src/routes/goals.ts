import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  addProgress,
  shareGoal,
  getGoalInvites,
  respondToInvite,
  getSharedGoals,
  addProgressToSharedGoal,
  removeMember,
  leaveSharedGoal,
  updateMemberRole
} from '../controllers/goalController.js';

const router = express.Router();

router.use(auth);

router.get('/invites', getGoalInvites);
router.get('/shared', getSharedGoals);
router.post('/:id/share', shareGoal);
router.post('/:id/invite/respond', respondToInvite);
router.post('/:id/shared-progress', addProgressToSharedGoal);
router.post('/:id/leave', leaveSharedGoal);
router.put('/:id/members/:memberId', updateMemberRole);
router.delete('/:id/members/:memberId', removeMember);
router.post('/:id/progress', addProgress);
router.post('/', createGoal);
router.get('/', getGoals);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;