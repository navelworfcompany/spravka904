import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminProvider } from '../../admin/hooks/useAdmin';
import AdminLayout from '../../admin/components/Layout/AdminLayout';
import Dashboard from '../../admin/pages/Dashboard';
import ApplicationsList from '../../admin/pages/Applications/ApplicationsList';
import UsersList from '../../admin/pages/Users/UsersList';
import ProductTypes from '../../admin/pages/Products/ProductTypes';
import Settings from '../../admin/pages/Settings';
import WorkerRequests from '../../admin/pages/WorkerRequests/WorkerRequestsList';
import ReviewsList from '../../admin/pages/Reviews/ReviewsList'; // Добавляем импорт

const AdminPanel = () => {
  return (
    <AdminProvider>
      <AdminLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<ApplicationsList />} />
          <Route path="users" element={<UsersList />} />
          <Route path="products" element={<ProductTypes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="worker-requests" element={<WorkerRequests />} />
          <Route path="reviews" element={<ReviewsList />} />
        </Routes>
      </AdminLayout>
    </AdminProvider>
  );
};

export default AdminPanel;