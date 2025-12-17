import './ContactModal.css';
import React, { useState, useEffect } from 'react';
import { validation, formatPhone } from '../../utils/validation';

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);

  useEffect(() => {
    let timer;
    if (submitStatus === 'success' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      onClose();
      setSubmitStatus(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submitStatus, timeLeft, onClose]);

  const handleChange = (field, value) => {
    let processedValue = value;

    if (field === 'phone') {
      processedValue = formatPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    if (touched[field]) {
      validateField(field, processedValue);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = null;

    switch (field) {
      case 'name':
        error = validation.required(value, 'Имя') || validation.name(value);
        break;
      case 'phone':
        error = validation.required(value, 'Телефон') || validation.phone(value);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validation.required(formData.name, 'Имя') || validation.name(formData.name);
    const phoneError = validation.required(formData.phone, 'Телефон') || validation.phone(formData.phone);

    if (nameError) newErrors.name = nameError;
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    setTouched({
      name: true,
      phone: true
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_BASE_URL}/contact/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Server response:', result);

      if (result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', phone: '' });
        setTouched({});
        setErrors({});
        setTimeLeft(24 * 60 * 60);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Full error:', error);
      setSubmitStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: ''
    });
    setErrors({});
    setTouched({});
    setSubmitStatus(null);
    setTimeLeft(24 * 60 * 60);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div class="overlay">
      <div class="window">
        <div class="window-header">
          <h2>Заказать обратный звонок</h2>
          <button class="close" onClick={handleClose}>×</button>
        </div>

        {submitStatus === 'success' && (
          <div class="success-mes">
            <div class="alrt alrt-success">
              ✅ Сообщение успешно отправлено! Наш специалист перезвонит Вам в ближайшее время!
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div class="alrt alrt-error">
            ❌ Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.
          </div>
        )}

        {submitStatus !== 'success' && (
          <form onSubmit={handleSubmit} class="callme-form">
            <div class="forms">
              <label htmlFor="name">Имя *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={errors.name ? 'error' : ''}
                disabled={isLoading}
                placeholder="Введите ваше имя"
              />
              {errors.name && <span class="error-txt">{errors.name}</span>}
            </div>

            <div class="forms">
              <label htmlFor="phone">Телефон *</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={errors.phone ? 'error' : ''}
                placeholder="+7 (XXX) XXX-XX-XX"
                disabled={isLoading}
              />
              {errors.phone && <span class="error-txt">{errors.phone}</span>}
            </div>

            <div class="butns">
              <button
                type="button"
                onClick={handleClose}
                class="btn-cancel"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                class="btn-call"
                disabled={isLoading}
              >
                {isLoading ? 'Отправка...' : 'Заказать звонок'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;