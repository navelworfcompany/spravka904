// src/admin/components/Products/CreateProductTypeModal.js
import React, { useState } from 'react';
import Modal from '../../components/UI/Modal';
import './CreateProductTypeModal.css';

const CreateProductTypeModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null // новый state для изображения
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно быть не менее 2 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: 'Пожалуйста, выберите файл изображения' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'Размер файла не должен превышать 5MB' });
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setErrors({ ...errors, image: null });
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Создаем FormData для отправки файла
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      await onCreate(formDataToSend);
      handleClose();
    } catch (error) {
      console.error('Error creating product type:', error);
      setErrors({ submit: error.message || 'Ошибка при создании типа товара' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      image: null
    });
    setImagePreview(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать тип товара"
      size="medium"
    >
      <form className="create-product-type-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Название типа *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Например: Памятники, Оградки, Цветы..."
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="form-textarea"
            placeholder="Описание типа товара..."
            rows="4"
          />
        </div>

        {/* Секция загрузки изображения для типа товара */}
        <div className="form-group">
          <label className="form-label">Изображение типа товара</label>
          <div className="image-upload-section">
            {!imagePreview ? (
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-upload-input"
                  id="product-type-image-upload"
                />
                <label htmlFor="product-type-image-upload" className="image-upload-label">
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Нажмите для загрузки изображения</span>
                    <span className="upload-hint">PNG, JPG до 5MB</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="image-preview">
                <img src={imagePreview} alt="Предпросмотр" className="preview-image" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={removeImage}
                >
                  Удалить изображение
                </button>
              </div>
            )}
            {errors.image && <span className="error-text">{errors.image}</span>}
          </div>
        </div>

        {errors.submit && (
          <div className="submit-error">{errors.submit}</div>
        )}

        <div className="form-actions-ad-t">
          <button
            type="button"
            className="cancel-btn-ad-t"
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="submit-btn-ad-t"
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать тип товара'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProductTypeModal;