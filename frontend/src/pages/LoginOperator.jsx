// src/pages/LoginOperator.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { validation } from '../utils/validation';
import './login-operator.css';

const LoginOperator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginOperator, loading: authLoading } = useAuth();
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
      const from = location.state?.from?.pathname || '/operator';
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
      const result = await loginOperator(formData.phone, formData.password);
      
      if (result && result.success) {
        showNotification('Успешный вход в систему оператора!', 'success');
      } else {
        handleLoginError(result);
      }
    } catch (error) {
      console.error('❌ Operator login error:', error);
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    const errorMessage = error?.message || error?.toString() || '';
    const statusCode = error?.response?.status || error?.status;
    
    console.log('🔍 Operator login error details:', { errorMessage, statusCode, fullError: error });

    if (statusCode === 401) {
      showNotification('Неверный номер телефона или пароль', 'error');
    } else if (statusCode === 403) {
      showNotification('Доступ запрещен. Только для операторов.', 'error');
    } else if (statusCode === 404) {
      showNotification('Пользователь не найден', 'error');
    } else if (statusCode === 400) {
      showNotification('Неверный формат данных', 'error');
    } else if (statusCode === 500) {
      showNotification('Ошибка сервера. Попробуйте позже', 'error');
    } else if (errorMessage.includes('401')) {
      showNotification('Неверный номер телефона или пароль', 'error');
    } else if (errorMessage.includes('403') || errorMessage.includes('рол') || errorMessage.includes('оператор')) {
      showNotification('Доступ запрещен. Только для операторов.', 'error');
    } else if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
      showNotification('Ошибка соединения. Проверьте интернет', 'error');
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

  if (authLoading) {
    return (
      <div className="login-operator-page">
        <div className="loading-container">
          <LoadingSpinner text="Проверка авторизации..." />
        </div>
      </div>
    );
  }

  return (
    <div className="login-operator-page">
      <div className="login-operator-container">
        <div className="login-operator-header">
          <h1>Вход для операторов</h1>
          <p>Введите данные для управления заявками</p>
        </div>

        <form className="login-operator-form" onSubmit={handleSubmit}>
          <div className="form-operator-fields">
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

            <div className="password-operator-field">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handlePasswordChange}
                error={errors.password}
                touched={true}
                placeholder="Введите пароль оператора"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-operator-toggle"
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
            className="login-operator-button"
          >
            {loading ? (
              <>
                <LoadingSpinner type="dots" size="small" color="white" />
                Вход...
              </>
            ) : (
              'Войти как оператор'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginOperator;