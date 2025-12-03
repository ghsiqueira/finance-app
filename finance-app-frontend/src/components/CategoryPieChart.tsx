import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface Category {
  name: string;
  total: number;
  color: string;
  icon: string;
  percentage: number;
  count: number;
}

interface CategoryPieChartProps {
  categories: Category[];
  allCategories?: Category[];
  totalExpenses?: number; 
}

export default function CategoryPieChart({ categories, allCategories, totalExpenses }: CategoryPieChartProps) {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!categories || categories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>📊 Gastos por Categoria</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma despesa este mês
          </Text>
        </View>
      </View>
    );
  }

  const totalAmount = totalExpenses || categories.reduce((sum, cat) => sum + cat.total, 0);
  const hasMoreCategories = allCategories && allCategories.length > categories.length;

  const renderCategoryRow = (cat: Category, index: number) => {
    const percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
    
    return (
      <View key={index} style={styles.categoryRow}>
        {/* Ícone e Nome */}
        <View style={styles.categoryInfo}>
          <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
            <Ionicons name={cat.icon as any} size={20} color={cat.color} />
          </View>
          <View style={styles.categoryTextContainer}>
            <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
              {cat.name}
            </Text>
            <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
              {formatCurrency(cat.total)} • {cat.count} {cat.count === 1 ? 'transação' : 'transações'}
            </Text>
          </View>
        </View>

        {/* Barra de Progresso */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: cat.color,
                  width: `${percentage}%`
                }
              ]}
            />
          </View>
          <Text style={[styles.percentageText, { color: cat.color }]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  };

  const allCategoriesTotal = allCategories?.reduce((sum, cat) => sum + cat.total, 0) || 0;
  const uncategorizedAmount = totalAmount - allCategoriesTotal;
  const hasUncategorized = uncategorizedAmount > 0;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>📊 Gastos por Categoria</Text>
        
        <View style={styles.chartContainer}>
          {categories.map((cat, index) => renderCategoryRow(cat, index))}
        </View>

        {/* RESUMO TOTAL COM BOTÃO VER MAIS */}
        <View style={[styles.totalContainer, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total de Despesas
            </Text>
            <Text style={[styles.totalValue, { color: colors.error }]}>
              {formatCurrency(totalAmount)}
            </Text>
            {hasUncategorized && (
              <Text style={[styles.uncategorizedText, { color: colors.warning }]}>
                {formatCurrency(uncategorizedAmount)} sem categoria
              </Text>
            )}
          </View>
          
          {/* BOTÃO VER MAIS */}
          {hasMoreCategories && (
            <TouchableOpacity
              style={[styles.viewMoreButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.viewMoreText}>Ver mais</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MODAL COM TODAS AS CATEGORIAS */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header do Modal */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                📊 Todas as Categorias
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Lista de Categorias */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalCategoriesContainer}>
                {allCategories?.map((cat, index) => renderCategoryRow(cat, index))}
                
                {/* MOSTRAR DESPESAS SEM CATEGORIA SE EXISTIREM */}
                {hasUncategorized && (
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.iconCircle, { backgroundColor: colors.textSecondary + '20' }]}>
                        <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
                      </View>
                      <View style={styles.categoryTextContainer}>
                        <Text style={[styles.categoryName, { color: colors.text }]}>
                          Sem Categoria
                        </Text>
                        <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                          {formatCurrency(uncategorizedAmount)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: colors.textSecondary,
                              width: `${(uncategorizedAmount / totalAmount) * 100}%`
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
                        {((uncategorizedAmount / totalAmount) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Total no Modal */}
              <View style={[styles.modalTotal, { backgroundColor: colors.background }]}>
                <Text style={[styles.modalTotalLabel, { color: colors.textSecondary }]}>
                  Total de Despesas
                </Text>
                <Text style={[styles.modalTotalValue, { color: colors.error }]}>
                  {formatCurrency(totalAmount)}
                </Text>
                <Text style={[styles.modalTotalCategories, { color: colors.textSecondary }]}>
                  {(allCategories?.length || 0) + (hasUncategorized ? 1 : 0)} {(allCategories?.length || 0) + (hasUncategorized ? 1 : 0) === 1 ? 'categoria' : 'categorias'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  chartContainer: {
    gap: 16,
  },
  categoryRow: {
    gap: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 13,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  uncategorizedText: {
    fontSize: 11,
    marginTop: 2,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viewMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalCategoriesContainer: {
    padding: 20,
    gap: 16,
  },
  modalTotal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTotalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalTotalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalTotalCategories: {
    fontSize: 13,
  },
});