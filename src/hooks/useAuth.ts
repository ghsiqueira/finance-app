import { useEffect } from 'react';
import { useAppStore } from '../store';
import AuthService from '../services/auth';

export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    setUser, 
    setAuthenticated, 
    logout: logoutStore 
  } = useAppStore();

  // 🔄 VERIFICAR SE USUÁRIO ESTÁ LOGADO AO INICIAR APP
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        const userData = await AuthService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setAuthenticated(true);
        } else {
          // Se não conseguir buscar dados do usuário, fazer logout
          await logout();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      await logout();
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      logoutStore();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Fazer logout local mesmo se der erro
      logoutStore();
    }
  };

  return {
    user,
    isAuthenticated,
    logout,
    checkAuthStatus,
  };
};