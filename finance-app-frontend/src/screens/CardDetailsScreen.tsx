import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { creditCardAPI } from '../services/api';

export default function CardDetailsScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { card: initialCard } = route.params;
  
  const [card, setCard] = useState(initialCard);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [cardResponse, invoicesResponse] = await Promise.all([
        creditCardAPI.getById(initialCard._id),
        creditCardAPI.getInvoices(initialCard._id),
      ]);

      setCard(cardResponse.data);
      setInvoices(invoicesResponse.data);

      // Selecionar fatura mais recente
      if (invoicesResponse.data.length > 0) {
        const latest = invoicesResponse.data[0];
        setSelectedInvoice(latest);
        loadPurchases(latest.month);
      }
    } catch (error) {
      console.error('Error loading card details:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadPurchases = async (month: string) => {
    try {
      const response = await creditCardAPI.getPurchases(initialCard._id, {
        invoiceMonth: month,
      });
      setPurchases(response.data);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePayInvoice = () => {
    if (!selectedInvoice) return;

    Alert.alert(
      'Pagar Fatura',
      `Deseja pagar a fatura de ${formatMonth(selectedInvoice.month)}?\n\nValor: ${formatCurrency(selectedInvoice.total)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: async () => {
            try {
              await creditCardAPI.payInvoice(initialCard._id, selectedInvoice.month);
              Alert.alert('Sucesso', 'Fatura paga! Transação criada.', [
                { text: 'OK', onPress: loadData },
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao pagar fatura');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: card.color || colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddCreditCard', { card })}
            >
              <Ionicons name="create" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddPurchase', { card })}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="add-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerTitle}>{card.name}</Text>
        {card.lastFourDigits && (
          <Text style={styles.headerSubtitle}>•••• {card.lastFourDigits}</Text>
        )}

        <View style={styles.headerLimits}>
          <View>
            <Text style={styles.headerLimitLabel}>Limite</Text>
            <Text style={styles.headerLimitValue}>{formatCurrency(card.limit)}</Text>
          </View>
          <View>
            <Text style={styles.headerLimitLabel}>Disponível</Text>
            <Text style={styles.headerLimitValue}>{formatCurrency(card.available)}</Text>
          </View>
          <View>
            <Text style={styles.headerLimitLabel}>Usado</Text>
            <Text style={styles.headerLimitValue}>{formatCurrency(card.used)}</Text>
          </View>
        </View>

        {/* Barra de progresso */}
        <View style={styles.headerProgress}>
          <View style={styles.headerProgressBar}>
            <View
              style={[
                styles.headerProgressFill,
                { width: `${Math.min(card.usagePercentage, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.headerProgressText}>
            {card.usagePercentage.toFixed(0)}% utilizado
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* SELETOR DE FATURA */}
        <View style={styles.invoiceSelector}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Faturas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {invoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.month}
                style={[
                  styles.invoiceTab,
                  {
                    backgroundColor:
                      selectedInvoice?.month === invoice.month
                        ? colors.primary
                        : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedInvoice(invoice);
                  loadPurchases(invoice.month);
                }}
              >
                <Text
                  style={[
                    styles.invoiceTabMonth,
                    {
                      color:
                        selectedInvoice?.month === invoice.month
                          ? '#fff'
                          : colors.text,
                    },
                  ]}
                >
                  {formatMonth(invoice.month)}
                </Text>
                <Text
                  style={[
                    styles.invoiceTabValue,
                    {
                      color:
                        selectedInvoice?.month === invoice.month
                          ? '#fff'
                          : colors.text,
                    },
                  ]}
                >
                  {formatCurrency(invoice.total)}
                </Text>
                <View
                  style={[
                    styles.invoiceTabBadge,
                    {
                      backgroundColor:
                        invoice.status === 'paid'
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.invoiceTabBadgeText}>
                    {invoice.status === 'paid' ? 'Paga' : 'Aberta'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* RESUMO DA FATURA */}
        {selectedInvoice && (
          <View style={[styles.invoiceSummary, { backgroundColor: colors.card }]}>
            <View style={styles.invoiceSummaryRow}>
              <Text style={[styles.invoiceSummaryLabel, { color: colors.textSecondary }]}>
                Total da Fatura
              </Text>
              <Text style={[styles.invoiceSummaryValue, { color: colors.text }]}>
                {formatCurrency(selectedInvoice.total)}
              </Text>
            </View>

            {selectedInvoice.status === 'open' && (
              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: colors.primary }]}
                onPress={handlePayInvoice}
              >
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Pagar Fatura</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* LISTA DE COMPRAS */}
        <View style={styles.purchasesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Compras ({purchases.length})
          </Text>

          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhuma compra nesta fatura
              </Text>
            </View>
          ) : (
            purchases.map((purchase) => (
              <View
                key={purchase._id}
                style={[styles.purchaseCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.purchaseHeader}>
                  <View style={styles.purchaseLeft}>
                    {purchase.categoryId && (
                      <View
                        style={[
                          styles.purchaseIcon,
                          { backgroundColor: purchase.categoryId.color + '20' },
                        ]}
                      >
                        <Ionicons
                          name={purchase.categoryId.icon}
                          size={20}
                          color={purchase.categoryId.color}
                        />
                      </View>
                    )}
                    <View>
                      <Text style={[styles.purchaseDescription, { color: colors.text }]}>
                        {purchase.description}
                      </Text>
                      <Text style={[styles.purchaseDate, { color: colors.textSecondary }]}>
                        {formatDate(purchase.purchaseDate)}
                        {purchase.installments.total > 1 &&
                          ` • ${purchase.installments.current}/${purchase.installments.total}x`}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.purchaseAmount, { color: colors.error }]}>
                    {formatCurrency(purchase.amount)}
                  </Text>
                </View>
              </View>
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
  
  // Header
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#fff', opacity: 0.8, marginBottom: 20 },
  headerLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLimitLabel: { fontSize: 12, color: '#fff', opacity: 0.7 },
  headerLimitValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 },
  headerProgress: {},
  headerProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressFill: { height: '100%', backgroundColor: '#fff' },
  headerProgressText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    marginTop: 6,
    textAlign: 'right',
  },

  // Invoice Selector
  invoiceSelector: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  invoiceTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    minWidth: 160,
  },
  invoiceTabMonth: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  invoiceTabValue: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  invoiceTabBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceTabBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  // Invoice Summary
  invoiceSummary: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  invoiceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoiceSummaryLabel: { fontSize: 14 },
  invoiceSummaryValue: { fontSize: 24, fontWeight: '700' },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Purchases
  purchasesSection: { paddingHorizontal: 20 },
  purchaseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  purchaseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseDescription: { fontSize: 16, fontWeight: '600' },
  purchaseDate: { fontSize: 13, marginTop: 2 },
  purchaseAmount: { fontSize: 18, fontWeight: '700' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
});