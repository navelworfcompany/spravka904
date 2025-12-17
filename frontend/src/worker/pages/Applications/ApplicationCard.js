import React, { useState } from 'react';
import { useWorker } from '../../hooks/useWorker';
import { useNotifications } from '../../../context/NotificationContext';
import Button from '../../../components/common/Button';
import './ApplicationCard.css';

const ApplicationCard = ({ 
  application, 
  onUpdate, 
  workerId, 
  workerHasResponded,
  onResponseSent 
}) => {
  const { respondToApplication } = useWorker();
  const { showNotification } = useNotifications();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    response: '',
    price: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);

  // Определяем, можно ли отвечать на заявку
  const canRespondToApplication = () => {
    // Если уже отвечал - нельзя отвечать
    if (workerHasResponded) return false;
    
    // Можно отвечать только на новые заявки или заявки в статусе pending
    return application.status === 'new' || application.status === 'pending';
  };

  const handleRespond = async () => {
    if (!responseData.response.trim()) {
      showNotification('Введите текст ответа', 'error');
      return;
    }

    if (!responseData.price || responseData.price <= 0) {
      showNotification('Укажите корректную цену', 'error');
      return;
    }

    if (!responseData.deadline) {
      showNotification('Укажите срок выполнения', 'error');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const selectedDate = new Date(responseData.deadline);
    if (selectedDate < tomorrow) {
      showNotification('Срок выполнения должен быть не раньше завтра', 'error');
      return;
    }

    setLoading(true);
    try {
      await respondToApplication(application.id, {
        response: responseData.response.trim(),
        price: parseFloat(responseData.price),
        deadline: responseData.deadline,
        status: 'pending'
      });

      showNotification('Ответ отправлен успешно', 'success');
      setShowResponseForm(false);
      setResponseData({ response: '', price: '', deadline: '' });
      
      // Обновляем данные и уведомляем родительский компонент
      onUpdate();
      if (onResponseSent) {
        onResponseSent();
      }
      
    } catch (error) {
      showNotification('Ошибка при отправке ответа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setResponseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: 'Новая', class: 'status-app-work-new' },
      pending: { label: 'Принята', class: 'status-app-work-pending' },
      in_progress: { label: 'В работе', class: 'status-app-work-in-progress' },
      assigned: { label: 'Исполняется', class: 'status-app-work-assigned' },
      completed: { label: 'Завершена', class: 'status-app-work-completed' },
      cancelled: { label: 'Отменена', class: 'status-app-work-cancelled' }
    };

    const config = statusConfig[status] || { label: status, class: 'status-app-work-default' };
    return <span className={`status-app-work-badge ${config.class}`}>{config.label}</span>;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const canRespond = canRespondToApplication();

  return (
    <div className="application-app-work-card">
      <div className="application-app-work-header">
        <div className="application-app-work-meta">
          <div className="application-app-work-title-row">
            <h3 className="application-app-work-title">Заявка #{application.id}</h3>
            {getStatusBadge(application.status)}
          </div>
        </div>
        <div className="application-app-work-date">
          {new Date(application.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>

      <div className="application-app-work-details">
        <div className="detail-app-work-item">
          <strong>Памятник:</strong> {application.product_name || application.product}
        </div>
        {application.product_type_name && (
          <div className="detail-app-work-item">
            <strong>Тип:</strong> {application.product_type_name}
          </div>
        )}
        {application.material && (
          <div className="detail-app-work-item">
            <strong>Материал:</strong> {application.material}
          </div>
        )}
        {application.size && (
          <div className="detail-app-work-item">
            <strong>Размер:</strong> {application.size}
          </div>
        )}
      </div>

      {application.description && (
        <div className="application-app-work-comment">
          <strong>Описание:</strong>
          <p>{application.description}</p>
        </div>
      )}

      {application.worker_response && (
        <div className="application-app-work-response">
          <div className="response-app-work-header">
            <strong>Ответ:</strong>
            {application.response_created_at && (
              <span className="response-app-work-date">
                {new Date(application.response_created_at).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
          <p className="response-app-work-text">{application.worker_response}</p>

          <div className="response-app-work-details">
            {application.worker_price && (
              <div className="response-app-work-price">
                <strong>Цена:</strong> {formatPrice(application.worker_price)}
              </div>
            )}
            {application.worker_deadline && (
              <div className="response-app-work-deadline">
                <strong>Срок выполнения:</strong> {formatDate(application.worker_deadline)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="application-app-work-actions">
        {/* Если работник уже отвечал на заявку - показываем "Отвечено" */}
        {workerHasResponded && (
          <div className="application-status-info">
            <span className="status-badge responded">Вы уже ответили на эту заявку</span>
          </div>
        )}

        {/* Кнопка "Ответить" показывается только если можно отвечать и форма не открыта */}
        {canRespond && !showResponseForm && (
          <Button
            onClick={() => setShowResponseForm(true)}
            className="respond-app-work-button"
          >
            📝 Ответить на заявку
          </Button>
        )}

        {showResponseForm && (
          <div className="response-app-work-form">
            <h4>Ваш ответ клиенту</h4>

            <div className="form-app-work-group">
              <label>Текст ответа *</label>
              <textarea
                value={responseData.response}
                onChange={(e) => handleInputChange('response', e.target.value)}
                placeholder="Опишите ваш подход к работе, используемые материалы, особенности выполнения..."
                rows="4"
              />
            </div>

            <div className="form-app-work-row">
              <div className="form-app-work-group">
                <label>Цена (руб) *</label>
                <input
                  type="number"
                  value={responseData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="5000"
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="form-app-work-group">
                <label>Срок выполнения *</label>
                <input
                  type="date"
                  value={responseData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  min={getMinDate()}
                />
              </div>
            </div>

            <div className="response-app-work-actions">
              <Button
                onClick={handleRespond}
                loading={loading}
                disabled={!responseData.response.trim() || !responseData.price || !responseData.deadline}
              >
                Ответить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResponseForm(false);
                  setResponseData({ response: '', price: '', deadline: '' });
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Кнопка "Завершить заявку" */}
        {application.status === 'in_progress' && application.worker_id === workerId && (
          <div className="in-progress-app-work-actions">
            <Button variant="success">
              ✅ Завершить заявку
            </Button>
          </div>
        )}

        {/* Информационное сообщение для заявок, на которые нельзя отвечать */}
        {!canRespond && !workerHasResponded && !showResponseForm && (
          <div className="application-status-info">
            <span className="status-badge not-available">
              На эту заявку нельзя ответить
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;