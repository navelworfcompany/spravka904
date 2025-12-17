// src/admin/components/UI/StatCard.js
import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend, 
  subtitle, 
  onClick,
  badge // Добавляем пропс для бейджа
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
  };

  const getTrendClass = () => {
    if (!trend) return '';
    return trend > 0 ? 'stat-card__trend--up' : trend < 0 ? 'stat-card__trend--down' : '';
  };

  return (
    <div 
      className={`stat-card stat-card--${color} ${onClick ? 'stat-card--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card__header">
        <div className="stat-card__icon">
          {icon}
        </div>
        {badge && (
          <div className="stat-card__badge">
            {badge}
          </div>
        )}
      </div>
      <div className="stat-card__content">
        <h3 className="stat-card__title">{title}</h3>
        <div className="stat-card__value">{value}</div>
        {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
        {trend !== undefined && (
          <div className={`stat-card__trend ${getTrendClass()}`}>
            {getTrendIcon()} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;