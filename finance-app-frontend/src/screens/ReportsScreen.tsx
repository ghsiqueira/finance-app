import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI, categoryAPI } from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last3' | 'last6' | 'year'>('current');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (applyFilters = false) => {
    try {
      const params: any = {};
      
      if (applyFilters) {
        if (selectedPeriod !== 'current') {
          params.period = selectedPeriod;
        }
        if (selectedCategory) {
          params.category = selectedCategory;
        }
      }

      const [reportResponse, catResponse] = await Promise.all([
        transactionAPI.getReports(params),
        categoryAPI.getAll()
      ]);
      setReportData(reportResponse.data);
      setCategories(catResponse.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return `${value.toFixed(0)}`;
  };

  const getFilteredExpensesByCategory = () => {
    if (!reportData) return [];
    
    let filtered = reportData.expensesByCategory;
    
    if (selectedCategory) {
      filtered = filtered.filter((item: any) => item.name === selectedCategory);
    }
    
    return filtered;
  };

  const getInsight = () => {
    if (!reportData) return '';
    
    const { totalIncome, totalExpenses, balance } = reportData.currentMonth;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    if (balance < 0) {
      return `⚠️ Atenção! Você gastou R$ ${Math.abs(balance).toFixed(2)} a mais do que ganhou este mês.`;
    } else if (savingsRate >= 20) {
      return `🎉 Parabéns! Você economizou ${savingsRate.toFixed(0)}% da sua renda este mês!`;
    } else if (savingsRate >= 10) {
      return `👍 Bom trabalho! Você economizou ${savingsRate.toFixed(0)}% da sua renda este mês.`;
    } else if (savingsRate > 0) {
      return `💡 Você economizou ${savingsRate.toFixed(0)}% da sua renda. Tente aumentar para 20%!`;
    }
    return '📊 Continue acompanhando seus gastos!';
  };

  const getTopCategory = () => {
    const filtered = getFilteredExpensesByCategory();
    if (filtered.length === 0) return null;
    return filtered[0];
  };

  const clearFilters = () => {
    setSelectedPeriod('current');
    setSelectedCategory(null);
    setFilterModalVisible(false);
    loadData(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedPeriod !== 'current') count++;
    if (selectedCategory) count++;
    return count;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="bar-chart-outline" size={64} color={colors.border} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sem dados para exibir</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Adicione transações para ver seus relatórios
        </Text>
      </View>
    );
  }

  const filteredExpenses = getFilteredExpensesByCategory();
  
  const pieData = filteredExpenses.map((item: any) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: colors.text,
    legendFontSize: 12
  }));

  const maxValue = Math.max(
    ...reportData.last6Months.map((m: any) => Math.max(m.income, m.expenses))
  );

  const lineData = {
    labels: reportData.last6Months.map((m: any) => m.month.charAt(0).toUpperCase() + m.month.slice(1)),
    datasets: [
      {
        data: reportData.last6Months.map((m: any) => m.balance),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3
      }
    ]
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary
    }
  };

  const chartConfigWithFormat = {
    ...chartConfig,
    formatYLabel: (yLabel: string) => {
      const value = parseFloat(yLabel);
      if (isNaN(value)) return yLabel;
      return formatCompactCurrency(value);
    }
  };

  const topCategory = getTopCategory();
  const savingsRate = reportData.currentMonth.totalIncome > 0 
    ? ((reportData.currentMonth.balance / reportData.currentMonth.totalIncome) * 100) 
    : 0;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Relatórios</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Análise financeira</Text>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options" size={24} color={colors.primary} />
          {getActiveFiltersCount() > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.insightCard, { backgroundColor: colors.primary + '20', borderLeftColor: colors.primary }]}>
        <Text style={[styles.insightText, { color: colors.primary }]}>{getInsight()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.incomeCard, { backgroundColor: colors.card, borderLeftColor: colors.income }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="arrow-down-circle" size={32} color={colors.income} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Receitas</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(reportData.currentMonth.totalIncome)}
          </Text>
        </View>

        <View style={[styles.statCard, styles.expenseCard, { backgroundColor: colors.card, borderLeftColor: colors.expense }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="arrow-up-circle" size={32} color={colors.expense} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Despesas</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(reportData.currentMonth.totalExpenses)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.balanceCard, { backgroundColor: colors.card, borderLeftColor: reportData.currentMonth.balance >= 0 ? colors.success : colors.error }]}>
          <View style={styles.statIconContainer}>
            <Ionicons 
              name={reportData.currentMonth.balance >= 0 ? "trending-up" : "trending-down"} 
              size={32} 
              color={reportData.currentMonth.balance >= 0 ? colors.success : colors.error} 
            />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saldo</Text>
          <Text style={[styles.statValue, { color: reportData.currentMonth.balance >= 0 ? colors.success : colors.error }]}>
            {formatCurrency(reportData.currentMonth.balance)}
          </Text>
        </View>

        <View style={[styles.statCard, styles.savingsCard, { backgroundColor: colors.card, borderLeftColor: colors.warning }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="wallet" size={32} color={colors.warning} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taxa de Economia</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {savingsRate.toFixed(1)}%
          </Text>
        </View>
      </View>

      {topCategory && (
        <View style={[styles.highlightCard, { backgroundColor: colors.card }]}>
          <View style={styles.highlightHeader}>
            <Ionicons name="trending-up" size={24} color={colors.warning} />
            <Text style={[styles.highlightTitle, { color: colors.text }]}>Categoria com Mais Gastos</Text>
          </View>
          <View style={styles.highlightContent}>
            <View style={[styles.highlightIcon, { backgroundColor: topCategory.color }]}>
              <Ionicons name="cash" size={32} color="#fff" />
            </View>
            <View style={styles.highlightInfo}>
              <Text style={[styles.highlightCategory, { color: colors.text }]}>{topCategory.name}</Text>
              <Text style={[styles.highlightAmount, { color: colors.expense }]}>{formatCurrency(topCategory.amount)}</Text>
              <Text style={[styles.highlightPercentage, { color: colors.textSecondary }]}>
                {((topCategory.amount / reportData.currentMonth.totalExpenses) * 100).toFixed(1)}% do total de despesas
              </Text>
            </View>
          </View>
        </View>
      )}

      {pieData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="pie-chart" size={24} color={colors.primary} />
              <Text style={[styles.chartTitle, { color: colors.text }]}>Distribuição de Despesas</Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Por categoria no período</Text>
          </View>
          <View style={styles.chartWrapper}>
            <PieChart
              data={pieData}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
              hasLegend={false}
            />
          </View>
          <View style={styles.pieChartLegend}>
            {filteredExpenses.map((item: any, index: number) => (
              <View key={index} style={[styles.legendRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.name}</Text>
                <Text style={[styles.legendValue, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* GRÁFICO CUSTOMIZADO DE BARRAS */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Ionicons name="bar-chart" size={24} color={colors.primary} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Receitas vs Despesas</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Últimos 6 meses</Text>
        </View>
        
        <View style={styles.customBarChart}>
          {/* Eixo Y */}
          <View style={styles.yAxis}>
            <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>{formatCompactCurrency(maxValue)}</Text>
            <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>{formatCompactCurrency(maxValue * 0.75)}</Text>
            <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>{formatCompactCurrency(maxValue * 0.5)}</Text>
            <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>{formatCompactCurrency(maxValue * 0.25)}</Text>
            <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>0</Text>
          </View>

          {/* Barras */}
          <View style={styles.barsContainer}>
            {reportData.last6Months.map((month: any, index: number) => (
              <View key={index} style={styles.monthColumn}>
                <View style={styles.barsGroup}>
                  {/* Barra de Receita */}
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        { backgroundColor: colors.income },
                        { height: `${(month.income / maxValue) * 100}%` }
                      ]}
                    >
                      {month.income > 0 && (
                        <Text style={styles.barValue}>
                          {formatCompactCurrency(month.income)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Barra de Despesa */}
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        { backgroundColor: colors.expense },
                        { height: `${(month.expenses / maxValue) * 100}%` }
                      ]}
                    >
                      {month.expenses > 0 && (
                        <Text style={styles.barValue}>
                          {formatCompactCurrency(month.expenses)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Label do mês */}
                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                  {month.month.charAt(0).toUpperCase() + month.month.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Receitas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Despesas</Text>
          </View>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Ionicons name="trending-up" size={24} color={colors.primary} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Evolução do Saldo</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Últimos 6 meses</Text>
        </View>
        <View style={styles.chartWrapper}>
          <LineChart
            data={lineData}
            width={screenWidth - 80}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfigWithFormat,
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.border,
                strokeWidth: 1
              },
              propsForDots: {
                r: '8',
                strokeWidth: '3',
                stroke: colors.primary,
                fill: colors.card
              }
            }}
            style={styles.chart}
            bezier
            withShadow={false}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
          />
        </View>
        
        {/* Tabela de detalhes do saldo */}
        <View style={[styles.balanceDetailsTable, { borderTopColor: colors.border }]}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.primary }]}>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Mês</Text>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Saldo</Text>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Crescimento</Text>
          </View>
          {reportData.last6Months.map((item: any, index: number) => {
            const previousBalance = index > 0 ? reportData.last6Months[index - 1].balance : null;
            const growth = previousBalance !== null ? item.balance - previousBalance : 0;
            
            let growthPercent = 0;
            if (previousBalance !== null && previousBalance !== 0) {
              growthPercent = (growth / Math.abs(previousBalance)) * 100;
            }
            
            return (
              <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.textSecondary }]}>
                  {item.month.charAt(0).toUpperCase() + item.month.slice(1)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellBold, { color: item.balance >= 0 ? colors.income : colors.expense }]}>
                  {formatCurrency(item.balance)}
                </Text>
                <View style={styles.growthCell}>
                  {index > 0 ? (
                    <>
                      <Ionicons 
                        name={growth >= 0 ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={growth >= 0 ? colors.income : colors.expense} 
                      />
                      <Text style={[styles.growthText, { color: growth >= 0 ? colors.income : colors.expense }]}>
                        {growth >= 0 ? '+' : ''}{formatCurrency(growth)}
                      </Text>
                      <Text style={[styles.growthPercent, { color: growth >= 0 ? colors.income : colors.expense }]}>
                        ({growthPercent >= 0 ? '+' : ''}{Math.abs(growthPercent).toFixed(1)}%)
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.growthText, { color: colors.textSecondary }]}>-</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Período</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'current', label: 'Mês Atual' },
                  { value: 'last3', label: 'Últimos 3 Meses' },
                  { value: 'last6', label: 'Últimos 6 Meses' },
                  { value: 'year', label: 'Último Ano' }
                ].map((period) => (
                  <TouchableOpacity
                    key={period.value}
                    style={[
                      styles.filterOption,
                      { borderColor: colors.border },
                      selectedPeriod === period.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedPeriod(period.value as any)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: colors.textSecondary },
                        selectedPeriod === period.value && { color: '#fff', fontWeight: 'bold' }
                      ]}
                    >
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: colors.text }]}>Categoria</Text>
              <View style={styles.categoriesGrid}>
                <TouchableOpacity
                  style={[
                    styles.categoryFilterItem,
                    { borderColor: colors.border },
                    !selectedCategory && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.categoryFilterText, { color: !selectedCategory ? '#fff' : colors.text }]}>Todas</Text>
                </TouchableOpacity>
                {categories.filter(c => c.type === 'expense').map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryFilterItem,
                      { borderColor: colors.border },
                      selectedCategory === category.name && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <View style={[styles.categoryFilterIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon} size={16} color="#fff" />
                    </View>
                    <Text style={[styles.categoryFilterText, { color: selectedCategory === category.name ? '#fff' : colors.text }]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.clearButton, { borderColor: colors.primary }]} onPress={clearFilters}>
                <Text style={[styles.clearButtonText, { color: colors.primary }]}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setFilterModalVisible(false);
                  loadData(true);
                }}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filterButton: {
    padding: 10,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightCard: {
    margin: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  insightText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    borderLeftWidth: 4,
  },
  expenseCard: {
    borderLeftWidth: 4,
  },
  balanceCard: {
    borderLeftWidth: 4,
  },
  savingsCard: {
    borderLeftWidth: 4,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  highlightCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  highlightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  highlightIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightInfo: {
    flex: 1,
  },
  highlightCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  highlightAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  highlightPercentage: {
    fontSize: 13,
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    fontSize: 13,
    marginLeft: 36,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieChartLegend: {
    marginTop: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  customBarChart: {
    flexDirection: 'row',
    height: 220,
    marginVertical: 10,
  },
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  monthColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    height: 180,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    minHeight: 2,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barValue: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  monthLabel: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceDetailsTable: {
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  growthCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  growthText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  growthPercent: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryFilterIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilterText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  clearButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footerSpace: {
    height: 40,
  },
});