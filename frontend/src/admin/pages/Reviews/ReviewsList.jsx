import React, { useState, useEffect } from 'react';
import { reviewsAPI } from '../../../services/api';
import { authService } from '../../../services/authService';
import './ReviewsList.css';

const ReviewsList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [stats, setStats] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [filters]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getAllReviews(filters);
      setReviews(response.data || []);
      setError('');
    } catch (err) {
      console.error('Ошибка при загрузке отзывов:', err);
      setError('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reviewsAPI.getReviewsStats();
      setStats(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      await reviewsAPI.updateReviewStatus(reviewId, newStatus);
      
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { ...review, status: newStatus }
            : review
        )
      );
      
      loadStats();
      
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      setError('Не удалось обновить статус отзыва');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      await reviewsAPI.deleteReview(reviewId);
      
      setReviews(prevReviews => 
        prevReviews.filter(review => review.id !== reviewId)
      );
      
      loadStats();
      
    } catch (err) {
      console.error('Ошибка при удалении отзыва:', err);
      setError('Не удалось удалить отзыв');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleReviewText = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Модерация', className: 'status-pending-compact-adm-rew' },
      checked: { label: 'Одобрен', className: 'status-checked-compact-adm-rew' },
      rejected: { label: 'Отклонен', className: 'status-rejected-compact-adm-rew' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'status-unknown-compact-adm-rew' };
    
    return <span className={`status-badge-compact-adm-rew ${config.className}`}>{config.label}</span>;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="reviews-container-compact-adm-rew">
        <div className="loading-container-compact-adm-rew">
          <div className="loading-spinner-compact-adm-rew"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-container-compact-adm-rew">
      {/* Компактный заголовок */}
      <div className="page-header-compact-adm-rew">
        <div className="header-left-compact-adm-rew">
          <h1>Отзывы</h1>
          <p>Модерация отзывов</p>
        </div>
        <div className="header-right-compact-adm-rew">
          <button
            onClick={loadReviews}
            className="refresh-btn-compact-adm-rew"
            disabled={loading}
            title="Обновить"
          >
            {loading ? '⟳' : '↻'}
          </button>
        </div>
      </div>

      {/* Компактная статистика */}
      {stats && (
        <div className="stats-cards-compact-adm-rew">
          <div className="stat-card-compact-adm-rew total-stat-compact">
            <div className="stat-icon-compact-adm-rew">📊</div>
            <div className="stat-info-compact-adm-rew">
              <div className="stat-value-compact-adm-rew">{stats.total || 0}</div>
              <div className="stat-label-compact-adm-rew">Всего</div>
            </div>
          </div>
          
          <div className="stat-card-compact-adm-rew pending-stat-compact">
            <div className="stat-icon-compact-adm-rew">⏳</div>
            <div className="stat-info-compact-adm-rew">
              <div className="stat-value-compact-adm-rew">{stats.byStatus?.pending || 0}</div>
              <div className="stat-label-compact-adm-rew">На модерации</div>
            </div>
          </div>
          
          <div className="stat-card-compact-adm-rew checked-stat-compact">
            <div className="stat-icon-compact-adm-rew">✓</div>
            <div className="stat-info-compact-adm-rew">
              <div className="stat-value-compact-adm-rew">{stats.byStatus?.checked || 0}</div>
              <div className="stat-label-compact-adm-rew">Одобрено</div>
            </div>
          </div>
          
          <div className="stat-card-compact-adm-rew rejected-stat-compact">
            <div className="stat-icon-compact-adm-rew">✗</div>
            <div className="stat-info-compact-adm-rew">
              <div className="stat-value-compact-adm-rew">{stats.byStatus?.rejected || 0}</div>
              <div className="stat-label-compact-adm-rew">Отклонено</div>
            </div>
          </div>
        </div>
      )}

      {/* Компактные фильтры */}
      <div className="filters-section-compact-adm-rew">
        <div className="filter-group-compact-adm-rew">
          <label>Статус:</label>
          <div className="filter-buttons-compact-adm-rew">
            <button
              className={`filter-btn-compact-adm-rew ${filters.status === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', 'all')}
            >
              Все
            </button>
            <button
              className={`filter-btn-compact-adm-rew ${filters.status === 'pending' ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', 'pending')}
            >
              ⏳ Модерация
            </button>
            <button
              className={`filter-btn-compact-adm-rew ${filters.status === 'checked' ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', 'checked')}
            >
              ✓ Одобренные
            </button>
            <button
              className={`filter-btn-compact-adm-rew ${filters.status === 'rejected' ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', 'rejected')}
            >
              ✗ Отклоненные
            </button>
          </div>
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="error-alert-compact-adm-rew">
          <div className="error-content-compact-adm-rew">
            <span className="error-icon-compact-adm-rew">⚠️</span>
            <span className="error-text-compact-adm-rew">{error}</span>
          </div>
          <button 
            onClick={() => setError('')}
            className="error-close-compact-adm-rew"
          >
            ×
          </button>
        </div>
      )}

      {/* Компактная таблица */}
      <div className="reviews-table-container-compact-adm-rew">
        {reviews.length === 0 ? (
          <div className="empty-state-compact-adm-rew">
            <div className="empty-icon-compact-adm-rew">💬</div>
            <h3>Нет отзывов</h3>
            <p>По выбранным фильтрам отзывов не найдено</p>
          </div>
        ) : (
          <div className="table-scroll-container-compact-adm-rew">
            <table className="reviews-table-compact-adm-rew">
              <thead>
                <tr>
                  <th className="compact-user">Пользователь</th>
                  <th className="compact-phone">Телефон</th>
                  <th className="compact-text">Отзыв</th>
                  <th className="compact-date">Дата</th>
                  <th className="compact-status">Статус</th>
                  <th className="compact-actions">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, index) => (
                  <tr 
                    key={review.id} 
                    className={`review-row-compact-adm-rew ${index % 2 === 0 ? 'row-even-compact-adm-rew' : 'row-odd-compact-adm-rew'}`}
                  >
                    <td className="compact-user">
                      <div className="user-info-compact-adm-rew">
                        <div className="user-name-compact-adm-rew">{review.user_name}</div>
                        <div className="user-id-compact-adm-rew">ID: {review.user_id}</div>
                      </div>
                    </td>
                    
                    <td className="compact-phone">
                      <div className="phone-compact-adm-rew">{review.user_phone}</div>
                    </td>
                    
                    <td className="compact-text">
                      <div className="review-text-compact-adm-rew">
                        {expandedReviews[review.id] || review.text.length <= 80 
                          ? review.text 
                          : `${review.text.substring(0, 80)}...`
                        }
                      </div>
                      {review.text.length > 80 && (
                        <button
                          className="toggle-text-btn-compact-adm-rew"
                          onClick={() => toggleReviewText(review.id)}
                        >
                          {expandedReviews[review.id] ? '▲' : '▼'}
                        </button>
                      )}
                    </td>
                    
                    <td className="compact-date">
                      <div className="date-compact-adm-rew">
                        {new Date(review.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                      <div className="time-compact-adm-rew">
                        {new Date(review.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    
                    <td className="compact-status">
                      {getStatusBadge(review.status)}
                    </td>
                    
                    <td className="compact-actions">
                      <div className="actions-group-compact-adm-rew">
                        {review.status !== 'checked' && (
                          <button
                            onClick={() => handleStatusChange(review.id, 'checked')}
                            className="action-btn-compact-adm-rew approve-btn-compact-adm-rew"
                            title="Одобрить"
                          >
                            ✓
                          </button>
                        )}
                        
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(review.id, 'rejected')}
                            className="action-btn-compact-adm-rew reject-btn-compact-adm-rew"
                            title="Отклонить"
                          >
                            ✗
                          </button>
                        )}
                        
                        {review.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(review.id, 'pending')}
                            className="action-btn-compact-adm-rew moderate-btn-compact-adm-rew"
                            title="На модерацию"
                          >
                            ↶
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="action-btn-compact-adm-rew delete-btn-compact-adm-rew"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Футер */}
      {reviews.length > 0 && (
        <div className="table-footer-compact-adm-rew">
          <div className="footer-info-compact-adm-rew">
            Показано: <strong>{reviews.length}</strong> отзывов
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;