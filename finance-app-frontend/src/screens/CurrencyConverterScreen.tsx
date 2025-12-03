import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { CURRENCIES, getCurrencyByCode } from '../types/currency';
import { currencyAPI } from '../services/currencyAPI';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CurrencyConverterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { mainCurrency, lastUpdated, refreshRates, loadingRates } = useCurrency();
  
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState(mainCurrency);
  const [fromAmount, setFromAmount] = useState('100');
  const [toAmount, setToAmount] = useState('0');
  const [rate, setRate] = useState(0);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    setToCurrency(mainCurrency);
  }, [mainCurrency]);

  useEffect(() => {
    convertAmount();
  }, [fromCurrency, toCurrency, fromAmount]);

  const convertAmount = async () => {
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      setToAmount('0');
      setRate(0);
      return;
    }

    try {
      setConverting(true);
      const amount = parseFloat(fromAmount);
      const converted = await currencyAPI.convert(amount, fromCurrency, toCurrency);
      const currentRate = await currencyAPI.getRate(fromCurrency, toCurrency);
      
      setToAmount(converted.toFixed(2));
      setRate(currentRate);
    } catch (error) {
      console.error('Error converting:', error);
      Alert.alert('Erro', 'Não foi possível converter. Verifique sua conexão.');
    } finally {
      setConverting(false);
    }
  };

  const swapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;
    
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const selectCurrency = (type: 'from' | 'to') => {
    navigation.navigate('CurrencySelection', {
      currentCurrency: type === 'from' ? fromCurrency : toCurrency,
      onSelect: (currency: string) => {
        if (type === 'from') {
          setFromCurrency(currency);
        } else {
          setToCurrency(currency);
        }
      },
    });
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Nunca atualizado';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes === 1) return 'Há 1 minuto';
    if (minutes < 60) return `Há ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Há 1 hora';
    if (hours < 24) return `Há ${hours} horas`;
    
    return format(lastUpdated, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const fromCurrencyData = getCurrencyByCode(fromCurrency);
  const toCurrencyData = getCurrencyByCode(toCurrency);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>Conversor de Moedas</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {formatLastUpdated()}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={refreshRates}
          disabled={loadingRates}
        >
          {loadingRates ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* FROM Currency */}
        <View style={[styles.currencyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>De</Text>
          <TouchableOpacity 
            style={[styles.currencySelector, { borderColor: colors.border }]}
            onPress={() => selectCurrency('from')}
          >
            <Text style={styles.flag}>{fromCurrencyData?.flag}</Text>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyCode, { color: colors.text }]}>{fromCurrency}</Text>
              <Text style={[styles.currencyName, { color: colors.textSecondary }]}>
                {fromCurrencyData?.name}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={fromAmount}
            onChangeText={setFromAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity
            style={[styles.swapButton, { backgroundColor: colors.primary }]}
            onPress={swapCurrencies}
          >
            <Ionicons name="swap-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* TO Currency */}
        <View style={[styles.currencyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Para</Text>
          <TouchableOpacity 
            style={[styles.currencySelector, { borderColor: colors.border }]}
            onPress={() => selectCurrency('to')}
          >
            <Text style={styles.flag}>{toCurrencyData?.flag}</Text>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyCode, { color: colors.text }]}>{toCurrency}</Text>
              <Text style={[styles.currencyName, { color: colors.textSecondary }]}>
                {toCurrencyData?.name}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.resultContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            {converting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.resultText, { color: colors.text }]}>{toAmount}</Text>
            )}
          </View>
        </View>

        {/* Rate Info */}
        {rate > 0 && (
          <View style={[styles.rateCard, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.rateText, { color: colors.primary }]}>
              1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </Text>
          </View>
        )}

        {/* Quick Amounts */}
        <View style={styles.quickAmountsContainer}>
          <Text style={[styles.quickAmountsTitle, { color: colors.text }]}>Valores rápidos</Text>
          <View style={styles.quickAmounts}>
            {['10', '50', '100', '500', '1000', '5000'].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.quickAmount, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setFromAmount(amount)}
              >
                <Text style={[styles.quickAmountText, { color: colors.text }]}>{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Pairs */}
        <View style={styles.popularPairsContainer}>
          <Text style={[styles.popularPairsTitle, { color: colors.text }]}>Pares populares</Text>
          {[
            { from: 'USD', to: 'BRL' },
            { from: 'EUR', to: 'BRL' },
            { from: 'GBP', to: 'BRL' },
          ].map((pair, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.popularPair, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
              onPress={() => {
                setFromCurrency(pair.from);
                setToCurrency(pair.to);
              }}
            >
              <View style={styles.popularPairLeft}>
                <Text style={styles.pairFlag}>
                  {getCurrencyByCode(pair.from)?.flag} → {getCurrencyByCode(pair.to)?.flag}
                </Text>
                <Text style={[styles.pairText, { color: colors.text }]}>
                  {pair.from} → {pair.to}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  currencyCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  flag: {
    fontSize: 32,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyName: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    fontSize: 32,
    fontWeight: 'bold',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickAmountsContainer: {
    marginTop: 24,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmount: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  popularPairsContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  popularPairsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  popularPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  popularPairLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pairFlag: {
    fontSize: 24,
  },
  pairText: {
    fontSize: 16,
    fontWeight: '600',
  },
});