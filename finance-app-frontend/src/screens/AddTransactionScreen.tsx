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
import { transactionAPI, categoryAPI, budgetAPI } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddTransactionScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  
  const initialType = route?.params?.type || 'expense';
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [categoryId, setCategoryId] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(date.getDate().toString());
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, budgetsRes] = await Promise.all([
        categoryAPI.getAll(),
        budgetAPI.getAll(),
      ]);
      setCategories(categoriesRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === type);
  
  const filteredBudgets = budgets.filter(b => 
    type === 'expense' && 
    b.amount !== undefined &&
    b.amount !== null &&
    (!categoryId || b.categoryId?._id === categoryId)
  );

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    
    if (categoryId) {
      const selectedCategory = categories.find(c => c._id === categoryId);
      if (selectedCategory && selectedCategory.type !== newType) {
        setCategoryId('');
        setBudgetId('');
      }
    }
    
    if (newType === 'income') {
      setBudgetId('');
    }
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    
    if (budgetId) {
      const selectedBudget = budgets.find(b => b._id === budgetId);
      if (selectedBudget && selectedBudget.categoryId?._id !== newCategoryId) {
        setBudgetId('');
      }
    }
    
    setShowCategoryModal(false);
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

      console.log('💰 Criando transação...');
      await transactionAPI.create(transactionData);
      console.log('✅ Transação criada com sucesso!');
      
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setDayOfMonth(selectedDate.getDate().toString());
    }
  };

  const getFrequencyLabel = () => {
    const labels = {
      daily: 'Diariamente',
      weekly: 'Semanalmente',
      biweekly: 'Quinzenalmente',
      monthly: 'Mensalmente',
      yearly: 'Anualmente',
    };
    return labels[frequency];
  };

  const selectedCategory = categories.find(c => c._id === categoryId);
  const selectedBudget = budgets.find(b => b._id === budgetId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Nova Transação</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.text }]}>Tipo</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && { backgroundColor: colors.success },
              type !== 'income' && { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={() => handleTypeChange('income')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={24}
              color={type === 'income' ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                { color: type === 'income' ? '#fff' : colors.textSecondary }
              ]}
            >
              Receita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && { backgroundColor: colors.error },
              type !== 'expense' && { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={() => handleTypeChange('expense')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={24}
              color={type === 'expense' ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                { color: type === 'expense' ? '#fff' : colors.textSecondary }
              ]}
            >
              Despesa
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Almoço, Salário, Compras..."
          placeholderTextColor={colors.placeholder}
        />

        <Text style={[styles.label, { color: colors.text }]}>Valor (R$)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
        />

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
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <Text style={[styles.label, { color: colors.text }]}>
          Categoria (Opcional) · {filteredCategories.length} {type === 'income' ? 'receita(s)' : 'despesa(s)'}
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
              <Ionicons name="apps-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.categoryButtonText, { color: colors.textSecondary }]}>
                Selecionar categoria
              </Text>
            </>
          )}
        </TouchableOpacity>

        {type === 'expense' && categoryId && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              Orçamento (Opcional)
            </Text>
            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowBudgetModal(true)}
            >
              {budgetId ? (
                <>
                  <View style={styles.categoryInfo}>
                    <Ionicons name="wallet" size={24} color={colors.primary} />
                    <Text style={[styles.categoryButtonText, { color: colors.text }]}>
                      {selectedBudget?.name || selectedBudget?.categoryId?.name || 'Orçamento'}
                    </Text>
                  </View>
                  <View style={styles.categoryRight}>
                    {selectedBudget?.amount && (
                      <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                        R$ {selectedBudget.amount.toFixed(2)}
                      </Text>
                    )}
                    <TouchableOpacity onPress={() => setBudgetId('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={24} color={colors.textSecondary} />
                  <Text style={[styles.categoryButtonText, { color: colors.textSecondary }]}>
                    Vincular a um orçamento
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.recurrenceContainer}>
          <View style={styles.recurrenceHeader}>
            <View>
              <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                Transação Recorrente
              </Text>
              <Text style={[styles.recurrenceSubtitle, { color: colors.textSecondary }]}>
                Repetir automaticamente
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={isRecurring ? colors.primary : colors.textSecondary}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurrenceConfig}>
              <Text style={[styles.label, { color: colors.text }]}>Frequência</Text>
              <TouchableOpacity
                style={[styles.frequencyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowFrequencyModal(true)}
              >
                <Ionicons name="repeat" size={24} color={colors.primary} />
                <Text style={[styles.frequencyButtonText, { color: colors.text }]}>
                  {getFrequencyLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {frequency === 'monthly' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Dia do mês</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={dayOfMonth}
                    onChangeText={(value) => {
                      const num = parseInt(value);
                      if (value === '' || (!isNaN(num) && num >= 1 && num <= 31)) {
                        setDayOfMonth(value);
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

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Criar Transação</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CATEGORIA */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Selecionar Categoria
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {filteredCategories.length} {type === 'income' ? 'receita(s)' : 'despesa(s)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
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
                    onPress={() => handleCategoryChange(category._id)}
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

      {/* MODAL DE ORÇAMENTO */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Selecionar Orçamento
              </Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {filteredBudgets.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Ionicons name="information-circle-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyCategoriesText, { color: colors.textSecondary }]}>
                    {categoryId 
                      ? 'Nenhum orçamento para esta categoria'
                      : 'Selecione uma categoria primeiro'
                    }
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setBudgetId('');
                      setShowBudgetModal(false);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                    <Text style={[styles.categoryOptionText, { color: colors.textSecondary }]}>
                      Sem orçamento
                    </Text>
                  </TouchableOpacity>

                  {filteredBudgets.map((budget) => (
                    <TouchableOpacity
                      key={budget._id}
                      style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setBudgetId(budget._id);
                        setShowBudgetModal(false);
                      }}
                    >
                      <View style={styles.budgetOption}>
                        <Ionicons name="wallet" size={24} color={colors.primary} />
                        <View style={styles.budgetOptionInfo}>
                          <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                            {budget.name || budget.categoryId?.name}
                          </Text>
                          {budget.amount && (
                            <Text style={[styles.budgetLimitText, { color: colors.textSecondary }]}>
                              R$ {budget.amount.toFixed(2)}/mês
                            </Text>
                          )}
                        </View>
                      </View>
                      {budgetId === budget._id && (
                        <Ionicons name="checkmark" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE FREQUÊNCIA */}
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.frequencyModalContent, 
            { backgroundColor: colors.card }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Frequência</Text>
              <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {[
                { value: 'daily', label: 'Diariamente', icon: 'today' },
                { value: 'weekly', label: 'Semanalmente', icon: 'calendar' },
                { value: 'biweekly', label: 'Quinzenalmente', icon: 'calendar-outline' },
                { value: 'monthly', label: 'Mensalmente', icon: 'calendar-number' },
                { value: 'yearly', label: 'Anualmente', icon: 'calendar-sharp' },
              ].map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.frequencyOption,
                    { borderBottomColor: colors.border },
                    frequency === freq.value && { backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => {
                    setFrequency(freq.value as any);
                    setShowFrequencyModal(false);
                  }}
                >
                  <View style={[
                    styles.frequencyIconContainer,
                    { backgroundColor: frequency === freq.value ? colors.primary + '20' : colors.background }
                  ]}>
                    <Ionicons 
                      name={freq.icon as any} 
                      size={24} 
                      color={frequency === freq.value ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <Text style={[
                    styles.frequencyOptionText, 
                    { color: colors.text },
                    frequency === freq.value && { fontWeight: '700' }
                  ]}>
                    {freq.label}
                  </Text>
                  {frequency === freq.value && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
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
  title: {
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
    borderWidth: 1,
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
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurrenceContainer: {
    marginTop: 24,
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 40,
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
  frequencyModalContent: {
    minHeight: 450,
    maxHeight: '65%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
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
  budgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetOptionInfo: {
    flex: 1,
  },
  budgetLimitText: {
    fontSize: 12,
    marginTop: 2,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderBottomWidth: 1,
    marginHorizontal: 12,
  },
  frequencyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyOptionText: {
    fontSize: 17,
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