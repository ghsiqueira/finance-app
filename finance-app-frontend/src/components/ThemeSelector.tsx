import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeSelector() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const options = [
    { value: 'light', label: 'Claro', icon: 'sunny' },
    { value: 'dark', label: 'Escuro', icon: 'moon' },
    { value: 'auto', label: 'Auto', icon: 'phone-portrait' },
  ] as const;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="color-palette" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Tema do App</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {themeMode === 'auto' ? 'Automático' : isDark ? 'Escuro' : 'Claro'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = themeMode === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setThemeMode(option.value)}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={isSelected ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? '#fff' : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});