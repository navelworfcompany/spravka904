// controllers/workerController.js
import { db } from '../database/init.js';
import { AppError } from '../middleware/errorHandler.js';

export const workerController = {
  // Получить портфолио работника
  async getPortfolio(req, res, next) {
    try {
      const workerId = req.user.id;

      console.log('💼 Получение портфолио для работника:', workerId);

      const stmt = db.prepare(`
        SELECT 
          p.*,
          pt.name as product_type_name,
          wp.price as worker_price
        FROM worker_portfolio wp
        JOIN products p ON wp.product_id = p.id
        LEFT JOIN product_types pt ON p.type_id = pt.id
        WHERE wp.worker_id = ?
        ORDER BY p.name
      `);

      const portfolio = stmt.all(workerId);

      console.log(`✅ Найдено товаров в портфолио: ${portfolio.length}`);

      res.json({
        success: true,
        data: {
          portfolio: portfolio
        }
      });
    } catch (error) {
      console.error('❌ Ошибка получения портфолио:', error);
      next(new AppError('Ошибка при получении портфолио', 500));
    }
  },

  // Добавить товар в портфолио С ЦЕНОЙ
  async addToPortfolio(req, res, next) {
    try {
      const workerId = req.user.id;
      const { productId, price } = req.body;

      console.log('➕ Добавление товара в портфолио:', { workerId, productId, price });

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'ID товара обязателен'
        });
      }

      if (!price || price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Цена должна быть положительным числом'
        });
      }

      // Проверяем существование товара
      const productStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      const product = productStmt.get(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден'
        });
      }

      // Проверяем, не добавлен ли уже товар
      const existingStmt = db.prepare(`
        SELECT * FROM worker_portfolio 
        WHERE worker_id = ? AND product_id = ?
      `);
      const existing = existingStmt.get(workerId, productId);

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Товар уже в портфолио'
        });
      }

      // Добавляем в портфолио с ценой
      const insertStmt = db.prepare(`
        INSERT INTO worker_portfolio (worker_id, product_id, price) 
        VALUES (?, ?, ?)
      `);

      const result = insertStmt.run(workerId, productId, price);

      console.log('✅ Товар добавлен в портфолио с ценой:', price);

      // Получаем данные товара с информацией о типе и ценой работника
      const productWithTypeStmt = db.prepare(`
        SELECT 
          p.*,
          pt.name as product_type_name,
          wp.price as worker_price
        FROM products p
        LEFT JOIN product_types pt ON p.type_id = pt.id
        LEFT JOIN worker_portfolio wp ON p.id = wp.product_id AND wp.worker_id = ?
        WHERE p.id = ?
      `);

      const productWithDetails = productWithTypeStmt.get(workerId, productId);

      res.json({
        success: true,
        message: 'Товар добавлен в портфолио',
        data: {
          product: productWithDetails
        }
      });
    } catch (error) {
      console.error('❌ Ошибка добавления в портфолио:', error);

      // Более детальная обработка ошибок SQLite
      if (error.code === 'SQLITE_READONLY' || error.code === 'SQLITE_READONLY_DBMOVED') {
        console.error('⚠️ Ошибка записи в базу данных. Проверьте права доступа.');
        return next(new AppError('Ошибка доступа к базе данных', 500));
      }

      next(new AppError('Ошибка при добавлении товара в портфолио', 500));
    }
  },

  // Удалить товар из портфолио
  async removeFromPortfolio(req, res, next) {
    try {
      const workerId = req.user.id;
      const { productId } = req.params;

      console.log('➖ Удаление товара из портфолио:', { workerId, productId });

      const stmt = db.prepare(`
        DELETE FROM worker_portfolio 
        WHERE worker_id = ? AND product_id = ?
      `);

      const result = stmt.run(workerId, productId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден в портфолио'
        });
      }

      console.log('✅ Товар удален из портфолио');

      res.json({
        success: true,
        message: 'Товар удален из портфолио'
      });
    } catch (error) {
      console.error('❌ Ошибка удаления из портфолио:', error);
      next(new AppError('Ошибка при удалении товара из портфолио', 500));
    }
  },

  // Получить статистику работника
  async getStats(req, res, next) {
    try {
      const workerId = req.user.id;

      console.log('📊 Получение статистики для работника:', workerId);

      // Общее количество заявок работника
      const totalStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE worker_id = ?
      `);
      const totalResult = totalStmt.get(workerId);
      const totalApplications = totalResult?.count || 0;

      // Заявки в работе
      const pendingStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE worker_id = ? AND status = 'in_progress'
      `);
      const pendingResult = pendingStmt.get(workerId);
      const pendingApplications = pendingResult?.count || 0;

      // Завершенные заявки
      const completedStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE worker_id = ? AND status = 'completed'
      `);
      const completedResult = completedStmt.get(workerId);
      const completedApplications = completedResult?.count || 0;

      // Количество товаров в портфолио
      const portfolioStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM worker_portfolio 
        WHERE worker_id = ?
      `);
      const portfolioResult = portfolioStmt.get(workerId);
      const portfolioCount = portfolioResult?.count || 0;

      const stats = {
        totalApplications,
        pendingApplications,
        completedApplications,
        portfolioCount
      };

      console.log('📊 Статистика работника:', stats);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
      next(new AppError('Ошибка при получении статистики', 500));
    }
  },

  // Получить заявки для работника
  async getApplications(req, res, next) {
    try {
      const workerId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      console.log('📥 Получение заявок для работника:', {
        workerId,
        status,
        page,
        limit
      });

      // Получаем товары из портфолио работника
      const portfolioStmt = db.prepare(`
        SELECT product_id FROM worker_portfolio WHERE worker_id = ?
      `);
      const portfolio = portfolioStmt.all(workerId);
      const productIds = portfolio.map(item => item.product_id);

      console.log(`📦 Товаров в портфолио: ${productIds.length}`, productIds);

      // Если у работника нет товаров в портфолио, возвращаем пустой массив
      if (productIds.length === 0) {
        console.log('📦 У работника нет товаров в портфолио');
        return res.json({
          success: true,
          data: {
            applications: [],
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit)
          }
        });
      }

      let whereClause = 'WHERE a.product_id IN (' + productIds.map(() => '?').join(',') + ')';
      let params = [...productIds];

      // Фильтр по статусу
      if (status && status !== 'all') {
        whereClause += ' AND a.status = ?';
        params.push(status);
      }

      const offset = (page - 1) * limit;

      // Получаем заявки
      const applicationsStmt = db.prepare(`
        SELECT 
          a.*,
          p.name as product_name,
          pt.name as product_type_name
        FROM applications a
        LEFT JOIN products p ON a.product_id = p.id
        LEFT JOIN product_types pt ON p.type_id = pt.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `);

      const applications = applicationsStmt.all(...params, limit, offset);

      // Получаем общее количество
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total 
        FROM applications a
        ${whereClause}
      `);

      const totalResult = countStmt.get(...params);
      const total = totalResult.total;

      console.log(`✅ Найдено заявок: ${applications.length} из ${total}`);

      res.json({
        success: true,
        data: {
          applications: applications || [],
          total: total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('❌ Ошибка получения заявок работника:', error);
      next(new AppError('Ошибка при получении заявок', 500));
    }
  },

  // Ответить на заявку
  async respondToApplication(req, res, next) {
    try {
      const workerId = req.user.id;
      const { id } = req.params;
      const { response, status = 'in_progress' } = req.body;

      console.log('📝 Ответ на заявку:', { workerId, applicationId: id, response, status });

      if (!response) {
        return res.status(400).json({
          success: false,
          error: 'Текст ответа обязателен'
        });
      }

      // Проверяем существование заявки
      const applicationStmt = db.prepare('SELECT * FROM applications WHERE id = ?');
      const application = applicationStmt.get(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      // Проверяем, что товар заявки есть в портфолио работника
      const portfolioStmt = db.prepare(`
        SELECT * FROM worker_portfolio 
        WHERE worker_id = ? AND product_id = ?
      `);
      const inPortfolio = portfolioStmt.get(workerId, application.product_id);

      if (!inPortfolio) {
        return res.status(403).json({
          success: false,
          error: 'Доступ к заявке запрещен'
        });
      }

      // Обновляем заявку
      const updateStmt = db.prepare(`
        UPDATE applications 
        SET worker_response = ?, status = ?, worker_id = ?, responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = updateStmt.run(response, status, workerId, id);

      if (result.changes === 0) {
        return res.status(500).json({
          success: false,
          error: 'Не удалось обновить заявку'
        });
      }

      // Получаем обновленную заявку
      const updatedApplicationStmt = db.prepare(`
        SELECT 
          a.*,
          p.name as product_name,
          pt.name as product_type_name
        FROM applications a
        LEFT JOIN products p ON a.product_id = p.id
        LEFT JOIN product_types pt ON p.type_id = pt.id
        WHERE a.id = ?
      `);

      const updatedApplication = updatedApplicationStmt.get(id);

      console.log('✅ Ответ на заявку сохранен');

      res.json({
        success: true,
        message: 'Ответ отправлен успешно',
        data: {
          application: updatedApplication
        }
      });
    } catch (error) {
      console.error('❌ Ошибка ответа на заявку:', error);
      next(new AppError('Ошибка при отправке ответа', 500));
    }
  },

  // Обновить статус заявки
  async updateApplicationStatus(req, res, next) {
    try {
      const workerId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      console.log('🔄 Обновление статуса заявки:', { workerId, applicationId: id, status });

      const validStatuses = ['new', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Неверный статус. Допустимые значения: ${validStatuses.join(', ')}`
        });
      }

      // Проверяем, что заявка принадлежит работнику
      const applicationStmt = db.prepare('SELECT * FROM applications WHERE id = ? AND worker_id = ?');
      const application = applicationStmt.get(id, workerId);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена или доступ запрещен'
        });
      }

      // Обновляем статус
      const updateStmt = db.prepare(`
        UPDATE applications 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = updateStmt.run(status, id);

      if (result.changes === 0) {
        return res.status(500).json({
          success: false,
          error: 'Не удалось обновить статус'
        });
      }

      console.log('✅ Статус заявки обновлен');

      res.json({
        success: true,
        message: 'Статус заявки обновлен',
        data: {
          application: { ...application, status }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка обновления статуса:', error);
      next(new AppError('Ошибка при обновлении статуса заявки', 500));
    }
  },

  // Обновить профиль работника
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, email, organization } = req.body;

      console.log('👤 Обновление профиля работника:', { userId, name, email, organization });

      const updateStmt = db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, organization = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = updateStmt.run(name, email, organization, userId);

      if (result.changes === 0) {
        return res.status(500).json({
          success: false,
          error: 'Не удалось обновить профиль'
        });
      }

      // Получаем обновленного пользователя
      const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const updatedUser = userStmt.get(userId);

      console.log('✅ Профиль работника обновлен');

      res.json({
        success: true,
        message: 'Профиль обновлен',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            organization: updatedUser.organization
          }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка обновления профиля:', error);
      next(new AppError('Ошибка при обновлении профиля', 500));
    }
  },

  // Метод для удаления ответа работника
  // В workerController.js добавьте:
async deleteWorkerResponse(req, res, next) {
  try {
    const userId = req.user.id;
    const { applicationId, responseId } = req.params;
    
    console.log('🗑️ Удаление ответа:', { userId, applicationId, responseId });
    
    // Проверка прав
    const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
    const user = userStmt.get(userId);
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещен'
      });
    }
    
    // Просто удаляем, без проверок (админ может все)
    const deleteStmt = db.prepare('DELETE FROM worker_responses WHERE id = ?');
    const result = deleteStmt.run(responseId);
    
    console.log('✅ Ответ удален. Изменено строк:', result.changes);
    
    res.json({
      success: true,
      message: 'Ответ успешно удален',
      data: {
        deletedResponseId: responseId
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении ответа'
    });
  }
}
};