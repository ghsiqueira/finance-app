import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { goalAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GoalInvitesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const response = await goalAPI.getInvites();
      setInvites(response.data);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (goalId: string, accept: boolean) => {
    try {
      setResponding(goalId);
      await goalAPI.respondToInvite(goalId, accept);
      Alert.alert('Sucesso', accept ? 'Convite aceito!' : 'Convite recusado');
      loadInvites();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao responder convite');
    } finally {
      setResponding(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderInvite = ({ item }: any) => {
    const percentage = (item.currentAmount / item.targetAmount) * 100;

    return (
      <View style={[styles.inviteCard, { backgroundColor: colors.card }]}>
        <View style={styles.inviteHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="flag" size={24} color={colors.primary} />
          </View>
          <View style={styles.inviteInfo}>
            <Text style={[styles.goalName, { color: colors.text }]}>{item.goalName}</Text>
            <Text style={[styles.invitedBy, { color: colors.textSecondary }]}>
              Convidado por {item.invitedBy.name}
            </Text>
          </View>
        </View>

        <View style={styles.goalDetails}>
          <View style={styles.amountRow}>
            <Text style={[styles.currentAmount, { color: colors.text }]}>
              {formatCurrency(item.currentAmount)}
            </Text>
            <Text style={[styles.targetAmount, { color: colors.textSecondary }]}>
              de {formatCurrency(item.targetAmount)}
            </Text>
          </View>

          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: colors.primary }]}
            />
          </View>

          <Text style={[styles.deadline, { color: colors.textSecondary }]}>
            Meta: {format(new Date(item.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.rejectButton, { backgroundColor: colors.error }]}
            onPress={() => handleRespond(item.goalId, false)}
            disabled={responding === item.goalId}
          >
            {responding === item.goalId ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.buttonText}>Recusar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={() => handleRespond(item.goalId, true)}
            disabled={responding === item.goalId}
          >
            {responding === item.goalId ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>Aceitar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Convites de Metas</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.goalId}
        renderItem={renderInvite}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhum convite pendente
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
  },
  inviteCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invitedBy: {
    fontSize: 13,
  },
  goalDetails: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  targetAmount: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  deadline: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});