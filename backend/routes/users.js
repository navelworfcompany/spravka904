import express from 'express';
import { usersController } from '../controllers/usersController.js';
import { 
  validateUser,
  validateUserUpdate,
  validateIdParam,
  validatePagination 
} from '../middleware/validation.js';
import { 
  authenticateToken,
  requireActiveUser,
  requireAdmin,           
  requireOperator,
  requireAdminOrOperator,
  logUserAction 
} from '../middleware/auth.js';

const router = express.Router();

// 🔥 ДЛЯ АДМИНОВ (все пользователи)
router.get('/admin/users', 
  authenticateToken,
  requireActiveUser,
  requireAdmin,
  logUserAction('get_all_users_admin'),
  validatePagination,
  usersController.getAllUsersAdmin
);

// 🔥 ДЛЯ ОПЕРАТОРОВ (только работники)
router.get('/operator/users', 
  authenticateToken,
  requireActiveUser,
  requireOperator,
  logUserAction('get_all_users_operator'),
  validatePagination,
  usersController.getAllUsersOperator
);

// 🔥 ОБЩИЙ МАРШРУТ (для обратной совместимости)
router.get('/', 
  authenticateToken,
  requireActiveUser,
  requireAdminOrOperator,
  logUserAction('get_all_users'),
  validatePagination,
  usersController.getAllUsers
);

// 🔥 ТОЛЬКО АДМИНИСТРАТОРЫ МОГУТ СОЗДАВАТЬ/УДАЛЯТЬ ПОЛЬЗОВАТЕЛЕЙ
// 🔥 ИСПРАВЛЕННЫЙ МАРШРУТ СОЗДАНИЯ
router.post('/', 
  authenticateToken,     // ДОБАВЬТЕ
  requireActiveUser,     // ДОБАВЬТЕ
  requireAdmin,         // 🔥 ТОЛЬКО АДМИНЫ
  logUserAction('create_user'),
  validateUser,
  usersController.createUser
);

// 🔥 ИСПРАВЛЕННЫЙ МАРШРУТ ОБНОВЛЕНИЯ
router.put('/:id', 
  authenticateToken,    // ДОБАВЬТЕ
  requireActiveUser,    // ДОБАВЬТЕ
  logUserAction('update_user'),
  validateIdParam,
  validateUserUpdate,
  usersController.updateUser
);

// 🔥 УЖЕ ПРАВИЛЬНЫЙ МАРШРУТ УДАЛЕНИЯ (но проверьте контроллер)
router.delete('/:id', 
  authenticateToken,
  requireActiveUser,
  requireAdmin, // 🔥 ТОЛЬКО АДМИНЫ
  logUserAction('delete_user'),
  validateIdParam,
  usersController.deleteUser
);

// Запросы работников - только для администраторов
router.get('/worker-requests/pending', 
  authenticateToken,    // ДОБАВЬТЕ
  requireActiveUser,    // ДОБАВЬТЕ
  requireAdmin, // 🔥 ТОЛЬКО АДМИНИСТРАТОРЫ
  logUserAction('get_pending_worker_requests'),
  validatePagination,
  usersController.getWorkerRequests
);

router.post('/worker-requests/:id/approve', 
  authenticateToken,    // ДОБАВЬТЕ
  requireActiveUser,    // ДОБАВЬТЕ
  requireAdmin, // 🔥 ТОЛЬКО АДМИНИСТРАТОРЫ
  logUserAction('approve_worker_request'),
  validateIdParam,
  usersController.approveWorkerRequest
);

router.post('/worker-requests/:id/reject', 
  authenticateToken,    // ДОБАВЬТЕ
  requireActiveUser,    // ДОБАВЬТЕ
  requireAdmin, // 🔥 ТОЛЬКО АДМИНИСТРАТОРЫ
  logUserAction('reject_worker_request'),
  validateIdParam,
  usersController.rejectWorkerRequest
);

export default router;