import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboard,
  getReports
} from '../controllers/transactionController.js';

const router = express.Router();

router.use(auth);

router.get('/dashboard', getDashboard);
router.get('/reports', getReports);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;