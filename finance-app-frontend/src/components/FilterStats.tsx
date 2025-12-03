import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface FilterStatsProps {
  transactions: any[];
}

export default function FilterStats({ transactions }: FilterStatsProps) {
  const { colors } = useTheme();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (transactions.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.stat}>
        <Ionicons name="arrow-down-circle" size={16} color={colors.success} />
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Receitas</Text>
        <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(totalIncome)}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.stat}>
        <Ionicons name="arrow-up-circle" size={16} color={colors.error} />
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Despesas</Text>
        <Text style={[styles.statValue, { color: colors.error }]}>{formatCurrency(totalExpenses)}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.stat}>
        <Ionicons name="wallet" size={16} color={balance >= 0 ? colors.success : colors.error} />
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saldo</Text>
        <Text style={[styles.statValue, { color: balance >= 0 ? colors.success : colors.error }]}>
          {formatCurrency(balance)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
  },
});