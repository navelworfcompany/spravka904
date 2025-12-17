import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showNotification } = useNotifications();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const mockUser = {
    name: 'Иван Иванов',
    phone: '+7 (999) 123-45-67',
    role: 'user'
  };

  const currentUser = user || mockUser;

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    showNotification('Вы успешно вышли из системы', 'success');
    navigate('/');
    setShowMobileMenu(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const navigationItems = [
    { path: '/client/review', label: 'Отзывы', icon: '⭐' }
  ];

  return (
    <header className="header-dark">
      <div className="header-container">
        <div className="header-brand">
          <div 
            className="logo-dark"
            onClick={() => navigate('/')}
          >
            📋
          </div>
          <div className="header-titles">
            <h1 className="app-title-dark">Ритуальная справочная</h1>
            <span className="page-title-dark">Система заявок</span>
          </div>
        </div>

        <nav className="header-nav desktop-nav-dark">
          {navigationItems.map(item => (
            <button
              key={item.path}
              className={`nav-button-dark ${
                location.pathname === item.path ? 'nav-button-dark-active' : 'nav-button-dark-inactive'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon && <span className="nav-icon-dark">{item.icon}</span>}
              <span className="nav-label-dark">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions-dark">
          <div className="user-info-dark">
            <div className="user-avatar-dark">
              {currentUser.name?.[0]?.toUpperCase() || 'К'}
            </div>
            <div className="user-main-info-dark">
              <span className="user-name-dark">{currentUser.name || currentUser.phone}</span>
              <span className="user-role-dark">Клиент</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="small"
            onClick={handleLogout}
            className="logout-button-dark"
          >
            Выйти
          </Button>

          <button
            className="mobile-menu-toggle-dark"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Открыть меню"
          >
            <span className="menu-bar-dark"></span>
            <span className="menu-bar-dark"></span>
            <span className="menu-bar-dark"></span>
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu-overlay-dark" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-content-dark" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header-dark">
              <div className="logo-dark" onClick={() => navigate('/')}>
                📋
              </div>
              <h2 className="mobile-menu-title-dark">Ритуальная справочная</h2>
              <button 
                className="mobile-menu-close-dark"
                onClick={() => setShowMobileMenu(false)}
                aria-label="Закрыть меню"
              >
                ✕
              </button>
            </div>

            <div className="mobile-user-info-dark">
              <div className="user-avatar-dark-large">
                {currentUser.name?.[0]?.toUpperCase() || 'К'}
              </div>
              <div className="mobile-user-details-dark">
                <div className="mobile-user-name-dark">{currentUser.name || currentUser.phone}</div>
                <div className="mobile-user-role-dark">Клиент</div>
              </div>
            </div>

            <nav className="mobile-nav-dark">
              {navigationItems.map(item => (
                <button
                  key={item.path}
                  className={`mobile-nav-item-dark ${
                    location.pathname === item.path ? 'mobile-nav-item-dark-active' : ''
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="mobile-nav-icon-dark">{item.icon}</span>
                  <span className="mobile-nav-label-dark">{item.label}</span>
                  <span className="mobile-nav-arrow-dark">→</span>
                </button>
              ))}
            </nav>

            <div className="system-info-mobile-dark">
              <div className="system-info-header-dark">
                <span className="system-icon-dark">⚙️</span>
                <h4 className="system-title-dark">Система заявок</h4>
              </div>
              <p className="system-description-dark">
                Создавайте заявки на изготовление памятников и отслеживайте их статус
              </p>
            </div>

            <div className="mobile-actions-dark">
              <Button
                variant="outline"
                fullWidth
                onClick={handleLogout}
                className="mobile-logout-button-dark"
              >
                <span className="logout-icon-dark">🚪</span>
                Выйти из системы
              </Button>
            </div>

            <div className="mobile-footer-dark">
              <span className="version-dark">Версия 1.0.0</span>
              <span className="copyright-dark">© 2024 Ритуальная справочная</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;