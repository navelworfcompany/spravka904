import React, { useState } from 'react';
import AdminHeader from '../components/admin/AdminHeader';
import ProductManagement from '../components/admin/ProductManagement';
import UserManagement from '../components/admin/UserManagement';
import ApplicationsManagement from '../components/admin/ApplicationsManagement';
import WorkerRequests from '../components/admin/WorkerRequests';
import './AdminPage.css';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('applications');

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductManagement />;
      case 'users':
        return <UserManagement />;
      case 'requests':
        return <WorkerRequests />;
      case 'applications':
      default:
        return <ApplicationsManagement />;
    }
  };

  return (
    <div className="admin-page">
      <AdminHeader />
      
      <div className="admin-container">
        <nav className="admin-nav">
          <button 
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            Заявки
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Товары
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button 
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Запросы работников
          </button>
        </nav>

        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;