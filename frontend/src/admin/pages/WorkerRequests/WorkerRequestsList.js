import React, { useState, useEffect } from 'react';
import { workerRequestsAPI } from '../../../services/api';
import { useNotifications } from '../../../context/NotificationContext';
import './WorkerRequestsList.css';

const WorkerRequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [selectedStatus, setSelectedStatus] = useState('all');
    const { showSuccess, showError } = useNotifications();

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (selectedStatus && selectedStatus !== 'all') {
                filters.status = selectedStatus;
            }

            const response = await workerRequestsAPI.getRequests(filters);
            if (response.success) {
                setRequests(response.data.requests || []);
            } else {
                showError('Ошибка загрузки заявок');
            }
        } catch (error) {
            showError('Ошибка загрузки заявок');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await workerRequestsAPI.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchStats();
    }, [selectedStatus]);

    const handleApprove = async (requestId) => {
        if (!window.confirm('Вы уверены, что хотите одобрить эту заявку? Будет создан аккаунт работника.')) {
            return;
        }

        try {
            const response = await workerRequestsAPI.approveRequest(requestId);
            if (response.success) {
                showSuccess('Заявка одобрена, работник зарегистрирован');
                fetchRequests();
                fetchStats();
            }
        } catch (error) {
            showError(error.response?.data?.message || 'Ошибка одобрения заявки');
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Вы уверены, что хотите отклонить эту заявку?')) {
            return;
        }

        try {
            const response = await workerRequestsAPI.rejectRequest(requestId);
            if (response.success) {
                showSuccess('Заявка отклонена');
                fetchRequests();
                fetchStats();
            }
        } catch (error) {
            showError(error.response?.data?.message || 'Ошибка отклонения заявки');
        }
    };

    const handleDelete = async (requestId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
            return;
        }

        try {
            const response = await workerRequestsAPI.deleteRequest(requestId);
            if (response.success) {
                showSuccess('Заявка удалена');
                fetchRequests();
                fetchStats();
            }
        } catch (error) {
            showError(error.response?.data?.message || 'Ошибка удаления заявки');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { class: 'status-pending-compact', text: 'Рассмотрение' },
            approved: { class: 'status-approved-compact', text: 'Одобрена' },
            rejected: { class: 'status-rejected-compact', text: 'Отклонена' }
        };

        const config = statusConfig[status] || { class: 'status-default-compact', text: status };
        return <span className={`status-badge-compact ${config.class}`}>{config.text}</span>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && requests.length === 0) {
        return (
            <div className="worker-requests-container-compact">
                <div className="loading-container-compact">
                    <div className="loading-spinner-compact"></div>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="worker-requests-container-compact">
            <div className="page-header-compact">
                <div className="header-left-compact">
                    <h1>Заявки организаций</h1>
                    <p>Управление заявками на регистрацию</p>
                </div>
                <div className="header-right-compact">
                    <button
                        className="refresh-btn-compact"
                        onClick={fetchRequests}
                        disabled={loading}
                        title="Обновить"
                    >
                        {loading ? '⟳' : '↻'}
                    </button>
                </div>
            </div>

            {/* Компактная статистика */}
            <div className="stats-cards-compact">
                <div className="stat-card-compact total">
                    <div className="stat-icon-compact">📋</div>
                    <div className="stat-info-compact">
                        <div className="stat-value-compact">{stats.total || 0}</div>
                        <div className="stat-label-compact">Всего</div>
                    </div>
                </div>
                <div className="stat-card-compact pending">
                    <div className="stat-icon-compact">⏳</div>
                    <div className="stat-info-compact">
                        <div className="stat-value-compact">{stats.byStatus?.pending || 0}</div>
                        <div className="stat-label-compact">На рассмотрении</div>
                    </div>
                </div>
                <div className="stat-card-compact approved">
                    <div className="stat-icon-compact">✓</div>
                    <div className="stat-info-compact">
                        <div className="stat-value-compact">{stats.byStatus?.approved || 0}</div>
                        <div className="stat-label-compact">Одобрено</div>
                    </div>
                </div>
                <div className="stat-card-compact rejected">
                    <div className="stat-icon-compact">✗</div>
                    <div className="stat-info-compact">
                        <div className="stat-value-compact">{stats.byStatus?.rejected || 0}</div>
                        <div className="stat-label-compact">Отклонено</div>
                    </div>
                </div>
            </div>

            {/* Компактные фильтры */}
            <div className="filters-section-compact">
                <div className="filter-group-compact">
                    <label>Статус:</label>
                    <div className="filter-buttons-compact">
                        <button
                            className={`filter-btn-compact ${selectedStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedStatus('all')}
                        >
                            Все
                        </button>
                        <button
                            className={`filter-btn-compact ${selectedStatus === 'pending' ? 'active' : ''}`}
                            onClick={() => setSelectedStatus('pending')}
                        >
                            ⏳ Рассмотрение
                        </button>
                        <button
                            className={`filter-btn-compact ${selectedStatus === 'approved' ? 'active' : ''}`}
                            onClick={() => setSelectedStatus('approved')}
                        >
                            ✓ Одобренные
                        </button>
                        <button
                            className={`filter-btn-compact ${selectedStatus === 'rejected' ? 'active' : ''}`}
                            onClick={() => setSelectedStatus('rejected')}
                        >
                            ✗ Отклоненные
                        </button>
                    </div>
                </div>
            </div>

            {/* Компактная таблица */}
            <div className="requests-table-container-compact">
                {requests.length === 0 ? (
                    <div className="empty-state-compact">
                        <div className="empty-icon-compact">📭</div>
                        <h3>Нет заявок</h3>
                        <p>По выбранным фильтрам заявок не найдено</p>
                    </div>
                ) : (
                    <div className="table-scroll-container-compact">
                        <table className="requests-table-compact">
                            <thead>
                                <tr>
                                    <th className="compact-id">ID</th>
                                    <th className="compact-org">Организация</th>
                                    <th className="compact-contact">Контакты</th>
                                    <th className="compact-status">Статус</th>
                                    <th className="compact-date">Дата</th>
                                    <th className="compact-actions">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id} className="request-row-compact">
                                        <td className="compact-id">
                                            <span className="request-id-compact">#{request.id}</span>
                                        </td>
                                        <td className="compact-org">
                                            <div className="org-info-compact">
                                                <div className="org-name-compact">{request.organization}</div>
                                                {request.locations && request.locations.length > 0 && (
                                                    <div className="org-locations-compact">
                                                        <span className="location-badge-compact">
                                                            📍 {request.locations[0]}
                                                            {request.locations.length > 1 && ` +${request.locations.length - 1}`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="compact-contact">
                                            <div className="contact-info-compact">
                                                <div className="contact-phone-compact">{request.phone}</div>
                                                <div className="contact-email-compact">{request.email}</div>
                                            </div>
                                        </td>
                                        <td className="compact-status">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="compact-date">
                                            <div className="date-compact">{formatDate(request.created_at)}</div>
                                        </td>
                                        <td className="compact-actions">
                                            <div className="actions-group-compact">
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="action-btn-compact approve-btn-compact"
                                                            onClick={() => handleApprove(request.id)}
                                                            title="Одобрить"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className="action-btn-compact reject-btn-compact"
                                                            onClick={() => handleReject(request.id)}
                                                            title="Отклонить"
                                                        >
                                                            ✗
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="action-btn-compact delete-btn-compact"
                                                    onClick={() => handleDelete(request.id)}
                                                    title="Удалить"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Информация о количестве */}
            {requests.length > 0 && (
                <div className="table-footer-compact">
                    <div className="footer-info-compact">
                        Показано: <strong>{requests.length}</strong> заявок
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerRequestsList;