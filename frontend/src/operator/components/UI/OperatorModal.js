import React, { useEffect } from 'react';
import './OperatorModal.css';

const OperatorModal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.keyCode === 27) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="operator-modal-overlay" onClick={onClose}>
      <div 
        className={`operator-modal-content operator-modal-${size}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="operator-modal-header">
          <h2 className="operator-modal-title">{title}</h2>
          <button className="operator-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="operator-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OperatorModal;