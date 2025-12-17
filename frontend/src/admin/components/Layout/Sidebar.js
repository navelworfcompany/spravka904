// src/admin/components/Layout/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../utils/constants';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { path: ADMIN_ROUTES.DASHBOARD, icon: '📊', label: 'Дашборд' },
    { path: ADMIN_ROUTES.APPLICATIONS, icon: '📝', label: 'Заявки' },
    { path: ADMIN_ROUTES.USERS, icon: '👥', label: 'Пользователи' },
    { path: ADMIN_ROUTES.PRODUCTS, icon: '🪦', label: 'Памятники' },
    { path: ADMIN_ROUTES.WOKERS, icon: '✉️', label: 'Заявки организаий' },
    { path: ADMIN_ROUTES.REVIEWS, icon: '💬', label: 'Отзывы' }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      <div className="sidebar-header">
        <h2>Админ-панель</h2>
        <button className="sidebar-toggle" onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${
              location.pathname === item.path ? 'sidebar-nav-item--active' : ''
            }`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {isOpen && <span className="sidebar-nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;