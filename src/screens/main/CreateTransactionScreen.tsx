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

import { CustomInput } from '../../components/common/CustomInput';
import { CustomButton } from '../../components/common/CustomButton';
import { Loading } from '../../components/common/Loading';
import FinanceService from '../../services/finance';
import { Category, TransactionForm } from '../../types';

// 📝 VALIDAÇÃO DO FORMULÁRIO
const transactionSchema = yup.object().shape({
  description: yup
    .string()
    .required('Descrição é obrigatória')
    .min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  amount: yup
    .string()
    .required('Valor é obrigatório')
    .test('is-valid-amount', 'Digite um valor válido', (value) => {
      if (!value) return false;
      const numValue = parseFloat(value.replace(',', '.'));
      return !isNaN(numValue) && numValue > 0;
    }),
  type: yup
    .mixed<'income' | 'expense'>()
    .oneOf(['income', 'expense'], 'Tipo inválido')
    .required('Tipo é obrigatório'),
  categoryId: yup
    .string()
    .required('Categoria é obrigatória'),
  date: yup
    .date()
    .required('Data é obrigatória'),
  notes: yup.string().optional(),
}) as yup.ObjectSchema<TransactionForm>;

interface CreateTransactionScreenProps {
  navigation: any;
  route: {
    params?: {
      type?: 'income' | 'expense';
    };
  };
}

export const CreateTransactionScreen: React.FC<CreateTransactionScreenProps> = ({
  navigation,
  route,
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
    route.params?.type || 'expense'
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      type: selectedType,
      categoryId: '',
      date: new Date(),
      notes: '',
    },
  });

  const watchedType = watch('type');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedType(watchedType);
  }, [watchedType]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await FinanceService.getCategories();
      setCategories(data);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoadingCategories(false);
    }
  };

  const onSubmit = async (data: TransactionForm) => {
    setLoading(true);
    try {
      const transactionData = {
        description: data.description,
        amount: parseFloat(data.amount.replace(',', '.')),
        type: data.type,
        categoryId: data.categoryId,
        date: data.date.toISOString(),
        notes: data.notes || undefined,
      };

      await FinanceService.createTransaction(transactionData);
      
      Alert.alert(
        'Sucesso!',
        'Transação criada com sucesso!',
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
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const amount = parseInt(numbers, 10) / 100;
    
    // Formata como moeda brasileira
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setValue('amount', formatted);
  };

  const getFilteredCategories = () => {
    return categories.filter(category => 
      category.type === selectedType || category.type === 'both'
    );
  };

  const typeOptions = [
    { 
      id: 'expense' as const, 
      label: 'Gasto', 
      icon: 'arrow-down-circle' as const,
      color: '#dc2626',
      bgColor: '#fef2f2'
    },
    { 
      id: 'income' as const, 
      label: 'Receita', 
      icon: 'arrow-up-circle' as const,
      color: '#16a34a',
      bgColor: '#dcfce7'
    },
  ];

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
        <Text style={styles.title}>Nova Transação</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 💰 TIPO DE TRANSAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo</Text>
          <Controller
            control={control}
            name="type"
            render={({ field: { value, onChange } }) => (
              <View style={styles.typeContainer}>
                {typeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.typeOption,
                      { backgroundColor: option.bgColor },
                      value === option.id && styles.typeOptionSelected,
                    ]}
                    onPress={() => onChange(option.id)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={option.color}
                    />
                    <Text style={[
                      styles.typeOptionText,
                      { color: option.color }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.type && (
            <Text style={styles.errorText}>{errors.type.message}</Text>
          )}
        </View>

        {/* 📝 DESCRIÇÃO */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Descrição"
                placeholder="Ex: Compra no supermercado"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                icon="text"
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
                label="Valor"
                placeholder="0,00"
                value={value}
                onChangeText={handleAmountChange}
                error={errors.amount?.message}
                icon="cash"
                keyboardType="numeric"
                containerStyle={styles.amountInput}
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
                <View style={styles.categoriesContainer}>
                  {getFilteredCategories().map((category) => (
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
                </View>
              )}
            />
          )}
          {errors.categoryId && (
            <Text style={styles.errorText}>{errors.categoryId.message}</Text>
          )}
        </View>

        {/* 📅 DATA */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity style={styles.dateButton}>
                <Ionicons name="calendar" size={20} color="#6b7280" />
                <Text style={styles.dateText}>
                  {value.toLocaleDateString('pt-BR')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          />
          {errors.date && (
            <Text style={styles.errorText}>{errors.date.message}</Text>
          )}
        </View>

        {/* 📝 OBSERVAÇÕES */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Observações (opcional)"
                placeholder="Adicione uma nota..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                icon="document-text"
                multiline
                numberOfLines={3}
              />
            )}
          />
        </View>

        {/* 🎯 BOTÃO SALVAR */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Criar Transação"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            icon="checkmark"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Loading visible={loading} text="Criando transação..." />
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
  
  // Tipo de transação
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: '#3b82f6',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Valor
  amountInput: {
    marginBottom: 0,
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '45%',
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  categoryTextSelected: {
    color: '#3b82f6',
  },
  
  // Data
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
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