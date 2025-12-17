import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { applicationsService } from '../../services/applicationsService';
import Header from './Header';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import defaultProductImage from '../../img/default-product.png';
import './user-applications.css';

const UserApplications = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmingExecutor, setConfirmingExecutor] = useState(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [assigningWorker, setAssigningWorker] = useState(null);

  const loadUserApplications = useCallback(async () => {
    try {
      setLoading(true);
      const userApplications = await applicationsService.getMyApplications();

      if (userApplications && userApplications.length > 0) {
        const formattedApplications = userApplications.map(app => {
          const formattedApp = {
            id: app.id,
            clientName: app.name,
            name: app.name,
            phone: app.phone,
            email: app.email,
            productType: app.product_type || app.productType,
            product: app.product,
            productImage: app.product_image || null,
            product_id: app.product_id,
            product_type_id: app.product_type_id,
            material: app.material,
            size: app.size,
            comment: app.comment,
            clientComment: app.comment,
            status: app.status,
            createdAt: app.created_at || app.createdAt,
            updatedAt: app.updated_at || app.updatedAt,
            workerResponses: app.responses || app.workerResponses || [],
            response_count: app.response_count || (app.responses ? app.responses.length : 0),
            selected_worker_id: app.selected_worker_id,
            selected_worker_name: app.selected_worker_name,
            selected_price: app.selected_price,
            selected_deadline: app.selected_deadline,
            worker_id: app.worker_id,
            worker_name: app.worker_name,
            responded_at: app.responded_at
          };

          return formattedApp;
        });

        setApplications(formattedApplications);
        showNotification(`Загружено ${formattedApplications.length} заявок`, 'success');
      } else {
        setApplications([]);
      }

    } catch (error) {
      showNotification(error.message || 'Ошибка загрузки заявок', 'error');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (user?.phone) {
      loadUserApplications();
    }
  }, [user, loadUserApplications]);

  const handleApplicationClick = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const getProductImageUrl = (productImage, productId) => {
    if (!productImage) return defaultProductImage;

    let cleanPath = productImage;
    if (productImage.includes('/uploads/products/')) {
      cleanPath = productImage.replace('/uploads/products/', '/img/products/');
    } else if (productImage.includes('/uploads/')) {
      cleanPath = productImage.replace('/uploads/', '/img/');
    }

    if (cleanPath.startsWith('http')) return cleanPath;

    if (cleanPath.startsWith('/')) {
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : window.location.origin;
      return `${baseUrl}${cleanPath}`;
    }

    return defaultProductImage;
  };

  const handleImageError = (applicationId) => {
    setImageErrors(prev => ({ ...prev, [applicationId]: true }));
  };

  const handleChooseExecutor = (response) => {
    if (!selectedApplication) return;

    setConfirmingExecutor({
      workerResponseId: response.id,
      workerId: response.worker_id || response.id,
      workerName: response.worker_name || response.workerName || 'Работник',
      price: response.price,
      deadline: response.deadline,
      applicationId: selectedApplication.id,
      applicationNumber: selectedApplication.id
    });
  };

  const assignWorker = async (workerResponseId) => {
    if (!selectedApplication) return;

    try {
      setAssigningWorker(workerResponseId);

      const response = await selectWorkerForApplication(
        selectedApplication.id,
        workerResponseId
      );

      if (response.success) {
        setShowDetailsModal(false);
        setConfirmingExecutor(null);

        showNotification(`Вы успешно выбрали исполнителя!`, 'success');

        await new Promise(resolve => setTimeout(resolve, 500));

        await loadUserApplications();

        setSelectedApplication(null);

      } else {
        throw new Error(response.error || 'Ошибка при назначении исполнителя');
      }

    } catch (error) {
      showNotification(`Ошибка: ${error.message}`, 'error');
      setAssigningWorker(null);
    }
  };

  const selectWorkerForApplication = async (applicationId, workerResponseId) => {
    try {

      const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : '';

      const token = localStorage.getItem('token');

      const url = `${API_BASE}/api/applications/${applicationId}/select-worker`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ workerResponseId })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер вернул неверный формат ответа');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`);
      }

      return data;

    } catch (error) {
      throw error;
    }
  };

  const confirmExecutorChoice = async () => {
    if (!confirmingExecutor) return;

    try {
      await assignWorker(confirmingExecutor.workerResponseId);

    } catch (error) {
      showNotification(error.message || 'Ошибка при выборе исполнителя', 'error');
    }
  };

  // Функция для отмены заявки
  const cancelApplication = async () => {
    if (!selectedApplication) return;

    try {
      setCancelling(true);

      const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : '';

      const token = localStorage.getItem('token');

      // 🔥 ИСПРАВЛЕННЫЙ URL - добавляем /cancel
      const url = `${API_BASE}/api/applications/${selectedApplication.id}/cancel`;

      console.log('🔄 Отправка запроса на отмену заявки:', url);

      const response = await fetch(url, {
        method: 'PUT', // Метод PUT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
        // Не нужно отправлять тело запроса, так как статус устанавливается на сервере
      });

      console.log('📊 Ответ сервера:', response.status);

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
          console.error('❌ Ошибка от сервера:', data);
          throw new Error(data.error || data.message || `Ошибка ${response.status}`);
        }

        showNotification(data.message || 'Заявка успешно отменена', 'success');

      } else {
        const text = await response.text();
        console.error('❌ Сервер вернул не JSON:', text);
        throw new Error(`Сервер вернул неожиданный формат: ${response.status}`);
      }

      // Закрываем модальные окна
      setShowDetailsModal(false);
      setConfirmingCancel(false);

      // Перезагружаем список заявок
      await loadUserApplications();

    } catch (error) {
      console.error('❌ Ошибка при отмене заявки:', error);
      showNotification(`Ошибка при отмене заявки: ${error.message}`, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Дата не указана';
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Не указан';
    return formatDate(deadline);
  };

  const getStatusText = (status) => {
    const statusMap = {
      new: 'Новая',
      pending: 'Ожидает обработки',
      in_progress: 'В работе',
      assigned: 'Исполнитель назначен',
      completed: 'Завершена',
      cancelled: 'Отменена'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      new: 'status-new-c',
      pending: 'status-pending-c',
      in_progress: 'status-in-progress-c',
      assigned: 'status-assigned-c',
      completed: 'status-completed-c',
      cancelled: 'status-cancelled-c'
    };
    return classMap[status] || 'status-pending-c';
  };

  const canChooseExecutor = (application) => {

    const allowedStatuses = ['new', 'pending', 'in_progress'];
    const hasNoWorker = !application.worker_id && !application.selected_worker_id;

    const canChoose = allowedStatuses.includes(application.status) &&
      application.workerResponses &&
      application.workerResponses.length > 0 &&
      hasNoWorker;

    return canChoose;
  };

  // Функция проверки возможности отмены заявки
  const canCancelApplication = (application) => {
    // Заявку можно отменить, если она еще не завершена и не отменена
    const cancelableStatuses = ['new', 'pending', 'in_progress', 'assigned'];
    return cancelableStatuses.includes(application.status);
  };

  const isResponseChosen = (response, application) => {
    const isChosen = application.selected_worker_id === (response.worker_id || response.id) ||
      application.worker_id === (response.worker_id || response.id);
    return isChosen;
  };

  const closeAllModals = () => {
    setShowDetailsModal(false);
    setSelectedApplication(null);
    setConfirmingExecutor(null);
    setConfirmingCancel(false);
  };

  if (loading) {
    return (
      <div className="user-applications-page-c">
        <Header />
        <div className="loading-container-c">
          <LoadingSpinner text="Загрузка ваших заявок..." />
        </div>
      </div>
    );
  }

  return (
    <div className="user-applications-page-c">
      <Header />

      <main className="user-applications-main-c">
        <div className="container-c">
          <div className="page-header-c">
            <h1>Мои заявки</h1>
            <p>История всех ваших заказов и их текущий статус</p>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state-c">
              <div className="empty-icon-c">📋</div>
              <h3>У вас пока нет заявок</h3>
              <p>Создайте свою первую заявку, выбрав товар в каталоге</p>
              <button
                className="btn btn-primary-c"
                onClick={() => window.location.href = '/'}
              >
                Перейти к выбору памятника
              </button>
            </div>
          ) : (
            <div className="applications-container-c">
              <div className="applications-stats-c">
                <div className="stat-card-c">
                  <span className="stat-label-c">Всего заявок</span>
                  <span className="stat-number-c">{applications.length}</span>
                </div>
                <div className="stat-card-c">
                  <span className="stat-label-c">Завершено</span>
                  <span className="stat-number-c">
                    {applications.filter(app => app.status === 'completed').length}
                  </span>
                </div>
                <div className="stat-card-c">
                  <span className="stat-label-c">В работе</span>
                  <span className="stat-number-c">
                    {applications.filter(app => app.status === 'in_progress' || app.status === 'assigned').length}
                  </span>
                </div>
                <div className="stat-card-c">
                  <span className="stat-label-c">Ожидают</span>
                  <span className="stat-number-c">
                    {applications.filter(app => app.status === 'new' || app.status === 'pending').length}
                  </span>
                </div>
              </div>

              <div className="applications-list-c">
                {applications.map((application) => {
                  const imageUrl = getProductImageUrl(application.productImage, application.product_id);
                  const showImage = !imageErrors[application.id];
                  const canChoose = canChooseExecutor(application);
                  const canCancel = canCancelApplication(application);

                  return (
                    <div
                      key={application.id}
                      className="application-card-c"
                      onClick={() => handleApplicationClick(application)}
                    >
                      <div className="application-card-content-c">
                        {showImage && (
                          <div className="application-image-container-c">
                            <img
                              src={imageUrl}
                              alt={application.product}
                              className="application-image-c"
                              onError={() => handleImageError(application.id)}
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="application-info-c">
                          <div className="application-header-c">
                            <div className="application-title-section-c">
                              <h3 className="application-title-c">{application.product}</h3>
                              <span className={`status-badge-c ${getStatusClass(application.status)}`}>
                                {getStatusText(application.status)}
                              </span>
                            </div>
                            <span className="application-date-c">
                              {formatDate(application.createdAt)}
                            </span>
                          </div>

                          <div className="application-preview-c">
                            <div className="preview-row-c">
                              <span className="label-c">Тип:</span>
                              <span className="value-c">{application.productType}</span>
                            </div>
                            <div className="preview-row-c">
                              <span className="label-c">Материал:</span>
                              <span className="value-c">{application.material || 'Не указан'}</span>
                            </div>
                            <div className="preview-row-c">
                              <span className="label-c">Размер:</span>
                              <span className="value-c">{application.size || 'Не указан'}</span>
                            </div>
                          </div>

                          {application.response_count > 0 && (
                            <div className="responses-preview-c">
                              <span className="responses-count-c">
                                <span className="responses-icon-c">💬</span>
                                Ответов: {application.response_count}
                                {canChoose && (
                                  <span className="choose-executor-badge-c">
                                    Выберите исполнителя
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {(application.selected_worker_name || application.worker_name) && (
                            <div className="selected-executor-preview-c">
                              <span className="selected-label-c">Исполнитель:</span>
                              <span className="selected-name-c">
                                {application.selected_worker_name || application.worker_name}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="application-arrow-c">
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {showDetailsModal && selectedApplication && (
        <div className="ua-modal-overlay-c" onClick={closeAllModals}>
          <div className="ua-modal-c ua-modal-large-c" onClick={(e) => e.stopPropagation()}>
            <div className="ua-modal-header-c">
              <h3 className="ua-modal-title-c">Заявка #{selectedApplication.id}</h3>
              <button
                className="ua-modal-close-c"
                onClick={closeAllModals}
                aria-label="Закрыть"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ua-modal-content-c">
              <div className="application-details-c">
                <div className="details-header-c">
                  <div className="product-image-section-c">
                    <img
                      src={getProductImageUrl(selectedApplication.productImage, selectedApplication.product_id)}
                      alt={selectedApplication.product}
                      className="product-detail-image-c"
                      onError={(e) => {
                        e.target.src = defaultProductImage;
                      }}
                    />
                  </div>
                  <div className="product-info-section-c">
                    <h3 className="product-title-c">{selectedApplication.product}</h3>
                    <div className="product-meta-c">
                      <span className="product-type-c">{selectedApplication.productType}</span>
                      {selectedApplication.material && (
                        <span className="product-material-c">Материал: {selectedApplication.material}</span>
                      )}
                      {selectedApplication.size && (
                        <span className="product-size-c">Размер: {selectedApplication.size}</span>
                      )}
                    </div>
                    <div className="application-status-section-c">
                      <span className={`status-badge-c status-badge-large-c ${getStatusClass(selectedApplication.status)}`}>
                        {getStatusText(selectedApplication.status)}
                      </span>
                      <span className="creation-date-c">Создана: {formatDate(selectedApplication.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="details-sections-c">
                  <div className="details-section-c">
                    <h4>Данные клиента</h4>
                    <div className="details-grid-c">
                      <div className="detail-item-c">
                        <span className="detail-label-c">Имя:</span>
                        <span className="detail-value-c">{selectedApplication.clientName || selectedApplication.name}</span>
                      </div>
                      <div className="detail-item-c">
                        <span className="detail-label-c">Телефон:</span>
                        <span className="detail-value-c">{selectedApplication.phone}</span>
                      </div>
                      {selectedApplication.email && (
                        <div className="detail-item-c">
                          <span className="detail-label-c">Email:</span>
                          <span className="detail-value-c">{selectedApplication.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedApplication.comment && (
                    <div className="details-section-c">
                      <h4>Ваш комментарий</h4>
                      <div className="comment-box-c">
                        <p>{selectedApplication.comment}</p>
                      </div>
                    </div>
                  )}

                  {(selectedApplication.selected_worker_name || selectedApplication.worker_name) && (
                    <div className="details-section-c selected-executor-section-c">
                      <h4>Выбранный исполнитель</h4>
                      <div className="executor-info-c">
                        <div className="executor-detail-c">
                          <span className="executor-label-c">Исполнитель:</span>
                          <span className="executor-value-c">
                            {selectedApplication.selected_worker_name || selectedApplication.worker_name}
                          </span>
                        </div>
                        {selectedApplication.selected_price && (
                          <div className="executor-detail-c">
                            <span className="executor-label-c">Согласованная цена:</span>
                            <span className="executor-value-c executor-value-price-c">
                              {formatPrice(selectedApplication.selected_price)}
                            </span>
                          </div>
                        )}
                        {selectedApplication.selected_deadline && (
                          <div className="executor-detail-c">
                            <span className="executor-label-c">Срок выполнения:</span>
                            <span className="executor-value-c executor-value-deadline-c">
                              {formatDeadline(selectedApplication.selected_deadline)}
                            </span>
                          </div>
                        )}
                        {selectedApplication.responded_at && (
                          <div className="executor-detail-c">
                            <span className="executor-label-c">Назначен:</span>
                            <span className="executor-value-c">
                              {formatDate(selectedApplication.responded_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedApplication.workerResponses && selectedApplication.workerResponses.length > 0 && (
                    <div className="details-section-c">
                      <div className="responses-header-c">
                        <h4>Ответы работников</h4>
                        {(() => {
                          const canChoose = canChooseExecutor(selectedApplication);

                          if (canChoose) {
                            return (
                              <div className="choose-executor-hint-c">
                                <span className="hint-icon-c">⭐</span>
                                Выберите исполнителя для своей заявки
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="responses-list-c">
                        {selectedApplication.workerResponses.map((response, index) => {
                          const isChosen = isResponseChosen(response, selectedApplication);
                          const canChoose = canChooseExecutor(selectedApplication);

                          return (
                            <div
                              key={response.id || index}
                              className={`response-item-c ${isChosen ? 'response-item-chosen-c' : ''}`}
                            >
                              <div className="response-header-c">
                                <div className="response-worker-info-c">
                                  <span className="response-worker-name-c">
                                    {response.worker_name || response.workerName || 'Работник'}
                                    {response.organization && ` (${response.organization})`}
                                    {isChosen && <span className="chosen-badge-c">✓ Выбрано</span>}
                                  </span>
                                  <span className="response-date-c">
                                    {formatDate(response.created_at || response.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="response-content-c">
                                {(response.response || response.message) && (
                                  <div className="response-text-section-c">
                                    <h5>Текст ответа:</h5>
                                    <div className="response-text-c">
                                      {response.response || response.message}
                                    </div>
                                  </div>
                                )}

                                <div className="response-offer-details-c">
                                  {(response.price || response.price === 0) && (
                                    <div className="offer-detail-c">
                                      <span className="offer-label-c">Предложенная цена:</span>
                                      <span className="offer-value-c offer-value-price-c">
                                        {formatPrice(response.price)}
                                      </span>
                                    </div>
                                  )}

                                  {response.deadline && (
                                    <div className="offer-detail-c">
                                      <span className="offer-label-c">Срок исполнения:</span>
                                      <span className="offer-value-c offer-value-deadline-c">
                                        {formatDeadline(response.deadline)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {canChoose && !isChosen && (
                                <div className="choose-executor-section-c">
                                  <Button
                                    variant="primary"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChooseExecutor(response);
                                    }}
                                    fullWidth
                                    disabled={assigningWorker === response.id}
                                  >
                                    {assigningWorker === response.id ? (
                                      <>⏳ Выбираем...</>
                                    ) : (
                                      <>Выбрать этого исполнителя</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!selectedApplication.workerResponses || selectedApplication.workerResponses.length === 0) && (
                    <div className="no-responses-c">
                      <div className="no-responses-icon-c">💬</div>
                      <h5>Пока нет ответов от работников</h5>
                      <p className="no-responses-subtitle-c">
                        Работники могут оставлять ответы через интерфейс исполнителя
                      </p>
                    </div>
                  )}
                </div>

                <div className="ua-modal-actions-c">
                  {canCancelApplication(selectedApplication) && (
                    <Button
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingCancel(true);
                      }}
                      className="cancel-application-btn"
                    >
                      Отменить заявку
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={closeAllModals}
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmingExecutor && (
        <div className="ua-modal-overlay-c" onClick={() => setConfirmingExecutor(null)}>
          <div className="ua-modal-c ua-modal-medium-c" onClick={(e) => e.stopPropagation()}>
            <div className="ua-modal-header-c">
              <h3 className="ua-modal-title-c">Подтверждение выбора исполнителя</h3>
              <button
                className="ua-modal-close-c"
                onClick={() => setConfirmingExecutor(null)}
                aria-label="Закрыть"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ua-modal-content-c">
              <div className="confirm-executor-modal-c">
                <div className="confirmation-content-c">
                  <div className="warning-icon-c">⚠️</div>
                  <h4>Вы уверены, что хотите выбрать этого исполнителя?</h4>

                  <div className="executor-details-c">
                    <div className="detail-row-c">
                      <span className="detail-label-c">Заявка:</span>
                      <span className="detail-value-c">#{confirmingExecutor.applicationNumber}</span>
                    </div>
                    <div className="detail-row-c">
                      <span className="detail-label-c">Исполнитель:</span>
                      <span className="detail-value-c">{confirmingExecutor.workerName}</span>
                    </div>

                    {confirmingExecutor.price && (
                      <div className="detail-row-c">
                        <span className="detail-label-c">Цена:</span>
                        <span className="detail-value-c">{formatPrice(confirmingExecutor.price)}</span>
                      </div>
                    )}

                    {confirmingExecutor.deadline && (
                      <div className="detail-row-c">
                        <span className="detail-label-c">Срок исполнения:</span>
                        <span className="detail-value-c">{formatDeadline(confirmingExecutor.deadline)}</span>
                      </div>
                    )}
                  </div>

                  <div className="confirmation-note-c">
                    <p>После подтверждения:</p>
                    <ul>
                      <li>Заявка перейдет в статус "Исполнитель назначен"</li>
                      <li>Исполнитель будет уведомлен о вашем выборе</li>
                      <li>Вы сможете связаться с исполнителем для уточнения деталей</li>
                    </ul>
                  </div>
                </div>

                <div className="confirmation-actions-c">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmingExecutor(null)}
                    disabled={assigningWorker}
                    className="choose-wok"
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="primary"
                    onClick={confirmExecutorChoice}
                    disabled={assigningWorker}
                  >
                    {assigningWorker ? (
                      <>⏳ Выбираем...</>
                    ) : (
                      <>Да, выбрать</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения отмены заявки */}
      {confirmingCancel && selectedApplication && (
        <div className="ua-modal-overlay-c" onClick={() => setConfirmingCancel(false)}>
          <div className="ua-modal-c ua-modal-medium-c" onClick={(e) => e.stopPropagation()}>
            <div className="ua-modal-header-c">
              <h3 className="ua-modal-title-c">Отмена заявки #{selectedApplication.id}</h3>
              <button
                className="ua-modal-close-c"
                onClick={() => setConfirmingCancel(false)}
                aria-label="Закрыть"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ua-modal-content-c">
              <div className="confirm-cancel-modal-c">
                <div className="confirmation-content-c">
                  <div className="warning-icon-c">⚠️</div>
                  <h4>Вы уверены, что хотите отменить эту заявку?</h4>

                  <div className="cancel-details-c">
                    <div className="detail-row-c">
                      <span className="detail-label-c">Заявка:</span>
                      <span className="detail-value-c">#{selectedApplication.id}</span>
                    </div>
                    <div className="detail-row-c">
                      <span className="detail-label-c">Товар:</span>
                      <span className="detail-value-c">{selectedApplication.product}</span>
                    </div>
                    <div className="detail-row-c">
                      <span className="detail-label-c">Текущий статус:</span>
                      <span className="detail-value-c">{getStatusText(selectedApplication.status)}</span>
                    </div>
                  </div>

                  <div className="cancel-note-c">
                    <p>После отмены:</p>
                    <ul>
                      <li>Заявка будет переведена в статус "Отменена"</li>
                      <li>Отмена будет отображена в истории заявок</li>
                      <li>Это действие нельзя будет отменить</li>
                      {selectedApplication.worker_id && (
                        <li>
                          <strong>Внимание:</strong> Исполнитель, назначенный на эту заявку,
                          будет уведомлен об отмене
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="confirmation-actions-c">
                  <Button
                    variant="outline"
                    className="choose-wok"
                    onClick={() => setConfirmingCancel(false)}
                    disabled={cancelling}
                  >
                    Нет, оставить заявку
                  </Button>
                  <Button
                    variant="danger"
                    className="choose-wok"
                    onClick={cancelApplication}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>⏳ Отмена...</>
                    ) : (
                      <>Да, отменить заявку</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApplications;