import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { exportAPI } from '../services/api';

const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  filters?: any;
}

export default function ExportModal({ visible, onClose, filters }: ExportModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
    setLoading(true);
    setExportType(type);

    try {
      let response;
      let filename = '';
      const timestamp = new Date().toISOString().split('T')[0];

      if (type === 'csv') {
        response = await exportAPI.exportCSV(filters);
        filename = `transacoes_${timestamp}.csv`;
      } else if (type === 'excel') {
        response = await exportAPI.exportExcel(filters);
        filename = `transacoes_${timestamp}.xlsx`;
      } else {
        response = await exportAPI.exportPDF(filters);
        filename = `transacoes_${timestamp}.pdf`;
      }

      const blob = response.data;

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Alert.alert('Sucesso', 'Arquivo baixado com sucesso!');
        onClose();
      } else {
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          try {
            const base64data = reader.result as string;
            const base64Content = base64data.split(',')[1];

            const fileUri = FileSystem.documentDirectory + filename;
            
            await FileSystem.writeAsStringAsync(fileUri, base64Content, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const canShare = await Sharing.isAvailableAsync();
            
            if (canShare) {
              await Sharing.shareAsync(fileUri, {
                mimeType: type === 'csv' 
                  ? 'text/csv' 
                  : type === 'excel' 
                  ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                  : 'application/pdf',
                dialogTitle: 'Exportar Transações',
                UTI: type === 'csv'
                  ? 'public.comma-separated-values-text'
                  : type === 'excel'
                  ? 'com.microsoft.excel.xlsx'
                  : 'com.adobe.pdf',
              });

              Alert.alert('Sucesso', 'Arquivo compartilhado com sucesso!');
              onClose();
            } else {
              Alert.alert(
                'Arquivo Salvo',
                `Arquivo salvo em: ${fileUri}`,
                [
                  { text: 'OK', onPress: onClose }
                ]
              );
            }
          } catch (fileError: any) {
            console.error('File error:', fileError);
            Alert.alert('Erro', 'Falha ao salvar arquivo: ' + fileError.message);
          }
        };

        reader.onerror = () => {
          Alert.alert('Erro', 'Falha ao processar arquivo');
        };

        reader.readAsDataURL(blob);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao exportar dados');
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  const exportOptions = [
    {
      type: 'csv' as const,
      icon: 'document-text',
      title: 'CSV',
      description: 'Texto separado por vírgulas',
      color: '#34C759',
    },
    {
      type: 'excel' as const,
      icon: 'grid',
      title: 'Excel',
      description: 'Planilha formatada',
      color: '#007AFF',
    },
    {
      type: 'pdf' as const,
      icon: 'document',
      title: 'PDF',
      description: 'Documento formatado',
      color: '#FF3B30',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>📤 Exportar Dados</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Escolha o formato de exportação
          </Text>

          <View style={styles.optionsContainer}>
            {exportOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.background },
                  loading && exportType !== option.type && styles.optionDisabled,
                ]}
                onPress={() => handleExport(option.type)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                  {loading && exportType === option.type ? (
                    <ActivityIndicator size="small" color={option.color} />
                  ) : (
                    <Ionicons name={option.icon as any} size={28} color={option.color} />
                  )}
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {filters && Object.keys(filters).length > 0 && (
            <View style={[styles.filterInfo, { backgroundColor: colors.background }]}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.filterText, { color: colors.textSecondary }]}>
                Filtros aplicados serão incluídos
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  filterText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});