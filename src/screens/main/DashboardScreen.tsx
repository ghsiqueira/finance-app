import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { DashboardCard, StatCard, ProgressCard } from '../../components/common/DashboardCard';
import { Loading } from '../../components/common/Loading';
import { useAppStore, useFinanceStore } from '../../store';
import FinanceService from '../../services/finance';
import { DashboardStats } from '../../types';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAppStore();
  const { updateStats } = useFinanceStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);

  // 🔄 CARREGAR DADOS AO FOCAR NA TELA
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async (isRefresh = false) => {
    try {
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

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const calculateSavingsRate = () => {
    if (!dashboardData || dashboardData.monthlyIncome === 0) return 0;
    const savings = dashboardData.monthlyIncome - dashboardData.monthlyExpenses;
    return (savings / dashboardData.monthlyIncome) * 100;
  };

  if (loading) {
    return <Loading visible={true} text="Carregando dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* 👋 HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}! 👋</Text>
            <Text style={styles.subtitle}>Aqui está seu resumo financeiro</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={32} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 💰 CARDS PRINCIPAIS */}
      <View style={styles.section}>
        <View style={styles.cardRow}>
          <DashboardCard
            title="Saldo Total"
            value={formatCurrency(dashboardData?.totalBalance || 0)}
            icon="wallet"
            iconColor="#10b981"
            style={styles.halfCard}
            onPress={() => navigation.navigate('Transactions')}
            trend={{
              value: 12.5,
              isPositive: (dashboardData?.totalBalance || 0) >= 0,
            }}
          />
          <DashboardCard
            title="Este Mês"
            value={formatCurrency((dashboardData?.monthlyIncome || 0) - (dashboardData?.monthlyExpenses || 0))}
            subtitle="Receitas - Gastos"
            icon="trending-up"
            iconColor="#3b82f6"
            style={styles.halfCard}
            onPress={() => navigation.navigate('Transactions')}
          />
        </View>

        <View style={styles.cardRow}>
          <DashboardCard
            title="Receitas"
            value={formatCurrency(dashboardData?.monthlyIncome || 0)}
            subtitle="Este mês"
            icon="arrow-up-circle"
            iconColor="#10b981"
            style={styles.halfCard}
            onPress={() => navigation.navigate('CreateTransaction', { type: 'income' })}
          />
          <DashboardCard
            title="Gastos"
            value={formatCurrency(dashboardData?.monthlyExpenses || 0)}
            subtitle="Este mês"
            icon="arrow-down-circle"
            iconColor="#ef4444"
            style={styles.halfCard}
            onPress={() => navigation.navigate('CreateTransaction', { type: 'expense' })}
          />
        </View>
      </View>

      {/* 📊 ESTATÍSTICAS RÁPIDAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <StatCard
          label="Taxa de Economia"
          value={`${calculateSavingsRate().toFixed(1)}%`}
          icon="trending-up"
          color="#10b981"
        />
        <StatCard
          label="Transações este mês"
          value={dashboardData?.recentTransactions?.length.toString() || '0'}
          icon="receipt"
          color="#3b82f6"
        />
        <StatCard
          label="Categoria principal"
          value={dashboardData?.expensesByCategory?.[0]?.categoryName || 'Nenhuma'}
          icon="grid"
          color="#f59e0b"
        />
      </View>

      {/* 💳 ORÇAMENTOS */}
      {dashboardData?.budgetStatus && dashboardData.budgetStatus.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Orçamentos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budgets')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.budgetStatus.slice(0, 3).map((budget) => (
            <ProgressCard
              key={budget.budgetId}
              title={budget.budgetName}
              current={budget.spent}
              target={budget.amount}
              icon="card"
              color={
                budget.status === 'exceeded' ? '#ef4444' :
                budget.status === 'warning' ? '#f59e0b' : '#10b981'
              }
              onPress={() => navigation.navigate('Budgets')}
            />
          ))}
        </View>
      )}

      {/* 🎯 METAS PRÓXIMAS */}
      {dashboardData?.upcomingGoals && dashboardData.upcomingGoals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metas em Destaque</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.upcomingGoals.slice(0, 2).map((goal) => (
            <ProgressCard
              key={goal.id}
              title={goal.name}
              current={goal.currentAmount}
              target={goal.targetAmount}
              icon="flag"
              color="#8b5cf6"
              onPress={() => navigation.navigate('GoalDetails', { goalId: goal.id })}
            />
          ))}
        </View>
      )}

      {/* 📈 TRANSAÇÕES RECENTES */}
      {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transações Recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={[
                styles.transactionIcon,
                { backgroundColor: transaction.type === 'income' ? '#dcfce7' : '#fef2f2' }
              ]}>
                <Ionicons
                  name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={transaction.type === 'income' ? '#16a34a' : '#dc2626'}
                />
              </View>
              <View style={styles.transactionContent}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionCategory}>{transaction.category?.name}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'income' ? '#16a34a' : '#dc2626' }
              ]}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 🚀 AÇÕES RÁPIDAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('CreateTransaction', { type: 'income' })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="add-circle" size={24} color="#16a34a" />
            </View>
            <Text style={styles.quickActionText}>Adicionar Receita</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('CreateTransaction', { type: 'expense' })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="remove-circle" size={24} color="#dc2626" />
            </View>
            <Text style={styles.quickActionText}>Adicionar Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('CreateBudget')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="card" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.quickActionText}>Novo Orçamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('CreateGoal')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="flag" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionText}>Nova Meta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔧 BOTÃO DE LOGOUT TEMPORÁRIO */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
  },
  
  // Transações
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Ações rápidas
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  
  // Botão logout temporário
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});