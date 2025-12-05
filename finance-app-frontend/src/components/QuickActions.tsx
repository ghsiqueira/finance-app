import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function QuickActions() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const actions = [
    {
      icon: 'add-circle',
      label: 'Transação',
      color: '#007AFF',
      bgColor: '#007AFF15',
      onPress: () => (navigation as any).navigate('AddTransaction')
    },
    {
      icon: 'flag',
      label: 'Meta',
      color: '#34C759',
      bgColor: '#34C75915',
      onPress: () => (navigation as any).navigate('Goals')
    },
    {
      icon: 'wallet',
      label: 'Orçamento',
      color: '#FF9500',
      bgColor: '#FF950015',
      onPress: () => (navigation as any).navigate('Budgets')
    },
    {
      icon: 'bar-chart',
      label: 'Relatórios',
      color: '#AF52DE',
      bgColor: '#AF52DE15',
      onPress: () => (navigation as any).navigate('Reports')
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>⚡ Ações Rápidas</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});