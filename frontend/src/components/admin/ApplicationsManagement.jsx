import React, { useState, useEffect, useCallback } from 'react';
import { applicationsService } from '../../services/applicationsService';
import { useNotifications } from '../../context/NotificationContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { APPLICATION_STATUS, LOCALIZATION } from '../../utils/constants';
import './ApplicationsManagement.css';

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
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
    let filtered = [...applications];

    // Поиск
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.clientName?.toLowerCase().includes(term) ||
        app.phone?.includes(term) ||
        app.product?.toLowerCase().includes(term) ||
        app.productType?.toLowerCase().includes(term) ||
        app.id?.toString().includes(term)
      );
    }

    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Сортировка
    filtered.sort((a, b) => {
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

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleEdit = (application) => {
    setEditingApplication({ ...application });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingApplication) return;

    try {
      await applicationsService.updateApplication(editingApplication.id, editingApplication);
      showNotification('Заявка успешно обновлена', 'success');
      setShowEditModal(false);
      setEditingApplication(null);
      loadApplications();
    } catch (error) {
      showNotification('Ошибка обновления заявки', 'error');
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
      return;
    }

    try {
      await applicationsService.deleteApplication(applicationId);
      showNotification('Заявка успешно удалена', 'success');
      loadApplications();
    } catch (error) {
      showNotification('Ошибка удаления заявки', 'error');
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await applicationsService.updateApplicationStatus(applicationId, newStatus);
      showNotification('Статус заявки обновлен', 'success');
      loadApplications();
    } catch (error) {
      showNotification('Ошибка изменения статуса', 'error');
    }
  };

  const getStatusText = (status) => {
    return LOCALIZATION.RU.STATUSES[status] || status;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getApplicationsStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === APPLICATION_STATUS.PENDING).length;
    const inProgress = applications.filter(app => app.status === APPLICATION_STATUS.IN_PROGRESS).length;
    const completed = applications.filter(app => app.status === APPLICATION_STATUS.COMPLETED).length;
    const cancelled = applications.filter(app => app.status === APPLICATION_STATUS.CANCELLED).length;

    return { total, pending, inProgress, completed, cancelled };
  };

  const stats = getApplicationsStats();

  if (loading) {
    return (
      <div className="applications-management">
        <div className="loading-container">
          <LoadingSpinner text="Загрузка заявок..." />
        </div>
      </div>
    );
  }

  return (
    <div className="applications-management">
      <div className="management-header">
        <h1>Управление заявками</h1>
        <p>Просмотр и управление всеми заявками системы</p>
      </div>

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Всего заявок</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Ожидают</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-number">{stats.inProgress}</div>
            <div className="stat-label">В работе</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Завершены</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.cancelled}</div>
            <div className="stat-label">Отменены</div>
          </div>
        </div>
      </div>

      {/* Фильтры и управление */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <Input
              type="text"
              placeholder="Поиск по имени, телефону, товару..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon="🔍"
            />
          </div>

          <div className="filter-controls">
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

            <Button
              variant="outline"
              onClick={loadApplications}
              icon="🔄"
            >
              Обновить
            </Button>
          </div>
        </div>
      </div>

      {/* Список заявок */}
      <div className="applications-section">
        <div className="section-header">
          <h3>Список заявок</h3>
          <span className="results-count">
            Найдено: {filteredApplications.length}
          </span>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h4>Заявки не найдены</h4>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <div className="applications-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">ID</div>
                <div className="table-cell">Клиент</div>
                <div className="table-cell">Телефон</div>
                <div className="table-cell">Товар</div>
                <div className="table-cell">Статус</div>
                <div className="table-cell">Дата</div>
                <div className="table-cell actions">Действия</div>
              </div>
            </div>

            <div className="table-body">
              {filteredApplications.map((application) => (
                <div key={application.id} className="table-row">
                  <div className="table-cell">
                    <span className="application-id">#{application.id}</span>
                  </div>
                  <div className="table-cell">
                    <div className="client-info">
                      <div className="client-name">{application.clientName}</div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="phone-number">{application.phone}</span>
                  </div>
                  <div className="table-cell">
                    <div className="product-info">
                      <div className="product-type">{application.productType}</div>
                      <div className="product-name">{application.product}</div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${getStatusClass(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className="application-date">
                      {formatDate(application.createdAt)}
                    </span>
                  </div>
                  <div className="table-cell actions">
                    <div className="action-buttons">
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => handleViewDetails(application)}
                        icon="👁️"
                      >
                        Просмотр
                      </Button>
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() => handleEdit(application)}
                        icon="✏️"
                      >
                        Редакт.
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(application.id)}
                        icon="🗑️"
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно деталей заявки */}
      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setShowDetailsModal(false)}
          onStatusChange={handleStatusChange}
          isOpen={showDetailsModal} // Добавьте этот пропс
        />
      )}

      {/* Модальное окно редактирования заявки */}
      {showEditModal && editingApplication && (
        <EditApplicationModal
          application={editingApplication}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
          onChange={setEditingApplication}
        />
      )}
    </div>
  );
};

// Компонент модального окна с деталями заявки
// Компонент модального окна с деталями заявки
// Компонент модального окна с деталями заявки
// Компонент модального окна с деталями заявки
// Компонент модального окна с деталями заявки
const ApplicationDetailsModal = ({ application, onClose, onStatusChange, isOpen }) => {
  console.log('🆕 НОВАЯ ВЕРСИЯ МОДАЛЬНОГО ОКНА ЗАГРУЖЕНА - ' + Date.now());

  const [workerResponses, setWorkerResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const { showNotification } = useNotifications();
  

  // Функция для глубокого поиска ответов в объекте заявки
  const findResponsesInApplication = (app) => {
    console.log('🔍 Ищем ответы в объекте заявки:', app);
    
    // Проверяем все возможные поля, где могут быть ответы
    const possibleFields = [
      'responses',
      'workerResponses',
      'worker_responses', 
      'answers',
      'worker_answers',
      'replies'
    ];

    for (const field of possibleFields) {
      if (app[field] && Array.isArray(app[field])) {
        console.log(`✅ Найдены ответы в поле "${field}":`, app[field]);
        return app[field];
      }
    }

    // Ищем вложенные объекты
    if (app.data && typeof app.data === 'object') {
      for (const field of possibleFields) {
        if (app.data[field] && Array.isArray(app.data[field])) {
          console.log(`✅ Найдены ответы в app.data."${field}":`, app.data[field]);
          return app.data[field];
        }
      }
    }

    // Ищем любые массивы в объекте, которые могут быть ответами
    const allArrays = [];
    const findArrays = (obj, path = '') => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const currentPath = path ? `${path}.${key}` : key;
          
          if (Array.isArray(value)) {
            console.log(`📁 Найден массив по пути "${currentPath}":`, value);
            allArrays.push({ path: currentPath, data: value });
          } else if (value && typeof value === 'object') {
            findArrays(value, currentPath);
          }
        });
      }
    };

    findArrays(app);
    
    // Фильтруем массивы, которые могут быть ответами (содержат поля response, price, deadline)
    const possibleResponseArrays = allArrays.filter(({ data }) => {
      return data.some(item => 
        item && typeof item === 'object' && (
          item.response !== undefined ||
          item.price !== undefined ||
          item.deadline !== undefined ||
          item.worker_id !== undefined
        )
      );
    });

    if (possibleResponseArrays.length > 0) {
      console.log('🎯 Возможные массивы с ответами:', possibleResponseArrays);
      return possibleResponseArrays[0].data;
    }

    console.log('❌ Ответы не найдены в объекте заявки');
    return [];
  };

  useEffect(() => {
    if (application && isOpen) {
      console.log('🚀 Модальное окно открыто! Проверяем заявку:', application);
      
      // Сначала ищем ответы в уже загруженных данных
      const responses = findResponsesInApplication(application);
      
      if (responses.length > 0) {
        console.log('✅ Используем ответы из загруженных данных');
        setWorkerResponses(responses);
      } else {
        // Если ответов нет, пробуем загрузить отдельно
        console.log('🔄 Ответов нет в данных, пробуем загрузить через API');
        loadWorkerResponsesFromAPI();
      }
    }
  }, [application, isOpen]);

  const loadWorkerResponsesFromAPI = async () => {
    try {
      setLoadingResponses(true);
      console.log('📡 Загружаем ответы через API для заявки:', application.id);
      
      const applicationWithResponses = await applicationsService.getApplicationById(application.id);
      console.log('📦 Данные от API:', applicationWithResponses);
      
      // Снова ищем ответы в полученных данных
      const responses = findResponsesInApplication(applicationWithResponses);
      setWorkerResponses(responses);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки через API:', error);
      showNotification('Ошибка загрузки ответов работников', 'error');
    } finally {
      setLoadingResponses(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Неверный формат даты';
    }
  };

  const getStatusText = (status) => {
    return LOCALIZATION.RU.STATUSES[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'new': 'status-pending',
      'in_progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || 'status-pending';
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Не указан';
    return formatDate(deadline);
  };

  return (
    <Modal
    
      isOpen={isOpen}
      onClose={onClose}
      title={`Заявка #${application.id} - Детали 🎉`}
      size="large"
    >
      <div className="application-details-modal">
        {/* Отладочная информация */}
        <div className="debug-info" style={{background: '#fff3cd', border: '1px solid #ffeaa7', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
          <h4 style={{margin: '0 0 10px 0', color: '#856404'}}>🔍 Режим отладки</h4>
          <div style={{fontSize: '14px', lineHeight: '1.4'}}>
            <p><strong>ID заявки:</strong> {application.id}</p>
            <p><strong>Статус:</strong> {loadingResponses ? '🔄 Загрузка...' : '✅ Завершено'}</p>
            <p><strong>Найдено ответов:</strong> {workerResponses.length}</p>
            <p><strong>Статус заявки:</strong> {application.status}</p>
            <button 
              onClick={() => {
                console.log('📊 Полный объект заявки:', application);
                console.log('📊 Ответы:', workerResponses);
              }}
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '5px'
              }}
            >
              Вывести в консоль
            </button>
          </div>
        </div>

        <div className="details-sections">
          {/* Информация о клиенте */}
          <div className="details-section">
            <h4>Информация о клиенте</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Имя:</span>
                <span className="detail-value">{application.name || application.clientName || 'Не указано'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Телефон:</span>
                <span className="detail-value">{application.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Дата создания:</span>
                <span className="detail-value">{formatDate(application.created_at || application.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Информация о заказе */}
          <div className="details-section">
            <h4>Информация о заказе</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Тип товара:</span>
                <span className="detail-value">{application.product_type || application.productType || 'Не указан'}</span>
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
          </div>

          {/* Комментарий клиента */}
          {(application.comment || application.clientComment) && (
            <div className="details-section">
              <h4>Комментарий клиента</h4>
              <div className="comment-box">
                <p>{application.comment || application.clientComment}</p>
              </div>
            </div>
          )}

          {/* Блок ответов работников */}
          <div className="details-section">
            <div className="section-header-with-count">
              <h4>Ответы работников</h4>
              {!loadingResponses && (
                <span className="responses-count">
                  {workerResponses.length} ответов
                </span>
              )}
            </div>
            
            {loadingResponses ? (
              <div className="loading-responses">
                <LoadingSpinner text="Загрузка ответов работников..." />
              </div>
            ) : workerResponses.length > 0 ? (
              <div className="responses-list">
                {workerResponses.map((response, index) => (
                  <div key={response.id || index} className="response-item">
                    <div className="response-header">
                      <div className="response-worker-info">
                        <span className="response-worker-name">
                          {response.worker_name || response.workerName || `Работник ${index + 1}`}
                        </span>
                        {response.organization && (
                          <span className="response-organization">
                            {response.organization}
                          </span>
                        )}
                      </div>
                      <span className="response-date">
                        {formatDate(response.created_at || response.createdAt)}
                      </span>
                    </div>
                    
                    <div className="response-content">
                      {/* Текст ответа */}
                      {(response.response || response.message) && (
                        <div className="response-text-section">
                          <h5>Текст ответа:</h5>
                          <div className="response-text">
                            {response.response || response.message}
                          </div>
                        </div>
                      )}
                      
                      {/* Детали предложения */}
                      <div className="response-details">
                        {(response.price || response.price === 0) && (
                          <div className="response-detail price-detail">
                            <span className="detail-label">Предложенная цена:</span>
                            <span className="detail-value price-value">
                              {formatPrice(response.price)}
                            </span>
                          </div>
                        )}
                        
                        {response.deadline && (
                          <div className="response-detail deadline-detail">
                            <span className="detail-label">Срок выполнения:</span>
                            <span className="detail-value deadline-value">
                              {formatDeadline(response.deadline)}
                            </span>
                          </div>
                        )}
                        
                        {response.worker_id && (
                          <div className="response-detail worker-id-detail">
                            <span className="detail-label">ID работника:</span>
                            <span className="detail-value worker-id-value">
                              {response.worker_id}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Отладочная информация для каждого ответа */}
                      <div className="debug-response-info">
                        <details>
                          <summary>📊 Отладочная информация ответа</summary>
                          <pre style={{fontSize: '12px', background: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-responses">
                <div className="no-responses-icon">💬</div>
                <p>На эту заявку пока нет ответов от работников</p>
                <p className="no-responses-subtitle">
                  Работники могут оставлять ответы через интерфейс исполнителя
                </p>
              </div>
            )}
          </div>

          {/* Системная информация */}
          <div className="details-section system-info">
            <h4>Системная информация</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Создана:</span>
                <span className="detail-value">{formatDate(application.created_at || application.createdAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Обновлена:</span>
                <span className="detail-value">{formatDate(application.updated_at || application.updatedAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ответов:</span>
                <span className="detail-value">{workerResponses.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Статус:</span>
                <span className="detail-value">
                  <span className={`status-badge ${getStatusClass(application.status)}`}>
                    {getStatusText(application.status)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Управление статусом */}
          <div className="details-section">
            <h4>Управление статусом</h4>
            <div className="status-controls">
              <select
                value={application.status}
                onChange={(e) => onStatusChange(application.id, e.target.value)}
                className="status-select"
              >
                <option value="new">Новая</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершена</option>
                <option value="cancelled">Отменена</option>
              </select>
              <span className="current-status">
                Текущий статус: <strong>{getStatusText(application.status)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose} variant="primary">
            Закрыть
          </Button>
          <Button 
            onClick={loadWorkerResponsesFromAPI} 
            variant="outline"
            icon="🔄"
            disabled={loadingResponses}
          >
            {loadingResponses ? 'Загрузка...' : 'Обновить ответы'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Компонент модального окна редактирования заявки
const EditApplicationModal = ({ application, onClose, onSave, onChange }) => {
  const handleFieldChange = (field, value) => {
    onChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Редактирование заявки #${application.id}`}
      size="medium"
    >
      <div className="edit-application-modal">
        <div className="form-sections">
          <div className="form-section">
            <h4>Данные клиента</h4>
            <Input
              label="Имя клиента"
              value={application.clientName}
              onChange={(value) => handleFieldChange('clientName', value)}
              required
            />
            <Input
              label="Телефон"
              value={application.phone}
              onChange={(value) => handleFieldChange('phone', value)}
              required
            />
          </div>

          <div className="form-section">
            <h4>Информация о заказе</h4>
            <Input
              label="Тип товара"
              value={application.productType}
              onChange={(value) => handleFieldChange('productType', value)}
              required
            />
            <Input
              label="Товар"
              value={application.product}
              onChange={(value) => handleFieldChange('product', value)}
              required
            />
            <Input
              label="Материал"
              value={application.material || ''}
              onChange={(value) => handleFieldChange('material', value)}
              placeholder="Не указан"
            />
            <Input
              label="Размер"
              value={application.size || ''}
              onChange={(value) => handleFieldChange('size', value)}
              placeholder="Не указан"
            />
          </div>

          <div className="form-section">
            <Input
              label="Комментарий клиента"
              value={application.clientComment || ''}
              onChange={(value) => handleFieldChange('clientComment', value)}
              multiline
              rows={4}
              placeholder="Комментарий отсутствует"
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose} variant="outline">
            Отмена
          </Button>
          <Button onClick={onSave} variant="primary">
            Сохранить изменения
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplicationsManagement;