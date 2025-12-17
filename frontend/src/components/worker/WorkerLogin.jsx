import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Input from '../common/Input';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { validation } from '../../utils/validation';
import { USER_ROLES } from '../../utils/constants';

const WorkerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotifications();

  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await login(formData.phone, formData.password, USER_ROLES.WORKER);
      
      // Сохраняем данные для запоминания
      if (rememberMe) {
        localStorage.setItem('rememberedWorkerPhone', formData.phone);
      } else {
        localStorage.removeItem('rememberedWorkerPhone');
      }

      showNotification('Успешный вход в систему работника!', 'success');
      navigate('/worker');
    } catch (error) {
      // Ошибка обрабатывается в контексте аутентификации
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 1) return `+7 (${numbers}`;
    if (numbers.length <= 4) return `+7 (${numbers.slice(1, 4)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const handlePhoneChange = (value) => {
    const formattedPhone = formatPhone(value);
    handleChange('phone', formattedPhone);
  };

  const handleForgotPassword = () => {
    showNotification('Для восстановления пароля обратитесь к администратору', 'info');
  };

  const fillTestCredentials = () => {
    setFormData({
      phone: '+7 (999) 111-22-33',
      password: 'worker123'
    });
    setRememberMe(true);
  };

  // Загружаем сохраненный номер телефона при монтировании
  React.useEffect(() => {
    const rememberedPhone = localStorage.getItem('rememberedWorkerPhone');
    if (rememberedPhone) {
      setFormData(prev => ({ ...prev, phone: rememberedPhone }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="worker-login">
      <div className="login-header">
        <h2>Вход для работников</h2>
        <p>Введите ваши учетные данные для доступа к системе</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-fields">
          <Input
            label="Номер телефона"
            type="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={errors.phone}
            placeholder="+7 (XXX) XXX-XX-XX"
            required
            disabled={loading}
            autoComplete="tel"
          />

          <div className="password-field">
            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              placeholder="Введите ваш пароль"
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span className="checkmark"></span>
            Запомнить меня
          </label>

          <button
            type="button"
            className="forgot-password"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Забыли пароль?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="login-button"
        >
          {loading ? (
            <>
              <LoadingSpinner type="dots" size="small" color="white" />
              Вход...
            </>
          ) : (
            'Войти в систему'
          )}
        </Button>
      </form>

      <div className="login-footer">
        <div className="test-credentials">
          <button
            type="button"
            className="test-btn"
            onClick={fillTestCredentials}
            disabled={loading}
          >
            📋 Заполнить тестовые данные
          </button>
        </div>

        <div className="worker-features">
          <h4>Возможности для работников:</h4>
          <ul>
            <li>📋 Просмотр всех актуальных заявок</li>
            <li>💬 Добавление ответов клиентам</li>
            <li>📊 Отслеживание статуса заявок</li>
            <li>🔔 Уведомления о новых заявках</li>
          </ul>
        </div>

        <div className="support-info">
          <p>
            <strong>Проблемы с входом?</strong><br />
            Обратитесь к администратору системы по телефону:<br />
            <a href="tel:+79991234567">+7 (999) 123-45-67</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;