import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import AddBudgetScreen from '../screens/AddBudgetScreen';
import EditBudgetScreen from '../screens/EditBudgetScreen';
import AddGoalScreen from '../screens/AddGoalScreen';
import EditGoalScreen from '../screens/EditGoalScreen';
import CurrencyConverterScreen from '../screens/CurrencyConverterScreen';
import CurrencySelectionScreen from '../screens/CurrencySelectionScreen';
import ShareGoalScreen from '../screens/ShareGoalScreen';
import GoalInvitesScreen from '../screens/GoalInvitesScreen';
import RecurringTransactionsScreen from '../screens/RecurringTransactionsScreen';
import BackupScreen from '../screens/BackupScreen';
import BillsScreen from '../screens/BillsScreen';
import AddBillScreen from '../screens/AddBillScreen';
import CreditCardsScreen from '../screens/CreditCardsScreen';
import AddCreditCardScreen from '../screens/AddCreditCardScreen';
import CardDetailsScreen from '../screens/CardDetailsScreen';
import AddPurchaseScreen from '../screens/AddPurchaseScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 🏠 HOME STACK
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      
      {/* Transações */}
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
      
      {/* Orçamentos */}
      <Stack.Screen name="BudgetsMain" component={BudgetsScreen} />
      <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
      <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
      
      {/* Metas */}
      <Stack.Screen name="GoalsMain" component={GoalsScreen} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
      <Stack.Screen name="ShareGoal" component={ShareGoalScreen} />
      <Stack.Screen name="GoalInvites" component={GoalInvitesScreen} />
      
      {/* Contas */}
      <Stack.Screen name="BillsMain" component={BillsScreen} />
      <Stack.Screen name="AddBill" component={AddBillScreen} />
      
      {/* Cartões */}
      <Stack.Screen name="CreditCardsMain" component={CreditCardsScreen} />
      <Stack.Screen name="AddCreditCard" component={AddCreditCardScreen} />
      <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
      <Stack.Screen name="AddPurchase" component={AddPurchaseScreen} />
      
      {/* Moeda */}
      <Stack.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
      <Stack.Screen name="CurrencySelection" component={CurrencySelectionScreen} />
    </Stack.Navigator>
  );
}

// 📋 TRANSACTIONS STACK
function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionsMain" component={TransactionsScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
      <Stack.Screen name="CurrencySelection" component={CurrencySelectionScreen} />
    </Stack.Navigator>
  );
}

// 📊 REPORTS STACK
function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsMain" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

// ⚙️ SETTINGS STACK
function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
      <Stack.Screen name="CurrencySelection" component={CurrencySelectionScreen} />
      <Stack.Screen 
        name="CategoryManagement" 
        component={CategoryManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecurringTransactions" 
        component={RecurringTransactionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Backup" 
        component={BackupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsStack}
        options={{ tabBarLabel: 'Transações' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsStack}
        options={{ tabBarLabel: 'Relatórios' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{ tabBarLabel: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}