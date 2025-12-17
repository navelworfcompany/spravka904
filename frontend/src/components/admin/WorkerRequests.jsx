import React, { useState, useEffect } from 'react';
import './WorkerRequests.css';

const WorkerRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    // Заглушка данных
    const mockRequests = [
      {
        id: 1,
        organization: 'ООО "СтройМастер"',
        phone: '+79998887766',
        email: 'stroy@example.com',
        createdAt: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: 2,
        organization: 'ИП Петров',
        phone: '+79997776655',
        email: 'petrov@example.com',
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ];
    setRequests(mockRequests);
  };

  const handleApprove = (requestId) => {
    if (window.confirm('Одобрить запрос на регистрацию?')) {
      // API вызов для одобрения
      setRequests(prev => prev.filter(req => req.id !== requestId));
      // Здесь будет создание пользователя с ролью worker
    }
  };

  const handleReject = (requestId) => {
    if (window.confirm('Отклонить запрос на регистрацию?')) {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="worker-requests">
      <div className="management-header">
        <h2>Запросы на регистрацию работников</h2>
      </div>

      {requests.length === 0 ? (
        <div className="no-requests">
          <p>Нет pending запросов на регистрацию</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-info">
                <h3>{request.organization}</h3>
                <div className="request-details">
                  <p><strong>Телефон:</strong> {request.phone}</p>
                  <p><strong>Email:</strong> {request.email}</p>
                  <p><strong>Дата подачи:</strong> {formatDate(request.createdAt)}</p>
                </div>
              </div>
              
              <div className="request-actions">
                <button 
                  className="btn btn-success"
                  onClick={() => handleApprove(request.id)}
                >
                  Одобрить
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleReject(request.id)}
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerRequests;