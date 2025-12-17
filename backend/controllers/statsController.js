import { Application } from '../models/Application.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export const statsController = {
  // Получить общую статистику
  async getStats(req, res, next) {
    try {
      const [applicationStats, userStats] = await Promise.all([
        Application.getStats(),
        User.getStats ? User.getStats() : { total: 0, recent: 0, byRole: {} }
      ]);

      res.json({
        success: true,
        data: {
          applications: applicationStats,
          users: userStats,
          summary: {
            totalApplications: applicationStats.total,
            totalUsers: userStats.total,
            recentApplications: applicationStats.recent,
            recentUsers: userStats.recent
          }
        }
      });
    } catch (error) {
      next(new AppError(`Ошибка при получении статистики: ${error.message}`, 500));
    }
  },

  // Получить статистику по заявкам
  async getApplicationStats(req, res, next) {
    try {
      const stats = await Application.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(new AppError(`Ошибка при получении статистики заявок: ${error.message}`, 500));
    }
  },

  // Получить статистику по пользователям
  async getUserStats(req, res, next) {
    try {
      // Если метод getStats не реализован в User, создаем базовую статистику
      let stats;
      if (User.getStats) {
        stats = await User.getStats();
      } else {
        // Базовая реализация статистики пользователей
        const db = (await import('../database/init.js')).db;
        
        const roleStats = await db.all(`
          SELECT 
            role,
            COUNT(*) as count
          FROM users 
          WHERE is_active = 1
          GROUP BY role
        `);

        const total = await db.get(`
          SELECT COUNT(*) as total FROM users WHERE is_active = 1
        `);

        const recentCount = await db.get(`
          SELECT COUNT(*) as count FROM users 
          WHERE created_at >= datetime('now', '-7 days') AND is_active = 1
        `);

        stats = {
          total: total.total,
          recent: recentCount.count,
          byRole: roleStats.reduce((acc, stat) => {
            acc[stat.role] = stat.count;
            return acc;
          }, {})
        };
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(new AppError(`Ошибка при получении статистики пользователей: ${error.message}`, 500));
    }
  }
};