import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

type ColorScheme = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  placeholder: string;
  disabled: string;
  shadow: string;
  overlay: string;
  income: string;        // 🆕 ADICIONAR
  expense: string;       // 🆕 ADICIONAR
  modalOverlay: string;  // 🆕 ADICIONAR
};

const lightColors: ColorScheme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  info: '#5AC8FA',
  placeholder: '#C7C7CC',
  disabled: '#D1D1D6',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  income: '#34C759',        // 🆕 Verde para receitas
  expense: '#FF3B30',       // 🆕 Vermelho para despesas
  modalOverlay: 'rgba(0, 0, 0, 0.5)', // 🆕 Overlay de modais
};

const darkColors: ColorScheme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  info: '#64D2FF',
  placeholder: '#636366',
  disabled: '#48484A',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  income: '#5DD97C',        // 🆕 Verde claro para receitas
  expense: '#FF6961',       // 🆕 Vermelho claro para despesas
  modalOverlay: 'rgba(0, 0, 0, 0.7)', // 🆕 Overlay de modais
};

interface ThemeContextData {
  colors: ColorScheme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    if (themeMode === 'auto') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        console.log('🎨 Sistema mudou para:', colorScheme);
        setIsDark(colorScheme === 'dark');
      });

      return () => subscription.remove();
    }
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('@theme_mode');
      if (saved) {
        setThemeModeState(saved as ThemeMode);
        console.log('🎨 Tema carregado:', saved);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const updateTheme = () => {
    if (themeMode === 'auto') {
      const newIsDark = systemColorScheme === 'dark';
      console.log('🎨 Modo auto - Sistema:', systemColorScheme, '→ isDark:', newIsDark);
      setIsDark(newIsDark);
    } else {
      console.log('🎨 Modo manual:', themeMode);
      setIsDark(themeMode === 'dark');
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('@theme_mode', mode);
      setThemeModeState(mode);
      console.log('🎨 Tema salvo:', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        themeMode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}