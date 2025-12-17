import React, { useState, useEffect } from 'react';
import { applicationsService } from '../../services/applicationsService';
import { useNotifications } from '../../context/NotificationContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import { APPLICATION_STATUS } from '../../utils/constants';
import './operator-applications.css';

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { showNotification } = useNotifications();

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchTerm, statusFilter, sortBy]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const apps = await applicationsService.getAllApplications();
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      showNotification('Ошибка загрузки заявок', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortApplications = () => {
    let filtered = applications;

    // Фильтрация по поисковому запросу
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.clientName?.toLowerCase().includes(term) ||
        app.phone?.includes(term) ||
        app.product?.toLowerCase().includes(term) ||
        app.productType?.toLowerCase().includes(term)
      );
    }

    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Сортировка
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const handleMarkForDeletion = async (applicationId) => {
    setApplicationToDelete(applicationId);
    setShowDeleteConfirm(true);
  };

  const confirmMarkForDeletion = async () => {
    if (!applicationToDelete) return;

    try {
      await applicationsService.markForDeletion(applicationToDelete);
      showNotification('Заявка помечена на удаление', 'success');
      loadApplications(); // Перезагружаем список
    } catch (error) {
      console.error('Error marking for deletion:', error);
      showNotification('Ошибка при пометке на удаление', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setApplicationToDelete(null);
    }
  };

  const openDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const getStatusText = (status) => {
    const statusMap = {
      [APPLICATION_STATUS.PENDING]: 'Ожидает',
      [APPLICATION_STATUS.IN_PROGRESS]: 'В работе',
      [APPLICATION_STATUS.COMPLETED]: 'Завершена',
      [APPLICATION_STATUS.CANCELLED]: 'Отменена'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      [APPLICATION_STATUS.PENDING]: 'status-pending',
      [APPLICATION_STATUS.IN_PROGRESS]: 'status-in-progress',
      [APPLICATION_STATUS.COMPLETED]: 'status-completed',
      [APPLICATION_STATUS.CANCELLED]: 'status-cancelled'
    };
    return classMap[status] || 'status-pending';
  };

  const getApplicationsStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === APPLICATION_STATUS.PENDING).length;
    const inProgress = applications.filter(app => app.status === APPLICATION_STATUS.IN_PROGRESS).length;
    const completed = applications.filter(app => app.status === APPLICATION_STATUS.COMPLETED).length;
    const markedForDeletion = applications.filter(app => app.markedForDeletion).length;

    return { total, pending, inProgress, completed, markedForDeletion };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = getApplicationsStats();

  if (loading) {
    return (
      <div className="applications-loading">
        <LoadingSpinner text="Загрузка заявок..." />
      </div>
    );
  }

  return (
    <div className="operator-applications">
      <div className="applications-header">
        <div className="header-content">
          <h1>Управление заявками</h1>
          <p>Просмотр и управление всеми заявками клиентов</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={loadApplications}
            disabled={loading}
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="applications-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Всего заявок</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Ожидают</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <div className="stat-number">{stats.inProgress}</div>
            <div className="stat-label">В работе</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Завершены</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🗑️</div>
          <div className="stat-info">
            <div className="stat-number">{stats.markedForDeletion}</div>
            <div className="stat-label">На удаление</div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="applications-filters">
        <div className="search-box">
          <Input
            type="text"
            placeholder="Поиск по имени, телефону или товару..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <label>Статус:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value={APPLICATION_STATUS.PENDING}>Ожидают</option>
            <option value={APPLICATION_STATUS.IN_PROGRESS}>В работе</option>
            <option value={APPLICATION_STATUS.COMPLETED}>Завершены</option>
            <option value={APPLICATION_STATUS.CANCELLED}>Отменены</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Сортировка:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="name">По имени</option>
            <option value="status">По статусу</option>
          </select>
        </div>
      </div>

      {/* Список заявок */}
      <div className="applications-list">
        <div className="list-header">
          <div className="results-info">
            Найдено заявок: {filteredApplications.length}
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Заявки не найдены</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map((application) => (
              <div 
                key={application.id} 
                className={`application-card ${application.markedForDeletion ? 'marked-for-deletion' : ''}`}
              >
                <div className="card-header">
                  <div className="client-info">
                    <h3>{application.clientName}</h3>
                    <span className="client-phone">{application.phone}</span>
                  </div>
                  <div className="card-status">
                    <span className={`status-badge ${getStatusClass(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                    {application.markedForDeletion && (
                      <span className="deletion-badge">На удаление</span>
                    )}
                  </div>
                </div>

                <div className="card-content">
                  <div className="product-info">
                    <div className="product-type">{application.productType}</div>
                    <div className="product-name">{application.product}</div>
                  </div>

                  {application.material && (
                    <div className="detail-item">
                      <span className="label">Материал:</span>
                      <span className="value">{application.material}</span>
                    </div>
                  )}

                  {application.size && (
                    <div className="detail-item">
                      <span className="label">Размер:</span>
                      <span className="value">{application.size}</span>
                    </div>
                  )}

                  {application.clientComment && (
                    <div className="comment-preview">
                      <span className="label">Комментарий:</span>
                      <p className="value">{application.clientComment}</p>
                    </div>
                  )}

                  <div className="application-meta">
                    <span className="date">Создана: {formatDate(application.createdAt)}</span>
                    {application.workerResponses && application.workerResponses.length > 0 && (
                      <span className="responses-count">
                        Ответов: {application.workerResponses.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => openDetails(application)}
                  >
                    📋 Подробнее
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleMarkForDeletion(application.id)}
                    disabled={application.markedForDeletion}
                  >
                    {application.markedForDeletion ? '🗑️ На удалении' : '🗑️ Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно с деталями заявки */}
      {showDetailsModal && selectedApplication && (
        <Modal 
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Детали заявки"
          size="large"
        >
          <ApplicationDetails 
            application={selectedApplication}
            onClose={() => setShowDetailsModal(false)}
          />
        </Modal>
      )}

      {/* Подтверждение удаления */}
      {showDeleteConfirm && (
        <Modal 
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Подтверждение удаления"
        >
          <div className="delete-confirm">
            <div className="warning-icon">⚠️</div>
            <h3>Пометить заявку на удаление?</h3>
            <p>Эта операция помечает заявку для последующего удаления администратором. Вы уверены, что хотите продолжить?</p>
            <div className="confirm-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmMarkForDeletion}
              >
                Да, пометить на удаление
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Компонент для отображения деталей заявки
const ApplicationDetails = ({ application, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      [APPLICATION_STATUS.PENDING]: 'Ожидает обработки',
      [APPLICATION_STATUS.IN_PROGRESS]: 'В работе',
      [APPLICATION_STATUS.COMPLETED]: 'Завершена',
      [APPLICATION_STATUS.CANCELLED]: 'Отменена'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="application-details">
      <div className="details-sections">
        <section className="details-section">
          <h4>Информация о клиенте</h4>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Имя:</span>
              <span className="detail-value">{application.clientName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Телефон:</span>
              <span className="detail-value">{application.phone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Дата создания:</span>
              <span className="detail-value">{formatDate(application.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Статус:</span>
              <span className="detail-value status">{getStatusText(application.status)}</span>
            </div>
          </div>
        </section>

        <section className="details-section">
          <h4>Информация о заказе</h4>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Тип товара:</span>
              <span className="detail-value">{application.productType}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Товар:</span>
              <span className="detail-value">{application.product}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Материал:</span>
              <span className="detail-value">{application.material || 'Не указан'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Размер:</span>
              <span className="detail-value">{application.size || 'Не указан'}</span>
            </div>
          </div>
        </section>

        {application.clientComment && (
          <section className="details-section">
            <h4>Комментарий клиента</h4>
            <div className="comment-box">
              <p>{application.clientComment}</p>
            </div>
          </section>
        )}

        {application.workerResponses && application.workerResponses.length > 0 && (
          <section className="details-section">
            <h4>Ответы работников</h4>
            <div className="responses-list">
              {application.workerResponses.map((response, index) => (
                <div key={index} className="response-item">
                  <div className="response-header">
                    <span className="response-date">
                      {formatDate(response.createdAt)}
                    </span>
                  </div>
                  <div className="response-content">
                    <p>{response.response}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {application.markedForDeletion && (
          <section className="details-section warning">
            <h4>⚠️ Заявка помечена на удаление</h4>
            <p>Эта заявка будет удалена администратором в ближайшее время.</p>
          </section>
        )}
      </div>

      <div className="modal-actions">
        <button 
          className="btn btn-primary"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default ApplicationsList;