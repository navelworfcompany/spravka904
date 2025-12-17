import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { OPERATOR_ROUTES } from '../../utils/constants';
import './OperatorSidebar.css';

const OperatorSidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();

  // Ограниченный набор пунктов меню для оператора
  const menuItems = [
    { path: OPERATOR_ROUTES.DASHBOARD, icon: '📊', label: 'Дашборд' },
    { path: OPERATOR_ROUTES.APPLICATIONS, icon: '📝', label: 'Заявки' },
    { path: OPERATOR_ROUTES.ORGANIZATIONS, icon: '🏢', label: 'Организации' },
    { path: OPERATOR_ROUTES.PRODUCTS, icon: '🪦', label: 'Памятники' },
    { path: OPERATOR_ROUTES.REVIEWS, icon: '💬', label: 'Отзывы' }
  ];

  return (
    <div className={`operator-sidebar ${isOpen ? 'operator-sidebar--open' : 'operator-sidebar--closed'}`}>
      <div className="operator-sidebar-header">
        <h2>Панель оператора</h2>
        <button className="operator-sidebar-toggle" onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="operator-sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`operator-sidebar-nav-item ${
              location.pathname === item.path ? 'operator-sidebar-nav-item--active' : ''
            }`}
          >
            <span className="operator-sidebar-nav-icon">{item.icon}</span>
            {isOpen && (
              <span className="operator-sidebar-nav-label">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="operator-sidebar-footer">
        <div className="operator-version">Версия 1.0.0</div>
      </div>
    </div>
  );
};

export default OperatorSidebar;