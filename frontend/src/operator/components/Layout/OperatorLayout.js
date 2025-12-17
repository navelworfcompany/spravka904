import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications'; // Заменяем useOperator
import OperatorSidebar from './OperatorSidebar';
import OperatorHeader from './OperatorHeader';
import NotificationContainer from '../UI/NotificationContainer';
import './OperatorLayout.css';

const OperatorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications } = useOperatorNotifications(); // Теперь используем правильный хук
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Проверка прав оператора
  if (!user || user.role !== 'operator') {
    return (
      <div className="operator-access-denied">
        <div className="operator-access-denied-card">
          <h2>🚫 Доступ запрещен</h2>
          <p>Для доступа к панели оператора требуются соответствующие права</p>
          <p>Ваша роль: {user?.role || 'не авторизован'}</p>
          <button 
            className="operator-login-redirect"
            onClick={() => window.location.href = '/login'}
          >
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="operator-layout">
      <OperatorSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="operator-main">
        <OperatorHeader 
          user={user}
          onLogout={logout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="operator-content">
          {children}
        </main>
      </div>

      {/* Контейнер уведомлений */}
      {notifications.length > 0 && (
        <NotificationContainer />
      )}
    </div>
  );
};

export default OperatorLayout;