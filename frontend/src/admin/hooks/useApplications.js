import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminAPI';
import { useAdmin } from './useAdmin';

export const useApplications = (initialFilters = {}) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 50,
    ...initialFilters
  });
  const { addNotification } = useAdmin();

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getApplications(filters);
      setApplications(response.applications || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить заявки'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      await adminAPI.updateApplication(id, { status });
      await loadApplications();
      
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Статус заявки обновлен'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось обновить статус'
      });
    }
  };

  const deleteApplication = async (applicationId) => {
    try {
      console.log('🗑️ Deleting application:', applicationId);
      
      // Используем adminAPI вместо прямого fetch
      const result = await adminAPI.deleteApplication(applicationId);
      console.log('✅ Delete API response:', result);

      // Удаляем заявку из локального состояния
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Заявка успешно удалена'
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Delete application error:', error);
      
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить заявку: ' + error.message
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  useEffect(() => {
    loadApplications();
  }, [filters]);

  return {
    applications,
    loading,
    filters,
    setFilters,
    updateApplicationStatus,
    deleteApplication,
    refreshApplications: loadApplications
  };
};