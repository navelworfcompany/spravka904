import React, { useState, useMemo, useEffect } from 'react';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications';
import { operatorAPI } from '../../../services/api';
import OperatorOrganizationCard from './OperatorOrganizationCard';
import OperatorFilters from './OperatorFilters';
import './OrganizationsList.css';

const OrganizationsList = () => {
  const { 
    organizations, 
    loading, 
    filters, 
    setFilters,
    refreshOrganizations,
    totalCount,
    totalPages 
  } = useOrganizations();
  
  const { addSuccessNotification, addErrorNotification } = useOperatorNotifications();
  
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Обработка фильтров
  const handleFilterChange = (newFilters) => {
    setFilters({
      ...newFilters,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      organization: '',
      status: '',
      search: '',
      page: 1,
      limit: 20
    });
  };

  const handleLoadMore = async () => {
    if (filters.page < totalPages) {
      setIsLoadingMore(true);
      try {
        setFilters(prev => ({
          ...prev,
          page: prev.page + 1
        }));
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleViewDetails = (organization) => {
    setSelectedOrganization(organization);
  };

  // Статистика по статусам
  const statusStats = useMemo(() => {
    const stats = {
      active: 0,
      inactive: 0,
      blocked: 0,
      total: 0
    };
    
    if (Array.isArray(organizations)) {
      organizations.forEach(org => {
        stats.total++;
        if (stats[org.status] !== undefined) {
          stats[org.status]++;
        } else {
          stats.active++;
        }
      });
    }
    
    return stats;
  }, [organizations]);

  // Функция для блокировки/разблокировки работника
  const handleToggleStatus = async (organizationId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      const response = await operatorAPI.updateOrganization(organizationId, { status: newStatus });
      
      if (response.success) {
        await refreshOrganizations();
        addSuccessNotification(`Статус работника успешно изменен на "${newStatus}"`);
      } else {
        addErrorNotification(response.error || 'Не удалось изменить статус работника');
      }
    } catch (error) {
      console.error('Error updating organization status:', error);
      addErrorNotification('Ошибка при изменении статуса работника');
    }
  };

  return (
    <div className="operator-organizations-page">
      <div className="operator-page-header">
        <div className="operator-header-content">
          <h1>Организации и работники</h1>
          <p>Просмотр зарегистрированных работников и их организаций</p>
        </div>
        
        <div className="operator-header-stats">
          <span className="operator-organizations-count">
            Всего работников: <strong>{totalCount || organizations.length}</strong>
          </span>
          <span className="operator-active-count">
            Активных: <strong>{statusStats.active}</strong>
          </span>
          <button
            className="operator-refresh-btn"
            onClick={refreshOrganizations}
            disabled={loading}
            title="Обновить"
          >
            {loading ? '⟳' : '🔄'}
          </button>
        </div>
      </div>

      <div className="operator-status-stats">
        <h3>Статусы работников</h3>
        <div className="operator-stats-grid">
          <div className="operator-stat-card operator-stat-active">
            <span className="operator-stat-label">Активные</span>
            <span className="operator-stat-value">{statusStats.active}</span>
          </div>
          <div className="operator-stat-card operator-stat-inactive">
            <span className="operator-stat-label">Неактивные</span>
            <span className="operator-stat-value">{statusStats.inactive}</span>
          </div>
          <div className="operator-stat-card operator-stat-blocked">
            <span className="operator-stat-label">Заблокированные</span>
            <span className="operator-stat-value">{statusStats.blocked}</span>
          </div>
          <div className="operator-stat-card operator-stat-total">
            <span className="operator-stat-label">Всего</span>
            <span className="operator-stat-value">{statusStats.total}</span>
          </div>
        </div>
      </div>

      <OperatorFilters 
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClear={handleClearFilters}
        filterType="organizations"
      />

      <div className="operator-results-info">
        <span>
          Найдено работников: <strong>{organizations.length}</strong>
          {totalCount !== undefined && ` из ${totalCount}`}
          {(filters.name || filters.organization || filters.status || filters.search) ? ' (отфильтровано)' : ''}
        </span>
        {filters.page > 1 && (
          <span className="operator-page-info">
            Страница: {filters.page} из {totalPages || 1}
          </span>
        )}
      </div>

      {loading && organizations.length === 0 ? (
        <div className="operator-organizations-loading">
          <div className="operator-loading-spinner">⟳</div>
          <p>Загрузка данных о работниках...</p>
        </div>
      ) : organizations.length > 0 ? (
        <>
          <div className="operator-organizations-grid">
            {organizations.map(organization => (
              <OperatorOrganizationCard
                key={organization.id}
                organization={organization}
                onViewDetails={handleViewDetails}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
          
          {filters.page < totalPages && (
            <div className="operator-load-more">
              <button 
                onClick={handleLoadMore}
                disabled={loading || isLoadingMore}
                className="operator-load-more-btn"
              >
                {loading || isLoadingMore ? 'Загрузка...' : 'Загрузить еще'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="operator-no-organizations">
          <div className="operator-no-organizations-icon">👷</div>
          <h3>Работники не найдены</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
          <button 
            className="operator-clear-filters-btn"
            onClick={handleClearFilters}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;