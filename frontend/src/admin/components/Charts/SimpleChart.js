// src/admin/components/Charts/SimpleChart.js
import React from 'react';
import './SimpleChart.css';

const SimpleChart = ({ data, type = 'bar', dataType = 'applications' }) => {
  console.log('📈 SimpleChart received:', { data, type, dataType });
  
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="chart-placeholder">
        <div className="placeholder-icon">📊</div>
        <p>Нет данных для отображения</p>
        <small>Полученные данные: {JSON.stringify(data)}</small>
      </div>
    );
  }

  const entries = Object.entries(data);
  
  // Проверяем, есть ли ненулевые значения
  const hasValidData = entries.some(([_, value]) => Number(value) > 0);
  
  if (!hasValidData) {
    return (
      <div className="chart-placeholder">
        <div className="placeholder-icon">📊</div>
        <p>Все значения равны нулю</p>
        <small>Данные: {JSON.stringify(data)}</small>
      </div>
    );
  }

  const numericValues = entries.map(([_, value]) => Number(value)).filter(val => !isNaN(val));
  const maxValue = Math.max(...numericValues, 1);

  const getLabel = (key) => {
    if (dataType === 'applications') {
      const labels = {
        new: '🆕 Новые',
        in_progress: '🔄 В работе', 
        completed: '✅ Завершены',
        cancelled: '❌ Отменены'
      };
      return labels[key] || key;
    } else if (dataType === 'users') {
      const labels = {
        admin: '👑 Админы',
        operator: '👨‍💼 Операторы',
        worker: '👷 Работники',
        user: '👤 Пользователи'
      };
      return labels[key] || key;
    } else if (dataType === 'reviews') {
      const labels = {
        pending: '⏳ На модерации',
        checked: '✅ Одобрено',
        rejected: '❌ Отклонено'
      };
      return labels[key] || key;
    }
    return key;
  };

  const getColor = (key) => {
    if (dataType === 'applications') {
      const colors = {
        new: '#10b981',
        in_progress: '#f59e0b',
        completed: '#3b82f6',
        cancelled: '#ef4444'
      };
      return colors[key] || '#6b7280';
    } else if (dataType === 'users') {
      const colors = {
        admin: '#ef4444',
        operator: '#f59e0b',
        worker: '#3b82f6',
        user: '#10b981'
      };
      return colors[key] || '#6b7280';
    } else if (dataType === 'reviews') {
      const colors = {
        pending: '#f59e0b',
        checked: '#10b981',
        rejected: '#ef4444'
      };
      return colors[key] || '#6b7280';
    }
    return '#6b7280';
  };

  if (type === 'bar') {
    return (
      <div className="chart-bar">
        {entries.map(([key, value]) => {
          const numericValue = Number(value);
          if (isNaN(numericValue)) return null;
          
          return (
            <div key={key} className="chart-bar-item">
              <div className="chart-bar-label">
                <span className="chart-bar-text">{getLabel(key)}</span>
                <span className="chart-bar-value">{numericValue}</span>
              </div>
              <div className="chart-bar-track">
                <div 
                  className="chart-bar-fill"
                  style={{
                    width: `${(numericValue / maxValue) * 100}%`,
                    backgroundColor: getColor(key)
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="chart-placeholder">
      <div className="placeholder-icon">📊</div>
      <p>Тип графика "{type}" не поддерживается</p>
      <small>Доступные типы: bar</small>
    </div>
  );
};

export default SimpleChart;