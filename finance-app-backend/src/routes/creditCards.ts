import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAll,
  getById,
  create,
  update,
  deleteCard,
  addPurchase,
  getPurchases,
  getInvoices,
  payInvoice,
  getDashboard,
} from '../controllers/creditCardController.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', auth, getDashboard);

// CRUD Cartões
router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, deleteCard);

// Compras
router.post('/purchases', auth, addPurchase);
router.get('/:id/purchases', auth, getPurchases);

// Faturas
router.get('/:id/invoices', auth, getInvoices);
router.post('/:id/pay-invoice', auth, payInvoice);

export default router;