import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { billAPI } from '../services/api';

export default function BillsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  const loadBills = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await billAPI.getAll(params);
      setBills(response.data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await billAPI.markAsPaid(billId);
      loadBills();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  const getStatusColor = (bill: any) => {
    if (bill.status === 'paid') return colors.success;
    if (bill.status === 'overdue') return colors.error;
    
    const daysUntilDue = Math.ceil(
      (new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilDue <= 3) return colors.warning;
    return colors.textSecondary;
  };

  const getStatusText = (bill: any) => {
    if (bill.status === 'paid') return 'Paga';
    if (bill.status === 'overdue') return 'Atrasada';
    
    const daysUntilDue = Math.ceil(
      (new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilDue === 0) return 'Vence hoje';
    if (daysUntilDue === 1) return 'Vence amanhã';
    if (daysUntilDue <= 3) return `Vence em ${daysUntilDue} dias`;
    return 'Pendente';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const filteredBills = bills;

  const stats = {
    pending: bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0),
    overdue: bills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.amount, 0),
    paid: bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0),
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Contas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddBill')}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
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
        <Text style={[styles.title, { color: colors.text }]}>Contas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddBill')}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendente</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {formatCurrency(stats.pending)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Atrasada</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {formatCurrency(stats.overdue)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pagas</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(stats.paid)}
            </Text>
          </View>
        </View>

        {/* FILTROS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filters}
        >
          {(['all', 'pending', 'overdue', 'paid'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === f ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? '#fff' : colors.text },
                ]}
              >
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : f === 'overdue' ? 'Atrasadas' : 'Pagas'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LISTA */}
        <View style={styles.listContainer}>
          {filteredBills.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhuma conta encontrada
              </Text>
            </View>
          ) : (
            filteredBills.map((bill) => (
              <TouchableOpacity
                key={bill._id}
                style={[styles.billCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('AddBill', { bill })}
              >
                <View style={styles.billHeader}>
                  <View style={styles.billLeft}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(bill) },
                      ]}
                    />
                    <View>
                      <Text style={[styles.billName, { color: colors.text }]}>
                        {bill.name}
                      </Text>
                      <Text style={[styles.billDate, { color: colors.textSecondary }]}>
                        {bill.status === 'paid'
                          ? `Pago em ${formatDate(bill.paidAt)}`
                          : `Vence em ${formatDate(bill.dueDate)}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.billRight}>
                    <Text
                      style={[
                        styles.billAmount,
                        { color: bill.type === 'receive' ? colors.success : colors.error },
                      ]}
                    >
                      {bill.type === 'receive' ? '+' : '-'}
                      {formatCurrency(bill.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(bill) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(bill) }]}
                      >
                        {getStatusText(bill)}
                      </Text>
                    </View>
                  </View>
                </View>

                {bill.status !== 'paid' && (
                  <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: colors.success }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMarkAsPaid(bill._id);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.payButtonText}>Marcar como Paga</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  filtersScroll: { paddingHorizontal: 20 },
  filters: { gap: 8, paddingBottom: 16 },
  filterButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 14, fontWeight: '600' },
  listContainer: { paddingHorizontal: 20 },
  billCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  billName: { fontSize: 16, fontWeight: '600' },
  billDate: { fontSize: 13, marginTop: 2 },
  billRight: { alignItems: 'flex-end' },
  billAmount: { fontSize: 18, fontWeight: '700' },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16 },
});