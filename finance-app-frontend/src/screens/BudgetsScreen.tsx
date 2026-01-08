import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { budgetAPI } from '../services/api';
import { format } from 'date-fns';
import { BudgetSkeleton } from '../components/SkeletonLoader';

export default function BudgetsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const response = await budgetAPI.getAll();
      setBudgets(response.data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets();
  };

  const handleDeleteBudget = (id: string, name: string) => {
    Alert.alert(
      'Excluir Orçamento',
      `Tem certeza que deseja excluir o orçamento "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetAPI.delete(id);
              loadBudgets();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir orçamento');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return colors.error;
    if (percentage >= 80) return colors.warning;
    return colors.success;
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return 'alert-circle';
    if (percentage >= 80) return 'warning';
    return 'checkmark-circle';
  };

  const renderBudget = ({ item }: any) => {
    const percentage = Math.min(item.percentage || 0, 100);
    const statusColor = getStatusColor(item.percentage);

    return (
      <TouchableOpacity
        style={[styles.budgetCard, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('EditBudget', { budget: item })}
        onLongPress={() => handleDeleteBudget(item._id, item.name)}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: item.categoryId?.color }]}>
              <Ionicons name={item.categoryId?.icon || 'help'} size={24} color="#fff" />
            </View>
            <View style={styles.budgetText}>
              <Text style={[styles.budgetName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.budgetCategory, { color: colors.textSecondary }]}>{item.categoryId?.name}</Text>
            </View>
          </View>
          <Ionicons name={getStatusIcon(item.percentage)} size={24} color={statusColor} />
        </View>

        <View style={styles.budgetAmounts}>
          <View style={styles.amountBox}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Gasto</Text>
            <Text style={[styles.amountValue, { color: statusColor }]}>
              {formatCurrency(item.spent || 0)}
            </Text>
          </View>
          <View style={[styles.amountDivider, { backgroundColor: colors.border }]} />
          <View style={styles.amountBox}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Orçamento</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={[styles.amountDivider, { backgroundColor: colors.border }]} />
          <View style={styles.amountBox}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Restante</Text>
            <Text style={[styles.amountValue, { color: item.remaining >= 0 ? colors.success : colors.error }]}>
              {formatCurrency(item.remaining || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentage}%`, backgroundColor: statusColor }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>{item.percentage.toFixed(0)}%</Text>
        </View>

        {item.dailyAverage > 0 && (
          <View style={[styles.dailyAverageContainer, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.dailyAverageText, { color: colors.textSecondary }]}>
              Você pode gastar <Text style={[styles.dailyAverageBold, { color: colors.primary }]}>{formatCurrency(item.dailyAverage)}/dia</Text> pelos próximos {item.daysUntilRenewal} dias
            </Text>
          </View>
        )}

        <View style={[styles.renewalInfo, { borderTopColor: colors.border }]}>
          <Ionicons name="sync-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.renewalText, { color: colors.textSecondary }]}>
            Renova em {format(new Date(item.nextRenewal), "dd/MM/yyyy")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 🎨 SKELETON LOADING
  if (loading && budgets.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Orçamentos</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddBudget')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 20 }}>
            <BudgetSkeleton />
            <BudgetSkeleton />
            <BudgetSkeleton />
            <BudgetSkeleton />
            <BudgetSkeleton />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Orçamentos</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddBudget')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item._id}
        renderItem={renderBudget}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary} 
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum orçamento criado</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Crie orçamentos para controlar seus gastos
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddBudget')}
            >
              <Text style={styles.emptyButtonText}>Criar Orçamento</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  budgetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetText: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  budgetCategory: {
    fontSize: 14,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountDivider: {
    width: 1,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 45,
    textAlign: 'right',
  },
  dailyAverageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  dailyAverageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  dailyAverageBold: {
    fontWeight: 'bold',
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  renewalText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});