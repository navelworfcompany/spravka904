import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from './Button';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showNotification } = useNotifications();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    showNotification('Вы успешно вышли из системы', 'success');
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    
    const titles = {
      '/user/applications': 'Мои заявки',
      '/admin': 'Панель администратора',
      '/operator': 'Панель оператора',
      '/worker': 'Панель работника',
      '/login': 'Вход в систему'
    };

    return titles[path] || 'Система заявок';
  };

  const getUserRoleText = () => {
    if (!user) return '';
    
    const roles = {
      'admin': 'Администратор',
      'operator': 'Оператор',
      'worker': 'Работник',
      'user': 'Клиент'
    };

    return roles[user.role] || 'Пользователь';
  };

  const getNavigationItems = () => {
    if (!user) {
      return [
        { path: '/', label: 'Главная', show: true },
        { path: '/login', label: 'Вход', show: true }
      ];
    }

    const baseItems = [
      { path: '/', label: 'Главная', show: true }
    ];

    const roleItems = {
      'user': [
        //{ path: '/user/applications', label: 'Мои заявки', show: true }
      ],
      'worker': [
        { path: '/worker', label: 'Рабочие заявки', show: true }
      ],
      'operator': [
        { path: '/operator', label: 'Управление заявками', show: true }
      ],
      'admin': [
        { path: '/admin', label: 'Админ панель', show: true }
      ]
    };

    return [...baseItems, ...(roleItems[user.role] || [])];
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="header-c">
      <div className="header-container">
        {/* Логотип и название */}
        <div className="header-brand">
          <div 
            className="logo"
            onClick={() => navigate('/')}
          >
            📋
          </div>
          <div className="header-titles">
            <h1 className="app-title">Ритуальная справочная</h1>
            <span className="page-title">{getPageTitle()}</span>
          </div>
        </div>

        {/* Навигация для десктопа */}
        <nav className="header-nav desktop-nav">
          {navigationItems
            .filter(item => item.show)
            .map(item => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'primary' : 'ghost'}
                onClick={() => handleNavigation(item.path)}
                className="nav-button"
              >
                {item.label}
              </Button>
            ))}
        </nav>

        {/* Информация пользователя и кнопки */}
        <div className="header-actions">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-name">{user.name || user.phone}</span>
                <span className="user-role">{getUserRoleText()}</span>
              </div>
              <Button
                variant="outline"
                size="small"
                onClick={handleLogout}
                className="logout-button-c"
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="small"
              onClick={() => navigate('/login')}
            >
              Войти
            </Button>
          )}

          {/* Кнопка мобильного меню */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Открыть меню"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            {/* Информация пользователя в мобильном меню */}
            {user && (
              <div className="mobile-user-info">
                <div className="user-avatar">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="user-name">{user.name || user.phone}</div>
                  <div className="user-role">{getUserRoleText()}</div>
                </div>
              </div>
            )}

            {/* Навигация в мобильном меню */}
            <nav className="mobile-nav">
              {navigationItems
                .filter(item => item.show)
                .map(item => (
                  <button
                    key={item.path}
                    className={`mobile-nav-item ${
                      location.pathname === item.path ? 'mobile-nav-item-active' : ''
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
            </nav>

            {/* Действия в мобильном меню */}
            <div className="mobile-actions">
              {user ? (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleLogout}
                >
                  Выйти
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleNavigation('/login')}
                >
                  Войти
                </Button>
              )}
            </div>
          </div>

          {/* Оверлей для закрытия меню */}
          <div 
            className="mobile-menu-overlay"
            onClick={() => setShowMobileMenu(false)}
          />
        </div>
      )}
    </header>
  );
};

// Специализированные компоненты Header для разных ролей
export const AdminHeader = (props) => <Header {...props} />;
export const OperatorHeader = (props) => <Header {...props} />;
export const WorkerHeader = (props) => <Header {...props} />;
export const ClientHeader = (props) => <Header {...props} />;

export default Header;