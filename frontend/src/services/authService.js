// Сервис для работы с аутентификацией на фронтенде
import { authAPI } from './api.js';

export const authService = {
  // Сохранение токена и данных пользователя
  setAuthData: (token, user) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.warn('Cannot save to localStorage:', error);
    }
  },

  // Получение текущего пользователя
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('Cannot get user from localStorage:', error);
      return null;
    }
  },

  // Получение токена
  getToken: () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.warn('Cannot get token from localStorage:', error);
      return null;
    }
  },

  // Проверка авторизации
  isAuthenticated: () => {
    return !!authService.getToken();
  },

  // Выход
  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Дополнительно можно вызвать API для logout на бэкенде
      // await authAPI.logout();
    } catch (error) {
      console.warn('Cannot remove from localStorage:', error);
    }
  },

  // Обновление данных пользователя
  updateUserData: (userData) => {
    try {
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.warn('Cannot update user data:', error);
      return null;
    }
  },

  // Получение роли пользователя
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // Проверка роли
  hasRole: (role) => {
    const userRole = authService.getUserRole();
    return userRole === role;
  },

  // Проверка является ли пользователь администратором
  isAdmin: () => {
    return authService.hasRole('admin');
  },

  // Проверка является ли пользователь работником
  isWorker: () => {
    return authService.hasRole('worker');
  },

  // Получение ID пользователя
  getUserId: () => {
    const user = authService.getCurrentUser();
    return user?.id || null;
  }
};

export default authService;