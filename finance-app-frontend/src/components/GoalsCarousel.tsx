import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface Goal {
  goalId: string;
  name: string;
  categoryIcon: string;
  categoryColor: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  remaining: number;
  daysLeft: number;
  isShared: boolean;
  membersCount: number;
}

interface GoalsCarouselProps {
  goals: Goal[];
}

export default function GoalsCarousel({ goals }: GoalsCarouselProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (goals.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>🎯 Suas Metas</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Goals')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Você ainda não tem metas
          </Text>
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => (navigation as any).navigate('Goals')}
          >
            <Text style={styles.createButtonText}>Criar Meta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🎯 Suas Metas</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Goals')}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todas →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={screenWidth - 60}
        decelerationRate="fast"
      >
        {goals.map((goal, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.goalCard, { backgroundColor: colors.card }]}
            onPress={() => (navigation as any).navigate('EditGoal', { goalId: goal.goalId })}
            activeOpacity={0.7}
          >
            {/* Header do Card */}
            <View style={styles.goalHeader}>
              <View style={[styles.iconCircle, { backgroundColor: goal.categoryColor + '20' }]}>
                <Ionicons name={goal.categoryIcon as any} size={28} color={goal.categoryColor} />
              </View>
              {goal.isShared && (
                <View style={[styles.sharedBadge, { backgroundColor: colors.info }]}>
                  <Ionicons name="people" size={12} color="#fff" />
                  <Text style={styles.sharedBadgeText}>{goal.membersCount}</Text>
                </View>
              )}
            </View>

            {/* Nome da Meta */}
            <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={2}>
              {goal.name}
            </Text>

            {/* Valores */}
            <View style={styles.valuesRow}>
              <Text style={[styles.currentAmount, { color: colors.success }]}>
                {formatCurrency(goal.currentAmount)}
              </Text>
              <Text style={[styles.targetAmount, { color: colors.textSecondary }]}>
                / {formatCurrency(goal.targetAmount)}
              </Text>
            </View>

            {/* Barra de Progresso */}
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: goal.categoryColor,
                    width: `${Math.min(goal.percentage, 100)}%`
                  }
                ]} 
              />
            </View>

            {/* Informações Adicionais */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Progresso</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {goal.percentage.toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Faltam</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatCurrency(goal.remaining)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Prazo</Text>
                <Text style={[styles.infoValue, { color: goal.daysLeft < 30 ? colors.error : colors.text }]}>
                  {goal.daysLeft}d
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  goalCard: {
    width: Dimensions.get('window').width - 80,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sharedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  targetAmount: {
    fontSize: 16,
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});