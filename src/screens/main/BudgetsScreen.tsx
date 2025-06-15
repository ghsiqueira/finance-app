import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { BudgetList } from '../../components/common/BudgetCard';
import { Loading } from '../../components/common/Loading';
import { Budget } from '../../types';
import FinanceService from '../../services/finance';

interface BudgetsScreenProps {
  navigation: any;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({ navigation }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'exceeded'>('all');

  // 🔄 CARREGAR DADOS AO FOCAR NA TELA
  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  const loadBudgets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await FinanceService.getBudgets();
      setBudgets(data);

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadBudgets(true);
  };

  const handleEditBudget = (budget: Budget) => {
    navigation.navigate('EditBudget', { budgetId: budget.id });
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      setLoading(true);
      await FinanceService.deleteBudget(budgetId);
      
      // Remover da lista local
      setBudgets(prev => prev.filter(b => b.id !== budgetId));
      
      Alert.alert('Sucesso', 'Orçamento excluído com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    navigation.navigate('CreateBudget');
  };

  const getFilteredBudgets = () => {
    switch (filter) {
      case 'active':
        return budgets.filter(budget => {
          const percentage = (budget.spent / budget.amount) * 100;
          return percentage < 100;
        });
      case 'exceeded':
        return budgets.filter(budget => {
          const percentage = (budget.spent / budget.amount) * 100;
          return percentage >= 100;
        });
      default:
        return budgets;
    }
  };

  const getBudgetStats = () => {
    const total = budgets.length;
    const active = budgets.filter(b => (b.spent / b.amount) * 100 < 100).length;
    const exceeded = budgets.filter(b => (b.spent / b.amount) * 100 >= 100).length;
    const warning = budgets.filter(b => {
      const percentage = (b.spent / b.amount) * 100;
      return percentage >= b.alertThreshold && percentage < 100;
    }).length;

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    return { total, active, exceeded, warning, totalBudgeted, totalSpent };
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const filteredBudgets = getFilteredBudgets();
  const stats = getBudgetStats();

  const filterOptions = [
    { id: 'all', label: 'Todos', count: stats.total },
    { id: 'active', label: 'Ativos', count: stats.active },
    { id: 'exceeded', label: 'Excedidos', count: stats.exceeded },
  ];

  if (loading && budgets.length === 0) {
    return <Loading visible={true} text="Carregando orçamentos..." />;
  }

  return (
    <View style={styles.container}>
      {/* 🎨 HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Orçamentos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateBudget}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 📊 RESUMO GERAL */}
        {budgets.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {formatCurrency(stats.totalBudgeted)}
              </Text>
              <Text style={styles.summaryLabel}>Total Orçado</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[
                styles.summaryValue,
                { color: stats.totalSpent > stats.totalBudgeted ? '#dc2626' : '#16a34a' }
              ]}>
                {formatCurrency(stats.totalSpent)}
              </Text>
              <Text style={styles.summaryLabel}>Total Gasto</Text>
            </View>
          </View>
        )}

        {/* 📈 ESTATÍSTICAS */}
        {budgets.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.active}</Text>
                <Text style={styles.statLabel}>Ativos</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#fffbeb' }]}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.warning}</Text>
                <Text style={styles.statLabel}>Em alerta</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="warning" size={20} color="#dc2626" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.exceeded}</Text>
                <Text style={styles.statLabel}>Excedidos</Text>
              </View>
            </View>
          </View>
        )}

        {/* 🔍 FILTROS */}
        {budgets.length > 0 && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filtrar orçamentos</Text>
            <View style={styles.filterButtons}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterButton,
                    filter === option.id && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilter(option.id as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filter === option.id && styles.filterButtonTextActive,
                  ]}>
                    {option.label} ({option.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 📋 LISTA DE ORÇAMENTOS */}
        <View style={styles.listContainer}>
          {budgets.length > 0 && (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {filter === 'all' ? 'Todos os orçamentos' : 
                 filter === 'active' ? 'Orçamentos ativos' : 
                 'Orçamentos excedidos'}
              </Text>
              <Text style={styles.listCount}>
                {filteredBudgets.length} orçamento{filteredBudgets.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <BudgetList
            budgets={filteredBudgets}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
            emptyMessage={
              budgets.length === 0
                ? 'Nenhum orçamento criado ainda'
                : filter === 'active'
                  ? 'Nenhum orçamento ativo'
                  : filter === 'exceeded'
                    ? 'Nenhum orçamento excedido'
                    : 'Nenhum orçamento encontrado'
            }
          />
        </View>

        {/* 💡 DICAS */}
        {budgets.length === 0 && (
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Como usar orçamentos</Text>
                <Text style={styles.tipText}>
                  • Defina limites por categoria de gasto{'\n'}
                  • Configure alertas para ser avisado{'\n'}
                  • Monitore seu progresso em tempo real{'\n'}
                  • Use renovação automática para recorrências
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 🎯 FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateBudget}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Resumo
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Estatísticas
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Filtros
  filtersContainer: {
    marginBottom: 24,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#3b82f6',
  },
  
  // Lista
  listContainer: {
    flex: 1,
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  listCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Dicas
  tipsContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  tip: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  bottomPadding: {
    height: 80,
  },
});