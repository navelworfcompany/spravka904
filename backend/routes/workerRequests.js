import express from 'express';
import { workerRequestController } from '../controllers/workerRequestController.js';
import { 
  authenticateToken, 
  requireRole 
} from '../middleware/auth.js';
import { validateIdParam } from '../middleware/validation.js';

const router = express.Router();

router.use(express.json());

// Публичный маршрут - создание заявки
router.post('/',
  workerRequestController.createRequest
);

// Защищенные маршруты - только для админов
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Получить все заявки с фильтрацией - ДОЛЖЕН БЫТЬ ПЕРЕД ДРУГИМИ GET МАРШРУТАМИ
router.get('/',
  workerRequestController.getAllRequests  // Убедитесь, что это getAllRequests, а не getPendingRequests
);

router.get('/stats',
  workerRequestController.getStats
);

router.post('/:id/approve',
  validateIdParam,
  workerRequestController.approveRequest
);

router.post('/:id/reject',
  validateIdParam,
  workerRequestController.rejectRequest
);

router.delete('/:id',
  validateIdParam,
  workerRequestController.deleteRequest
);

export default router;