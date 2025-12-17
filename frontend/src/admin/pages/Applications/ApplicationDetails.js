import React, { useState, useEffect, useCallback, useRef } from 'react';
import { applicationsAPI } from '../../../services/api';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatPhone, formatDate } from '../../utils/helpers';
import './ApplicationDetails.css';

// Импортируем заглушки как в ProductSelection
import defaultProductImage from '../../../img/default-product.png';

const ApplicationDetails = ({ application, onStatusChange, onWorkerAssigned }) => {
  const [workerResponses, setWorkerResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState(null);
  const [assigningWorker, setAssigningWorker] = useState(null);
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [productImage, setProductImage] = useState(defaultProductImage);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Используем useRef для предотвращения повторных вызовов
  const lastApplicationId = useRef(null);
  const lastProductId = useRef(null);
  const mounted = useRef(true);

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

  // Функция загрузки ответов
  const loadWorkerResponses = useCallback(async () => {
    if (!application?.id) return;
    
    try {
      setLoadingResponses(true);
      setError(null);
      
      const response = await applicationsAPI.getWorkerResponses(application.id);
      
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
  }, [application?.id]);

  // Функция загрузки изображения товара
  const loadProductImage = useCallback(async () => {
    if (!application?.product_id) {
      setProductImage(defaultProductImage);
      return;
    }

    try {
      setLoadingImage(true);
      
      // Используем API для получения информации о товаре
      const response = await applicationsAPI.getProductInfo(application.product_id);
      
      if (response.success && response.data.product) {
        const product = response.data.product;
        
        // Получаем URL изображения через ту же функцию, что и в ProductSelection
        if (product.image_url) {
          const imageUrl = getImageUrl(product.image_url, 'product');
          setProductImage(imageUrl);
        } else {
          // Если у товара нет изображения в БД, пробуем стандартный путь
          const standardPath = `/img/products/${application.product_id}.jpg`;
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
        const standardPath = `/img/products/${application.product_id}.jpg`;
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
  }, [application?.product_id, getImageUrl]);

  // Функция удаления ответа
const deleteWorkerResponse = useCallback(async (responseId, e) => {
  if (e) e.stopPropagation();
  
  if (!responseId || !application?.id) return;
  
  const confirmDelete = window.confirm('Вы уверены, что хотите удалить этот ответ работника? Это действие нельзя отменить.');
  if (!confirmDelete) return;
  
  try {
    setDeletingResponse(responseId);
    
    console.log('🔄 Начинаем процесс удаления ответа:', {
      applicationId: application.id,
      responseId: responseId
    });
    
    const response = await applicationsAPI.deleteWorkerResponse(application.id, responseId);
    
    console.log('✅ Результат удаления из API:', response);
    
    // Проверяем структуру ответа
    if (response && response.success) {
      // Удаляем ответ из списка
      setWorkerResponses(prev => prev.filter(r => r.id !== responseId));
      
      // Показываем уведомление
      alert(response.message || 'Ответ работника успешно удален');
      
      console.log('🗑️ Ответ удален из состояния UI');
    } else {
      // Сервер вернул success: false
      console.error('❌ Сервер вернул ошибку:', response);
      throw new Error(response.error || response.message || 'Неизвестная ошибка сервера');
    }
    
  } catch (error) {
    console.error('❌ Ошибка в процессе удаления:', error);
    
    // Проверяем структуру ошибки
    let errorMessage = 'Ошибка при удалении ответа';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.error) {
      errorMessage = error.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    alert(`Ошибка: ${errorMessage}`);
    
  } finally {
    setDeletingResponse(null);
  }
}, [application?.id]);

  // Основной useEffect для загрузки данных
  useEffect(() => {
    if (!application) return;

    // Проверяем, изменилась ли заявка
    if (lastApplicationId.current !== application.id) {
      lastApplicationId.current = application.id;
      
      // Загружаем ответы
      loadWorkerResponses();
      
      // Загружаем изображение если есть product_id
      if (application.product_id) {
        loadProductImage();
      } else {
        setProductImage(defaultProductImage);
      }
    }
    
    // Проверяем, изменился ли product_id
    if (lastProductId.current !== application.product_id) {
      lastProductId.current = application.product_id;
      
      // Загружаем изображение
      if (application.product_id) {
        loadProductImage();
      } else {
        setProductImage(defaultProductImage);
      }
    }
  }, [application, loadWorkerResponses, loadProductImage]);

  // Очистка при размонтировании
  useEffect(() => {
    mounted.current = true;
    
    return () => {
      mounted.current = false;
    };
  }, []);

  // Обработчик назначения исполнителя
  const assignWorker = useCallback(async (workerResponseId) => {
    if (!application?.id) return;

    try {
      setAssigningWorker(workerResponseId);
      
      const response = await applicationsAPI.selectWorkerForApplication(
        application.id, 
        workerResponseId
      );

      if (response.success) {
        if (onWorkerAssigned) {
          onWorkerAssigned(application.id, response.data.application);
        }
        
        // Обновляем ответы после назначения
        setTimeout(() => {
          if (mounted.current) {
            loadWorkerResponses();
          }
        }, 100);
        
        alert(`Исполнитель успешно назначен на заявку #${application.id}`);
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
  }, [application?.id, onWorkerAssigned, loadWorkerResponses]);

  // Мемоизированные функции
  const formatPrice = useCallback((price) => {
    if (!price && price !== 0) return 'Не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  }, []);

  const handleStatusChange = useCallback((newStatus) => {
    if (onStatusChange && application?.status !== newStatus) {
      onStatusChange(application.id, newStatus);
    }
  }, [application, onStatusChange]);

  const canAssignWorker = useCallback((response) => {
    return !application?.worker_id && application?.status !== 'completed';
  }, [application]);

  const statusOptions = React.useMemo(() => 
    Object.entries(APPLICATION_STATUSES).map(([value, config]) => ({
      value,
      label: config.label
    })), []);

  // Функция для обработки ошибок загрузки изображения
  const handleImageError = useCallback((e) => {
    console.log('🖼️ Ошибка загрузки изображения, используем заглушку');
    e.target.src = defaultProductImage;
    // Отключаем обработчик ошибок, чтобы избежать бесконечного цикла
    e.target.onerror = null;
  }, []);

  if (!application) {
    return <div className="application-details-empty-adm">Заявка не найдена</div>;
  }

  return (
    <div className="application-details-adm dark-theme-adm">
      <div className="details-header-adm">
        <div className="details-title-adm">
          <h2 className="details-title-text-adm">Заявка #{application.id}</h2>
          <span className="application-date-adm">
            {formatDate(application.created_at)}
          </span>
        </div>
        
        <div className="status-section-adm">
          <label className="status-label-adm">Статус:</label>
          <select 
            value={application.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`status-select-adm status-${application.status}-adm`}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {application.worker_id && (
        <div className="current-worker-info-adm">
          <h4 className="current-worker-title-adm">📌 Текущий исполнитель:</h4>
          <div className="worker-details-adm">
            <span className="worker-detail-item-adm"><strong>ID:</strong> {application.worker_id}</span>
            {application.worker_name && (
              <span className="worker-detail-item-adm"><strong>Имя:</strong> {application.worker_name}</span>
            )}
            {application.responded_at && (
              <span className="worker-detail-item-adm"><strong>Назначен:</strong> {formatDate(application.responded_at)}</span>
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
                      <span className="detail-value-adm">{application.name}</span>
                    </div>
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Телефон:</span>
                      <span className="detail-value-adm">{formatPhone(application.phone)}</span>
                    </div>
                    {application.email && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Email:</span>
                        <span className="detail-value-adm">{application.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блок с комментарием */}
                {application.comment ? (
                  <div className="detail-card-adm comment-card-adm">
                    <h3 className="detail-title-adm">Комментарий клиента</h3>
                    <div className="detail-content-adm">
                      <div className="comment-content-adm">
                        <p className="comment-text-adm">{application.comment}</p>
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
                      <span className="detail-value-adm">{application.product_type}</span>
                    </div>
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Товар:</span>
                      <span className="detail-value-adm">{application.product}</span>
                    </div>
                    {application.material && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Материал:</span>
                        <span className="detail-value-adm">{application.material}</span>
                      </div>
                    )}
                    {application.size && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Размер:</span>
                        <span className="detail-value-adm">{application.size}</span>
                      </div>
                    )}
                    {application.product_id && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">ID товара:</span>
                        <span className="detail-value-adm product-id-value-adm">{application.product_id}</span>
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
                          alt={application.product || "Товар"}
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

              {/* Системная информация - полная ширина */}
              <div className="detail-card-adm system-info-card-adm">
                <h3 className="detail-title-adm">Системная информация</h3>
                <div className="detail-content-adm">
                  <div className="system-info-grid-adm">
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Создана:</span>
                      <span className="detail-value-adm">{formatDate(application.created_at)}</span>
                    </div>
                    {application.updated_at && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Обновлена:</span>
                        <span className="detail-value-adm">{formatDate(application.updated_at)}</span>
                      </div>
                    )}
                    <div className="detail-item-adm">
                      <span className="detail-label-adm">Ответов:</span>
                      <span className="detail-value-adm">{workerResponses.length}</span>
                    </div>
                    {application.worker_id && (
                      <div className="detail-item-adm">
                        <span className="detail-label-adm">Исполнитель:</span>
                        <span className="detail-value-adm">ID: {application.worker_id}</span>
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
                  <div key={response.id || index} className={`response-item-adm ${response.status === 'accepted' ? 'accepted-adm' : ''}`}>
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
                        
                        {/* Кнопка удаления ответа */}
                        <button 
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
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-responses-adm">
                <div className="no-responses-icon-adm">💬</div>
                <h4 className="no-responses-title-adm">Ответов пока нет</h4>
                <p className="no-responses-text-adm">На эту заявку еще не было ответов от работников</p>
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
            if (application.product_id) {
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

export default ApplicationDetails;