// src/admin/components/Layout/Header.js
import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import './Header.css';

const Header = ({ user, onLogout, onToggleSidebar }) => {
  const { notifications } = useAdmin();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button className="sidebar-toggle-btn" onClick={onToggleSidebar}>
          ☰
        </button>
        <h1>Панель управления</h1>
      </div>

      <div className="admin-header-right">
        <div className="notifications-indicator">
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
          🔔
        </div>

        <div className="user-menu">
          <span className="user-name">{user.name}</span>
          <span className="user-role">Администратор</span>
          <button className="logout-btn" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;