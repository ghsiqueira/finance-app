import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import axios from 'axios';

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const CACHE: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 60 * 60 * 1000;

export const getExchangeRates = async (req: AuthRequest, res: Response) => {
  try {

    const { base = 'USD' } = req.query;
    const cacheKey = `rates_${base}`;

    const cached = CACHE[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached rates');
      return res.json(cached.data);
    }

    console.log('Fetching fresh rates from API');
    
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );

    const ratesData = {
      base: response.data.base,
      date: response.data.date,
      rates: response.data.rates,
      lastUpdated: new Date().toISOString(),
    };

    CACHE[cacheKey] = {
      data: ratesData,
      timestamp: Date.now(),
    };

    res.json(ratesData);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    const cacheKey = `rates_${req.query.base || 'USD'}`;
    const cached = CACHE[cacheKey];
    if (cached) {
      console.log('API failed, returning expired cache');
      return res.json(cached.data);
    }

    res.status(500).json({ 
      message: 'Failed to fetch exchange rates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const convertCurrency = async (req: AuthRequest, res: Response) => {
  try {

    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({ 
        message: 'Missing required parameters: amount, from, to' 
      });
    }

    if (from === to) {
      return res.json({ 
        amount: parseFloat(amount as string),
        from,
        to,
        rate: 1
      });
    }

    const cacheKey = `rates_${from}`;
    let rates;

    const cached = CACHE[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      rates = cached.data;
    } else {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      
      rates = {
        base: response.data.base,
        date: response.data.date,
        rates: response.data.rates,
        lastUpdated: new Date().toISOString(),
      };

      CACHE[cacheKey] = {
        data: rates,
        timestamp: Date.now(),
      };
    }

    const rate = rates.rates[to as string];
    if (!rate) {
      return res.status(404).json({ 
        message: `Exchange rate not found for ${to}` 
      });
    }

    const convertedAmount = parseFloat(amount as string) * rate;

    res.json({
      amount: convertedAmount,
      from,
      to,
      rate,
      originalAmount: parseFloat(amount as string)
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ 
      message: 'Failed to convert currency',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
