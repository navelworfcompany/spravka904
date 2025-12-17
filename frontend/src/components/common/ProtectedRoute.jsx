// src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', { 
    loading, 
    user: user?.role, 
    allowedRoles,
    currentPath: location.pathname 
  });

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner text="Проверка доступа..." />
      </div>
    );
  }

  if (!user) {
    // Определяем куда перенаправлять в зависимости от требуемой роли
    let loginPath = '/adminl'; // по умолчанию для админов
    
    if (allowedRoles.includes('user')) {
      loginPath = '/client';
    } else if (allowedRoles.includes('worker')) {
      loginPath = '/master';
    } else if (allowedRoles.includes('operator')) {
      loginPath = '/oper';
    }
    
    console.log('🛡️ No user, redirecting to login:', loginPath);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('🛡️ Role mismatch:', { 
      userRole: user.role, 
      allowedRoles,
      redirectTo 
    });

    // Если указан конкретный redirectTo, используем его
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    // Иначе перенаправляем на соответствующую страницу доступа
    if (user.role === 'worker') {
      return <Navigate to="/worker/dashboard" replace />;
    } else if (user.role === 'user') {
      return <Navigate to="/my-applications" replace />;
    } else if (user.role === 'operator') {
      return <Navigate to="/operator" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/access-denied" replace />;
    }
  }

  console.log('🛡️ Access granted to:', location.pathname);
  return children;
};

export default ProtectedRoute;