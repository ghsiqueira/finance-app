import React, { useState } from 'react';
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

// 📝 VALIDAÇÃO DO FORMULÁRIO
const categorySchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(30, 'Nome deve ter no máximo 30 caracteres'),
  type: yup
    .string()
    .oneOf(['income', 'expense', 'both'], 'Tipo inválido')
    .required('Tipo é obrigatório'),
  icon: yup
    .string()
    .required('Ícone é obrigatório'),
  color: yup
    .string()
    .required('Cor é obrigatória'),
});

interface CategoryForm {
  name: string;
  type: 'income' | 'expense' | 'both';
  icon: string;
  color: string;
}

interface CreateCategoryScreenProps {
  navigation: any;
}

export const CreateCategoryScreen: React.FC<CreateCategoryScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      icon: 'ellipse',
      color: '#3b82f6',
    },
  });

  const watchedIcon = watch('icon');
  const watchedColor = watch('color');
  const watchedType = watch('type');

  const onSubmit = async (data: CategoryForm) => {
    setLoading(true);
    try {
      await FinanceService.createCategory(data);
      
      Alert.alert(
        'Sucesso!',
        'Categoria criada com sucesso!',
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

  // 🎨 ÍCONES DISPONÍVEIS
  const iconOptions = [
    // Alimentação
    'restaurant', 'cafe', 'fast-food', 'wine',
    // Transporte
    'car', 'bus', 'airplane', 'bicycle', 'train',
    // Casa
    'home', 'bed', 'tv', 'wifi',
    // Saúde
    'medical', 'fitness', 'heart', 'bandage',
    // Trabalho
    'briefcase', 'laptop', 'desktop', 'business',
    // Educação
    'school', 'library', 'book', 'pencil',
    // Lazer
    'game-controller', 'musical-notes', 'film', 'camera',
    // Compras
    'bag', 'shirt', 'gift', 'card',
    // Finanças
    'wallet', 'cash', 'trending-up', 'trending-down',
    // Outros
    'star', 'heart', 'thumbs-up', 'settings',
    'moon', 'sunny', 'cloudy', 'rainy',
    'leaf', 'flower', 'earth', 'flame',
  ];

  // 🎨 CORES DISPONÍVEIS
  const colorOptions = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#6b7280', '#374151', '#1f2937',
  ];

  // 💰 TIPOS DE CATEGORIA
  const typeOptions = [
    {
      id: 'expense' as const,
      label: 'Gastos',
      description: 'Para categorizar despesas',
      icon: 'arrow-down-circle' as const,
      color: '#dc2626',
      bgColor: '#fef2f2',
    },
    {
      id: 'income' as const,
      label: 'Receitas',
      description: 'Para categorizar ganhos',
      icon: 'arrow-up-circle' as const,
      color: '#16a34a',
      bgColor: '#dcfce7',
    },
    {
      id: 'both' as const,
      label: 'Ambos',
      description: 'Para receitas e gastos',
      icon: 'swap-horizontal' as const,
      color: '#3b82f6',
      bgColor: '#eff6ff',
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
        <Text style={styles.title}>Nova Categoria</Text>
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
            <View style={[
              styles.previewIcon,
              { backgroundColor: watchedColor + '20' }
            ]}>
              <Ionicons
                name={watchedIcon as any}
                size={32}
                color={watchedColor}
              />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>
                {watch('name') || 'Nome da categoria'}
              </Text>
              <Text style={[
                styles.previewType,
                { color: typeOptions.find(t => t.id === watchedType)?.color }
              ]}>
                {typeOptions.find(t => t.id === watchedType)?.label}
              </Text>
            </View>
          </View>
        </View>

        {/* 📝 NOME */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Nome da categoria"
                placeholder="Ex: Alimentação, Transporte..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                icon="text"
                maxLength={30}
              />
            )}
          />
        </View>

        {/* 💰 TIPO */}
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
                      size={20}
                      color={option.color}
                    />
                    <View style={styles.typeOptionContent}>
                      <Text style={[
                        styles.typeOptionLabel,
                        { color: option.color }
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.typeOptionDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.type && (
            <Text style={styles.errorText}>{errors.type.message}</Text>
          )}
        </View>

        {/* 🎨 ÍCONE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ícone</Text>
          <Controller
            control={control}
            name="icon"
            render={({ field: { value, onChange } }) => (
              <View style={styles.iconsContainer}>
                {iconOptions.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconOption,
                      value === iconName && styles.iconOptionSelected,
                    ]}
                    onPress={() => onChange(iconName)}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={value === iconName ? watchedColor : '#6b7280'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.icon && (
            <Text style={styles.errorText}>{errors.icon.message}</Text>
          )}
        </View>

        {/* 🌈 COR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cor</Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { value, onChange } }) => (
              <View style={styles.colorsContainer}>
                {colorOptions.map((colorValue) => (
                  <TouchableOpacity
                    key={colorValue}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorValue },
                      value === colorValue && styles.colorOptionSelected,
                    ]}
                    onPress={() => onChange(colorValue)}
                  >
                    {value === colorValue && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.color && (
            <Text style={styles.errorText}>{errors.color.message}</Text>
          )}
        </View>

        {/* 💡 DICAS */}
        <View style={styles.section}>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Dicas</Text>
                <Text style={styles.tipText}>
                  • Escolha nomes descritivos e fáceis de lembrar{'\n'}
                  • Use cores diferentes para facilitar a identificação{'\n'}
                  • Ícones ajudam a reconhecer rapidamente a categoria
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 🎯 BOTÃO SALVAR */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Criar Categoria"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            icon="checkmark"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Loading visible={loading} text="Criando categoria..." />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  previewIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  previewType: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Tipo
  typeContainer: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: '#3b82f6',
  },
  typeOptionContent: {
    marginLeft: 12,
    flex: 1,
  },
  typeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeOptionDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Ícones
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  
  // Cores
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Dicas
  tipsContainer: {
    marginTop: 8,
  },
  tip: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
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