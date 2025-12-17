// src/admin/components/Products/ProductTypeCard.js
import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import './ProductTypeCard.css';

const ProductTypeCard = ({ productType, onUpdate, onDelete, onViewProducts }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: productType.name || '',
    description: productType.description || '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(productType.image_url || null);
  const [imageError, setImageError] = useState(false);

  // Функция для получения полного URL изображения
  const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  console.log('🔍 Image path:', imagePath); // Добавьте этот лог
  
  // Если это уже полный URL, возвращаем как есть
  if (imagePath.startsWith('http')) return imagePath;
  
  // Если путь начинается с /img/, убираем /api из URL
  if (imagePath.startsWith('/img/')) {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    // Убедитесь, что baseUrl НЕ заканчивается на /api
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    return `${cleanBaseUrl}${imagePath}`;
  }
  
  return imagePath;
};

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('description', editData.description);
      
      if (editData.image) {
        formData.append('image', editData.image);
      }
      
      await onUpdate(productType.id, formData);
      setIsEditing(false);
      setImageError(false);
    } catch (error) {
      console.error('Error updating product type:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: productType.name || '',
      description: productType.description || '',
      image: null
    });
    setImagePreview(getImageUrl(productType.image_url));
    setImageError(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Удалить тип товара "${productType.name}"?`)) {
      onDelete(productType.id);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData(prev => ({ ...prev, image: file }));
      setImageError(false);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setEditData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Заглушка для изображения
  const ImagePlaceholder = () => (
    <div className="image-placeholder">
      <div className="placeholder-icon">📦</div>
      <div className="placeholder-text">Нет изображения</div>
    </div>
  );

  return (
    <div className="product-type-card">
      <div className="product-type-header">
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
            className="edit-input"
            placeholder="Название типа"
          />
        ) : (
          <h3 className="type-name">{productType.name}</h3>
        )}
        
        <div className="type-actions">
          {isEditing ? (
            <>
              <button className="action-btn save-btn" onClick={handleSave}>
                ✅
              </button>
              <button className="action-btn cancel-btn" onClick={handleCancel}>
                ❌
              </button>
            </>
          ) : (
            <>
              <button 
                className="action-btn edit-btn"
                onClick={() => setIsEditing(true)}
                title="Редактировать"
              >
                ✏️
              </button>
              <button 
                className="action-btn view-btn"
                onClick={() => onViewProducts(productType)}
                title="Просмотреть товары"
              >
                👁️
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={handleDelete}
                title="Удалить"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      <div className="product-type-body">
        {/* Отображение/редактирование изображения */}
        <div className="type-image-section">
          {isEditing ? (
            <div className="image-edit-section">
              {imagePreview ? (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Предпросмотр" 
                    className="type-image-preview" 
                    onError={handleImageError}
                  />
                  <button
                    type="button"
                    className="remove-image-btn small"
                    onClick={removeImage}
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="image-upload-mini">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id={`type-image-${productType.id}`}
                    className="image-upload-input"
                  />
                  <label htmlFor={`type-image-${productType.id}`} className="image-upload-label-mini">
                    📷 Загрузить изображение
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="type-image-display">
              {productType.image_url && !imageError ? (
                <img 
                  src={getImageUrl(productType.image_url)} 
                  alt={productType.name}
                  className="type-image"
                  onError={handleImageError}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={editData.description}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            className="edit-textarea"
            placeholder="Описание типа товара"
            rows="3"
          />
        ) : (
          <p className="type-description">
            {productType.description || 'Описание отсутствует'}
          </p>
        )}

        <div className="type-stats-ad-pro">
          <div className="stat-item-ad-pro">
            <span className="stat-label-ad-pro">Товаров:</span>
            <span className="stat-value-ad-pro">{productType.products_count || 0}</span>
          </div>
          
          <div className="stat-item-ad-pro">
            <span className="stat-label-ad-pro">Создан:</span>
            <span className="stat-value-ad-pro">{formatDate(productType.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTypeCard;