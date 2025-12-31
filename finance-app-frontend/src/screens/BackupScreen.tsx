import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { backupAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function BackupScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { logout } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const response = await backupAPI.export();

      const fileName = `backup_${new Date().getTime()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(response.data, null, 2)
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Compartilhar Backup',
        });
      }

      setLastBackup(new Date().toLocaleString('pt-BR'));
      Alert.alert('Sucesso!', 'Backup exportado com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Falha ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Atenção!',
      'Importar dados irá SUBSTITUIR todos os seus dados atuais. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });

              if (result.canceled) {
                setLoading(false);
                return;
              }

              const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
              const backupData = JSON.parse(fileContent);

              await backupAPI.import(backupData.data, true);

              Alert.alert(
                'Sucesso!',
                'Dados importados com sucesso! Faça login novamente para ver os dados importados.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      logout(); 
                    }
                  }
                ]
              );

            } catch (error: any) {
              console.error('❌ Erro:', error);
              Alert.alert('Erro', 'Falha ao importar. Arquivo inválido?');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Backup e Restore</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* INFO */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Faça backup regularmente. Você pode compartilhar por email, WhatsApp ou Google Drive.
          </Text>
        </View>

        {/* EXPORTAR */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleExport}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Exportar Dados</Text>
            </>
          )}
        </TouchableOpacity>

        {/* IMPORTAR */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={handleImport}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Importar Dados</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ÚLTIMO BACKUP */}
        {lastBackup && (
          <View style={[styles.lastBackup, { backgroundColor: colors.card }]}>
            <Text style={[styles.lastBackupLabel, { color: colors.textSecondary }]}>Último backup:</Text>
            <Text style={[styles.lastBackupDate, { color: colors.text }]}>{lastBackup}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 20, gap: 16 },
  infoCard: { flexDirection: 'row', padding: 16, borderRadius: 12, gap: 12 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lastBackup: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  lastBackupLabel: { fontSize: 12, marginBottom: 4 },
  lastBackupDate: { fontSize: 16, fontWeight: '600' },
});