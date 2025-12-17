// src/admin/components/Applications/Filters.js
import React from 'react';
import { APPLICATION_STATUSES } from '../../utils/constants';
import './Filters.css';

const Filters = ({ filters, onFiltersChange, onClear }) => {
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
      ...(key !== 'page' && { page: 1 }) // Сбрасываем пагинацию при изменении фильтров
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== '' && value !== 1 && value !== 20
  );

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3>Фильтры</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={onClear}>
            Очистить
          </button>
        )}
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label className="filter-label">Статус</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Телефон</label>
          <input
            type="text"
            value={filters.phone || ''}
            onChange={(e) => handleFilterChange('phone', e.target.value)}
            placeholder="Поиск по телефону..."
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Имя</label>
          <input
            type="text"
            value={filters.name || ''}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            placeholder="Поиск по имени..."
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Показать</label>
          <select
            value={filters.limit || 20}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
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
        <div className="active-filters">
          <span className="active-filters-label">Активные фильтры:</span>
          {filters.status && (
            <span className="active-filter-tag">
              Статус: {APPLICATION_STATUSES[filters.status]?.label}
            </span>
          )}
          {filters.phone && (
            <span className="active-filter-tag">
              Телефон: {filters.phone}
            </span>
          )}
          {filters.name && (
            <span className="active-filter-tag">
              Имя: {filters.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Filters;