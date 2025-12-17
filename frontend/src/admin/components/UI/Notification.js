// src/admin/components/UI/Notification.js
import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = ({ id, type = 'info', title, message, timestamp }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`notification notification--${type} ${isVisible ? 'notification--visible' : ''}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        <div className="notification-message">{message}</div>
        <div className="notification-time">
          {timestamp.toLocaleTimeString('ru-RU')}
        </div>
      </div>
    </div>
  );
};

export default Notification;