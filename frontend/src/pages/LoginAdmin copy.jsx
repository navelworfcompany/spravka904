// src/components/Login/LoginAdmin.js
import React, { useState, useEffect } from 'react';
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
  const { user, login, loading: authLoading } = useAuth();
  const { showNotification, showError, showSuccess } = useNotifications();

  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Отладочная информация
  useEffect(() => {
    console.log('🔐 LoginAdmin Debug:', {
      user,
      authLoading,
      submitting,
      hasUser: !!user,
      userRole: user?.role
    });
  }, [user, authLoading, submitting]);

  // Навигация при успешной авторизации
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('🚀 Navigation triggered - user is admin');
      const from = location.state?.from?.pathname || '/admin';
      
      // Показываем успешное уведомление
      showSuccess('Успешный вход в панель администратора!');
      
      // Небольшая задержка для стабильности
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, navigate, location, showSuccess]);

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
    if (phoneError) newErrors.phone = phoneError;
    if (!formData.password) newErrors.password = 'Пароль обязателен';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;

    if (!validateForm()) {
      showError('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setSubmitting(true);
    console.log('🔐 Starting login process...');
    
    try {
      await login(formData.phone, formData.password, 'admin');
      // Успешное уведомление показывается в useEffect навигации
      
    } catch (error) {
      console.error('❌ Admin login error:', error);
      
      // Показываем конкретное сообщение об ошибке
      showError(error.message || 'Ошибка входа');
      
    } finally {
      setSubmitting(false);
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

  // Если уже авторизованы как админ
  if (user && user.role === 'admin') {
    return (
      <div className="login-admin-page">
        <div className="loading-container">
          <LoadingSpinner text="Перенаправление в админ-панель..." />
        </div>
      </div>
    );
  }

  // Если проверяется авторизация
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
              disabled={submitting}
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
                disabled={submitting}
              />
              <button
                type="button"
                className="password-admin-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={submitting}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="login-admin-button"
          >
            {submitting ? (
              <>
                <LoadingSpinner type="dots" size="small" color="white" />
                Вход...
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