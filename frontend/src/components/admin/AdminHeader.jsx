import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminHeader.css';

const AdminHeader = () => {
  const { user, logout } = useAuth();

  const getRoleName = (role) => {
    const roles = {
      admin: 'Администратор',
      operator: 'Оператор',
      worker: 'Работник',
      user: 'Клиент'
    };
    return roles[role] || role;
  };

  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <h1>Панель управления</h1>
          <span className="user-role">{getRoleName(user?.role)}</span>
        </div>
        
        <div className="admin-header-right">
          <span className="user-info">
            {user?.name} ({user?.phone})
          </span>
          <button className="btn btn-outline btn-sm" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;