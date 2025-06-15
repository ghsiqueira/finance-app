import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomInput } from './CustomInput';
import { CustomButton } from './CustomButton';
import { Category } from '../../types';

interface TransactionFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  categories?: Category[];
  initialFilters?: FilterValues;
}

export interface FilterValues {
  search?: string;
  type?: 'all' | 'income' | 'expense';
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  visible,
  onClose,
  onApply,
  categories = [],
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const typeOptions = [
    { id: 'all', label: 'Todos', icon: 'list' as const },
    { id: 'income', label: 'Receitas', icon: 'arrow-up-circle' as const },
    { id: 'expense', label: 'Gastos', icon: 'arrow-down-circle' as const },
  ];

  const periodOptions = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mês' },
    { id: 'year', label: 'Este ano' },
    { id: 'custom', label: 'Período personalizado' },
  ];

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const updateFilter = (key: keyof FilterValues, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* 📱 HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 🔍 BUSCA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buscar</Text>
            <CustomInput
              label=""
              placeholder="Digite uma descrição..."
              value={filters.search || ''}
              onChangeText={(value) => updateFilter('search', value)}
              icon="search"
            />
          </View>

          {/* 💰 TIPO DE TRANSAÇÃO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo</Text>
            <View style={styles.optionsGrid}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    filters.type === option.id && styles.optionCardSelected,
                  ]}
                  onPress={() => updateFilter('type', option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={filters.type === option.id ? '#3b82f6' : '#6b7280'}
                  />
                  <Text style={[
                    styles.optionText,
                    filters.type === option.id && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 📂 CATEGORIA */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categoria</Text>
              <TouchableOpacity
                style={[
                  styles.categorySelector,
                  !filters.categoryId && styles.categorySelected,
                ]}
                onPress={() => updateFilter('categoryId', undefined)}
              >
                <Text style={[
                  styles.categoryText,
                  !filters.categoryId && styles.categoryTextSelected,
                ]}>
                  Todas as categorias
                </Text>
              </TouchableOpacity>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      filters.categoryId === category.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => updateFilter('categoryId', category.id)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      filters.categoryId === category.id && styles.categoryChipTextSelected,
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 📅 PERÍODO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Período</Text>
            <View style={styles.periodGrid}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.periodCard,
                    filters.period === option.id && styles.periodCardSelected,
                  ]}
                  onPress={() => updateFilter('period', option.id)}
                >
                  <Text style={[
                    styles.periodText,
                    filters.period === option.id && styles.periodTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 📊 RESUMO DOS FILTROS */}
          {Object.keys(filters).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filtros ativos</Text>
              <View style={styles.activeFilters}>
                {filters.search && (
                  <View style={styles.activeFilter}>
                    <Text style={styles.activeFilterText}>
                      Busca: "{filters.search}"
                    </Text>
                  </View>
                )}
                {filters.type && filters.type !== 'all' && (
                  <View style={styles.activeFilter}>
                    <Text style={styles.activeFilterText}>
                      Tipo: {typeOptions.find(t => t.id === filters.type)?.label}
                    </Text>
                  </View>
                )}
                {filters.categoryId && (
                  <View style={styles.activeFilter}>
                    <Text style={styles.activeFilterText}>
                      Categoria: {categories.find(c => c.id === filters.categoryId)?.name}
                    </Text>
                  </View>
                )}
                {filters.period && (
                  <View style={styles.activeFilter}>
                    <Text style={styles.activeFilterText}>
                      Período: {periodOptions.find(p => p.id === filters.period)?.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* 🎯 AÇÕES */}
        <View style={styles.footer}>
          <CustomButton
            title="Aplicar filtros"
            onPress={handleApply}
            style={styles.applyButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingTop: 60,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  
  // Opções de tipo
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  optionTextSelected: {
    color: '#3b82f6',
  },
  
  // Categorias
  categorySelector: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  categorySelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#3b82f6',
  },
  categoriesScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  
  // Período
  periodGrid: {
    gap: 8,
  },
  periodCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  periodText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  periodTextSelected: {
    color: '#3b82f6',
  },
  
  // Filtros ativos
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilter: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  applyButton: {
    marginTop: 0,
  },
});