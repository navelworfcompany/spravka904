// src/components/Login/LoginAdmin.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { validation } from '../utils/validation';
import './login-admin.css';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginAdmin, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();

  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // ← НОВОЕ состояние для прелоадера
  const [showPassword, setShowPassword] = useState(false);
  
  // Рефы для контроля навигации
  const loginSuccess = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Навигация при изменении user (после успешного логина)
  useEffect(() => {
    // Если пользователь админ И мы успешно залогинились И компонент еще mounted
    if (user && user.role === 'admin' && loginSuccess.current && isMounted.current) {
      console.log('🚀 Performing navigation to /admin');
      setRedirecting(true); // ← Показываем прелоадер
      
      const from = location.state?.from?.pathname || '/admin';
      
      // Небольшая задержка чтобы пользователь увидел сообщение об успехе
      setTimeout(() => {
        if (isMounted.current) {
          navigate(from, { replace: true });
        }
      }, 800); // Можно настроить время задержки
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
    
    if (submitting || redirecting) {
      return;
    }

    if (!validateForm()) {
      showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
      return;
    }

    setSubmitting(true);
    loginSuccess.current = false;
    
    try {
      const result = await loginAdmin(formData.phone, formData.password);
      console.log('✅ Admin login successful, setting loginSuccess flag');
      
      // Устанавливаем флаг успешного логина
      loginSuccess.current = true;
      
      showNotification('Успешный вход в панель администратора! Перенаправление...', 'success');
      
      // Дублирующая навигация на случай если useEffect не сработает
      setTimeout(() => {
        if (isMounted.current && loginSuccess.current && !redirecting) {
          console.log('🔄 Fallback navigation to /admin');
          setRedirecting(true);
          navigate('/admin', { replace: true });
        }
      }, 1500);
      
    } catch (error) {
      console.error('❌ Admin login error:', error);
      loginSuccess.current = false;
      
      let errorMessage = 'Ошибка входа';
      if (error.message.includes('401') || error.message.includes('Неверный')) {
        errorMessage = 'Неверный номер телефона или пароль';
      } else if (error.message.includes('403') || error.message.includes('рол') || error.message.includes('админ')) {
        errorMessage = 'Доступ запрещен. Только для администраторов.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Ошибка соединения. Проверьте интернет.';
      } else if (error.message.includes('Неверная роль')) {
        errorMessage = 'Доступ только для администраторов';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
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
    if (cleanNumbers.length > 1) formatted += ` (${cleanNumbers.slice(1, 4)}`;
    if (cleanNumbers.length > 4) formatted += `) ${cleanNumbers.slice(4, 7)}`;
    if (cleanNumbers.length > 7) formatted += `-${cleanNumbers.slice(7, 9)}`;
    if (cleanNumbers.length > 9) formatted += `-${cleanNumbers.slice(9, 11)}`;
    
    return formatted;
  };

  const handlePhoneChange = (value) => {
    const formattedPhone = formatPhone(value);
    handleChange('phone', formattedPhone);
  };

  const handlePasswordChange = (value) => {
    handleChange('password', value);
  };

  // Показываем прелоадер во время редиректа
  if (redirecting) {
    return (
      <div className="login-admin-page">
        <div className="redirecting-container">
          <div className="redirecting-content">
            <LoadingSpinner size="large" />
            <h2>Вход выполнен успешно!</h2>
            <p>Перенаправляем в админ-панель...</p>
          </div>
        </div>
      </div>
    );
  }

  // Если уже авторизованы как админ, показываем прелоадер и редиректим
  if (user && user.role === 'admin' && !submitting && !redirecting) {
    console.log('🔄 Already admin, redirecting...');
    setRedirecting(true);
    setTimeout(() => navigate('/admin', { replace: true }), 500);
    
    return (
      <div className="login-admin-page">
        <div className="redirecting-container">
          <div className="redirecting-content">
            <LoadingSpinner size="large" />
            <p>Перенаправление в админ-панель...</p>
          </div>
        </div>
      </div>
    );
  }

  // Если проверяется авторизация, показываем загрузку
  if (authLoading) {
    return (
      <div className="login-admin-page">
        <div className="loading-container">
          <LoadingSpinner text="Проверка авторизации..." />
        </div>
      </div>
    );
  }

  return (
    <div className="login-admin-page">
      <div className="login-admin-container">
        <div className="login-admin-header">
          <h1>Вход для администраторов</h1>
          <p>Введите данные для доступа к панели управления</p>
        </div>

        <form className="login-admin-form" onSubmit={handleSubmit}>
          <div className="form-admin-fields">
            <Input
              label="Номер телефона"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              error={errors.phone}
              touched={true}
              placeholder="+7 (999) 999-99-99"
              required
              disabled={submitting || redirecting}
            />

            <div className="password-admin-field">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handlePasswordChange}
                error={errors.password}
                touched={true}
                placeholder="Введите ваш пароль"
                required
                disabled={submitting || redirecting}
              />
              <button
                type="button"
                className="password-admin-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={submitting || redirecting}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || redirecting}
            className="login-admin-button"
          >
            {submitting ? (
              <>
                <LoadingSpinner type="dots" size="small" color="white" />
                Вход...
              </>
            ) : redirecting ? (
              <>
                <LoadingSpinner type="dots" size="small" color="white" />
                Перенаправление...
              </>
            ) : (
              'Войти в панель администратора'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;