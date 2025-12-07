import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI, recurrenceAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import RecurrenceConfigModal from '../components/RecurrenceConfigModal';

export default function RecurringTransactionsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [nonRecurringTransactions, setNonRecurringTransactions] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const loadRecurringTransactions = async () => {
    try {
      console.log('📡 Carregando recorrências...');
      const response = await recurrenceAPI.getAll();
      console.log('✅ Recebido:', response.data.length, 'recorrências');
      
      const filtered = response.data.filter((t: any) => t.recurringConfig?.frequency);
      console.log('✅ Filtradas:', filtered.length, 'recorrências válidas');
      
      setRecurringTransactions(filtered);
    } catch (error) {
      console.error('❌ Erro ao carregar recorrências:', error);
      Alert.alert('Erro', 'Falha ao carregar transações recorrentes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNonRecurringTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      const filtered = response.data
        .filter((t: any) => !t.recurringConfig?.frequency)
        .slice(0, 10); 
      setNonRecurringTransactions(filtered);
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecurringTransactions();
      loadNonRecurringTransactions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRecurringTransactions();
    loadNonRecurringTransactions();
  };

  const handlePauseResume = async (transaction: any) => {
    const action = transaction.isRecurring ? 'pausar' : 'retomar';
    
    console.log('🔄 Ação:', action, 'para transação:', transaction._id);
    console.log('📊 Estado atual:', { isRecurring: transaction.isRecurring });
    
    Alert.alert(
      transaction.isRecurring ? 'Pausar Recorrência' : 'Retomar Recorrência',
      transaction.isRecurring 
        ? `Tem certeza que deseja pausar "${transaction.description}"?\n\nNovas transações não serão geradas automaticamente.`
        : `Tem certeza que deseja retomar "${transaction.description}"?\n\nNovas transações serão geradas automaticamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: transaction.isRecurring ? 'Pausar' : 'Retomar',
          onPress: async () => {
            try {
              setActionLoading(transaction._id);
              
              console.log('📡 Chamando API:', action);
              
              let response;
              if (transaction.isRecurring) {
                response = await recurrenceAPI.pause(transaction._id);
              } else {
                response = await recurrenceAPI.resume(transaction._id);
              }
              
              console.log('✅ Resposta da API:', response.data);
              
              Alert.alert(
                'Sucesso', 
                transaction.isRecurring 
                  ? 'Recorrência pausada com sucesso'
                  : 'Recorrência retomada com sucesso'
              );
              
              setTimeout(() => {
                loadRecurringTransactions();
              }, 500);
            } catch (error: any) {
              console.error(`❌ Erro ao ${action}:`, error);
              console.error('Detalhes:', error.response?.data);
              Alert.alert('Erro', `Falha ao ${action} recorrência`);
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleDelete = (transaction: any) => {
    Alert.alert(
      'Cancelar Recorrência',
      `Tem certeza que deseja cancelar a recorrência de "${transaction.description}"?\n\nA transação original será mantida, mas não serão geradas novas transações automaticamente.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(transaction._id);
              await recurrenceAPI.delete(transaction._id, false);
              Alert.alert('Sucesso', 'Recorrência cancelada. A transação foi mantida.');
              loadRecurringTransactions();
              loadNonRecurringTransactions();
            } catch (error) {
              console.error('Error deleting recurrence:', error);
              Alert.alert('Erro', 'Falha ao cancelar recorrência');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleAddRecurrence = async (frequency: string, dayOfMonth?: number) => {
    if (!selectedTransaction) return;

    try {
      setActionLoading(selectedTransaction._id);
      await recurrenceAPI.addToTransaction(selectedTransaction._id, {
        frequency,
        dayOfMonth,
        isBusinessDay: false,
      });
      
      setShowModal(false);
      setSelectedTransaction(null);
      Alert.alert('Sucesso', 'Recorrência adicionada com sucesso!');
      
      setTimeout(() => {
        loadRecurringTransactions();
        loadNonRecurringTransactions();
      }, 500);
    } catch (error) {
      console.error('❌ Erro ao adicionar recorrência:', error);
      Alert.alert('Erro', 'Falha ao adicionar recorrência');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditRecurrence = async (frequency: string, dayOfMonth?: number) => {
    if (!selectedTransaction) return;

    try {
      setActionLoading(selectedTransaction._id);
      await recurrenceAPI.editRecurrence(selectedTransaction._id, {
        frequency,
        dayOfMonth,
        isBusinessDay: false,
      });
      
      setShowModal(false);
      setSelectedTransaction(null);
      Alert.alert('Sucesso', 'Recorrência atualizada com sucesso!');
      
      setTimeout(() => {
        loadRecurringTransactions();
      }, 500);
    } catch (error) {
      console.error('❌ Erro ao editar recorrência:', error);
      Alert.alert('Erro', 'Falha ao editar recorrência');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getFrequencyLabel = (config: any) => {
    if (!config) return 'Mensal';
    
    const labels: { [key: string]: string } = {
      daily: 'Diária',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      yearly: 'Anual',
    };

    let label = labels[config.frequency] || 'Mensal';
    
    if (config.frequency === 'monthly' && config.dayOfMonth) {
      label += ` • Dia ${config.dayOfMonth}`;
    }

    return label;
  };

  const getFrequencyIcon = (frequency: string) => {
    const icons: { [key: string]: any } = {
      daily: 'today',
      weekly: 'calendar',
      biweekly: 'calendar-outline',
      monthly: 'calendar-number',
      yearly: 'calendar-sharp',
    };
    return icons[frequency] || 'calendar-number';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recorrências</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando...
          </Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recorrências</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddTransaction')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
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
        {recurringTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="repeat" size={64} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma recorrência
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Crie transações recorrentes para automatizar pagamentos e receitas mensais
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.emptyButtonText}>Criar Recorrência</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ESTATÍSTICAS - 2x2 GRID COMPACTO */}
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="repeat" size={18} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {recurringTransactions.filter(t => t.isRecurring).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Ativas
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="pause-circle" size={18} color={colors.textSecondary} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {recurringTransactions.filter(t => !t.isRecurring).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Pausadas
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="list" size={18} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {recurringTransactions.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Total
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="time-outline" size={18} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nonRecurringTransactions.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Normais
                  </Text>
                </View>
              </View>
            </View>

            {/* LISTA DE RECORRÊNCIAS */}
            <View style={styles.listContainer}>
              {recurringTransactions.map((transaction) => {
                const isLoading = actionLoading === transaction._id;
                
                return (
                  <View
                    key={transaction._id}
                    style={[
                      styles.transactionCard,
                      { backgroundColor: colors.card },
                      !transaction.isRecurring && styles.pausedCard
                    ]}
                  >
                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionHeaderLeft}>
                        <View
                          style={[
                            styles.transactionIcon,
                            {
                              backgroundColor: transaction.categoryId?.color
                                ? transaction.categoryId.color + '20'
                                : colors.border
                            }
                          ]}
                        >
                          <Ionicons
                            name={transaction.categoryId?.icon || 'help-circle'}
                            size={24}
                            color={transaction.categoryId?.color || colors.textSecondary}
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={[styles.transactionDescription, { color: colors.text }]}>
                            {transaction.description}
                          </Text>
                          <View style={styles.transactionMeta}>
                            <Ionicons
                              name={getFrequencyIcon(transaction.recurringConfig?.frequency)}
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={[styles.transactionFrequency, { color: colors.textSecondary }]}>
                              {getFrequencyLabel(transaction.recurringConfig)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.transactionHeaderRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: transaction.type === 'income' ? colors.success : colors.error }
                          ]}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </Text>
                        {!transaction.isRecurring && (
                          <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                            <Ionicons name="pause" size={12} color={colors.textSecondary} />
                            <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                              Pausada
                            </Text>
                          </View>
                        )}
                        {transaction.isRecurring && (
                          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                            <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                              Ativa
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.transactionActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.info + '15' },
                          isLoading && styles.actionButtonDisabled
                        ]}
                        onPress={() => {
                          setSelectedTransaction(transaction);
                          setModalMode('edit');
                          setShowModal(true);
                        }}
                        disabled={isLoading}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.info} />
                        <Text style={[styles.actionButtonText, { color: colors.info }]}>
                          Editar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: transaction.isRecurring ? colors.textSecondary + '15' : colors.success + '15' },
                          isLoading && styles.actionButtonDisabled
                        ]}
                        onPress={() => handlePauseResume(transaction)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={transaction.isRecurring ? colors.textSecondary : colors.success} />
                        ) : (
                          <>
                            <Ionicons
                              name={transaction.isRecurring ? 'pause' : 'play'}
                              size={18}
                              color={transaction.isRecurring ? colors.textSecondary : colors.success}
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                { color: transaction.isRecurring ? colors.textSecondary : colors.success }
                              ]}
                            >
                              {transaction.isRecurring ? 'Pausar' : 'Retomar'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.error + '15' },
                          isLoading && styles.actionButtonDisabled
                        ]}
                        onPress={() => handleDelete(transaction)}
                        disabled={isLoading}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* TRANSAÇÕES NÃO RECORRENTES */}
        {nonRecurringTransactions.length > 0 && (
          <View style={styles.nonRecurringSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tornar Recorrente
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Toque em uma transação para transformá-la em recorrente
            </Text>
            
            <View style={styles.listContainer}>
              {nonRecurringTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction._id}
                  style={[styles.transactionCard, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setSelectedTransaction(transaction);
                    setModalMode('add');
                    setShowModal(true);
                  }}
                >
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionHeaderLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor: transaction.categoryId?.color
                              ? transaction.categoryId.color + '20'
                              : colors.border
                          }
                        ]}
                      >
                        <Ionicons
                          name={transaction.categoryId?.icon || 'help-circle'}
                          size={24}
                          color={transaction.categoryId?.color || colors.textSecondary}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionDescription, { color: colors.text }]}>
                          {transaction.description}
                        </Text>
                        <Text style={[styles.transactionFrequency, { color: colors.textSecondary }]}>
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionHeaderRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: transaction.type === 'income' ? colors.success : colors.error }
                        ]}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE CONFIGURAÇÃO DE RECORRÊNCIA */}
      <RecurrenceConfigModal
        visible={showModal}
        transaction={selectedTransaction}
        mode={modalMode}
        onClose={() => {
          setShowModal(false);
          setSelectedTransaction(null);
        }}
        onConfirm={modalMode === 'add' ? handleAddRecurrence : handleEditRecurrence}
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statsGrid: {
    gap: 8,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pausedCard: {
    opacity: 0.7,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionFrequency: {
    fontSize: 13,
    fontWeight: '500',
  },
  transactionHeaderRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nonRecurringSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 16,
  },
});