// routes/worker.js
import express from 'express';
import { workerController } from '../controllers/workerController.js';
import { 
  authenticateToken,
  requireActiveUser,
  logUserAction 
} from '../middleware/auth.js';
import { validateIdParam } from '../middleware/validation.js';
import { validateProductIdParam } from '../middleware/validation.js';

const router = express.Router();

router.use(express.json());

// Отладочный middleware
router.use((req, res, next) => {
  console.log('🛣️ Worker route hit:', req.method, req.path);
  console.log('👤 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
  next();
});

// ТОЛЬКО эти два middleware - без requireRole!
router.use(authenticateToken);
router.use(requireActiveUser);

// Все роуты портфолио
router.get('/portfolio', 
  logUserAction('get_worker_portfolio'),
  workerController.getPortfolio
);

router.post('/portfolio', 
  logUserAction('add_to_portfolio'),
  workerController.addToPortfolio
);

router.delete('/portfolio/:productId', 
  logUserAction('remove_from_portfolio'),
  validateProductIdParam,
  workerController.removeFromPortfolio
);

// Остальные роуты
router.get('/stats', 
  logUserAction('get_worker_stats'),
  workerController.getStats
);

router.get('/applications', 
  logUserAction('get_worker_applications'),
  workerController.getApplications
);

router.post('/applications/:id/respond', 
  logUserAction('respond_to_application'),
  validateIdParam,
  workerController.respondToApplication
);

router.patch('/applications/:id/status', 
  logUserAction('update_application_status'),
  validateIdParam,
  workerController.updateApplicationStatus
);

router.put('/profile', 
  logUserAction('update_worker_profile'),
  workerController.updateProfile
);

// В routes/worker.js добавьте:
router.get('/:workerId/responses',
  async (req, res, next) => {
    try {
      const { workerId } = req.params;
      
      console.log('📥 Получение ответов работника:', workerId);
      
      const stmt = db.prepare(`
        SELECT 
          wr.*,
          a.name as application_name,
          a.product as product_name,
          a.status as application_status
        FROM worker_responses wr
        LEFT JOIN applications a ON wr.application_id = a.id
        WHERE wr.worker_id = ?
        ORDER BY wr.created_at DESC
      `);
      
      const responses = stmt.all(parseInt(workerId));
      
      console.log(`✅ Найдено ${responses.length} ответов работника ${workerId}`);
      
      res.json({
        success: true,
        data: {
          responses: responses,
          count: responses.length
        }
      });
      
    } catch (error) {
      console.error('❌ Ошибка получения ответов работника:', error);
      next(new AppError('Ошибка при получении ответов работника', 500));
    }
  }
);

router.post('/worker/check-responses', 
  authenticateToken,
  requireActiveUser,
  async (req, res, next) => {
    try {
      const { applicationIds } = req.body;
      const workerId = req.user.id;
      
      console.log('🔍 Массовая проверка ответов работника:', {
        workerId,
        applicationIds: applicationIds?.length || 0
      });
      
      if (!applicationIds || !Array.isArray(applicationIds)) {
        return res.status(400).json({
          success: false,
          error: 'Требуется массив applicationIds'
        });
      }
      
      if (applicationIds.length === 0) {
        return res.json({
          success: true,
          data: {}
        });
      }
      
      // Создаем IN условие для SQL
      const placeholders = applicationIds.map(() => '?').join(',');
      
      const stmt = db.prepare(`
        SELECT application_id 
        FROM worker_responses 
        WHERE worker_id = ? 
          AND application_id IN (${placeholders})
      `);
      
      const responses = stmt.all(workerId, ...applicationIds);
      
      // Создаем карту: applicationId -> true
      const responseMap = {};
      responses.forEach(r => {
        responseMap[r.application_id] = true;
      });
      
      console.log(`✅ Работник ${workerId} отвечал на ${responses.length} из ${applicationIds.length} заявок`);
      
      res.json({
        success: true,
        data: {
          responseMap,
          totalChecked: applicationIds.length,
          respondedCount: responses.length
        }
      });
      
    } catch (error) {
      console.error('❌ Ошибка массовой проверки ответов:', error);
      next(new AppError('Ошибка при проверке ответов', 500));
    }
  }
);

// Добавьте этот роут после других application роутов
router.delete('/applications/:applicationId/responses/:responseId',
  logUserAction('delete_worker_response'),
  workerController.deleteWorkerResponse
);

export default router;