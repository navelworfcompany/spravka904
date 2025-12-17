import React, { useState } from 'react';
import { useApplications } from '../../hooks/useApplications';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications'; // Изменен импорт
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatPhone, formatDate } from '../../utils/helpers';
import OperatorDataTable from '../../components/UI/OperatorDataTable';
import OperatorModal from '../../components/UI/OperatorModal';
import OperatorApplicationDetails from './OperatorApplicationDetails';
import OperatorFilters from './OperatorFilters';
import './ApplicationsList.css';

const ApplicationsList = () => {
  const {
    applications = [],
    loading,
    filters,
    setFilters,
    updateApplicationStatus,
    refreshApplications
  } = useApplications();

  const { addSuccessNotification, addErrorNotification } = useOperatorNotifications(); // Используем уведомления

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Функция для пометки на удаление
  const markForDeletion = async (applicationId) => {
    return updateApplicationStatus(applicationId, 'for_delete');
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value, row) => (
        <span className="operator-application-id">
          #{value}
          {row.status === 'for_delete' && (
            <span className="operator-deletion-warning" title="Заявка помечена на удаление">
              ⚠️
            </span>
          )}
        </span>
      )
    },
    {
      key: 'name',
      title: 'Клиент',
      render: (value, row) => (
        <div className="operator-client-info">
          <div className="operator-client-name">{value}</div>
          <div className="operator-client-phone">
            {formatPhone(row.phone)}
          </div>
        </div>
      )
    },
    {
      key: 'product_type',
      title: 'Тип товара'
    },
    {
      key: 'product',
      title: 'Товар'
    },
    {
      key: 'status',
      title: 'Статус',
      render: (value) => (
        <span className={`operator-status-badge operator-status-${value}`}>
          {APPLICATION_STATUSES[value]?.label || value}
        </span>
      )
    },
    {
      key: 'response_count',
      title: 'Ответов',
      render: (value) => (
        <span className={`operator-response-count ${value > 0 ? 'operator-has-responses' : ''}`}>
          {value || 0}
        </span>
      )
    },
    {
      key: 'created_at',
      title: 'Создана',
      render: (value) => formatDate(value)
    }
  ];

  const handleRowClick = (application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const result = await updateApplicationStatus(applicationId, newStatus);
      if (result.success) {
        addSuccessNotification(`Статус заявки #${applicationId} обновлен`);
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication(prev => ({
            ...prev,
            status: newStatus
          }));
        }
      }
    } catch (error) {
      addErrorNotification('Ошибка при обновлении статуса');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      phone: '',
      name: '',
      page: 1,
      limit: 20
    });
  };

  const handleMarkForDeletion = async (applicationId) => {
    try {
      await markForDeletion(applicationId);
      addSuccessNotification(`Заявка #${applicationId} помечена на удаление`);

      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication(prev => ({
          ...prev,
          status: 'for_delete'
        }));
      }
    } catch (error) {
      console.error('Mark for deletion error:', error);
      addErrorNotification('Ошибка при пометке заявки на удаление');
    }
  };

  const handleRestoreApplication = async (applicationId) => {
    try {
      await updateApplicationStatus(applicationId, 'new');
      addSuccessNotification(`Заявка #${applicationId} восстановлена`);

      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication(prev => ({
          ...prev,
          status: 'new'
        }));
      }
    } catch (error) {
      console.error('Restore application error:', error);
      addErrorNotification('Ошибка при восстановлении заявки');
    }
  };

  const handleWorkerAssigned = (applicationId, updatedApplication) => {
    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication(prev => ({
        ...prev,
        ...updatedApplication
      }));
    }

    addSuccessNotification(`Исполнитель назначен для заявки #${applicationId}`);
  };

  const handleDeleteWorkerResponse = async (responseId) => {
    if (!selectedApplication) return;
    addSuccessNotification(`Ответ работника удален`);
  };

  const actions = (application) => (
    <div className="operator-table-actions">
      <button
        className="operator-action-btn operator-view-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleRowClick(application);
        }}
        title="Просмотреть"
      >
        👁️
      </button>

      {application.status === 'new' && (
        <>
          <button
            className="operator-action-btn operator-start-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(application.id, 'in_progress');
            }}
            title="Взять в работу"
          >
            ⚡
          </button>
          <button
            className="operator-action-btn operator-mark-deletion-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkForDeletion(application.id);
            }}
            title="Пометить на удаление"
          >
            🚩
          </button>
        </>
      )}

      {application.status === 'in_progress' && (
        <>
          <button
            className="operator-action-btn operator-complete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(application.id, 'completed');
            }}
            title="Завершить"
          >
            ✅
          </button>
          <button
            className="operator-action-btn operator-mark-deletion-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkForDeletion(application.id);
            }}
            title="Пометить на удаление"
          >
            🚩
          </button>
        </>
      )}

      {application.status === 'completed' && (
        <button
          className="operator-action-btn operator-mark-deletion-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleMarkForDeletion(application.id);
          }}
          title="Пометить на удаление"
        >
          🚩
        </button>
      )}

      {application.status === 'for_delete' && (
        <button
          className="operator-action-btn operator-restore-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleRestoreApplication(application.id);
          }}
          title="Восстановить заявку"
        >
          🔄
        </button>
      )}
    </div>
  );

  return (
    <div className="operator-applications-page">
      <div className="operator-page-header">
        <div className="operator-header-content">
          <h1>Управление заявками</h1>
          <p>Просмотр и обработка заявок от клиентов</p>
        </div>
        <div className="operator-header-stats">
          <span className="operator-total-count">
            Всего заявок: <strong>{applications.length}</strong>
          </span>
          <span className="operator-active-count">
            Активных: <strong>{applications.filter(app => app.status === 'in_progress').length}</strong>
          </span>
        </div>
      </div>

      <OperatorFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
      />

      <OperatorDataTable
        columns={columns}
        data={applications}
        loading={loading}
        emptyMessage="Заявки не найдены"
        onRowClick={handleRowClick}
        actions={actions}
        rowClassName={(application) => `operator-status-${application.status}`}
      />

      {applications.length > 0 && (
        <div className="operator-pagination-info">
          <span>
            Показано {applications.length} заявок
            {filters.limit && applications.length === filters.limit && '+'}
          </span>
          <button
            className="operator-refresh-btn"
            onClick={refreshApplications}
            disabled={loading}
          >
            {loading ? '⟳' : '🔄'} Обновить
          </button>
        </div>
      )}

      <OperatorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Заявка #${selectedApplication?.id}`}
        size="large"
      >
        {selectedApplication && (
          <OperatorApplicationDetails
            application={selectedApplication}
            onStatusChange={handleStatusChange}
            onWorkerAssigned={handleWorkerAssigned}
            onDeleteWorkerResponse={handleDeleteWorkerResponse}
            userRole="operator"
          />
        )}
      </OperatorModal>
    </div>
  );
};

export default ApplicationsList;