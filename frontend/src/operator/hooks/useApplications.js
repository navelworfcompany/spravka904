import { useContext } from 'react';
import { OperatorContext } from '../context/OperatorContext';

export const useApplications = () => {
  const context = useContext(OperatorContext);
  
  if (!context) {
    throw new Error('useApplications must be used within OperatorProvider');
  }
  
  const {
    applications,
    applicationsLoading,
    applicationsFilters,
    setApplicationsFilters,
    updateApplicationStatus,
    refreshApplications,
    addSuccessNotification,
    addErrorNotification
  } = context;
  
  return {
    applications,
    loading: applicationsLoading,
    filters: applicationsFilters,
    setFilters: setApplicationsFilters,
    updateApplicationStatus,
    refreshApplications,
    addSuccessNotification,
    addErrorNotification
  };
};