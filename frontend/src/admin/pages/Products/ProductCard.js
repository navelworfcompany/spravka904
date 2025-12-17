// src/admin/components/Products/ProductCard.js
import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import './ProductCard.css';

const ProductCard = ({ product, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price || '',
    materials: Array.isArray(product.materials) ? product.materials : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    image: null
  });
  const [newMaterial, setNewMaterial] = useState('');
  const [newSize, setNewSize] = useState('');
  const [imagePreview, setImagePreview] = useState(product.image_url || null);
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
      formData.append('price', editData.price);
      formData.append('materials', JSON.stringify(editData.materials));
      formData.append('sizes', JSON.stringify(editData.sizes));
      
      if (editData.image) {
        formData.append('image', editData.image);
      }
      
      await onUpdate(product.id, formData);
      setIsEditing(false);
      setImageError(false);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      materials: Array.isArray(product.materials) ? product.materials : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      image: null
    });
    setImagePreview(getImageUrl(product.image_url));
    setImageError(false);
    setIsEditing(false);
  };

const handleDelete = () => {
  if (window.confirm(`Удалить товар "${product.name}"?`)) {
    // Передаем весь объект товара для оптимистичного обновления
    onDelete(product.id, product);
  }
};

  const addMaterial = () => {
    if (newMaterial.trim() && !editData.materials.includes(newMaterial.trim())) {
      setEditData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (material) => {
    setEditData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m !== material)
    }));
  };

  const addSize = () => {
    if (newSize.trim() && !editData.sizes.includes(newSize.trim())) {
      setEditData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()]
      }));
      setNewSize('');
    }
  };

  const removeSize = (size) => {
    setEditData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size)
    }));
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

  const getFormattedPrice = (price) => {
    return price ? `₽${parseInt(price).toLocaleString('ru-RU')}` : 'Цена не указана';
  };

  // Заглушка для изображения
  const ImagePlaceholder = () => (
    <div className="image-placeholder">
      <div className="placeholder-icon">📷</div>
      <div className="placeholder-text">Нет изображения</div>
    </div>
  );

  return (
    <div className="product-card">
      <div className="product-header">
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
            className="edit-input"
            placeholder="Название товара"
          />
        ) : (
          <h3 className="product-name">{product.name}</h3>
        )}
        
        <div className="product-actions">
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

      <div className="product-body">
        {/* Отображение/редактирование изображения */}
        <div className="product-image-section">
          {isEditing ? (
            <div className="image-edit-section">
              {imagePreview ? (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Предпросмотр" 
                    className="product-image-preview" 
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
                    id={`product-image-${product.id}`}
                    className="image-upload-input"
                  />
                  <label htmlFor={`product-image-${product.id}`} className="image-upload-label-mini">
                    📷 Загрузить изображение
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="product-image-display">
              {product.image_url && !imageError ? (
                <img 
                  src={getImageUrl(product.image_url)} 
                  alt={product.name}
                  className="product-image"
                  onError={handleImageError}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <>
            <div className="edit-group">
              <label className="edit-label">Описание</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="edit-textarea"
                placeholder="Описание товара..."
                rows="3"
              />
            </div>

            <div className="edit-group">
              <label className="edit-label">Цена (₽)</label>
              <input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
                className="edit-input"
                placeholder="0"
                min="0"
              />
            </div>

            <div className="edit-group">
              <label className="edit-label">Материалы</label>
              <div className="tags-input">
                <div className="tags-list">
                  {editData.materials.map((material, index) => (
                    <span key={index} className="tag">
                      {material}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeMaterial(material)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-group">
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    className="tag-input"
                    placeholder="Добавить материал..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                  />
                  <button type="button" className="tag-add-btn" onClick={addMaterial}>
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="edit-group">
              <label className="edit-label">Размеры</label>
              <div className="tags-input">
                <div className="tags-list">
                  {editData.sizes.map((size, index) => (
                    <span key={index} className="tag">
                      {size}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeSize(size)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-group">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="tag-input"
                    placeholder="Добавить размер..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  />
                  <button type="button" className="tag-add-btn" onClick={addSize}>
                    +
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="product-description">
              {product.description || 'Описание отсутствует'}
            </p>

            <div className="product-details">
              <div className="detail-item">
                <span className="detail-label">Цена:</span>
                <span className="detail-value price">
                  {getFormattedPrice(product.price)}
                </span>
              </div>

              {product.materials && product.materials.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Материалы:</span>
                  <div className="tags-list">
                    {product.materials.map((material, index) => (
                      <span key={index} className="tag">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Размеры:</span>
                  <div className="tags-list">
                    {product.sizes.map((size, index) => (
                      <span key={index} className="tag">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="product-meta">
              <span className="meta-item">
                Создан: {formatDate(product.created_at)}
              </span>
              {product.type_name && (
                <span className="meta-item type">
                  Тип: {product.type_name}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductCard;