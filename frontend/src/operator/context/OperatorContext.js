import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { operatorAPI } from '../../services/api';

// Создаем контекст
const OperatorContext = createContext();

// Экспортируем контекст
export { OperatorContext };

// Хук для использования контекста
export const useOperator = () => {
  const context = useContext(OperatorContext);
  if (!context) {
    throw new Error('useOperator must be used within OperatorProvider');
  }
  return context;
};

// Провайдер
export const OperatorProvider = ({ children }) => {
  const { user } = useAuth();
  const isOperator = user?.role === 'operator';

  // ==== СОСТОЯНИЯ ====
  // Уведомления
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dashboard статистика
  const [dashboardStats, setDashboardStats] = useState({
    newApplications: 0,
    totalOrganizations: 0,
    pendingReviews: 0,
    totalReviews: 0
  });

  // Отзывы
  const [reviews, setReviews] = useState([]);
  const [reviewsStats, setReviewsStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsFilters, setReviewsFilters] = useState({
    status: 'all',
    page: 1,
    limit: 20
  });

  // Заявки
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsFilters, setApplicationsFilters] = useState({
    status: '',
    phone: '',
    name: '',
    page: 1,
    limit: 20
  });

  // Организации (работники)
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsFilters, setOrganizationsFilters] = useState({
    name: '',
    organization: '',
    status: '',
    page: 1,
    limit: 20
  });

  // Товары
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState(null);

  // ==== ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ ====
  const addNotification = useCallback((type, title, message) => {
    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => {
      const updated = [notification, ...prev.slice(0, 49)];
      localStorage.setItem('operator_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addSuccessNotification = useCallback((message, title = 'Успешно') => {
    addNotification('success', title, message);
  }, [addNotification]);

  const addErrorNotification = useCallback((message, title = 'Ошибка') => {
    addNotification('error', title, message);
  }, [addNotification]);

  // ==== ФУНКЦИИ ДЛЯ ОТЗЫВОВ ====
const loadReviews = useCallback(async () => {
  if (!isOperator) return;
  
  console.log('📥 Operator: Загрузка отзывов с фильтрами:', reviewsFilters);
  
  setReviewsLoading(true);
  try {
    const response = await operatorAPI.getReviews(reviewsFilters);
    
    console.log('📊 Ответ от operatorAPI.getReviews:', {
      success: response.success,
      reviewsCount: response.reviews?.length || response.data?.reviews?.length || 0,
      rawResponse: response
    });
    
    if (response.success) {
      const reviewsData = response.reviews || response.data?.reviews || [];
      console.log(`✅ Загружено ${reviewsData.length} отзывов`, reviewsData[0]);
      setReviews(reviewsData);
    } else {
      setReviews([]);
      addErrorNotification(response.error || 'Ошибка загрузки отзывов');
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки отзывов:', error);
    setReviews([]);
    addErrorNotification('Ошибка соединения при загрузке отзывов');
  } finally {
    setReviewsLoading(false);
  }
}, [reviewsFilters, isOperator, addErrorNotification]);

  const loadReviewsStats = useCallback(async () => {
    if (!isOperator) return;
    
    try {
      const response = await operatorAPI.getReviewsStats();
      
      if (response.success) {
        setReviewsStats(response.data);
      } else {
        setReviewsStats({
          total: 0,
          byStatus: { pending: 0, checked: 0, rejected: 0 }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики отзывов:', error);
      setReviewsStats({
        total: 0,
        byStatus: { pending: 0, checked: 0, rejected: 0 }
      });
    }
  }, [isOperator]);

  const updateReviewStatus = useCallback(async (reviewId, status) => {
    try {
      const response = await operatorAPI.updateReviewStatus(reviewId, status);
      
      if (response.success) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? { ...review, status } : review
        ));
        
        await loadReviewsStats();
        addSuccessNotification(`Статус отзыва обновлен на "${getStatusText(status)}"`);
        
        return { success: true };
      } else {
        addErrorNotification(response.error || 'Ошибка обновления статуса');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      addErrorNotification('Ошибка соединения при обновлении статуса');
      return { success: false, error: error.message };
    }
  }, [loadReviewsStats, addSuccessNotification, addErrorNotification]);

  const getStatusText = (status) => {
    const texts = {
      pending: 'Модерация',
      checked: 'Одобрен',
      rejected: 'Отклонен'
    };
    return texts[status] || status;
  };

  // ==== ФУНКЦИИ ДЛЯ ЗАЯВОК ====
const loadApplications = useCallback(async () => {
  if (!isOperator) return;
  
  setApplicationsLoading(true);
  try {
    const response = await operatorAPI.getApplications(applicationsFilters);
    
    if (response.success) {
      // 🔥 Обработка разных форматов
      let appsData = [];
      
      if (response.data?.applications && Array.isArray(response.data.applications)) {
        appsData = response.data.applications;
      } else if (response.applications && Array.isArray(response.applications)) {
        appsData = response.applications;
      } else if (response.data && Array.isArray(response.data)) {
        appsData = response.data;
      }
      
      console.log('✅ Загружено заявок:', appsData.length);
      setApplications(appsData);
    } else {
      setApplications([]);
      addErrorNotification(response.error || 'Ошибка загрузки заявок');
    }
  } catch (error) {
    console.error('Ошибка загрузки заявок:', error);
    setApplications([]);
    addErrorNotification('Ошибка соединения при загрузке заявок');
  } finally {
    setApplicationsLoading(false);
  }
}, [applicationsFilters, isOperator, addErrorNotification]);

  const updateApplicationStatus = useCallback(async (applicationId, status) => {
    try {
      const response = await operatorAPI.updateApplicationStatus(applicationId, status);
      
      if (response.success) {
        setApplications(prev => prev.map(app => 
          app.id === applicationId ? { ...app, status } : app
        ));
        addSuccessNotification(`Статус заявки #${applicationId} обновлен`);
        return { success: true };
      } else {
        addErrorNotification(response.error || 'Ошибка обновления статуса');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Ошибка обновления статуса заявки:', error);
      addErrorNotification('Ошибка соединения при обновлении статуса');
      return { success: false, error: error.message };
    }
  }, [addSuccessNotification, addErrorNotification]);

  // ==== ФУНКЦИИ ДЛЯ ОРГАНИЗАЦИЙ ====
  const loadOrganizations = useCallback(async () => {
    if (!isOperator) return;
    
    setOrganizationsLoading(true);
    try {
      const response = await operatorAPI.getOrganizations(organizationsFilters);
      
      if (response.success) {
        const orgs = response.data?.organizations || response.data?.users || [];
        setOrganizations(Array.isArray(orgs) ? orgs : []);
      } else {
        setOrganizations([]);
        addErrorNotification(response.error || 'Ошибка загрузки организаций');
      }
    } catch (error) {
      console.error('Ошибка загрузки организаций:', error);
      setOrganizations([]);
      addErrorNotification('Ошибка соединения при загрузке организаций');
    } finally {
      setOrganizationsLoading(false);
    }
  }, [organizationsFilters, isOperator, addErrorNotification]);

  // ==== ФУНКЦИИ ДЛЯ ТОВАРОВ ====
  const loadProductTypes = useCallback(async () => {
    if (!isOperator) return;
    
    setProductsLoading(true);
    try {
      const response = await operatorAPI.getProductTypes();
      
      if (response.success) {
        const types = response.data?.productTypes || response.data?.types || [];
        setProductTypes(Array.isArray(types) ? types : []);
      } else {
        setProductTypes([]);
        addErrorNotification(response.error || 'Ошибка загрузки типов товаров');
      }
    } catch (error) {
      console.error('Ошибка загрузки типов товаров:', error);
      setProductTypes([]);
      addErrorNotification('Ошибка соединения при загрузке товаров');
    } finally {
      setProductsLoading(false);
    }
  }, [isOperator, addErrorNotification]);

const loadProductsByType = useCallback(async (typeId) => {
  setProductsLoading(true);
  try {
    const response = await operatorAPI.getProductsByType(typeId);
    
    if (response.success) {
      // 🔥 ВАЖНО: Обрабатываем разные форматы ответа
      let productsData = [];
      
      if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (response.products && Array.isArray(response.products)) {
        productsData = response.products;
      } else if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (Array.isArray(response)) {
        productsData = response;
      }
      
      console.log('✅ Загружено товаров:', productsData.length);
      setProducts(productsData);
      setSelectedProductType(typeId);
    } else {
      setProducts([]);
      addErrorNotification(response.error || 'Ошибка загрузки товаров');
    }
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    setProducts([]);
    addErrorNotification('Ошибка соединения при загрузке товаров');
  } finally {
    setProductsLoading(false);
  }
}, [addErrorNotification]);

  // ==== ИНИЦИАЛИЗАЦИЯ ====
  useEffect(() => {
    if (!isOperator) return;

    // Загружаем уведомления из localStorage
    const savedNotifications = JSON.parse(localStorage.getItem('operator_notifications') || '[]');
    setNotifications(savedNotifications);
    
    // Загружаем начальные данные
    // loadReviews();
    // loadReviewsStats();
    // loadApplications();
    // loadOrganizations();
    // loadProductTypes();
    
  }, [isOperator, loadReviews, loadReviewsStats, loadApplications, loadOrganizations, loadProductTypes]);

  // Обновляем счетчик непрочитанных
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // ==== ВОЗВРАЩАЕМЫЙ ОБЪЕКТ ====
  const contextValue = {
    // Общие данные
    isOperator,
    notifications,
    unreadCount,
    dashboardStats,
    
    // Отзывы
    reviews,
    reviewsStats,
    reviewsLoading,
    reviewsFilters,
    setReviewsFilters,
    updateReviewStatus,
    refreshReviews: loadReviews,
    refreshReviewsStats: loadReviewsStats,
    
    // Заявки
    applications,
    applicationsLoading,
    applicationsFilters,
    setApplicationsFilters,
    updateApplicationStatus,
    refreshApplications: loadApplications,
    
    // Организации
    organizations,
    organizationsLoading,
    organizationsFilters,
    setOrganizationsFilters,
    refreshOrganizations: loadOrganizations,
    
    // Товары
    productTypes,
    products,
    productsLoading,
    selectedProductType,
    setSelectedProductType,
    loadProductsByType,
    refreshProductTypes: loadProductTypes,
    
    // Уведомления
    addNotification,
    addSuccessNotification,
    addErrorNotification,
    markNotificationAsRead: (id) => {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    },
    clearNotifications: () => {
      setNotifications([]);
      localStorage.removeItem('operator_notifications');
    },
    removeNotification: (id) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <OperatorContext.Provider value={contextValue}>
      {children}
    </OperatorContext.Provider>
  );
};