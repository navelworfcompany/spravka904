// src/worker/components/Layout/WorkerLayout.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './WorkerLayout.css';

const WorkerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/worker/dashboard', label: 'Дашборд', icon: '📊' },
    { path: '/worker/applications', label: 'Заявки', icon: '📋' },
    { path: '/worker/portfolio', label: 'Мои товары', icon: '💼' },
    { path: '/worker/profile', label: 'Профиль', icon: '👤' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login-worker');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="worker-layout">
      <aside className={`worker-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="worker-sidebar-header">
          <h2>Кабинет</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="worker-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`worker-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="worker-sidebar-footer">
          <div className="worker-user-info">
            <span className="user-avatar">👷</span>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{user?.name || 'Кто-то'}</div>
                <div className="user-role">Мастер</div>
              </div>
            )}
          </div>
          <button 
            className="logout-porwok-button"
            onClick={handleLogout}
            title="Выйти"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      <main className="worker-main">
        <div className="worker-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default WorkerLayout;