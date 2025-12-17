import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { validation } from '../utils/validation';
import './login-client.css';

const LoginClient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // ✅ Добавьте loginClient в деструктуризацию
  const { user, loginClient, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();

  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Если пользователь уже авторизован, перенаправляем его
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаем ошибку при вводе
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Валидация телефона
    const phoneError = validation.phone(formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    // Валидация пароля
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
      // ✅ Теперь loginClient определен
      const result = await loginClient(formData.phone, formData.password);
      
      if (result && result.success) {
        showNotification('Успешный вход! Перенаправляем...', 'success');
      } else {
        handleLoginError(result);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  // Новая функция для обработки ошибок входа
  const handleLoginError = (error) => {
    const errorMessage = error?.message || error?.toString() || '';
    const statusCode = error?.response?.status || error?.status;
    
    console.log('🔍 Error details:', { errorMessage, statusCode, fullError: error });

    // Обработка HTTP ошибок
    if (statusCode === 401) {
      showNotification('Неверный номер телефона или пароль', 'error');
    } else if (statusCode === 403) {
      showNotification('Доступ запрещен. Только для клиентов.', 'error');
    } else if (statusCode === 404) {
      showNotification('Пользователь не найден', 'error');
    } else if (statusCode === 400) {
      showNotification('Неверный формат данных', 'error');
    } else if (statusCode === 500) {
      showNotification('Ошибка сервера. Попробуйте позже', 'error');
    } else if (errorMessage.includes('401')) {
      showNotification('Неверный номер телефона или пароль', 'error');
    } else if (errorMessage.includes('403') || errorMessage.includes('рол')) {
      showNotification('Доступ запрещен. Только для клиентов.', 'error');
    } else if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
      showNotification('Ошибка соединения. Проверьте интернет', 'error');
    } else {
      showNotification('Ошибка входа. Попробуйте еще раз', 'error');
    }
  };

  const formatPhone = (value) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, '');
    
    // Если ничего не осталось, возвращаем пустую строку
    if (numbers.length === 0) return '';
    
    // Всегда используем российский формат +7
    let cleanNumbers = numbers;
    if (!cleanNumbers.startsWith('7') && cleanNumbers.length > 0) {
      cleanNumbers = '7' + cleanNumbers;
    }
    
    // Ограничиваем длину
    cleanNumbers = cleanNumbers.slice(0, 11);
    
    // Форматируем по шаблону
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

  // Если проверяется авторизация, показываем загрузку
  if (authLoading) {
    return (
      <div className="login-client-page">
        <div className="loading-container">
          <LoadingSpinner text="Проверка авторизации..." />
        </div>
      </div>
    );
  }

  return (
    <div className="login-client-page">
      <div className="login-client-container">
        <div className="login-client-header">
          <h1>Вход для клиентов</h1>
          <p>Введите данные для просмотра ваших заявок</p>
        </div>

        <form className="login-client-form" onSubmit={handleSubmit}>
          <div className="form-client-fields">
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

            <div className="password-client-field">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handlePasswordChange}
                error={errors.password}
                touched={true}
                placeholder="Введите ваш пароль"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-client-toggle"
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
            className="login-client-button"
          >
            {loading ? (
              <>
                <LoadingSpinner type="dots" size="small" color="white" />
                Вход...
              </>
            ) : (
              'Войти для просмотра заявок'
            )}
          </Button>
        </form>

        <div className="login-links">
          <p>
            Нет заявок?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={() => navigate('/')}
            >
              Создайте первую заявку
            </button>
          </p>
          
          <p>
            <button 
              type="button" 
              className="link-button"
              onClick={() => navigate('/')}
            >
              ← Вернуться на главную
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginClient;