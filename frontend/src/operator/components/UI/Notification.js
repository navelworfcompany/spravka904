import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  timestamp,
  onClose,
  autoClose = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Анимация появления
    setIsVisible(true);
    
    // Автоматическое закрытие
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const handleClose = () => {
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose(id);
      }
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div 
      className={`
        operator-notification 
        operator-notification--${type}
        ${isVisible ? 'operator-notification--visible' : ''}
        ${isClosing ? 'operator-notification--closing' : ''}
      `}
      onClick={handleClose}
    >
      <div className="operator-notification__content">
        <div className="operator-notification__header">
          <div className="operator-notification__icon">
            {getIcon()}
          </div>
          <div className="operator-notification__title">
            {title}
          </div>
          <button 
            className="operator-notification__close"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            ×
          </button>
        </div>
        
        <div className="operator-notification__body">
          <div className="operator-notification__message">
            {message}
          </div>
          {timestamp && (
            <div className="operator-notification__time">
              {formatTime(timestamp)}
            </div>
          )}
        </div>
        
        {/* Прогресс-бар для авто-закрытия */}
        {autoClose && onClose && (
          <div 
            className="operator-notification__progress"
            style={{ 
              animationDuration: `${autoClose}ms` 
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Notification;