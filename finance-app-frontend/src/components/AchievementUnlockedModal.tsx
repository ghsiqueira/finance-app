import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface AchievementUnlockedModalProps {
  visible: boolean;
  achievements: any[];
  onClose: () => void;
}

export default function AchievementUnlockedModal({
  visible,
  achievements,
  onClose,
}: AchievementUnlockedModalProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 🆕 LOGS DE DEBUG
  console.log('🎭 MODAL - visible:', visible);
  console.log('🎭 MODAL - achievements:', achievements);
  console.log('🎭 MODAL - achievements.length:', achievements.length);

  useEffect(() => {
    if (visible) {
      console.log('🎬 ANIMANDO MODAL - ABRINDO');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (achievements.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card },
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* CONFETTI EFFECT */}
          <View style={styles.confettiContainer}>
            <Text style={styles.confetti}>🎉</Text>
            <Text style={styles.confetti}>🎊</Text>
            <Text style={styles.confetti}>✨</Text>
            <Text style={styles.confetti}>🏆</Text>
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {achievements.length === 1 ? 'Conquista Desbloqueada!' : 'Conquistas Desbloqueadas!'}
            </Text>
          </View>

          {/* ACHIEVEMENTS LIST */}
          <View style={styles.achievementsList}>
            {achievements.map((achievement, index) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { backgroundColor: colors.background },
                  index < achievements.length - 1 && { marginBottom: 12 },
                ]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={achievement.icon as any}
                    size={32}
                    color={achievement.color}
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width - 48,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
    flexDirection: 'row',
    gap: 12,
  },
  confetti: {
    fontSize: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementsList: {
    width: '100%',
    marginBottom: 24,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});