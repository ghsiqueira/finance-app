import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI, categoryAPI } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddTransactionScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  
  const initialType = route?.params?.type || 'expense';
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(date.getDate().toString());
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    
    if (categoryId) {
      const selectedCategory = categories.find(c => c._id === categoryId);
      if (selectedCategory && selectedCategory.type !== newType) {
        setCategoryId('');
      }
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

    try {
      setLoading(true);
      
      const transactionData: any = {
        description: description.trim(),
        amount: parsedAmount,
        type,
        date: date.toISOString(),
        isRecurring,
      };

      if (categoryId) {
        transactionData.categoryId = categoryId;
      }

      if (isRecurring) {
        transactionData.recurringConfig = {
          frequency,
          dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
        };
      }

      await transactionAPI.create(transactionData);
      
      Alert.alert(
        'Sucesso', 
        isRecurring ? 'Transação recorrente criada!' : 'Transação criada!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Erro', 'Falha ao criar transação');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(c => c._id === categoryId);
  };

  const selectedCategory = getSelectedCategory();

  const frequencyOptions = [
    { value: 'daily', label: 'Diária', icon: 'today' },
    { value: 'weekly', label: 'Semanal', icon: 'calendar' },
    { value: 'biweekly', label: 'Quinzenal', icon: 'calendar-outline' },
    { value: 'monthly', label: 'Mensal', icon: 'calendar-number' },
    { value: 'yearly', label: 'Anual', icon: 'calendar-sharp' },
  ];

  const getFrequencyLabel = () => {
    return frequencyOptions.find(f => f.value === frequency)?.label || 'Mensal';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Transação</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* TIPO */}
        <Text style={[styles.label, { color: colors.text }]}>Tipo</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor: type === 'income' ? colors.success : colors.card,
                borderColor: type === 'income' ? colors.success : colors.border,
              }
            ]}
            onPress={() => handleTypeChange('income')} 
          >
            <Ionicons
              name="arrow-down-circle"
              size={24}
              color={type === 'income' ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              styles.typeButtonText,
              { color: type === 'income' ? '#fff' : colors.text }
            ]}>
              Receita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor: type === 'expense' ? colors.error : colors.card,
                borderColor: type === 'expense' ? colors.error : colors.border,
              }
            ]}
            onPress={() => handleTypeChange('expense')} 
          >
            <Ionicons
              name="arrow-up-circle"
              size={24}
              color={type === 'expense' ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              styles.typeButtonText,
              { color: type === 'expense' ? '#fff' : colors.text }
            ]}>
              Despesa
            </Text>
          </TouchableOpacity>
        </View>

        {/* DESCRIÇÃO */}
        <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Almoço, Salário, Compras"
          placeholderTextColor={colors.placeholder}
        />

        {/* VALOR */}
        <Text style={[styles.label, { color: colors.text }]}>Valor (R$)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
        />

        {/* DATA */}
        <Text style={[styles.label, { color: colors.text }]}>Data</Text>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={[styles.dateButtonText, { color: colors.text }]}>
            {date.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDate(selectedDate);
                setDayOfMonth(selectedDate.getDate().toString());
              }
            }}
          />
        )}

        {/* CATEGORIA */}
        <Text style={[styles.label, { color: colors.text }]}>
          Categoria (Opcional)
          {filteredCategories.length > 0 && (
            <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
              {' '}• {filteredCategories.length} {type === 'income' ? 'receita(s)' : 'despesa(s)'}
            </Text>
          )}
        </Text>
        <TouchableOpacity
          style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCategoryModal(true)}
        >
          {selectedCategory ? (
            <>
              <View style={[styles.categoryIconSmall, { backgroundColor: selectedCategory.color }]}>
                <Ionicons name={selectedCategory.icon} size={20} color="#fff" />
              </View>
              <Text style={[styles.categoryButtonText, { color: colors.text }]}>
                {selectedCategory.name}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="pricetag-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.categoryButtonText, { color: colors.textSecondary }]}>
                Selecionar categoria
              </Text>
            </>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 🆕 RECORRÊNCIA */}
        <View style={[styles.recurrenceSection, { borderTopColor: colors.border }]}>
          <View style={styles.recurrenceHeader}>
            <View style={styles.recurrenceHeaderLeft}>
              <Ionicons name="repeat" size={24} color={colors.primary} />
              <View>
                <Text style={[styles.recurrenceTitle, { color: colors.text }]}>
                  Transação Recorrente
                </Text>
                <Text style={[styles.recurrenceSubtitle, { color: colors.textSecondary }]}>
                  Repetir automaticamente
                </Text>
              </View>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={isRecurring ? colors.primary : colors.card}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurrenceConfig}>
              <TouchableOpacity
                style={[styles.frequencyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowFrequencyModal(true)}
              >
                <Ionicons name="time" size={24} color={colors.primary} />
                <Text style={[styles.frequencyButtonText, { color: colors.text }]}>
                  {getFrequencyLabel()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {frequency === 'monthly' && (
                <>
                  <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                    Dia do mês
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={dayOfMonth}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      if (text === '' || (num >= 1 && num <= 31)) {
                        setDayOfMonth(text);
                      }
                    }}
                    placeholder="1-31"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </>
              )}
            </View>
          )}
        </View>

        {/* BOTÃO SALVAR */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isRecurring ? 'Criar Recorrência' : 'Criar Transação'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL DE CATEGORIAS */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Categoria</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {type === 'income' ? '💰 Receitas' : '💸 Despesas'} • {filteredCategories.length} categoria(s)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setCategoryId('');
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.categoryIconSmall, { backgroundColor: colors.textSecondary }]}>
                  <Ionicons name="close" size={20} color="#fff" />
                </View>
                <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                  Nenhuma categoria
                </Text>
                {!categoryId && (
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              {filteredCategories.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Ionicons name="information-circle-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyCategoriesText, { color: colors.textSecondary }]}>
                    Nenhuma categoria de {type === 'income' ? 'receita' : 'despesa'} cadastrada
                  </Text>
                  <Text style={[styles.emptyCategoriesHint, { color: colors.textSecondary }]}>
                    Crie categorias em Ajustes → Gerenciar Categorias
                  </Text>
                </View>
              ) : (
                filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setCategoryId(category._id);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={[styles.categoryIconSmall, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon} size={20} color="#fff" />
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

      {/* 🆕 MODAL DE FREQUÊNCIA */}
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, height: '50%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Frequência</Text>
              <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFrequency(option.value as any);
                    setShowFrequencyModal(false);
                  }}
                >
                  <View style={[styles.categoryIconSmall, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name={option.icon as any} size={20} color={colors.primary} />
                  </View>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
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
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  recurrenceSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurrenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recurrenceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recurrenceSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  recurrenceConfig: {
    marginTop: 16,
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 12,
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalScroll: {
    flex: 1,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  emptyCategories: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyCategoriesText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyCategoriesHint: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});