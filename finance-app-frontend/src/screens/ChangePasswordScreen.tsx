import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Erro', 'A nova senha deve ser diferente da atual');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      
      Alert.alert(
        'Sucesso',
        'Senha alterada com sucesso!',
        [{ 
          text: 'OK', 
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            navigation.goBack();
          }
        }]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMsg = error.response?.data?.message || 'Falha ao alterar senha. Verifique sua senha atual.';
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: colors.border };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Fraca', color: colors.error };
    if (strength <= 3) return { strength: 66, label: 'Média', color: colors.warning };
    return { strength: 100, label: 'Forte', color: colors.success };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Alterar Senha</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* SENHA ATUAL */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Senha Atual</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Digite sua senha atual"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* NOVA SENHA */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nova Senha</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite sua nova senha"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            
            {/* INDICADOR DE FORÇA */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${passwordStrength.strength}%`, backgroundColor: passwordStrength.color }
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          {/* CONFIRMAR SENHA */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirmar Nova Senha</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirme sua nova senha"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                As senhas não coincidem
              </Text>
            )}
          </View>

          {/* REQUISITOS */}
          <View style={[styles.requirementsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Requisitos da senha:
            </Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={newPassword.length >= 6 ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Mínimo de 6 caracteres
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[A-Z]/.test(newPassword) ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Pelo menos uma letra maiúscula (recomendado)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/\d/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/\d/.test(newPassword) ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Pelo menos um número (recomendado)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTÃO ALTERAR */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.changeButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleChangePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
              <Text style={styles.changeButtonText}>Alterar Senha</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  requirementsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});