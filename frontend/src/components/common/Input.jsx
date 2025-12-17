import React, { forwardRef } from 'react';
import ValidationError from './ValidationError';
import './Input.css';

const Input = forwardRef(({
  // Основные props
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  
  // Валидация и ошибки
  error,
  touched,
  required = false,
  
  // Состояния
  disabled = false,
  readOnly = false,
  loading = false,
  
  // Внешний вид
  placeholder,
  className = '',
  size = 'medium',
  variant = 'default',
  fullWidth = false,
  
  // HTML атрибуты
  id,
  name,
  autoComplete,
  autoFocus,
  maxLength,
  min,
  max,
  step,
  
  // Специальные поля
  icon,
  iconPosition = 'left',
  showCharacterCount = false,
  
  // Многострочный текст
  multiline = false,
  rows = 3,
  
  ...props
}, ref) => {
  // Генерируем ID если не предоставлен
  const inputId = id || `input-${name || label?.replace(/\s+/g, '-').toLowerCase()}`;

  // Классы для контейнера
  const containerClass = [
    'input-container',
    `input-size-${size}`,
    `input-variant-${variant}`,
    fullWidth && 'input-full-width',
    error && touched && 'input-has-error',
    disabled && 'input-disabled',
    loading && 'input-loading',
    icon && `input-with-icon input-icon-${iconPosition}`,
    className
  ].filter(Boolean).join(' ');

  // Классы для поля ввода
  const inputClass = [
    'input-field',
    error && touched && 'input-error',
    disabled && 'input-disabled-field'
  ].filter(Boolean).join(' ');

  // Обработчик изменения значения
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  };

  // Обработчик потери фокуса
  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  // Обработчик получения фокуса
  const handleFocus = (e) => {
    if (onFocus) {
      onFocus(e);
    }
  };

  // Рендер иконки
  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span className={`input-icon input-icon-${iconPosition}`}>
        {icon}
      </span>
    );
  };

  // Рендер счетчика символов
  const renderCharacterCount = () => {
    if (!showCharacterCount || !maxLength) return null;
    
    const currentLength = value?.toString().length || 0;
    const isOverLimit = currentLength > maxLength;
    
    return (
      <div className={`input-character-count ${isOverLimit ? 'input-character-count-over' : ''}`}>
        {currentLength} / {maxLength}
      </div>
    );
  };

  // Рендер поля ввода
  const renderInput = () => {
    const commonProps = {
      id: inputId,
      name,
      value: value || '',
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      placeholder,
      disabled: disabled || loading,
      readOnly,
      autoComplete,
      autoFocus,
      maxLength,
      min,
      max,
      step,
      className: inputClass,
      ref,
      ...props
    };

    if (multiline) {
      return (
        <textarea
          rows={rows}
          {...commonProps}
        />
      );
    }

    return (
      <input
        type={type}
        {...commonProps}
      />
    );
  };

  return (
    <div className={containerClass}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      {/* Поле ввода с иконкой */}
      <div className="input-wrapper">
        {icon && iconPosition === 'left' && renderIcon()}
        
        {renderInput()}
        
        {icon && iconPosition === 'right' && renderIcon()}
        
        {/* Индикатор загрузки */}
        {loading && (
          <div className="input-loading-indicator">
            <div className="input-loading-spinner"></div>
          </div>
        )}
      </div>

      {/* Счетчик символов и ошибка */}
      <div className="input-footer">
        {renderCharacterCount()}
        
        <ValidationError 
          error={error}
          touched={touched}
          fieldName={label}
          showIcon={true}
        />
      </div>
    </div>
  );
});

// Специализированные компоненты Input

export const PhoneInput = forwardRef((props, ref) => {
  const formatPhone = (value) => {
    if (!value) return '';
    
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 1) return `+7 (${numbers}`;
    if (numbers.length <= 4) return `+7 (${numbers.slice(1, 4)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleChange = (value, originalOnChange) => {
    const formattedValue = formatPhone(value);
    if (originalOnChange) {
      originalOnChange(formattedValue);
    }
  };

  return (
    <Input
      ref={ref}
      type="tel"
      icon="📞"
      placeholder="+7 (XXX) XXX-XX-XX"
      maxLength={18} // +7 (999) 999-99-99
      {...props}
      onChange={(value, e) => handleChange(value, props.onChange)}
    />
  );
});

export const EmailInput = forwardRef((props, ref) => {
  return (
    <Input
      ref={ref}
      type="email"
      icon="✉️"
      placeholder="email@example.com"
      autoComplete="email"
      {...props}
    />
  );
});

export const PasswordInput = forwardRef(({ showToggle = true, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      icon={showPassword ? '🙈' : '👁️'}
      iconPosition="right"
      autoComplete="current-password"
      onIconClick={showToggle ? togglePasswordVisibility : undefined}
      {...props}
    />
  );
});

export const SearchInput = forwardRef((props, ref) => {
  return (
    <Input
      ref={ref}
      type="search"
      icon="🔍"
      placeholder="Поиск..."
      {...props}
    />
  );
});

export const TextArea = forwardRef((props, ref) => {
  return (
    <Input
      ref={ref}
      multiline={true}
      {...props}
    />
  );
});

Input.displayName = 'Input';
PhoneInput.displayName = 'PhoneInput';
EmailInput.displayName = 'EmailInput';
PasswordInput.displayName = 'PasswordInput';
SearchInput.displayName = 'SearchInput';
TextArea.displayName = 'TextArea';

export default Input;