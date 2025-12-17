// src/worker/pages/Dashboard.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWorker } from '../hooks/useWorker';
import './Dashboard.css';

const WorkerDashboard = () => {
  const { stats, loadApplications, loadPortfolio } = useWorker();

  useEffect(() => {
    loadApplications();
    loadPortfolio();
  }, [loadApplications, loadPortfolio]);

  const statCards = [
    {
      title: 'Всего заявок',
      value: stats.totalApplications,
      icon: '📋',
      color: '#3498db',
      link: '/worker/applications'
    },
    {
      title: 'В работе',
      value: stats.pendingApplications,
      icon: '⏳',
      color: '#f39c12',
      link: '/worker/applications?status=in_progress'
    },
    {
      title: 'Завершено',
      value: stats.completedApplications,
      icon: '✅',
      color: '#27ae60',
      link: '/worker/applications?status=completed'
    },
    {
      title: 'Товаров в портфолио',
      value: stats.portfolioCount,
      icon: '💼',
      color: '#9b59b6',
      link: '/worker/portfolio'
    }
  ];

  return (
    <div className="worker-dashboard">
      <div className="dashboard-header">
        <h1>Дашборд работника</h1>
        <p>Обзор вашей активности и заявок</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <Link key={index} to={card.link} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{card.value || 0}</div>
              <div className="stat-title">{card.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Быстрые действия</h3>
          <div className="action-dashwok-buttons">
            <Link to="/worker/applications" className="action-button primary">
              📋 Просмотреть заявки
            </Link>
            <Link to="/worker/portfolio" className="action-button secondary">
              💼 Управление товарами
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;