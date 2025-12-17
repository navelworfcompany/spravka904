import express from 'express';
import { applicationsController } from '../controllers/applicationsController.js';
import { 
  validatePublicApplicationCreation,
  validateApplicationCreation,
  validateWorkerResponse,
  validatePagination,
  validateIdParam 
} from '../middleware/validation.js';
import { 
  authenticateToken,
  requireActiveUser,
  requireRole,
  canManageApplications,
  isApplicationOwner,
  canAddResponse,
  canMarkForDeletion,
  logUserAction 
} from '../middleware/auth.js';
import { db } from '../database/init.js'; // <-- ДОБАВЬТЕ ЭТОТ ИМПОРТ
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(express.json());

router.get('/debug/:id/worker-responses', (req, res) => {
  console.log('🔍 DEBUG: Проверка роута worker-responses');
  console.log('Params:', req.params);
  console.log('Original URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  
  res.json({
    success: true,
    message: 'Debug endpoint работает!',
    details: {
      applicationId: req.params.id,
      fullRoute: '/api/applications/:id/worker-responses'
    }
  });
});

router.get('/test/simple', (req, res) => {
  console.log('✅ SIMPLE TEST ENDPOINT HIT!');
  res.json({ 
    success: true, 
    message: 'Applications router is working!',
    timestamp: new Date().toISOString()
  });
});

router.get('/test/worker-responses-simple', (req, res) => {
  console.log('✅ WORKER RESPONSES SIMPLE TEST HIT!');
  res.json({
    success: true,
    data: {
      responses: [
        {
          id: 1,
          response: 'Test response from simple endpoint',
          price: 3000,
          worker_name: 'Test Worker'
        }
      ]
    }
  });
});

// ✅ ПУБЛИЧНЫЙ маршрут для создания заявок (БЕЗ аутентификации)
router.post('/public', 
  (req, res, next) => {
    console.log('🎯 ЗАПРОС ДОСТИГ ПУБЛИЧНОГО МАРШРУТА /applications/public');
    console.log('📥 Метод:', req.method);
    console.log('📥 URL:', req.originalUrl);
    console.log('📥 Тело:', JSON.stringify(req.body, null, 2));
    next();
  },
  validatePublicApplicationCreation,
  applicationsController.createPublicApplication
);

// Все routes ниже требуют аутентификации
router.use(authenticateToken);
router.use(requireActiveUser);

// ✅ ДОБАВЬТЕ ЭТОТ МАРШРУТ ДЛЯ УДАЛЕНИЯ ПОСЛЕ АУТЕНТИФИКАЦИИ
router.delete('/:id',
  logUserAction('delete_application'),
  validateIdParam,
  requireRole(['admin']),
  applicationsController.deleteApplication
);

// ✅ Получение заявок текущего пользователя
router.get('/my', 
  logUserAction('get_my_applications'),
  (req, res, next) => {
    console.log('📥 Запрос на получение заявок текущего пользователя');
    console.log('👤 Пользователь из токена:', req.user);
    next();
  },
  applicationsController.getMyApplications
);

// Получение заявок (разные права для разных ролей)
router.get('/', 
  logUserAction('get_applications'),
  validatePagination,
  canManageApplications,
  applicationsController.getAllApplications
);

router.get('/user/:phone', 
  logUserAction('get_user_applications'),
  isApplicationOwner,
  applicationsController.getMyApplications
);

router.get('/:id', 
  logUserAction('get_application_by_id'),
  validateIdParam,
  isApplicationOwner,
  applicationsController.getApplicationById
);

// Создание заявки (доступно всем аутентифицированным пользователям)
router.post('/', 
  logUserAction('create_application'),
  validateApplicationCreation,
  applicationsController.createApplication
);

// Оригинальный маршрут обновления заявки (оставляем как есть)
router.put('/:id', 
  logUserAction('update_application'),
  validateIdParam,
  requireRole(['admin', 'operator']),
  applicationsController.updateApplication
);

// ❌ УДАЛИТЕ ЭТОТ ДУБЛИРУЮЩИЙ РОУТ
// router.post('/:id/responses', ...)

// Пометка на удаление (только для операторов и админов)
router.patch('/:id/mark-deletion', 
  logUserAction('mark_application_for_deletion'),
  validateIdParam,
  canMarkForDeletion,
  requireRole(['admin', 'operator']),
  applicationsController.markForDeletion
);

// Получение заявок для работника
router.get('/worker/applications', 
  logUserAction('get_worker_applications'),
  requireRole(['worker', 'admin', 'operator']),
  applicationsController.getWorkerApplications
);

// ✅ ОСТАВЬТЕ ТОЛЬКО ЭТОТ РОУТ ДЛЯ ОТВЕТА РАБОТНИКА
router.post('/:id/worker-respond', 
  logUserAction('worker_respond_to_application'),
  validateIdParam,
  // ✅ ДОБАВЛЯЕМ ПРОВЕРКУ РОЛИ
  requireRole(['worker', 'admin', 'operator']),
  (req, res, next) => {
    console.log('📝 Запрос на ответ работника:', {
      applicationId: req.params.id,
      workerId: req.user?.id,
      body: req.body
    });
    next();
  },
  applicationsController.workerRespondToApplication
);

// Получить ответы работников на заявку
router.get('/:id/worker-responses',
  (req, res, next) => {
    console.log('🎯 ЗАПРОС ДОСТИГ worker-responses ROUTE!');
    console.log('📥 Method:', req.method);
    console.log('📥 Original URL:', req.originalUrl);
    console.log('📥 Base URL:', req.baseUrl);
    console.log('📥 Path:', req.path);
    console.log('📥 Params:', req.params);
    console.log('📥 Query:', req.query);
    console.log('👤 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');  
    next();
  },
  validateIdParam,
  requireActiveUser,
  applicationsController.getWorkerResponses
);

router.get('/test/direct', (req, res) => {
  console.log('✅ DIRECT TEST ENDPOINT HIT!');
  res.json({ 
    success: true, 
    message: 'Direct endpoint works!',
    timestamp: new Date().toISOString()
  });
});

router.post('/:id/select-worker', 
  validateIdParam, 
  applicationsController.selectWorkerForApplication
);

// ✅ ДОБАВЛЯЕМ НОВЫЙ МАРШРУТ ДЛЯ ОТМЕНЫ ЗАЯВКИ ПОЛЬЗОВАТЕЛЕМ
router.put('/:id/cancel', 
  logUserAction('cancel_application'),
  validateIdParam,
  authenticateToken,
  requireActiveUser,
  async (req, res, next) => {
    try {
      console.log('🔍 Проверка прав для отмены заявки:', {
        applicationId: req.params.id,
        userId: req.user.id,
        userPhone: req.user.phone
      });

      // Проверяем, что пользователь - владелец заявки
      const applicationStmt = db.prepare('SELECT phone, status FROM applications WHERE id = ?');
      const application = applicationStmt.get(parseInt(req.params.id));
      
      if (!application) {
        console.log('❌ Заявка не найдена:', req.params.id);
        return next(new AppError('Заявка не найдена', 404));
      }
      
      console.log('📋 Данные заявки:', application);
      console.log('📱 Телефон заявки (оригинальный):', application.phone);
      console.log('📱 Телефон пользователя (оригинальный):', req.user.phone);
      
      // 🔥 НОРМАЛИЗУЕМ НОМЕРА ТЕЛЕФОНОВ ДЛЯ СРАВНЕНИЯ
      const normalizedAppPhone = normalizePhone(application.phone);
      const normalizedUserPhone = normalizePhone(req.user.phone);
      
      console.log('📱 Телефон заявки (нормализованный):', normalizedAppPhone);
      console.log('📱 Телефон пользователя (нормализованный):', normalizedUserPhone);
      console.log('📊 Статус заявки:', application.status);
      console.log('🔍 Сравнение:', normalizedAppPhone === normalizedUserPhone);
      
      if (normalizedAppPhone !== normalizedUserPhone) {
        console.log('❌ Пользователь не является владельцем заявки');
        console.log('❌ Номера не совпадают после нормализации');
        return next(new AppError('Вы не можете отменить чужую заявку', 403));
      }
      
      // Проверяем, можно ли отменить заявку
      const cancelableStatuses = ['new', 'pending', 'in_progress', 'assigned'];
      if (!cancelableStatuses.includes(application.status)) {
        console.log('❌ Заявка в статусе, который нельзя отменить:', application.status);
        return next(new AppError('Эту заявку нельзя отменить', 400));
      }
      
      console.log('✅ Проверка пройдена, можно отменять заявку');
      next();
    } catch (error) {
      console.error('❌ Ошибка при проверке прав:', error);
      next(error);
    }
  },
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      console.log('🔄 Отмена заявки #', id);
      
      // Обновляем статус заявки
      const updateStmt = db.prepare(`
        UPDATE applications 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      const result = updateStmt.run(parseInt(id));
      
      console.log('📊 Результат обновления:', result);
      
      if (result.changes === 0) {
        console.log('❌ Не удалось отменить заявку');
        return next(new AppError('Не удалось отменить заявку', 500));
      }
      
      // Получаем обновленную заявку
      const getStmt = db.prepare('SELECT * FROM applications WHERE id = ?');
      const updatedApplication = getStmt.get(parseInt(id));
      
      console.log('✅ Заявка успешно отменена:', updatedApplication);
      
      res.json({
        success: true,
        message: 'Заявка успешно отменена',
        application: updatedApplication
      });
      
    } catch (error) {
      console.error('❌ Ошибка при отмене заявки:', error);
      next(error);
    }
  }
  
);

function normalizePhone(phone) {
  if (!phone) return '';
  
  // Удаляем все нецифровые символы
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Если номер начинается с 7 или 8, оставляем 11 цифр
  if (digitsOnly.startsWith('7') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith('8') && digitsOnly.length === 11) {
    return '7' + digitsOnly.slice(1);
  }
  // Если номер начинается с +7, убираем + и оставляем 11 цифр
  if (phone.includes('+7') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // Для международного формата
  if (digitsOnly.startsWith('8') && digitsOnly.length === 11) {
    return '7' + digitsOnly.slice(1);
  }
  
  return digitsOnly;
}

export default router;