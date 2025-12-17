import React, { useState } from 'react';
import './ApplicationDetails.css';

const ApplicationDetails = ({ 
  application, 
  workerResponses = [], 
  onAddResponse, 
  onClose, 
  canEdit = false,
  canRespond = false 
}) => {
  const [responseText, setResponseText] = useState('');
  const [editableData, setEditableData] = useState(application);

  const handleSave = () => {
    // Сохранение изменений
    console.log('Сохраненные данные:', editableData);
    onClose();
  };

  const handleSubmitResponse = () => {
    if (responseText.trim()) {
      onAddResponse(application.id, responseText);
      setResponseText('');
    }
  };

  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content application-details">
        <div className="modal-header">
          <h2>Детали заявки #{application.id}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="details-content">
          <div className="details-section">
            <h3>Информация о клиенте</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Имя:</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={editableData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                ) : (
                  <span>{application.name}</span>
                )}
              </div>

              <div className="detail-item">
                <label>Телефон:</label>
                {canEdit ? (
                  <input
                    type="tel"
                    value={editableData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                ) : (
                  <span>{application.phone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Информация о заказе</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Тип товара:</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={editableData.productType}
                    onChange={(e) => handleFieldChange('productType', e.target.value)}
                  />
                ) : (
                  <span>{application.productType}</span>
                )}
              </div>

              <div className="detail-item">
                <label>Товар:</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={editableData.product}
                    onChange={(e) => handleFieldChange('product', e.target.value)}
                  />
                ) : (
                  <span>{application.product}</span>
                )}
              </div>

              <div className="detail-item">
                <label>Материал:</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={editableData.material}
                    onChange={(e) => handleFieldChange('material', e.target.value)}
                  />
                ) : (
                  <span>{application.material}</span>
                )}
              </div>

              <div className="detail-item">
                <label>Размер:</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={editableData.size}
                    onChange={(e) => handleFieldChange('size', e.target.value)}
                  />
                ) : (
                  <span>{application.size}</span>
                )}
              </div>
            </div>
          </div>

          <div className="details-section">
            <label>Комментарий клиента:</label>
            {canEdit ? (
              <textarea
                value={editableData.comment}
                onChange={(e) => handleFieldChange('comment', e.target.value)}
                rows="3"
              />
            ) : (
              <p className="comment-text">{application.comment || 'Нет комментария'}</p>
            )}
          </div>

          {/* Ответы работников */}
          {workerResponses.length > 0 && (
            <div className="details-section">
              <h3>Ответы работников</h3>
              <div className="responses-list">
                {workerResponses.map(response => (
                  <div key={response.id} className="response-item">
                    <div className="response-header">
                      <strong>{response.workerName}</strong>
                      <span className="response-date">
                        {new Date(response.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="response-text">{response.response}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Форма для ответа работника */}
          {canRespond && (
            <div className="details-section">
              <h3>Добавить ответ</h3>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Введите ваш ответ..."
                rows="4"
                className="response-textarea"
              />
              <button 
                className="btn btn-primary"
                onClick={handleSubmitResponse}
                disabled={!responseText.trim()}
              >
                Отправить ответ
              </button>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {canEdit && (
            <button className="btn btn-primary" onClick={handleSave}>
              Сохранить изменения
            </button>
          )}
          <button className="btn btn-outline" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;