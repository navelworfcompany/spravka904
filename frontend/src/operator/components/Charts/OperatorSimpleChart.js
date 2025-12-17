import React from 'react';
import './OperatorSimpleChart.css';

const OperatorSimpleChart = ({ data, type = 'bar', dataType = 'applications' }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="operator-chart-placeholder">
        <div className="operator-placeholder-icon">📊</div>
        <p>Нет данных для отображения</p>
      </div>
    );
  }

  const entries = Object.entries(data);
  const numericValues = entries.map(([_, value]) => Number(value)).filter(val => !isNaN(val));
  const maxValue = Math.max(...numericValues, 1);

  const getLabel = (key) => {
    if (dataType === 'applications') {
      const labels = {
        new: '🆕 Новые',
        in_progress: '🔄 В работе', 
        completed: '✅ Завершены'
      };
      return labels[key] || key;
    } else if (dataType === 'reviews') {
      const labels = {
        pending: '⏳ На модерации',
        checked: '✅ Проверено'
      };
      return labels[key] || key;
    }
    return key;
  };

  const getColor = (key) => {
    if (dataType === 'applications') {
      const colors = {
        new: '#ef4444',
        in_progress: '#f59e0b',
        completed: '#10b981'
      };
      return colors[key] || '#6b7280';
    } else if (dataType === 'reviews') {
      const colors = {
        pending: '#f59e0b',
        checked: '#10b981'
      };
      return colors[key] || '#6b7280';
    }
    return '#6b7280';
  };

  if (type === 'bar') {
    return (
      <div className="operator-chart-bar">
        {entries.map(([key, value]) => {
          const numericValue = Number(value);
          if (isNaN(numericValue)) return null;
          
          return (
            <div key={key} className="operator-chart-bar-item">
              <div className="operator-chart-bar-label">
                <span className="operator-chart-bar-text">{getLabel(key)}</span>
                <span className="operator-chart-bar-value">{numericValue}</span>
              </div>
              <div className="operator-chart-bar-track">
                <div 
                  className="operator-chart-bar-fill"
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
    <div className="operator-chart-placeholder">
      <div className="operator-placeholder-icon">📊</div>
      <p>Тип графика не поддерживается</p>
    </div>
  );
};

export default OperatorSimpleChart;