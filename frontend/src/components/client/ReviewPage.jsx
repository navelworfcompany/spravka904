import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI } from '../../services/api.js';
import { authService } from '../../services/authService.js';
import './ReviewPage.css';

const ReviewPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('reviewTheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    loadReviews();
    loadCurrentUser();
    localStorage.setItem('reviewTheme', theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleBack = () => {
    navigate('/client');
  };

  const loadCurrentUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getCheckedReviews();
      setReviews(response.data || []);
    } catch (err) {
      setError('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newReview.trim()) {
      setError('Пожалуйста, введите текст отзыва');
      return;
    }

    if (!user) {
      setError('Для оставления отзыва необходимо авторизоваться');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await reviewsAPI.createReview({ text: newReview });
      
      setNewReview('');
      setSuccess('Отзыв успешно отправлен на модерацию!');
      
      setTimeout(() => {
        loadReviews();
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке отзыва');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`review-page theme-${theme}`}>
      <div className="review-container">
        <div className="header-section">
          <div className="header-left">
            <button 
              onClick={handleBack}
              className="back-button"
              aria-label="Вернуться назад"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Назад
            </button>
          </div>
          <h1 className="review-title">Отзывы наших клиентов</h1>
          <div className="header-right">
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              aria-label={`Переключить на ${theme === 'light' ? 'темную' : 'светлую'} тему`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
        
        {user ? (
          <div className="review-form-section">
            <h2 className="review-form-title">Оставьте свой отзыв</h2>
            <form onSubmit={handleSubmit} className="review-form">
              <div className="form-group">
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Поделитесь вашим мнением о нашей работе..."
                  rows="5"
                  className="review-textarea"
                  disabled={loading}
                  maxLength="1000"
                />
                <div className="char-count">
                  {newReview.length}/1000 символов
                </div>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <button 
                type="submit" 
                disabled={loading || !newReview.trim()} 
                className="submit-button"
              >
                {loading ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </form>
          </div>
        ) : (
          <div className="auth-notice">
            <p>Для оставления отзыва необходимо <a href="/login" className="auth-link">войти в систему</a></p>
          </div>
        )}

        <div className="reviews-section">
          <h2 className="reviews-section-title">
            Отзывы <span className="reviews-count">({reviews.length})</span>
          </h2>
          
          {loading && reviews.length === 0 ? (
            <div className="loading">Загрузка отзывов...</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              Пока нет отзывов. Будьте первым!
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-author-info">
                      <span className="review-author">{review.user_name}</span>
                      <span className="review-phone">{review.user_phone}</span>
                    </div>
                    <span className="review-date">
                      {review.formattedDate || new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="review-text-c">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;