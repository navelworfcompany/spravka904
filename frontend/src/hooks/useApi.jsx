// hooks/useApi.js
import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (apiCall, options = {}) => {
    const { showLoading = true, errorMessage = 'Произошла ошибка' } = options;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      console.log('✅ API call successful:', result);
      
      return result;
    } catch (err) {
      const message = err.message || errorMessage;
      setError(message);
      console.error('❌ API Error:', err);
      throw new Error(message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchWithFormData = useCallback(async (url, formData, options = {}) => {
    const { method = 'POST', showLoading = true, errorMessage = 'Произошла ошибка' } = options;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Безопасное определение environment
      const isDevelopment = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      const baseURL = isDevelopment 
        ? 'http://localhost:3001/api' 
        : '/api';

      const fullUrl = `${baseURL}${url}`;
      
      console.log('🔄 Fetching to:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorMessage);
      }

      const result = await response.json();
      console.log('✅ Fetch successful:', result);
      return result;

    } catch (err) {
      const message = err.message || errorMessage;
      setError(message);
      console.error('❌ Fetch Error:', err);
      throw new Error(message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    loading, 
    error, 
    callApi, 
    fetchWithFormData,
    clearError 
  };
};