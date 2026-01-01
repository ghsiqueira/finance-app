import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, insightsAPI } from '../services/api';
import MonthlySummaryCard from '../components/MonthlySummaryCard';
import CategoryPieChart from '../components/CategoryPieChart';
import GoalsCarousel from '../components/GoalsCarousel';
import AlertsSection from '../components/AlertsSection';
import QuickActions from '../components/QuickActions';
import InsightsSection from '../components/InsightsSection';
import { useFocusEffect } from '@react-navigation/native';
import CreditCardsCarousel from '../components/CreditCardsCarousel';

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);

  const loadDashboard = async () => {
    try {
      console.log('📊 === LOADING DASHBOARD ===');
      
      const token = await AsyncStorage.getItem('@token');
      console.log('Token no storage:', token ? token.substring(0, 20) + '...' : 'NENHUM');
      console.log('Authorization header:', api.defaults.headers.common['Authorization']);
      
      console.log('Chamando dashboardAPI.getSummary...');
      const response = await dashboardAPI.getSummary();
      console.log('✅ Dashboard carregado com sucesso');
      
      setDashboardData(response.data);
      
      const insightsRes = await insightsAPI.getSummary();
      setInsights(insightsRes.data.insights || []);
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
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
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
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
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name?.split(' ')[0] || 'Usuário'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name?.split(' ')[0] || 'Usuário'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
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

        {/* AÇÕES RÁPIDAS */}
        <QuickActions />

        {/* INSIGHTS */}
        {insights.length > 0 && (
          <InsightsSection insights={insights} />
        )}

        {/* ALERTAS */}
        {dashboardData && (
          <AlertsSection
            budgetAlerts={dashboardData.budgetAlerts || []}
            pendingInvitesCount={dashboardData.pendingInvitesCount || 0}
          />
        )}

        {/* ESTATÍSTICAS */}
        {dashboardData?.stats && (
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[
                  styles.statIconContainer, 
                  { backgroundColor: colorScheme === 'dark' ? '#5E9FFF20' : '#007AFF15' }
                ]}>
                  <Ionicons 
                    name="swap-horizontal" 
                    size={20} 
                    color={colorScheme === 'dark' ? '#5E9FFF' : '#007AFF'} 
                  />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {dashboardData.stats.totalTransactions}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Transações
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={[
                  styles.statIconContainer, 
                  { backgroundColor: colorScheme === 'dark' ? '#5DD97C20' : '#34C75915' }
                ]}>
                  <Ionicons 
                    name="flag" 
                    size={20} 
                    color={colorScheme === 'dark' ? '#5DD97C' : '#34C759'} 
                  />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {dashboardData.stats.activeGoals}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Metas
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={[
                  styles.statIconContainer, 
                  { backgroundColor: colorScheme === 'dark' ? '#FFB34020' : '#FF950015' }
                ]}>
                  <Ionicons 
                    name="wallet" 
                    size={20} 
                    color={colorScheme === 'dark' ? '#FFB340' : '#FF9500'} 
                  />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {dashboardData.stats.activeBudgets}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Orçamentos
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* GRÁFICO DE CATEGORIAS */}
        {dashboardData?.topCategories && dashboardData.topCategories.length > 0 && (
          <View style={styles.section}>
            <CategoryPieChart
              categories={dashboardData.topCategories}
              allCategories={dashboardData.allCategories}
              totalExpenses={dashboardData.monthSummary.expenses}
              limit={3}
              showViewAll={true}
              hideChart={true}
            />
          </View>
        )}

        {/* METAS */}
        {dashboardData?.goalsProgress && dashboardData.goalsProgress.length > 0 && (
          <GoalsCarousel goals={dashboardData.goalsProgress} />
        )}

        {/* CARTÕES DE CRÉDITO */}
        {dashboardData?.creditCards && dashboardData.creditCards.length > 0 && (
          <CreditCardsCarousel cards={dashboardData.creditCards} />
        )}

        {/* TRANSAÇÕES RECENTES */}
        {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
          <View style={[styles.transactionsCard, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Transações Recentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.transactionsList}>
              {dashboardData.recentTransactions.slice(0, 5).map((transaction: any, index: number) => (
                <TouchableOpacity
                  key={transaction._id}
                  style={[
                    styles.transactionItem,
                    index < 4 && styles.transactionItemBorder,
                    { borderBottomColor: colors.border }
                  ]}
                  onPress={() => navigation.navigate('TransactionDetails', { transactionId: transaction._id })}
                  activeOpacity={0.6}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: (transaction.categoryId?.color || '#999') + '20' }
                      ]}
                    >
                      <Ionicons
                        name={(transaction.categoryId?.icon || 'help-circle') as any}
                        size={22}
                        color={transaction.categoryId?.color || '#999'}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDescription, { color: colors.text }]} numberOfLines={1}>
                        {transaction.description}
                      </Text>
                      <Text style={[styles.transactionCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                        {transaction.categoryId?.name || 'Sem categoria'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' 
                        ? (colorScheme === 'dark' ? '#5DD97C' : '#34C759')
                        : (colorScheme === 'dark' ? '#FF6961' : '#FF3B30')
                      }
                    ]}
                  >
                    {transaction.type === 'income' ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
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
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});