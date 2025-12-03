import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { budgetAPI, categoryAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EditBudgetScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { budget } = route.params;
  const [name, setName] = useState(budget.name);
  const [amount, setAmount] = useState(budget.amount.toString());
  const [selectedCategory, setSelectedCategory] = useState<any>(budget.categoryId);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [endDate, setEndDate] = useState(budget.endDate ? new Date(budget.endDate) : new Date());
  const [renewalDay, setRenewalDay] = useState((budget.renewalDay || 1).toString());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const expenseCategories = response.data.filter((cat: any) => cat.type === 'expense');
      setCategories(expenseCategories);
      setLoading(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar categorias');
      setLoading(false);
    }
  };

  const getRenewalWarning = () => {
    const day = parseInt(renewalDay);
    if (isNaN(day)) return null;
    
    if (day === 31) {
      return '⚠️ Em meses com 30 dias ou menos, renovará no último dia do mês';
    }
    if (day === 30) {
      return '⚠️ Em fevereiro, renovará no dia 28 (ou 29 em ano bissexto)';
    }
    if (day === 29) {
      return '⚠️ Em fevereiro não-bissexto, renovará no dia 28';
    }
    return null;
  };

  const handleSave = async () => {
    if (!name || !amount || !selectedCategory) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const budgetAmount = parseFloat(amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const day = parseInt(renewalDay);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Erro', 'Digite um dia válido (1-31)');
      return;
    }

    setSaving(true);
    try {
      await budgetAPI.update(budget._id, {
        name,
        amount: budgetAmount,
        categoryId: selectedCategory._id,
        endDate,
        renewalDay: day
      });

      Alert.alert('Sucesso', 'Orçamento atualizado!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Falha ao atualizar orçamento';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Orçamento',
      'Tem certeza que deseja excluir este orçamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetAPI.delete(budget._id);
              Alert.alert('Sucesso', 'Orçamento excluído!', [
                { text: 'OK', onPress: () => navigation.navigate('BudgetsMain') }
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir orçamento');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = () => {
    if (budget.percentage >= 100) return colors.error;
    if (budget.percentage >= 80) return colors.warning;
    return colors.success;
  };

  const onEndDateChange = (event: any, date?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (date) {
      setEndDate(date);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Editar Orçamento</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.progressTitle, { color: colors.text }]}>Progresso do Mês</Text>
        <View style={styles.progressAmounts}>
          <View style={styles.amountBox}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Gasto</Text>
            <Text style={[styles.progressValue, { color: getStatusColor() }]}>
              {formatCurrency(budget.spent || 0)}
            </Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Orçamento</Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>{formatCurrency(budget.amount)}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Restante</Text>
            <Text style={[styles.progressValue, { color: budget.remaining >= 0 ? colors.success : colors.error }]}>
              {formatCurrency(budget.remaining || 0)}
            </Text>
          </View>
        </View>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { 
                width: `${Math.min(budget.percentage || 0, 100)}%`,
                backgroundColor: getStatusColor()
              }
            ]}
          />
        </View>
        <Text style={[styles.progressPercentage, { color: colors.textSecondary }]}>{(budget.percentage || 0).toFixed(0)}% utilizado</Text>

        {budget.dailyAverage > 0 && (
          <View style={[styles.dailyAverageBox, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.dailyAverageText, { color: colors.textSecondary }]}>
              Você pode gastar <Text style={[styles.dailyAverageBold, { color: colors.primary }]}>{formatCurrency(budget.dailyAverage)}/dia</Text> pelos próximos {budget.daysUntilRenewal} dias
            </Text>
          </View>
        )}
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Nome do Orçamento *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
            color: colors.text
          }]}
          placeholder="Ex: Alimentação, Lazer..."
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Valor Mensal *</Text>
        <TextInput
          style={[styles.amountInput, { 
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
            color: colors.text
          }]}
          placeholder="R$ 0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={[styles.label, { color: colors.text }]}>Categoria *</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category: any) => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryItem,
                { borderColor: colors.border },
                selectedCategory?._id === category._id && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '20'
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon} size={24} color="#fff" />
              </View>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.renewalSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⏱️ Renovação Automática</Text>
          
          <Text style={[styles.label, { color: colors.text }]}>Válido até</Text>
          <TouchableOpacity 
            style={[styles.dateButton, { 
              borderColor: colors.border,
              backgroundColor: colors.inputBackground
            }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndDateChange}
              locale="pt-BR"
              minimumDate={new Date()}
            />
          )}

          <Text style={[styles.label, { color: colors.text }]}>Dia de Renovação</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Escolha o dia do mês que o orçamento renova (1-31)
          </Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              backgroundColor: colors.inputBackground,
              color: colors.text
            }]}
            placeholder="Ex: 1, 15, 28..."
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={renewalDay}
            onChangeText={setRenewalDay}
            maxLength={2}
          />

          {getRenewalWarning() && (
            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="information-circle" size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>{getRenewalWarning()}</Text>
            </View>
          )}

          <View style={[styles.renewalInfoBox, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="sync" size={18} color={colors.primary} />
            <Text style={[styles.renewalInfoText, { color: colors.primary }]}>
              Próxima renovação: {format(new Date(budget.nextRenewal), "dd 'de' MMMM", { locale: ptBR })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  dailyAverageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  dailyAverageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  dailyAverageBold: {
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  amountInput: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  categoryItem: {
    alignItems: 'center',
    width: '30%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  renewalSection: {
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  renewalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 10,
  },
  renewalInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    padding: 18,
    borderRadius: 8,
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});