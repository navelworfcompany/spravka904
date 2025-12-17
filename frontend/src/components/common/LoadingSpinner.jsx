import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  type = 'spinner',
  text = '',
  overlay = false,
  fullScreen = false 
}) => {
  const spinnerClass = `preloader ${type} size-${size} color-${color} ${
    overlay ? 'overlay' : ''
  } ${fullScreen ? 'full-screen' : ''}`;

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="dots-container">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      
      case 'pulse':
        return <div className="pulse"></div>;
      
      case 'bounce':
        return (
          <div className="bounce-container">
            <div className="bounce bounce1"></div>
            <div className="bounce bounce2"></div>
            <div className="bounce bounce3"></div>
          </div>
        );
      
      case 'ring':
        return (
          <div className="ring-container">
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className="bars-container">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        );
      
      default: // spinner
        return <div className="spinner"></div>;
    }
  };

  if (fullScreen) {
    return (
      <div className="preloader-fullscreen">
        <div className="preloader-content">
          {renderSpinner()}
          {text && <div className="preloader-text">{text}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={spinnerClass}>
      <div className="spinner-content">
        {renderSpinner()}
        {text && <div className="preloader-text">{text}</div>}
      </div>
    </div>
  );
};

// Компонент для кнопки с загрузкой
export const ButtonSpinner = ({ size = 'small' }) => (
  <div className={`button-spinner size-${size}`}>
    <div className="button-spinner-inner"></div>
  </div>
);

// Компонент для загрузки контента с скелетоном
export const SkeletonLoader = ({ 
  type = 'text', 
  lines = 3,
  height = '20px',
  width = '100%' 
}) => {
  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton-image"></div>
        <div className="skeleton-content">
          <div className="skeleton-line" style={{ width: '80%' }}></div>
          <div className="skeleton-line" style={{ width: '60%' }}></div>
          <div className="skeleton-line" style={{ width: '40%' }}></div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="skeleton-list">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index} 
            className="skeleton-line" 
            style={{ 
              height, 
              width: index === lines - 1 ? '60%' : width 
            }}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-line" style={{ height, width }}></div>
  );
};

export default LoadingSpinner;