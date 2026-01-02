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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar conta');
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

  const passwordStrength = getPasswordStrength(password);

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
        <Text style={[styles.title, { color: colors.text }]}>Criar Conta</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Preencha seus dados para começar
        </Text>

        {/* NOME */}
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text
          }]}
          placeholder="Nome completo"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* EMAIL */}
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text
          }]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* SENHA COM INDICADOR */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text
            }]}
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
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
        {password.length > 0 && (
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

        {/* REQUISITOS DA SENHA */}
        {password.length > 0 && (
          <View style={[styles.requirementsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Requisitos da senha:
            </Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={password.length >= 6 ? '#34C759' : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Mínimo de 6 caracteres
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[A-Z]/.test(password) ? '#34C759' : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Uma letra maiúscula (recomendado)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/\d/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/\d/.test(password) ? '#34C759' : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Um número (recomendado)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* BOTÃO CRIAR CONTA */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Text>
        </TouchableOpacity>

        {/* LINK PARA LOGIN */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>
            Já tem uma conta?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Fazer login</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 32,
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
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});