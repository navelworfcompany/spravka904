import React, { useState, useEffect } from 'react';
import { useReviews } from '../../hooks/useReviews';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications';
import ReviewsLoading from './ReviewsLoading';
import './ReviewsList.css';

const ReviewsList = () => {
  const { 
    reviews, 
    stats, 
    loading, 
    filters, 
    setFilters, 
    updateReviewStatus, 
    refreshReviews 
  } = useReviews();
  
  const { addSuccessNotification, addErrorNotification } = useOperatorNotifications();
  
  const [expandedReviews, setExpandedReviews] = useState({});

  const handleFilterChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status,
      page: 1
    }));
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const result = await updateReviewStatus(reviewId, newStatus);
      
      if (result.success) {
        addSuccessNotification(`Статус отзыва обновлен на "${getStatusText(newStatus)}"`);
        await refreshReviews();
      } else {
        addErrorNotification(result.error || 'Ошибка при обновлении статуса');
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      addErrorNotification('Ошибка при обновлении статуса');
    }
  };

  const toggleReviewText = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Модерация', className: 'operator-status-pending' },
      checked: { label: 'Одобрен', className: 'operator-status-checked' },
      rejected: { label: 'Отклонен', className: 'operator-status-rejected' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'operator-status-unknown' };
    
    return <span className={`operator-status-badge ${config.className}`}>{config.label}</span>;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Модерация',
      checked: 'Одобрен',
      rejected: 'Отклонен'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
  };

  // Показываем скелетон во время загрузки
  if (loading && reviews.length === 0) {
    return <ReviewsLoading />;
  }

  return (
    <div className="operator-reviews-page">
      <div className="operator-page-header">
        <div className="operator-header-content">
          <h1>Управление отзывами</h1>
          <p>Модерация и управление отзывами пользователей</p>
        </div>
        
        <div className="operator-header-actions">
          <button
            onClick={refreshReviews}
            className="operator-refresh-btn"
            disabled={loading}
            title="Обновить"
          >
            {loading ? '⏳' : '🔄'} Обновить
          </button>
        </div>
      </div>

      {stats && (
        <div className="operator-reviews-stats">
          <div className="operator-stats-grid">
            <div className="operator-stat-card operator-stat-total">
              <div className="operator-stat-icon">📊</div>
              <div className="operator-stat-info">
                <div className="operator-stat-value">{stats.total || 0}</div>
                <div className="operator-stat-label">Всего отзывов</div>
              </div>
            </div>
            
            <div className="operator-stat-card operator-stat-pending">
              <div className="operator-stat-icon">⏳</div>
              <div className="operator-stat-info">
                <div className="operator-stat-value">{stats.byStatus?.pending || 0}</div>
                <div className="operator-stat-label">На модерации</div>
              </div>
            </div>
            
            <div className="operator-stat-card operator-stat-checked">
              <div className="operator-stat-icon">✅</div>
              <div className="operator-stat-info">
                <div className="operator-stat-value">{stats.byStatus?.checked || 0}</div>
                <div className="operator-stat-label">Одобрено</div>
              </div>
            </div>
            
            <div className="operator-stat-card operator-stat-rejected">
              <div className="operator-stat-icon">❌</div>
              <div className="operator-stat-info">
                <div className="operator-stat-value">{stats.byStatus?.rejected || 0}</div>
                <div className="operator-stat-label">Отклонено</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="operator-reviews-filters">
        <div className="operator-filter-section">
          <h3 className="operator-filter-title">Фильтры по статусу</h3>
          <div className="operator-filter-buttons">
            <button
              className={`operator-filter-btn ${filters.status === 'all' ? 'operator-filter-active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              Все отзывы
            </button>
            <button
              className={`operator-filter-btn operator-filter-pending ${filters.status === 'pending' ? 'operator-filter-active' : ''}`}
              onClick={() => handleFilterChange('pending')}
            >
              ⏳ На модерации
            </button>
            <button
              className={`operator-filter-btn operator-filter-checked ${filters.status === 'checked' ? 'operator-filter-active' : ''}`}
              onClick={() => handleFilterChange('checked')}
            >
              ✅ Одобренные
            </button>
            <button
              className={`operator-filter-btn operator-filter-rejected ${filters.status === 'rejected' ? 'operator-filter-active' : ''}`}
              onClick={() => handleFilterChange('rejected')}
            >
              ❌ Отклоненные
            </button>
          </div>
        </div>
      </div>

      <div className="operator-results-info">
        <span>
          Найдено отзывов: <strong>{reviews.length}</strong>
          {filters.status !== 'all' && ` (статус: ${getStatusText(filters.status)})`}
        </span>
      </div>

      <div className="operator-reviews-table-container">
        {reviews.length === 0 ? (
          <div className="operator-no-reviews">
            <div className="operator-no-reviews-icon">💬</div>
            <h3>Отзывы не найдены</h3>
            <p>По выбранным фильтрам отзывов не найдено</p>
            {filters.status !== 'all' && (
              <button
                className="operator-clear-filter-btn"
                onClick={() => handleFilterChange('all')}
              >
                Показать все отзывы
              </button>
            )}
          </div>
        ) : (
          <div className="operator-table-wrapper">
            <table className="operator-reviews-table">
              <thead>
                <tr>
                  <th className="operator-col-user">Пользователь</th>
                  <th className="operator-col-phone">Телефон</th>
                  <th className="operator-col-text">Отзыв</th>
                  <th className="operator-col-date">Дата</th>
                  <th className="operator-col-status">Статус</th>
                  <th className="operator-col-actions">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, index) => (
                  <tr 
                    key={review.id} 
                    className={`operator-review-row ${index % 2 === 0 ? 'operator-row-even' : 'operator-row-odd'}`}
                  >
                    <td className="operator-col-user">
                      <div className="operator-user-info">
                        <div className="operator-user-name">{review.user_name || 'Аноним'}</div>
                        {review.user_id && (
                          <div className="operator-user-id">ID: {review.user_id}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="operator-col-phone">
                      <div className="operator-phone">
                        {formatPhone(review.user_phone)}
                      </div>
                    </td>
                    
                    <td className="operator-col-text">
                      <div className="operator-review-text-container">
                        <div className={`operator-review-text ${expandedReviews[review.id] ? 'expanded' : ''}`}>
                          {expandedReviews[review.id] || review.text.length <= 80 
                            ? review.text 
                            : `${review.text.substring(0, 80)}...`
                          }
                        </div>
                        {review.text.length > 80 && (
                          <button
                            className="operator-toggle-text-btn"
                            onClick={() => toggleReviewText(review.id)}
                            title={expandedReviews[review.id] ? 'Свернуть' : 'Развернуть'}
                          >
                            {expandedReviews[review.id] ? '▲' : '▼'}
                          </button>
                        )}
                      </div>
                    </td>
                    
                    <td className="operator-col-date">
                      <div className="operator-review-date">
                        {formatDate(review.created_at)}
                      </div>
                    </td>
                    
                    <td className="operator-col-status">
                      {getStatusBadge(review.status)}
                    </td>
                    
                    <td className="operator-col-actions">
                      <div className="operator-actions-compact">
                        {review.status !== 'checked' && (
                          <button
                            onClick={() => handleStatusChange(review.id, 'checked')}
                            className="operator-action-btn-compact operator-approve-btn"
                            title="Одобрить отзыв"
                            disabled={review.status === 'checked'}
                          >
                            ✓
                          </button>
                        )}
                        
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(review.id, 'rejected')}
                            className="operator-action-btn-compact operator-reject-btn"
                            title="Отклонить отзыв"
                            disabled={review.status === 'rejected'}
                          >
                            ✕
                          </button>
                        )}
                        
                        {review.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(review.id, 'pending')}
                            className="operator-action-btn-compact operator-moderate-btn"
                            title="Вернуть на модерацию"
                            disabled={review.status === 'pending'}
                          >
                            ↶
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="operator-table-footer">
          <div className="operator-footer-info">
            Показано: <strong>{reviews.length}</strong> отзывов
          </div>
          <div className="operator-footer-note">
            ⓘ Оператор не может удалять отзывы. Для удаления обратитесь к администратору.
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;