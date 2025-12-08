import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CurrencyProvider } from './src/contexts/CurrencyContext';
import { AchievementProvider } from './src/contexts/AchievementContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <AchievementProvider>
            <NavigationContainer>
              <Navigation />
            </NavigationContainer>
          </AchievementProvider>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}