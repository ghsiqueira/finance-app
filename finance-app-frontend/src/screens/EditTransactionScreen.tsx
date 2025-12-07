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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI, categoryAPI, recurrenceAPI } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RecurrenceConfigModal from '../components/RecurrenceConfigModal';

export default function EditTransactionScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  
  const transaction = route?.params?.transaction;

  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [date, setDate] = useState(transaction?.date ? new Date(transaction.date) : new Date());
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId?._id || '');
  const [categories, setCategories] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [hasRecurrence, setHasRecurrence] = useState(!!transaction?.recurringConfig?.frequency);
  const [recurringConfig, setRecurringConfig] = useState(transaction?.recurringConfig || null);

  useEffect(() => {
    if (!transaction) {
      Alert.alert('Erro', 'Dados da transação não fornecidos');
      navigation.goBack();
      return;
    }
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
        Alert.alert(
          'Categoria removida',
          `A categoria "${selectedCategory.name}" foi removida porque não é uma categoria de ${newType === 'income' ? 'receita' : 'despesa'}.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleEditRecurrence = async (frequency: string, dayOfMonth?: number) => {
    try {
      await recurrenceAPI.editRecurrence(transaction._id, {
        frequency,
        dayOfMonth,
        isBusinessDay: false,
      });
      
      setRecurringConfig({
        frequency,
        dayOfMonth,
        isBusinessDay: false,
      });
      
      setShowRecurrenceModal(false);
      Alert.alert('Sucesso', 'Recorrência atualizada!');
    } catch (error) {
      console.error('❌ Erro ao editar recorrência:', error);
      Alert.alert('Erro', 'Falha ao editar recorrência');
    }
  };

  const handleRemoveRecurrence = () => {
    Alert.alert(
      'Remover Recorrência',
      'Tem certeza que deseja remover a recorrência desta transação?\n\nA transação será mantida, mas não será mais gerada automaticamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await recurrenceAPI.delete(transaction._id, false);
              setHasRecurrence(false);
              setRecurringConfig(null);
              Alert.alert('Sucesso', 'Recorrência removida!');
            } catch (error) {
              console.error('❌ Erro ao remover recorrência:', error);
              Alert.alert('Erro', 'Falha ao remover recorrência');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
      await transactionAPI.update(transaction._id, {
        description: description.trim(),
        amount: parsedAmount,
        type,
        date: date.toISOString(),
        categoryId: categoryId || undefined,
      });
      Alert.alert('Sucesso', 'Transação atualizada!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Erro', 'Falha ao atualizar transação');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(c => c._id === categoryId);
  };

  const selectedCategory = getSelectedCategory();

  const getFrequencyLabel = (config: any) => {
    if (!config) return '';
    
    const labels: { [key: string]: string } = {
      daily: 'Diária',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      yearly: 'Anual',
    };

    let label = labels[config.frequency] || 'Mensal';
    
    if (config.frequency === 'monthly' && config.dayOfMonth) {
      label += ` • Dia ${config.dayOfMonth}`;
    }

    return label;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
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
              {selectedCategory.type !== type && (
                <View style={[styles.wrongTypeBadge, { backgroundColor: colors.warning }]}>
                  <Ionicons name="warning" size={14} color="#fff" />
                </View>
              )}
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

        {selectedCategory && selectedCategory.type !== type && (
          <View style={[styles.warningBox, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              A categoria "{selectedCategory.name}" é de {selectedCategory.type === 'income' ? 'receita' : 'despesa'}. 
              Considere selecionar uma categoria de {type === 'income' ? 'receita' : 'despesa'}.
            </Text>
          </View>
        )}

        {/* 🆕 SEÇÃO DE RECORRÊNCIA */}
        {hasRecurrence && recurringConfig && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Recorrência</Text>
            <View style={[styles.recurrenceCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={styles.recurrenceInfo}>
                <View style={[styles.recurrenceIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="repeat" size={24} color={colors.primary} />
                </View>
                <View style={styles.recurrenceText}>
                  <Text style={[styles.recurrenceLabel, { color: colors.text }]}>
                    {getFrequencyLabel(recurringConfig)}
                  </Text>
                  <Text style={[styles.recurrenceHint, { color: colors.textSecondary }]}>
                    Transação recorrente
                  </Text>
                </View>
              </View>
              <View style={styles.recurrenceActions}>
                <TouchableOpacity
                  style={[styles.recurrenceButton, { backgroundColor: colors.info + '15' }]}
                  onPress={() => setShowRecurrenceModal(true)}
                >
                  <Ionicons name="create-outline" size={20} color={colors.info} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recurrenceButton, { backgroundColor: colors.error + '15' }]}
                  onPress={handleRemoveRecurrence}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

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
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
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
              {/* Opção "Nenhuma" */}
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

      {/* 🆕 MODAL DE EDITAR RECORRÊNCIA */}
      <RecurrenceConfigModal
        visible={showRecurrenceModal}
        transaction={transaction}
        mode="edit"
        onClose={() => setShowRecurrenceModal(false)}
        onConfirm={handleEditRecurrence}
      />
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
  wrongTypeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  recurrenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  recurrenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recurrenceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurrenceText: {
    flex: 1,
  },
  recurrenceLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  recurrenceHint: {
    fontSize: 13,
  },
  recurrenceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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