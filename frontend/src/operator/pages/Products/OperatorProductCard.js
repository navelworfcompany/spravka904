import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import './OperatorProductCard.css';

const OperatorProductCard = ({ product }) => {
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

  const getFormattedPrice = (price) => {
    if (!price && price !== 0) return 'Цена не указана';
    return `₽${parseInt(price).toLocaleString('ru-RU')}`;
  };

  // Заглушка для изображения
  const ImagePlaceholder = () => (
    <div className="operator-image-placeholder">
      <div className="operator-placeholder-icon">📷</div>
      <div className="operator-placeholder-text">Нет изображения</div>
    </div>
  );

  return (
    <div className="operator-product-card">
      <div className="operator-product-header">
        <h3 className="operator-product-name">{product.name}</h3>
        
        <div className="operator-product-price">
          <span className="operator-price-value">
            {getFormattedPrice(product.price)}
          </span>
        </div>
      </div>

      <div className="operator-product-body">
        {/* Отображение изображения */}
        <div className="operator-product-image-section">
          <div className="operator-product-image-display">
            {product.image_url && !imageError ? (
              <img 
                src={getImageUrl(product.image_url)} 
                alt={product.name}
                className="operator-product-image"
                onError={handleImageError}
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </div>

        <p className="operator-product-description">
          {product.description || 'Описание отсутствует'}
        </p>

        <div className="operator-product-details">
          {(product.materials && product.materials.length > 0) && (
            <div className="operator-detail-item">
              <span className="operator-detail-label">Материалы:</span>
              <div className="operator-tags-list">
                {product.materials.map((material, index) => (
                  <span key={index} className="operator-tag">
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(product.sizes && product.sizes.length > 0) && (
            <div className="operator-detail-item">
              <span className="operator-detail-label">Размеры:</span>
              <div className="operator-tags-list">
                {product.sizes.map((size, index) => (
                  <span key={index} className="operator-tag">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="operator-product-meta">
          <span className="operator-meta-item">
            Создан: {formatDate(product.created_at)}
          </span>
          {product.type_name && (
            <span className="operator-meta-item operator-type">
              Тип: {product.type_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorProductCard;