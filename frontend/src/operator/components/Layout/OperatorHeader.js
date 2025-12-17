import React, { useState } from 'react';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications'; // Заменяем useOperator
import './OperatorHeader.css';

const OperatorHeader = ({ user, onLogout, onToggleSidebar }) => {
  const { notifications, unreadCount } = useOperatorNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Вычисляем hasUnreadNotifications локально
  const hasUnreadNotifications = unreadCount > 0;

  return (
    <header className="operator-header">
      <div className="operator-header-left">
        <button className="operator-sidebar-toggle-btn" onClick={onToggleSidebar}>
          ☰
        </button>
        <h1>Панель оператора</h1>
      </div>

      <div className="operator-header-right">
        {/* Уведомления */}
        <div className="operator-notifications-wrapper">
          <button 
            className="operator-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Уведомления"
          >
            <span className="operator-notifications-icon">🔔</span>
            {hasUnreadNotifications && (
              <span className="operator-notifications-badge">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="operator-notifications-dropdown">
              <div className="operator-notifications-dropdown-header">
                <span>Уведомления ({notifications.length})</span>
                <button 
                  className="operator-notifications-close"
                  onClick={() => setShowNotifications(false)}
                >
                  ×
                </button>
              </div>
              
              {notifications.length === 0 ? (
                <div className="operator-no-notifications">
                  Нет уведомлений
                </div>
              ) : (
                <div className="operator-notifications-list">
                  {notifications.slice(0, 5).map(notification => (
                    <div 
                      key={notification.id}
                      className={`operator-notification-item ${notification.read ? '' : 'operator-notification-unread'}`}
                    >
                      <div className="operator-notification-type">
                        {notification.type === 'success' && '✅'}
                        {notification.type === 'error' && '❌'}
                        {notification.type === 'warning' && '⚠️'}
                        {notification.type === 'info' && 'ℹ️'}
                      </div>
                      <div className="operator-notification-content">
                        <div className="operator-notification-title">
                          {notification.title}
                        </div>
                        <div className="operator-notification-message">
                          {notification.message}
                        </div>
                        <div className="operator-notification-time">
                          {new Date(notification.timestamp).toLocaleTimeString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {notifications.length > 0 && (
                <div className="operator-notifications-footer">
                  <button 
                    className="operator-view-all-notifications"
                    onClick={() => {
                      setShowNotifications(false);
                    }}
                  >
                    Показать все уведомления
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Меню пользователя */}
        <div className="operator-user-menu">
          <div className="operator-user-info">
            <span className="operator-user-name">{user.name}</span>
            <span className="operator-user-role">Оператор</span>
          </div>
          <button className="operator-logout-btn" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default OperatorHeader;