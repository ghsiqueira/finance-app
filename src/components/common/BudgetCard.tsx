import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Budget } from '../../types';

interface BudgetCardProps {
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
  onPress?: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
  onPress,
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getProgressPercentage = () => {
    return Math.min((budget.spent / budget.amount) * 100, 100);
  };

  const getStatusInfo = () => {
    const percentage = getProgressPercentage();
    const remaining = budget.amount - budget.spent;
    
    if (percentage >= 100) {
      return {
        status: 'exceeded',
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: 'warning' as const,
        message: `Excedido em ${formatCurrency(Math.abs(remaining))}`,
      };
    } else if (percentage >= budget.alertThreshold) {
      return {
        status: 'warning',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: 'alert-circle' as const,
        message: `Restam ${formatCurrency(remaining)}`,
      };
    } else {
      return {
        status: 'ok',
        color: '#16a34a',
        bgColor: '#dcfce7',
        icon: 'checkmark-circle' as const,
        message: `Restam ${formatCurrency(remaining)}`,
      };
    }
  };

  const getPeriodLabel = () => {
    switch (budget.period) {
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensal';
      case 'quarterly':
        return 'Trimestral';
      case 'yearly':
        return 'Anual';
      default:
        return budget.period;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir orçamento',
      `Tem certeza que deseja excluir o orçamento "${budget.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => onDelete?.(budget.id),
        },
      ]
    );
  };

  const statusInfo = getStatusInfo();
  const progressPercentage = getProgressPercentage();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(budget)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* 📊 HEADER */}
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: budget.category?.color + '20' || '#f3f4f6' }
            ]}>
              <Ionicons
                name={budget.category?.icon as any || 'wallet'}
                size={20}
                color={budget.category?.color || '#6b7280'}
              />
            </View>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetName}>{budget.name}</Text>
              <View style={styles.metadata}>
                <Text style={styles.categoryName}>
                  {budget.category?.name || 'Sem categoria'}
                </Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.period}>{getPeriodLabel()}</Text>
              </View>
            </View>
          </View>
          
          {/* 🎯 STATUS */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusInfo.bgColor }
          ]}>
            <Ionicons
              name={statusInfo.icon}
              size={14}
              color={statusInfo.color}
            />
          </View>
        </View>

        {/* 💰 VALORES */}
        <View style={styles.valuesSection}>
          <View style={styles.amountRow}>
            <Text style={styles.spentAmount}>
              {formatCurrency(budget.spent)}
            </Text>
            <Text style={styles.totalAmount}>
              de {formatCurrency(budget.amount)}
            </Text>
          </View>
          <Text style={[
            styles.statusMessage,
            { color: statusInfo.color }
          ]}>
            {statusInfo.message}
          </Text>
        </View>

        {/* 📊 BARRA DE PROGRESSO */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: statusInfo.color,
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercentage.toFixed(1)}%
          </Text>
        </View>

        {/* 📅 PERÍODO */}
        <View style={styles.periodSection}>
          <View style={styles.periodInfo}>
            <Ionicons name="calendar" size={14} color="#6b7280" />
            <Text style={styles.periodText}>
              {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </Text>
          </View>
          
          {budget.autoRenew && (
            <View style={styles.autoRenewBadge}>
              <Ionicons name="refresh" size={12} color="#3b82f6" />
              <Text style={styles.autoRenewText}>Auto renovar</Text>
            </View>
          )}
        </View>

        {/* 🔧 AÇÕES */}
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(budget)}
            >
              <Ionicons name="pencil" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface BudgetListProps {
  budgets: Budget[];
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
  onPress?: (budget: Budget) => void;
  emptyMessage?: string;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  onEdit,
  onDelete,
  onPress,
  emptyMessage = 'Nenhum orçamento encontrado',
}) => {
  if (budgets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          Crie um orçamento para controlar seus gastos
        </Text>
      </View>
    );
  }

  // Ordenar por status (excedidos primeiro, depois por % usado)
  const sortedBudgets = [...budgets].sort((a, b) => {
    const aPercentage = (a.spent / a.amount) * 100;
    const bPercentage = (b.spent / b.amount) * 100;
    
    // Excedidos primeiro
    if (aPercentage >= 100 && bPercentage < 100) return -1;
    if (bPercentage >= 100 && aPercentage < 100) return 1;
    
    // Depois por % usado (maior primeiro)
    return bPercentage - aPercentage;
  });

  return (
    <View style={styles.list}>
      {sortedBudgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          onEdit={onEdit}
          onDelete={onDelete}
          onPress={onPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    padding: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  period: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Valores
  valuesSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Progresso
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 35,
    textAlign: 'right',
  },
  
  // Período
  periodSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  autoRenewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoRenewText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Ações
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Lista vazia
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
});