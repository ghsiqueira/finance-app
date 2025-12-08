import React, { createContext, useContext, useState, useCallback } from 'react';
import { achievementAPI } from '../services/api';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AchievementContextData {
  checkAchievements: () => Promise<void>;
  showUnlockedModal: boolean;
  unlockedAchievements: Achievement[];
  closeModal: () => void;
}

const AchievementContext = createContext<AchievementContextData>({} as AchievementContextData);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  const checkAchievements = useCallback(async () => {
    try {
      console.log('🏆 === VERIFICANDO CONQUISTAS ===');
      const response = await achievementAPI.check();
      
      console.log('📦 Response completa:', response.data);
      console.log('📊 Count:', response.data.count);
      console.log('📊 New achievements:', response.data.newAchievements);
      console.log('📊 Tipo de newAchievements:', typeof response.data.newAchievements);
      console.log('📊 É array?:', Array.isArray(response.data.newAchievements));
      
      if (response.data.count > 0 && response.data.newAchievements) {
        console.log(`🎉 ${response.data.count} nova(s) conquista(s) desbloqueada(s)!`);
        console.log('🏆 Achievements a mostrar:', response.data.newAchievements);
        
        setUnlockedAchievements(response.data.newAchievements);
        setShowUnlockedModal(true);
        
        console.log('✅ Modal configurado para abrir!');
        console.log('✅ showUnlockedModal será:', true);
        console.log('✅ unlockedAchievements será:', response.data.newAchievements);
      } else {
        console.log('ℹ️ Nenhuma conquista nova');
        console.log('ℹ️ Razão: count =', response.data.count, ', newAchievements =', response.data.newAchievements);
      }
    } catch (error: any) {
      console.error('❌ Erro ao verificar conquistas:', error);
      console.error('❌ Response:', error.response?.data);
    }
  }, []);

  const closeModal = useCallback(() => {
    console.log('🚪 Fechando modal de conquistas');
    setShowUnlockedModal(false);
    setUnlockedAchievements([]);
  }, []);

  return (
    <AchievementContext.Provider
      value={{
        checkAchievements,
        showUnlockedModal,
        unlockedAchievements,
        closeModal,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider');
  }
  return context;
};