import React, { useState } from 'react';
import Button from '../../../../components/common/Button';
import './PriceModal.css';

const PriceModal = ({ isOpen, product, onClose, onSubmit }) => {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const numericPrice = parseFloat(price.replace(',', '.'));
    
    if (!numericPrice || numericPrice <= 0) {
      alert('Пожалуйста, введите корректную цену');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(numericPrice);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="price-modal">
        <div className="modal-header">
          <h3>Укажите вашу цену</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="product-info">
            <h4>{product?.name}</h4>
            <p className="product-type">{product?.product_type?.name}</p>
            {product?.price && (
              <p className="base-price">Базовая цена: от {product.price} ₽</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="price-porwok-input-group">
              <label htmlFor="price">Ваша цена (₽)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Введите вашу цену"
                required
              />
              <small>Цена должна быть положительным числом</small>
            </div>
            
            <div className="modal-porwok-actions">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Добавление...' : 'Добавить в портфолио'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PriceModal;