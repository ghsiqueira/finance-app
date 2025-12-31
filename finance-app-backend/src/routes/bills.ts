import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAll,
  getById,
  create,
  update,
  deleteBill,
  markAsPaid,
  getUpcoming,
  getOverdue,
} from '../controllers/billController.js';

const router = express.Router();

// Listar todas
router.get('/', auth, getAll);

// Contas próximas (7 dias)
router.get('/upcoming', auth, getUpcoming);

// Contas atrasadas
router.get('/overdue', auth, getOverdue);

// CRUD
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, deleteBill);

// Marcar como paga
router.post('/:id/pay', auth, markAsPaid);

export default router;