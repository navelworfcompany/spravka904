// src/admin/components/Users/UserCard.js
import React, { useState } from 'react';
import { USER_ROLES } from '../../utils/constants';
import { formatPhone, formatDate } from '../../utils/helpers';
import './UserCard.css';

const UserCard = ({ user, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
    organization: user.organization || '',
    status: user.status || 'active',
    password: '' // Добавляем поле для пароля
  });
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('🔄 Saving user updates:', editData);
      
      // Создаем объект только с измененными полями (кроме пароля)
      const updates = {};
      
      if (editData.name !== user.name) updates.name = editData.name;
      if (editData.email !== user.email) updates.email = editData.email;
      if (editData.role !== user.role) updates.role = editData.role;
      if (editData.organization !== user.organization) updates.organization = editData.organization;
      if (editData.status !== user.status) updates.status = editData.status;
      
      // Пароль отправляем только если он не пустой и поле пароля показано
      if (showPasswordField && editData.password.trim() !== '') {
        updates.password = editData.password;
        console.log('🔐 Password will be updated');
      }

      console.log('📤 Final updates to send:', updates);

      if (Object.keys(updates).length > 0) {
        await onUpdate(user.id, updates);
        setIsEditing(false);
        setShowPasswordField(false);
        setEditData(prev => ({ ...prev, password: '' })); // Очищаем пароль после сохранения
      } else {
        console.log('ℹ️ No changes detected');
        setIsEditing(false);
        setShowPasswordField(false);
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      organization: user.organization || '',
      status: user.status || 'active',
      password: ''
    });
    setShowPasswordField(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Удалить пользователя ${user.name}?`)) {
      onDelete(user.id);
    }
  };

  const generatePassword = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    let password = '';
    
    // Добавляем 3 буквы
    for (let i = 0; i < 3; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Добавляем 3 цифры
    for (let i = 0; i < 3; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Перемешиваем
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setEditData(prev => ({ ...prev, password }));
  };

  const togglePasswordField = () => {
    setShowPasswordField(!showPasswordField);
    if (!showPasswordField) {
      setEditData(prev => ({ ...prev, password: '' }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'operator': return '#a36803ff';
      case 'worker': return '#3b82f6';
      case 'user': return '#9710b9ff';
      default: return '#6b7280';
    }
  };

  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="user-avatar">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        
        <div className="user-main-info">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="edit-input"
              placeholder="Имя пользователя"
            />
          ) : (
            <h3 className="user-name">{user.name || 'Без имени'}</h3>
          )}
          
          <div className="user-contacts">
            <span className="user-phone">{formatPhone(user.phone)}</span>
            {user.email && <span className="user-email">{user.email}</span>}
          </div>
        </div>

        <div className="user-actions">
          {isEditing ? (
            <>
              <button 
                className="action-btn save-btn" 
                onClick={handleSave}
                disabled={loading}
                title="Сохранить"
              >
                {loading ? '⏳' : '✅'}
              </button>
              <button 
                className="action-btn cancel-btn" 
                onClick={handleCancel}
                disabled={loading}
                title="Отмена"
              >
                ❌
              </button>
            </>
          ) : (
            <>
              <button 
                className="action-btn edit-btn"
                onClick={() => setIsEditing(true)}
                title="Редактировать"
              >
                ✏️
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={handleDelete}
                title="Удалить"
                disabled={user.role === 'admin'} // Нельзя удалять админов
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      <div className="user-card-body">
        <div className="user-details-grid">
          <div className="detail-group">
            <label className="detail-label">Роль</label>
            {isEditing ? (
              <select
                value={editData.role}
                onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                className="edit-select"
                style={{ borderLeftColor: getRoleColor(editData.role) }}
              >
                {Object.entries(USER_ROLES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <span 
                className="role-badge"
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                {USER_ROLES[user.role] || user.role}
              </span>
            )}
          </div>

          <div className="detail-group">
            <label className="detail-label">Статус</label>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                className="edit-select"
                style={{ borderLeftColor: getStatusColor(editData.status) }}
              >
                <option value="active">Активный</option>
                <option value="inactive">Неактивный</option>
                <option value="blocked">Заблокирован</option>
              </select>
            ) : (
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(user.status) }}
              >
                {user.status === 'active' ? 'Активный' : 
                 user.status === 'inactive' ? 'Неактивный' : 'Заблокирован'}
              </span>
            )}
          </div>

          {user.organization && (
            <div className="detail-group">
              <label className="detail-label">Организация</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.organization}
                  onChange={(e) => setEditData(prev => ({ ...prev, organization: e.target.value }))}
                  className="edit-input"
                  placeholder="Организация"
                />
              ) : (
                <span className="organization">{user.organization}</span>
              )}
            </div>
          )}

          {isEditing && (
            <div className="detail-group">
              <label className="detail-label">Email</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="edit-input"
                placeholder="Email"
              />
            </div>
          )}

          {/* Поле для смены пароля */}
          {isEditing && (
            <div className="detail-group full-width">
              <div className="password-section">
                <label className="detail-label">
                  Смена пароля
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={togglePasswordField}
                  >
                    {showPasswordField ? '❌ Скрыть' : '🔑 Сменить пароль'}
                  </button>
                </label>
                
                {showPasswordField && (
                  <div className="password-field">
                    <input
                      type="text"
                      value={editData.password}
                      onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))}
                      className="edit-input"
                      placeholder="Введите новый пароль"
                    />
                    <button
                      type="button"
                      className="generate-password-btn"
                      onClick={generatePassword}
                      title="Сгенерировать пароль"
                    >
                      🎲
                    </button>
                  </div>
                )}
                
                {showPasswordField && editData.password && (
                  <div className="password-strength">
                    <small>
                      Длина: {editData.password.length} символов
                      {editData.password.length >= 6 ? ' ✅' : ' ❌'}
                    </small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-meta">
          <span className="meta-item">
            ID: <strong>#{user.id}</strong>
          </span>
          <span className="meta-item">
            Создан: {formatDate(user.created_at)}
          </span>
          {user.updated_at && user.updated_at !== user.created_at && (
            <span className="meta-item">
              Обновлен: {formatDate(user.updated_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;