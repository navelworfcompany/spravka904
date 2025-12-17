// src/admin/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { useApplications } from '../hooks/useApplications';
import { useUsers } from '../hooks/useUsers';
import { reviewsAPI } from '../../services/api'; // Добавляем импорт
import { ADMIN_ROUTES, APPLICATION_STATUSES } from '../utils/constants';
import { formatDate, formatPhone } from '../utils/helpers';
import StatCard from '../components/UI/StatCard';
import SimpleChart from '../components/Charts/SimpleChart';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, loading, lastUpdate, refreshStats, addNotification } = useAdmin();
  const { applications, loading: appsLoading } = useApplications();
  const { users, loading: usersLoading } = useUsers();

  const [recentApplications, setRecentApplications] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [reviewsStats, setReviewsStats] = useState(null);

  useEffect(() => {
    if (applications) {
      setRecentApplications(applications.slice(0, 5));
    }
  }, [applications]);

  // Загрузка статистики отзывов
  useEffect(() => {
    loadReviewsStats();
  }, []);

  const loadReviewsStats = async () => {
    try {
      const response = await reviewsAPI.getReviewsStats();
      setReviewsStats(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке статистики отзывов:', err);
      // Устанавливаем дефолтные значения при ошибке
      setReviewsStats({
        total: 0,
        byStatus: {
          pending: 0,
          checked: 0,
          rejected: 0
        }
      });
    }
  };

  // Автоматически снимаем загрузку через 5 секунд
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    console.log('🔄 Refreshing dashboard...');
    setLocalLoading(true);
    refreshStats();
    loadReviewsStats();

    setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
  };

  // Функция для безопасного получения данных из stats
  const getStat = (path, fallback = 0) => {
    if (!stats) return fallback;

    const keys = path.split('.');
    let value = stats;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return fallback;
    }

    return value !== undefined ? value : fallback;
  };

  // Основные метрики
  const totalApplications = getStat('data.applications.total') || applications?.length || 0;
  const newApplications = getStat('data.applications.byStatus.new') || applications?.filter(app => app.status === 'new')?.length || 0;
  const inProgressApplications = getStat('data.applications.byStatus.in_progress') || applications?.filter(app => app.status === 'in_progress')?.length || 0;
  const completedApplications = getStat('data.applications.byStatus.completed') || applications?.filter(app => app.status === 'completed')?.length || 0;
  const usersCount = users?.filter(u => u.role === 'user')?.length || 0;
  const workersCount = users?.filter(u => u.role === 'worker')?.length || 0;

  // Статистика отзывов
  const totalReviews = reviewsStats?.total || 0;
  const pendingReviews = reviewsStats?.byStatus?.pending || 0;
  const checkedReviews = reviewsStats?.byStatus?.checked || 0;

  const statCards = [
    {
      title: 'Всего заявок',
      value: totalApplications,
      icon: '📋',
      color: 'blue',
      trend: 12,
      subtitle: 'За все время',
      onClick: () => navigate(ADMIN_ROUTES.APPLICATIONS)
    },
    {
      title: 'Новые заявки',
      value: newApplications,
      icon: '🆕',
      color: 'red',
      trend: 8,
      subtitle: 'Требуют внимания',
      onClick: () => navigate(ADMIN_ROUTES.APPLICATIONS + '?status=new')
    },
    {
      title: 'В работе',
      value: inProgressApplications,
      icon: '⚡',
      color: 'orange',
      trend: -3,
      subtitle: 'Активные'
    },
    {
      title: 'Завершено',
      value: completedApplications,
      icon: '✅',
      color: 'green',
      trend: 5,
      subtitle: 'Успешно закрыто'
    },
    {
      title: 'Клиенты',
      value: usersCount,
      icon: '👨‍💼',
      color: 'purple',
      trend: 15,
      subtitle: 'Всего в системе',
      onClick: () => navigate(ADMIN_ROUTES.USERS)
    },
    {
      title: 'Мастера',
      value: workersCount,
      icon: '👷',
      color: 'blue',
      trend: 2,
      subtitle: 'Активные специалисты'
    },
    // ДОБАВЛЯЕМ КАРТОЧКУ ОТЗЫВОВ
    {
      title: 'Всего отзывов',
      value: totalReviews,
      icon: '💬',
      color: 'teal',
      trend: 0, // Можно оставить 0 или рассчитать реальный тренд
      subtitle: pendingReviews > 0 ? `${pendingReviews} на модерации` : `${checkedReviews} проверено`,
      onClick: () => navigate('/admin/reviews'), // Добавьте этот маршрут в ADMIN_ROUTES
      badge: pendingReviews > 0 ? pendingReviews : null
    }
  ];

  // Данные для графиков
  const applicationsChartData = getStat('data.applications.byStatus') || {
    new: newApplications,
    in_progress: inProgressApplications,
    completed: completedApplications,
    cancelled: applications?.filter(app => app.status === 'cancelled')?.length || 0
  };

  const usersChartData = getStat('data.users.byRole') || {
    admin: users?.filter(u => u.role === 'admin')?.length || 0,
    operator: users?.filter(u => u.role === 'operator')?.length || 0,
    worker: workersCount,
    user: users?.filter(u => u.role === 'user')?.length || 0
  };

  // Данные для графика отзывов
  const reviewsChartData = reviewsStats?.byStatus || {
    pending: 0,
    checked: 0,
    rejected: 0
  };

  // Определяем общее состояние загрузки
  const isLoading = localLoading && (loading || appsLoading || usersLoading);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Панель управления</h1>
          <p>Обзор системы и ключевые метрики</p>
          {!stats && (
            <div className="fallback-info">
              ⓘ Используются локальные данные
            </div>
          )}
        </div>

        <div className="dashboard-actions">
          <div className="last-update">
            Обновлено: {lastUpdate ? formatDate(lastUpdate) : 'только что'}
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '🔄'} Обновить
          </button>
        </div>
      </div>

      {/* Карточки статистики - теперь 7 карточек */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
            subtitle={card.subtitle}
            onClick={card.onClick}
            badge={card.badge}
          />
        ))}
      </div>

      <div className="dashboard-content">
        {/* Графики и статистика */}
        <div className="charts-section">
          {/* Статистика заявок */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Статистика заявок</h3>
              <span className="chart-subtitle">По статусам</span>
            </div>
            {isLoading ? (
              <div className="chart-loading">
                <div className="loading-spinner">⟳</div>
                <p>Загрузка графика...</p>
              </div>
            ) : (
              <SimpleChart
                data={applicationsChartData}
                type="bar"
                dataType="applications"
              />
            )}
          </div>

          {/* Распределение пользователей */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Пользователи по ролям</h3>
              <span className="chart-subtitle">Распределение</span>
            </div>
            {isLoading ? (
              <div className="chart-loading">
                <div className="loading-spinner">⟳</div>
                <p>Загрузка графика...</p>
              </div>
            ) : (
              <SimpleChart
                data={usersChartData}
                type="bar"
                dataType="users"
              />
            )}
          </div>

          {/* ДОБАВЛЯЕМ ГРАФИК ОТЗЫВОВ */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Статистика отзывов</h3>
              <span className="chart-subtitle">По статусам модерации</span>
            </div>
            {isLoading ? (
              <div className="chart-loading">
                <div className="loading-spinner">⟳</div>
                <p>Загрузка графика...</p>
              </div>
            ) : (
              <SimpleChart
                data={reviewsChartData}
                type="bar"
                dataType="reviews"
              />
            )}
          </div>
        </div>

        {/* Боковая панель с последними данными */}
        <div className="sidebar-section">
          {/* Последние заявки */}
          <div className="recent-card">
            <div className="recent-header">
              <h3>Последние заявки</h3>
              <button
                className="view-all-btn"
                onClick={() => navigate(ADMIN_ROUTES.APPLICATIONS)}
              >
                Все →
              </button>
            </div>

            <div className="recent-list">
              {isLoading ? (
                <div className="loading-text">Загрузка заявок...</div>
              ) : recentApplications.length > 0 ? (
                recentApplications.map(app => (
                  <div key={app.id} className="recent-item">
                    <div className="recent-info">
                      <strong className="recent-name">{app.name}</strong>
                      <span className="recent-phone">{formatPhone(app.phone)}</span>
                    </div>
                    <div className="recent-details">
                      <span className="recent-product">{app.product}</span>
                      <span className={`status-badge status-${app.status}`}>
                        {APPLICATION_STATUSES[app.status]?.label || app.status}
                      </span>
                    </div>
                    <div className="recent-time">
                      {formatDate(app.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">Нет заявок</div>
              )}
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="quick-actions-card">
            <h3>Быстрые действия</h3>
            <div className="actions-grid">
              <button
                className="action-btn"
                onClick={() => navigate(ADMIN_ROUTES.APPLICATIONS)}
              >
                <span className="action-icon">📝</span>
                <span className="action-text">Все заявки</span>
              </button>

              <button
                className="action-btn"
                onClick={() => navigate(ADMIN_ROUTES.USERS)}
              >
                <span className="action-icon">👥</span>
                <span className="action-text">Пользователи</span>
              </button>

              <button
                className="action-btn"
                onClick={() => navigate(ADMIN_ROUTES.PRODUCTS)}
              >
                <span className="action-icon">🪦</span>
                <span className="action-text">Памятники</span>
              </button>

              {/* ДОБАВЛЯЕМ КНОПКУ ДЛЯ ОТЗЫВОВ */}
              <button
                className="action-btn"
                onClick={() => navigate('/admin/reviews')}
              >
                <span className="action-icon">💬</span>
                <span className="action-text">
                  Отзывы
                  {pendingReviews > 0 && (
                    <span className="action-badge">{pendingReviews}</span>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;