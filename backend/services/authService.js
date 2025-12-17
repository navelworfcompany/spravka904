import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { WorkerRequest } from '../models/WorkerRequest.js';
import { AppError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  /**
   * Аутентификация пользователя
   */
  static async login(phone, password) {
    try {
      // Находим пользователя
      const user = await User.findByPhone(phone);
      
      if (!user) {
        throw new AppError('Неверный телефон или пароль', 401);
      }

      // Проверяем статус пользователя
      if (user.status !== 'active') {
        throw new AppError('Аккаунт заблокирован или удален', 401);
      }

      // Проверяем пароль
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        throw new AppError('Неверный телефон или пароль', 401);
      }

      // Генерируем токен
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user: user.toJSON()
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при аутентификации', 500);
    }
  }

  /**
   * Регистрация запроса работника
   */
  static async registerWorker(workerData) {
    try {
      const { organization, phone, email, password } = workerData;

      // Проверяем существующего пользователя
      const existingUser = await User.findByPhone(phone);
      if (existingUser) {
        throw new AppError('Пользователь с таким телефоном уже существует', 400);
      }

      // Проверяем pending запросы
      const existingRequest = await WorkerRequest.findByPhone(phone);
      if (existingRequest) {
        throw new AppError('Заявка на этот номер телефона уже находится на рассмотрении', 400);
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 12);

      // Создаем запрос
      const workerRequest = await WorkerRequest.create({
        organization,
        phone,
        email,
        password: hashedPassword
      });

      return {
        message: 'Заявка на регистрацию успешно отправлена. Ожидайте подтверждения администратором.',
        requestId: workerRequest.id
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при регистрации работника', 500);
    }
  }

  /**
   * Получение текущего пользователя
   */
  static async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      if (user.status !== 'active') {
        throw new AppError('Аккаунт заблокирован или удален', 401);
      }

      return user.toJSON();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении данных пользователя', 500);
    }
  }

  /**
   * Обновление профиля пользователя
   */
  static async updateProfile(userId, updates) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      // Обновляем профиль
      await user.update(updates);

      return {
        user: user.toJSON(),
        message: 'Профиль успешно обновлен'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при обновлении профиля', 500);
    }
  }

  /**
   * Смена пароля пользователя
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await user.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('Текущий пароль неверен', 400);
      }

      // Меняем пароль
      await user.changePassword(newPassword);

      return {
        message: 'Пароль успешно изменен'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при смене пароля', 500);
    }
  }

  /**
   * Валидация JWT токена
   */
  static async validateToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        throw new AppError('Неверный токен', 401);
      }

      return user.toJSON();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Неверный токен', 401);
      }
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Токен истек', 401);
      }
      throw new AppError('Ошибка валидации токена', 401);
    }
  }

  /**
   * Обновление токена (refresh token)
   */
  static async refreshToken(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user || user.status !== 'active') {
        throw new AppError('Пользователь не найден', 404);
      }

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user: user.toJSON()
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при обновлении токена', 500);
    }
  }
}

export default AuthService;