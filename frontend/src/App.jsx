import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/client/NotificationContainer';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Страницы
import ClientPage from './pages/ClientPage';
import OperatorPage from './pages/OperatorPage';
import LoginClient from './pages/LoginClient';
import LoginAdmin from './pages/LoginAdmin';
import LoginWorker from './pages/LoginWorker';
import LoginOperator from './pages/LoginOperator';
import NotFoundPage from './pages/NotFoundPage';
import AccessDenied from './pages/AccessDenied';

// Админ панель
import AdminPanel from './components/admin/AdminPanel';

// Worker панель
import WorkerPanel from './components/worker/WorkerPanel';

import OperatorPanel from './operator/OperatorPanel';

// Регистрация работника (публичная)
import WorkerRegistration from './components/worker/WorkerRegistration';

// Стили
import './App.css';
import ReviewPage from './components/client/ReviewPage';

// Защищенный роут для админа
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner text="Проверка доступа..." />
      </div>
    );
  }

  return user?.role === 'admin' ? children : <Navigate to="/adminl" replace />;
};

// Компонент для роутинга
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Загрузка приложения...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/" element={<ClientPage />} /> {/* Главная страница */}
      <Route path="/adminl" element={<LoginAdmin />} />
      <Route path="/oper" element={<LoginOperator />} />
      <Route path="/master" element={<LoginWorker />} />
      <Route path="/rmaster" element={<WorkerRegistration />} /> {/* Публичная регистрация */}
      <Route path="/client" element={<LoginClient />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Защищенные маршруты */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/*"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker/*"
        element={
          <ProtectedRoute allowedRoles={['worker', 'admin', 'operator']}>
            <WorkerPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/review/*"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <ReviewPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback для неизвестных маршрутов */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Главный компонент приложения
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <div className="App">
              <AppRoutes />
              <NotificationContainer />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;