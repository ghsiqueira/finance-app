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
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { billAPI, categoryAPI } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diária', icon: 'today' },
  { value: 'weekly', label: 'Semanal', icon: 'calendar' },
  { value: 'biweekly', label: 'Quinzenal', icon: 'calendar' },
  { value: 'monthly', label: 'Mensal', icon: 'calendar' },
  { value: 'bimonthly', label: 'Bimestral', icon: 'calendar' },
  { value: 'quarterly', label: 'Trimestral', icon: 'calendar' },
  { value: 'semiannual', label: 'Semestral', icon: 'calendar' },
  { value: 'yearly', label: 'Anual', icon: 'calendar' },
];

export default function AddBillScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { bill } = route?.params || {};
  const isEditing = !!bill;

  const [name, setName] = useState(bill?.name || '');
  const [amount, setAmount] = useState(bill?.amount?.toString() || '');
  const [dueDate, setDueDate] = useState(bill ? new Date(bill.dueDate) : new Date());
  const [type, setType] = useState<'pay' | 'receive'>(bill?.type || 'pay');
  const [categoryId, setCategoryId] = useState(bill?.categoryId?._id || '');
  const [description, setDescription] = useState(bill?.description || '');
  const [isRecurring, setIsRecurring] = useState(bill?.recurrence?.enabled || false);
  const [frequency, setFrequency] = useState(bill?.recurrence?.frequency || 'monthly');
  const [isBusinessDay, setIsBusinessDay] = useState(bill?.recurrence?.isBusinessDay || false);

  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (allCategories.length > 0) {
      filterCategories();
    }
  }, [type, allCategories]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setAllCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterCategories = () => {
    const categoryType = type === 'pay' ? 'expense' : 'income';
    const filtered = allCategories.filter((c: any) => c.type === categoryType);
    setCategories(filtered);
    
    const currentCategory = allCategories.find((c: any) => c._id === categoryId);
    if (currentCategory && currentCategory.type !== categoryType) {
      setCategoryId('');
    }
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);

    if (!name.trim()) {
      Alert.alert('Erro', 'Digite um nome para a conta');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        name: name.trim(),
        amount: parsedAmount,
        dueDate: dueDate.toISOString(),
        type,
        description: description.trim(),
      };

      if (categoryId) {
        data.categoryId = categoryId;
      }

      if (isRecurring) {
        data.recurrence = {
          enabled: true,
          frequency,
          dayOfMonth: dueDate.getDate(),
          isBusinessDay,
        };
      }

      if (isEditing) {
        await billAPI.update(bill._id, data);
        Alert.alert('Sucesso', 'Conta atualizada!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await billAPI.create(data);
        Alert.alert('Sucesso', 'Conta criada!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Erro', 'Falha ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar', 'Deseja realmente deletar esta conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            await billAPI.delete(bill._id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', 'Falha ao deletar conta');
          }
        },
      },
    ]);
  };

  const getSelectedCategory = () => {
    return categories.find((c) => c._id === categoryId);
  };

  const getFrequencyLabel = () => {
    return FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label || 'Mensal';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Editar Conta' : 'Nova Conta'}
        </Text>
        {isEditing && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
        {!isEditing && <View style={{ width: 28 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* TIPO */}
        <Text style={[styles.label, { color: colors.text }]}>Tipo</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor: type === 'pay' ? colors.error : colors.card,
                borderColor: type === 'pay' ? colors.error : colors.border,
              },
            ]}
            onPress={() => setType('pay')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={24}
              color={type === 'pay' ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.typeText, { color: type === 'pay' ? '#fff' : colors.text }]}>
              Pagar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor: type === 'receive' ? colors.success : colors.card,
                borderColor: type === 'receive' ? colors.success : colors.border,
              },
            ]}
            onPress={() => setType('receive')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={24}
              color={type === 'receive' ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.typeText, { color: type === 'receive' ? '#fff' : colors.text }]}>
              Receber
            </Text>
          </TouchableOpacity>
        </View>

        {/* NOME */}
        <Text style={[styles.label, { color: colors.text }]}>Nome da Conta</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder={type === 'pay' ? 'Ex: Conta de Luz' : 'Ex: Salário'}
          placeholderTextColor={colors.placeholder}
        />

        {/* VALOR */}
        <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
        />

        {/* DATA DE VENCIMENTO */}
        <Text style={[styles.label, { color: colors.text }]}>
          {type === 'pay' ? 'Data de Vencimento' : 'Data de Recebimento'}
        </Text>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {dueDate.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDueDate(selectedDate);
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

        {/* RECORRENTE */}
        <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Conta Recorrente</Text>
            <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
              Repetir automaticamente
            </Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {isRecurring && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Frequência</Text>
            <TouchableOpacity
              style={[styles.frequencyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowFrequencyModal(true)}
            >
              <Ionicons name="repeat" size={20} color={colors.primary} />
              <Text style={[styles.frequencyButtonText, { color: colors.text }]}>
                {getFrequencyLabel()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Apenas em Dias Úteis</Text>
                <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                  Pular finais de semana
                </Text>
              </View>
              <Switch
                value={isBusinessDay}
                onValueChange={setIsBusinessDay}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}

        {/* DESCRIÇÃO */}
        <Text style={[styles.label, { color: colors.text }]}>Descrição (Opcional)</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Adicione uma descrição..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={3}
        />

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
                {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
              </Text>
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
              {categories.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyCategoriesText, { color: colors.textSecondary }]}>
                    Nenhuma categoria de {type === 'pay' ? 'despesa' : 'receita'} cadastrada
                  </Text>
                  <Text style={[styles.emptyCategoriesHint, { color: colors.textSecondary }]}>
                    Vá em Configurações → Gerenciar Categorias
                  </Text>
                </View>
              ) : (
                categories.map((category) => (
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
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL FREQUÊNCIA */}
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Escolher Frequência
              </Text>
              <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFrequency(option.value);
                    setShowFrequencyModal(false);
                  }}
                >
                  <Ionicons name={option.icon as any} size={24} color={colors.primary} />
                  <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  {frequency === option.value && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', gap: 12 },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  typeText: { fontSize: 16, fontWeight: '600' },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  switchLabel: { fontSize: 16, fontWeight: '600' },
  switchHint: { fontSize: 13, marginTop: 2 },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyButtonText: { flex: 1, fontSize: 16, fontWeight: '600' },
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
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyCategoriesText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyCategoriesHint: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});