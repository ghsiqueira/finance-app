import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getExchangeRates,
  convertCurrency
} from '../controllers/currencyController.js';

const router = express.Router();

router.use(auth);

router.get('/rates', getExchangeRates);
router.get('/convert', convertCurrency);

export default router;
