import { useContext } from 'react';
import { OperatorContext } from '../context/OperatorContext';

export const useOrganizations = () => {
  const context = useContext(OperatorContext);
  
  if (!context) {
    throw new Error('useOrganizations must be used within OperatorProvider');
  }
  
  const {
    organizations,
    organizationsLoading,
    organizationsFilters,
    setOrganizationsFilters,
    refreshOrganizations,
    addSuccessNotification,
    addErrorNotification
  } = context;
  
  return {
    organizations,
    loading: organizationsLoading,
    filters: organizationsFilters,
    setFilters: setOrganizationsFilters,
    refreshOrganizations,
    addSuccessNotification,
    addErrorNotification
  };
};