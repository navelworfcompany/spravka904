import React from 'react';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications'; // Заменяем useOperator
import Notification from './Notification';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, markNotificationAsRead, clearNotifications } = useOperatorNotifications(); // Используем новый хук

  if (notifications.length === 0) {
    return null;
  }

  const handleNotificationClose = (id) => {
    markNotificationAsRead(id);
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  return (
    <div className="operator-notifications-container">
      <div className="operator-notifications-header">
        <div className="operator-notifications-title">
          <span className="operator-notifications-count">
            Уведомления ({notifications.length})
          </span>
        </div>
        <button 
          className="operator-notifications-clear-btn"
          onClick={handleClearAll}
          title="Очистить все уведомления"
        >
          Очистить все
        </button>
      </div>

      <div className="operator-notifications-list">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            timestamp={notification.timestamp}
            onClose={handleNotificationClose}
            autoClose={notification.read ? null : 5000}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;