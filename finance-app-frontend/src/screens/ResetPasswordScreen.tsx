import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { email, code } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({
        email: email,
        code: code,
        newPassword: newPassword
      });
      Alert.alert('Sucesso', 'Senha redefinida com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 CALCULAR FORÇA DA SENHA
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: colors.border };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Fraca', color: '#FF3B30' };
    if (strength <= 3) return { strength: 66, label: 'Média', color: '#FF9500' };
    return { strength: 100, label: 'Forte', color: '#34C759' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Nova Senha</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Digite sua nova senha
        </Text>

        {/* NOVA SENHA */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text
            }]}
            placeholder="Nova senha"
            placeholderTextColor={colors.placeholder}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* INDICADOR DE FORÇA DA SENHA */}
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
              Senha {passwordStrength.label}
            </Text>
          </View>
        )}

        {/* CONFIRMAR SENHA */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text
            }]}
            placeholder="Confirmar senha"
            placeholderTextColor={colors.placeholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* ERRO SE SENHAS NÃO COINCIDEM */}
        {confirmPassword.length > 0 && confirmPassword !== newPassword && (
          <Text style={[styles.errorText, { color: '#FF3B30' }]}>
            As senhas não coincidem
          </Text>
        )}

        {/* REQUISITOS DA SENHA */}
        {newPassword.length > 0 && (
          <View style={[styles.requirementsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Requisitos da senha:
            </Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={newPassword.length >= 6 ? '#34C759' : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Mínimo de 6 caracteres
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[A-Z]/.test(newPassword) ? '#34C759' : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Uma letra maiúscula (recomendado)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/\d/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/\d/.test(newPassword) ? '#34C759' : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Um número (recomendado)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* BOTÃO REDEFINIR */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Text>
        </TouchableOpacity>

        {/* VOLTAR AO LOGIN */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Voltar ao Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    marginTop: -10,
    marginBottom: 16,
  },
  requirementsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
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
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});