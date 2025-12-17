import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { WorkerRequest } from '../models/WorkerRequest.js';
import { AppError } from '../middleware/errorHandler.js';

export class UserService {
  /**
   * Получение всех пользователей
   */
  static async getUsers(filters = {}) {
    try {
      const { page = 1, limit = 10, role = null } = filters;

      const result = await User.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        role: role
      });

      return {
        users: result.users.map(user => user.toJSON()),
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
      throw new AppError('Ошибка при получении пользователей', 500);
    }
  }

  /**
   * Создание пользователя
   */
  static async createUser(userData) {
    try {
      // Проверяем существующего пользователя
      const existingUser = await User.findByPhone(userData.phone);
      if (existingUser) {
        throw new AppError('Пользователь с таким телефоном уже существует', 400);
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      return {
        user: user.toJSON(),
        message: 'Пользователь успешно создан'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при создании пользователя', 500);
    }
  }

  /**
   * Обновление пользователя
   */
  static async updateUser(id, updates, currentUserId) {
    try {
      // Нельзя обновлять самого себя через этот метод (используйте updateProfile)
      if (parseInt(id) === parseInt(currentUserId)) {
        throw new AppError('Для обновления собственного профиля используйте endpoint /api/auth/profile', 400);
      }

      const user = await User.findById(id);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      // Хешируем новый пароль если он предоставлен
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 12);
      }

      await user.update(updates);

      return {
        user: user.toJSON(),
        message: 'Пользователь успешно обновлен'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при обновлении пользователя', 500);
    }
  }

  /**
   * Удаление пользователя
   */
  static async deleteUser(id, currentUserId) {
    try {
      // Нельзя удалить самого себя
      if (parseInt(id) === parseInt(currentUserId)) {
        throw new AppError('Нельзя удалить собственный аккаунт', 400);
      }

      const user = await User.findById(id);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      await user.delete();

      return {
        message: 'Пользователь успешно удален'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при удалении пользователя', 500);
    }
  }

  /**
   * Получение pending запросов работников
   */
  static async getPendingWorkerRequests(filters = {}) {
    try {
      const { page = 1, limit = 10 } = filters;

      const result = await WorkerRequest.findPending({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return {
        requests: result.requests.map(request => request.toJSON()),
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
      throw new AppError('Ошибка при получении запросов работников', 500);
    }
  }

  /**
   * Одобрение запроса работника
   */
  static async approveWorkerRequest(requestId) {
    try {
      const workerRequest = await WorkerRequest.findById(requestId);
      
      if (!workerRequest) {
        throw new AppError('Запрос не найден', 404);
      }

      if (!workerRequest.isPending()) {
        throw new AppError('Запрос уже обработан', 400);
      }

      await workerRequest.approve();

      return {
        message: 'Запрос работника одобрен, пользователь создан'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при одобрении запроса работника', 500);
    }
  }

  /**
   * Отклонение запроса работника
   */
  static async rejectWorkerRequest(requestId) {
    try {
      const workerRequest = await WorkerRequest.findById(requestId);
      
      if (!workerRequest) {
        throw new AppError('Запрос не найден', 404);
      }

      if (!workerRequest.isPending()) {
        throw new AppError('Запрос уже обработан', 400);
      }

      await workerRequest.reject();

      return {
        message: 'Запрос работника отклонен'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при отклонении запроса работника', 500);
    }
  }

  /**
   * Получение статистики по пользователям
   */
  static async getUserStats() {
    try {
      const stats = await User.getStats();
      
      // Дополнительная статистика
      const recentUsers = await User.getRecentUsersCount('7days');
      const activeToday = await User.getActiveUsersCount();

      return {
        ...stats,
        recent_users: recentUsers,
        active_today: activeToday
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении статистики пользователей', 500);
    }
  }

  /**
   * Блокировка пользователя
   */
  static async blockUser(id, currentUserId) {
    try {
      // Нельзя заблокировать самого себя
      if (parseInt(id) === parseInt(currentUserId)) {
        throw new AppError('Нельзя заблокировать собственный аккаунт', 400);
      }

      const user = await User.findById(id);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      await user.update({ status: 'blocked' });

      return {
        message: 'Пользователь заблокирован'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при блокировке пользователя', 500);
    }
  }

  /**
   * Разблокировка пользователя
   */
  static async unblockUser(id) {
    try {
      const user = await User.findById(id);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      await user.update({ status: 'active' });

      return {
        message: 'Пользователь разблокирован'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при разблокировке пользователя', 500);
    }
  }
}

export default UserService;