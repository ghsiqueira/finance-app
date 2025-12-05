import express from 'express';
import { auth } from '../middleware/auth.js';
import { getReports } from '../controllers/transactionController.js';

const router = express.Router();

router.get('/summary', auth, getReports);
router.get('/by-category', auth, getReports);
router.get('/monthly', auth, getReports);

export default router;