import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import './OperatorProductTypeCard.css';

const OperatorProductTypeCard = ({ productType, onViewProducts }) => {
  const [imageError, setImageError] = useState(false);

  // Функция для получения полного URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) return imagePath;
    
    if (imagePath.startsWith('/img/')) {
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : window.location.origin;
      return `${baseUrl}${imagePath}`;
    }
    
    return imagePath;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Заглушка для изображения
  const ImagePlaceholder = () => (
    <div className="operator-image-placeholder">
      <div className="operator-placeholder-icon">📦</div>
      <div className="operator-placeholder-text">Нет изображения</div>
    </div>
  );

  return (
    <div className="operator-product-type-card">
      <div className="operator-product-type-header">
        <h3 className="operator-type-name">{productType.name}</h3>
        
        <div className="operator-type-actions">
          <button 
            className="operator-action-btn operator-view-btn"
            onClick={() => onViewProducts(productType)}
            title="Просмотреть товары"
          >
            👁️ Просмотр
          </button>
        </div>
      </div>

      <div className="operator-product-type-body">
        {/* Отображение изображения */}
        <div className="operator-type-image-section">
          <div className="operator-type-image-display">
            {productType.image_url && !imageError ? (
              <img 
                src={getImageUrl(productType.image_url)} 
                alt={productType.name}
                className="operator-type-image"
                onError={handleImageError}
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </div>

        <p className="operator-type-description">
          {productType.description || 'Описание отсутствует'}
        </p>

        <div className="operator-type-stats-op">
          <div className="operator-stat-item-op">
            <span className="operator-stat-label-op">Товаров:</span>
            <span className="operator-stat-value-op">
              {productType.products_count || 0}
            </span>
          </div>
          
          <div className="operator-stat-item-op">
            <span className="operator-stat-label-op">Создан:</span>
            <span className="operator-stat-value-op">
              {formatDate(productType.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorProductTypeCard;