import React from 'react';
import { APPLICATION_STATUSES } from '../../utils/constants';
import './OperatorFilters.css';

const OperatorFilters = ({ filters, onFiltersChange, onClear }) => {
  const statusOptions = [
    { value: '', label: 'Все статусы' },
    ...Object.entries(APPLICATION_STATUSES).map(([value, config]) => ({
      value,
      label: config.label
    }))
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      ...(key !== 'page' && { page: 1 })
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== '' && value !== 1 && value !== 20
  );

  return (
    <div className="operator-filters-container">
      <div className="operator-filters-header">
        <h3>Фильтры</h3>
        {hasActiveFilters && (
          <button className="operator-clear-filters-btn" onClick={onClear}>
            Очистить
          </button>
        )}
      </div>

      <div className="operator-filters-grid">
        <div className="operator-filter-group">
          <label className="operator-filter-label">Статус</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="operator-filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="operator-filter-group">
          <label className="operator-filter-label">Телефон</label>
          <input
            type="text"
            value={filters.phone || ''}
            onChange={(e) => handleFilterChange('phone', e.target.value)}
            placeholder="Поиск по телефону..."
            className="operator-filter-input"
          />
        </div>

        <div className="operator-filter-group">
          <label className="operator-filter-label">Имя</label>
          <input
            type="text"
            value={filters.name || ''}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            placeholder="Поиск по имени..."
            className="operator-filter-input"
          />
        </div>

        <div className="operator-filter-group">
          <label className="operator-filter-label">Показать</label>
          <select
            value={filters.limit || 20}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="operator-filter-select"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="operator-active-filters">
          <span className="operator-active-filters-label">Активные фильтры:</span>
          {filters.status && (
            <span className="operator-active-filter-tag">
              Статус: {APPLICATION_STATUSES[filters.status]?.label}
            </span>
          )}
          {filters.phone && (
            <span className="operator-active-filter-tag">
              Телефон: {filters.phone}
            </span>
          )}
          {filters.name && (
            <span className="operator-active-filter-tag">
              Имя: {filters.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OperatorFilters;