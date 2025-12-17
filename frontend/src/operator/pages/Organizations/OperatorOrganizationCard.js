import React from 'react';
import { formatPhone, formatDate } from '../../utils/helpers';
import './OperatorOrganizationCard.css';

const OperatorOrganizationCard = ({ organization, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Активный';
      case 'inactive': return 'Неактивный';
      case 'blocked': return 'Заблокирован';
      default: return status;
    }
  };

  return (
    <div className="operator-organization-card" onClick={() => onViewDetails && onViewDetails(organization)}>
      <div className="operator-organization-header">
        <div className="operator-organization-avatar">
          {organization.name ? organization.name.charAt(0).toUpperCase() : 'Р'}
        </div>
        
        <div className="operator-organization-main-info">
          <div className="operator-name-line">
            <h3 className="operator-organization-name">
              {organization.name || 'Без имени'}
            </h3>
            <span 
              className="operator-status-badge"
              style={{ backgroundColor: getStatusColor(organization.status) }}
            >
              {getStatusText(organization.status)}
            </span>
          </div>
          
          {organization.organization && (
            <div className="operator-organization-company">
              🏢 {organization.organization}
            </div>
          )}
          
          <div className="operator-organization-contacts">
            {organization.phone && (
              <span className="operator-organization-phone">
                📱 {formatPhone(organization.phone)}
              </span>
            )}
            {organization.email && (
              <span className="operator-organization-email">
                📧 {organization.email}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="operator-organization-footer">
        <div className="operator-footer-left">
          <span className="operator-id">
            ID: <strong>#{organization.id}</strong>
          </span>
        </div>
        
        <div className="operator-footer-right">
          <span className="operator-date">
            📅 {formatDate(organization.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OperatorOrganizationCard;