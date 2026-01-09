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
import { format, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AddBudgetScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [endDate, setEndDate] = useState(addYears(new Date(), 1));
  const [renewalDay, setRenewalDay] = useState('1');
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
      await budgetAPI.create({
        name,
        amount: budgetAmount,
        categoryId: selectedCategory._id,
        period: 'monthly',
        rollover: false,
        endDate,
        renewalDay: day
      });

      Alert.alert('Sucesso', 'Orçamento criado!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Falha ao criar orçamento';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
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
        <Text style={[styles.title, { color: colors.text }]}>Novo Orçamento</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Crie orçamentos que renovam automaticamente todo mês!
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Nome do Orçamento *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.card,
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
            backgroundColor: colors.card,
            color: colors.text
          }]}
          placeholder="R$ 0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={[styles.label, { color: colors.text }]}>Categoria *</Text>
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          Escolha a categoria para este orçamento
        </Text>
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
              backgroundColor: colors.card
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
              backgroundColor: colors.card,
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

          <View style={[styles.exampleCard, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={[styles.exampleText, { color: colors.warning }]}>
              Se escolher dia <Text style={styles.bold}>15</Text>, o orçamento renova todo dia 15 do mês até a data final.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Criando...' : 'Criar Orçamento'}
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
  form: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
  exampleCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 10,
    alignItems: 'center',
  },
  exampleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
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