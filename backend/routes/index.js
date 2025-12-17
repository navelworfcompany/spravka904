import express from 'express';
import authRoutes from './auth.js';
import applicationsRoutes from './applications.js';
import productsRoutes from './products.js';
import usersRoutes from './users.js';
import workerRoutes from './worker.js';
import { getLimiter } from '../middleware/rateLimit.js';
import { logUserAction } from '../middleware/auth.js';

const router = express.Router();

// Логирование всех API запросов
router.use(logUserAction('api_request'));

// Основные маршруты API
router.use('/auth', getLimiter('auth'), authRoutes);
router.use('/applications', getLimiter('dynamic'), applicationsRoutes);
router.use('/products', productsRoutes);
router.use('/users', getLimiter('admin'), usersRoutes);
router.use('/worker', getLimiter('general'), workerRoutes);

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working!',
    routes: {
      auth: '/api/auth',
      applications: '/api/applications', 
      products: '/api/products',
      users: '/api/users',
      worker: '/api/worker'
    }
  });
});

// Статистика системы (только для админов)
router.get('/stats', getLimiter('general'), async (req, res) => {
  try {
    // Импортируем модели для получения статистики
    const { User } = await import('../models/User.js');
    const { Application } = await import('../models/Application.js');
    const { ProductType } = await import('../models/ProductType.js');
    const { WorkerRequest } = await import('../models/WorkerRequest.js');

    const [
      userStats,
      applicationStats,
      productStats,
      workerRequestStats
    ] = await Promise.all([
      User.getStats(),
      Application.getStats(),
      ProductType.getStats(),
      WorkerRequest.getStats()
    ]);

    res.json({
      success: true,
      stats: {
        users: userStats,
        applications: applicationStats,
        products: productStats,
        worker_requests: workerRequestStats,
        server: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime()
        }
      }
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики системы'
    });
  }
});

// Информация о API
router.get('/info', getLimiter('general'), (req, res) => {
  res.json({
    success: true,
    api: {
      name: 'Ритуальная справочная',
      version: '0.0.1',
      description: 'Система управления заявками на ритуальные услуги',
      endpoints: {
        auth: {
          'POST /api/auth/login': 'Аутентификация пользователя',
          'POST /api/auth/register-worker': 'Регистрация работника',
          'GET /api/auth/me': 'Получение текущего пользователя',
          'PUT /api/auth/profile': 'Обновление профиля',
          'PUT /api/auth/change-password': 'Смена пароля'
        },
        applications: {
          'GET /api/applications': 'Получение всех заявок (требуются права)',
          'GET /api/applications/user/:phone': 'Получение заявок пользователя',
          'GET /api/applications/:id': 'Получение заявки по ID',
          'POST /api/applications': 'Создание новой заявки',
          'PUT /api/applications/:id': 'Обновление заявки (админ/оператор)',
          'POST /api/applications/:id/responses': 'Добавление ответа работника',
          'PATCH /api/applications/:id/mark-deletion': 'Пометка заявки на удаление'
        },
        products: {
          'GET /api/products/types': 'Получение всех типов товаров',
          'GET /api/products/type/:type_id': 'Получение товаров по типу',
          'GET /api/products': 'Получение всех товаров (админ)',
          'POST /api/products/types': 'Создание типа товара (админ)',
          'PUT /api/products/types/:id': 'Обновление типа товара (админ)',
          'DELETE /api/products/types/:id': 'Удаление типа товара (админ)',
          'POST /api/products': 'Создание товара (админ)',
          'PUT /api/products/:id': 'Обновление товара (админ)',
          'DELETE /api/products/:id': 'Удаление товара (админ)'
        },
        users: {
          'GET /api/users': 'Получение всех пользователей (админ)',
          'POST /api/users': 'Создание пользователя (админ)',
          'PUT /api/users/:id': 'Обновление пользователя (админ)',
          'DELETE /api/users/:id': 'Удаление пользователя (админ)',
          'GET /api/users/worker-requests/pending': 'Получение запросов работников (админ)',
          'POST /api/users/worker-requests/:id/approve': 'Одобрение запроса работника (админ)',
          'POST /api/users/worker-requests/:id/reject': 'Отклонение запроса работника (админ)'
        },
        system: {
          'GET /api/stats': 'Статистика системы (админ)',
          'GET /api/info': 'Информация об API',
          'GET /api/health': 'Проверка здоровья системы'
        }
      },
      authentication: 'JWT Token в заголовке Authorization: Bearer <token>',
      rate_limiting: 'Применяется в зависимости от endpoint и роли пользователя',
      documentation: 'https://github.com/your-repo/docs'
    }
  });
});

// Экспортируем все маршруты
export {
  authRoutes,
  applicationsRoutes,
  productsRoutes,
  usersRoutes,
  workerRoutes
};

export default router;