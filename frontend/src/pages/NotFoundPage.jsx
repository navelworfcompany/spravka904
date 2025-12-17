import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/common/Button';
import './not-found-page.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotifications();

  useEffect(() => {
    // Логируем попытку доступа к несуществующей странице
    console.warn(`Attempted to access non-existent route: ${location.pathname}`);
    
    // Показываем уведомление
    showNotification('Страница не найдена', 'warning');
  }, [location.pathname, showNotification]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleContactSupport = () => {
    // В реальном приложении здесь может быть ссылка на форму обратной связи
    showNotification('Свяжитесь с поддержкой: support@example.com', 'info');
  };

  // Возможные причины ошибки 404
  const possibleReasons = [
    'Страница была перемещена или удалена',
    'Вы ввели неправильный адрес',
    'Ссылка, по которой вы перешли, устарела',
    'Произошла временная ошибка'
  ];

  // Популярные страницы для быстрой навигации
  const popularPages = [
    { path: '/', name: 'Главная страница', description: 'Начните с главной' },
    { path: '/user/applications', name: 'Мои заявки', description: 'Просмотр ваших заявок' },
    { path: '/worker', name: 'Панель работника', description: 'Для работников системы' },
    { path: '/login', name: 'Вход в систему', description: 'Авторизация' }
  ];

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        {/* Анимированная графика */}
        <div className="error-graphics">
          <div className="error-number">4</div>
          <div className="error-icon">🔍</div>
          <div className="error-number">4</div>
        </div>

        <div className="error-content">
          <h1>Страница не найдена</h1>
          <p className="error-description">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>

          <div className="error-details">
            <div className="requested-url">
              <strong>Запрошенный адрес:</strong>
              <code>{location.pathname}</code>
            </div>

            <div className="possible-reasons">
              <h3>Возможные причины:</h3>
              <ul>
                {possibleReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <Button 
              onClick={handleGoBack}
              className="btn-secondary"
            >
              ← Назад
            </Button>
            <Button 
              onClick={handleGoHome}
              className="btn-primary"
            >
              На главную
            </Button>
            <Button 
              onClick={handleContactSupport}
              className="btn-outline"
            >
              Связаться с поддержкой
            </Button>
          </div>

          {/* Быстрая навигация */}
          <div className="quick-links">
            <h3>Популярные страницы:</h3>
            <div className="links-grid">
              {popularPages.map((page, index) => (
                <div 
                  key={index}
                  className="page-card"
                  onClick={() => navigate(page.path)}
                >
                  <div className="page-name">{page.name}</div>
                  <div className="page-description">{page.description}</div>
                  <div className="page-arrow">→</div>
                </div>
              ))}
            </div>
          </div>

          {/* Дополнительная помощь */}
          <div className="help-section">
            <h3>Нужна помощь?</h3>
            <div className="help-options">
              <div className="help-option">
                <span className="help-icon">📧</span>
                <div>
                  <strong>Email поддержка</strong>
                  <p>support@example.com</p>
                </div>
              </div>
              <div className="help-option">
                <span className="help-icon">📞</span>
                <div>
                  <strong>Телефон</strong>
                  <p>+7 (999) 123-45-67</p>
                </div>
              </div>
              <div className="help-option">
                <span className="help-icon">🕒</span>
                <div>
                  <strong>Время работы</strong>
                  <p>Пн-Пт: 9:00-18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Декоративные элементы */}
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

// Компонент для отображения в модальном окне (можно использовать в других местах)
export const NotFoundMessage = ({ onClose, customMessage }) => {
  return (
    <div className="not-found-message">
      <div className="message-icon">❌</div>
      <h3>{customMessage || 'Контент не найден'}</h3>
      <p>Запрашиваемая информация временно недоступна или была удалена.</p>
      {onClose && (
        <Button onClick={onClose} className="btn-primary">
          Закрыть
        </Button>
      )}
    </div>
  );
};

export default NotFoundPage;