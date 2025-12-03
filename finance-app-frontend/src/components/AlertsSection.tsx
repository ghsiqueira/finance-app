import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface BudgetAlert {
  budgetId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  percentage: number;
  spent: number;
  limit: number;
  remaining: number;
  severity: 'critical' | 'high' | 'medium';
}

interface AlertsSectionProps {
  budgetAlerts: BudgetAlert[];
  pendingInvitesCount: number;
}

export default function AlertsSection({ budgetAlerts, pendingInvitesCount }: AlertsSectionProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const hasAlerts = budgetAlerts.length > 0 || pendingInvitesCount > 0;

  if (!hasAlerts) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'high': return '#FF9800';
      case 'medium': return colors.warning;
      default: return colors.warning;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      default: return 'information-circle';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>⚠️ Alertas</Text>

      {/* Convites Pendentes */}
      {pendingInvitesCount > 0 && (
        <TouchableOpacity
          style={[styles.alertCard, { backgroundColor: colors.card }]}
          onPress={() => (navigation as any).navigate('Goals')}
        >
          <View style={[styles.alertIcon, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="mail" size={24} color={colors.info} />
          </View>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {pendingInvitesCount} {pendingInvitesCount === 1 ? 'convite pendente' : 'convites pendentes'}
            </Text>
            <Text style={[styles.alertDescription, { color: colors.textSecondary }]}>
              Você foi convidado para compartilhar metas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Alertas de Orçamento */}
      {budgetAlerts.slice(0, 3).map((alert, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.alertCard, { backgroundColor: colors.card }]}
          onPress={() => (navigation as any).navigate('Budgets')}
        >
          <View style={[styles.alertIcon, { backgroundColor: alert.categoryColor + '20' }]}>
            <Ionicons name={alert.categoryIcon as any} size={24} color={alert.categoryColor} />
          </View>
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                {alert.categoryName}
              </Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <Ionicons name={getSeverityIcon(alert.severity) as any} size={12} color="#fff" />
                <Text style={styles.severityText}>{alert.percentage.toFixed(0)}%</Text>
              </View>
            </View>
            <Text style={[styles.alertDescription, { color: colors.textSecondary }]}>
              {formatCurrency(alert.spent)} de {formatCurrency(alert.limit)} usado
            </Text>
            {alert.remaining < 0 ? (
              <Text style={[styles.alertWarning, { color: colors.error }]}>
                Orçamento excedido em {formatCurrency(Math.abs(alert.remaining))}
              </Text>
            ) : (
              <Text style={[styles.alertWarning, { color: colors.warning }]}>
                Restam apenas {formatCurrency(alert.remaining)}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}

      {budgetAlerts.length > 3 && (
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={() => (navigation as any).navigate('Budgets')}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            Ver mais {budgetAlerts.length - 3} alertas →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 13,
    marginBottom: 2,
  },
  alertWarning: {
    fontSize: 12,
    fontWeight: '600',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});