import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

interface FilterChipsProps {
  filters: any;
  categories: any[];
  onRemoveFilter: (filterType: string, value?: any) => void;
}

export default function FilterChips({ filters, categories, onRemoveFilter }: FilterChipsProps) {
  const { colors } = useTheme();

  const chips: Array<{ label: string; icon: string; color: string; onRemove: () => void }> = [];

  if (filters.type !== 'all') {
    chips.push({
      label: filters.type === 'income' ? 'Receitas' : 'Despesas',
      icon: filters.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle',
      color: filters.type === 'income' ? colors.success : colors.error,
      onRemove: () => onRemoveFilter('type'),
    });
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    filters.categoryIds.forEach((catId: string) => {
      const category = categories.find(c => c._id === catId);
      if (category) {
        chips.push({
          label: category.name,
          icon: category.icon || 'pricetag',
          color: category.color || colors.primary,
          onRemove: () => onRemoveFilter('category', catId),
        });
      }
    });
  }

  if (filters.period !== 'all') {
    const periodLabels: { [key: string]: string } = {
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado',
      last3Months: 'Últimos 3 meses',
      last6Months: 'Últimos 6 meses',
      thisYear: 'Este ano',
      custom: filters.startDate && filters.endDate
        ? `${format(filters.startDate, 'dd/MM')} - ${format(filters.endDate, 'dd/MM')}`
        : 'Data personalizada',
    };
    chips.push({
      label: periodLabels[filters.period],
      icon: 'calendar',
      color: colors.info,
      onRemove: () => onRemoveFilter('period'),
    });
  }

  if (filters.minAmount || filters.maxAmount) {
    const minVal = filters.minAmount ? `R$ ${filters.minAmount}` : '0';
    const maxVal = filters.maxAmount ? `R$ ${filters.maxAmount}` : '∞';
    chips.push({
      label: `${minVal} - ${maxVal}`,
      icon: 'cash',
      color: colors.warning,
      onRemove: () => onRemoveFilter('amount'),
    });
  }

  if (filters.isRecurring !== 'all') {
    chips.push({
      label: filters.isRecurring === 'yes' ? 'Recorrentes' : 'Não recorrentes',
      icon: 'repeat',
      color: colors.info,
      onRemove: () => onRemoveFilter('recurring'),
    });
  }

  if (filters.hasBudget !== 'all') {
    chips.push({
      label: filters.hasBudget === 'yes' ? 'Com orçamento' : 'Sem orçamento',
      icon: 'wallet',
      color: colors.warning,
      onRemove: () => onRemoveFilter('budget'),
    });
  }

  if (filters.currency && filters.currency !== 'all') {
    chips.push({
      label: filters.currency,
      icon: 'cash-outline',
      color: colors.primary,
      onRemove: () => onRemoveFilter('currency'),
    });
  }

  if (filters.descriptionContains && filters.descriptionContains.trim()) {
    chips.push({
      label: `"${filters.descriptionContains}"`,
      icon: 'text',
      color: colors.textSecondary,
      onRemove: () => onRemoveFilter('description'),
    });
  }

  if (filters.limit && filters.limit !== 'all') {
    chips.push({
      label: `Máx. ${filters.limit}`,
      icon: 'list',
      color: colors.textSecondary,
      onRemove: () => onRemoveFilter('limit'),
    });
  }

  if (filters.sortBy !== 'date-desc') {
    const sortLabels: { [key: string]: string } = {
      'date-asc': 'Mais antigos',
      'amount-desc': 'Maior valor',
      'amount-asc': 'Menor valor',
      'description': 'A-Z',
    };
    chips.push({
      label: sortLabels[filters.sortBy],
      icon: 'swap-vertical',
      color: colors.textSecondary,
      onRemove: () => onRemoveFilter('sort'),
    });
  }

  if (chips.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip, index) => (
          <View
            key={index}
            style={[
              styles.chip,
              {
                backgroundColor: chip.color + '15',
                borderColor: chip.color,
              }
            ]}
          >
            <Ionicons name={chip.icon as any} size={14} color={chip.color} />
            <Text style={[styles.chipText, { color: chip.color }]} numberOfLines={1}>
              {chip.label}
            </Text>
            <TouchableOpacity onPress={chip.onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={chip.color} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});