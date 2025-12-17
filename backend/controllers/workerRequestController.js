import { WorkerRequest } from '../models/WorkerRequest.js';
import { AppError } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

export const workerRequestController = {
  // Создать новую заявку на регистрацию
  async createRequest(req, res, next) {
    try {
      const { organization, phone, email, password, locations } = req.body;

      console.log('📝 Создание заявки работника:', {
        organization,
        phone,
        email,
        locations: locations || []
      });

      // Валидация
      if (!organization || !phone || !email || !password) {
        throw new AppError('Все обязательные поля должны быть заполнены', 400);
      }

      if (password.length < 6) {
        throw new AppError('Пароль должен содержать минимум 6 символов', 400);
      }

      // Проверяем, нет ли уже pending заявки с этим телефоном
      const existingRequest = await WorkerRequest.findByPhone(phone);
      if (existingRequest) {
        throw new AppError('Заявка с этим номером телефона уже находится на рассмотрении', 400);
      }

      // Создаем заявку
      const requestData = {
        organization,
        phone,
        email,
        password,
        locations: locations || []
      };

      const workerRequest = await WorkerRequest.create(requestData);

      console.log('✅ Заявка создана с ID:', workerRequest.id);

      res.status(201).json({
        success: true,
        message: 'Заявка на регистрацию успешно отправлена',
        data: {
          request: workerRequest.toJSON()
        }
      });
    } catch (error) {
      console.error('❌ Ошибка создания заявки:', error);
      next(error);
    }
  },

  // Получить все pending заявки (для админа)
  async getPendingRequests(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      console.log('📋 Получение pending заявок:', { page, limit });

      const result = await WorkerRequest.findPending({ page, limit });

      res.json({
        success: true,
        data: {
          requests: result.requests.map(req => req.toJSON()),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages
          }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка получения заявок:', error);
      next(error);
    }
  },

  // Получить все заявки с фильтрацией (для админки)
  async getAllRequests(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;

      console.log('📋 Получение всех заявок с параметрами:', {
        page,
        limit,
        status
      });

      // Преобразуем параметры в числа
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      const result = await WorkerRequest.findAll({
        page: pageNum,
        limit: limitNum,
        status
      });

      console.log('📋 Результат поиска:', {
        found: result.requests.length,
        total: result.total,
        status: status || 'all'
      });

      // ГАРАНТИРОВАННЫЙ ОТВЕТ - даже если данных нет
      res.json({
        success: true,
        data: {
          requests: result.requests.map(req => req.toJSON()),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages
          }
        }
      });

    } catch (error) {
      console.error('❌ Ошибка получения заявок:', error);

      // Даже при ошибке возвращаем структурированный ответ
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении заявок',
        error: error.message
      });
    }
  },

  // Одобрить заявку
  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;

      console.log('✅ Одобрение заявки:', id);

      const workerRequest = await WorkerRequest.findById(id);
      if (!workerRequest) {
        throw new AppError('Заявка не найдена', 404);
      }

      if (!workerRequest.isPending()) {
        throw new AppError('Заявка уже обработана', 400);
      }

      // Хешируем пароль перед созданием пользователя
      const hashedPassword = bcrypt.hashSync(workerRequest.password, 12);

      // Создаем пользователя напрямую в базе данных
      const db = (await import('../database/init.js')).db;

      const userStmt = db.prepare(`
        INSERT INTO users (phone, password, name, email, role, organization) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = userStmt.run(
        workerRequest.phone,
        hashedPassword,
        workerRequest.organization,
        workerRequest.email,
        'worker',
        workerRequest.organization
      );

      console.log('✅ Пользователь создан с ID:', result.lastInsertRowid);

      // Обновляем статус заявки на approved
      const updateStmt = db.prepare(
        `UPDATE worker_requests SET status = 'approved' WHERE id = ?`
      );
      updateStmt.run(workerRequest.id);

      console.log('✅ Заявка одобрена, работник зарегистрирован');

      res.json({
        success: true,
        message: 'Заявка одобрена, работник зарегистрирован',
        data: {
          request: {
            ...workerRequest.toJSON(),
            status: 'approved'
          },
          user: {
            id: result.lastInsertRowid,
            phone: workerRequest.phone,
            name: workerRequest.organization,
            email: workerRequest.email,
            role: 'worker',
            organization: workerRequest.organization
          }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка одобрения заявки:', error);

      // Если ошибка связана с дубликатом телефона
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.phone')) {
        next(new AppError('Пользователь с таким номером телефона уже существует', 400));
      } else {
        next(error);
      }
    }
  },

  // Отклонить заявку
  async rejectRequest(req, res, next) {
    try {
      const { id } = req.params;

      console.log('❌ Отклонение заявки:', id);

      const workerRequest = await WorkerRequest.findById(id);
      if (!workerRequest) {
        throw new AppError('Заявка не найдена', 404);
      }

      if (!workerRequest.isPending()) {
        throw new AppError('Заявка уже обработана', 400);
      }

      // Обновляем статус заявки на rejected
      const db = (await import('../database/init.js')).db;
      const stmt = db.prepare(
        `UPDATE worker_requests SET status = 'rejected' WHERE id = ?`
      );
      stmt.run(workerRequest.id);

      console.log('✅ Заявка отклонена');

      res.json({
        success: true,
        message: 'Заявка отклонена',
        data: {
          request: {
            ...workerRequest.toJSON(),
            status: 'rejected'
          }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка отклонения заявки:', error);
      next(error);
    }
  },

  // Удалить заявку
  async deleteRequest(req, res, next) {
    try {
      const { id } = req.params;

      console.log('🗑️ Удаление заявки:', id);

      const workerRequest = await WorkerRequest.findById(id);
      if (!workerRequest) {
        throw new AppError('Заявка не найдена', 404);
      }

      // Удаляем заявку из базы данных
      const db = (await import('../database/init.js')).db;
      const stmt = db.prepare('DELETE FROM worker_requests WHERE id = ?');
      stmt.run(workerRequest.id);

      console.log('✅ Заявка удалена');

      res.json({
        success: true,
        message: 'Заявка удалена'
      });
    } catch (error) {
      console.error('❌ Ошибка удаления заявки:', error);
      next(error);
    }
  },

  // Получить статистику по заявкам
  async getStats(req, res, next) {
    try {
      console.log('📊 Получение статистики заявок');

      const stats = await WorkerRequest.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
      next(error);
    }
  }
};