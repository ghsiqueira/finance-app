import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { goalAPI } from '../services/api';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLE_ICONS = {
  owner: { icon: 'ribbon', color: '#FFD700' },
  admin: { icon: 'shield-checkmark', color: '#FF6B6B' },
  contributor: { icon: 'share-social', color: '#4ECDC4' },
  viewer: { icon: 'eye', color: '#95E1D3' }
};

const ROLE_LABELS = {
  owner: 'Dono',
  admin: 'Admin',
  contributor: 'Colaborador',
  viewer: 'Visualizador'
};

export default function GoalsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invitesCount, setInvitesCount] = useState(0);

  useEffect(() => {
    loadGoals();
    loadInvitesCount();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGoals();
      loadInvitesCount();
    });
    return unsubscribe;
  }, [navigation]);

  const loadGoals = async () => {
    try {
      const response = await goalAPI.getAll();
      setGoals(response.data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInvitesCount = async () => {
    try {
      const response = await goalAPI.getInvites();
      setInvitesCount(response.data.length);
    } catch (error) {
      console.error('Error loading invites count:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
    loadInvitesCount();
  };

  const handleDeleteGoal = (id: string, isOwner: boolean) => {
    if (!isOwner) {
      Alert.alert('Aviso', 'Você não pode excluir metas compartilhadas. Use "Sair da Meta" na tela de edição.');
      return;
    }

    Alert.alert(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalAPI.delete(id);
              loadGoals();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir meta');
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

  const getDaysRemaining = (deadline: Date) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'Atrasada';
    if (days === 0) return 'Hoje';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };

  const getMemberInfo = (goal: any) => {
    if (!user?.id) return null;
    return goal.members?.find((m: any) => 
      m.userId?._id?.toString() === user.id || m.userId?.toString() === user.id
    );
  };

  const getTargetPerMember = (goal: any) => {
    if (!goal.autoSplit || !goal.members || goal.members.length === 0) {
      return goal.targetAmount;
    }
    return goal.targetAmount / goal.members.length;
  };

  const renderGoal = ({ item }: any) => {
    const percentage = (item.currentAmount / item.targetAmount) * 100;
    const remaining = item.targetAmount - item.currentAmount;
    const daysRemaining = differenceInDays(new Date(item.deadline), new Date());
    const isOverdue = daysRemaining < 0 && !item.isCompleted;
    const memberInfo = getMemberInfo(item);
    const isOwner = memberInfo?.role === 'owner';
    const targetPerMember = getTargetPerMember(item);

    const progressColor = item.isCompleted 
      ? colors.success 
      : isOverdue 
      ? colors.error 
      : colors.primary;

    return (
      <TouchableOpacity
        style={[
          styles.goalCard,
          { backgroundColor: colors.card },
          isOverdue && { borderColor: colors.error, borderWidth: 2 }
        ]}
        onPress={() => navigation.navigate('EditGoal', { goal: item })}
        onLongPress={() => handleDeleteGoal(item._id, isOwner)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalHeaderLeft}>
            {item.categoryId && (
              <View style={[styles.categoryIcon, { backgroundColor: item.categoryId.color }]}>
                <Ionicons name={item.categoryId.icon} size={20} color="#fff" />
              </View>
            )}
            <View style={styles.goalTitleContainer}>
              <Text style={[styles.goalName, { color: colors.text }]}>{item.name}</Text>
              {item.isShared && memberInfo && (
                <View style={styles.badgeRow}>
                  <View style={[styles.sharedBadge, { backgroundColor: colors.success }]}>
                    <Ionicons name="people" size={12} color="#fff" />
                    <Text style={styles.sharedBadgeText}>
                      Compartilhada ({item.members?.length || 0})
                    </Text>
                  </View>
                  {memberInfo && (
                    <View style={[styles.roleBadge, { backgroundColor: ROLE_ICONS[memberInfo.role as keyof typeof ROLE_ICONS].color }]}>
                      <Ionicons 
                        name={ROLE_ICONS[memberInfo.role as keyof typeof ROLE_ICONS].icon as any} 
                        size={10} 
                        color="#fff" 
                      />
                      <Text style={styles.roleBadgeText}>
                        {ROLE_LABELS[memberInfo.role as keyof typeof ROLE_LABELS]}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentage, { color: progressColor }]}>
              {percentage.toFixed(0)}%
            </Text>
            {item.isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: progressColor
              }
            ]}
          />
        </View>

        {item.isShared && item.autoSplit && item.members && item.members.length > 0 && (
          <View style={[styles.splitInfo, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
            <Ionicons name="people-circle" size={16} color={colors.info} />
            <Text style={[styles.splitText, { color: colors.info }]}>
              Sua parte: {formatCurrency(targetPerMember)} 
              {memberInfo?.currentContribution > 0 && (
                <Text style={{ fontWeight: 'bold' }}>
                  {' '}(Você: {formatCurrency(memberInfo.currentContribution)})
                </Text>
              )}
            </Text>
          </View>
        )}

        {memberInfo?.contributionLimit && (
          <View style={[styles.limitInfo, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.limitText, { color: colors.warning }]}>
              Seu limite: {formatCurrency(memberInfo.contributionLimit)} 
              {' '}(Restante: {formatCurrency(memberInfo.contributionLimit - memberInfo.currentContribution)})
            </Text>
          </View>
        )}

        <View style={styles.amountsRow}>
          <View>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Atual</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>{formatCurrency(item.currentAmount)}</Text>
          </View>
          <View>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Meta</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>{formatCurrency(item.targetAmount)}</Text>
          </View>
          <View>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Falta</Text>
            <Text style={[styles.amountValue, { color: colors.expense }]}>{formatCurrency(remaining)}</Text>
          </View>
        </View>

        <View style={styles.goalFooter}>
          <View style={styles.deadlineInfo}>
            <Ionicons 
              name={isOverdue ? 'alert-circle' : 'time-outline'} 
              size={16} 
              color={isOverdue ? colors.error : colors.textSecondary} 
            />
            <Text style={[styles.daysRemaining, { color: isOverdue ? colors.error : colors.textSecondary }]}>
              {getDaysRemaining(item.deadline)}
            </Text>
          </View>
          <Text style={[styles.deadlineDate, { color: colors.textSecondary }]}>
            {format(new Date(item.deadline), "dd/MM/yyyy")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Metas</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.invitesButton, { backgroundColor: colors.warning }]}
            onPress={() => navigation.navigate('GoalInvites')}
          >
            <Ionicons name="mail" size={20} color="#fff" />
            {invitesCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{invitesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddGoal')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item._id}
        renderItem={renderGoal}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma meta criada</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Crie sua primeira meta financeira
            </Text>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  invitesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
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
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  splitText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysRemaining: {
    fontSize: 14,
    fontWeight: '600',
  },
  deadlineDate: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
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
  },
});
