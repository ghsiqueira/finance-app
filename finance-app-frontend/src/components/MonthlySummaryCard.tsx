import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface MonthlySummaryCardProps {
  income: number;
  expenses: number;
  balance: number;
  incomeChange: number;
  expensesChange: number;
  balanceChange: number;
  month: string;
}

export default function MonthlySummaryCard({
  income,
  expenses,
  balance,
  incomeChange,
  expensesChange,
  balanceChange,
  month
}: MonthlySummaryCardProps) {
  const { colors } = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderChange = (change: number) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    return (
      <View style={styles.changeRow}>
        <Ionicons 
          name={isPositive ? 'trending-up' : 'trending-down'} 
          size={14} 
          color={isPositive ? colors.success : colors.error} 
        />
        <Text style={[styles.changeText, { color: isPositive ? colors.success : colors.error }]}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>💰 Resumo de {month}</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* RECEITAS */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="arrow-down" size={24} color={colors.success} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Receitas</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(income)}</Text>
          {renderChange(incomeChange)}
        </View>

        {/* DESPESAS */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="arrow-up" size={24} color={colors.error} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Despesas</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(expenses)}</Text>
          {renderChange(expensesChange)}
        </View>

        {/* SALDO */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="wallet" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saldo</Text>
          <Text style={[
            styles.statValue, 
            { color: balance >= 0 ? colors.success : colors.error }
          ]}>
            {formatCurrency(balance)}
          </Text>
          {renderChange(balanceChange)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});