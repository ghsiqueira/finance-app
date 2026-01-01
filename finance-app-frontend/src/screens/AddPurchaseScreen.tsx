import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { creditCardAPI, categoryAPI } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const INSTALLMENT_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  15, 18, 20, 24,
];

export default function AddPurchaseScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { card } = route.params;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [installments, setInstallments] = useState(1);

  const [categories, setCategories] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.filter((c: any) => c.type === 'expense'));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);

    if (!description.trim()) {
      Alert.alert('Erro', 'Digite uma descrição');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    // Verificar se não ultrapassa o limite
    const purchaseValue = parsedAmount / installments;
    if (purchaseValue > card.available) {
      Alert.alert(
        'Atenção',
        `Esta compra ultrapassa seu limite disponível (${formatCurrency(card.available)}). Deseja continuar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: savePurchase },
        ]
      );
      return;
    }

    savePurchase();
  };

  const savePurchase = async () => {
    try {
      setLoading(true);

      const data: any = {
        creditCardId: card._id,
        description: description.trim(),
        amount: parseFloat(amount),
        purchaseDate: purchaseDate.toISOString(),
        installments: installments,
      };

      if (categoryId) {
        data.categoryId = categoryId;
      }

      await creditCardAPI.addPurchase(data);

      Alert.alert('Sucesso', 'Compra adicionada!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding purchase:', error);
      Alert.alert('Erro', 'Falha ao adicionar compra');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getSelectedCategory = () => {
    return categories.find((c) => c._id === categoryId);
  };

  const calculateInstallmentValue = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || installments === 1) return '';
    return ` (${installments}x de ${formatCurrency(parsed / installments)})`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Nova Compra
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* CARTÃO */}
        <View style={[styles.cardPreview, { backgroundColor: card.color || colors.primary }]}>
          <View style={styles.cardPreviewRow}>
            <Ionicons name="card" size={24} color="#fff" />
            <Text style={styles.cardPreviewName}>{card.name}</Text>
          </View>
          <View style={styles.cardPreviewLimits}>
            <Text style={styles.cardPreviewLabel}>Disponível</Text>
            <Text style={styles.cardPreviewValue}>{formatCurrency(card.available)}</Text>
          </View>
        </View>

        {/* DESCRIÇÃO */}
        <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Mercado, Restaurante, etc"
          placeholderTextColor={colors.placeholder}
        />

        {/* VALOR */}
        <Text style={[styles.label, { color: colors.text }]}>Valor Total</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
        />

        {/* DATA DA COMPRA */}
        <Text style={[styles.label, { color: colors.text }]}>Data da Compra</Text>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {purchaseDate.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={purchaseDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setPurchaseDate(selectedDate);
            }}
          />
        )}

        {/* CATEGORIA */}
        <Text style={[styles.label, { color: colors.text }]}>Categoria (Opcional)</Text>
        <TouchableOpacity
          style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCategoryModal(true)}
        >
          {getSelectedCategory() ? (
            <>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: getSelectedCategory().color + '20' },
                ]}
              >
                <Ionicons
                  name={getSelectedCategory().icon}
                  size={20}
                  color={getSelectedCategory().color}
                />
              </View>
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {getSelectedCategory().name}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                Selecionar Categoria
              </Text>
            </>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* PARCELAMENTO */}
        <Text style={[styles.label, { color: colors.text }]}>Parcelamento</Text>
        <TouchableOpacity
          style={[styles.installmentsButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowInstallmentsModal(true)}
        >
          <Ionicons name="calendar-number" size={20} color={colors.primary} />
          <Text style={[styles.installmentsText, { color: colors.text }]}>
            {installments}x{calculateInstallmentValue()}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* INFO PARCELAMENTO */}
        {installments > 1 && (
          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Serão criadas {installments} parcelas nas próximas faturas
            </Text>
          </View>
        )}

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
              <Text style={styles.saveButtonText}>Adicionar Compra</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL CATEGORIAS */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Selecionar Categoria
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setCategoryId('');
                  setShowCategoryModal(false);
                }}
              >
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                <Text style={[styles.categoryOptionText, { color: colors.textSecondary }]}>
                  Nenhuma
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCategoryId(category._id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon} size={20} color={category.color} />
                  </View>
                  <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                    {category.name}
                  </Text>
                  {categoryId === category._id && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL PARCELAMENTO */}
      <Modal
        visible={showInstallmentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstallmentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Escolher Parcelamento
              </Text>
              <TouchableOpacity onPress={() => setShowInstallmentsModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {INSTALLMENT_OPTIONS.map((num) => {
                const parsedAmount = parseFloat(amount);
                const installmentValue = !isNaN(parsedAmount) ? parsedAmount / num : 0;

                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.installmentOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setInstallments(num);
                      setShowInstallmentsModal(false);
                    }}
                  >
                    <Text style={[styles.installmentOptionText, { color: colors.text }]}>
                      {num}x {installmentValue > 0 && `de ${formatCurrency(installmentValue)}`}
                    </Text>
                    {installments === num && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Card Preview
  cardPreview: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardPreviewName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardPreviewLimits: {},
  cardPreviewLabel: { fontSize: 12, color: '#fff', opacity: 0.7 },
  cardPreviewValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 },

  // Form
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: { fontSize: 16, fontWeight: '600' },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  categoryText: { flex: 1, fontSize: 16, fontWeight: '600' },
  installmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  installmentsText: { flex: 1, fontSize: 16, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 16 },

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

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryOptionText: { flex: 1, fontSize: 16, fontWeight: '600' },
  installmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  installmentOptionText: { fontSize: 16, fontWeight: '600' },
});