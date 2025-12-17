import React, { useEffect, useState, useCallback } from 'react';
import { useWorker } from '../../hooks/useWorker';
import { useAuth } from '../../../context/AuthContext';
import ApplicationCard from './ApplicationCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import './ApplicationsList.css';

const ultraSafeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const possibleKeys = ['applications', 'data', 'items', 'results', 'list'];
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) return data[key];
    }
    const arrayValue = Object.values(data).find(Array.isArray);
    if (arrayValue) return arrayValue;
    if (data.id || data.name || data.phone) return [data];
  }
  return [];
};

const ApplicationsList = () => {
  const { applications, loading, loadApplications } = useWorker();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: 'all' });
  const [workerResponses, setWorkerResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const workerId = user?.id;

  const [responseMap, setResponseMap] = useState({});

  useEffect(() => {
    const checkResponses = async () => {
      if (!workerId || !applications.length) return;

      // Создаем временную карту
      const tempMap = {};

      // Проверяем только заявки со статусом 'pending'
      const pendingApps = applications.filter(app => app.status === 'pending');

      for (const app of pendingApps) {
        try {
          const response = await fetch(`/api/applications/${app.id}/worker-responses`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const responses = data.data?.responses || [];
            const hasResponded = responses.some(resp => String(resp.worker_id) === String(workerId));
            tempMap[app.id] = hasResponded;
          }
        } catch (error) {
          tempMap[app.id] = false;
        }
      }

      setResponseMap(tempMap);
    };

    checkResponses();
  }, [workerId, applications]);

  // Загружаем ответы работника из таблицы worker_responses
  // В ApplicationsList.js
  useEffect(() => {
  const token = localStorage.getItem('token');
  console.log('Токен из localStorage:', token ? 'Есть' : 'Нет');
  console.log('Worker ID:', workerId);
}, [workerId]);

// При загрузке ответов:
const API_BASE = 'http://localhost:3001/api';

// Используйте так:
const loadWorkerResponses = useCallback(async () => {
  if (!workerId || !applications.length) return;
  
  setResponsesLoading(true);
  try {
    console.log(`Проверяем ответы на ${applications.length} заявок...`);
    
    // Проверяем только заявки со статусом 'pending'
    const pendingApps = applications.filter(app => app.status === 'pending');
    console.log(`Из них ${pendingApps.length} в статусе 'pending'`);
    
    const responseMap = {};
    
    // Проверяем каждую заявку
    for (const app of pendingApps) {
      try {
        const response = await fetch(`${API_BASE}/applications/${app.id}/worker-responses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Заявка ${app.id}: статус ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          const responses = data.data?.responses || data.responses || [];
          
          // Ищем ответ текущего работника
          const hasResponded = responses.some(resp => 
            String(resp.worker_id) === String(workerId)
          );
          
          responseMap[app.id] = hasResponded;
          
          if (hasResponded) {
            console.log(`✓ Работник ${workerId} отвечал на заявку ${app.id}`);
          } else {
            console.log(`✗ Работник ${workerId} НЕ отвечал на заявку ${app.id}`);
          }
        } else {
          console.error(`Ошибка HTTP ${response.status} для заявки ${app.id}`);
          responseMap[app.id] = false;
        }
      } catch (error) {
        console.error(`Ошибка проверки заявки ${app.id}:`, error);
        responseMap[app.id] = false;
      }
    }
    
    setResponseMap(responseMap);
    console.log('Карта ответов создана:', responseMap);
    
    // Сохраняем в localStorage для кэширования
    try {
      localStorage.setItem(`worker_${workerId}_responseMap`, JSON.stringify(responseMap));
      localStorage.setItem(`worker_${workerId}_responseMap_timestamp`, Date.now().toString());
    } catch (e) {
      console.warn('Не удалось сохранить в localStorage:', e);
    }
    
  } catch (error) {
    console.error('Общая ошибка загрузки ответов:', error);
  } finally {
    setResponsesLoading(false);
  }
}, [workerId, applications, API_BASE]);

// При загрузке компонента можно сначала попробовать взять из кэша
useEffect(() => {
  if (workerId) {
    try {
      const cached = localStorage.getItem(`worker_${workerId}_responseMap`);
      const timestamp = localStorage.getItem(`worker_${workerId}_responseMap_timestamp`);
      
      // Если кэш свежий (менее 5 минут)
      if (cached && timestamp && (Date.now() - parseInt(timestamp) < 5 * 60 * 1000)) {
        console.log('Используем кэшированные ответы');
        setResponseMap(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('Ошибка чтения кэша:', e);
    }
  }
}, [workerId]);

  // Функция проверки, есть ли ответ работника на заявку
  const hasWorkerResponded = useCallback((applicationId) => {
    if (!workerId) return false;

    console.log(`Проверка ответа для заявки ${applicationId}, workerId: ${workerId}`);

    // 1. Проверяем локальные данные
    if (workerResponses.length > 0) {
      const found = workerResponses.some(response =>
        String(response.application_id) === String(applicationId)
      );
      if (found) {
        console.log(`✓ Локально: работник ${workerId} отвечал на заявку ${applicationId}`);
        return true;
      }
    }

    // 2. Проверяем localStorage
    try {
      const stored = localStorage.getItem(`worker_${workerId}_responses`);
      if (stored) {
        const storedIds = JSON.parse(stored);
        if (storedIds.includes(parseInt(applicationId))) {
          console.log(`✓ localStorage: работник ${workerId} отвечал на заявку ${applicationId}`);
          return true;
        }
      }
    } catch (e) {
      console.warn('Ошибка проверки localStorage:', e);
    }

    // 3. Проверяем данные заявки
    const application = applications.find(app => app.id === applicationId);
    if (application) {
      console.log(`Данные заявки ${applicationId}:`, {
        worker_id: application.worker_id,
        worker_response: application.worker_response,
        status: application.status
      });

      // Если в заявке есть worker_response и worker_id совпадает
      if (application.worker_response && String(application.worker_id) === String(workerId)) {
        console.log(`✓ Данные заявки: работник ${workerId} отвечал на заявку ${applicationId}`);
        return true;
      }

      // Если заявка в статусе pending и worker_id совпадает
      if (application.status === 'pending' && String(application.worker_id) === String(workerId)) {
        console.log(`✓ Статус pending: работник ${workerId} назначен на заявку ${applicationId}`);
        return true;
      }
    }

    console.log(`✗ Работник ${workerId} НЕ отвечал на заявку ${applicationId}`);
    return false;
  }, [workerId, workerResponses, applications]);

  // Инициализация: загружаем ответы при монтировании
  useEffect(() => {
    loadWorkerResponses();
  }, [loadWorkerResponses]);

  // Функция для полного обновления данных
  const refreshAllData = useCallback(async () => {
    await loadApplications(filters);
    await loadWorkerResponses();
  }, [loadApplications, filters, loadWorkerResponses]);

  const filteredApplications = ultraSafeArray(applications).filter(app => {
    // Применяем фильтр по статусу из выпадающего списка
    if (filters.status === 'all') return true;
    return app.status === filters.status;
  });

  useEffect(() => {
    loadApplications(filters);
  }, [filters, loadApplications]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const statusOptions = [
    { value: 'all', label: 'Все заявки' },
    { value: 'new', label: 'Новые' },
    { value: 'pending', label: 'Принятые' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'assigned', label: 'Исполняются' },
    { value: 'completed', label: 'Завершенные' },
    { value: 'cancelled', label: 'Отмененные' }
  ];

  if (loading || responsesLoading) {
    return (
      <div className="applications-loading">
        <LoadingSpinner text="Загрузка заявок..." />
      </div>
    );
  }

  return (
    <div className="applications-list-page">
      <div className="applications-header">
        <h1>Заявки клиентов</h1>
        <p>Просмотр и управление заявками, которые соответствуют вашему портфолио</p>
      </div>

      <div className="applications-filters">
        <div className="filter-group">
          <label>Статус:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="applications-info">
          <span>Найдено заявок: {filteredApplications.length}</span>
        </div>
      </div>

      <div className="applications-grid">
        {filteredApplications.length === 0 ? (
          <div className="no-applications">
            <div className="no-applications-icon">📋</div>
            <h3>Нет заявок</h3>
            <p>Заявки, соответствующие вашему портфолио, появятся здесь</p>
          </div>
        ) : (
          filteredApplications.map((application, index) => {
            // Проверяем, есть ли ответ работника на эту заявку
            const workerHasResponded = hasWorkerResponded(application.id);

            return (
              <ApplicationCard
                key={application.id || index}
                application={application}
                onUpdate={() => loadApplications(filters)}
                workerId={workerId}
                workerHasResponded={responseMap[application.id] || false}
                onResponseSent={() => {
                  // Обновляем локально
                  setResponseMap(prev => ({
                    ...prev,
                    [application.id]: true
                  }));
                  loadApplications(filters);
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ApplicationsList;