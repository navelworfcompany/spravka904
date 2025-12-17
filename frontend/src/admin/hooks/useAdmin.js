// src/admin/hooks/useAdmin.js
import { useState, useEffect, createContext, useContext } from 'react';
import { adminAPI } from '../services/adminAPI';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Добавление уведомления
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // Загрузка начальных данных
  useEffect(() => {
    loadStats();
  }, []);

  const value = {
    stats,
    notifications,
    loading,
    loadStats,
    addNotification,
    refreshStats: loadStats
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};