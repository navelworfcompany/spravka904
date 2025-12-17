import { Application } from '../models/Application.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export class ApplicationService {
  /**
   * Создание новой заявки
   */
  static async createApplication(applicationData, userId = null) {
    try {
      // Если передан user_id, проверяем существование пользователя
      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          throw new AppError('Пользователь не найден', 404);
        }
      }

      const application = await Application.create({
        ...applicationData,
        user_id: userId
      });

      return {
        application: application.toJSON(),
        message: 'Заявка успешно создана'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при создании заявки', 500);
    }
  }

  /**
   * Получение заявок с фильтрацией и пагинацией
   */
  static async getApplications(filters = {}, user = null) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        phone = null,
        includeMarkedForDeletion = false
      } = filters;

      // Если пользователь не админ/оператор, показываем только его заявки
      let userPhone = phone;
      if (user && (user.role === 'user' || user.role === 'worker')) {
        userPhone = user.phone;
      }

      const result = await Application.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        status: status && status !== 'all' ? status : null,
        phone: userPhone,
        markedForDeletion: includeMarkedForDeletion
      });

      return {
        applications: result.applications.map(app => app.toJSON()),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении заявок', 500);
    }
  }

  /**
   * Получение заявки по ID
   */
  static async getApplicationById(id, user = null) {
    try {
      const application = await Application.findById(id);
      
      if (!application) {
        throw new AppError('Заявка не найдена', 404);
      }

      // Проверка прав доступа
      if (user && user.role === 'user' && application.phone !== user.phone) {
        throw new AppError('Доступ к заявке запрещен', 403);
      }

      return application.toJSON();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении заявки', 500);
    }
  }

  async getMyApplications() {
    try {
      console.log('📥 Fetching current user applications...');
      const response = await api.get('/applications/my');
      
      console.log('📊 Full API response:', response);
      
      if (response.data && response.data.success) {
        const applications = response.data.data.applications || [];
        console.log(`✅ Found ${applications.length} real applications from API`);
        return applications;
      } else {
        console.warn('⚠️ API returned unsuccessful response');
        throw new Error(response.data?.error || 'Ошибка при загрузке заявок');
      }
    } catch (error) {
      console.error('❌ Get my applications error:', error);
      
      // Детальная информация об ошибке
      if (error.response) {
        console.error('🔧 Server response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw this.handleError(error, 'Ошибка загрузки заявок');
    }
  }

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
  }

  /**
   * Получение заявок пользователя по телефону
   */
  static async getUserApplications(phone, user = null) {
    try {
      // Проверка прав доступа
      if (user && user.role === 'user' && phone !== user.phone) {
        throw new AppError('Доступ запрещен', 403);
      }

      const applications = await Application.findByPhone(phone);
      
      return applications.map(app => app.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении заявок пользователя', 500);
    }
  }

  /**
   * Обновление заявки
   */
  static async updateApplication(id, updates, user = null) {
    try {
      const application = await Application.findById(id);
      
      if (!application) {
        throw new AppError('Заявка не найдена', 404);
      }

      // Проверка прав доступа
      if (user && user.role === 'user' && application.phone !== user.phone) {
        throw new AppError('Доступ к заявке запрещен', 403);
      }

      // Пользователи могут обновлять только определенные поля
      if (user && user.role === 'user') {
        const allowedFields = ['comment'];
        const filteredUpdates = {};
        
        Object.keys(updates).forEach(key => {
          if (allowedFields.includes(key)) {
            filteredUpdates[key] = updates[key];
          }
        });

        if (Object.keys(filteredUpdates).length === 0) {
          throw new AppError('Нет разрешенных полей для обновления', 400);
        }

        await application.update(filteredUpdates);
      } else {
        await application.update(updates);
      }

      return {
        application: application.toJSON(),
        message: 'Заявка успешно обновлена'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при обновлении заявки', 500);
    }
  }

  /**
   * Добавление ответа работника
   */
  static async addWorkerResponse(applicationId, workerId, response) {
    try {
      const application = await Application.findById(applicationId);
      
      if (!application) {
        throw new AppError('Заявка не найдена', 404);
      }

      // Проверяем, что заявка не помечена на удаление
      if (application.isMarkedForDeletion()) {
        throw new AppError('Нельзя добавлять ответы к заявке, помеченной на удаление', 400);
      }

      await application.addWorkerResponse(workerId, response);

      return {
        application: application.toJSON(),
        message: 'Ответ успешно добавлен'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при добавлении ответа', 500);
    }
  }

  /**
   * Пометка заявки на удаление
   */
  static async markForDeletion(applicationId) {
    try {
      const application = await Application.findById(applicationId);
      
      if (!application) {
        throw new AppError('Заявка не найдена', 404);
      }

      if (application.isMarkedForDeletion()) {
        throw new AppError('Заявка уже помечена на удаление', 400);
      }

      await application.markForDeletion();

      return {
        message: 'Заявка помечена на удаление'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при пометке заявки на удаление', 500);
    }
  }

  /**
   * Удаление заявки
   */
  static async deleteApplication(applicationId) {
    try {
      const application = await Application.findById(applicationId);
      
      if (!application) {
        throw new AppError('Заявка не найдена', 404);
      }

      await application.delete();

      return {
        message: 'Заявка успешно удалена'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при удалении заявки', 500);
    }
  }

  /**
   * Получение статистики по заявкам
   */
  static async getApplicationStats(timeRange = '7days') {
    try {
      const stats = await Application.getStats();
      
      // Дополнительная аналитика по времени
      let timeFilter = '';
      switch (timeRange) {
        case 'today':
          timeFilter = "datetime('now', 'start of day')";
          break;
        case 'week':
          timeFilter = "datetime('now', '-7 days')";
          break;
        case 'month':
          timeFilter = "datetime('now', '-30 days')";
          break;
        default:
          timeFilter = "datetime('now', '-7 days')";
      }

      const recentStats = await Application.getRecentStats(timeFilter);

      return {
        ...stats,
        recent: recentStats
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении статистики заявок', 500);
    }
  }

  static async getApplicationResponses(applicationId) {
  try {
    console.log('🔄 Загружаем ответы для заявки:', applicationId);
    
    const application = await Application.findById(applicationId);
    
    if (!application) {
      throw new AppError('Заявка не найдена', 404);
    }

    // Возвращаем ответы из заявки
    // В модели Application ответы уже должны быть загружены в поле responses
    const applicationData = application.toJSON();
    
    console.log('📦 Ответы из заявки:', applicationData.responses);
    return applicationData.responses || [];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Ошибка при получении ответов заявки', 500);
  }
}
}

export default ApplicationService;