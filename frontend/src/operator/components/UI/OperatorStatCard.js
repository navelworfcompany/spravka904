import React from 'react';
import './OperatorStatCard.css';

const OperatorStatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  subtitle, 
  onClick,
  badge,
  priority = false
}) => {
  return (
    <div 
      className={`operator-stat-card operator-stat-card--${color} ${priority ? 'operator-stat-card--priority' : ''} ${onClick ? 'operator-stat-card--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="operator-stat-card__header">
        <div className="operator-stat-card__icon">
          {icon}
        </div>
        {badge && (
          <div className="operator-stat-card__badge">
            {badge}
          </div>
        )}
      </div>
      <div className="operator-stat-card__content">
        <h3 className="operator-stat-card__title">{title}</h3>
        <div className="operator-stat-card__value">{value}</div>
        {subtitle && <div className="operator-stat-card__subtitle">{subtitle}</div>}
        {onClick && (
          <div className="operator-stat-card__action">
            Перейти →
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorStatCard;