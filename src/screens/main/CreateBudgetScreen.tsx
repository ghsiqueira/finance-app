import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { addMonths, addWeeks, addYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { CustomInput } from '../../components/common/CustomInput';
import { CustomButton } from '../../components/common/CustomButton';
import { Loading } from '../../components/common/Loading';
import FinanceService from '../../services/finance';
import { Category, BudgetForm } from '../../types';

// 📝 VALIDAÇÃO DO FORMULÁRIO
const budgetSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  amount: yup
    .string()
    .required('Valor é obrigatório')
    .test('is-valid-amount', 'Digite um valor válido', (value) => {
      if (!value) return false;
      const numValue = parseFloat(value.replace(',', '.'));
      return !isNaN(numValue) && numValue > 0;
    }),
  categoryId: yup
    .string()
    .required('Categoria é obrigatória'),
  period: yup
    .string()
    .oneOf(['weekly', 'monthly', 'quarterly', 'yearly'], 'Período inválido')
    .required('Período é obrigatório'),
  alertThreshold: yup
    .string()
    .required('Limite de alerta é obrigatório')
    .test('is-valid-threshold', 'Digite um valor entre 1 e 100', (value) => {
      if (!value) return false;
      const numValue = parseFloat(value.replace(',', '.'));
      return !isNaN(numValue) && numValue >= 1 && numValue <= 100;
    }),
  autoRenew: yup.boolean(),
});

interface CreateBudgetScreenProps {
  navigation: any;
}

export const CreateBudgetScreen: React.FC<CreateBudgetScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: yupResolver(budgetSchema),
    defaultValues: {
      name: '',
      amount: '',
      categoryId: '',
      period: 'monthly',
      alertThreshold: '80',
      autoRenew: false,
    },
  });

  const watchedPeriod = watch('period');
  const watchedAmount = watch('amount');
  const watchedCategoryId = watch('categoryId');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await FinanceService.getCategories();
      // Filtrar apenas categorias de gastos
      const expenseCategories = data.filter(c => c.type === 'expense' || c.type === 'both');
      setCategories(expenseCategories);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoadingCategories(false);
    }
  };

  const onSubmit = async (data: BudgetForm) => {
    setLoading(true);
    try {
      const startDate = new Date();
      let endDate: Date;

      // Calcular data final baseada no período
      switch (data.period) {
        case 'weekly':
          endDate = addWeeks(startDate, 1);
          break;
        case 'monthly':
          endDate = addMonths(startDate, 1);
          break;
        case 'quarterly':
          endDate = addMonths(startDate, 3);
          break;
        case 'yearly':
          endDate = addYears(startDate, 1);
          break;
        default:
          endDate = addMonths(startDate, 1);
      }

      const budgetData = {
        name: data.name,
        amount: parseFloat(data.amount.replace(',', '.')),
        categoryId: data.categoryId,
        period: data.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        alertThreshold: parseFloat(data.alertThreshold.replace(',', '.')),
        autoRenew: data.autoRenew,
      };

      await FinanceService.createBudget(budgetData);
      
      Alert.alert(
        'Sucesso!',
        'Orçamento criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setValue('amount', formatted);
  };

  const calculateEndDate = () => {
    const startDate = new Date();
    let endDate: Date;

    switch (watchedPeriod) {
      case 'weekly':
        endDate = addWeeks(startDate, 1);
        break;
      case 'monthly':
        endDate = addMonths(startDate, 1);
        break;
      case 'quarterly':
        endDate = addMonths(startDate, 3);
        break;
      case 'yearly':
        endDate = addYears(startDate, 1);
        break;
      default:
        endDate = addMonths(startDate, 1);
    }

    return {
      startDate: format(startDate, 'dd/MM/yyyy', { locale: ptBR }),
      endDate: format(endDate, 'dd/MM/yyyy', { locale: ptBR }),
    };
  };

  const getSelectedCategory = () => {
    return categories.find(c => c.id === watchedCategoryId);
  };

  // 📅 OPÇÕES DE PERÍODO
  const periodOptions = [
    {
      id: 'weekly' as const,
      label: 'Semanal',
      description: 'Renovado toda semana',
      icon: 'calendar' as const,
    },
    {
      id: 'monthly' as const,
      label: 'Mensal',
      description: 'Renovado todo mês',
      icon: 'calendar-outline' as const,
    },
    {
      id: 'quarterly' as const,
      label: 'Trimestral',
      description: 'Renovado a cada 3 meses',
      icon: 'calendar-clear' as const,
    },
    {
      id: 'yearly' as const,
      label: 'Anual',
      description: 'Renovado todo ano',
      icon: 'calendar-number' as const,
    },
  ];

  const dates = calculateEndDate();
  const selectedCategory = getSelectedCategory();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 🎨 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Orçamento</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🎯 PREVIEW */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={[
                styles.previewIcon,
                { backgroundColor: selectedCategory?.color + '20' || '#f3f4f6' }
              ]}>
                <Ionicons
                  name={selectedCategory?.icon as any || 'wallet'}
                  size={24}
                  color={selectedCategory?.color || '#6b7280'}
                />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {watch('name') || 'Nome do orçamento'}
                </Text>
                <Text style={styles.previewCategory}>
                  {selectedCategory?.name || 'Categoria'}
                </Text>
              </View>
            </View>
            <Text style={styles.previewAmount}>
              {watchedAmount ? `R$ ${watchedAmount}` : 'R$ 0,00'}
            </Text>
            <Text style={styles.previewPeriod}>
              {dates.startDate} - {dates.endDate}
            </Text>
          </View>
        </View>

        {/* 📝 NOME */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Nome do orçamento"
                placeholder="Ex: Alimentação Mensal"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                icon="text"
                maxLength={50}
              />
            )}
          />
        </View>

        {/* 💵 VALOR */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="amount"
            render={({ field: { value } }) => (
              <CustomInput
                label="Valor do orçamento"
                placeholder="0,00"
                value={value}
                onChangeText={handleAmountChange}
                error={errors.amount?.message}
                icon="cash"
                keyboardType="numeric"
              />
            )}
          />
        </View>

        {/* 📂 CATEGORIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria</Text>
          {loadingCategories ? (
            <View style={styles.loadingCategories}>
              <Loading visible={false} />
              <Text style={styles.loadingText}>Carregando categorias...</Text>
            </View>
          ) : (
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { value, onChange } }) => (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesScroll}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        value === category.id && styles.categoryOptionSelected,
                      ]}
                      onPress={() => onChange(category.id)}
                    >
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: category.color + '20' }
                      ]}>
                        <Ionicons
                          name={category.icon as any}
                          size={20}
                          color={category.color}
                        />
                      </View>
                      <Text style={[
                        styles.categoryText,
                        value === category.id && styles.categoryTextSelected,
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            />
          )}
          {errors.categoryId && (
            <Text style={styles.errorText}>{errors.categoryId.message}</Text>
          )}
        </View>

        {/* 📅 PERÍODO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período</Text>
          <Controller
            control={control}
            name="period"
            render={({ field: { value, onChange } }) => (
              <View style={styles.periodGrid}>
                {periodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.periodOption,
                      value === option.id && styles.periodOptionSelected,
                    ]}
                    onPress={() => onChange(option.id)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={value === option.id ? '#3b82f6' : '#6b7280'}
                    />
                    <View style={styles.periodContent}>
                      <Text style={[
                        styles.periodLabel,
                        value === option.id && styles.periodLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.periodDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.period && (
            <Text style={styles.errorText}>{errors.period.message}</Text>
          )}
        </View>

        {/* ⚠️ LIMITE DE ALERTA */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="alertThreshold"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Limite de alerta (%)"
                placeholder="80"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.alertThreshold?.message}
                icon="alert-circle"
                keyboardType="numeric"
                helperText="Você será alertado quando atingir este percentual"
              />
            )}
          />
        </View>

        {/* 🔄 RENOVAÇÃO AUTOMÁTICA */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="autoRenew"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={styles.switchOption}
                onPress={() => onChange(!value)}
              >
                <View style={styles.switchContent}>
                  <Ionicons name="refresh" size={20} color="#3b82f6" />
                  <View style={styles.switchText}>
                    <Text style={styles.switchLabel}>Renovação automática</Text>
                    <Text style={styles.switchDescription}>
                      Renova automaticamente quando o período acabar
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.switch,
                  value && styles.switchActive,
                ]}>
                  <View style={[
                    styles.switchThumb,
                    value && styles.switchThumbActive,
                  ]} />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 📅 PERÍODO CALCULADO */}
        <View style={styles.section}>
          <View style={styles.periodInfo}>
            <Text style={styles.periodInfoTitle}>Período do orçamento</Text>
            <View style={styles.periodDates}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Início</Text>
                <Text style={styles.dateValue}>{dates.startDate}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#6b7280" />
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Fim</Text>
                <Text style={styles.dateValue}>{dates.endDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 🎯 BOTÃO SALVAR */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Criar Orçamento"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            icon="checkmark"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Loading visible={loading} text="Criando orçamento..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  
  // Preview
  previewSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  previewCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  previewAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  previewPeriod: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Categorias
  loadingCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  categoriesScroll: {
    marginTop: 8,
  },
  categoryOption: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#3b82f6',
  },
  
  // Período
  periodGrid: {
    gap: 12,
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  periodContent: {
    marginLeft: 12,
    flex: 1,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  periodLabelSelected: {
    color: '#3b82f6',
  },
  periodDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // Switch
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    marginLeft: 12,
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#3b82f6',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  
  // Período info
  periodInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  periodDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Botão
  buttonContainer: {
    marginTop: 32,
    marginBottom: 20,
  },
  bottomPadding: {
    height: 40,
  },
  
  // Erro
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
});