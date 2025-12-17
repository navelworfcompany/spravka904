import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './Notification.css';

const Notification = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {getNotificationIcon(notification.type)}
            </span>
            <div className="notification-message">
              {notification.message}
            </div>
            <button
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
          
          {/* Прогресс-бар для автоматического закрытия */}
          {notification.duration > 0 && (
            <div 
              className="notification-progress"
              style={{ 
                animationDuration: `${notification.duration}ms` 
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Notification;