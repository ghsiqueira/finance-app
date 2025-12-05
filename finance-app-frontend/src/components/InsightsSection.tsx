import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface Insight {
  type: 'success' | 'warning' | 'error' | 'info';
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface InsightsSectionProps {
  insights: Insight[];
}

export default function InsightsSection({ insights }: InsightsSectionProps) {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();

  if (!insights || insights.length === 0) {
    return null;
  }

  const getIconName = (icon: string): any => {
    const iconMap: { [key: string]: any } = {
      '📈': 'trending-up',
      '💰': 'cash',
      '📊': 'bar-chart',
      '✅': 'checkmark-circle',
      '🎯': 'flag',
      '⚠️': 'warning',
      '🚨': 'alert-circle',
      '👍': 'thumbs-up',
    };
    return iconMap[icon] || 'information-circle';
  };

  const adjustColorForDarkMode = (color: string) => {
    if (colorScheme !== 'dark') return color;
    
    const colorMap: { [key: string]: string } = {
      '#FF3B30': '#FF6961',
      '#34C759': '#5DD97C',
      '#FF9500': '#FFB340',
      '#007AFF': '#5E9FFF',
    };

    return colorMap[color] || color;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>💡 Insights</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {insights.map((insight, index) => {
          const adjustedColor = adjustColorForDarkMode(insight.color);
          
          return (
            <View
              key={index}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colorScheme === 'dark' ? colors.background : colors.card,
                  borderLeftWidth: 4,
                  borderLeftColor: adjustedColor,
                }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: adjustedColor + '20' }]}>
                <Ionicons
                  name={getIconName(insight.icon)}
                  size={24}
                  color={adjustedColor}
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]} numberOfLines={1}>
                  {insight.title}
                </Text>
                <Text style={[styles.insightDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {insight.description}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingRight: 20,
  },
  insightCard: {
    width: 280,
    marginRight: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightContent: {
    gap: 6,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});