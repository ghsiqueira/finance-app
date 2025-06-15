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
import { Category } from '../../types';

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

interface EditCategoryScreenProps {
  navigation: any;
  route: {
    params: {
      categoryId: string;
    };
  };
}

export const EditCategoryScreen: React.FC<EditCategoryScreenProps> = ({
  navigation,
  route,
}) => {
  const { categoryId } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);

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

  useEffect(() => {
    loadCategory();
  }, []);

  const loadCategory = async () => {
    try {
      setLoadingCategory(true);
      const categoryData = await FinanceService.getCategoryById(categoryId);
      setCategory(categoryData);
      
      // Preencher formulário
      setValue('name', categoryData.name);
      setValue('type', categoryData.type);
      setValue('icon', categoryData.icon);
      setValue('color', categoryData.color);
      
    } catch (error: any) {
      Alert.alert('Erro', error.message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoadingCategory(false);
    }
  };

  const onSubmit = async (data: CategoryForm) => {
    if (!category) return;
    
    setLoading(true);
    try {
      await FinanceService.updateCategory(categoryId, data);
      
      Alert.alert(
        'Sucesso!',
        'Categoria atualizada com sucesso!',
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

  // 🎨 ÍCONES DISPONÍVEIS (mesmo do CreateCategory)
  const iconOptions = [
    'restaurant', 'cafe', 'fast-food', 'wine',
    'car', 'bus', 'airplane', 'bicycle', 'train',
    'home', 'bed', 'tv', 'wifi',
    'medical', 'fitness', 'heart', 'bandage',
    'briefcase', 'laptop', 'desktop', 'business',
    'school', 'library', 'book', 'pencil',
    'game-controller', 'musical-notes', 'film', 'camera',
    'bag', 'shirt', 'gift', 'card',
    'wallet', 'cash', 'trending-up', 'trending-down',
    'star', 'heart', 'thumbs-up', 'settings',
    'moon', 'sunny', 'cloudy', 'rainy',
    'leaf', 'flower', 'earth', 'flame',
  ];

  // 🎨 CORES DISPONÍVEIS (mesmo do CreateCategory)
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

  if (loadingCategory) {
    return <Loading visible={true} text="Carregando categoria..." />;
  }

  if (!category) {
    return null;
  }

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
        <Text style={styles.title}>Editar Categoria</Text>
        {category.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Padrão</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ⚠️ AVISO PARA CATEGORIA PADRÃO */}
        {category.isDefault && (
          <View style={styles.warningContainer}>
            <View style={styles.warning}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Categoria Padrão</Text>
                <Text style={styles.warningText}>
                  Esta é uma categoria padrão do sistema. Você pode editar apenas o nome e a cor.
                </Text>
              </View>
            </View>
          </View>
        )}

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
                {watch('name') || category.name}
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
                      category.isDefault && styles.typeOptionDisabled,
                    ]}
                    onPress={() => !category.isDefault && onChange(option.id)}
                    disabled={category.isDefault}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={category.isDefault ? '#9ca3af' : option.color}
                    />
                    <View style={styles.typeOptionContent}>
                      <Text style={[
                        styles.typeOptionLabel,
                        { color: category.isDefault ? '#9ca3af' : option.color }
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.typeOptionDescription,
                        category.isDefault && { color: '#9ca3af' }
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                    {category.isDefault && (
                      <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                    )}
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
          <Text style={styles.sectionTitle}>
            Ícone {category.isDefault && <Text style={styles.disabledLabel}>(Bloqueado)</Text>}
          </Text>
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
                      category.isDefault && styles.iconOptionDisabled,
                    ]}
                    onPress={() => !category.isDefault && onChange(iconName)}
                    disabled={category.isDefault}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={
                        category.isDefault 
                          ? '#9ca3af' 
                          : value === iconName 
                            ? watchedColor 
                            : '#6b7280'
                      }
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

        {/* 🎯 BOTÃO SALVAR */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Salvar Alterações"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            icon="checkmark"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Loading visible={loading} text="Salvando alterações..." />
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
  defaultBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
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
  disabledLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 'normal',
  },
  
  // Aviso
  warningContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  warning: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
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
  typeOptionDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
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
  iconOptionDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.5,
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