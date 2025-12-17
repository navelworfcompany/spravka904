// src/admin/components/Products/CreateProductModal.js
import React, { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import Modal from '../../components/UI/Modal';
import './CreateProductModal.css';

const CreateProductModal = ({ isOpen, onClose, onCreate, productTypes, selectedType }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    material: '',
    size: '',
    image: null
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  
  // Используем хук useApi для управления состоянием загрузки и ошибок
  const { loading, error, fetchWithFormData, clearError } = useApi();

  const predefinedMaterials = ['Мрамор', 'Гранит'];
  const predefinedSizes = ['10х10', '20х20', '30х30'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно быть не менее 2 символов';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Цена должна быть положительным числом';
    }

    if (!selectedType) {
      newErrors.type = 'Не выбран тип товара';
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

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('type_id', selectedType.id.toString());
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('price', formData.price || '0');
    formDataToSend.append('materials', JSON.stringify(formData.material ? [formData.material] : []));
    formDataToSend.append('sizes', JSON.stringify(formData.size ? [formData.size] : []));

    // Добавляем изображение если есть
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    console.log('🔄 Creating product...');
    
    // Используем хук useApi для отправки
    const result = await fetchWithFormData('/products', formDataToSend, {
      errorMessage: 'Ошибка при создании товара'
    });

    console.log('✅ Product created successfully:', result);
    
    // ВЫЗОВИТЕ onCreate ПЕРЕД закрытием модалки
    if (onCreate && result.product) {
      await onCreate(result.product); // ← передаем только product, не весь result
    }
    
    // ЗАКРОЙТЕ модалку ПОСЛЕ успешного создания
    handleClose();
    
  } catch (error) {
    console.error('Error creating product:', error);
    setErrors({ submit: error.message });
  }
};

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      material: '',
      size: '',
      image: null
    });
    setImagePreview(null);
    setErrors({});
    clearError(); // Очищаем ошибки из хука
    onClose();
  };

  const handleMaterialChange = (e) => {
    setFormData(prev => ({
      ...prev,
      material: e.target.value
    }));
  };

  const handleSizeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      size: e.target.value
    }));
  };

  const clearMaterial = () => {
    setFormData(prev => ({
      ...prev,
      material: ''
    }));
  };

  const clearSize = () => {
    setFormData(prev => ({
      ...prev,
      size: ''
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать товар"
      size="large"
    >
      <form className="create-product-form-ad-p" onSubmit={handleSubmit}>
        <div className="form-row-ad-p">
          <div className="form-group-ad-p">
            <label className="form-label-ad-p">Название товара *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`form-input-ad-p ${errors.name ? 'error-ad-p' : ''}`}
              placeholder="Название товара"
            />
            {errors.name && <span className="error-text-ad-p">{errors.name}</span>}
          </div>

          <div className="form-group-ad-p">
            <label className="form-label-ad-p">Цена (₽) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className={`form-input-ad-p ${errors.price ? 'error-ad-p' : ''}`}
              placeholder="0"
              min="0"
              step="0.01"
            />
            {errors.price && <span className="error-text-ad-p">{errors.price}</span>}
          </div>
        </div>

        <div className="form-group-ad-p">
          <label className="form-label-ad-p">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="form-textarea-ad-p"
            placeholder="Описание товара..."
            rows="4"
          />
        </div>

        {/* Секция загрузки изображения */}
        <div className="form-group-ad-p">
          <label className="form-label-ad-p">Изображение товара</label>
          <div className="image-upload-section-ad-p">
            {!imagePreview ? (
              <div className="image-upload-area-ad-p">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-upload-input-ad-p"
                  id="product-image-upload-ad-p"
                />
                <label htmlFor="product-image-upload-ad-p" className="image-upload-label-ad-p">
                  <div className="upload-placeholder-ad-p">
                    <span className="upload-icon-ad-p">📷</span>
                    <span className="upload-text-ad-p">Нажмите для загрузки изображения</span>
                    <span className="upload-hint-ad-p">PNG, JPG до 5MB</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="image-preview-ad-p">
                <img src={imagePreview} alt="Предпросмотр" className="preview-image-ad-p" />
                <button
                  type="button"
                  className="remove-image-btn-ad-p"
                  onClick={removeImage}
                >
                  Удалить изображение
                </button>
              </div>
            )}
            {errors.image && <span className="error-text-ad-p">{errors.image}</span>}
          </div>
        </div>

        <div className="form-row-ad-p">
          <div className="form-group-ad-p">
            <label className="form-label-ad-p">Материал</label>
            <div className="select-with-clear-ad-p">
              <select 
                value={formData.material}
                onChange={handleMaterialChange}
                className="form-select-ad-p"
              >
                <option value="">Выберите материал</option>
                {predefinedMaterials.map((material, index) => (
                  <option key={index} value={material}>
                    {material}
                  </option>
                ))}
              </select>
              {formData.material && (
                <button 
                  type="button" 
                  className="clear-selection-btn-ad-p"
                  onClick={clearMaterial}
                  title="Очистить выбор"
                >
                  ×
                </button>
              )}
            </div>
            {formData.material && (
              <div className="selected-value-ad-p">
                <span className="selected-label-ad-p">Выбранный материал:</span>
                <span className="selected-tag-ad-p">
                  {formData.material}
                  <button
                    type="button"
                    className="tag-remove-ad-p"
                    onClick={clearMaterial}
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="form-group-ad-p">
            <label className="form-label-ad-p">Размер</label>
            <div className="select-with-clear-ad-p">
              <select 
                value={formData.size}
                onChange={handleSizeChange}
                className="form-select-ad-p"
              >
                <option value="">Выберите размер</option>
                {predefinedSizes.map((size, index) => (
                  <option key={index} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {formData.size && (
                <button 
                  type="button" 
                  className="clear-selection-btn-ad-p"
                  onClick={clearSize}
                  title="Очистить выбор"
                >
                  ×
                </button>
              )}
            </div>
            {formData.size && (
              <div className="selected-value-ad-p">
                <span className="selected-label-ad-p">Выбранный размер:</span>
                <span className="selected-tag-ad-p">
                  {formData.size}
                  <button
                    type="button"
                    className="tag-remove-ad-p"
                    onClick={clearSize}
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {selectedType && (
          <div className="type-info-ad-p">
            <strong>Тип товара:</strong> {selectedType.name} (ID: {selectedType.id})
          </div>
        )}

        {!selectedType && errors.type && (
          <div className="error-text-ad-p">{errors.type}</div>
        )}

        {/* Показываем ошибки из хука useApi */}
        {error && (
          <div className="submit-error-ad-p">{error}</div>
        )}

        {errors.submit && (
          <div className="submit-error-ad-p">{errors.submit}</div>
        )}

        <div className="form-actions-ad-p">
          <button
            type="button"
            className="cancel-btn-ad-p"
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="submit-btn-ad-p"
            disabled={loading || !selectedType}
          >
            {loading ? 'Создание...' : 'Создать товар'}
          </button>
        </div>
      </form>
    </Modal>
  );}

export default CreateProductModal;