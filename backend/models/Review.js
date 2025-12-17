import { db } from '../database/init.js';

export const Review = {
  // Создание отзыва
  create: async (reviewData) => {
    try {
      const { text, userId, userName, userPhone, status = 'pending' } = reviewData;
      
      const result = db.prepare(`
        INSERT INTO reviews (text, user_id, user_name, user_phone, status, created_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(text, userId, userName, userPhone, status);
      
      return { id: result.lastInsertRowid, ...reviewData };
    } catch (error) {
      console.error('Error in Review.create:', error);
      throw error;
    }
  },

  // Получение всех отзывов (с фильтрацией по статусу)
  findAll: async (filters = {}) => {
    try {
      let query = 'SELECT * FROM reviews WHERE 1=1';
      const values = [];
      
      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }
      
      if (filters.userId) {
        query += ' AND user_id = ?';
        values.push(filters.userId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const reviews = db.prepare(query).all(...values);
      
      // Форматируем даты для отображения
      return reviews.map(review => ({
        ...review,
        createdAt: review.created_at,
        formattedDate: new Date(review.created_at).toLocaleDateString('ru-RU')
      }));
    } catch (error) {
      console.error('Error in Review.findAll:', error);
      return [];
    }
  },

  // Получение отзыва по ID
  findById: async (id) => {
    try {
      const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
      return review ? {
        ...review,
        createdAt: review.created_at,
        formattedDate: new Date(review.created_at).toLocaleDateString('ru-RU')
      } : null;
    } catch (error) {
      console.error('Error in Review.findById:', error);
      return null;
    }
  },

  // Обновление статуса отзыва
  updateStatus: async (id, status) => {
    try {
      const result = db.prepare(`
        UPDATE reviews 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error in Review.updateStatus:', error);
      throw error;
    }
  },

  // Удаление отзыва
  delete: async (id) => {
    try {
      const result = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error in Review.delete:', error);
      throw error;
    }
  },

  // Получение статистики по отзывам
  getStats: async () => {
    try {
      const stats = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM reviews 
        GROUP BY status
      `).all();

      const total = db.prepare('SELECT COUNT(*) as total FROM reviews').get();

      return {
        total: total.total,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error in Review.getStats:', error);
      throw error;
    }
  }
};

export default Review;