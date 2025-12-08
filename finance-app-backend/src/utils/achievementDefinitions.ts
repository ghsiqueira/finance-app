export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'transactions' | 'savings' | 'budgets' | 'goals' | 'streak' | 'special';
  requirement: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // TRANSAÇÕES
  {
    id: 'first_transaction',
    title: 'Primeira Transação',
    description: 'Registre sua primeira transação',
    icon: 'rocket',
    color: '#3498db',
    category: 'transactions',
    requirement: 1
  },
  {
    id: 'transactions_10',
    title: 'Começando Bem',
    description: 'Registre 10 transações',
    icon: 'trending-up',
    color: '#3498db',
    category: 'transactions',
    requirement: 10
  },
  {
    id: 'transactions_50',
    title: 'Organizador',
    description: 'Registre 50 transações',
    icon: 'bar-chart',
    color: '#3498db',
    category: 'transactions',
    requirement: 50
  },
  {
    id: 'transactions_100',
    title: 'Mestre das Finanças',
    description: 'Registre 100 transações',
    icon: 'trophy',
    color: '#f39c12',
    category: 'transactions',
    requirement: 100
  },
  {
    id: 'transactions_500',
    title: 'Lenda Financeira',
    description: 'Registre 500 transações',
    icon: 'medal',
    color: '#9b59b6',
    category: 'transactions',
    requirement: 500
  },

  // ECONOMIA
  {
    id: 'savings_1000',
    title: 'Primeiro Milheiro',
    description: 'Economize R$ 1.000',
    icon: 'cash',
    color: '#27ae60',
    category: 'savings',
    requirement: 1000
  },
  {
    id: 'savings_5000',
    title: 'Poupador Dedicado',
    description: 'Economize R$ 5.000',
    icon: 'wallet',
    color: '#27ae60',
    category: 'savings',
    requirement: 5000
  },
  {
    id: 'savings_10000',
    title: 'Reserva de Emergência',
    description: 'Economize R$ 10.000',
    icon: 'shield-checkmark',
    color: '#27ae60',
    category: 'savings',
    requirement: 10000
  },
  {
    id: 'savings_50000',
    title: 'Investidor em Potencial',
    description: 'Economize R$ 50.000',
    icon: 'diamond',
    color: '#1abc9c',
    category: 'savings',
    requirement: 50000
  },

  // ORÇAMENTOS
  {
    id: 'first_budget',
    title: 'Primeiro Orçamento',
    description: 'Crie seu primeiro orçamento',
    icon: 'wallet',
    color: '#e67e22',
    category: 'budgets',
    requirement: 1
  },
  {
    id: 'budgets_5',
    title: 'Planejador',
    description: 'Crie 5 orçamentos',
    icon: 'pie-chart',
    color: '#e67e22',
    category: 'budgets',
    requirement: 5
  },
  {
    id: 'budget_respected',
    title: 'Disciplinado',
    description: 'Respeite um orçamento por um mês completo',
    icon: 'checkmark-circle',
    color: '#27ae60',
    category: 'budgets',
    requirement: 1
  },

  // METAS
  {
    id: 'first_goal',
    title: 'Primeira Meta',
    description: 'Crie sua primeira meta',
    icon: 'flag',
    color: '#9b59b6',
    category: 'goals',
    requirement: 1
  },
  {
    id: 'goal_completed',
    title: 'Sonho Realizado',
    description: 'Complete uma meta',
    icon: 'star',
    color: '#f39c12',
    category: 'goals',
    requirement: 1
  },
  {
    id: 'goals_3_completed',
    title: 'Realizador',
    description: 'Complete 3 metas',
    icon: 'ribbon',
    color: '#f39c12',
    category: 'goals',
    requirement: 3
  },

  // SEQUÊNCIA
  {
    id: 'streak_7',
    title: 'Semana Completa',
    description: 'Registre transações por 7 dias seguidos',
    icon: 'flame',
    color: '#e74c3c',
    category: 'streak',
    requirement: 7
  },
  {
    id: 'streak_30',
    title: 'Hábito Formado',
    description: 'Registre transações por 30 dias seguidos',
    icon: 'fitness',
    color: '#e74c3c',
    category: 'streak',
    requirement: 30
  },

  // ESPECIAIS
  {
    id: 'positive_month',
    title: 'Mês Positivo',
    description: 'Termine um mês com saldo positivo',
    icon: 'happy',
    color: '#27ae60',
    category: 'special',
    requirement: 1
  },
  {
    id: 'categorized_month',
    title: 'Organização Total',
    description: 'Categorize 100% das transações de um mês',
    icon: 'albums',
    color: '#3498db',
    category: 'special',
    requirement: 1
  },
  {
    id: 'recurrence_master',
    title: 'Automatizado',
    description: 'Crie 5 transações recorrentes',
    icon: 'repeat',
    color: '#9b59b6',
    category: 'special',
    requirement: 5
  },
];

export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const getAchievementsByCategory = (category: string): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};