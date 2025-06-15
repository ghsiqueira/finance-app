import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
  onPress?: (category: Category) => void;
  showActions?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onPress,
  showActions = true,
}) => {
  const handleDelete = () => {
    if (category.isDefault) {
      Alert.alert(
        'Categoria padrão',
        'Categorias padrão não podem ser excluídas.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Excluir categoria',
      `Tem certeza que deseja excluir a categoria "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => onDelete?.(category.id),
        },
      ]
    );
  };

  const getTypeLabel = () => {
    switch (category.type) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Gasto';
      case 'both':
        return 'Ambos';
      default:
        return '';
    }
  };

  const getTypeColor = () => {
    switch (category.type) {
      case 'income':
        return '#16a34a';
      case 'expense':
        return '#dc2626';
      case 'both':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(category)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* 🎨 ÍCONE E INFORMAÇÕES */}
        <View style={styles.leftSection}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: category.color + '20' }
          ]}>
            <Ionicons
              name={category.icon as any}
              size={24}
              color={category.color}
            />
          </View>
          
          <View style={styles.info}>
            <Text style={styles.name}>{category.name}</Text>
            <View style={styles.metadata}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor() + '15' }
              ]}>
                <Text style={[styles.typeText, { color: getTypeColor() }]}>
                  {getTypeLabel()}
                </Text>
              </View>
              {category.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Padrão</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 🔧 AÇÕES */}
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(category)}
              >
                <Ionicons name="pencil" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
            
            {onDelete && !category.isDefault && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface CategoryListProps {
  categories: Category[];
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
  onPress?: (category: Category) => void;
  emptyMessage?: string;
  showActions?: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onPress,
  emptyMessage = 'Nenhuma categoria encontrada',
  showActions = true,
}) => {
  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          Crie uma categoria para organizar suas transações
        </Text>
      </View>
    );
  }

  // Agrupar por tipo
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const bothCategories = categories.filter(c => c.type === 'both');

  return (
    <View style={styles.list}>
      {/* RECEITAS */}
      {incomeCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receitas</Text>
          {incomeCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
              onPress={onPress}
              showActions={showActions}
            />
          ))}
        </View>
      )}

      {/* GASTOS */}
      {expenseCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos</Text>
          {expenseCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
              onPress={onPress}
              showActions={showActions}
            />
          ))}
        </View>
      )}

      {/* AMBOS */}
      {bothCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geral</Text>
          {bothCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
              onPress={onPress}
              showActions={showActions}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Lista
  list: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },

  // Estado vazio
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});