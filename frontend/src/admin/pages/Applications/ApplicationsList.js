// src/admin/pages/Applications/ApplicationsList.js
import React, { useState } from 'react';
import { useApplications } from '../../hooks/useApplications';
import { useAdmin } from '../../hooks/useAdmin';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatPhone, formatDate } from '../../utils/helpers';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import ApplicationDetails from './ApplicationDetails';
import Filters from './Filters';
import './ApplicationsList.css';

const ApplicationsList = () => {
  const { 
    applications, 
    loading, 
    filters, 
    setFilters, 
    updateApplicationStatus,
    deleteApplication,
    markForDeletion
  } = useApplications();
  const { addNotification } = useAdmin();
  
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value,row) => <span className="application-id">#{value}{row.status === 'for_delete' && (
              <span className="deletion-warning" title="Заявка помечена на удаление">⚠️</span>
            )}</span>
    },
    {
      key: 'name',
      title: 'Клиент',
      render: (value, row) => (
        <div className="client-info">
          <div className="client-name">
            {value}
          </div>
          <div className="client-phone">{formatPhone(row.phone)}</div>
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
        <span className={`status-badge status-${value}`}>
          {APPLICATION_STATUSES[value]?.label || value}
        </span>
      )
    },
    {
      key: 'response_count',
      title: 'Ответов',
      render: (value) => (
        <span className={`response-count ${value > 0 ? 'has-responses' : ''}`}>
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
    await updateApplicationStatus(applicationId, newStatus);
    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication(prev => ({
        ...prev,
        status: newStatus
      }));
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

  // Функция для открытия модального окна удаления
  const handleOpenDeleteModal = (application, e) => {
    e.stopPropagation();
    setApplicationToDelete(application);
    setIsDeleteModalOpen(true);
  };

  // Функция для подтверждения удаления
  const handleConfirmDelete = async () => {
    if (!applicationToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteApplication(applicationToDelete.id);
      
      if (result.success) {
        addNotification('success', `Заявка #${applicationToDelete.id} успешно удалена`);
        setIsDeleteModalOpen(false);
        setApplicationToDelete(null);
        
        // Закрываем модальное окно деталей, если оно открыто для этой заявки
        if (selectedApplication && selectedApplication.id === applicationToDelete.id) {
          setIsModalOpen(false);
          setSelectedApplication(null);
        }
      } else {
        addNotification('error', result.error || 'Ошибка при удалении заявки');
      }
    } catch (error) {
      console.error('Delete application error:', error);
      addNotification('error', 'Ошибка при удалении заявки');
    } finally {
      setIsDeleting(false);
    }
  };

  // Функция для закрытия модального окна удаления
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setApplicationToDelete(null);
  };

  const handleMarkForDeletion = async (applicationId) => {
    try {
      await updateApplicationStatus(applicationId, 'for_delete');
      addNotification('success', `Заявка #${applicationId} помечена на удаление`);
    } catch (error) {
      console.error('Mark for deletion error:', error);
      addNotification('error', 'Ошибка при пометке заявки на удаление');
    }
  };

  // Функция для восстановления заявки из статуса "На удаление"
  const handleRestoreApplication = async (applicationId) => {
    try {
      await updateApplicationStatus(applicationId, 'new');
      addNotification('success', `Заявка #${applicationId} восстановлена`);
    } catch (error) {
      console.error('Restore application error:', error);
      addNotification('error', 'Ошибка при восстановлении заявки');
    }
  };

  const handleWorkerAssigned = (applicationId, updatedApplication) => {
    // Обновляем выбранную заявку в модальном окне
    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication(prev => ({
        ...prev,
        ...updatedApplication
      }));
    }
    
    addNotification('success', `Исполнитель назначен для заявки #${applicationId}`);
  };

  const actions = (application) => (
    <div className="table-actions">
      <button 
        className="action-btn view-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleRowClick(application);
        }}
        title="Просмотреть"
      >
        👁️
      </button>
      
      {/* Кнопки для разных статусов */}
      {application.status === 'new' && (
        <>
          <button 
            className="action-btn start-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(application.id, 'in_progress');
            }}
            title="Взять в работу"
          >
            ⚡
          </button>
          <button 
            className="action-btn mark-deletion-btn"
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
            className="action-btn complete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(application.id, 'completed');
            }}
            title="Завершить"
          >
            ✅
          </button>
          <button 
            className="action-btn mark-deletion-btn"
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
          className="action-btn mark-deletion-btn"
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
        <>
          <button 
            className="action-btn restore-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleRestoreApplication(application.id);
            }}
            title="Восстановить заявку"
          >
            🔄
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={(e) => handleOpenDeleteModal(application, e)}
            title="Удалить заявку"
            disabled={isDeleting}
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </>
      )}
      
      {/* Кнопка удаления для остальных статусов (скрыта для for_deletion) */}
      {application.status !== 'for_delete' && (
        <button 
          className="action-btn delete-btn"
          onClick={(e) => handleOpenDeleteModal(application, e)}
          title="Удалить заявку"
          disabled={isDeleting}
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      )}
    </div>
  );

  return (
    <div className="applications-page-a">
      <div className="page-header-a">
        <div className="header-content-a">
          <h1>Управление заявками</h1>
          <p>Просмотр и управление заявками от клиентов</p>
        </div>
        <div className="header-stats-a">
          <span className="total-count-a">
            Всего заявок: <strong>{applications.length}</strong>
          </span>
        </div>
      </div>

      {/* Фильтры */}
      <Filters 
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Таблица заявок */}
      <DataTable
        columns={columns}
        data={applications}
        loading={loading}
        emptyMessage="Заявки не найдены"
        onRowClick={handleRowClick}
        actions={actions}
        rowClassName={(application) => `status-${application.status}`}
      />

      {/* Пагинация (можно добавить позже) */}
      {applications.length > 0 && (
        <div className="pagination-info">
          <span>
            Показано {applications.length} заявок
            {filters.limit && applications.length === filters.limit && '+'}
          </span>
        </div>
      )}

      {/* Модальное окно с деталями заявки */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Заявка #${selectedApplication?.id}`}
        size="large"
      >
        {selectedApplication && (
          <ApplicationDetails 
            application={selectedApplication}
            onStatusChange={handleStatusChange}
            onDelete={(application) => handleOpenDeleteModal(application, { stopPropagation: () => {} })}
            onWorkerAssigned={handleWorkerAssigned}
          />
        )}
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Подтверждение удаления"
        size="small"
      >
        <div className="delete-confirmation-adm-app">
          <p>Вы уверены, что хотите удалить заявку <strong>#{applicationToDelete?.id}</strong>?</p>
          
          {applicationToDelete && (
            <div className="application-preview-adm-app">
              <p><strong>Клиент:</strong> {applicationToDelete.name}</p>
              <p><strong>Телефон:</strong> {formatPhone(applicationToDelete.phone)}</p>
              <p><strong>Товар:</strong> {applicationToDelete.product}</p>
              <p><strong>Статус:</strong> {APPLICATION_STATUSES[applicationToDelete.status]?.label || applicationToDelete.status}</p>
            </div>
          )}
          
          <p className="delete-warning-adm-app">
            ⚠️ Это действие нельзя отменить! Будут удалены все данные заявки, включая ответы работников.
          </p>
          
          <div className="modal-actions-adm-app">
            <button 
              className="btn-adm-app btn-secondary-adm-app"
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
            >
              Отмена
            </button>
            <button 
              className="btn btn-danger-adm-app"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApplicationsList;