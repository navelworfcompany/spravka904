// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage set error:', error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage remove error:', error);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  const initialCheckDone = useRef(false);

  const clearError = () => setAuthError(null);

  // Функция проверки авторизации
  const checkAuth = useCallback(async () => {
    const token = safeLocalStorage.getItem('token');
    const savedUser = safeLocalStorage.getItem('user');

    console.log('🔐 Initial auth check:', { 
      hasToken: !!token, 
      hasUser: !!savedUser 
    });

    // Если нет токена - сразу завершаем загрузку
    if (!token || token === 'undefined' || token === 'null') {
      console.log('❌ No valid token found');
      setUser(null);
      setLoading(false);
      initialCheckDone.current = true;
      return;
    }

    try {
      console.log('🔐 Making auth API call...');
      const response = await authAPI.getMe();
      console.log('🔐 Auth response:', response);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        console.log('✅ User authenticated:', response.data.user);
      } else {
        console.log('❌ Invalid auth response');
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
      initialCheckDone.current = true;
    }
  }, []);

  // Вызываем проверку авторизации только при первом монтировании
  useEffect(() => {
    if (!initialCheckDone.current) {
      checkAuth();
    }
  }, [checkAuth]);

  // ОБЩАЯ ФУНКЦИЯ ЛОГИНА
  const login = async (phone, password, role = null) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log('🔐 Login attempt:', { phone: cleanPhone, role });
    
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await authAPI.login(cleanPhone, password, role);
      console.log('🔐 Login response:', response);

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        if (token && userData) {
          if (role && userData.role !== role) {
            throw new Error(`Неверная роль. Ожидалось: ${role}, получено: ${userData.role}`);
          }
          
          safeLocalStorage.setItem('token', token);
          safeLocalStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          console.log('✅ Login successful');
          return { 
            success: true, 
            user: userData,
            role: userData.role 
          };
        }
      }
      
      throw new Error(response?.message || 'Ошибка авторизации');
    } catch (error) {
      console.error('❌ Login error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // СПЕЦИФИЧНЫЕ ФУНКЦИИ ДЛЯ УДОБСТВА
  const loginAdmin = async (phone, password) => {
    return login(phone, password, 'admin');
  };

  const loginOperator = async (phone, password) => {
    return login(phone, password, 'operator');
  };

  const loginWorker = async (phone, password) => {
    return login(phone, password, 'worker');
  };

  const loginClient = async (phone, password) => {
    return login(phone, password, 'user');
  };

  const logout = () => {
    console.log('🔐 Logging out...');
    setUser(null);
    setAuthError(null);
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('user');
    initialCheckDone.current = false; // Сбрасываем для следующей сессии
  };

  const getLoginRedirect = (userRole) => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'operator':
        return '/operator/dashboard';
      case 'worker':
        return '/worker/dashboard';
      case 'user':
        return '/client/dashboard';
      default:
        return '/';
    }
  };

  const value = {
    user,
    login,
    logout,
    loginAdmin,
    loginOperator,
    loginWorker,
    loginClient,
    getLoginRedirect,
    loading,
    authError,
    clearAuthError: clearError,
    isAuthenticated: !!user,
    hasRole: (role) => user?.role === role,
    isAdmin: () => user?.role === 'admin',
    isOperator: () => user?.role === 'operator',
    isWorker: () => user?.role === 'worker',
    isClient: () => user?.role === 'user'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};