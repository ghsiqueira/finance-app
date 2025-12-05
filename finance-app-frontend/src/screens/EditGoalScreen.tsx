import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { goalAPI, categoryAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';

const ROLE_ICONS = {
  owner: { icon: 'ribbon', color: '#FFD700', label: 'Dono' },
  admin: { icon: 'shield-checkmark', color: '#FF6B6B', label: 'Admin' },
  contributor: { icon: 'share-social', color: '#4ECDC4', label: 'Colaborador' },
  viewer: { icon: 'eye', color: '#95E1D3', label: 'Visualizador' }
};

const ROLES = [
  { 
    value: 'admin', 
    label: 'Admin', 
    description: 'Compartilhar e gerenciar membros' 
  },
  { 
    value: 'contributor', 
    label: 'Colaborador', 
    description: 'Compartilhar e contribuir' 
  },
  { 
    value: 'viewer', 
    label: 'Visualizador', 
    description: 'Apenas visualizar e contribuir' 
  }
];

export default function EditGoalScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { goal: initialGoal, goalId } = route.params;
  const [goal, setGoal] = useState(initialGoal || null);
  const [initialLoading, setInitialLoading] = useState(!initialGoal);
  const [loading, setLoading] = useState(false);
  const [progressAmount, setProgressAmount] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editTargetAmount, setEditTargetAmount] = useState(goal.targetAmount.toString());
  const [editDeadline, setEditDeadline] = useState(new Date(goal.deadline));
  const [editCategoryId, setEditCategoryId] = useState(goal.categoryId?._id || goal.categoryId || '');
  const [categories, setCategories] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const memberInfo = goal.members?.find((m: any) => 
    m.userId?._id?.toString() === user?.id || m.userId?.toString() === user?.id
  );

  const isOwner = memberInfo?.role === 'owner';
  const isAdmin = memberInfo?.role === 'admin';
  const canEdit = isOwner;
  const canShare = isOwner || isAdmin || memberInfo?.role === 'contributor';
  const canViewMembers = true;

  useEffect(() => {
    loadGoal();
    loadCategories();
  }, []);

  const loadGoal = async (id?: string) => {
    try {
      const goalIdToLoad = id || goal?._id;
      if (!goalIdToLoad) return;
      
      const response = await goalAPI.getById(goalIdToLoad);
      const loadedGoal = response.data;
      
      setGoal(loadedGoal);
      setEditName(loadedGoal.name);
      setEditTargetAmount(loadedGoal.targetAmount.toString());
      setEditDeadline(new Date(loadedGoal.deadline));
      setEditCategoryId(loadedGoal.categoryId?._id || loadedGoal.categoryId || '');
      setInitialLoading(false);
    } catch (error) {
      console.error('Error loading goal:', error);
      Alert.alert('Erro', 'Falha ao carregar meta');
      navigation.goBack();
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEditGoal = async () => {
    const targetAmount = parseFloat(editTargetAmount);

    if (!editName.trim()) {
      Alert.alert('Erro', 'Digite o nome da meta');
      return;
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para a meta');
      return;
    }

    if (editDeadline <= new Date()) {
      Alert.alert('Erro', 'A data limite deve ser futura');
      return;
    }

    try {
      setLoading(true);
      await goalAPI.update(goal._id, {
        name: editName,
        targetAmount,
        deadline: editDeadline.toISOString(),
        categoryId: editCategoryId || undefined
      });
      await loadGoal();
      setShowEditModal(false);
      Alert.alert('Sucesso', 'Meta atualizada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar meta');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgress = async () => {
    const amount = parseFloat(progressAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    if (memberInfo?.contributionLimit) {
      const newContribution = memberInfo.currentContribution + amount;
      if (newContribution > memberInfo.contributionLimit) {
        const remaining = memberInfo.contributionLimit - memberInfo.currentContribution;
        Alert.alert(
          'Limite Excedido', 
          `Você atingiu seu limite de contribuição!\n\nLimite: ${formatCurrency(memberInfo.contributionLimit)}\nJá contribuído: ${formatCurrency(memberInfo.currentContribution)}\nRestante: ${formatCurrency(remaining)}`
        );
        return;
      }
    }

    try {
      setLoading(true);
      await goalAPI.addSharedProgress(goal._id, amount);
      await loadGoal();
      setProgressAmount('');
      setShowProgressModal(false);
      Alert.alert('Sucesso', `Contribuição de ${formatCurrency(amount)} adicionada!`);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao adicionar progresso');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      setLoading(true);
      const limit = newLimit ? parseFloat(newLimit) : undefined;
      await goalAPI.updateMemberRole(
        goal._id,
        selectedMember.userId._id || selectedMember.userId,
        newRole || selectedMember.role,
        limit
      );
      await loadGoal();
      setSelectedMember(null);
      setNewRole('');
      setNewLimit('');
      Alert.alert('Sucesso', 'Membro atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Alert.alert(
      'Remover Membro',
      'Tem certeza que deseja remover este membro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await goalAPI.removeMember(goal._id, memberId);
              await loadGoal();
              Alert.alert('Sucesso', 'Membro removido');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao remover membro');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLeaveGoal = () => {
    Alert.alert(
      'Sair da Meta',
      'Tem certeza que deseja sair desta meta compartilhada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await goalAPI.leaveGoal(goal._id);
              Alert.alert('Sucesso', 'Você saiu da meta', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao sair da meta');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteGoal = () => {
    Alert.alert(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await goalAPI.delete(goal._id);
              Alert.alert('Sucesso', 'Meta excluída', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir meta');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEditDeadline(selectedDate);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(c => c._id === editCategoryId);
  };

  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  const targetPerMember = goal.autoSplit && goal.members?.length > 0 
    ? goal.targetAmount / goal.members.length 
    : goal.targetAmount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes da Meta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* CARD PRINCIPAL */}
        <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            {goal.categoryId && (
              <View style={[styles.categoryIcon, { backgroundColor: goal.categoryId.color }]}>
                <Ionicons name={goal.categoryId.icon} size={24} color="#fff" />
              </View>
            )}
            <View style={styles.cardHeaderText}>
              <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
              {memberInfo && (
                <View style={[styles.roleBadge, { backgroundColor: ROLE_ICONS[memberInfo.role as keyof typeof ROLE_ICONS].color }]}>
                  <Ionicons 
                    name={ROLE_ICONS[memberInfo.role as keyof typeof ROLE_ICONS].icon as any} 
                    size={12} 
                    color="#fff" 
                  />
                  <Text style={styles.roleBadgeText}>
                    {ROLE_ICONS[memberInfo.role as keyof typeof ROLE_ICONS].label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.amountRow}>
              <Text style={[styles.currentAmount, { color: colors.primary }]}>
                {formatCurrency(goal.currentAmount)}
              </Text>
              <Text style={[styles.targetAmount, { color: colors.textSecondary }]}>
                de {formatCurrency(goal.targetAmount)}
              </Text>
            </View>

            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: colors.primary }]}
              />
            </View>

            <Text style={[styles.percentage, { color: colors.text }]}>{percentage.toFixed(1)}% atingido</Text>
          </View>

          {goal.isShared && goal.autoSplit && (
            <View style={[styles.infoBox, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
              <Ionicons name="people-circle" size={20} color={colors.info} />
              <Text style={[styles.infoText, { color: colors.info }]}>
                Sua parte: {formatCurrency(targetPerMember)}
                {memberInfo?.currentContribution > 0 && (
                  <Text style={{ fontWeight: 'bold' }}>
                    {'\n'}Você contribuiu: {formatCurrency(memberInfo.currentContribution)}
                  </Text>
                )}
              </Text>
            </View>
          )}

          {memberInfo?.contributionLimit && (
            <View style={[styles.infoBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text style={[styles.infoText, { color: colors.warning }]}>
                Limite: {formatCurrency(memberInfo.contributionLimit)}
                {'\n'}Restante: {formatCurrency(memberInfo.contributionLimit - memberInfo.currentContribution)}
              </Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Prazo</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {format(new Date(goal.deadline), "dd/MM/yyyy")}
              </Text>
            </View>
            {goal.isShared && (
              <View style={styles.detailItem}>
                <Ionicons name="people" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Membros</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {goal.members?.length || 0}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* AÇÕES */}
        <View style={styles.actionsSection}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.info }]}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Editar Meta</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowProgressModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Adicionar Progresso</Text>
          </TouchableOpacity>

          {canShare && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => navigation.navigate('ShareGoal', { goal })}
            >
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Compartilhar Meta</Text>
            </TouchableOpacity>
          )}

          {canViewMembers && goal.isShared && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4A90E2' }]}
              onPress={() => setShowMembersModal(true)}
            >
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Ver Membros ({goal.members?.length || 0})</Text>
            </TouchableOpacity>
          )}

          {!isOwner && goal.isShared && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              onPress={handleLeaveGoal}
            >
              <Ionicons name="exit" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Sair da Meta</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleDeleteGoal}
            >
              <Ionicons name="trash" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Excluir Meta</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* HISTÓRICO DE PROGRESSO */}
        {goal.progressHistory && goal.progressHistory.length > 0 && (
          <View style={[styles.historySection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico de Contribuições</Text>
            {goal.progressHistory.slice(-5).reverse().map((item: any, index: number) => (
              <View key={index} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="trending-up" size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.historyName, { color: colors.text }]}>
                      {item.addedByName}
                    </Text>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                      {format(new Date(item.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.historyAmount, { color: colors.success }]}>
                  +{formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL EDITAR META */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editGoalModal, { backgroundColor: colors.card }]}>
            <View style={styles.editModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Meta</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              <Text style={[styles.label, { color: colors.text }]}>Nome da Meta</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ex: Viagem para Europa"
                placeholderTextColor={colors.placeholder}
              />

              <Text style={[styles.label, { color: colors.text }]}>Valor da Meta</Text>
              <View style={styles.inputRow}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>R$</Text>
                <TextInput
                  style={[styles.amountInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={editTargetAmount}
                  onChangeText={setEditTargetAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Data Limite</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={colors.text} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {format(editDeadline, "dd/MM/yyyy")}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={editDeadline}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={[styles.label, { color: colors.text }]}>Categoria (Opcional)</Text>
              <TouchableOpacity
                style={[styles.categoryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowCategoryModal(true)}
              >
                {getSelectedCategory() ? (
                  <>
                    <View style={[styles.categoryIconSmall, { backgroundColor: getSelectedCategory().color }]}>
                      <Ionicons name={getSelectedCategory().icon} size={16} color="#fff" />
                    </View>
                    <Text style={[styles.categoryButtonText, { color: colors.text }]}>
                      {getSelectedCategory().name}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.categoryButtonText, { color: colors.placeholder }]}>
                    Selecionar categoria
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleEditGoal}
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

      {/* MODAL SELECIONAR CATEGORIA */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={[styles.categoryModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Categoria</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity
                style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setEditCategoryId('');
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.categoryOptionText, { color: colors.textSecondary }]}>
                  Nenhuma categoria
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setEditCategoryId(category._id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryIconSmall, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon} size={20} color="#fff" />
                  </View>
                  <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL ADICIONAR PROGRESSO */}
      <Modal
        visible={showProgressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProgressModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProgressModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Progresso</Text>
            
            <View style={styles.inputRow}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>R$</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={progressAmount}
                onChangeText={setProgressAmount}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>

            {memberInfo?.contributionLimit && (
              <Text style={[styles.limitWarning, { color: colors.warning }]}>
                Limite disponível: {formatCurrency(memberInfo.contributionLimit - memberInfo.currentContribution)}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowProgressModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddProgress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Adicionar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL MEMBROS */}
      <Modal
        visible={showMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.membersModal, { backgroundColor: colors.card }]}>
            <View style={styles.membersHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Membros da Meta</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.membersList}>
              {goal.members?.map((member: any, index: number) => {
                const memberId = member.userId._id || member.userId;
                const isCurrentUser = memberId === user?.id;
                
                return (
                  <View key={index} style={[styles.memberCard, { backgroundColor: colors.background }]}>
                    <View style={styles.memberLeft}>
                      <View style={[styles.memberAvatar, { backgroundColor: ROLE_ICONS[member.role as keyof typeof ROLE_ICONS].color }]}>
                        <Text style={styles.memberAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {member.name} {isCurrentUser && '(Você)'}
                        </Text>
                        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                          {member.email}
                        </Text>
                        <View style={styles.memberStats}>
                          <Text style={[styles.memberStat, { color: colors.success }]}>
                            Contribuiu: {formatCurrency(member.currentContribution)}
                          </Text>
                          {member.contributionLimit && (
                            <Text style={[styles.memberStat, { color: colors.warning }]}>
                              Limite: {formatCurrency(member.contributionLimit)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.memberRight}>
                      <View style={[styles.memberRoleBadge, { backgroundColor: ROLE_ICONS[member.role as keyof typeof ROLE_ICONS].color }]}>
                        <Ionicons 
                          name={ROLE_ICONS[member.role as keyof typeof ROLE_ICONS].icon as any} 
                          size={14} 
                          color="#fff" 
                        />
                        <Text style={styles.memberRoleText}>
                          {ROLE_ICONS[member.role as keyof typeof ROLE_ICONS].label}
                        </Text>
                      </View>

                      {isOwner && member.role !== 'owner' && !isCurrentUser && (
                        <View style={styles.memberActions}>
                          <TouchableOpacity
                            style={[styles.memberActionButton, { backgroundColor: colors.info }]}
                            onPress={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setNewLimit(member.contributionLimit?.toString() || '');
                            }}
                          >
                            <Ionicons name="create" size={16} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.memberActionButton, { backgroundColor: colors.error }]}
                            onPress={() => handleRemoveMember(memberId)}
                          >
                            <Ionicons name="trash" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL EDITAR MEMBRO */}
      <Modal
        visible={selectedMember !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMember(null)}
        >
          <View style={[styles.editMemberModal, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Membro</Text>
            
            <Text style={[styles.editMemberName, { color: colors.text }]}>
              {selectedMember?.name}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Permissão</Text>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleOption,
                  { 
                    backgroundColor: newRole === role.value ? colors.primary + '20' : colors.background,
                    borderColor: newRole === role.value ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setNewRole(role.value)}
              >
                <Text style={[styles.roleOptionLabel, { color: colors.text }]}>{role.label}</Text>
                <Text style={[styles.roleOptionDesc, { color: colors.textSecondary }]}>
                  {role.description}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
              Limite de Contribuição
            </Text>
            <View style={styles.inputRow}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>R$</Text>
              <TextInput
                style={[styles.limitInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={newLimit}
                onChangeText={setNewLimit}
                placeholder="Sem limite"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setSelectedMember(null)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateMember}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Salvar</Text>
                )}
              </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  goalName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  targetAmount: {
    fontSize: 16,
  },
  progressBar: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    flex: 1,
    fontSize: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontWeight: 'bold',
  },
  limitWarning: {
    fontSize: 13,
    marginBottom: 20,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  membersModal: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  memberStats: {
    marginTop: 6,
    gap: 2,
  },
  memberStat: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  memberRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberRoleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 6,
  },
  memberActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editMemberModal: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  editMemberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  roleOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  roleOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  limitInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  editGoalModal: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editModalContent: {
    padding: 20,
  },
  input: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    flex: 1,
  },
  categoryModal: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryOptionText: {
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});