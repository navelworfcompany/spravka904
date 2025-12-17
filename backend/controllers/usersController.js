import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { AppError } from '../middleware/errorHandler.js';

export const usersController = {
  // Получение всех пользователей

getAllUsersAdmin: async (req, res, next) => {
  try {
    console.log('👑 Admin: Getting ALL users...');
    console.log('👤 Request user role:', req.user?.role);
    
    let query = `
      SELECT id, phone, name, email, role, organization, status, created_at 
      FROM users 
      WHERE 1=1
    `;
    
    const params = [];

    // Админ может фильтровать по любой роли
    if (req.query.role) {
      query += ' AND role = ?';
      params.push(req.query.role);
      console.log('🔍 Admin role filter:', req.query.role);
    }

    // Фильтрация по статусу
    if (req.query.status) {
      query += ' AND status = ?';
      params.push(req.query.status);
    }

    // Фильтрация по имени
    if (req.query.name) {
      query += ' AND name LIKE ?';
      params.push(`%${req.query.name}%`);
    }

    // Фильтрация по организации
    if (req.query.organization) {
      query += ' AND organization LIKE ?';
      params.push(`%${req.query.organization}%`);
    }

    query += ' ORDER BY created_at DESC';

    console.log('📋 Admin query:', query);
    console.log('📋 Admin params:', params);

    const users = db.prepare(query).all(...params);

    console.log(`📋 Admin found ${users.length} users`);

    // Форматируем телефоны
    const formattedUsers = users.map(user => ({
      ...user,
      phone: formatPhoneForDisplay(user.phone)
    }));

    const response = {
      success: true,
      data: {
        users: formattedUsers,
        totalCount: users.length
      },
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || users.length,
        total: users.length,
        pages: 1
      }
    };

    console.log('📤 Admin response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Admin get users error:', error);
    next(new AppError('Ошибка при получении пользователей', 500));
  }
},

  // 🔥 МЕТОД ДЛЯ ОПЕРАТОРОВ (только работники)
  getAllUsersOperator: async (req, res, next) => {
    try {
      console.log('👷 Operator: Getting workers only...');
      
      let query = `
        SELECT id, phone, name, email, role, organization, status, created_at 
        FROM users 
        WHERE role = 'worker'
      `;
      
      const params = [];

      // Оператор может фильтровать по статусу работников
      if (req.query.status) {
        query += ' AND status = ?';
        params.push(req.query.status);
      }

      // Фильтрация по имени
      if (req.query.name) {
        query += ' AND name LIKE ?';
        params.push(`%${req.query.name}%`);
      }

      // Фильтрация по организации
      if (req.query.organization) {
        query += ' AND organization LIKE ?';
        params.push(`%${req.query.organization}%`);
      }

      query += ' ORDER BY created_at DESC';

      const users = db.prepare(query).all(...params);

      console.log(`📋 Operator found ${users.length} workers`);

      // Форматируем телефоны
      const formattedUsers = users.map(user => ({
        ...user,
        phone: formatPhoneForDisplay(user.phone)
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          organizations: formattedUsers, // для совместимости
          totalCount: users.length
        }
      });

    } catch (error) {
      console.error('❌ Operator get workers error:', error);
      next(new AppError('Ошибка при получении работников', 500));
    }
  },

  // 🔥 ОБЩИЙ МЕТОД (для обратной совместимости)
  getAllUsers: async (req, res, next) => {
    try {
      console.log('👥 Getting users (compatibility mode)...');
      console.log('👤 Request user role:', req.user?.role);
      
      // Решаем, какой метод вызывать в зависимости от роли
      if (req.user?.role === 'admin') {
        return await usersController.getAllUsersAdmin(req, res, next);
      } else if (req.user?.role === 'operator') {
        return await usersController.getAllUsersOperator(req, res, next);
      } else {
        return next(new AppError('Доступ запрещен', 403));
      }
    } catch (error) {
      next(error);
    }
  },

  // Создание пользователя
  createUser: async (req, res, next) => {
    try {
      const { phone, password, name, email, role, organization } = req.body;
      console.log('👤 Creating user:', { phone, name, email, role });

      // Проверяем существующий телефон
      const cleanPhone = phone.replace(/\D/g, '');
      const existingUser = db.prepare(
        "SELECT id FROM users WHERE phone = ?"
      ).get(cleanPhone);

      if (existingUser) {
        return next(new AppError('Пользователь с таким телефоном уже существует', 400));
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 12);

      const result = db.prepare(
        `INSERT INTO users (phone, password, name, email, role, organization) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(cleanPhone, hashedPassword, name, email, role, organization);

      const newUser = db.prepare(
        `SELECT id, phone, name, email, role, organization, status, created_at 
         FROM users WHERE id = ?`
      ).get(result.lastInsertRowid);

      // Форматируем телефон для ответа
      newUser.phone = formatPhoneForDisplay(newUser.phone);

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно создан',
        data: newUser
      });

    } catch (error) {
      console.error('❌ Create user error:', error);
      next(new AppError('Ошибка при создании пользователя', 500));
    }
  },

  // Обновление пользователя
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log('✏️ Updating user:', id, updates);

      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'password') {
          if (key === 'phone') {
            // Очищаем номер телефона
            updateFields.push(`${key} = ?`);
            values.push(updates[key].replace(/\D/g, ''));
          } else {
            updateFields.push(`${key} = ?`);
            values.push(updates[key]);
          }
        }
      });

      // Обработка смены пароля
      if (updates.password) {
        const hashedPassword = await bcrypt.hash(updates.password, 12);
        updateFields.push('password = ?');
        values.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        return next(new AppError('Нет данных для обновления', 400));
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const result = db.prepare(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
      ).run(...values);

      if (result.changes === 0) {
        return next(new AppError('Пользователь не найден', 404));
      }

      const updatedUser = db.prepare(
        `SELECT id, phone, name, email, role, organization, status, created_at 
         FROM users WHERE id = ?`
      ).get(id);

      // Форматируем телефон для ответа
      updatedUser.phone = formatPhoneForDisplay(updatedUser.phone);

      res.json({
        success: true,
        message: 'Пользователь успешно обновлен',
        data: updatedUser
      });

    } catch (error) {
      console.error('❌ Update user error:', error);
      next(new AppError('Ошибка при обновлении пользователя', 500));
    }
  },

  // Удаление пользователя
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log('🗑️ Deleting user:', id);

      // Нельзя удалить самого себя
      if (parseInt(id) === req.user.id) {
        return next(new AppError('Нельзя удалить собственный аккаунт', 400));
      }

      const result = db.prepare(
        `DELETE FROM users WHERE id = ?`
      ).run(id);

      if (result.changes === 0) {
        return next(new AppError('Пользователь не найден', 404));
      }

      res.json({
        success: true,
        message: 'Пользователь успешно удален'
      });

    } catch (error) {
      console.error('❌ Delete user error:', error);
      next(new AppError('Ошибка при удалении пользователя', 500));
    }
  },

  // Получение запросов на регистрацию работников
  getWorkerRequests: async (req, res, next) => {
    try {
      console.log('👷 Getting worker requests...');

      // Проверяем существование таблицы worker_requests
      const tableExists = db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='worker_requests'`
      ).get();

      if (!tableExists) {
        console.log('ℹ️ Table worker_requests does not exist, returning empty array');
        return res.json({
          success: true,
          data: []
        });
      }

      const requests = db.prepare(
        `SELECT * FROM worker_requests 
         WHERE status = 'pending' 
         ORDER BY created_at DESC`
      ).all();

      console.log(`✅ Found ${requests.length} worker requests`);

      res.json({
        success: true,
        data: requests
      });

    } catch (error) {
      console.error('❌ Get worker requests error:', error);
      next(new AppError('Ошибка при получении запросов работников', 500));
    }
  },

  // Одобрение запроса работника
  approveWorkerRequest: async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log('✅ Approving worker request:', id);

      const request = db.prepare(
        `SELECT * FROM worker_requests WHERE id = ? AND status = 'pending'`
      ).get(id);

      if (!request) {
        return next(new AppError('Запрос не найден или уже обработан', 404));
      }

      // Создаем пользователя
      const result = db.prepare(
        `INSERT INTO users (phone, password, name, email, role, organization) 
         VALUES (?, ?, ?, ?, 'worker', ?)`
      ).run(request.phone, request.password, request.organization, request.email, request.organization);

      // Помечаем запрос как обработанный
      db.prepare(
        `UPDATE worker_requests SET status = 'approved' WHERE id = ?`
      ).run(id);

      res.json({
        success: true,
        message: 'Запрос работника одобрен, пользователь создан'
      });

    } catch (error) {
      console.error('❌ Approve worker request error:', error);
      next(new AppError('Ошибка при одобрении запроса работника', 500));
    }
  },

  // Отклонение запроса работника
  rejectWorkerRequest: async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log('❌ Rejecting worker request:', id);

      const result = db.prepare(
        `UPDATE worker_requests SET status = 'rejected' WHERE id = ?`
      ).run(id);

      if (result.changes === 0) {
        return next(new AppError('Запрос не найден', 404));
      }

      res.json({
        success: true,
        message: 'Запрос работника отклонен'
      });

    } catch (error) {
      console.error('❌ Reject worker request error:', error);
      next(new AppError('Ошибка при отклонении запроса работника', 500));
    }
  }
};

// Функция форматирования телефона (добавьте в этот файл)
function formatPhoneForDisplay(phone) {
  if (!phone) return phone;

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 11) return phone;

  return `+7 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9, 11)}`;
}