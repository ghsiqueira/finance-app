import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExchangeRates } from '../types/currency';

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000; 

export const currencyAPI = {
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    try {
      const cached = await this.getCachedRates(baseCurrency);
      if (cached) {
        console.log('Using cached exchange rates');
        return cached;
      }

      console.log('Fetching fresh exchange rates from backend');
      const response = await api.get(`/currency/rates?base=${baseCurrency}`);
      
      const rates: ExchangeRates = {
        base: response.data.base,
        date: response.data.date,
        rates: response.data.rates,
        lastUpdated: new Date(response.data.lastUpdated),
      };

      await this.cacheRates(baseCurrency, rates);

      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
      if (cached) {
        console.log('Backend failed, using expired cache');
        return JSON.parse(cached);
      }

      throw new Error('Não foi possível obter taxas de câmbio');
    }
  },

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;

    try {
      const response = await api.get('/currency/convert', {
        params: { amount, from, to }
      });

      return response.data.amount;
    } catch (error) {
      console.error('Error converting currency:', error);
      
      const rates = await this.getExchangeRates(from);
      const rate = rates.rates[to];

      if (!rate) {
        throw new Error(`Taxa de conversão não encontrada para ${to}`);
      }

      return amount * rate;
    }
  },

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const rates = await this.getExchangeRates(from);
    return rates.rates[to] || 0;
  },

  async getCachedRates(baseCurrency: string): Promise<ExchangeRates | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
      if (!cached) return null;

      const rates: ExchangeRates = JSON.parse(cached);
      const lastUpdated = new Date(rates.lastUpdated);
      const now = new Date();

      if (now.getTime() - lastUpdated.getTime() < CACHE_DURATION) {
        return rates;
      }

      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  async cacheRates(baseCurrency: string, rates: ExchangeRates): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEY}_${baseCurrency}`,
        JSON.stringify(rates)
      );
    } catch (error) {
      console.error('Error caching rates:', error);
    }
  },

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },
};