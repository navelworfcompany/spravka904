// src/admin/components/Layout/AdminLayout.js
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from './Sidebar';
import Header from './Header';
import Notification from '../UI/Notification';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Проверка прав администратора
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-card">
          <h2>🚫 Доступ запрещен</h2>
          <p>Для доступа к админ-панели требуются права администратора</p>
          <p>Ваша роль: {user?.role || 'не авторизован'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="admin-main">
        <Header 
          user={user}
          onLogout={logout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="admin-content">
          {children}
        </main>
      </div>

      {/* Уведомления */}
      <div className="admin-notifications">
        {notifications.map(notification => (
          <Notification 
            key={notification.id}
            {...notification}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminLayout;