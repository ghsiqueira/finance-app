import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getUserAchievements,
  checkAndUnlockAchievements,
  markAchievementAsSeen
} from '../controllers/achievementController.js';

const router = express.Router();

router.get('/', auth, getUserAchievements);
router.post('/check', auth, checkAndUnlockAchievements);
router.patch('/:achievementId/seen', auth, markAchievementAsSeen);

export default router;