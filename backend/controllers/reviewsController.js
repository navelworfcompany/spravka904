import { Review } from '../models/Review.js';
import { AppError } from '../middleware/errorHandler.js';

export const reviewsController = {
  // Создание отзыва
  createReview: async (req, res, next) => {
    try {
      const { text } = req.body;
      const user = req.user;

      console.log('📝 Creating review:', { user: user.id, textLength: text?.length });

      if (!text || !text.trim()) {
        return next(new AppError('Текст отзыва не может быть пустым', 400));
      }

      const reviewData = {
        text: text.trim(),
        userId: user.id,
        userName: user.name || 'Аноним',
        userPhone: user.phone,
        status: 'pending' // Новые отзывы требуют проверки
      };

      const review = await Review.create(reviewData);

      res.status(201).json({
        success: true,
        message: 'Отзыв успешно отправлен на модерацию',
        data: review
      });

    } catch (error) {
      console.error('❌ Create review error:', error);
      next(new AppError('Ошибка при создании отзыва', 500));
    }
  },

  // Получение всех отзывов (с фильтрацией)
  getReviews: async (req, res, next) => {
    try {
      const { status } = req.query;
      const filters = {};

      if (status && ['pending', 'checked', 'rejected'].includes(status)) {
        filters.status = status;
      }

      console.log('📋 Getting reviews with filters:', filters);

      const reviews = await Review.findAll(filters);

      res.json({
        success: true,
        data: reviews,
        count: reviews.length
      });

    } catch (error) {
      console.error('❌ Get reviews error:', error);
      next(new AppError('Ошибка при получении отзывов', 500));
    }
  },

  // Получение проверенных отзывов (для публичной страницы)
  getCheckedReviews: async (req, res, next) => {
    try {
      console.log('⭐ Getting checked reviews for public page');

      const reviews = await Review.findAll({ status: 'checked' });

      res.json({
        success: true,
        data: reviews,
        count: reviews.length
      });

    } catch (error) {
      console.error('❌ Get checked reviews error:', error);
      next(new AppError('Ошибка при получении проверенных отзывов', 500));
    }
  },

  // Обновление статуса отзыва (для админов)
  updateReviewStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'checked', 'rejected'].includes(status)) {
        return next(new AppError('Неверный статус отзыва', 400));
      }

      console.log('🔄 Updating review status:', { id, status });

      const updated = await Review.updateStatus(id, status);

      if (!updated) {
        return next(new AppError('Отзыв не найден', 404));
      }

      res.json({
        success: true,
        message: `Статус отзыва обновлен на "${status}"`
      });

    } catch (error) {
      console.error('❌ Update review status error:', error);
      next(new AppError('Ошибка при обновлении статуса отзыва', 500));
    }
  },

  // Удаление отзыва
  deleteReview: async (req, res, next) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Deleting review:', id);

      const deleted = await Review.delete(id);

      if (!deleted) {
        return next(new AppError('Отзыв не найден', 404));
      }

      res.json({
        success: true,
        message: 'Отзыв успешно удален'
      });

    } catch (error) {
      console.error('❌ Delete review error:', error);
      next(new AppError('Ошибка при удалении отзыва', 500));
    }
  },

  // Получение статистики отзывов
  getReviewsStats: async (req, res, next) => {
    try {
      console.log('📊 Getting reviews statistics');

      const stats = await Review.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Get reviews stats error:', error);
      next(new AppError('Ошибка при получении статистики отзывов', 500));
    }
  }
};

export default reviewsController;