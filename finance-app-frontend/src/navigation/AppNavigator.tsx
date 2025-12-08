import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAchievements } from '../contexts/AchievementContext';
import AchievementUnlockedModal from '../components/AchievementUnlockedModal';
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
import AchievementsScreen from '../screens/AchievementsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
      <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
      <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
      <Stack.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
      <Stack.Screen name="CurrencySelection" component={CurrencySelectionScreen} />
    </Stack.Navigator>
  );
}

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

function BudgetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetsMain" component={BudgetsScreen} />
      <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
      <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
    </Stack.Navigator>
  );
}

function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsMain" component={GoalsScreen} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
      <Stack.Screen name="ShareGoal" component={ShareGoalScreen} />
      <Stack.Screen name="GoalInvites" component={GoalInvitesScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsMain" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

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
        name="Achievements" 
        component={AchievementsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// 🆕 COMPONENTE DO MODAL DE CONQUISTAS
function AchievementModal() {
  const { showUnlockedModal, unlockedAchievements, closeModal } = useAchievements();
  
  return (
    <AchievementUnlockedModal
      visible={showUnlockedModal}
      achievements={unlockedAchievements}
      onClose={closeModal}
    />
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Transactions') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Budgets') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Goals') {
              iconName = focused ? 'flag' : 'flag-outline';
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
            height: 60,
            paddingBottom: 8,
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
          name="Budgets" 
          component={BudgetsStack}
          options={{ tabBarLabel: 'Orçamentos' }}
        />
        <Tab.Screen 
          name="Goals" 
          component={GoalsStack}
          options={{ tabBarLabel: 'Metas' }}
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
      
      {/* 🆕 MODAL DE CONQUISTAS (só aparece quando logado) */}
      <AchievementModal />
    </View>
  );
}