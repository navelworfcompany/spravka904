import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware для проверки JWT токена
 */
// middleware/auth.js - authenticateToken (ИСПРАВЛЕННАЯ ВЕРСИЯ)
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Auth middleware - Token check:', { 
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader, 
      token: token ? `${token.substring(0, 20)}...` : 'none'
    });

    // 🔥 ИСПРАВЛЕНИЕ: Возвращаем ошибку, а не просто null
    if (!token || token === 'undefined' || token === 'null') {
      console.log('❌ No valid token provided');
      return next(new AppError('Требуется аутентификация', 401));
    }

    // Верификация токена
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);
    
    // Находим пользователя в базе данных
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found for id:', decoded.userId);
      return next(new AppError('Пользователь не найден', 401));
    }

    if (user.status !== 'active') {
      console.log('❌ User not active:', user.id);
      return next(new AppError('Аккаунт заблокирован или удален', 403));
    }

    // Добавляем пользователя в запрос
    req.user = user;
    req.userId = user.id;
    console.log('✅ User authenticated:', { id: user.id, role: user.role });
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.name, error.message);
    
    // 🔥 ИСПРАВЛЕНИЕ: Возвращаем ошибки
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Недействительный токен', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Срок действия токена истек', 401));
    }
    
    return next(new AppError('Ошибка аутентификации', 401));
  }
};

/**
 * Middleware для проверки ролей пользователя
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('🔐 requireRole checking:', { 
      user: req.user ? { id: req.user.id, role: req.user.role } : null, 
      requiredRoles: roles,
      path: req.path,
      method: req.method
    });
    
    if (!req.user) {
      console.log('❌ No user in request');
      return next(new AppError('Требуется аутентификация', 401));
    }

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      console.log(`❌ User role ${req.user.role} not in allowed roles:`, roles);
      return next(new AppError('Недостаточно прав', 403));
    }

    console.log(`✅ Role check passed for ${req.user.role}`);
    next();
  };
};

/**
 * Middleware для проверки прав администратора
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware для проверки прав оператора или администратора
 */
export const requireOperator = requireRole(['admin', 'operator']);

/**
 * Middleware для проверки прав работника
 */
export const requireWorker = requireRole(['admin', 'operator', 'worker']);

/**
 * 🔥 НОВЫЙ: Middleware для проверки прав администратора ИЛИ оператора
 * Используется там, где нужно дать доступ обоим ролям
 */
export const requireAdminOrOperator = requireRole(['admin', 'operator']);

/**
 * Middleware для проверки, что пользователь является владельцем ресурса или имеет права
 */
export const requireOwnershipOrRole = (resourceOwnerField = 'user_id', allowedRoles = ['admin', 'operator']) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Требуется аутентификация', 401));
    }

    // Администраторы и операторы имеют полный доступ
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Проверяем, является ли пользователь владельцем ресурса
    const resourceOwnerId = req.params[resourceOwnerField] || req.body[resourceOwnerField];
    
    if (!resourceOwnerId) {
      return next(new AppError('Не удалось определить владельца ресурса', 400));
    }

    if (parseInt(resourceOwnerId) !== parseInt(req.user.id)) {
      return next(new AppError('Доступ запрещен', 403));
    }

    next();
  };
};

/**
 * Middleware для проверки, что пользователь может управлять заявками
 */
export const canManageApplications = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Требуется аутентификация', 401));
  }

  // Администраторы и операторы могут управлять всеми заявками
  if (req.user.role === 'admin' || req.user.role === 'operator') {
    return next();
  }

  // Работники могут только просматривать и добавлять ответы
  if (req.user.role === 'worker') {
    const allowedMethods = ['GET', 'POST']; // Просмотр и добавление ответов
    if (allowedMethods.includes(req.method)) {
      return next();
    }
    return next(new AppError('Работники могут только просматривать заявки и добавлять ответы', 403));
  }

  // Обычные пользователи могут только создавать заявки и просматривать свои
  if (req.user.role === 'user') {
    if (req.method === 'POST') {
      return next(); // Создание заявок
    }
    if (req.method === 'GET' && req.params.phone === req.user.phone) {
      return next(); // Просмотр своих заявок
    }
    return next(new AppError('Пользователи могут только создавать заявки и просматривать свои', 403));
  }

  next(new AppError('Неизвестная роль пользователя', 403));
};

export const canManageUsers = (req, res, next) => {

  // Только администраторы и операторы могут управлять пользователями
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    console.log('❌ Access denied for user management:', req.user.role);
    return next(new AppError('Только администраторы и операторы могут управлять пользователями', 403));
  }

  // Проверяем ограничения для оператора
  if (req.user.role === 'operator') {
    console.log('👷 Operator managing users - applying restrictions');
    
    // Оператор не может удалять пользователей
    if (req.method === 'DELETE') {
      return next(new AppError('Операторы не могут удалять пользователей', 403));
    }
    
    // Оператор не может менять роль на admin
    if (req.body.role === 'admin') {
      return next(new AppError('Операторы не могут назначать роль администратора', 403));
    }
    
    // Оператор не может создавать администраторов
    if (req.method === 'POST' && req.body.role === 'admin') {
      return next(new AppError('Операторы не могут создавать администраторов', 403));
    }
    
    // Оператор может работать только с работниками (role=worker)
    if (req.method === 'GET' && req.query.role && req.query.role !== 'worker') {
      console.log('⚠️ Operator trying to access non-worker users, filtering to workers only');
      req.query.role = 'worker'; // Форсируем фильтр
    }
  }

  // Администратор не может удалить сам себя
  if (req.method === 'DELETE' && parseInt(req.params.id) === parseInt(req.user.id)) {
    return next(new AppError('Нельзя удалить собственный аккаунт', 400));
  }

  next();
};

/**
 * Middleware для проверки прав управления товарами
 */
export const canManageProducts = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Требуется аутентификация', 401));
  }

  // 🔥 ОБНОВЛЕНО: Даем оператору только просмотр товаров
  if (req.user.role === 'operator' && req.method !== 'GET') {
    return next(new AppError('Операторы могут только просматривать товары', 403));
  }

  // Только администраторы могут создавать/обновлять/удалять товары
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    return next(new AppError('Только администраторы могут управлять товарами', 403));
  }

  next();
};

/**
 * Middleware для проверки прав управления запросами работников
 */
export const canManageWorkerRequests = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Требуется аутентификация', 401));
  }

  // 🔥 ОБНОВЛЕНО: Даем оператору только просмотр запросов
  if (req.user.role === 'operator' && req.method !== 'GET') {
    return next(new AppError('Операторы могут только просматривать запросы работников', 403));
  }

  // Только администраторы могут обрабатывать запросы
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    return next(new AppError('Только администраторы могут управлять запросами работников', 403));
  }

  next();
};

/**
 * Middleware для генерации нового токена (refresh token)
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    role: user.role,
    phone: user.phone
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Middleware для проверки, что пользователь является владельцем заявки
 */
export const isApplicationOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Application = await import('../models/Application.js');

    const application = await Application.findById(id);
    
    if (!application) {
      return next(new AppError('Заявка не найдена', 404));
    }

    // Администраторы и операторы имеют доступ ко всем заявкам
    if (req.user.role === 'admin' || req.user.role === 'operator') {
      req.application = application;
      return next();
    }

    // Проверяем, является ли пользователь владельцем заявки
    if (application.phone !== req.user.phone) {
      return next(new AppError('Доступ к этой заявке запрещен', 403));
    }

    req.application = application;
    next();
  } catch (error) {
    next(new AppError('Ошибка при проверке прав доступа к заявке', 500));
  }
};

/**
 * Middleware для проверки, что пользователь может добавлять ответы к заявке
 */
export const canAddResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Application = await import('../models/Application.js');

    const application = await Application.findById(id);
    
    if (!application) {
      return next(new AppError('Заявка не найдена', 404));
    }

    // Только работники, операторы и администраторы могут добавлять ответы
    if (req.user.role === 'user') {
      return next(new AppError('Только работники могут добавлять ответы к заявкам', 403));
    }

    // Нельзя добавлять ответы к удаленным заявкам
    if (application.marked_for_deletion) {
      return next(new AppError('Нельзя добавлять ответы к заявке, помеченной на удаление', 400));
    }

    req.application = application;
    next();
  } catch (error) {
    next(new AppError('Ошибка при проверке прав на добавление ответа', 500));
  }
};

/**
 * Middleware для проверки, что пользователь может помечать заявки на удаление
 */
export const canMarkForDeletion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Application = await import('../models/Application.js');

    const application = await Application.findById(id);
    
    if (!application) {
      return next(new AppError('Заявка не найдена', 404));
    }

    // Только операторы и администраторы могут помечать заявки на удаление
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      return next(new AppError('Только операторы и администраторы могут помечать заявки на удаление', 403));
    }

    // Нельзя помечать уже удаленные заявки
    if (application.marked_for_deletion) {
      return next(new AppError('Заявка уже помечена на удаление', 400));
    }

    req.application = application;
    next();
  } catch (error) {
    next(new AppError('Ошибка при проверке прав на пометку заявки', 500));
  }
};

/**
 * Middleware для логирования действий пользователя
 */
export const logUserAction = (action) => {
  console.log('🔍 logUserAction called for:', action);
  
  return (req, res, next) => {
    console.log('🔍 logUserAction executing for:', action);
    console.log('🔍 Request params:', req.params);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    
    // Просто вызываем next() без логики
    next();
  };
};

/**
 * Middleware для проверки лимитов использования API по ролям
 */
export const checkRateLimitByRole = (req, res, next) => {
  // Базовые лимиты по ролям (можно вынести в конфиг)
  const roleLimits = {
    admin: 1000,
    operator: 500,
    worker: 200,
    user: 100
  };

  const userLimit = roleLimits[req.user?.role] || roleLimits.user;
  
  // Здесь можно интегрировать с express-rate-limit
  // или реализовать кастомную логику проверки лимитов
  
  req.rateLimit = {
    limit: userLimit,
    // current: currentCount,
    // remaining: userLimit - currentCount
  };
  
  next();
};

/**
 * Middleware для проверки, что пользователь активен
 */
export const requireActiveUser = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Требуется аутентификация', 401));
  }

  if (req.user.status !== 'active') {
    return next(new AppError('Аккаунт заблокирован или удален', 403));
  }

  next();
};

/**
 * 🔥 НОВЫЙ: Middleware для автоматической фильтрации по роли для оператора
 */
export const autoFilterForOperator = (resourceRole = 'worker') => {
  return (req, res, next) => {
    console.log('🔍 autoFilterForOperator checking:', { 
      user: req.user?.role,
      resourceRole 
    });
    
    if (!req.user) {
      return next();
    }

    // Если оператор и нет явного фильтра по роли, добавляем фильтр
    if (req.user.role === 'operator' && !req.query.role) {
      console.log(`👷 Auto-filtering for operator: role=${resourceRole}`);
      req.query.role = resourceRole;
    }

    next();
  };
};

export default {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireOperator,
  requireWorker,
  requireAdminOrOperator, // 🔥 НОВЫЙ
  requireOwnershipOrRole,
  canManageApplications,
  canManageUsers,
  canManageProducts,
  canManageWorkerRequests,
  generateToken,
  isApplicationOwner,
  canAddResponse,
  canMarkForDeletion,
  logUserAction,
  checkRateLimitByRole,
  requireActiveUser,
  autoFilterForOperator // 🔥 НОВЫЙ
};