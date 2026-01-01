import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { creditCardAPI } from '../services/api';

const CARD_COLORS = [
  '#007AFF', '#5856D6', '#FF3B30', '#FF9500',
  '#34C759', '#5AC8FA', '#FF2D55', '#AF52DE',
  '#000000', '#8E8E93', '#1E90FF', '#FF6482',
];

const CARD_BRANDS = [
  { value: 'visa', label: 'Visa', icon: 'card' },
  { value: 'mastercard', label: 'Mastercard', icon: 'card' },
  { value: 'elo', label: 'Elo', icon: 'card' },
  { value: 'amex', label: 'American Express', icon: 'card' },
  { value: 'hipercard', label: 'Hipercard', icon: 'card' },
  { value: 'other', label: 'Outro', icon: 'card-outline' },
];

export default function AddCreditCardScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { card } = route?.params || {};
  const isEditing = !!card;

  const [name, setName] = useState(card?.name || '');
  const [brand, setBrand] = useState(card?.brand || 'visa');
  const [limit, setLimit] = useState(card?.limit?.toString() || '');
  const [closingDay, setClosingDay] = useState(card?.closingDay?.toString() || '');
  const [dueDay, setDueDay] = useState(card?.dueDay?.toString() || '');
  const [lastFourDigits, setLastFourDigits] = useState(card?.lastFourDigits || '');
  const [selectedColor, setSelectedColor] = useState(card?.color || CARD_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const parsedLimit = parseFloat(limit);
    const parsedClosingDay = parseInt(closingDay);
    const parsedDueDay = parseInt(dueDay);

    if (!name.trim()) {
      Alert.alert('Erro', 'Digite um nome para o cartão');
      return;
    }

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      Alert.alert('Erro', 'Digite um limite válido');
      return;
    }

    if (isNaN(parsedClosingDay) || parsedClosingDay < 1 || parsedClosingDay > 31) {
      Alert.alert('Erro', 'Dia de fechamento deve ser entre 1 e 31');
      return;
    }

    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      Alert.alert('Erro', 'Dia de vencimento deve ser entre 1 e 31');
      return;
    }

    if (lastFourDigits && (lastFourDigits.length !== 4 || isNaN(Number(lastFourDigits)))) {
      Alert.alert('Erro', 'Últimos 4 dígitos devem ser 4 números');
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        name: name.trim(),
        brand,
        limit: parsedLimit,
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay,
        color: selectedColor,
      };

      if (lastFourDigits) {
        data.lastFourDigits = lastFourDigits;
      }

      if (isEditing) {
        await creditCardAPI.update(card._id, data);
        Alert.alert('Sucesso', 'Cartão atualizado!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await creditCardAPI.create(data);
        Alert.alert('Sucesso', 'Cartão criado!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error saving credit card:', error);
      Alert.alert('Erro', 'Falha ao salvar cartão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar', 'Deseja realmente deletar este cartão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            await creditCardAPI.delete(card._id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', 'Falha ao deletar cartão');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Editar Cartão' : 'Novo Cartão'}
        </Text>
        {isEditing && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
        {!isEditing && <View style={{ width: 28 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* PREVIEW */}
        <View style={[styles.preview, { backgroundColor: selectedColor }]}>
          <View style={styles.previewHeader}>
            <Ionicons name="card" size={32} color="#fff" />
            {lastFourDigits && (
              <Text style={styles.previewDigits}>•••• {lastFourDigits}</Text>
            )}
          </View>
          <Text style={styles.previewName}>{name || 'Nome do Cartão'}</Text>
          <View style={styles.previewFooter}>
            <Text style={styles.previewLabel}>Limite</Text>
            <Text style={styles.previewValue}>
              R$ {limit || '0,00'}
            </Text>
          </View>
        </View>

        {/* NOME */}
        <Text style={[styles.label, { color: colors.text }]}>Nome do Cartão</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Nubank Platinum"
          placeholderTextColor={colors.placeholder}
        />

        {/* BANDEIRA */}
        <Text style={[styles.label, { color: colors.text }]}>Bandeira</Text>
        <View style={styles.brandsGrid}>
          {CARD_BRANDS.map((b) => (
            <TouchableOpacity
              key={b.value}
              style={[
                styles.brandButton,
                {
                  backgroundColor: brand === b.value ? colors.primary : colors.card,
                  borderColor: brand === b.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setBrand(b.value)}
            >
              <Ionicons
                name={b.icon as any}
                size={20}
                color={brand === b.value ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.brandText,
                  { color: brand === b.value ? '#fff' : colors.text },
                ]}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIMITE */}
        <Text style={[styles.label, { color: colors.text }]}>Limite do Cartão</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={limit}
          onChangeText={setLimit}
          placeholder="0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
        />

        {/* DIAS */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={[styles.label, { color: colors.text }]}>Dia de Fechamento</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={closingDay}
              onChangeText={setClosingDay}
              placeholder="10"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={[styles.label, { color: colors.text }]}>Dia de Vencimento</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={dueDay}
              onChangeText={setDueDay}
              placeholder="17"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>

        {/* ÚLTIMOS 4 DÍGITOS */}
        <Text style={[styles.label, { color: colors.text }]}>Últimos 4 Dígitos (Opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={lastFourDigits}
          onChangeText={setLastFourDigits}
          placeholder="1234"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          maxLength={4}
        />

        {/* COR */}
        <Text style={[styles.label, { color: colors.text }]}>Cor do Cartão</Text>
        <View style={styles.colorsGrid}>
          {CARD_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && styles.colorButtonSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTÃO SALVAR */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Salvar Alterações' : 'Criar Cartão'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  
  // Preview
  preview: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    minHeight: 180,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  previewDigits: { fontSize: 18, color: '#fff', opacity: 0.9 },
  previewName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  previewFooter: { marginTop: 'auto' },
  previewLabel: { fontSize: 12, color: '#fff', opacity: 0.7 },
  previewValue: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 4 },

  // Form
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },

  // Brands
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  brandText: { fontSize: 14, fontWeight: '600' },

  // Colors
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 12,
    marginTop: 32,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});