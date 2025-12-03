import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { goalAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Invite {
  email: string;
  role: 'admin' | 'contributor' | 'viewer';
  contributionLimit?: number;
}

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
    icon: 'shield-checkmark',
    description: 'Compartilhar e gerenciar membros',
    color: '#FF6B6B'
  },
  {
    value: 'contributor',
    label: 'Colaborador',
    icon: 'share-social',
    description: 'Compartilhar e contribuir',
    color: '#4ECDC4'
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    icon: 'eye',
    description: 'Apenas visualizar e contribuir',
    color: '#95E1D3'
  }
];

export default function ShareGoalScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { goal } = route.params;
  const [invites, setInvites] = useState<Invite[]>([{ email: '', role: 'viewer' }]);
  const [sharing, setSharing] = useState(false);
  const [selectedInviteIndex, setSelectedInviteIndex] = useState<number | null>(null);

  const addInviteField = () => {
    setInvites([...invites, { email: '', role: 'viewer' }]);
  };

  const removeInviteField = (index: number) => {
    const newInvites = invites.filter((_, i) => i !== index);
    setInvites(newInvites.length > 0 ? newInvites : [{ email: '', role: 'viewer' }]);
  };

  const updateInviteEmail = (index: number, email: string) => {
    const newInvites = [...invites];
    newInvites[index].email = email;
    setInvites(newInvites);
  };

  const updateInviteRole = (index: number, role: 'admin' | 'contributor' | 'viewer') => {
    const newInvites = [...invites];
    newInvites[index].role = role;
    setInvites(newInvites);
    setSelectedInviteIndex(null);
  };

  const updateInviteLimit = (index: number, limit: string) => {
    const newInvites = [...invites];
    const numLimit = parseFloat(limit);
    newInvites[index].contributionLimit = isNaN(numLimit) ? undefined : numLimit;
    setInvites(newInvites);
  };

  const handleShare = async () => {
    const validInvites = invites.filter(i => i.email.trim() && i.email.includes('@'));
    
    if (validInvites.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um email válido');
      return;
    }

    const userStr = await AsyncStorage.getItem('@user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const currentEmail = user.email.toLowerCase();
      
      const hasOwnEmail = validInvites.some(i => i.email.toLowerCase() === currentEmail);
      if (hasOwnEmail) {
        Alert.alert(
          'Erro', 
          'Você não pode convidar seu próprio email!\n\nDigite o email de outra pessoa para compartilhar esta meta.'
        );
        return;
      }
    }

    try {
      setSharing(true);
      await goalAPI.shareGoal(goal._id, validInvites);
      Alert.alert('Sucesso', `Convite${validInvites.length > 1 ? 's' : ''} enviado${validInvites.length > 1 ? 's' : ''}!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      let errorMessage = 'Falha ao enviar convites';
      
      if (error.response?.data?.message === 'No new invites to send') {
        errorMessage = 'Estes emails já foram convidados anteriormente';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const getRoleInfo = (role: string) => {
    const roleKey = role as keyof typeof ROLE_ICONS;
    return ROLE_ICONS[roleKey] || ROLE_ICONS.viewer;
  };

  const getRoleOption = (role: string) => {
    return ROLES.find(r => r.value === role) || ROLES[2];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Compartilhar Meta</Text>
        <TouchableOpacity onPress={handleShare} disabled={sharing}>
          {sharing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="send" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
          <Text style={[styles.goalAmount, { color: colors.primary }]}>
            R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Convidar Pessoas</Text>
        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          Defina permissões e limites para cada pessoa
        </Text>

        {invites.map((invite, index) => (
          <View key={index} style={[styles.inviteCard, { backgroundColor: colors.card }]}>
            <View style={styles.inviteHeader}>
              <Text style={[styles.inviteNumber, { color: colors.textSecondary }]}>
                Convite #{index + 1}
              </Text>
              {invites.length > 1 && (
                <TouchableOpacity onPress={() => removeInviteField(index)}>
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={invite.email}
              onChangeText={(value) => updateInviteEmail(index, value)}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.text }]}>Permissão</Text>
            <TouchableOpacity
              style={[styles.roleSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setSelectedInviteIndex(index)}
            >
              <View style={styles.roleInfo}>
                <View style={[styles.roleIcon, { backgroundColor: getRoleOption(invite.role).color }]}>
                  <Ionicons name={getRoleOption(invite.role).icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.roleText}>
                  <Text style={[styles.roleLabel, { color: colors.text }]}>
                    {getRoleOption(invite.role).label}
                  </Text>
                  <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
                    {getRoleOption(invite.role).description}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>
              Limite de Contribuição (Opcional)
            </Text>
            <View style={styles.limitRow}>
              <Text style={[styles.currency, { color: colors.text }]}>R$</Text>
              <TextInput
                style={[styles.limitInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={invite.contributionLimit?.toString() || ''}
                onChangeText={(value) => updateInviteLimit(index, value)}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={[styles.helperSmall, { color: colors.textSecondary }]}>
              Deixe vazio para sem limite
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={addInviteField}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Adicionar outro convite</Text>
        </TouchableOpacity>

        {goal.members && goal.members.length > 0 && (
          <View style={styles.membersSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Membros Atuais</Text>
            {goal.members.map((member: any, idx: number) => {
              const roleInfo = getRoleInfo(member.role);
              
              return (
                <View key={idx} style={[styles.memberItem, { backgroundColor: colors.card }]}>
                  <View style={styles.memberLeft}>
                    <View style={[styles.avatar, { backgroundColor: roleInfo.color }]}>
                      <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                      <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
                      {member.contributionLimit && (
                        <Text style={[styles.memberLimit, { color: colors.warning }]}>
                          Limite: R$ {member.contributionLimit.toFixed(2)} (Usado: R$ {member.currentContribution.toFixed(2)})
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: roleInfo.color }]}>
                    <Ionicons name={roleInfo.icon as any} size={12} color="#fff" />
                    <Text style={styles.roleBadgeText}>{roleInfo.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedInviteIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedInviteIndex(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedInviteIndex(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Permissão</Text>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleOption, { borderBottomColor: colors.border }]}
                onPress={() => selectedInviteIndex !== null && updateInviteRole(selectedInviteIndex, role.value as any)}
              >
                <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                  <Ionicons name={role.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.roleOptionText}>
                  <Text style={[styles.roleOptionLabel, { color: colors.text }]}>{role.label}</Text>
                  <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                    {role.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setSelectedInviteIndex(null)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  goalCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  goalAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    marginBottom: 16,
  },
  helperSmall: {
    fontSize: 11,
    marginTop: 4,
  },
  inviteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleText: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
  },
  limitInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  membersSection: {
    marginTop: 8,
  },
  memberItem: {
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  memberLimit: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderBottomWidth: 1,
  },
  roleOptionText: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleOptionDescription: {
    fontSize: 13,
    marginTop: 4,
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