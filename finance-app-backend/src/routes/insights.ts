import express from 'express';
import { auth } from '../middleware/auth.js';
import { getInsights } from '../controllers/insightsController.js';

const router = express.Router();

router.get('/summary', auth, getInsights);

export default router;