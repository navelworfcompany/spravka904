// controllers/operatorUsersController.js
import { db } from '../database/init.js';
import { AppError } from '../middleware/errorHandler.js';

export const getOperatorUsers = async (req, res, next) => {
  try {
    console.log('👷 Operator: Получение работников...');
    console.log('👤 Operator user:', req.user);

    const { 
      page = 1, 
      limit = 20,
      name = '',
      organization = '',
      status = '',
      role = 'worker' // 🔥 ВСЕГДА только работники
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Базовый запрос - ТОЛЬКО работники
    let query = `
      SELECT id, phone, name, email, role, organization, 
             status, created_at, updated_at
      FROM users 
      WHERE role = 'worker'
    `;
    
    const params = [];

    // Фильтры
    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    if (organization) {
      query += ' AND organization LIKE ?';
      params.push(`%${organization}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Общее количество для пагинации
    const countQuery = query.replace(
      'SELECT id, phone, name, email, role, organization, status, created_at, updated_at',
      'SELECT COUNT(*) as total'
    );
    
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult.total || 0;

    // Пагинация
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    console.log('📋 Query:', query);
    console.log('📋 Params:', params);

    const users = db.prepare(query).all(...params);

    // Форматируем телефоны
    const formattedUsers = users.map(user => ({
      ...user,
      phone: formatPhoneForDisplay(user.phone)
    }));

    res.json({
      success: true,
      data: {
        organizations: formattedUsers, // для совместимости с фронтендом
        users: formattedUsers,         // альтернативное поле
        totalCount: total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Operator get users error:', error);
    next(new AppError('Ошибка при получении работников', 500));
  }
};

// Функция для форматирования телефона
function formatPhoneForDisplay(phone) {
  if (!phone) return phone;

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 11) return phone;

  return `+7 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9, 11)}`;
}