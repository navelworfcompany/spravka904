// routes/operatorUsers.js - ОТДЕЛЬНЫЙ ФАЙЛ ДЛЯ ОПЕРАТОРА
import express from 'express';
import { 
  authenticateToken,
  requireActiveUser,
  requireOperator 
} from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { getOperatorUsers } from '../controllers/operatorUsersController.js';

const router = express.Router();

// 🔹 ОПЕРАТОР может видеть только работников (role = 'worker')
router.get('/', 
  authenticateToken,
  requireActiveUser,
  requireOperator,
  validatePagination,
  getOperatorUsers
);

export default router;