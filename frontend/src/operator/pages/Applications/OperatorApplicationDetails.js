import React, { useState, useEffect, useCallback, useRef } from 'react';
import { applicationsAPI } from '../../../services/api';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatPhone, formatDate } from '../../utils/helpers';

// Импортируем заглушку
import defaultProductImage from '../../../img/default-product.png';
import './OperatorApplicationDetails.css';

const OperatorApplicationDetails = ({ 
  application, 
  onStatusChange, 
  onWorkerAssigned,
  onDeleteWorkerResponse,
  userRole = 'operator'
}) => {
  const [workerResponses, setWorkerResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState(null);
  const [assigningWorker, setAssigningWorker] = useState(null);
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [productImage, setProductImage] = useState(defaultProductImage);
  const [loadingImage, setLoadingImage] = useState(false);
  
  const lastApplicationId = useRef(null);
  const lastProductId = useRef(null);
  const mounted = useRef(true);

  // Локальное состояние для заявки, которое можно обновлять
  const [localApplication, setLocalApplication] = useState(application);

  // Обновляем локальное состояние при изменении пропса application
  useEffect(() => {
    console.log('📝 Application prop changed:', application);
    if (application) {
      setLocalApplication(application);
    }
  }, [application]);

  // Функция getImageUrl аналогичная ProductSelection
  const getImageUrl = useCallback((imagePath, fallbackType = 'product') => {
    if (!imagePath) {
      return fallbackType === 'type' ? '/img/default-type.png' : defaultProductImage;
    }

    let cleanPath = imagePath;
    if (imagePath.includes('/uploads/products/')) {
      cleanPath = imagePath.replace('/uploads/products/', '/img/products/');
    } else if (imagePath.includes('/uploads/types/')) {
      cleanPath = imagePath.replace('/uploads/types/', '/img/types/');
    } else if (imagePath.includes('/uploads/')) {
      cleanPath = imagePath.replace('/uploads/', '/img/');
    }

    if (cleanPath.startsWith('http')) return cleanPath;

    if (cleanPath.startsWith('/')) {
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : window.location.origin;

      return `${baseUrl}${cleanPath}`;
    }

    return fallbackType === 'type' ? '/img/default-type.png' : defaultProductImage;
  }, []);

  const loadWorkerResponses = useCallback(async () => {
    if (!localApplication?.id) return;
    
    try {
      setLoadingResponses(true);
      setError(null);
      
      const response = await applicationsAPI.getWorkerResponses(localApplication.id);
      
      if (response.success) {
        setWorkerResponses(response.data.responses || []);
      } else {
        throw new Error(response.error || 'Ошибка при загрузке ответов');
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки ответов:', error);
      setError(error.message);
      setWorkerResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  }, [localApplication?.id]);

  // Функция загрузки изображения товара
  const loadProductImage = useCallback(async () => {
    if (!localApplication?.product_id) {
      setProductImage(defaultProductImage);
      return;
    }

    try {
      setLoadingImage(true);
      
      // Используем API для получения информации о товаре
      const response = await applicationsAPI.getProductInfo(localApplication.product_id);
      
      if (response.success && response.data.product) {
        const product = response.data.product;
        
        // Получаем URL изображения через ту же функцию, что и в ProductSelection
        if (product.image_url) {
          const imageUrl = getImageUrl(product.image_url, 'product');
          setProductImage(imageUrl);
        } else {
          // Если у товара нет изображения в БД, пробуем стандартный путь
          const standardPath = `/img/products/${localApplication.product_id}.jpg`;
          const baseUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001'
            : window.location.origin;
          
          const imageUrl = `${baseUrl}${standardPath}`;
          
          // Проверяем существование изображения
          const img = new Image();
          img.onload = () => {
            setProductImage(imageUrl);
          };
          img.onerror = () => {
            setProductImage(defaultProductImage);
          };
          img.src = imageUrl;
        }
      } else {
        // Если API не вернул данные, пробуем стандартный путь
        const standardPath = `/img/products/${localApplication.product_id}.jpg`;
        const baseUrl = process.env.NODE_ENV === 'development'
          ? 'http://localhost:3001'
          : window.location.origin;
        
        const imageUrl = `${baseUrl}${standardPath}`;
        
        const img = new Image();
        img.onload = () => {
          setProductImage(imageUrl);
        };
        img.onerror = () => {
          setProductImage(defaultProductImage);
        };
        img.src = imageUrl;
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при загрузке изображения:', error);
      setProductImage(defaultProductImage);
    } finally {
      setLoadingImage(false);
    }
  }, [localApplication?.product_id, getImageUrl]);

  const deleteWorkerResponse = useCallback(async (responseId, e) => {
    if (e) e.stopPropagation();
    
    if (!responseId || !localApplication?.id) return;
    
    const confirmDelete = window.confirm('Вы уверены, что хотите удалить этот ответ работника? Это действие нельзя отменить.');
    if (!confirmDelete) return;
    
    try {
      setDeletingResponse(responseId);
      
      const response = await applicationsAPI.deleteWorkerResponse(localApplication.id, responseId);
      
      if (response && response.success) {
        setWorkerResponses(prev => prev.filter(r => r.id !== responseId));
        if (onDeleteWorkerResponse) {
          onDeleteWorkerResponse(responseId);
        }
        alert(response.message || 'Ответ работника успешно удален');
      } else {
        throw new Error(response.error || response.message || 'Неизвестная ошибка сервера');
      }
      
    } catch (error) {
      console.error('❌ Ошибка в процессе удаления:', error);
      
      let errorMessage = 'Ошибка при удалении ответа';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      alert(`Ошибка: ${errorMessage}`);
    } finally {
      setDeletingResponse(null);
    }
  }, [localApplication?.id, onDeleteWorkerResponse]);

  useEffect(() => {
    if (!localApplication) return;

    if (lastApplicationId.current !== localApplication.id) {
      lastApplicationId.current = localApplication.id;
      
      loadWorkerResponses();
      
      if (localApplication.product_id) {
        loadProductImage();
      } else {
        setProductImage(defaultProductImage);
      }
    }
    
    // Проверяем, изменился ли product_id
    if (lastProductId.current !== localApplication.product_id) {
      lastProductId.current = localApplication.product_id;
      
      // Загружаем изображение
      if (localApplication.product_id) {
        loadProductImage();
      } else {
        setProductImage(defaultProductImage);
      }
    }
  }, [localApplication, loadWorkerResponses, loadProductImage]);

  useEffect(() => {
    mounted.current = true;
    
    return () => {
      mounted.current = false;
    };
  }, []);

  const assignWorker = useCallback(async (workerResponseId) => {
    if (!localApplication?.id) return;

    try {
      setAssigningWorker(workerResponseId);
      
      const response = await applicationsAPI.selectWorkerForApplication(
        localApplication.id, 
        workerResponseId
      );

      if (response.success) {
        if (onWorkerAssigned) {
          onWorkerAssigned(localApplication.id, response.data.application);
        }
        
        // Обновляем локальное состояние с информацией о работнике
        if (response.data.application) {
          setLocalApplication(prev => ({
            ...prev,
            ...response.data.application
          }));
        }
        
        // Обновляем ответы после назначения
        setTimeout(() => {
          if (mounted.current) {
            loadWorkerResponses();
          }
        }, 100);
        
        alert(`Исполнитель успешно назначен на заявку #${localApplication.id}`);
      } else {
        throw new Error(response.error || 'Ошибка при назначении исполнителя');
      }

    } catch (error) {
      console.error('❌ Ошибка назначения исполнителя:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      if (mounted.current) {
        setAssigningWorker(null);
      }
    }
  }, [localApplication?.id, onWorkerAssigned, loadWorkerResponses]);

  const formatPrice = useCallback((price) => {
    if (!price && price !== 0) return 'Не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  }, []);

  const handleStatusChange = useCallback(async (e) => {
    const newStatus = e.target.value;
    console.log('🔄 handleStatusChange called:', { 
      currentStatus: localApplication?.status, 
      newStatus,
      hasOnStatusChange: !!onStatusChange 
    });
    
    if (onStatusChange && localApplication?.status !== newStatus) {
      try {
        console.log('📤 Calling onStatusChange with:', localApplication.id, newStatus);
        // Вызываем родительский обработчик
        await onStatusChange(localApplication.id, newStatus);
        
        // Обновляем локальное состояние
        console.log('🔄 Updating local state to:', newStatus);
        setLocalApplication(prev => ({
          ...prev,
          status: newStatus
        }));
      } catch (error) {
        console.error('❌ Ошибка при изменении статуса:', error);
        alert(`Ошибка при изменении статуса: ${error.message}`);
      }
    } else {
      console.log('⚠️ Status change skipped:', {
        sameStatus: localApplication?.status === newStatus,
        noCallback: !onStatusChange
      });
    }
  }, [localApplication, onStatusChange]);

  const canAssignWorker = useCallback((response) => {
    return !localApplication?.worker_id && localApplication?.status !== 'completed';
  }, [localApplication]);

  const statusOptions = React.useMemo(() => 
    Object.entries(APPLICATION_STATUSES)
      .filter(([status]) => status !== 'for_delete')
      .map(([value, config]) => ({
        value,
        label: config.label
      })), []);

  const handleImageError = useCallback((e) => {
    console.log('🖼️ Ошибка загрузки изображения, используем заглушку');
    e.target.src = defaultProductImage;
    e.target.onerror = null;
  }, []);

  if (!localApplication) {
    return <div className="operator-application-details-empty">Заявка не найдена</div>;
  }

  return (
    <div className="operator-application-details dark-theme-adm">
      <div className="details-header-adm">
        <div className="details-title-adm">
          <h2 className="details-title-text-adm">Заявка #{localApplication.id}</h2>
          <span className="application-date-adm">
            {formatDate(localApplication.created_at)}
          </span>
        </div>
        
        <div className="status-section-adm">
          <label className="status-label-adm">Статус:</label>
          <select 
            value={localApplication.status}
            onChange={handleStatusChange}
            className={`status-select-adm status-${localApplication.status}-adm`}
            disabled={localApplication.status === 'for_delete'}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {localApplication.status === 'for_delete' && (
              <option value="for_delete" disabled>
                ⚠️ На удалении
              </option>
            )}
          </select>
        </div>
      </div>

      {localApplication.status === 'for_delete' && (
        <div className="operator-deletion-notice">
          ⚠️ Эта заявка помечена на удаление. Восстановите её для дальнейших действий.
        </div>
      )}

      {localApplication.worker_id && (
        <div className="current-worker-info-adm">
          <h4 className="current-worker-title-adm">📌 Текущий исполнитель:</h4>
          <div className="worker-details-adm">
            <span className="worker-detail-item-adm">
              <strong>ID:</strong> {localApplication.worker_id}
            </span>
            {localApplication.worker_name && (
              <span className="worker-detail-item-adm">
                <strong>Имя:</strong> {localApplication.worker_name}
              </span>
            )}
            {localApplication.responded_at && (
              <span className="worker-detail-item-adm">
                <strong>Назначен:</strong> {formatDate(localApplication.responded_at)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="details-tabs-adm">
        <button 
          className={`tab-button-adm ${activeTab === 'details' ? 'active-adm' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          📋 Основная информация
        </button>
        <button 
          className={`tab-button-adm ${activeTab === 'responses' ? 'active-adm' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          💬 Ответы работников ({workerResponses.length})
          {loadingResponses && ' 🔄'}
        </button>
      </div>

      <div className="tab-content-adm">
        {activeTab === 'details' && (
          <div className="details-content-adm">
            <div className="details-grid-adm">
              {/* Первая строка: Клиент и Комментарий */}
              <div className="detail-row-adm">
                {/* Блок с клиентом */}
                <div className="detail-card-adm client-card-adm">
                  <h3 className="detail-title-adm">Клиент</h3>
                  <div className="detail-content-adm">
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Имя:</span>
                      <span className="detail-value-adm">{localApplication.name}</span>
                    </div>
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Телефон:</span>
                      <span className="detail-value-adm">
                        {formatPhone(localApplication.phone)}
                      </span>
                    </div>
                    {localApplication.email && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Email:</span>
                        <span className="detail-value-adm">{localApplication.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блок с комментарием */}
                {localApplication.comment ? (
                  <div className="detail-card-adm comment-card-adm">
                    <h3 className="detail-title-adm">Комментарий клиента</h3>
                    <div className="detail-content-adm">
                      <div className="comment-content-adm">
                        <p className="comment-text-adm">{localApplication.comment}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-card-adm comment-card-adm empty-comment-adm">
                    <h3 className="detail-title-adm">Комментарий клиента</h3>
                    <div className="detail-content-adm">
                      <div className="comment-content-adm">
                        <p className="no-comment-text-adm">Клиент не оставил комментарий</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Вторая строка: Товар и Изображение */}
              <div className="detail-row-adm">
                {/* Блок с товаром */}
                <div className="detail-card-adm product-card-adm">
                  <h3 className="detail-title-adm">Товар</h3>
                  <div className="detail-content-adm">
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Тип:</span>
                      <span className="detail-value-adm">{localApplication.product_type}</span>
                    </div>
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Товар:</span>
                      <span className="detail-value-adm">{localApplication.product}</span>
                    </div>
                    {localApplication.material && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Материал:</span>
                        <span className="detail-value-adm">{localApplication.material}</span>
                      </div>
                    )}
                    {localApplication.size && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Размер:</span>
                        <span className="detail-value-adm">{localApplication.size}</span>
                      </div>
                    )}
                    {localApplication.product_id && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">ID товара:</span>
                        <span className="detail-value-adm product-id-value-adm">
                          {localApplication.product_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блок с изображением товара */}
                <div className="detail-card-adm product-image-card-adm">
                  <h3 className="detail-title-adm">Изображение товара</h3>
                  <div className="product-image-content-adm">
                    {loadingImage ? (
                      <div className="product-image-loading-adm">
                        <div className="image-spinner-adm"></div>
                        <p>Загрузка изображения...</p>
                      </div>
                    ) : (
                      <div className="product-image-container-adm">
                        <img
                          src={productImage}
                          alt={localApplication.product || "Товар"}
                          className="product-image-adm"
                          loading="lazy"
                          onError={handleImageError}
                        />
                        <div className="image-info-adm">
                          <span className="image-filename-adm">
                            {productImage === defaultProductImage 
                              ? 'Используется заглушка' 
                              : 'Изображение товара'}
                          </span>
                          {productImage !== defaultProductImage && (
                            <a 
                              href={productImage} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="image-view-link-adm"
                            >
                              ↗ Открыть в полном размере
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Системная информация */}
              <div className="detail-card-adm system-info-card-adm">
                <h3 className="detail-title-adm">Системная информация</h3>
                <div className="detail-content-adm">
                  <div className="system-info-grid-adm">
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Создана:</span>
                      <span className="detail-value-adm">
                        {formatDate(localApplication.created_at)}
                      </span>
                    </div>
                    {localApplication.updated_at && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Обновлена:</span>
                        <span className="detail-value-adm">
                          {formatDate(localApplication.updated_at)}
                        </span>
                      </div>
                    )}
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Ответов:</span>
                      <span className="detail-value-adm">{workerResponses.length}</span>
                    </div>
                    {localApplication.worker_id && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Исполнитель:</span>
                        <span className="detail-value-adm">ID: {localApplication.worker_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="responses-content-adm">
            {error && (
              <div className="error-message-adm">
                <p className="error-text-adm">❌ Ошибка: {error}</p>
                <button onClick={loadWorkerResponses} className="retry-btn-adm">
                  Попробовать снова
                </button>
              </div>
            )}

            {loadingResponses ? (
              <div className="loading-responses-adm">
                <p className="loading-text-adm">Загрузка ответов работников...</p>
              </div>
            ) : workerResponses.length > 0 ? (
              <div className="responses-list-adm">
                {workerResponses.map((response, index) => (
                  <div key={response.id || index} 
                       className={`response-item-adm ${response.status === 'accepted' ? 'accepted-adm' : ''}`}>
                    <div className="response-header-adm">
                      <div className="response-worker-info-adm">
                        <span className="response-worker-name-adm">
                          {response.worker_name || response.workerName || `Работник ${index + 1}`}
                          {response.status === 'accepted' && (
                            <span className="accepted-badge-adm"> ✅ Выбран</span>
                          )}
                        </span>
                        {response.organization && (
                          <span className="response-organization-adm">
                            {response.organization}
                          </span>
                        )}
                      </div>
                      <span className="response-date-adm">
                        {formatDate(response.created_at || response.createdAt)}
                      </span>
                    </div>
                    
                    <div className="response-content-adm">
                      {(response.response || response.message) && (
                        <div className="response-text-section-adm">
                          <h4 className="response-text-title-adm">Текст ответа:</h4>
                          <div className="response-text-adm">
                            {response.response || response.message}
                          </div>
                        </div>
                      )}
                      
                      <div className="response-details-adm">
                        {(response.price || response.price === 0) && (
                          <div className="response-detail-adm price-detail-adm">
                            <span className="detail-label-adm">Предложенная цена:</span>
                            <span className="detail-value-adm price-value-adm">
                              {formatPrice(response.price)}
                            </span>
                          </div>
                        )}
                        
                        {response.deadline && (
                          <div className="response-detail-adm deadline-detail-adm">
                            <span className="detail-label-adm">Срок выполнения:</span>
                            <span className="detail-value-adm deadline-value-adm">
                              {formatDate(response.deadline)}
                            </span>
                          </div>
                        )}
                        
                        {response.worker_id && (
                          <div className="response-detail-adm worker-id-detail-adm">
                            <span className="detail-label-adm">ID работника:</span>
                            <span className="detail-value-adm worker-id-value-adm">
                              {response.worker_id}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Кнопки действий для ответа */}
                      <div className="response-actions-adm">
                        {canAssignWorker(response) && (
                          <button 
                            className={`assign-worker-btn-adm ${assigningWorker === response.id ? 'assigning-adm' : ''}`}
                            onClick={() => assignWorker(response.id)}
                            disabled={assigningWorker === response.id}
                          >
                            {assigningWorker === response.id ? (
                              <>⏳ Назначаем...</>
                            ) : (
                              <>👑 Назначить исполнителем</>
                            )}
                          </button>
                        )}
                        
                        {/* Кнопка удаления ответа - доступна для оператора */}
                        {/* <button 
                          className={`delete-response-btn-adm ${deletingResponse === response.id ? 'deleting-adm' : ''}`}
                          onClick={(e) => deleteWorkerResponse(response.id, e)}
                          disabled={deletingResponse === response.id}
                          title="Удалить ответ работника"
                        >
                          {deletingResponse === response.id ? (
                            <>⏳ Удаление...</>
                          ) : (
                            <>🗑️ Удалить ответ</>
                          )}
                        </button> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-responses-adm">
                <div className="no-responses-icon-adm">💬</div>
                <h4 className="no-responses-title-adm">Ответов пока нет</h4>
                <p className="no-responses-text-adm">
                  На эту заявку еще не было ответов от работников
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="details-actions-adm">
        <button 
          className="refresh-btn-adm"
          onClick={() => {
            loadWorkerResponses();
            if (localApplication.product_id) {
              loadProductImage();
            }
          }}
          disabled={loadingResponses || loadingImage}
        >
          {loadingResponses || loadingImage ? '🔄 Загрузка...' : '🔄 Обновить данные'}
        </button>
        
        {error && (
          <span className="error-info-adm">Ошибка при загрузке</span>
        )}
      </div>
    </div>
  );
};

export default OperatorApplicationDetails;