import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { creditCardAPI } from '../services/api';
import { CreditCardSkeleton } from '../components/SkeletonLoader';

export default function CreditCardsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [cards, setCards] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [cardsResponse, dashboardResponse] = await Promise.all([
        creditCardAPI.getAll(),
        creditCardAPI.getDashboard(),
      ]);
      setCards(cardsResponse.data);
      setDashboard(dashboardResponse.data);
    } catch (error) {
      console.error('Error loading credit cards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getBrandIcon = (brand: string) => {
    const icons: any = {
      visa: 'card',
      mastercard: 'card',
      elo: 'card',
      amex: 'card',
      hipercard: 'card',
      other: 'card-outline',
    };
    return icons[brand] || 'card-outline';
  };

  // 🎨 SKELETON LOADING
  if (loading && cards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Cartões</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddCreditCard')}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.dashboardCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.dashboardTitle, { color: colors.text }]}>Resumo Geral</Text>
            <View style={styles.dashboardRow}>
              <View style={styles.dashboardItem}>
                <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]}>Limite Total</Text>
                <Text style={[styles.dashboardValue, { color: colors.text }]}>...</Text>
              </View>
              <View style={styles.dashboardItem}>
                <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]}>Usado</Text>
                <Text style={[styles.dashboardValue, { color: colors.error }]}>...</Text>
              </View>
              <View style={styles.dashboardItem}>
                <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]}>Disponível</Text>
                <Text style={[styles.dashboardValue, { color: colors.success }]}>...</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Meus Cartões</Text>
            <CreditCardSkeleton />
            <CreditCardSkeleton />
            <CreditCardSkeleton />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Cartões</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddCreditCard')}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* RESUMO GERAL */}
        {dashboard && (
          <View style={[styles.dashboardCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.dashboardTitle, { color: colors.text }]}>
              Resumo Geral
            </Text>
            
            <View style={styles.dashboardRow}>
              <View style={styles.dashboardItem}>
                <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]}>
                  Limite Total
                </Text>
                <Text style={[styles.dashboardValue, { color: colors.text }]}>
                  {formatCurrency(dashboard.totalLimit)}
                </Text>
              </View>
              <View style={styles.dashboardItem}>
                <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]}>
                  Usado
                </Text>
                <Text style={[styles.dashboardValue, { color: colors.error }]}>
                  {formatCurrency(dashboard.totalUsed)}
                </Text>
              </View>
              <View style={styles.dashboardItem}>
                <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]}>
                  Disponível
                </Text>
                <Text style={[styles.dashboardValue, { color: colors.success }]}>
                  {formatCurrency(dashboard.totalAvailable)}
                </Text>
              </View>
            </View>

            {/* BARRA DE PROGRESSO */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(dashboard.usagePercentage, 100)}%`,
                      backgroundColor:
                        dashboard.usagePercentage > 80
                          ? colors.error
                          : dashboard.usagePercentage > 50
                          ? colors.warning
                          : colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {dashboard.usagePercentage.toFixed(1)}% utilizado
              </Text>
            </View>
          </View>
        )}

        {/* LISTA DE CARTÕES */}
        <View style={styles.cardsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Meus Cartões
          </Text>
          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum cartão cadastrado
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddCreditCard')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Adicionar Cartão</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cards.map((card) => (
              <TouchableOpacity
                key={card._id}
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: card.color || colors.primary,
                  },
                ]}
                onPress={() => navigation.navigate('CardDetails', { card })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Ionicons
                      name={getBrandIcon(card.brand)}
                      size={28}
                      color="#fff"
                    />
                    <Text style={styles.cardName}>{card.name}</Text>
                  </View>
                  {card.lastFourDigits && (
                    <Text style={styles.cardDigits}>•••• {card.lastFourDigits}</Text>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardLimits}>
                    <View>
                      <Text style={styles.cardLimitLabel}>Limite</Text>
                      <Text style={styles.cardLimitValue}>
                        {formatCurrency(card.limit)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardLimitLabel}>Disponível</Text>
                      <Text style={styles.cardLimitValue}>
                        {formatCurrency(card.available)}
                      </Text>
                    </View>
                  </View>
                  {/* BARRA DE USO */}
                  <View style={styles.cardProgress}>
                    <View style={styles.cardProgressBar}>
                      <View
                        style={[
                          styles.cardProgressFill,
                          { width: `${Math.min(card.usagePercentage, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.cardProgressText}>
                      {card.usagePercentage.toFixed(0)}% usado
                    </Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                  </Text>
                </View>
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
  
  // Dashboard
  dashboardCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dashboardRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dashboardItem: { flex: 1 },
  dashboardLabel: { fontSize: 12, marginBottom: 4 },
  dashboardValue: { fontSize: 18, fontWeight: '700' },
  progressContainer: { marginTop: 8 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, marginTop: 6, textAlign: 'right' },

  // Cards
  cardsSection: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardDigits: { fontSize: 16, color: '#fff', opacity: 0.8 },
  cardBody: { marginBottom: 16 },
  cardLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLimitLabel: { fontSize: 12, color: '#fff', opacity: 0.7 },
  cardLimitValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 },
  cardProgress: { marginTop: 8 },
  cardProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressFill: { height: '100%', backgroundColor: '#fff' },
  cardProgressText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', paddingTop: 12 },
  cardFooterText: { fontSize: 13, color: '#fff', opacity: 0.8 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16, marginBottom: 24 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});