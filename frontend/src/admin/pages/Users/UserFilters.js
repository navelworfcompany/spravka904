// src/admin/components/Users/UserFilters.js
import React from 'react';
import { USER_ROLES } from '../../utils/constants';
import './UserFilters.css';

const UserFilters = ({ filters, onFiltersChange, onClear }) => {
  const roleOptions = [
    { value: '', label: 'Все роли' },
    ...Object.entries(USER_ROLES).map(([value, label]) => ({
      value,
      label
    }))
  ];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'inactive', label: 'Неактивные' },
    { value: 'blocked', label: 'Заблокированные' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== '' && value !== null
  );

  return (
    <div className="user-filters">
      <div className="filters-header">
        <h3>Фильтры пользователей</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={onClear}>
            Очистить
          </button>
        )}
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label className="filter-label">Роль</label>
          <select
            value={filters.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="filter-select"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

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
          <label className="filter-label">Поиск</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Поиск по имени, телефону, email..."
            className="filter-input"
          />
        </div>
      </div>

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Активные фильтры:</span>
          {filters.role && (
            <span className="active-filter-tag">
              Роль: {USER_ROLES[filters.role]}
            </span>
          )}
          {filters.status && (
            <span className="active-filter-tag">
              Статус: {filters.status === 'active' ? 'Активные' : 
                      filters.status === 'inactive' ? 'Неактивные' : 'Заблокированные'}
            </span>
          )}
          {filters.search && (
            <span className="active-filter-tag">
              Поиск: {filters.search}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFilters;