import React from 'react';
import './ValidationError.css';

const ValidationError = ({ 
  error, 
  touched,
  fieldName,
  showIcon = true,
  className = '',
  position = 'below' // 'below', 'inline', 'tooltip'
}) => {
  // Не показываем ошибку, если поле не было touched или нет ошибки
  if (!touched || !error) {
    return null;
  }

  const errorClass = `validation-error validation-error-${position} ${className}`.trim();

  const getErrorIcon = () => {
    if (!showIcon) return null;
    return <span className="validation-error-icon">⚠️</span>;
  };

  const getErrorMessage = () => {
    if (fieldName && error.includes('обязательно')) {
      return `${fieldName} обязательно для заполнения`;
    }
    return error;
  };

  return (
    <div className={errorClass} role="alert">
      {getErrorIcon()}
      <span className="validation-error-message">
        {getErrorMessage()}
      </span>
    </div>
  );
};

// Специализированные компоненты ошибок
export const RequiredFieldError = ({ fieldName, touched, showIcon = true }) => (
  <ValidationError 
    error={`${fieldName} обязательно для заполнения`}
    touched={touched}
    showIcon={showIcon}
  />
);

export const EmailError = ({ error, touched, showIcon = true }) => (
  <ValidationError 
    error={error}
    touched={touched}
    showIcon={showIcon}
    fieldName="Email"
  />
);

export const PhoneError = ({ error, touched, showIcon = true }) => (
  <ValidationError 
    error={error}
    touched={touched}
    showIcon={showIcon}
    fieldName="Телефон"
  />
);

export const PasswordError = ({ error, touched, showIcon = true }) => (
  <ValidationError 
    error={error}
    touched={touched}
    showIcon={showIcon}
    fieldName="Пароль"
  />
);

export default ValidationError;