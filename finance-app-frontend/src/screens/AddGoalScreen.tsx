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
import { goalAPI, categoryAPI } from '../services/api';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AddGoalScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deadline, setDeadline] = useState(addMonths(new Date(), 6));
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar categorias');
      setLoading(false);
    }
  };

  const calculateMonthsRemaining = () => {
    const now = new Date();
    const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    return Math.max(months, 1);
  };

  const calculateMonthlyTarget = () => {
    const amount = parseFloat(targetAmount);
    if (isNaN(amount)) return 0;
    const months = calculateMonthsRemaining();
    return amount / months;
  };

  const handleSave = async () => {
    if (!name || !targetAmount) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    if (deadline <= new Date()) {
      Alert.alert('Erro', 'A data limite deve ser futura');
      return;
    }

    setSaving(true);
    try {
      await goalAPI.create({
        name,
        targetAmount: amount,
        categoryId: selectedCategory?._id || null,
        deadline
      });

      Alert.alert('Sucesso', 'Meta criada!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Falha ao criar meta';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  };

  const onDeadlineChange = (event: any, date?: Date) => {
    setShowDeadlinePicker(Platform.OS === 'ios');
    if (date) {
      setDeadline(date);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const monthlyTarget = calculateMonthlyTarget();
  const monthsRemaining = calculateMonthsRemaining();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Nova Meta</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="flag" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Defina metas de economia e acompanhe seu progresso!
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Nome da Meta *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text
          }]}
          placeholder="Ex: Viagem para Europa, Carro Novo..."
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Valor da Meta *</Text>
        <TextInput
          style={[styles.amountInput, { 
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text
          }]}
          placeholder="R$ 0,00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={setTargetAmount}
        />

        <Text style={[styles.label, { color: colors.text }]}>Data Limite *</Text>
        <TouchableOpacity 
          style={[styles.dateButton, { 
            borderColor: colors.border,
            backgroundColor: colors.card
          }]}
          onPress={() => setShowDeadlinePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.dateButtonText, { color: colors.text }]}>
            {format(deadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {showDeadlinePicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDeadlineChange}
            locale="pt-BR"
            minimumDate={new Date()}
          />
        )}

        {monthlyTarget > 0 && (
          <View style={[styles.calculationCard, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="calculator" size={24} color={colors.primary} />
            <View style={styles.calculationText}>
              <Text style={[styles.calculationLabel, { color: colors.textSecondary }]}>Para atingir sua meta:</Text>
              <Text style={[styles.calculationValue, { color: colors.text }]}>
                Economize <Text style={[styles.calculationBold, { color: colors.primary }]}>{formatCurrency(monthlyTarget)}/mês</Text>
              </Text>
              <Text style={[styles.calculationDetail, { color: colors.textSecondary }]}>
                Durante {monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Categoria (Opcional)</Text>
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          Vincule a uma categoria específica
        </Text>
        <View style={styles.categoriesGrid}>
          <TouchableOpacity
            style={[
              styles.categoryItem,
              { borderColor: colors.border },
              !selectedCategory && { 
                borderColor: colors.primary,
                backgroundColor: colors.primary + '20'
              }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: colors.textSecondary }]}>
              <Ionicons name="close" size={24} color="#fff" />
            </View>
            <Text style={[styles.categoryName, { color: colors.text }]}>Nenhuma</Text>
          </TouchableOpacity>
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

        <View style={[styles.examplesCard, { backgroundColor: colors.warning + '20' }]}>
          <Text style={[styles.examplesTitle, { color: colors.warning }]}>💡 Exemplos de Metas:</Text>
          <Text style={[styles.exampleItem, { color: colors.warning }]}>• Viagem Internacional - R$ 10.000</Text>
          <Text style={[styles.exampleItem, { color: colors.warning }]}>• Fundo de Emergência - R$ 20.000</Text>
          <Text style={[styles.exampleItem, { color: colors.warning }]}>• Carro Novo - R$ 50.000</Text>
          <Text style={[styles.exampleItem, { color: colors.warning }]}>• Entrada do Apartamento - R$ 80.000</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Criando...' : 'Criar Meta'}
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
  calculationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  calculationText: {
    flex: 1,
  },
  calculationLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  calculationValue: {
    fontSize: 16,
    marginBottom: 2,
  },
  calculationBold: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  calculationDetail: {
    fontSize: 12,
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
  examplesCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exampleItem: {
    fontSize: 14,
    marginBottom: 6,
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