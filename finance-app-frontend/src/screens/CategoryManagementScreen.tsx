import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { categoryAPI } from '../services/api';

const ICON_OPTIONS = [
  'restaurant', 'car', 'medical', 'school', 'game-controller', 'home',
  'airplane', 'trending-up', 'shirt', 'laptop', 'wallet', 'gift',
  'cash', 'briefcase', 'paw', 'receipt', 'pizza', 'beer', 'cafe',
  'bus', 'bicycle', 'fitness', 'film', 'musical-notes', 'book',
  'construct', 'hammer', 'heart', 'leaf', 'star', 'trophy'
];

const COLOR_OPTIONS = [
  '#FF6B35', '#4A90E2', '#E74C3C', '#9B59B6', '#2ECC71', '#8B4513',
  '#1ABC9C', '#27AE60', '#E91E63', '#3498DB', '#F39C12', '#FF5252',
  '#4CAF50', '#00BCD4', '#795548', '#607D8B', '#FF9800', '#9C27B0',
  '#673AB7', '#3F51B5', '#2196F3', '#009688', '#00897B', '#388E3C'
];

export default function CategoryManagementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [selectedColor, setSelectedColor] = useState('#F39C12');
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSelectedIcon('wallet');
    setSelectedColor('#F39C12');
    setSelectedType('expense');
    setShowModal(true);
  };

  const openEditModal = (category: any) => {
    if (category.isDefault) {
      Alert.alert('Atenção', 'Categorias padrão não podem ser editadas');
      return;
    }
    setEditingCategory(category);
    setName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setSelectedType(category.type);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome da categoria');
      return;
    }

    try {
      setLoading(true);
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, {
          name,
          icon: selectedIcon,
          color: selectedColor,
          type: selectedType
        });
        Alert.alert('Sucesso', 'Categoria atualizada!');
      } else {
        await categoryAPI.create({
          name,
          icon: selectedIcon,
          color: selectedColor,
          type: selectedType
        });
        Alert.alert('Sucesso', 'Categoria criada!');
      }
      setShowModal(false);
      await loadCategories();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (category: any) => {
    if (category.isDefault) {
      Alert.alert('Atenção', 'Categorias padrão não podem ser excluídas');
      return;
    }

    Alert.alert(
      'Excluir Categoria',
      `Tem certeza que deseja excluir "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryAPI.delete(category._id);
              Alert.alert('Sucesso', 'Categoria excluída!');
              await loadCategories();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir categoria');
            }
          }
        }
      ]
    );
  };

  const renderCategory = ({ item }: any) => (
    <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
      <View style={styles.categoryLeft}>
        <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={24} color="#fff" />
        </View>
        <View style={styles.categoryInfo}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: colors.info }]}>
                <Text style={styles.defaultBadgeText}>Padrão</Text>
              </View>
            )}
          </View>
          <Text style={[styles.categoryType, { color: colors.textSecondary }]}>
            {item.type === 'expense' ? '💸 Despesa' : '💰 Receita'}
          </Text>
        </View>
      </View>
      {!item.isDefault && (
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info }]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && categories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Categorias</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Categorias</Text>
        <TouchableOpacity onPress={openCreateModal}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma categoria encontrada
            </Text>
          </View>
        }
      />

      {/* MODAL CRIAR/EDITAR */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Academia"
                placeholderTextColor={colors.placeholder}
              />

              <Text style={[styles.label, { color: colors.text }]}>Tipo</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: selectedType === 'expense' ? colors.error : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setSelectedType('expense')}
                >
                  <Text style={[styles.typeButtonText, { color: selectedType === 'expense' ? '#fff' : colors.text }]}>
                    💸 Despesa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: selectedType === 'income' ? colors.success : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setSelectedType('income')}
                >
                  <Text style={[styles.typeButtonText, { color: selectedType === 'income' ? '#fff' : colors.text }]}>
                    💰 Receita
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Ícone</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowIconPicker(true)}
              >
                <View style={[styles.iconPreview, { backgroundColor: selectedColor }]}>
                  <Ionicons name={selectedIcon as any} size={24} color="#fff" />
                </View>
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  Selecionar ícone
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.text }]}>Cor</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowColorPicker(true)}
              >
                <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  Selecionar cor
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL SELECIONAR ÍCONE */}
      <Modal
        visible={showIconPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIconPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Ícone</Text>
            <ScrollView contentContainerStyle={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { 
                      backgroundColor: selectedIcon === icon ? selectedColor : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => {
                    setSelectedIcon(icon);
                    setShowIconPicker(false);
                  }}
                >
                  <Ionicons 
                    name={icon as any} 
                    size={28} 
                    color={selectedIcon === icon ? '#fff' : colors.text} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SELECIONAR COR */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Cor</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color }
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    setShowColorPicker(false);
                  }}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  list: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryType: {
    fontSize: 13,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerModal: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  iconOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});