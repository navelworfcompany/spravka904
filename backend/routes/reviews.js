import express from 'express';
import { reviewsController } from '../controllers/reviewsController.js';
import { 
  authenticateToken, 
  requireActiveUser,
  requireAdmin,
  requireAdminOrOperator  // 🔥 ИМПОРТИРУЕМ
} from '../middleware/auth.js';

const router = express.Router();

console.log('🔄 Загружен reviews router');

// Публичные маршруты
router.get('/public', async (req, res, next) => {
  console.log('📥 GET /api/reviews/public');
  try {
    await reviewsController.getCheckedReviews(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка в /public:', error);
    next(error);
  }
});

// Защищенные маршруты (требуют аутентификации)
router.use(authenticateToken);
router.use(requireActiveUser);

// Создание отзыва (доступно всем авторизованным пользователям)
router.post('/', async (req, res, next) => {
  console.log('📝 POST /api/reviews');
  try {
    await reviewsController.createReview(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка при создании отзыва:', error);
    next(error);
  }
});

// Получение отзывов пользователя
router.get('/my', async (req, res, next) => {
  console.log('👤 GET /api/reviews/my');
  try {
    req.query.userId = req.user?.id;
    await reviewsController.getReviews(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка в /my:', error);
    next(error);
  }
});

// 🔥 ИЗМЕНЕНИЕ: Разделяем права для админов и операторов

// GET /reviews - доступно и админам и операторам
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  console.log('📋 GET /api/reviews (админ/оператор)');
  try {
    await reviewsController.getReviews(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка в GET /:', error);
    next(error);
  }
});

// PATCH /reviews/:id/status - доступно и админам и операторам
router.patch('/:id/status', requireAdminOrOperator, async (req, res, next) => {
  console.log(`🔄 PATCH /api/reviews/${req.params.id}/status`, req.body);
  try {
    await reviewsController.updateReviewStatus(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка обновления статуса:', error);
    next(error);
  }
});

// GET /reviews/stats - доступно и админам и операторам
router.get('/stats', requireAdminOrOperator, async (req, res, next) => {
  console.log('📊 GET /api/reviews/stats (админ/оператор)');
  try {
    await reviewsController.getReviewsStats(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка статистики:', error);
    next(error);
  }
});

// DELETE /reviews/:id - только админам
router.delete('/:id', requireAdmin, async (req, res, next) => {
  console.log(`🗑️ DELETE /api/reviews/${req.params.id} (только админ)`);
  try {
    await reviewsController.deleteReview(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка удаления:', error);
    next(error);
  }
});

// Простой тестовый endpoint без проверок (для отладки)
router.get('/test', async (req, res) => {
  console.log('🧪 GET /api/reviews/test');
  try {
    // Прямой запрос к БД без middleware
    const { db } = await import('../database/init.js');
    
    const count = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
    const sample = db.prepare('SELECT * FROM reviews LIMIT 3').all();
    
    res.json({
      success: true,
      message: 'Тестовый endpoint работает',
      count: count.count,
      sample: sample,
      columns: Object.keys(sample[0] || {})
    });
  } catch (error) {
    console.error('❌ Тестовый endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;