import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExchangeRates } from '../types/currency';
import { currencyAPI } from '../services/currencyAPI';

interface CurrencyContextData {
  mainCurrency: string;
  setMainCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates | null;
  loadingRates: boolean;
  refreshRates: () => Promise<void>;
  convertToMain: (amount: number, fromCurrency: string) => Promise<number>;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextData>({} as CurrencyContextData);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [mainCurrency, setMainCurrencyState] = useState('BRL');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMainCurrency();
  }, []);

  useEffect(() => {
    if (mainCurrency) {
      refreshRates();
    }
  }, [mainCurrency]);

  const loadMainCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem('main_currency');
      if (saved) {
        setMainCurrencyState(saved);
      }
    } catch (error) {
      console.error('Error loading main currency:', error);
    }
  };

  const setMainCurrency = async (currency: string) => {
    try {
      await AsyncStorage.setItem('main_currency', currency);
      setMainCurrencyState(currency);
    } catch (error) {
      console.error('Error saving main currency:', error);
    }
  };

  const refreshRates = async () => {
    try {
      setLoadingRates(true);
      const rates = await currencyAPI.getExchangeRates(mainCurrency);
      setExchangeRates(rates);
      setLastUpdated(new Date(rates.lastUpdated));
    } catch (error) {
      console.error('Error refreshing rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  const convertToMain = async (amount: number, fromCurrency: string): Promise<number> => {
    if (fromCurrency === mainCurrency) return amount;

    try {
      return await currencyAPI.convert(amount, fromCurrency, mainCurrency);
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        mainCurrency,
        setMainCurrency,
        exchangeRates,
        loadingRates,
        refreshRates,
        convertToMain,
        lastUpdated,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};