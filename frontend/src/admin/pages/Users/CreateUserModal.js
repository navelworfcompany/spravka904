// src/admin/components/Users/CreateUserModal.js
import React, { useState } from 'react';
import { USER_ROLES } from '../../utils/constants';
import Modal from '../../components/UI/Modal';
import './CreateUserModal.css';

const CreateUserModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'user',
    organization: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        newErrors.phone = 'Неверный формат телефона';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Подготавливаем данные для отправки
      const submitData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email || null,
      };

      await onCreate(submitData);
      handleClose();
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ 
        submit: error.response?.data?.message || error.message || 'Ошибка при создании пользователя' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'user',
      organization: '',
      password: ''
    });
    setErrors({});
    onClose();
  };

  const handlePhoneChange = (value) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = '+7';
    
    if (numbers.length > 1) {
      formatted += ` (${numbers.slice(1, 4)}`;
    }
    if (numbers.length > 4) {
      formatted += `) ${numbers.slice(4, 7)}`;
    }
    if (numbers.length > 7) {
      formatted += `-${numbers.slice(7, 9)}`;
    }
    if (numbers.length > 9) {
      formatted += `-${numbers.slice(9, 11)}`;
    }
    
    setFormData(prev => ({ ...prev, phone: formatted }));
    // Очищаем ошибку при вводе
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    // Очищаем ошибку пароля
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при вводе
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать пользователя"
      size="medium"
    >
      <form className="create-user-form-a-u" onSubmit={handleSubmit}>
        <div className="form-grid-a-u">
          <div className="form-group-a-u">
            <label className="form-label-a-u">
              Имя <span className="required-star-a-u">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`form-input-a-u ${errors.name ? 'error-a-u' : ''}`}
              placeholder="Введите имя пользователя"
              disabled={loading}
            />
            {errors.name && <span className="error-text-a-u">{errors.name}</span>}
          </div>

          <div className="form-group-a-u">
            <label className="form-label-a-u">
              Телефон <span className="required-star-a-u">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`form-input-a-u ${errors.phone ? 'error-a-u' : ''}`}
              placeholder="+7 (XXX) XXX-XX-XX"
              disabled={loading}
            />
            {errors.phone && <span className="error-text-a-u">{errors.phone}</span>}
            <div className="input-hint-a-u">Формат: +7 (XXX) XXX-XX-XX</div>
          </div>

          <div className="form-group-a-u">
            <label className="form-label-a-u">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="form-input-a-u"
              placeholder="email@example.com"
              disabled={loading}
            />
            <div className="input-hint-a-u">Необязательное поле</div>
          </div>

          <div className="form-group-a-u">
            <label className="form-label-a-u">Роль</label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="form-select-a-u"
              disabled={loading}
            >
              {Object.entries(USER_ROLES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group-a-u">
            <label className="form-label-a-u">Организация</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              className="form-input-a-u"
              placeholder="Название организации"
              disabled={loading}
            />
            <div className="input-hint-a-u">Необязательное поле</div>
          </div>

          <div className="form-group-a-u full-width-a-u">
            <label className="form-label-a-u">
              Пароль <span className="required-star-a-u">*</span>
            </label>
            <div className="password-field-a-u">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`form-input-a-u ${errors.password ? 'error-a-u' : ''}`}
                placeholder="Введите пароль (минимум 6 символов)"
                disabled={loading}
              />
              <div className="password-actions-a-u">
                <button
                  type="button"
                  className="generate-password-btn-a-u"
                  onClick={generatePassword}
                  disabled={loading}
                  title="Сгенерировать надежный пароль"
                >
                  <span className="icon-a-u">🎲</span>
                  <span>Сгенерировать</span>
                </button>
                <div className="password-strength-a-u">
                  <div className={`strength-indicator-a-u ${
                    formData.password.length >= 12 ? 'strong-a-u' :
                    formData.password.length >= 8 ? 'medium-a-u' :
                    formData.password.length >= 6 ? 'weak-a-u' : ''
                  }`}>
                    <div className="strength-bar-a-u"></div>
                  </div>
                  <span className="strength-text-a-u">
                    {formData.password.length >= 12 ? 'Сильный' :
                     formData.password.length >= 8 ? 'Средний' :
                     formData.password.length >= 6 ? 'Слабый' : 'Введите пароль'}
                  </span>
                </div>
              </div>
            </div>
            {errors.password && <span className="error-text-a-u">{errors.password}</span>}
          </div>
        </div>

        {errors.submit && (
          <div className="submit-error-a-u">
            <span className="error-icon-a-u">⚠️</span>
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="form-actions-a-u">
          <button
            type="button"
            className="cancel-btn-a-u"
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="submit-btn-a-u"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-a-u"></span>
                <span>Создание...</span>
              </>
            ) : 'Создать пользователя'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;