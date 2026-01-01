import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface CreditCard {
  id: string;
  name: string;
  brand: string;
  color: string;
  limit: number;
  used: number;
  available: number;
  usagePercentage: number;
  lastFourDigits?: string;
  closingDay: number;
  dueDay: number;
}

interface Props {
  cards: CreditCard[];
}

export default function CreditCardsCarousel({ cards }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>💳 Cartões</Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('CreditCardsMain')}
          style={styles.seeAllButton}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {/* CAROUSEL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.cardContainer,
              { backgroundColor: card.color || colors.primary },
              index === 0 && styles.firstCard,
            ]}
            onPress={() =>
              (navigation as any).navigate('CardDetails', {
                card,
              })
            }
            activeOpacity={0.8}
          >
            {/* HEADER DO CARTÃO */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name={getBrandIcon(card.brand)} size={24} color="#fff" />
                <Text style={styles.cardName}>{card.name}</Text>
              </View>
              {card.lastFourDigits && (
                <Text style={styles.cardDigits}>•••• {card.lastFourDigits}</Text>
              )}
            </View>

            {/* VALORES */}
            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardLabel}>Limite</Text>
                  <Text style={styles.cardValue}>{formatCurrency(card.limit)}</Text>
                </View>
                <View style={styles.cardDivider} />
                <View>
                  <Text style={styles.cardLabel}>Disponível</Text>
                  <Text style={styles.cardValue}>{formatCurrency(card.available)}</Text>
                </View>
              </View>

              {/* BARRA DE PROGRESSO */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(card.usagePercentage, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {card.usagePercentage.toFixed(0)}% usado
                </Text>
              </View>
            </View>

            {/* FOOTER */}
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterItem}>
                <Ionicons name="calendar-outline" size={12} color="#fff" />
                <Text style={styles.cardFooterText}>Fecha dia {card.closingDay}</Text>
              </View>
              <View style={styles.cardFooterDivider} />
              <View style={styles.cardFooterItem}>
                <Ionicons name="time-outline" size={12} color="#fff" />
                <Text style={styles.cardFooterText}>Vence dia {card.dueDay}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* CARD ADICIONAR */}
        <TouchableOpacity
          style={[
            styles.addCard,
            {
              backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F5',
              borderColor: colors.border,
            },
          ]}
          onPress={() =>
            (navigation as any).navigate('AddCreditCard')
          }
        >
          <View
            style={[
              styles.addCardIcon,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Ionicons name="add" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.addCardText, { color: colors.text }]}>
            Adicionar Cartão
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    flexGrow: 0,
    marginHorizontal: -20, // Compensar padding do container
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingRight: 20,
  },
  cardContainer: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  firstCard: {
    // Primeiro card não precisa de margin extra
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardDigits: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },
  cardBody: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#fff',
    opacity: 0.2,
  },
  cardLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    marginTop: 6,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
  },
  cardFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  cardFooterDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#fff',
    opacity: 0.2,
    marginHorizontal: 8,
  },
  cardFooterText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  addCard: {
    width: 180,
    borderRadius: 16,
    padding: 16,
    marginRight: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  addCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});