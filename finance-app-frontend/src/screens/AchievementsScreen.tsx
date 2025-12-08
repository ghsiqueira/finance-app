import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { achievementAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function AchievementsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, percentage: 0, unseen: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas', icon: 'apps' },
    { id: 'transactions', label: 'Transações', icon: 'list' },
    { id: 'savings', label: 'Economia', icon: 'cash' },
    { id: 'budgets', label: 'Orçamentos', icon: 'wallet' },
    { id: 'goals', label: 'Metas', icon: 'flag' },
    { id: 'streak', label: 'Sequência', icon: 'flame' },
    { id: 'special', label: 'Especiais', icon: 'star' },
  ];

  const loadAchievements = async () => {
    try {
      const response = await achievementAPI.getAll();
      setAchievements(response.data.achievements);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAchievements();
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = filteredAchievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Conquistas</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conquistas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ESTATÍSTICAS */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.unlocked}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Desbloqueadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.percentage}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completo</Text>
            </View>
          </View>
          
          {/* BARRA DE PROGRESSO */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  backgroundColor: colors.primary,
                  width: `${stats.percentage}%`
                }
              ]} 
            />
          </View>
        </View>

        {/* FILTROS DE CATEGORIA */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all' 
              ? achievements.length 
              : achievements.filter(a => a.category === cat.id).length;
            
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={isSelected ? '#fff' : colors.textSecondary} 
                />
                <Text style={[
                  styles.categoryChipText,
                  { color: isSelected ? '#fff' : colors.text }
                ]}>
                  {cat.label}
                </Text>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: isSelected ? '#ffffff30' : colors.border }
                ]}>
                  <Text style={[
                    styles.categoryBadgeText,
                    { color: isSelected ? '#fff' : colors.textSecondary }
                  ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* CONTADOR */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {unlockedCount} de {filteredAchievements.length} desbloqueadas
        </Text>

        {/* LISTA DE CONQUISTAS */}
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                { 
                  backgroundColor: colors.card,
                  opacity: achievement.unlocked ? 1 : 0.5
                }
              ]}
            >
              {/* ÍCONE */}
              <View 
                style={[
                  styles.achievementIcon,
                  { 
                    backgroundColor: achievement.unlocked 
                      ? achievement.color + '20' 
                      : colors.border
                  }
                ]}
              >
                <Ionicons 
                  name={achievement.icon as any} 
                  size={32} 
                  color={achievement.unlocked ? achievement.color : colors.textSecondary} 
                />
              </View>

              {/* INFO */}
              <Text style={[styles.achievementTitle, { color: colors.text }]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                {achievement.description}
              </Text>

              {/* STATUS */}
              {achievement.unlocked ? (
                <View style={[styles.achievementBadge, { backgroundColor: achievement.color + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={achievement.color} />
                  <Text style={[styles.achievementBadgeText, { color: achievement.color }]}>
                    Desbloqueada
                  </Text>
                </View>
              ) : (
                <View style={[styles.achievementBadge, { backgroundColor: colors.border }]}>
                  <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                  <Text style={[styles.achievementBadgeText, { color: colors.textSecondary }]}>
                    Bloqueada
                  </Text>
                </View>
              )}

              {/* DATA DE DESBLOQUEIO */}
              {achievement.unlocked && achievement.unlockedAt && (
                <Text style={[styles.achievementDate, { color: colors.textSecondary }]}>
                  {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementsGrid: {
    gap: 12,
  },
  achievementCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  achievementBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  achievementDate: {
    fontSize: 11,
    marginTop: 4,
  },
});