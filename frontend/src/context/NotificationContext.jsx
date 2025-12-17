import React, { createContext, useState, useContext, useCallback } from 'react';
import { NOTIFICATION_TYPES } from '../utils/constants';

const NotificationContext = createContext();

// Хук для использования уведомлений
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Показать уведомление
  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Автоматическое скрытие
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  // Удалить уведомление
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Показать успешное уведомление
  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }, [showNotification]);

  // Показать ошибку
  const showError = useCallback((message, duration) => {
    return showNotification(message, NOTIFICATION_TYPES.ERROR, duration);
  }, [showNotification]);

  // Показать предупреждение
  const showWarning = useCallback((message, duration) => {
    return showNotification(message, NOTIFICATION_TYPES.WARNING, duration);
  }, [showNotification]);

  // Показать информационное уведомление
  const showInfo = useCallback((message, duration) => {
    return showNotification(message, NOTIFICATION_TYPES.INFO, duration);
  }, [showNotification]);

  // Очистить все уведомления
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Очистить уведомления по типу
  const clearNotificationsByType = useCallback((type) => {
    setNotifications(prev => prev.filter(notification => notification.type !== type));
  }, []);

  // Получить количество уведомлений
  const getNotificationCount = useCallback(() => {
    return notifications.length;
  }, [notifications]);

  // Получить уведомления по типу
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const value = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
    clearNotificationsByType,
    getNotificationCount,
    getNotificationsByType
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};