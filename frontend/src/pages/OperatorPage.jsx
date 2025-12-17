import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/admin/AdminHeader';
import ApplicationsList from '../components/operator/ApplicationsList';
import ApplicationDetails from '../components/common/ApplicationDetails';
import { useAuth } from '../context/AuthContext';
import './OperatorPage.css';

const OperatorPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    // Заглушка данных
    const mockApplications = [
      {
        id: 1,
        name: 'Иван Иванов',
        phone: '+79991234567',
        productType: 'Тип 1',
        product: 'Товар 1-1',
        material: 'Материал 1',
        size: 'Большой',
        comment: 'Нужно сделать быстро',
        status: 'new',
        createdAt: new Date().toISOString()
      },
      // ... больше заявок
    ];
    setApplications(mockApplications);
    setLoading(false);
  };

  const handleMarkForDeletion = async (applicationId) => {
    if (window.confirm('Пометить заявку на удаление?')) {
      // API вызов для пометки на удаление
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, markedForDeletion: true }
            : app
        )
      );
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="operator-page">
      <AdminHeader />
      
      <div className="operator-container">
        <h1>Панель оператора</h1>
        <p>Добро пожаловать, {user?.name}</p>

        <div className="applications-section">
          <h2>Все заявки</h2>
          <ApplicationsList
            applications={applications}
            onSelectApplication={setSelectedApplication}
            onMarkForDeletion={handleMarkForDeletion}
            showMarkForDeletion={true}
          />
        </div>

        {selectedApplication && (
          <ApplicationDetails
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            canEdit={false}
          />
        )}
      </div>
    </div>
  );
};

export default OperatorPage;