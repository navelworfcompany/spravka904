import express from 'express';
import { authController } from '../controllers/authController.js';
import { 
  validateLogin, 
  validateWorkerRegistration,
  validateProfileUpdate,
  validatePasswordChange 
} from '../middleware/validation.js';
import { 
  authenticateToken, 
  requireActiveUser,
  requireOperator, // 🔥 ДОБАВИТЬ ЭТОТ ИМПОРТ
  logUserAction 
} from '../middleware/auth.js';
import { db } from '../database/init.js';

const router = express.Router();

// Public routes
router.post('/login', 
  logUserAction('user_login'),
  validateLogin, 
  authController.login
);

router.post('/register-worker', 
  logUserAction('worker_registration_request'),
  validateWorkerRegistration, 
  authController.registerWorker
);

// Protected routes
router.get('/me', 
  authenticateToken, 
  requireActiveUser,
  authController.getMe
);

router.get('/check-database', async (req, res) => {
  try {
    console.log('🔍 Checking database...');
    
    // Проверяем подключение к базе
    const testQuery = db.prepare("SELECT 1 as test").get();
    console.log('✅ Database connection test:', testQuery);
    
    // Проверяем существование таблицы users
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get();
    
    console.log('✅ Users table exists:', !!tableExists);
    
    // Если таблица существует, получаем количество пользователей
    let userCount = 0;
    if (tableExists) {
      const countResult = db.prepare("SELECT COUNT(*) as count FROM users").get();
      userCount = countResult.count;
      console.log('✅ User count:', userCount);
    }
    
    res.json({
      success: true,
      data: {
        databaseConnected: true,
        usersTableExists: !!tableExists,
        userCount: userCount,
        testQuery: testQuery
      }
    });
    
  } catch (error) {
    console.error('❌ Database check error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке базы данных',
      error: error.message
    });
  }
});

// Получение всех пользователей (простая версия)
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 Getting all users...');
    
    // Проверяем существование таблицы
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get();
    
    if (!tableExists) {
      return res.status(500).json({
        success: false,
        message: 'Таблица users не существует'
      });
    }
    
    // Получаем всех пользователей напрямую
    const users = db.prepare('SELECT * FROM users').all();
    console.log('✅ Users found:', users.length);
    
    // Форматируем телефоны для отображения
    const formattedUsers = users.map(user => ({
      id: user.id,
      phone: user.phone,
      formatted_phone: `+7 (${user.phone.slice(1, 4)}) ${user.phone.slice(4, 7)}-${user.phone.slice(7, 9)}-${user.phone.slice(9, 11)}`,
      name: user.name,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    }));
    
    res.json({
      success: true,
      data: {
        users: formattedUsers,
        count: users.length
      }
    });
    
  } catch (error) {
    console.error('❌ Debug users error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении пользователей',
      error: error.message
    });
  }
});

// routes/auth.js - добавьте временный эндпоинт
router.get('/check-passwords', async (req, res) => {
  try {
    const users = db.prepare('SELECT id, phone, name, role, password FROM users').all();
    
    const results = users.map(user => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      password_length: user.password ? user.password.length : 0,
      password_prefix: user.password ? user.password.substring(0, 20) + '...' : 'null',
      is_bcrypt: user.password ? user.password.startsWith('$2b$') : false
    }));
    
    res.json({
      success: true,
      data: {
        users: results
      }
    });
  } catch (error) {
    console.error('Check passwords error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке паролей'
    });
  }
});

router.put('/profile', 
  authenticateToken, 
  requireActiveUser,
  logUserAction('profile_update'),
  validateProfileUpdate,
  authController.updateProfile
);

router.put('/change-password', 
  authenticateToken, 
  requireActiveUser,
  logUserAction('password_change'),
  validatePasswordChange,
  authController.changePassword
);

router.get('/operator/dashboard-stats', 
  authenticateToken, 
  requireActiveUser,
  requireOperator,
  async (req, res) => {
    try {
      console.log('📊 Operator: Получение статистики для дашборда');

      // Статистика по работникам
      const workerStats = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM users 
        WHERE role = 'worker'
        GROUP BY status
      `).all();

      // Общее количество работников
      const totalWorkers = db.prepare(`
        SELECT COUNT(*) as count FROM users WHERE role = 'worker'
      `).get();

      // Статистика по заявкам
      const applicationStats = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM applications
        GROUP BY status
      `).all();

      // Количество заявок за последние 7 дней
      const recentApplications = db.prepare(`
        SELECT COUNT(*) as count FROM applications 
        WHERE created_at >= datetime('now', '-7 days')
      `).get();

      // Общее количество заявок
      const totalApplications = db.prepare(`
        SELECT COUNT(*) as count FROM applications
      `).get();

      // Количество новых заявок (status = 'new' или 'pending')
      const newApplications = db.prepare(`
        SELECT COUNT(*) as count FROM applications 
        WHERE status IN ('new', 'pending')
      `).get();

      // Заявки в работе
      const inProgressApplications = db.prepare(`
        SELECT COUNT(*) as count FROM applications 
        WHERE status IN ('in_progress', 'assigned', 'processing')
      `).get();

      // Завершенные заявки
      const completedApplications = db.prepare(`
        SELECT COUNT(*) as count FROM applications 
        WHERE status = 'completed'
      `).get();

      // Статистика по отзывам
      const reviewStats = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM reviews
        GROUP BY status
      `).all();

      // Общее количество отзывов
      const totalReviews = db.prepare(`
        SELECT COUNT(*) as count FROM reviews
      `).get();

      // Количество товаров (из product_types)
      const productStats = db.prepare(`
        SELECT 
          COUNT(DISTINCT id) as types_count,
          SUM(products_count) as total_products
        FROM product_types
      `).get();

      res.json({
        success: true,
        data: {
          // Заявки
          totalApplications: totalApplications.count || 0,
          newApplications: newApplications.count || 0,
          inProgressApplications: inProgressApplications.count || 0,
          completedApplications: completedApplications.count || 0,
          recentApplications: recentApplications.count || 0,
          
          // Работники
          totalOrganizations: totalWorkers.count || 0,
          workerStats: workerStats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
          }, {}),
          
          // Товары
          totalProducts: productStats.total_products || productStats.types_count || 0,
          
          // Отзывы
          totalReviews: totalReviews.count || 0,
          pendingReviews: reviewStats.find(r => r.status === 'pending')?.count || 0,
          reviewStats: reviewStats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('❌ Operator dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  }
);

export default router;