import { useState, useEffect } from 'react';
import { DashboardStats } from '../types';
import FinanceService from '../services/finance';
import { useFinanceStore } from '../store';

export const useDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  
  const { updateStats } = useFinanceStore();

  const loadDashboardData = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await FinanceService.getDashboardStats();
      setDashboardData(data);
      
      // Atualizar store global
      updateStats({
        totalBalance: data.totalBalance,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    loadDashboardData(true);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    dashboardData,
    loading,
    refreshing,
    error,
    refresh,
    reload: loadDashboardData,
  };
};