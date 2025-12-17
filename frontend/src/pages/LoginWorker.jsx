// src/pages/LoginWorker.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { validation } from '../utils/validation';
import './login-worker.css';

const LoginWorker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();

  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/worker';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const phoneError = validation.phone(formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.phone, formData.password, 'worker');
      
      if (result && result.success) {
        showNotification('Успешный вход в систему работника!', 'success');
        const from = location.state?.from?.pathname || '/worker-panel';
        navigate(from, { replace: true });
      } else {
        handleLoginError(result);
      }
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    
    if (error?.response?.data?.details) {
      const validationErrors = error.response.data.details;
      const fieldErrors = {};
      
      validationErrors.forEach(err => {
        if (err.field === 'phone') {
          fieldErrors.phone = err.message;
        } else if (err.field === 'password') {
          fieldErrors.password = err.message;
        }
      });
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
      }
    }
    
    const errorMessage = error?.message || error?.toString() || '';
    const statusCode = error?.response?.status || error?.status;
    
    if (statusCode === 401) {
      showNotification('Неверный номер телефона или пароль', 'error');
    } else if (statusCode === 403) {
      showNotification('Доступ запрещен. Только для работников.', 'error');
    } else if (statusCode === 404) {
      showNotification('Пользователь не найден', 'error');
    } else if (statusCode === 400) {
      if (error?.response?.data?.message === 'Ошибка валидации данных') {
        showNotification('Проверьте правильность введенных данных', 'error');
      } else {
        showNotification('Неверный формат данных', 'error');
      }
    } else if (statusCode === 422) {
      showNotification('Ошибка валидации данных', 'error');
    } else if (statusCode === 500) {
      showNotification('Ошибка сервера. Попробуйте позже', 'error');
    } else if (errorMessage.includes('401')) {
      showNotification('Неверный номер телефона или пароль', 'error');
    } else if (errorMessage.includes('403') || errorMessage.includes('рол') || errorMessage.includes('работник')) {
      showNotification('Доступ запрещен. Только для работников.', 'error');
    } else if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
      showNotification('Ошибка соединения. Проверьте интернет', 'error');
    } else if (errorMessage.includes('token') || errorMessage.includes('Token')) {
      showNotification('Ошибка авторизации. Попробуйте войти снова', 'error');
    } else {
      showNotification('Ошибка входа. Попробуйте еще раз', 'error');
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    
    let cleanNumbers = numbers;
    if (!cleanNumbers.startsWith('7') && cleanNumbers.length > 0) {
      cleanNumbers = '7' + cleanNumbers;
    }
    
    cleanNumbers = cleanNumbers.slice(0, 11);
    
    let formatted = '+7';
    
    if (cleanNumbers.length > 1) {
      formatted += ` (${cleanNumbers.slice(1, 4)}`;
    }
    if (cleanNumbers.length > 4) {
      formatted += `) ${cleanNumbers.slice(4, 7)}`;
    }
    if (cleanNumbers.length > 7) {
      formatted += `-${cleanNumbers.slice(7, 9)}`;
    }
    if (cleanNumbers.length > 9) {
      formatted += `-${cleanNumbers.slice(9, 11)}`;
    }
    
    return formatted;
  };

  const handlePhoneChange = (value) => {
    const formattedPhone = formatPhone(value);
    handleChange('phone', formattedPhone);
  };

  const handlePasswordChange = (value) => {
    handleChange('password', value);
  };

  const handleRmasterRedirect = () => {
    navigate('/rmaster');
  };

  if (authLoading) {
    return (
      <div className="login-worker-page">
        <div className="loading-container">
          <LoadingSpinner text="Проверка авторизации..." />
        </div>
      </div>
    );
  }

  return (
    <div className="login-worker-page">
      <div className="login-worker-container">
        <div className="login-worker-header">
          <h1>Вход для работников</h1>
          <p>Введите данные для доступа к рабочим задачам</p>
        </div>

        <form className="login-worker-form" onSubmit={handleSubmit}>
          <div className="form-worker-fields">
            <Input
              label="Номер телефона"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              error={errors.phone}
              touched={true}
              placeholder="+7 (XXX) XXX-XX-XX"
              required
              disabled={loading}
            />

            <div className="password-worker-field">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handlePasswordChange}
                error={errors.password}
                touched={true}
                placeholder="Введите пароль работника"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-worker-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="login-worker-button"
          >
            {loading ? (
              <>
                <LoadingSpinner type="dots" size="small" color="white" />
                Вход...
              </>
            ) : (
              'Войти как работник'
            )}
          </Button>
        </form>

        <div className="login-worker-footer">
          <Button
            type="button"
            onClick={handleRmasterRedirect}
            className="rmaster-redirect-button"
          >
            Присоединиться к нам
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginWorker;