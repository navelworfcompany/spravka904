// models/User.js
import { db } from '../database/init.js';

function formatPhoneForDisplay(phone) {
  if (!phone) return phone;
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 11) return phone;
  
  return `+7 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9, 11)}`;
}

export const User = {

  getStats: async () => {
    try {
      console.log('📊 Getting user statistics...');
      
      // Статистика по ролям
      const roleStats = db.prepare(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users 
        WHERE is_active = 1
        GROUP BY role
      `).all();

      // Общее количество пользователей
      const totalResult = db.prepare(`
        SELECT COUNT(*) as total FROM users WHERE is_active = 1
      `).get();

      // Количество новых пользователей за последние 7 дней
      const recentCount = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= datetime('now', '-7 days') AND is_active = 1
      `).get();

      // Статистика по активности
      const activeStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN last_login IS NOT NULL THEN 1 ELSE 0 END) as with_login,
          SUM(CASE WHEN last_login IS NULL THEN 1 ELSE 0 END) as without_login
        FROM users 
        WHERE is_active = 1
      `).get();

      const stats = {
        total: totalResult.total,
        recent: recentCount.count,
        byRole: roleStats.reduce((acc, stat) => {
          acc[stat.role] = stat.count;
          return acc;
        }, {}),
        activity: {
          withLogin: activeStats.with_login || 0,
          withoutLogin: activeStats.without_login || 0
        }
      };

      console.log('📊 User stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error in User.getStats:', error);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      console.log('🔍 User.findById:', id);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (user) {
        // Форматируем телефон для ответа
        user.phone = formatPhoneForDisplay(user.phone);
        console.log('✅ User found:', { id: user.id, phone: user.phone, name: user.name });
      } else {
        console.log('❌ User not found for id:', id);
      }
      return user || null;
    } catch (error) {
      console.error('❌ Error in User.findById:', error);
      return null;
    }
  },

  findByPhone: async (phone) => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      console.log('🔍 User.findByPhone:', { 
        input: phone, 
        clean: cleanPhone,
        length: cleanPhone.length 
      });
      
      // Ищем пользователя по чистому номеру
      const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);
      
      if (user) {
        console.log('✅ User found in database:', { 
          id: user.id, 
          db_phone: user.phone, 
          name: user.name,
          role: user.role 
        });
        
        // Форматируем телефон для ответа
        user.phone = formatPhoneForDisplay(user.phone);
        console.log('✅ User after formatting:', user.phone);
      } else {
        console.log('❌ User not found for phone:', cleanPhone);
        
        // Для отладки: покажем все телефоны в базе
        const allUsers = db.prepare('SELECT id, phone, name FROM users').all();
        console.log('🔍 All phones in database:', allUsers.map(u => ({ 
          id: u.id, 
          phone: u.phone, 
          name: u.name 
        })));
      }
      return user || null;
    } catch (error) {
      console.error('❌ Error in User.findByPhone:', error);
      return null;
    }
  },

  create: async (userData) => {
    try {
      const { phone, password, name, email, role = 'user', organization = null } = userData;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const result = db.prepare(`
        INSERT INTO users (phone, password, name, email, role, organization) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cleanPhone, password, name, email, role, organization);
      
      return { id: result.lastInsertRowid, ...userData };
    } catch (error) {
      console.error('Error in User.create:', error);
      throw error;
    }
  },

  update: async (id, userData) => {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(userData).forEach(key => {
        if (key === 'phone' && userData[key]) {
          fields.push(`${key} = ?`);
          values.push(userData[key].replace(/\D/g, ''));
        } else if (userData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(userData[key]);
        }
      });
      
      if (fields.length === 0) {
        return await User.findById(id);
      }
      
      values.push(id);
      
      const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      db.prepare(query).run(...values);
      
      return await User.findById(id);
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  },

  findAll: async (filters = {}) => {
    try {
      let query = 'SELECT * FROM users WHERE 1=1';
      const values = [];
      
      if (filters.role) {
        query += ' AND role = ?';
        values.push(filters.role);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const users = db.prepare(query).all(...values);
      return users;
    } catch (error) {
      console.error('Error in User.findAll:', error);
      return [];
    }
  },

  delete: async (id) => {
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return true;
    } catch (error) {
      console.error('Error in User.delete:', error);
      throw error;
    }
  }
};


export default User;