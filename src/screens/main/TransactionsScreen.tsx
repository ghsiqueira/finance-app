import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { TransactionCard } from '../../components/common/TransactionCard';
import { TransactionFilters, FilterValues } from '../../components/common/TransactionFilters';
import { Loading } from '../../components/common/Loading';
import { Transaction, Category, PaginatedResponse } from '../../types';
import FinanceService from '../../services/finance';

interface TransactionsScreenProps {
  navigation: any;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Filtros
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // 🔄 CARREGAR DADOS AO FOCAR NA TELA
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      loadTransactions(1, true),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const data = await FinanceService.getCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadTransactions = async (page = 1, reset = false) => {
    try {
      const params = {
        page,
        limit: 10,
        ...activeFilters,
      };

      const response: PaginatedResponse<Transaction> = await FinanceService.getTransactions(params);
      
      if (reset) {
        setTransactions(response.data);
      } else {
        setTransactions(prev => [...prev, ...response.data]);
      }
      
      setCurrentPage(page);
      setHasMorePages(page < response.pagination.totalPages);
      setTotalTransactions(response.pagination.total);
      
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadTransactions(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMorePages || loadingMore) return;
    
    setLoadingMore(true);
    await loadTransactions(currentPage + 1, false);
    setLoadingMore(false);
  };

  const handleApplyFilters = async (filters: FilterValues) => {
    setActiveFilters(filters);
    setHasActiveFilters(Object.keys(filters).length > 0);
    setCurrentPage(1);
    setLoading(true);
    
    // Aplicar filtros
    try {
      const params = {
        page: 1,
        limit: 10,
        ...filters,
      };

      const response: PaginatedResponse<Transaction> = await FinanceService.getTransactions(params);
      setTransactions(response.data);
      setHasMorePages(1 < response.pagination.totalPages);
      setTotalTransactions(response.pagination.total);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', { transactionId: transaction.id });
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      setLoading(true);
      await FinanceService.deleteTransaction(transactionId);
      
      // Remover da lista local
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setTotalTransactions(prev => prev - 1);
      
      Alert.alert('Sucesso', 'Transação excluída com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = (type?: 'income' | 'expense') => {
    navigation.navigate('CreateTransaction', { type });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses, balance: income - expenses };
  };

  const totals = calculateTotals();

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionCard
      transaction={item}
      onEdit={handleEditTransaction}
      onDelete={handleDeleteTransaction}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 📊 RESUMO */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={styles.incomeText}>{formatCurrency(totals.income)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={styles.expenseText}>{formatCurrency(totals.expenses)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[
            styles.balanceText,
            { color: totals.balance >= 0 ? '#16a34a' : '#dc2626' }
          ]}>
            {formatCurrency(totals.balance)}
          </Text>
        </View>
      </View>

      {/* 🔍 BARRA DE FILTROS */}
      <View style={styles.filtersBar}>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.filterText,
            hasActiveFilters && styles.filterTextActive
          ]}>
            Filtros {hasActiveFilters && '(ativos)'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.countText}>
          {totalTransactions} transaç{totalTransactions !== 1 ? 'ões' : 'ão'}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {hasActiveFilters 
          ? 'Tente ajustar os filtros ou criar uma nova transação'
          : 'Comece adicionando sua primeira transação'
        }
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => handleCreateTransaction()}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.emptyButtonText}>Adicionar transação</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <Loading visible={false} />
      </View>
    );
  };

  if (loading && transactions.length === 0) {
    return <Loading visible={true} text="Carregando transações..." />;
  }

  return (
    <View style={styles.container}>
      {/* 🎨 HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleCreateTransaction()}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 📋 LISTA */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      {/* 🎯 FAB - FLOATING ACTION BUTTON */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => handleCreateTransaction()}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary, { bottom: 100 }]}
          onPress={() => handleCreateTransaction('income')}
        >
          <Ionicons name="arrow-up" size={20} color="#16a34a" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary, { bottom: 160 }]}
          onPress={() => handleCreateTransaction('expense')}
        >
          <Ionicons name="arrow-down" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* 🔍 MODAL DE FILTROS */}
      <TransactionFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        categories={categories}
        initialFilters={activeFilters}
      />
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
  
  // Header da lista
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  incomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  expenseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Filtros
  filtersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#3b82f6',
  },
  countText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  
  // Lista
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  
  // Estado vazio
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Loading more
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  
  // FAB
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 40,
  },
  fab: {
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
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
});