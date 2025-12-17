import express from 'express';
import { statsController } from '../controllers/statsController.js';
import { 
  authenticateToken,
  requireActiveUser,
  requireRole,
  logUserAction 
} from '../middleware/auth.js';

const router = express.Router();

router.use(express.json());
router.use(authenticateToken);
router.use(requireActiveUser);

// Получение общей статистики
router.get('/', 
  logUserAction('get_stats'),
  requireRole(['admin', 'operator']),
  statsController.getStats
);

// Получение статистики по заявкам
router.get('/applications', 
  logUserAction('get_applications_stats'),
  requireRole(['admin', 'operator']),
  statsController.getApplicationStats
);

// Получение статистики по пользователям
router.get('/users', 
  logUserAction('get_users_stats'),
  requireRole(['admin']),
  statsController.getUserStats
);

export default router;