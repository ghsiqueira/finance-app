import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { categoryAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

export default function AdvancedFiltersModal({
  visible,
  onClose,
  onApply,
  currentFilters,
}: AdvancedFiltersModalProps) {
  const { colors } = useTheme();

  const [type, setType] = useState<'all' | 'income' | 'expense'>(currentFilters.type || 'all');
  const [startDate, setStartDate] = useState<Date | null>(currentFilters.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(currentFilters.endDate || null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentFilters.categories || []);
  const [minAmount, setMinAmount] = useState(currentFilters.minAmount || '');
  const [maxAmount, setMaxAmount] = useState(currentFilters.maxAmount || '');
  const [search, setSearch] = useState(currentFilters.search || '');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleClearAll = () => {
    setType('all');
    setStartDate(null);
    setEndDate(null);
    setSelectedCategories([]);
    setMinAmount('');
    setMaxAmount('');
    setSearch('');
  };

  const handleApply = () => {
    if (minAmount && maxAmount && parseFloat(minAmount) > parseFloat(maxAmount)) {
      Alert.alert('Erro', 'Valor mínimo não pode ser maior que o máximo');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      Alert.alert('Erro', 'Data inicial não pode ser maior que a final');
      return;
    }

    const filters = {
      type: type === 'all' ? undefined : type,
      startDate,
      endDate,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      search: search.trim() || undefined,
    };

    onApply(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (type !== 'all') count++;
    if (startDate || endDate) count++;
    if (selectedCategories.length > 0) count++;
    if (minAmount || maxAmount) count++;
    if (search) count++;
    return count;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>Filtros Avançados</Text>
              {getActiveFiltersCount() > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* BUSCA POR DESCRIÇÃO */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Buscar por descrição</Text>
              <View style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Ex: supermercado"
                  placeholderTextColor={colors.placeholder}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* TIPO */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Tipo de transação</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: type === 'all' ? colors.primary : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setType('all')}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'all' ? '#fff' : colors.text }]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: type === 'income' ? colors.success : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'income' ? '#fff' : colors.text }]}>
                    Receitas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: type === 'expense' ? colors.error : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'expense' ? '#fff' : colors.text }]}>
                    Despesas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* PERÍODO */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Período</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Atalhos de período */}
              <View style={styles.periodShortcuts}>
                <TouchableOpacity
                  style={[styles.shortcutButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    setEndDate(now);
                  }}
                >
                  <Text style={[styles.shortcutText, { color: colors.text }]}>Este mês</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shortcutButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
                    setEndDate(new Date(now.getFullYear(), now.getMonth(), 0));
                  }}
                >
                  <Text style={[styles.shortcutText, { color: colors.text }]}>Mês passado</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shortcutButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  <Text style={[styles.shortcutText, { color: colors.text }]}>Limpar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CATEGORIAS */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Categorias</Text>
                {selectedCategories.length > 0 && (
                  <Text style={[styles.selectedCount, { color: colors.primary }]}>
                    {selectedCategories.length} selecionada{selectedCategories.length > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category._id);
                  return (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected ? category.color : colors.background,
                          borderColor: category.color
                        }
                      ]}
                      onPress={() => toggleCategory(category._id)}
                    >
                      <Ionicons 
                        name={category.icon} 
                        size={16} 
                        color={isSelected ? '#fff' : category.color} 
                      />
                      <Text style={[styles.categoryChipText, { color: isSelected ? '#fff' : colors.text }]}>
                        {category.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* FAIXA DE VALOR */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Faixa de valor</Text>
              <View style={styles.amountRow}>
                <View style={styles.amountInputContainer}>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Mínimo</Text>
                  <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>R$</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={minAmount}
                      onChangeText={setMinAmount}
                      placeholder="0,00"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.amountInputContainer}>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Máximo</Text>
                  <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>R$</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                      placeholder="0,00"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* FOOTER */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleClearAll}
            >
              <Text style={[styles.footerButtonText, { color: colors.text }]}>Limpar Tudo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.footerButtonText, { color: '#fff' }]}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>

          {/* DATE PICKERS */}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setStartDate(date);
              }}
              maximumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEndDate(date);
              }}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    flex: 1,
  },
  periodShortcuts: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInputContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  applyButton: {
    borderWidth: 0,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});