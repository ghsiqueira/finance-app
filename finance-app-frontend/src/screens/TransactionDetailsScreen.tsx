import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TransactionDetailsScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = route?.params?.transactionId;

  useEffect(() => {
    if (!transactionId) {
      Alert.alert('Erro', 'ID da transação não fornecido');
      navigation.goBack();
      return;
    }
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll();
      const found = response.data.find((t: any) => t._id === transactionId);
      
      if (!found) {
        Alert.alert('Erro', 'Transação não encontrada');
        navigation.goBack();
        return;
      }
      
      setTransaction(found);
    } catch (error) {
      console.error('Error loading transaction:', error);
      Alert.alert('Erro', 'Falha ao carregar transação');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionAPI.delete(transactionId);
              Alert.alert('Sucesso', 'Transação excluída com sucesso!', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Transactions')
                }
              ]);
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Erro', 'Falha ao excluir transação');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditTransaction', { transaction });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Transação não encontrada
          </Text>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const typeColor = isIncome ? colors.success : colors.error;
  const typeIcon = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';
  const typeLabel = isIncome ? 'Receita' : 'Despesa';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes da Transação</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* VALOR E TIPO */}
        <View style={[styles.valueCard, { backgroundColor: typeColor + '15' }]}>
          <View style={[styles.typeIconCircle, { backgroundColor: typeColor }]}>
            <Ionicons name={typeIcon} size={32} color="#fff" />
          </View>
          <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
            {typeLabel}
          </Text>
          <Text style={[styles.valueAmount, { color: typeColor }]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>

        {/* DETALHES */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          {/* Descrição */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="document-text" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                Descrição
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {transaction.description}
            </Text>
          </View>

          {/* Categoria */}
          {transaction.categoryId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="pricetag" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                  Categoria
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: transaction.categoryId.color + '20' }
                  ]}
                >
                  <Ionicons
                    name={transaction.categoryId.icon}
                    size={18}
                    color={transaction.categoryId.color}
                  />
                </View>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {transaction.categoryId.name}
                </Text>
              </View>
            </View>
          )}

          {/* Data */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                Data
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </View>

          {/* Hora */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="time" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                Hora
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {format(new Date(transaction.date), "HH:mm", { locale: ptBR })}
            </Text>
          </View>

          {/* Criado em */}
          {transaction.createdAt && (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={styles.detailLabel}>
                <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                  Criado em
                </Text>
              </View>
              <Text style={[styles.detailValueSmall, { color: colors.textSecondary }]}>
                {format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>
          )}
        </View>

        {/* BOTÕES DE AÇÃO */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info }]}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  valueCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  typeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueAmount: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabelText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailValueSmall: {
    fontSize: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});