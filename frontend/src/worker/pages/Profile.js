import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useWorker } from '../hooks/useWorker';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotifications();
  const { stats } = useWorker();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification('Профиль успешно обновлен', 'success');
    } catch (error) {
      showNotification('Ошибка при обновлении профиля', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="worker-profile-page">
      <div className="profile-header">
        <h1>Мой профиль</h1>
        <p>Управление вашими данными</p>
      </div>

      <div className="profile-content">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Основная информация</h3>
            
            <Input
              label="Имя"
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              placeholder="Введите ваше полное имя"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
              placeholder="Введите ваш email"
            />

            <Input
              label="Телефон"
              type="tel"
              value={formData.phone}
              onChange={(value) => handleChange('phone', value)}
              placeholder="+7 (XXX) XXX-XX-XX"
              disabled
            />

            <Input
              label="Организация"
              value={formData.organization}
              onChange={(value) => handleChange('organization', value)}
              placeholder="Название вашей организации"
            />
          </div>

          <div className="form-actions">
            <Button
              className='btn-profwok'
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Сохранить изменения
            </Button>
          </div>
        </form>

        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              👷
            </div>
            <h3>{user?.name || 'Кто-то'}</h3>
            <p className="profile-role">Мастер</p>
            <p className="profile-organization">{user?.organization || 'Не указана'}</p>
          </div>

          <div className="profile-stats">
            <h4>Статистика</h4>
            <div className="stat-item">
              <span>Заявок в работе:</span>
              <strong>{stats?.pendingApplications || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Завершено заявок:</span>
              <strong>{stats?.completedApplications || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Товаров в портфолио:</span>
              <strong>{stats?.portfolioCount || 0}</strong>
            </div>
          </div>

          <div className="profile-actions">
            <Button variant="outline" onClick={logout} className='btn-profwok'>
              🚪 Выйти из системы
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;