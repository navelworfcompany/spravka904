// src/components/Worker/WorkerPanel.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WorkerProvider } from '../../worker/hooks/useWorker';
import WorkerLayout from './Layout/WorkerLayout';
import WorkerDashboard from '../../worker/pages/Dashboard';
import ApplicationsList from '../../worker/pages/Applications/ApplicationsList';
import MyPortfolio from '../../worker/pages/Portfolio/MyPortfolio';
import Profile from '../../worker/pages/Profile';

const WorkerPanel = () => {
  return (
    <WorkerProvider>
      <WorkerLayout>
        <Routes>
          <Route index element={<WorkerDashboard />} />
          <Route path="dashboard" element={<WorkerDashboard />} />
          <Route path="applications" element={<ApplicationsList />} />
          <Route path="portfolio" element={<MyPortfolio />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </WorkerLayout>
    </WorkerProvider>
  );
};

export default WorkerPanel;