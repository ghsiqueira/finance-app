import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

// 🎨 SKELETON: TRANSAÇÃO
export const TransactionSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>
      <View style={styles.transactionLeft}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={styles.transactionInfo}>
          <Skeleton width={150} height={16} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={14} />
        </View>
      </View>
      <Skeleton width={80} height={18} />
    </View>
  );
};

// 🎨 SKELETON: CARD GENÉRICO
export const CardSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={16} />
    </View>
  );
};

// 🎨 SKELETON: META
export const GoalSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
      <View style={styles.goalHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
      <View style={styles.progressBar}>
        <Skeleton width="100%" height={8} borderRadius={4} />
      </View>
      <View style={styles.goalFooter}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="30%" height={14} />
      </View>
    </View>
  );
};

// 🎨 SKELETON: ORÇAMENTO
export const BudgetSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
      <View style={styles.budgetHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={60} height={60} borderRadius={30} />
      </View>
      <Skeleton width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
      <View style={styles.budgetFooter}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="45%" height={14} />
      </View>
    </View>
  );
};

// 🎨 SKELETON: RESUMO MENSAL
export const MonthlySummarySkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <View style={styles.summaryHeader}>
        <Skeleton width="50%" height={20} style={{ marginBottom: 12 }} />
        <Skeleton width={80} height={32} borderRadius={16} />
      </View>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={24} />
        </View>
        <View style={styles.summaryItem}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={24} />
        </View>
        <View style={styles.summaryItem}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={24} />
        </View>
      </View>
    </View>
  );
};

export const BillSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.billCard, { backgroundColor: colors.card }]}>
      <View style={styles.billHeader}>
        <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Skeleton width={80} height={18} style={{ marginBottom: 8 }} />
          <Skeleton width={60} height={20} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

export const CreditCardSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.creditCardSkeleton, { backgroundColor: colors.border }]}>
      <View style={styles.cardSkeletonHeader}>
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width="50%" height={18} />
      </View>
      <View style={styles.cardSkeletonBody}>
        <View style={styles.cardSkeletonLimits}>
          <View>
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={90} height={20} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={90} height={20} />
          </View>
        </View>
        <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 12 }} />
      </View>
      <Skeleton width="60%" height={12} style={{ marginTop: 12 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    width: 280,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 12,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetCard: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  billCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  creditCardSkeleton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 180,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardSkeletonBody: {
    marginBottom: 16,
  },
  cardSkeletonLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});