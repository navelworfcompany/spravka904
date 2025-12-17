// src/admin/pages/Users/UsersList.js
import React, { useState, useMemo, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAdmin } from '../../hooks/useAdmin';
import { adminAPI } from '../../services/adminAPI';
import UserCard from './UserCard';
import CreateUserModal from './CreateUserModal';
import UserFilters from './UserFilters';
import './UsersList.css';

const UsersList = () => {
  const { users, loading, refreshUsers } = useUsers();
  const { addNotification } = useAdmin();
  
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // ✅ Правильно добавленный useEffect для отладки
  useEffect(() => {
    console.log('🔍 USERS DATA DEBUG:');
    console.log('📦 users:', users);
    console.log('🔄 loading:', loading);
    console.log('📊 users type:', typeof users);
    console.log('🔢 users length:', Array.isArray(users) ? users.length : 'not array');
    
    if (Array.isArray(users)) {
      console.log('👤 First user:', users[0]);
      console.log('🏷️ All roles:', [...new Set(users.map(u => u.role))]);
    } else {
      console.log('❌ users is not array, keys:', users ? Object.keys(users) : 'null');
    }
  }, [users, loading]);

  // Маппинг реальных ролей на отображаемые названия
  const roleDisplayNames = {
    'client': 'Клиенты',
    'worker': 'Мастера', 
    'operator': 'Операторы',
    'admin': 'Админы',
    'user': 'Клиенты' // дополнительный вариант, если role = 'user'
  };

  // Фильтрация пользователей
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filters.role && user.role !== filters.role) {
        return false;
      }
      
      if (filters.status && user.status !== filters.status) {
        return false;
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchFields = [
          user.name,
          user.phone,
          user.email,
          user.organization
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  }, [users, filters]);

  // Статистика по ролям с красивыми названиями
  const roleStats = useMemo(() => {
    const stats = {
      'Клиенты': 0,
      'Мастера': 0,
      'Операторы': 0,
      'Админы': 0
    };
    
    users.forEach(user => {
      const displayRole = roleDisplayNames[user.role] || 'Клиенты';
      stats[displayRole] = (stats[displayRole] || 0) + 1;
    });
    
    return stats;
  }, [users]);

  const handleUpdateUser = async (userId, updates) => {
    try {
      await adminAPI.updateUser(userId, updates);
      await refreshUsers();
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Пользователь обновлен'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось обновить пользователя'
      });
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      await refreshUsers();
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Пользователь удален'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить пользователя'
      });
    }
  };

  const handleCreateUser = async (userData) => {
    setCreating(true);
    try {
      await adminAPI.createUser(userData);
      await refreshUsers();
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Пользователь создан'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось создать пользователя'
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      role: '',
      status: '',
      search: ''
    });
  };

  // Временная отладочная информация
  console.log('🎨 RENDER DEBUG - filteredUsers:', filteredUsers);
  console.log('🎨 RENDER DEBUG - filteredUsers length:', filteredUsers.length);

  return (
    <div className="users-page-adm-us">
      <div className="page-header-adm-us">
        <div className="header-content-adm-us">
          <h1>Управление пользователями</h1>
          <p>Создание, редактирование и управление пользователями системы</p>
        </div>
        
        <div className="header-actions-adm-us">
          <button 
            className="create-user-btn-adm-us"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Создать пользователя
          </button>
        </div>
      </div>

      {/* Статистика по ролям */}
      <div className="role-stats-adm-us">
        <h3>Распределение по ролям</h3>
        <div className="stats-grid-adm-us">
          {Object.entries(roleStats).map(([role, count]) => (
            <div key={role} className="role-stat-card-adm-us">
              <span className="role-name-adm-us">{role}</span>
              <span className="role-count-adm-us">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Фильтры */}
      <UserFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Результаты фильтрации */}
      <div className="results-info-adm-us">
        <span>
          Найдено пользователей: <strong>{filteredUsers.length}</strong>
          {filters.role || filters.status || filters.search ? ' (отфильтровано)' : ''}
        </span>
      </div>

      {/* Список пользователей */}
      {loading ? (
        <div className="users-loading-adm-us">
          <div className="loading-spinner-adm-us">⟳</div>
          <p>Загрузка пользователей...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="users-grid-adm-us">
          {filteredUsers.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onUpdate={handleUpdateUser}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>
      ) : (
        <div className="no-users-adm-us">
          <div className="no-users-icon-adm-us">👥</div>
          <h3>Пользователи не найдены</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
          <button 
            className="create-user-btn-adm-us"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Создать первого пользователя
          </button>
        </div>
      )}

      {/* Модальное окно создания пользователя */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

export default UsersList;