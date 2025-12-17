// src/admin/services/adminAPI.js
import api from '../../services/api';

export const adminAPI = {
  deleteApplication: async (id) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  },

  // Статистика
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Заявки
  getApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getApplication: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  updateApplication: async (id, updates) => {
    const response = await api.put(`/applications/${id}`, updates);
    return response.data;
  },

  markForDeletion: async (id) => {
    const response = await api.patch(`/applications/${id}/mark-deletion`);
    return response.data;
  },

  // Пользователи
getUsers: async (filters = {}) => {
  try {
    console.log('👑 Admin: Getting all users via /api/users...');
    const response = await api.get('/users', { params: filters });
    console.log('✅ Admin API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Admin API Error:', error);
    throw error;
  }
},

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, updates) => {
    const response = await api.put(`/users/${id}`, updates);
    return response.data;
  },

deleteUser: async (id) => {
  try {
    console.log('🗑️ Admin: Deleting user:', id);
    
    // 🔥 ДОБАВЬТЕ ЭТУ ОТЛАДКУ
    console.log('🔍 Full URL will be:', `/users/${id}`);
    console.log('🔍 Current API base URL:', api.defaults.baseURL);
    
    const response = await api.delete(`/users/${id}`);
    console.log('✅ User deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Delete user error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method
      }
    });
    throw error;
  }
},

  // Типы товаров
  getProductTypes: async () => {
    const response = await api.get('/products/types');
    return response.data;
  },

  createProductType: async (data) => {
    const response = await api.post('/products/types', data);
    return response.data;
  },

  updateProductType: async (id, data) => {
    const response = await api.put(`/products/types/${id}`, data);
    return response.data;
  },

  deleteProductType: async (id) => {
    const response = await api.delete(`/products/types/${id}`);
    return response.data;
  },

  // Товары
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  createProduct: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Запросы работников
  getWorkerRequests: async () => {
    const response = await api.get('/users/worker-requests/pending');
    return response.data;
  },

  approveWorkerRequest: async (id) => {
    const response = await api.post(`/users/worker-requests/${id}/approve`);
    return response.data;
  },

  rejectWorkerRequest: async (id) => {
    const response = await api.post(`/users/worker-requests/${id}/reject`);
    return response.data;
  }
};