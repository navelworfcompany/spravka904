import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // Заглушка данных
    const mockUsers = [
      { id: 1, phone: 'admin', password: 'admin', role: 'admin', name: 'Администратор', email: 'admin@example.com' },
      { id: 2, phone: 'operator', password: 'operator', role: 'operator', name: 'Оператор', email: 'operator@example.com' },
      { id: 3, phone: '+79991234567', password: 'user123', role: 'user', name: 'Иван Иванов', email: 'ivan@example.com' },
    ];
    setUsers(mockUsers);
  };

  const handleAddUser = (userData) => {
    const newUser = { ...userData, id: Date.now() };
    setUsers(prev => [...prev, newUser]);
    setShowUserForm(false);
  };

  const handleEditUser = (userData) => {
    setUsers(prev => 
      prev.map(user => user.id === editingUser.id ? { ...user, ...userData } : user)
    );
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Удалить этого пользователя?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Управление пользователями</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowUserForm(true)}
        >
          Добавить пользователя
        </button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.phone}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' && 'Администратор'}
                    {user.role === 'operator' && 'Оператор'}
                    {user.role === 'worker' && 'Работник'}
                    {user.role === 'user' && 'Клиент'}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setEditingUser(user)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserForm && (
        <UserForm
          user={null}
          onSubmit={handleAddUser}
          onClose={() => setShowUserForm(false)}
        />
      )}

      {editingUser && (
        <UserForm
          user={editingUser}
          onSubmit={handleEditUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};

const UserForm = ({ user, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              placeholder={user ? "Оставьте пустым, чтобы не менять" : ""}
            />
          </div>

          <div className="form-group">
            <label>Роль:</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">Клиент</option>
              <option value="worker">Работник</option>
              <option value="operator">Оператор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {user ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;