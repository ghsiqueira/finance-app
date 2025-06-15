import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { CategoryList } from '../../components/common/CategoryCard';
import { Loading } from '../../components/common/Loading';
import { Category } from '../../types';
import FinanceService from '../../services/finance';

interface CategoriesScreenProps {
  navigation: any;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // 🔄 CARREGAR DADOS AO FOCAR NA TELA
  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await FinanceService.getCategories();
      setCategories(data);

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCategories(true);
  };

  const handleEditCategory = (category: Category) => {
    navigation.navigate('EditCategory', { categoryId: category.id });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      await FinanceService.deleteCategory(categoryId);
      
      // Remover da lista local
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      
      Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    navigation.navigate('CreateCategory');
  };

  const getFilteredCategories = () => {
    if (filter === 'all') {
      return categories;
    }
    return categories.filter(category => 
      category.type === filter || category.type === 'both'
    );
  };

  const filteredCategories = getFilteredCategories();

  const filterOptions = [
    { id: 'all', label: 'Todas', icon: 'grid' as const },
    { id: 'income', label: 'Receitas', icon: 'arrow-up-circle' as const },
    { id: 'expense', label: 'Gastos', icon: 'arrow-down-circle' as const },
  ];

  const getCategoryStats = () => {
    const total = categories.length;
    const income = categories.filter(c => c.type === 'income').length;
    const expense = categories.filter(c => c.type === 'expense').length;
    const both = categories.filter(c => c.type === 'both').length;
    const custom = categories.filter(c => !c.isDefault).length;

    return { total, income, expense, both, custom };
  };

  const stats = getCategoryStats();

  if (loading && categories.length === 0) {
    return <Loading visible={true} text="Carregando categorias..." />;
  }

  return (
    <View style={styles.container}>
      {/* 🎨 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Categorias</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateCategory}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 📊 ESTATÍSTICAS */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.income}</Text>
            <Text style={styles.statLabel}>Receitas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.expense}</Text>
            <Text style={styles.statLabel}>Gastos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.custom}</Text>
            <Text style={styles.statLabel}>Personalizadas</Text>
          </View>
        </View>

        {/* 🔍 FILTROS */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtrar por tipo</Text>
          <View style={styles.filterButtons}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterButton,
                  filter === option.id && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(option.id as any)}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={filter === option.id ? '#3b82f6' : '#6b7280'}
                />
                <Text style={[
                  styles.filterButtonText,
                  filter === option.id && styles.filterButtonTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 📋 LISTA DE CATEGORIAS */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {filter === 'all' ? 'Todas as categorias' : 
               filter === 'income' ? 'Categorias de receita' : 
               'Categorias de gasto'}
            </Text>
            <Text style={styles.listCount}>
              {filteredCategories.length} categoria{filteredCategories.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <CategoryList
            categories={filteredCategories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            emptyMessage={
              filter === 'all' 
                ? 'Nenhuma categoria encontrada'
                : `Nenhuma categoria de ${filter === 'income' ? 'receita' : 'gasto'} encontrada`
            }
          />
        </View>

        {/* 💡 DICAS */}
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Dica</Text>
              <Text style={styles.tipText}>
                Organize suas transações criando categorias personalizadas. 
                Use ícones e cores para facilitar a identificação.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 🎯 FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateCategory}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Estatísticas
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Filtros
  filtersContainer: {
    marginBottom: 24,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#3b82f6',
  },
  
  // Lista
  listContainer: {
    flex: 1,
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  listCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Dicas
  tipsContainer: {
    marginTop: 24,
    marginBottom: 20,
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
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  bottomPadding: {
    height: 80,
  },
});