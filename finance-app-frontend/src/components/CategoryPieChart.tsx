import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;

interface Category {
  name: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

interface Props {
  categories: Category[];
  allCategories: Category[];
  totalExpenses: number;
  limit?: number;
  showViewAll?: boolean;
  hideChart?: boolean; // 🆕 Esconder gráfico (só lista)
}

export default function CategoryPieChart({ 
  categories, 
  allCategories, 
  totalExpenses,
  limit,
  showViewAll = false,
  hideChart = false, // 🆕 Padrão false (mostra gráfico)
}: Props) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const displayedCategories = limit ? categories.slice(0, limit) : categories;
  
  const hasOthers = limit && categories.length > limit;
  const othersTotal = hasOthers 
    ? categories.slice(limit).reduce((sum, cat) => sum + cat.total, 0)
    : 0;
  const othersPercentage = hasOthers && totalExpenses > 0
    ? (othersTotal / totalExpenses) * 100
    : 0;

  const chartData = [
    ...displayedCategories.map(cat => ({
      name: cat.name,
      value: cat.total,
      color: cat.color,
      legendFontColor: colors.text,
      legendFontSize: 13,
    })),
    ...(hasOthers ? [{
      name: 'Outros',
      value: othersTotal,
      color: '#999999',
      legendFontColor: colors.text,
      legendFontSize: 13,
    }] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>📊 Gastos por Categoria</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Total: {formatCurrency(totalExpenses)}
          </Text>
        </View>
        {showViewAll && (
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>Ver mais</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 🆕 GRÁFICO - só mostra se hideChart=false */}
      {!hideChart && (
        <PieChart
          data={chartData}
          width={screenWidth - 80}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="0"
          absolute
          hasLegend={false}
        />
      )}

      {/* LEGENDA */}
      <View style={styles.legend}>
        {displayedCategories.map((category) => (
          <View key={category.name} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: category.color }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendName, { color: colors.text }]}>
                {category.name}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {formatCurrency(category.total)} ({category.percentage.toFixed(0)}%)
              </Text>
            </View>
          </View>
        ))}
        {hasOthers && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#999999' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendName, { color: colors.text }]}>
                Outros
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {formatCurrency(othersTotal)} ({othersPercentage.toFixed(0)}%)
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* MODAL COM TODAS AS CATEGORIAS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* HEADER DO MODAL */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  📊 Todas as Categorias
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Total: {formatCurrency(totalExpenses)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeButton, { backgroundColor: colors.background }]}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* 🆕 REMOVER GRÁFICO - Só lista agora */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* LISTA COMPLETA */}
              <View style={styles.modalList}>
                {allCategories.map((category, index) => (
                  <View
                    key={category.name}
                    style={[
                      styles.modalListItem,
                      index < allCategories.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.modalListLeft}>
                      <View style={[styles.modalListColor, { backgroundColor: category.color }]} />
                      <View>
                        <Text style={[styles.modalListName, { color: colors.text }]}>
                          {category.name}
                        </Text>
                        <Text style={[styles.modalListPercentage, { color: colors.textSecondary }]}>
                          {category.percentage.toFixed(1)}% do total
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.modalListValue, { color: colors.text }]}>
                      {formatCurrency(category.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    marginTop: 0, // 🆕 Sem margem se não tiver gráfico
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalList: {
    marginTop: 20,
    gap: 0,
  },
  modalListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalListColor: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  modalListName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalListPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalListValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});