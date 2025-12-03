import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

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

interface TransactionFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  categories: any[];
  currentFilters: Filters;
}

export default function TransactionFiltersModal({
  visible,
  onClose,
  onApply,
  categories,
  currentFilters,
}: TransactionFiltersModalProps) {
  const { colors } = useTheme();

  const [filters, setFilters] = useState<Filters>(currentFilters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, visible]);

  const handleReset = () => {
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
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      all: 'Todo o período',
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado',
      last3Months: 'Últimos 3 meses',
      last6Months: 'Últimos 6 meses',
      thisYear: 'Este ano',
      custom: 'Personalizado',
    };
    return labels[period] || period;
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Filtros</Text>
              {getActiveFiltersCount() > 0 && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {getActiveFiltersCount()} filtro(s) ativo(s)
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* TIPO */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>💳 Tipo</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: filters.type === 'all' ? colors.primary : colors.background,
                      borderColor: filters.type === 'all' ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setFilters({ ...filters, type: 'all' })}
                >
                  <Text style={[styles.optionText, { color: filters.type === 'all' ? '#fff' : colors.text }]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: filters.type === 'income' ? colors.success : colors.background,
                      borderColor: filters.type === 'income' ? colors.success : colors.border,
                    }
                  ]}
                  onPress={() => setFilters({ ...filters, type: 'income' })}
                >
                  <Text style={[styles.optionText, { color: filters.type === 'income' ? '#fff' : colors.text }]}>
                    Receitas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: filters.type === 'expense' ? colors.error : colors.background,
                      borderColor: filters.type === 'expense' ? colors.error : colors.border,
                    }
                  ]}
                  onPress={() => setFilters({ ...filters, type: 'expense' })}
                >
                  <Text style={[styles.optionText, { color: filters.type === 'expense' ? '#fff' : colors.text }]}>
                    Despesas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CATEGORIAS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🏷️ Categorias</Text>
                {filters.categoryIds.length > 0 && (
                  <Text style={[styles.badge, { backgroundColor: colors.primary, color: '#fff' }]}>
                    {filters.categoryIds.length}
                  </Text>
                )}
              </View>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: filters.categoryIds.includes(category._id)
                          ? category.color + '20'
                          : colors.background,
                        borderColor: filters.categoryIds.includes(category._id)
                          ? category.color
                          : colors.border,
                      }
                    ]}
                    onPress={() => toggleCategory(category._id)}
                  >
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={filters.categoryIds.includes(category._id) ? category.color : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: filters.categoryIds.includes(category._id) ? category.color : colors.text
                        }
                      ]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                    {filters.categoryIds.includes(category._id) && (
                      <Ionicons name="checkmark-circle" size={16} color={category.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* PERÍODO */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📅 Período</Text>
              <View style={styles.optionsColumn}>
                {['all', 'thisMonth', 'lastMonth', 'last3Months', 'last6Months', 'thisYear', 'custom'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.radioOption,
                      { backgroundColor: colors.background, borderColor: colors.border }
                    ]}
                    onPress={() => setFilters({ ...filters, period: period as any })}
                  >
                    <View style={styles.radioLeft}>
                      <View
                        style={[
                          styles.radio,
                          { borderColor: filters.period === period ? colors.primary : colors.border }
                        ]}
                      >
                        {filters.period === period && (
                          <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <Text style={[styles.radioText, { color: colors.text }]}>
                        {getPeriodLabel(period)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* DATAS PERSONALIZADAS */}
              {filters.period === 'custom' && (
                <View style={styles.customDates}>
                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: filters.startDate ? colors.text : colors.textSecondary }]}>
                      {filters.startDate ? filters.startDate.toLocaleDateString('pt-BR') : 'Data inicial'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: filters.endDate ? colors.text : colors.textSecondary }]}>
                      {filters.endDate ? filters.endDate.toLocaleDateString('pt-BR') : 'Data final'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* VALOR */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Faixa de Valor</Text>
              <View style={styles.valueRow}>
                <View style={styles.valueInput}>
                  <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Mínimo</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={filters.minAmount}
                    onChangeText={(text) => setFilters({ ...filters, minAmount: text })}
                    placeholder="R$ 0,00"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.valueInput}>
                  <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Máximo</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={filters.maxAmount}
                    onChangeText={(text) => setFilters({ ...filters, maxAmount: text })}
                    placeholder="R$ 0,00"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* RECORRENTE */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔁 Recorrentes</Text>
              <View style={styles.optionsRow}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'yes', label: 'Sim' },
                  { value: 'no', label: 'Não' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: filters.isRecurring === option.value ? colors.primary : colors.background,
                        borderColor: filters.isRecurring === option.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setFilters({ ...filters, isRecurring: option.value as any })}
                  >
                    <Text style={[styles.optionText, { color: filters.isRecurring === option.value ? '#fff' : colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* COM ORÇAMENTO */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Vinculado a Orçamento</Text>
              <View style={styles.optionsRow}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'yes', label: 'Sim' },
                  { value: 'no', label: 'Não' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: filters.hasBudget === option.value ? colors.primary : colors.background,
                        borderColor: filters.hasBudget === option.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setFilters({ ...filters, hasBudget: option.value as any })}
                  >
                    <Text style={[styles.optionText, { color: filters.hasBudget === option.value ? '#fff' : colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* MOEDA */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>💱 Moeda</Text>
              <View style={styles.optionsRow}>
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'BRL', label: 'BRL' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: filters.currency === option.value ? colors.primary : colors.background,
                        borderColor: filters.currency === option.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setFilters({ ...filters, currency: option.value })}
                  >
                    <Text style={[styles.optionText, { color: filters.currency === option.value ? '#fff' : colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* DESCRIÇÃO CONTÉM */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔤 Descrição Contém</Text>
              <TextInput
                style={[styles.fullInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={filters.descriptionContains || ''}
                onChangeText={(text) => setFilters({ ...filters, descriptionContains: text })}
                placeholder="Digite uma palavra-chave..."
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* LIMITAR RESULTADOS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔢 Limitar Resultados</Text>
              <View style={styles.optionsRow}>
                {[
                  { value: 'all', label: 'Todas' },
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: filters.limit === option.value ? colors.primary : colors.background,
                        borderColor: filters.limit === option.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setFilters({ ...filters, limit: option.value })}
                  >
                    <Text style={[styles.optionText, { color: filters.limit === option.value ? '#fff' : colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ORDENAR POR */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>⬆️⬇️ Ordenar Por</Text>
              <View style={styles.optionsColumn}>
                {[
                  { value: 'date-desc', label: 'Data (mais recente)', icon: 'arrow-down' },
                  { value: 'date-asc', label: 'Data (mais antigo)', icon: 'arrow-up' },
                  { value: 'amount-desc', label: 'Valor (maior)', icon: 'arrow-down' },
                  { value: 'amount-asc', label: 'Valor (menor)', icon: 'arrow-up' },
                  { value: 'description', label: 'Descrição (A-Z)', icon: 'text' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioOption,
                      { backgroundColor: colors.background, borderColor: colors.border }
                    ]}
                    onPress={() => setFilters({ ...filters, sortBy: option.value as any })}
                  >
                    <View style={styles.radioLeft}>
                      <View
                        style={[
                          styles.radio,
                          { borderColor: filters.sortBy === option.value ? colors.primary : colors.border }
                        ]}
                      >
                        {filters.sortBy === option.value && (
                          <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color={colors.textSecondary}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.radioText, { color: colors.text }]}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* FOOTER BUTTONS */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={20} color={colors.text} />
              <Text style={[styles.resetButtonText, { color: colors.text }]}>Limpar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* DATE PICKERS */}
      {showStartDatePicker && (
        <DateTimePicker
          value={filters.startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setFilters({ ...filters, startDate: selectedDate });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={filters.endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setFilters({ ...filters, endDate: selectedDate });
            }
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 100,
    maxWidth: '48%',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  optionsColumn: {
    gap: 6,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 14,
  },
  customDates: {
    marginTop: 12,
    gap: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
  },
  valueRow: {
    flexDirection: 'row',
    gap: 12,
  },
  valueInput: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  fullInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});