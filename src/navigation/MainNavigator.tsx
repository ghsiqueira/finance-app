import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import { DashboardScreen } from '../screens/main/DashboardScreen';
import { TransactionsScreen } from '../screens/main/TransactionsScreen';
import { CreateTransactionScreen } from '../screens/main/CreateTransactionScreen';
import { CategoriesScreen } from '../screens/main/CategoriesScreen';
import { CreateCategoryScreen } from '../screens/main/CreateCategoryScreen';
import { EditCategoryScreen } from '../screens/main/EditCategoryScreen';
import { BudgetsScreen } from '../screens/main/BudgetsScreen';
import { CreateBudgetScreen } from '../screens/main/CreateBudgetScreen';

// Telas temporárias até criarmos as reais
const TempScreen = ({ title }: { title: string }) => (
  <View style={tempStyles.container}>
    <Text style={tempStyles.title}>Tela de {title}</Text>
    <Text style={tempStyles.subtitle}>Em desenvolvimento...</Text>
  </View>
);

const tempStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});

const GoalsScreen = () => <TempScreen title="Metas" />;
const ProfileScreen = () => <TempScreen title="Perfil" />;

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  CreateTransaction: { type?: 'income' | 'expense' };
  EditTransaction: { transactionId: string };
  Categories: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Budgets':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Goals':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{ tabBarLabel: 'Transações' }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsScreen}
        options={{ tabBarLabel: 'Orçamentos' }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{ tabBarLabel: 'Metas' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="CreateTransaction" 
        component={CreateTransactionScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="Categories" 
        component={CategoriesScreen}
      />
      <Stack.Screen 
        name="CreateCategory" 
        component={CreateCategoryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="EditCategory" 
        component={EditCategoryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="CreateBudget" 
        component={CreateBudgetScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
};