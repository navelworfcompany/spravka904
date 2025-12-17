import React, { useState, useEffect } from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, applicationData }) => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(24 * 60 * 60);

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
    } else if (cleaned.length === 10) {
      return `+7 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`;
    }
    
    return phone;
  };

  const getApplicationDetails = () => {
    if (!applicationData) return null;

    return (
      <div className="application-details">
        <h4>Детали вашей заявки:</h4>
        <div className="details-content">
          {applicationData.applicationId && (
            <div className="detail-succ-item">
              <strong>Номер заявки:</strong> 
              <span className="detail-value">{applicationData.applicationId}</span>
            </div>
          )}

          {applicationData.productType && (
            <div className="detail-succ-item">
              <strong>Тип памятника:</strong> 
              <span className="detail-value">{applicationData.productType.name}</span>
            </div>
          )}
          
          {applicationData.product && (
            <div className="detail-succ-item">
              <strong>Памятник:</strong> 
              <span className="detail-value">{applicationData.product.name}</span>
            </div>
          )}
          
          {applicationData.material && (
            <div className="detail-succ-item">
              <strong>Материал:</strong> 
              <span className="detail-value">{applicationData.material}</span>
            </div>
          )}
          
          {applicationData.size && (
            <div className="detail-succ-item">
              <strong>Размер:</strong> 
              <span className="detail-value">{applicationData.size}</span>
            </div>
          )}
          
          {applicationData.contact && (
            <>
              <div className="detail-succ-item">
                <strong>Заказчик:</strong> 
                <span className="detail-value">{applicationData.contact.name}</span>
              </div>
              <div className="detail-succ-item">
                <strong>Телефон:</strong> 
                <span className="detail-value">
                  {formatPhoneNumber(applicationData.contact.phone)}
                </span>
              </div>
              <div className="detail-succ-item">
                <strong>Email:</strong> 
                <span className="detail-value">{applicationData.contact.email}</span>
              </div>
            </>
          )}
          
          {applicationData.comment && (
            <div className="detail-succ-item comment-item-succ">
              <strong>Комментарий:</strong> 
              <span className="detail-succ-value comment-text-succ">{applicationData.comment}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-succ-overlay">
      <div className="modal-succ-content success-modal">
        <div className="modal-header">
          <div className="success-icon">✅</div>
          <h2>Заявка успешно отправлена!</h2>
        </div>
        
        <div className="modal-body">
          <div className="timer-section">
            <p className="timer-text">
              У исполнителей осталось <span className="timer">{formatTime(timeLeft)}</span>, чтобы подготовить предложения по вашей заявке.
            </p>
          </div>
          
          <p className="info-text">
            Мы также отправили на указанный Вами email письмо со ссылкой и данными для входа в личный кабинет, 
            где Вы сможете просматривать предложения от исполнителей.
          </p>
                
          {getApplicationDetails()}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;