import { useContext } from 'react';
import { OperatorContext } from '../context/OperatorContext';

export const useOperatorNotifications = () => {
  const context = useContext(OperatorContext);
  
  if (!context) {
    throw new Error('useOperatorNotifications must be used within OperatorProvider');
  }
  
  const {
    notifications,
    unreadCount,
    addNotification,
    addSuccessNotification,
    addErrorNotification,
    addWarningNotification,
    addInfoNotification,
    markNotificationAsRead,
    clearNotifications,
    removeNotification
  } = context;
  
  return {
    notifications,
    unreadCount,
    addNotification,
    addSuccessNotification,
    addErrorNotification,
    addWarningNotification,
    addInfoNotification,
    markNotificationAsRead,
    clearNotifications,
    removeNotification,
    hasUnreadNotifications: unreadCount > 0 // Добавляем вычисляемое свойство
  };
};