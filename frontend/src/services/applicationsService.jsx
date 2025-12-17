import api from './api';

export const applicationsService = {
  // ==================== КЛИЕНТСКИЕ МЕТОДЫ ====================
  
  /**
   * Создание новой заявки
   */
  async createApplication(applicationData) {
    try {
      const response = await api.post('/applications', applicationData);
      return {
        success: true,
        data: response.data,
        countdownTime: 24 * 60 * 60 // 24 часа в секундах
      };
    } catch (error) {
      throw this.handleError(error, 'Ошибка создания заявки');
    }
  },

  /**
   * Получение заявок пользователя по номеру телефона
   */
  async getUserApplications(phone) {
    try {
      const response = await api.get(`/applications/user/${phone}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка загрузки заявок');
    }
  },

  async getMyApplications() {
  try {
    console.log('📥 Fetching current user applications...');
    const response = await api.get('/applications/my');
    
    console.log('📥 My applications API response:', response);
    
    if (response.data && response.data.success) {
      return response.data.data.applications || [];
    } else {
      throw new Error(response.data?.error || 'Ошибка при загрузке заявок');
    }
  } catch (error) {
    console.error('❌ Get my applications error:', error);
    throw this.handleError(error, 'Ошибка загрузки заявок');
  }
},

  // ==================== АДМИНИСТРАТИВНЫЕ МЕТОДЫ ====================

  /**
   * Получение всех заявок (для администратора)
   */
  async getAllApplications(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Добавляем фильтры в параметры запроса
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/applications?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка загрузки заявок');
    }
  },

  /**
   * Обновление заявки
   */
  async updateApplication(id, applicationData) {
    try {
      const response = await api.put(`/applications/${id}`, applicationData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка обновления заявки');
    }
  },

  /**
   * Удаление заявки
   */
  async deleteApplication(id) {
    try {
      const response = await api.delete(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка удаления заявки');
    }
  },

  // ==================== МЕТОДЫ РАБОТНИКА ====================

  /**
   * Получение заявок для работника
   */
  async getWorkerApplications(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Фильтры для работника (только актуальные заявки)
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/applications/worker?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка загрузки заявок');
    }
  },

  /**
   * Добавление ответа работника к заявке
   */
  async addWorkerResponse(applicationId, responseData) {
    try {
      const response = await api.post(`/applications/${applicationId}/response`, responseData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка добавления ответа');
    }
  },

  // ==================== МЕТОДЫ ОПЕРАТОРА ====================

  /**
   * Пометка заявки на удаление
   */
  async markForDeletion(applicationId) {
    try {
      const response = await api.patch(`/applications/${applicationId}/mark-deletion`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка пометки на удаление');
    }
  },

  /**
   * Снятие пометки на удаление
   */
  async unmarkForDeletion(applicationId) {
    try {
      const response = await api.patch(`/applications/${applicationId}/unmark-deletion`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка снятия пометки на удаление');
    }
  },

  // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Получение статистики по заявкам
   */
  async getApplicationsStats() {
    try {
      const response = await api.get('/applications/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка загрузки статистики');
    }
  },

  /**
   * Поиск заявок
   */
  async searchApplications(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/applications/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка поиска заявок');
    }
  },

  /**
   * Изменение статуса заявки
   */
  async updateApplicationStatus(applicationId, status) {
    try {
      const response = await api.patch(`/applications/${applicationId}/status`, { status });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка изменения статуса заявки');
    }
  },

  /**
   * Получение заявки по ID
   */
  async getApplicationById(id) {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Ошибка загрузки заявки');
    }
  },

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Обработка ошибок API
   */
  handleError(error, defaultMessage) {
    console.error('API Error:', error);

    if (error.response) {
      // Сервер ответил с ошибкой
      const status = error.response.status;
      const message = error.response.data?.message || defaultMessage;

      switch (status) {
        case 400:
          return new Error('Неверный запрос: ' + message);
        case 401:
          return new Error('Требуется авторизация');
        case 403:
          return new Error('Доступ запрещен');
        case 404:
          return new Error('Заявка не найдена');
        case 422:
          return new Error('Ошибка валидации: ' + message);
        case 500:
          return new Error('Внутренняя ошибка сервера');
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      return new Error('Ошибка сети. Проверьте подключение к интернету');
    } else {
      // Что-то пошло не так при настройке запроса
      return new Error(defaultMessage);
    }
  },

  /**
   * Генерация тестовых данных для разработки
   */
  generateMockApplications(count = 5) {
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const products = ['Стол обеденный', 'Стул офисный', 'Шкаф купе', 'Диван угловой', 'Кровать двуспальная'];
    const materials = ['Дерево', 'Металл', 'Пластик', 'Ткань', 'Кожа'];
    const sizes = ['Маленький', 'Средний', 'Большой', 'Индивидуальный'];

    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      clientName: `Клиент ${index + 1}`,
      phone: `+7 (999) ${100 + index}-${20 + index}-${30 + index}`,
      productType: 'Мебель',
      product: products[index % products.length],
      material: materials[index % materials.length],
      size: sizes[index % sizes.length],
      clientComment: index % 3 === 0 ? 'Дополнительные пожелания к заказу' : null,
      status: statuses[index % statuses.length],
      createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      workerResponses: index % 2 === 0 ? [
        {
          id: index * 10 + 1,
          response: 'Заявка принята в работу. Срок выполнения: 5 рабочих дней.',
          createdAt: new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString()
        }
      ] : []
    }));
  }
};

export default applicationsService;