import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications'; // Заменяем useOperator
import { useApplications } from '../../hooks/useApplications';
import { useReviews } from '../../hooks/useReviews';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useProducts } from '../../hooks/useProducts';
import { operatorAPI } from '../../../services/api';
import { OPERATOR_ROUTES, APPLICATION_STATUSES } from '../../utils/constants';
import { formatDate, formatPhone } from '../../utils/helpers';
import OperatorStatCard from '../../components/UI/OperatorStatCard';
import OperatorSimpleChart from '../../components/Charts/OperatorSimpleChart';
import OperatorDataTable from '../../components/UI/OperatorDataTable';
import './OperatorDashboard.css';

const OperatorDashboard = () => {
  const navigate = useNavigate();
  
  // Используем кастомные хуки
  const { notifications, addSuccessNotification, addErrorNotification } = useOperatorNotifications();
  const { applications, refreshApplications, applicationsLoading } = useApplications();
  const { stats: reviewsStats, refreshStats } = useReviews();
  const { organizations, refreshOrganizations } = useOrganizations();
  const { productTypes, refreshProductTypes } = useProducts();

  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localStats, setLocalStats] = useState({
    newApplications: 0,
    totalApplications: 0,
    inProgressApplications: 0,
    completedApplications: 0,
    totalOrganizations: 0,
    totalProducts: 0,
    pendingReviews: 0,
    totalReviews: 0
  });
  const [refreshTime, setRefreshTime] = useState(new Date());

  
  // Загрузка данных при монтировании
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Обновление статистики при изменении данных
  useEffect(() => {
    if (applications && applications.length > 0) {
      updateApplicationsStatistics();
      updateRecentApplications();
    }
    
    if (reviewsStats) {
      updateReviewsStatistics();
    }
    
    if (organizations) {
      updateOrganizationsStatistics();
    }
    
    if (productTypes) {
      updateProductsStatistics();
    }
  }, [applications, reviewsStats, organizations, productTypes]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загружаем все данные параллельно
      await Promise.all([
        refreshApplications(),
        refreshStats(),
        refreshOrganizations(),
        refreshProductTypes()
      ]);
      
      // Загружаем дополнительные данные с сервера
      await loadServerStats();
      
      setRefreshTime(new Date());
      //addSuccessNotification('Данные дашборда обновлены');
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных дашборда:', error);
      //addErrorNotification('Ошибка загрузки данных дашборда');
    } finally {
      setLoading(false);
    }
  };

  const loadServerStats = async () => {
    try {
      const statsResponse = await operatorAPI.getDashboardStats();
      
      if (statsResponse && statsResponse.success) {
        const statsData = statsResponse.data?.stats || {};
        
        setLocalStats(prev => ({
          ...prev,
          // Используем данные с сервера, если они есть, иначе оставляем локальные
          totalApplications: statsData.totalApplications || prev.totalApplications,
          newApplications: statsData.newApplications || prev.newApplications,
          inProgressApplications: statsData.inProgressApplications || prev.inProgressApplications,
          completedApplications: statsData.completedApplications || prev.completedApplications,
          totalOrganizations: statsData.totalOrganizations || prev.totalOrganizations,
          totalProducts: statsData.totalProducts || prev.totalProducts
        }));
      }
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить статистику сервера:', error);
      // Используем локальные данные как fallback
    }
  };

  const updateApplicationsStatistics = () => {
    if (!applications || !Array.isArray(applications)) return;
    
    const newApps = applications.filter(app => app.status === 'new').length;
    const inProgressApps = applications.filter(app => 
      ['in_progress', 'pending', 'assigned'].includes(app.status)
    ).length;
    const completedApps = applications.filter(app => app.status === 'completed').length;
    
    setLocalStats(prev => ({
      ...prev,
      totalApplications: applications.length,
      newApplications: newApps,
      inProgressApplications: inProgressApps,
      completedApplications: completedApps
    }));
  };

  const updateReviewsStatistics = () => {
    if (!reviewsStats) return;
    
    setLocalStats(prev => ({
      ...prev,
      totalReviews: reviewsStats.total || 0,
      pendingReviews: reviewsStats.byStatus?.pending || 0
    }));
  };

  const updateOrganizationsStatistics = () => {
    if (!organizations) return;
    
    const organizationsCount = Array.isArray(organizations) ? organizations.length : 0;
    
    setLocalStats(prev => ({
      ...prev,
      totalOrganizations: organizationsCount
    }));
  };

  const updateProductsStatistics = () => {
    if (!productTypes) return;
    
    let totalProducts = 0;
    if (Array.isArray(productTypes)) {
      // Считаем общее количество товаров
      totalProducts = productTypes.reduce((sum, type) => {
        return sum + (type.products_count || 0);
      }, 0);
      
      // Если products_count нет, используем количество типов
      if (totalProducts === 0) {
        totalProducts = productTypes.length;
      }
    }
    
    setLocalStats(prev => ({
      ...prev,
      totalProducts: totalProducts
    }));
  };

  const updateRecentApplications = () => {
    if (!applications || !Array.isArray(applications)) return;
    
    // Берем последние 5 заявок, отсортированных по дате создания (новые сверху)
    const recent = [...applications]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    setRecentApplications(recent);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Ошибка обновления:', error);
      addErrorNotification('Ошибка обновления данных');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Новые заявки',
      value: localStats.newApplications,
      icon: '🆕',
      color: 'red',
      subtitle: 'Требуют обработки',
      onClick: () => navigate(OPERATOR_ROUTES.APPLICATIONS + '?status=new'),
      priority: true,
      badge: localStats.newApplications > 0 ? localStats.newApplications : null
    },
    {
      title: 'В работе',
      value: localStats.inProgressApplications,
      icon: '⚡',
      color: 'orange',
      subtitle: 'Активные заявки',
      onClick: () => navigate(OPERATOR_ROUTES.APPLICATIONS + '?status=in_progress')
    },
    {
      title: 'Всего заявок',
      value: localStats.totalApplications,
      icon: '📋',
      color: 'green',
      subtitle: 'За все время',
      onClick: () => navigate(OPERATOR_ROUTES.APPLICATIONS)
    },
    {
      title: 'Организации',
      value: localStats.totalOrganizations,
      icon: '🏢',
      color: 'blue',
      subtitle: 'Партнеры и работники',
      onClick: () => navigate(OPERATOR_ROUTES.ORGANIZATIONS)
    },
    {
      title: 'Памятники',
      value: localStats.totalProducts,
      icon: '🪦',
      color: 'purple',
      subtitle: 'Товары в каталоге',
      onClick: () => navigate(OPERATOR_ROUTES.PRODUCTS)
    },
    {
      title: 'Отзывы на модерации',
      value: localStats.pendingReviews,
      icon: '💬',
      color: 'yellow',
      subtitle: 'Требуют проверки',
      onClick: () => navigate(OPERATOR_ROUTES.REVIEWS + '?status=pending'),
      badge: localStats.pendingReviews > 0 ? localStats.pendingReviews : null
    }
  ];

  const applicationsChartData = {
    new: localStats.newApplications,
    in_progress: localStats.inProgressApplications,
    completed: localStats.completedApplications,
    cancelled: applications?.filter(app => app.status === 'cancelled')?.length || 0
  };

  const reviewsChartData = {
    pending: localStats.pendingReviews,
    checked: localStats.totalReviews - localStats.pendingReviews
  };

  const tableColumns = [
    {
      key: 'name',
      title: 'Имя',
      render: (value) => <strong>{value}</strong>
    },
    {
      key: 'phone',
      title: 'Телефон',
      render: (value) => formatPhone(value)
    },
    {
      key: 'product',
      title: 'Товар',
      render: (value, row) => row.product || row.product_type || 'Не указано'
    },
    {
      key: 'status',
      title: 'Статус',
      render: (value) => (
        <span className={`operator-status-badge operator-status-${value}`}>
          {APPLICATION_STATUSES[value]?.label || value}
        </span>
      )
    },
    {
      key: 'created_at',
      title: 'Дата',
      render: (value) => formatDate(value, 'short')
    }
  ];

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="operator-dashboard">
      <div className="operator-dashboard-header">
        <div className="operator-dashboard-title">
          <h1>Панель оператора</h1>
          <p>Обзор заявок и основных метрик</p>
          <div className="operator-dashboard-subtitle">
            <span className="operator-realtime-info">
              Актуальные данные • Последнее обновление: {formatDate(refreshTime, 'time')}
            </span>
          </div>
        </div>

        <div className="operator-dashboard-actions">
          <div 
            className="operator-notifications-count" 
            onClick={() => navigate('/operator/notifications')}
            style={{ cursor: 'pointer' }}
          >
            Уведомления: 
            <span className={`operator-notifications-badge ${unreadNotificationsCount > 0 ? 'has-unread' : ''}`}>
              {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} новых` : notifications.length}
            </span>
          </div>
          <button
            className="operator-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Обновить
          </button>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="operator-stats-grid">
        {statCards.map((card, index) => (
          <OperatorStatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            subtitle={card.subtitle}
            onClick={card.onClick}
            badge={card.badge}
            priority={card.priority}
            loading={loading && card.value === 0}
          />
        ))}
      </div>

      <div className="operator-dashboard-content">
        {/* Графики */}
        <div className="operator-charts-section">
          {/* Статистика заявок */}
          <div className="operator-chart-card">
            <div className="operator-chart-header">
              <h3>Статистика заявок</h3>
              <span className="operator-chart-subtitle">По статусам</span>
              <span className="operator-chart-total">
                Всего: {localStats.totalApplications}
              </span>
            </div>
            {loading && localStats.totalApplications === 0 ? (
              <div className="operator-chart-loading">
                <div className="operator-loading-spinner">⟳</div>
                <p>Загрузка графика...</p>
              </div>
            ) : (
              <OperatorSimpleChart
                data={applicationsChartData}
                type="bar"
                dataType="applications"
                loading={loading}
              />
            )}
          </div>

          {/* Статистика отзывов */}
          <div className="operator-chart-card">
            <div className="operator-chart-header">
              <h3>Отзывы</h3>
              <span className="operator-chart-subtitle">Статус модерации</span>
              <span className="operator-chart-total">
                Всего: {localStats.totalReviews}
              </span>
            </div>
            {loading && localStats.totalReviews === 0 ? (
              <div className="operator-chart-loading">
                <div className="operator-loading-spinner">⟳</div>
                <p>Загрузка графика...</p>
              </div>
            ) : (
              <OperatorSimpleChart
                data={reviewsChartData}
                type="bar"
                dataType="reviews"
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Боковая панель */}
        <div className="operator-sidebar-section">
          {/* Последние заявки */}
          <div className="operator-recent-card">
            <div className="operator-recent-header">
              <h3>Последние заявки</h3>
              <div className="operator-recent-header-right">
                <span className="operator-recent-count">
                  {recentApplications.length} из {localStats.totalApplications}
                </span>
                <button
                  className="operator-view-all-btn"
                  onClick={() => navigate(OPERATOR_ROUTES.APPLICATIONS)}
                >
                  Все →
                </button>
              </div>
            </div>

            <div className="operator-recent-list">
              {applicationsLoading ? (
                <div className="operator-loading-text">
                  <div className="operator-small-spinner"></div>
                  Загрузка заявок...
                </div>
              ) : recentApplications.length > 0 ? (
                <OperatorDataTable
                  columns={tableColumns}
                  data={recentApplications}
                  onRowClick={(row) => navigate(`${OPERATOR_ROUTES.APPLICATIONS}?application=${row.id}`)}
                  emptyMessage="Нет последних заявок"
                  compact
                  autoHeight
                  loading={applicationsLoading}
                />
              ) : (
                <div className="operator-no-data">
                  <div className="operator-empty-icon">📭</div>
                  <p>Нет заявок для отображения</p>
                  <button 
                    className="operator-retry-btn"
                    onClick={handleRefresh}
                  >
                    Обновить
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="operator-quick-actions-card">
            <h3>Быстрые действия</h3>
            <div className="operator-actions-grid">
              <button
                className="operator-action-btn"
                onClick={() => navigate(OPERATOR_ROUTES.APPLICATIONS)}
                disabled={loading}
              >
                <span className="operator-action-icon">📝</span>
                <span className="operator-action-text">
                  Обработать заявки
                  {localStats.newApplications > 0 && (
                    <span className="operator-action-badge">{localStats.newApplications}</span>
                  )}
                </span>
              </button>

              <button
                className="operator-action-btn"
                onClick={() => navigate(OPERATOR_ROUTES.ORGANIZATIONS)}
                disabled={loading}
              >
                <span className="operator-action-icon">🏢</span>
                <span className="operator-action-text">
                  Организации
                  <span className="operator-action-count">{localStats.totalOrganizations}</span>
                </span>
              </button>

              <button
                className="operator-action-btn"
                onClick={() => navigate(OPERATOR_ROUTES.PRODUCTS)}
                disabled={loading}
              >
                <span className="operator-action-icon">🪦</span>
                <span className="operator-action-text">
                  Каталог памятников
                  <span className="operator-action-count">{localStats.totalProducts}</span>
                </span>
              </button>

              <button
                className="operator-action-btn"
                onClick={() => navigate(OPERATOR_ROUTES.REVIEWS)}
                disabled={loading}
              >
                <span className="operator-action-icon">💬</span>
                <span className="operator-action-text">
                  Модерация отзывов
                  {localStats.pendingReviews > 0 && (
                    <span className="operator-action-badge">{localStats.pendingReviews}</span>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Статус обновления */}
      <div className="operator-dashboard-footer">
        <div className="operator-data-status">
          <span className={`operator-data-indicator ${loading ? 'loading' : 'success'}`}>
            {loading ? '🔄' : '✅'}
          </span>
          <span className="operator-data-text">
            {loading ? 'Обновление данных...' : 'Данные актуальны'}
          </span>
          <span className="operator-data-time">
            • Последнее обновление: {formatDate(refreshTime, 'time')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;