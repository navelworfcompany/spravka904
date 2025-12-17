import React, { useEffect } from 'react';
import Button from './Button';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  actions,
  hideHeader = false
}) => {
  // Обработка нажатия Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Обработчик клика по оверлею
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalClass = `modal modal-${size} ${className}`.trim();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={modalClass}>
        {/* Заголовок модального окна */}
        {!hideHeader && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="small"
                className="modal-close-btn-my"
                onClick={onClose}                
                aria-label="Закрыть модальное окно"
              >x</Button>
            )}
          </div>
        )}

        {/* Содержимое модального окна */}
        <div className="modal-content">
          {children}
        </div>

        {/* Действия (кнопки) внизу модального окна */}
        {actions && (
          <div className="modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Специализированные модальные окна

// Модальное окно подтверждения
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтверждение',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'primary',
  loading = false
}) => {
  const actions = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={onConfirm}
        loading={loading}
        disabled={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={actions}
    >
      <div className="confirm-modal-content">
        <div className="confirm-icon">⚠️</div>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
};

// Модальное окно успеха
export const SuccessModal = ({
  isOpen,
  onClose,
  title = 'Успешно!',
  message,
  buttonText = 'OK',
  autoCloseDelay = 0
}) => {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  const actions = (
    <Button variant="primary" onClick={onClose}>
      {buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={actions}
    >
      <div className="success-modal-content">
        <div className="success-icon">✅</div>
        <p className="success-message">{message}</p>
      </div>
    </Modal>
  );
};

// Модальное окно ошибки
export const ErrorModal = ({
  isOpen,
  onClose,
  title = 'Ошибка',
  message,
  error,
  buttonText = 'Понятно'
}) => {
  const actions = (
    <Button variant="danger" onClick={onClose}>
      {buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={actions}
    >
      <div className="error-modal-content">
        <div className="error-icon">❌</div>
        <p className="error-message">{message}</p>
        {error && (
          <details className="error-details">
            <summary>Подробности об ошибке</summary>
            <code>{error.toString()}</code>
          </details>
        )}
      </div>
    </Modal>
  );
};

// Модальное окно загрузки
export const LoadingModal = ({
  isOpen,
  title = 'Загрузка',
  message = 'Пожалуйста, подождите...'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Запрещаем закрытие
      title={title}
      size="small"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="loading-modal-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </Modal>
  );
};

export default Modal;