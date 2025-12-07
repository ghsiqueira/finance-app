import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface RecurrenceConfigModalProps {
  visible: boolean;
  transaction: any;
  mode: 'add' | 'edit';
  onClose: () => void;
  onConfirm: (frequency: string, dayOfMonth?: number) => void;
}

export default function RecurrenceConfigModal({
  visible,
  transaction,
  mode,
  onClose,
  onConfirm,
}: RecurrenceConfigModalProps) {
  const { colors } = useTheme();
  const [selectedFrequency, setSelectedFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('');

  const frequencies = [
    { value: 'daily', label: 'Diária', icon: 'today' },
    { value: 'weekly', label: 'Semanal', icon: 'calendar' },
    { value: 'biweekly', label: 'Quinzenal', icon: 'calendar-outline' },
    { value: 'monthly', label: 'Mensal', icon: 'calendar-number' },
    { value: 'yearly', label: 'Anual', icon: 'calendar-sharp' },
  ];

  useEffect(() => {
    if (mode === 'edit' && transaction?.recurringConfig) {
      setSelectedFrequency(transaction.recurringConfig.frequency || 'monthly');
      setDayOfMonth(transaction.recurringConfig.dayOfMonth?.toString() || '');
    } else {
      setSelectedFrequency('monthly');
      setDayOfMonth('');
    }
  }, [mode, transaction, visible]);

  const handleConfirm = () => {
    const day = selectedFrequency === 'monthly' && dayOfMonth ? parseInt(dayOfMonth) : undefined;
    onConfirm(selectedFrequency, day);
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {mode === 'add' ? 'Tornar Recorrente' : 'Editar Recorrência'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {transaction.description}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* FREQUÊNCIA */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Frequência
            </Text>
            <View style={styles.frequencyGrid}>
              {frequencies.map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.frequencyButton,
                    {
                      backgroundColor: selectedFrequency === freq.value
                        ? colors.primary + '20'
                        : colors.background,
                      borderColor: selectedFrequency === freq.value
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFrequency(freq.value)}
                >
                  <Ionicons
                    name={freq.icon as any}
                    size={24}
                    color={
                      selectedFrequency === freq.value
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.frequencyLabel,
                      {
                        color: selectedFrequency === freq.value
                          ? colors.primary
                          : colors.text,
                      },
                    ]}
                  >
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DIA DO MÊS (só para mensal) */}
            {selectedFrequency === 'monthly' && (
              <View style={styles.daySection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Dia do mês (opcional)
                </Text>
                <TextInput
                  style={[
                    styles.dayInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Ex: 5"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  maxLength={2}
                />
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Deixe em branco para usar o dia da transação original
                </Text>
              </View>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>
                {mode === 'add' ? 'Adicionar' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  frequencyButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  daySection: {
    marginBottom: 24,
  },
  dayInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});