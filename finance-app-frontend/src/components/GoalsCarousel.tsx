import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const screenWidth = Dimensions.get('window').width;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const adjustColorForDarkMode = (color: string) => {
    if (colorScheme !== 'dark') return color;
    
    const colorMap: { [key: string]: string } = {
      '#007AFF': '#5E9FFF',
      '#34C759': '#5DD97C',
      '#FF9500': '#FFB340',
      '#AF52DE': '#C77DFF',
      '#FF3B30': '#FF6961',
      '#5856D6': '#8E8BF7',
      '#FF2D55': '#FF6B8A',
      '#FFCC00': '#FFD84D',
    };

    return colorMap[color.toUpperCase()] || color;
  };

  const successColor = colorScheme === 'dark' ? '#5DD97C' : '#34C759';
  const primaryColor = colorScheme === 'dark' ? '#5E9FFF' : '#007AFF';
  const errorColor = colorScheme === 'dark' ? '#FF6961' : '#FF3B30';

  if (goals.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>🎯 Suas Metas</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
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
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🎯 Suas Metas</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Goals')}>
          <Text style={[styles.seeAllText, { color: primaryColor }]}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={screenWidth - 80}
        decelerationRate="fast"
      >
        {goals.map((goal, index) => {
          const adjustedColor = adjustColorForDarkMode(goal.categoryColor);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.goalCard, 
                { 
                  backgroundColor: adjustedColor,
                  borderWidth: 1.5,
                  borderColor: adjustedColor,
                }
              ]}
              onPress={() => (navigation as any).navigate('EditGoal', { goal: goal })}
              activeOpacity={0.7}
            >
              {/* Header do Card */}
              <View style={styles.goalHeader}>
                <View style={[
                  styles.iconCircle, 
                  { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                ]}>
                  <Ionicons name={goal.categoryIcon as any} size={26} color="#FFFFFF" />
                </View>
                {goal.isShared && (
                  <View style={[
                    styles.sharedBadge, 
                    { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                  ]}>
                    <Ionicons name="people" size={12} color="#FFFFFF" />
                    <Text style={[styles.sharedBadgeText, { color: '#FFFFFF' }]}>
                      {goal.membersCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Nome da Meta */}
              <Text style={[styles.goalName, { color: '#FFFFFF' }]} numberOfLines={2}>
                {goal.name}
              </Text>

              {/* Valores */}
              <View style={styles.amountRow}>
                <Text style={[styles.currentAmount, { color: '#FFFFFF' }]}>
                  {formatCurrency(goal.currentAmount)}
                </Text>
                <Text style={[styles.targetAmount, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                  de {formatCurrency(goal.targetAmount)}
                </Text>
              </View>

              {/* Barra de Progresso */}
              <View style={[
                styles.progressBar, 
                { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
              ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(goal.percentage, 100)}%`,
                      backgroundColor: '#FFFFFF'
                    }
                  ]}
                />
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerItem}>
                  <Ionicons name="trending-up" size={14} color="#FFFFFF" />
                  <Text style={[styles.footerText, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                    {goal.percentage.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons 
                    name="time-outline" 
                    size={14} 
                    color={goal.daysLeft < 0 ? '#FFE5E5' : '#FFFFFF'} 
                  />
                  <Text 
                    style={[
                      styles.footerText, 
                      { color: goal.daysLeft < 0 ? '#FFE5E5' : 'rgba(255, 255, 255, 0.9)' }
                    ]}
                  >
                    {goal.daysLeft > 0 ? `${goal.daysLeft} dias` : 'Atrasada'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
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
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingRight: 20,
  },
  goalCard: {
    width: Dimensions.get('window').width - 96,
    marginRight: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  targetAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});