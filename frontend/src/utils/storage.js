// src/utils/storage.js
// Безопасные операции с localStorage
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      // Проверяем доступность localStorage
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      
      // Проверяем, не заблокирован ли доступ
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage get error:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage set error:', error);
      throw new Error('Не удалось сохранить данные. Проверьте настройки браузера.');
    }
  },
  
  removeItem: (key) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage remove error:', error);
    }
  },
  
  clear: () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage clear error:', error);
    }
  }
};