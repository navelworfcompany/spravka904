import rateLimit from 'express-rate-limit';

/**
 * Настройки лимита запросов для разных endpoints
 */

// Общий лимит для API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов с одного IP за окно
  message: {
    success: false,
    error: 'Слишком много запросов с этого IP, попробуйте позже'
  },
  standardHeaders: true, // Возвращает информацию о лимитах в headers `RateLimit-*`
  legacyHeaders: false, // Отключает `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

// Строгий лимит для аутентификации
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа с одного IP за окно
  message: {
    success: false,
    error: 'Слишком много попыток входа, попробуйте через 15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считать успешные запросы
  handler: (req, res, next, options) => {
    console.warn(`Too many auth attempts from IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Лимит для регистрации
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // максимум 3 регистрации с одного IP в час
  message: {
    success: false,
    error: 'Слишком много попыток регистрации, попробуйте через час'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`Too many registration attempts from IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Лимит для создания заявок
export const applicationCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 заявок с одного IP в час
  message: {
    success: false,
    error: 'Слишком много созданных заявок, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`Too many application creations from IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Лимит для рабочих endpoints (ответы работников)
export const workerActionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // максимум 50 действий работника за окно
  message: {
    success: false,
    error: 'Слишком много действий, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Лимит для административных действий
export const adminActionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 административных действий за окно
  message: {
    success: false,
    error: 'Слишком много административных действий, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Лимит для загрузки файлов
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 загрузок за окно
  message: {
    success: false,
    error: 'Слишком много загрузок файлов, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Динамический лимитер для разных пользователей
export const createDynamicLimiter = (defaultMax = 100) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
      // Разные лимиты для разных ролей
      if (req.user?.role === 'admin') return 1000;
      if (req.user?.role === 'operator') return 500;
      if (req.user?.role === 'worker') return 200;
      return defaultMax; // Для неаутентифицированных пользователей
    },
    message: {
      success: false,
      error: 'Слишком много запросов для вашей роли, попробуйте позже'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Используем user ID если пользователь аутентифицирован, иначе IP
      return req.user ? req.user.id.toString() : req.ip;
    }
  });
};

// Лимитер для тестового окружения (без ограничений)
export const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Очень высокий лимит для тестов
  message: {
    success: false,
    error: 'Test rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Функция для получения подходящего лимитера в зависимости от окружения
export const getLimiter = (type = 'general') => {
  if (process.env.NODE_ENV === 'test') {
    return testLimiter;
  }

  const limiters = {
    general: generalLimiter,
    auth: authLimiter,
    registration: registrationLimiter,
    application: applicationCreationLimiter,
    worker: workerActionsLimiter,
    admin: adminActionsLimiter,
    upload: uploadLimiter,
    dynamic: createDynamicLimiter()
  };

  return limiters[type] || generalLimiter;
};

// Middleware для установки headers с информацией о лимитах
export const rateLimitHeaders = (req, res, next) => {
  const limit = req.rateLimit?.limit;
  const current = req.rateLimit?.current;
  const remaining = req.rateLimit?.remaining;
  const resetTime = req.rateLimit?.resetTime;

  if (limit && current !== undefined && remaining !== undefined) {
    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': resetTime
    });
  }

  next();
};

// Функция для сброса лимита по ключу (для административных целей)
export const resetRateLimit = async (key) => {
  // Эта функция требует доступа к store rate-limiter
  // В production нужно использовать Redis store или другой persistent store
  console.log(`Rate limit reset requested for key: ${key}`);
  // Реализация зависит от выбранного store
};