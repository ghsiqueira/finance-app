import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI, categoryAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionFiltersModal from '../components/TransactionFiltersModal';
import FilterChips from '../components/FilterChips';
import FilterStats from '../components/FilterStats';

interface Filters {
  type: 'all' | 'income' | 'expense';
  categoryIds: string[];
  period: 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'custom' | 'all';
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
  isRecurring: 'all' | 'yes' | 'no';
  hasBudget: 'all' | 'yes' | 'no';
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'description';
  currency?: string;
  descriptionContains?: string;
  limit?: string;
}

export default function TransactionsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    categoryIds: [],
    period: 'all',
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: '',
    isRecurring: 'all',
    hasBudget: 'all',
    sortBy: 'date-desc',
    currency: 'all',
    descriptionContains: '',
    limit: 'all',
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, categoriesRes] = await Promise.all([
        transactionAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
      applyFilters(transactionsRes.data, filters, searchQuery);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: any[], currentFilters: Filters, query: string) => {
    let result = [...data];

    if (query.trim()) {
      result = result.filter(t =>
        t.description.toLowerCase().includes(query.toLowerCase()) ||
        t.categoryId?.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (currentFilters.type !== 'all') {
      result = result.filter(t => t.type === currentFilters.type);
    }

    if (currentFilters.categoryIds.length > 0) {
      result = result.filter(t => 
        t.categoryId && currentFilters.categoryIds.includes(t.categoryId._id)
      );
    }

    if (currentFilters.period !== 'all') {
      const now = new Date();
      let start: Date | null = null;
      let end: Date | null = null;

      switch (currentFilters.period) {
        case 'thisMonth':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'lastMonth':
          start = startOfMonth(subMonths(now, 1));
          end = endOfMonth(subMonths(now, 1));
          break;
        case 'last3Months':
          start = startOfMonth(subMonths(now, 2));
          end = endOfMonth(now);
          break;
        case 'last6Months':
          start = startOfMonth(subMonths(now, 5));
          end = endOfMonth(now);
          break;
        case 'thisYear':
          start = startOfYear(now);
          end = endOfMonth(now);
          break;
        case 'custom':
          start = currentFilters.startDate;
          end = currentFilters.endDate;
          break;
      }

      if (start && end) {
        result = result.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= start! && transactionDate <= end!;
        });
      }
    }

    if (currentFilters.minAmount) {
      const min = parseFloat(currentFilters.minAmount);
      if (!isNaN(min)) {
        result = result.filter(t => t.amount >= min);
      }
    }
    if (currentFilters.maxAmount) {
      const max = parseFloat(currentFilters.maxAmount);
      if (!isNaN(max)) {
        result = result.filter(t => t.amount <= max);
      }
    }

    if (currentFilters.isRecurring !== 'all') {
      const isRecurring = currentFilters.isRecurring === 'yes';
      result = result.filter(t => t.isRecurring === isRecurring);
    }

    if (currentFilters.hasBudget !== 'all') {
      const hasBudget = currentFilters.hasBudget === 'yes';
      result = result.filter(t => hasBudget ? t.budgetId : !t.budgetId);
    }

    if (currentFilters.currency && currentFilters.currency !== 'all') {
      result = result.filter(t => t.currency === currentFilters.currency);
    }

    if (currentFilters.descriptionContains && currentFilters.descriptionContains.trim()) {
      result = result.filter(t =>
        t.description.toLowerCase().includes(currentFilters.descriptionContains!.toLowerCase())
      );
    }

    switch (currentFilters.sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'description':
        result.sort((a, b) => a.description.localeCompare(b.description));
        break;
    }

    if (currentFilters.limit && currentFilters.limit !== 'all') {
      const limitNum = parseInt(currentFilters.limit);
      result = result.slice(0, limitNum);
    }

    setFilteredTransactions(result);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(transactions, filters, query);
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    applyFilters(transactions, newFilters, searchQuery);
  };

  const handleRemoveFilter = (filterType: string, value?: any) => {
    let newFilters = { ...filters };

    switch (filterType) {
      case 'type':
        newFilters.type = 'all';
        break;
      case 'category':
        newFilters.categoryIds = newFilters.categoryIds.filter(id => id !== value);
        break;
      case 'period':
        newFilters.period = 'all';
        newFilters.startDate = null;
        newFilters.endDate = null;
        break;
      case 'amount':
        newFilters.minAmount = '';
        newFilters.maxAmount = '';
        break;
      case 'recurring':
        newFilters.isRecurring = 'all';
        break;
      case 'budget':
        newFilters.hasBudget = 'all';
        break;
      case 'sort':
        newFilters.sortBy = 'date-desc';
        break;
      case 'currency':
        newFilters.currency = 'all';
        break;
      case 'description':
        newFilters.descriptionContains = '';
        break;
      case 'limit':
        newFilters.limit = 'all';
        break;
    }

    setFilters(newFilters);
    applyFilters(transactions, newFilters, searchQuery);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.period !== 'all') count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.isRecurring !== 'all') count++;
    if (filters.hasBudget !== 'all') count++;
    if (filters.sortBy !== 'date-desc') count++;
    if (filters.currency && filters.currency !== 'all') count++;
    if (filters.descriptionContains && filters.descriptionContains.trim()) count++;
    if (filters.limit && filters.limit !== 'all') count++;
    return count;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const groupedTransactions = filteredTransactions.reduce((groups: any, transaction: any) => {
    const date = format(parseISO(transaction.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const sections = Object.keys(groupedTransactions).map(date => ({
    date,
    data: groupedTransactions[date]
  }));

  const renderTransactionItem = ({ item }: any) => {
    const isIncome = item.type === 'income';
    const amountColor = isIncome ? colors.success : colors.error;

    return (
      <TouchableOpacity
        style={[styles.transactionCard, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('TransactionDetails', { transactionId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              {
                backgroundColor: item.categoryId?.color
                  ? item.categoryId.color + '20'
                  : colors.textSecondary + '20'
              }
            ]}
          >
            <Ionicons
              name={item.categoryId?.icon || 'help-circle'}
              size={24}
              color={item.categoryId?.color || colors.textSecondary}
            />
          </View>

          <View style={styles.transactionInfo}>
            <View style={styles.transactionHeader}>
              <Text style={[styles.transactionDescription, { color: colors.text }]} numberOfLines={1}>
                {item.description}
              </Text>
              {/* ✅ BADGES */}
              <View style={styles.badges}>
                {item.isRecurring && (
                  <View style={[styles.badge, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="repeat" size={12} color={colors.info} />
                  </View>
                )}
                {item.budgetId && (
                  <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="wallet" size={12} color={colors.warning} />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.transactionMeta}>
              {item.categoryId && (
                <Text style={[styles.transactionCategory, { color: colors.textSecondary }]}>
                  {item.categoryId.name}
                </Text>
              )}
              <Text style={[styles.transactionTime, { color: colors.textSecondary }]}>
                {format(parseISO(item.date), 'HH:mm')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: any) => {
    const date = parseISO(section.date);
    const isToday = isSameDay(date, new Date());
    const dateLabel = isToday
      ? 'Hoje'
      : format(date, "dd 'de' MMMM", { locale: ptBR });

    const sectionTotal = section.data.reduce((sum: number, t: any) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionDate, { color: colors.text }]}>{dateLabel}</Text>
        <Text
          style={[
            styles.sectionTotal,
            { color: sectionTotal >= 0 ? colors.success : colors.error }
          ]}
        >
          {sectionTotal >= 0 ? '+' : ''}{formatCurrency(sectionTotal)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transações</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddTransaction')}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transações</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddTransaction')}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ✅ BARRA DE BUSCA E FILTROS */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar transações..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ BOTÃO DE FILTROS */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: getActiveFiltersCount() > 0 ? colors.primary : colors.card,
            }
          ]}
          onPress={() => setShowFiltersModal(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={getActiveFiltersCount() > 0 ? '#fff' : colors.text}
          />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ CHIPS DE FILTROS ATIVOS */}
      {getActiveFiltersCount() > 0 && (
        <FilterChips
          filters={filters}
          categories={categories}
          onRemoveFilter={handleRemoveFilter}
        />
      )}

      {/* ✅ ESTATÍSTICAS DOS RESULTADOS */}
      {filteredTransactions.length > 0 && getActiveFiltersCount() > 0 && (
        <FilterStats transactions={filteredTransactions} />
      )}

      {/* ✅ RESUMO DOS FILTROS ATIVOS */}
      {getActiveFiltersCount() > 0 && (
        <View style={[styles.activeFilters, { backgroundColor: colors.card }]}>
          <Text style={[styles.activeFiltersText, { color: colors.textSecondary }]}>
            {filteredTransactions.length} resultado(s) encontrado(s)
          </Text>
          <TouchableOpacity
            onPress={() => {
              const defaultFilters: Filters = {
                type: 'all',
                categoryIds: [],
                period: 'all',
                startDate: null,
                endDate: null,
                minAmount: '',
                maxAmount: '',
                isRecurring: 'all',
                hasBudget: 'all',
                sortBy: 'date-desc',
                currency: 'all',
                descriptionContains: '',
                limit: 'all',
              };
              setFilters(defaultFilters);
              applyFilters(transactions, defaultFilters, searchQuery);
            }}
          >
            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Limpar tudo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTA */}
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery || getActiveFiltersCount() > 0
              ? 'Nenhuma transação encontrada'
              : 'Nenhuma transação ainda'}
          </Text>
          {!searchQuery && getActiveFiltersCount() === 0 && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Text style={styles.emptyButtonText}>Criar primeira transação</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={sections}
          renderItem={({ item }) => (
            <View>
              {renderSectionHeader({ section: item })}
              {item.data.map((transaction: any) => (
                <View key={transaction._id}>
                  {renderTransactionItem({ item: transaction })}
                </View>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ✅ MODAL DE FILTROS */}
      <TransactionFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApply={handleApplyFilters}
        categories={categories}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  activeFiltersText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionCategory: {
    fontSize: 13,
  },
  transactionTime: {
    fontSize: 13,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});