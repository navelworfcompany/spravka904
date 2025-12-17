import React from 'react';
import './OperatorFilters.css';

const OperatorFilters = ({ filters, onFiltersChange, onClear, filterType = 'applications' }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      ...(key !== 'page' && { page: 1 })
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'page' || key === 'limit') return false;
    return value !== '';
  });

  const getStatusOptions = () => {
    return [
      { value: '', label: 'Все статусы' },
      { value: 'active', label: 'Активные' },
      { value: 'inactive', label: 'Неактивные' },
      { value: 'blocked', label: 'Заблокированные' }
    ];
  };

  if (filterType === 'organizations') {
    return (
      <div className="operator-filters-container">
        <div className="operator-filters-header">
          <h3>Фильтры работников</h3>
          {hasActiveFilters && (
            <button className="operator-clear-filters-btn" onClick={onClear}>
              Очистить
            </button>
          )}
        </div>

        <div className="operator-filters-grid">
          <div className="operator-filter-group">
            <label className="operator-filter-label">Имя работника</label>
            <input
              type="text"
              value={filters.name || ''}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="Поиск по имени..."
              className="operator-filter-input"
            />
          </div>

          <div className="operator-filter-group">
            <label className="operator-filter-label">Организация</label>
            <input
              type="text"
              value={filters.organization || ''}
              onChange={(e) => handleFilterChange('organization', e.target.value)}
              placeholder="Поиск по организации..."
              className="operator-filter-input"
            />
          </div>

          <div className="operator-filter-group">
            <label className="operator-filter-label">Статус</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="operator-filter-select"
            >
              {getStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            {filters.name && (
              <span className="operator-active-filter-tag">
                Имя: {filters.name}
              </span>
            )}
            {filters.organization && (
              <span className="operator-active-filter-tag">
                Организация: {filters.organization}
              </span>
            )}
            {filters.status && (
              <span className="operator-active-filter-tag">
                Статус: {getStatusOptions().find(o => o.value === filters.status)?.label}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Для других типов фильтров (applications и т.д.)
  return null;
};

export default OperatorFilters;