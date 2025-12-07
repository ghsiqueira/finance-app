import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getRecurringTransactions, 
  pauseRecurrence, 
  resumeRecurrence, 
  deleteRecurrence, 
  generateRecurringTransactions,
  addRecurrenceToTransaction,
  editRecurrence  
} from '../controllers/recurrenceController.js';

const router = express.Router();

router.get('/', auth, getRecurringTransactions);
router.post('/generate', auth, generateRecurringTransactions);
router.patch('/:id/pause', auth, pauseRecurrence);
router.patch('/:id/resume', auth, resumeRecurrence);
router.patch('/:id/add', auth, addRecurrenceToTransaction);
router.patch('/:id/edit', auth, editRecurrence);  
router.delete('/:id', auth, deleteRecurrence);

export default router;