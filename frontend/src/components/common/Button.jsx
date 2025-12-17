import React from 'react';
import LoadingSpinner, { ButtonSpinner } from './LoadingSpinner';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  href,
  target = '_self',
  icon,
  iconPosition = 'left',
  className = '',
  fullWidth = false,
  ...props
}) => {
  // Определяем классы для кнопки
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    fullWidth && 'btn-full-width',
    icon && `btn-with-icon btn-icon-${iconPosition}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Обработчик клика
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // Если передан href, рендерим как ссылку
  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={buttonClasses}
        onClick={handleClick}
        {...props}
      >
        {renderContent()}
      </a>
    );
  }

  // Рендерим как обычную кнопку
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      onClick={handleClick}
      {...props}
    >
      {renderContent()}
    </button>
  );

  // Функция для рендеринга содержимого кнопки
  function renderContent() {
    return (
      <>
        {loading && (
          <span className="btn-spinner">
            <ButtonSpinner size={size} />
          </span>
        )}
        
        {icon && iconPosition === 'left' && !loading && (
          <span className="btn-icon btn-icon-left">{icon}</span>
        )}
        
        <span className="btn-text">{children}</span>
        
        {icon && iconPosition === 'right' && !loading && (
          <span className="btn-icon btn-icon-right">{icon}</span>
        )}
      </>
    );
  }
};

// Специализированные компоненты кнопок

export const PrimaryButton = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props) => (
  <Button variant="secondary" {...props} />
);

export const DangerButton = (props) => (
  <Button variant="danger" {...props} />
);

export const OutlineButton = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton = (props) => (
  <Button variant="ghost" {...props} />
);

export const LinkButton = (props) => (
  <Button variant="link" {...props} />
);

// Кнопка с иконкой
export const IconButton = ({ 
  icon, 
  'aria-label': ariaLabel, 
  size = 'medium',
  ...props 
}) => (
  <Button
    icon={icon}
    size={size}
    aria-label={ariaLabel}
    className="btn-icon-only"
    {...props}
  >
    {/* Пустой children для иконок */}
  </Button>
);

// Группа кнопок
export const ButtonGroup = ({ 
  children, 
  align = 'left',
  className = ''
}) => {
  const groupClass = `btn-group btn-group-${align} ${className}`.trim();
  
  return (
    <div className={groupClass}>
      {children}
    </div>
  );
};

export default Button;