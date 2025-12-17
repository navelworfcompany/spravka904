// src/admin/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminAPI';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshUsers = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Admin useUsers: Fetching users...');
      const response = await adminAPI.getUsers(filters);
      
      console.log('📥 Admin useUsers - Response:', response);
      
      if (response.success) {
        // 🔥 Адаптируемся к новому формату ответа
        let usersData = [];
        
        if (response.data?.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (Array.isArray(response.users)) {
          usersData = response.users;
        } else if (Array.isArray(response)) {
          usersData = response;
        }
        
        console.log(`✅ Admin: Loaded ${usersData.length} users`);
        setUsers(usersData);
      } else {
        setError(response.error || 'Ошибка загрузки');
        setUsers([]);
      }
      
    } catch (error) {
      console.error('❌ Admin useUsers - Error:', error);
      setError(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return { 
    users, 
    loading, 
    error,
    refreshUsers,
    empty: users.length === 0,
    count: users.length
  };
};