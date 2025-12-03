import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.js';

const router = express.Router();

router.use(auth);

router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/:id', getBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;