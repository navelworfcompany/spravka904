import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { OperatorProvider } from './context/OperatorContext'; // Импортируем провайдер
import OperatorLayout from './components/Layout/OperatorLayout';
import OperatorDashboard from './pages/Dashboard/OperatorDashboard';
import ApplicationsList from './pages/Applications/ApplicationsList';
import OrganizationsList from './pages/Organizations/OrganizationsList';
import ProductsList from './pages/Products/ProductsList';
import ReviewsList from './pages/Reviews/ReviewsList';

const OperatorPanel = () => {
  console.log('🎪 OperatorPanel рендерится');
  
  return (
    <OperatorProvider> {/* ОБЯЗАТЕЛЬНО обернуть все! */}
      <OperatorLayout>
        <Routes>
          <Route index element={<OperatorDashboard />} />
          <Route path="dashboard" element={<OperatorDashboard />} />
          <Route path="applications" element={<ApplicationsList />} />
          <Route path="organizations" element={<OrganizationsList />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="reviews" element={<ReviewsList />} />
        </Routes>
      </OperatorLayout>
    </OperatorProvider>
  );
};

export default OperatorPanel;