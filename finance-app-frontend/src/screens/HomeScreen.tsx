import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import MonthlySummaryCard from '../components/MonthlySummaryCard';
import CategoryPieChart from '../components/CategoryPieChart';
import GoalsCarousel from '../components/GoalsCarousel';
import AlertsSection from '../components/AlertsSection';
import QuickActions from '../components/QuickActions';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getSummary();
      console.log('=== DASHBOARD DATA ===');
      console.log('Top Categories:', response.data.topCategories);
      console.log('Month Summary:', response.data.monthSummary);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Erro', 'Falha ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name?.split(' ')[0] || 'Usuário'}!
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.background }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name?.split(' ')[0] || 'Usuário'}!
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.background }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* RESUMO MENSAL */}
        {dashboardData?.monthSummary && (
          <View style={styles.section}> 
            <MonthlySummaryCard
              income={dashboardData.monthSummary.income}
              expenses={dashboardData.monthSummary.expenses}
              balance={dashboardData.monthSummary.balance}
              incomeChange={dashboardData.monthSummary.incomeChange}
              expensesChange={dashboardData.monthSummary.expensesChange}
              balanceChange={dashboardData.monthSummary.balanceChange}
              month={dashboardData.monthSummary.month}
            />
          </View>
        )}

        {/* GRÁFICO DE CATEGORIAS */}
        {dashboardData?.topCategories && (
          <View style={styles.section}>
            <CategoryPieChart 
              categories={dashboardData.topCategories}
              allCategories={dashboardData.allCategories}
              totalExpenses={dashboardData.monthSummary.expenses}
            />
          </View>
        )}

        {/* ALERTAS */}
        {dashboardData && (
          <AlertsSection
            budgetAlerts={dashboardData.budgetAlerts || []}
            pendingInvitesCount={dashboardData.pendingInvitesCount || 0}
          />
        )}

        {/* METAS */}
        {dashboardData?.goalsProgress && (
          <GoalsCarousel goals={dashboardData.goalsProgress} />
        )}

        {/* TRANSAÇÕES RECENTES */}
        {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Transações Recentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.transactionsCard, { backgroundColor: colors.card }]}>
              {dashboardData.recentTransactions.slice(0, 5).map((transaction: any, index: number) => (
                <TouchableOpacity
                  key={transaction._id}
                  style={[
                    styles.transactionItem,
                    index < 4 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border
                    }
                  ]}
                  onPress={() => navigation.navigate('TransactionDetails', { transactionId: transaction._id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: (transaction.categoryId?.color || '#999999') + '20' }
                      ]}
                    >
                      <Ionicons
                        name={(transaction.categoryId?.icon || 'help-circle') as any}
                        size={24}
                        color={transaction.categoryId?.color || '#999999'}
                      />
                    </View>
                    <View style={styles.transactionInfoContainer}>
                      <Text style={[styles.transactionDescription, { color: colors.text }]} numberOfLines={1}>
                        {transaction.description}
                      </Text>
                      <Text style={[styles.transactionCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                        {transaction.categoryId?.name || 'Sem categoria'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRightContainer}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'income' ? colors.success : colors.error }
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AÇÕES RÁPIDAS */}
        <QuickActions />

        {/* ESTATÍSTICAS RÁPIDAS */}
        {dashboardData?.stats && (
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>📊 Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {dashboardData.stats.totalTransactions}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transações</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {dashboardData.stats.activeGoals}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Metas Ativas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {dashboardData.stats.activeBudgets}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orçamentos</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionInfoContainer: {
    flex: 1,
  },
  transactionRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
});