import express from 'express';
import {
  getExchangeRates,
  convertCurrency
} from '../controllers/currencyController.js';

const router = express.Router();

router.get('/rates', getExchangeRates);
router.get('/convert', convertCurrency);

export default router;