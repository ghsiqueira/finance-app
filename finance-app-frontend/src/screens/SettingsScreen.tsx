import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCurrencyByCode } from '../types/currency';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

export default function SettingsScreen({ navigation }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { mainCurrency, setMainCurrency, lastUpdated } = useCurrency();
  const { user, logout } = useAuth();

  // 🆕 STATES PARA EXCLUSÃO DE CONTA
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const mainCurrencyData = getCurrencyByCode(mainCurrency);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  // 🆕 FUNÇÃO PARA EXCLUIR CONTA
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Erro', 'Digite sua senha para confirmar');
      return;
    }

    Alert.alert(
      '⚠️ ATENÇÃO',
      'Esta ação é IRREVERSÍVEL!\n\nTODOS os seus dados serão PERMANENTEMENTE deletados:\n• Transações\n• Orçamentos\n• Metas\n• Categorias\n• Conquistas\n\nDeseja realmente continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, deletar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await authAPI.deleteAccount(deletePassword);
              
              Alert.alert(
                'Conta Deletada',
                'Sua conta e todos os dados foram removidos permanentemente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Usa o logout do AuthContext
                      logout();
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              const errorMsg = error.response?.data?.message || 'Falha ao deletar conta. Verifique sua senha.';
              Alert.alert('Erro', errorMsg);
            } finally {
              setDeletingAccount(false);
              setShowDeleteModal(false);
              setDeletePassword('');
            }
          }
        }
      ]
    );
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes === 1) return 'Há 1 min';
    if (minutes < 60) return `Há ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Há 1 hora';
    return `Há ${hours} horas`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
      </View>

      {/* Seção de Usuário */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTA</Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Seção de Moeda */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MOEDA</Text>
        
        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('CurrencySelection', {
            currentCurrency: mainCurrency,
            onSelect: (currency: string) => {
              setMainCurrency(currency); 
            },
          })}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="cash" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Moeda Principal</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {mainCurrencyData?.flag} {mainCurrencyData?.name}
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.currencyCode, { color: colors.primary }]}>{mainCurrency}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('CurrencyConverter')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="swap-horizontal" size={24} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Conversor de Moedas</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Atualizado {formatLastUpdated()}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* SEÇÃO: PERSONALIZAÇÃO */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONALIZAÇÃO</Text>
        
        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('CategoryManagement')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#9B59B620' }]}>
              <Ionicons name="pricetags" size={24} color="#9B59B6" />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Gerenciar Categorias</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Crie e edite suas categorias
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('RecurringTransactions')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#C77DFF20' }]}>
              <Ionicons name="repeat" size={24} color="#C77DFF" />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Transações Recorrentes</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Automatize pagamentos mensais
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Seção de Aparência */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APARÊNCIA</Text>
        
        <View style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Tema Escuro</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {isDark ? 'Ativado' : 'Desativado'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Seção de Dados */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DADOS</Text>
        
        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => Alert.alert('Em breve', 'Funcionalidade de exportação será implementada em breve')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="download" size={24} color={colors.info} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Exportar Dados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => Alert.alert('Em breve', 'Funcionalidade de backup será implementada em breve')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="cloud-upload" size={24} color={colors.success} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Backup</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Seção de Conta */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTA</Text>
        
        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => Alert.alert('Em breve', 'Funcionalidade será implementada em breve')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.textSecondary + '20' }]}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Editar Perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => Alert.alert('Em breve', 'Funcionalidade será implementada em breve')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.textSecondary + '20' }]}>
              <Ionicons name="lock-closed" size={24} color={colors.textSecondary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Alterar Senha</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card }]}
          onPress={handleLogout}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="log-out" size={24} color={colors.error} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.error }]}>Sair</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 🆕 SEÇÃO: ZONA DE PERIGO */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.error }]}>ZONA DE PERIGO</Text>
        
        <TouchableOpacity
          style={[styles.card, styles.settingItem, { backgroundColor: colors.card, borderColor: colors.error, borderWidth: 2 }]}
          onPress={() => setShowDeleteModal(true)}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="trash" size={24} color={colors.error} />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.error }]}>Excluir Conta</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Deletar permanentemente sua conta e dados
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Versão */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Versão 1.0.0
        </Text>
      </View>

      <View style={{ height: 40 }} />

      {/* 🆕 MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.deleteModalHeader, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="warning" size={48} color={colors.error} />
              <Text style={[styles.deleteModalTitle, { color: colors.error }]}>
                Excluir Conta
              </Text>
            </View>

            <View style={styles.deleteModalBody}>
              <Text style={[styles.deleteModalText, { color: colors.text }]}>
                Esta ação é <Text style={{ fontWeight: '700' }}>IRREVERSÍVEL</Text> e irá deletar permanentemente:
              </Text>
              <View style={styles.deleteList}>
                <Text style={[styles.deleteListItem, { color: colors.textSecondary }]}>
                  • Todas as suas transações
                </Text>
                <Text style={[styles.deleteListItem, { color: colors.textSecondary }]}>
                  • Todos os orçamentos
                </Text>
                <Text style={[styles.deleteListItem, { color: colors.textSecondary }]}>
                  • Todas as metas
                </Text>
                <Text style={[styles.deleteListItem, { color: colors.textSecondary }]}>
                  • Todas as categorias
                </Text>
                <Text style={[styles.deleteListItem, { color: colors.textSecondary }]}>
                  • Todas as conquistas
                </Text>
              </View>

              <Text style={[styles.deleteModalLabel, { color: colors.text }]}>
                Digite sua senha para confirmar:
              </Text>
              <TextInput
                style={[
                  styles.deletePasswordInput,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
                ]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Senha"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoFocus
              />
            </View>

            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                style={[styles.deleteModalButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                disabled={deletingAccount}
              >
                <Text style={[styles.deleteModalButtonText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, { backgroundColor: colors.error }]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.deleteModalButtonText, { color: '#fff' }]}>
                    Excluir Tudo
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 13,
  },
  // 🆕 ESTILOS DO MODAL DE EXCLUSÃO
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteModalHeader: {
    alignItems: 'center',
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  deleteModalBody: {
    padding: 24,
  },
  deleteModalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  deleteList: {
    marginBottom: 20,
    paddingLeft: 8,
  },
  deleteListItem: {
    fontSize: 14,
    lineHeight: 24,
  },
  deleteModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  deletePasswordInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  deleteModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deleteModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});