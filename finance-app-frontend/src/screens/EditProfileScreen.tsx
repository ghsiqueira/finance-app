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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, API_URL } from '../services/api';

export default function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erro', 'O email não pode estar vazio');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Digite um email válido');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.updateProfile({ name, email });
      
      // Atualizar contexto com novos dados
      updateUser(response.data.user);
      
      Alert.alert(
        'Sucesso',
        'Perfil atualizado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Falha ao atualizar perfil';
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 ESCOLHER FOTO DA GALERIA
  const handleChoosePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Erro', 'Falha ao selecionar foto');
    }
  };

  // 🆕 TIRAR FOTO COM CÂMERA
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para usar a câmera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Falha ao tirar foto');
    }
  };

  // 🆕 UPLOAD DA FOTO
  const uploadPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await authAPI.uploadProfilePhoto(formData);
      
      // Atualizar usuário
      updateUser(response.data.user);
      
      Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 🆕 DELETAR FOTO
  const handleDeletePhoto = () => {
    Alert.alert(
      'Remover Foto',
      'Deseja realmente remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingPhoto(true);
              const response = await authAPI.deleteProfilePhoto();
              updateUser(response.data.user);
              Alert.alert('Sucesso', 'Foto removida com sucesso!');
            } catch (error: any) {
              console.error('Error deleting photo:', error);
              Alert.alert('Erro', 'Falha ao remover foto');
            } finally {
              setUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  // 🆕 MOSTRAR OPÇÕES DE FOTO
  const showPhotoOptions = () => {
    const options: any[] = [
      { text: 'Tirar Foto', onPress: handleTakePhoto },
      { text: 'Escolher da Galeria', onPress: handleChoosePhoto },
    ];

    if (user?.profilePhoto) {
      options.push({ text: 'Remover Foto', onPress: handleDeletePhoto, style: 'destructive' });
    }

    options.push({ text: 'Cancelar', onPress: () => {}, style: 'cancel' });

    Alert.alert('Foto de Perfil', 'Escolha uma opção', options);
  };

  const hasChanges = name !== user?.name || email !== user?.email;

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
        <Text style={[styles.title, { color: colors.text }]}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AVATAR COM CARD - CORRIGIDO COM URL */}
        <View style={[styles.avatarCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
              <Image
                source={{ uri: `${API_URL.replace('/api', '')}/uploads/profiles/${user.profilePhoto}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
              onPress={showPhotoOptions}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nome Completo</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Digite seu nome"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu email"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* INFO CARD */}
          <View style={[styles.infoCard, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Suas alterações serão salvas e refletidas em todo o aplicativo.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTÃO SALVAR */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: hasChanges ? colors.primary : colors.disabled },
          ]}
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
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
  avatarCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 32,
    right: '50%',
    marginRight: -60,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});