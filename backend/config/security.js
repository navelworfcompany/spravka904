/**
 * Конфигурация безопасности приложения
 */

// Настройки JWT
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  algorithm: 'HS256',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Настройки для разных окружений
  options: {
    issuer: 'order-management-system',
    audience: 'order-management-system-users'
  }
};

// Настройки CORS
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000'
    ];

    // Разрешаем запросы без origin (например, от мобильных приложений)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'Accept',
    'Origin',
    'Cache-Control'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 часа
};

// Настройки Helmet (безопасность HTTP headers)
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

// Настройки rate limiting
export const rateLimitConfig = {
  // Общие настройки
  general: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 1000, // Максимум 1000 запросов за окно
    message: 'Слишком много запросов с этого IP, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Аутентификация
  auth: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // 5 попыток входа
    message: 'Слишком много попыток входа, попробуйте через 15 минут',
    skipSuccessfulRequests: true
  },
  
  // Регистрация
  registration: {
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // 3 регистрации в час
    message: 'Слишком много попыток регистрации, попробуйте через час'
  },
  
  // Создание заявок
  applications: {
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10, // 10 заявок в час
    message: 'Слишком много созданных заявок, попробуйте позже'
  },
  
  // По ролям
  byRole: {
    admin: 1000,
    operator: 500,
    worker: 200,
    user: 100,
    anonymous: 50
  }
};

// Настройки паролей
export const passwordConfig = {
  minLength: 6,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: true,
  requireSpecialChars: false,
  // Запрещенные пароли (простые и часто используемые)
  blacklist: [
    'password',
    '123456',
    'qwerty',
    'admin',
    'password123',
    '12345678',
    '111111',
    '000000'
  ]
};

// Настройки сессий (если будут использоваться)
export const sessionConfig = {
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'strict'
  }
};

// Настройки защиты от атак
export const attackPreventionConfig = {
  // Защита от brute force
  bruteForce: {
    maxAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 минут
    resetTime: 24 * 60 * 60 * 1000 // 24 часа
  },
  
  // Защита от SQL injection
  sqlInjection: {
    // Паттерны для обнаружения SQL injection
    patterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
      /('|"|;|--|\/\*|\*\/|@@|char|nchar|varchar|nvarchar)/i
    ]
  },
  
  // Защита от XSS
  xss: {
    // Политики очистки HTML
    allowedTags: [], // Пустой массив = никакие теги не разрешены
    allowedAttributes: {}
  },
  
  // Защита от CSRF
  csrf: {
    enabled: true,
    methods: ['POST', 'PUT', 'DELETE', 'PATCH']
  }
};

// Настройки шифрования
export const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  saltRounds: 12
};

// Политика безопасности содержимого
export const contentSecurityPolicy = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"]
};

// Настройки аудита безопасности
export const auditConfig = {
  // Логирование подозрительной активности
  logSuspiciousActivity: true,
  
  // Параметры для логирования
  logFields: [
    'timestamp',
    'ip',
    'userAgent',
    'method',
    'url',
    'userId',
    'userRole',
    'action'
  ],
  
  // Подозрительные паттерны
  suspiciousPatterns: {
    sqlInjection: [
      /union.*select/i,
      /insert.*into/i,
      /drop.*table/i,
      /update.*set/i,
      /delete.*from/i,
      /exec\(/i,
      /xp_cmdshell/i
    ],
    xss: [
      /<script>/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i
    ],
    pathTraversal: [
      /\.\.\//g,
      /\.\.\\/g,
      /etc\/passwd/,
      /windows\/system32/
    ]
  }
};

// Функция для проверки безопасности пароля
export const validatePasswordSecurity = (password) => {
  const errors = [];
  
  if (password.length < passwordConfig.minLength) {
    errors.push(`Пароль должен содержать минимум ${passwordConfig.minLength} символов`);
  }
  
  if (passwordConfig.requireNumbers && !/\d/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  }
  
  if (passwordConfig.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать заглавные буквы');
  }
  
  if (passwordConfig.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать строчные буквы');
  }
  
  if (passwordConfig.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать специальные символы');
  }
  
  if (passwordConfig.blacklist.includes(password.toLowerCase())) {
    errors.push('Этот пароль слишком простой и часто используется');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Функция для обнаружения подозрительной активности
export const detectSuspiciousActivity = (req) => {
  const suspicious = [];
  const { body, query, params, headers } = req;
  
  // Проверяем все входящие данные на SQL injection
  const checkForSqlInjection = (data, context) => {
    if (typeof data === 'string') {
      attackPreventionConfig.sqlInjection.patterns.forEach((pattern, index) => {
        if (pattern.test(data)) {
          suspicious.push({
            type: 'sql_injection',
            pattern: index,
            context,
            data: data.substring(0, 100) // Логируем только первые 100 символов
          });
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        checkForSqlInjection(value, `${context}.${key}`);
      });
    }
  };
  
  checkForSqlInjection(body, 'body');
  checkForSqlInjection(query, 'query');
  checkForSqlInjection(params, 'params');
  
  // Проверяем User-Agent на аномалии
  const userAgent = headers['user-agent'];
  if (!userAgent || userAgent.length > 500) {
    suspicious.push({
      type: 'suspicious_user_agent',
      userAgent: userAgent ? userAgent.substring(0, 100) : 'missing'
    });
  }
  
  return suspicious;
};

// Функция для генерации безопасного токена
export const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

// Конфигурация для разных окружений
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      strict: false,
      logging: 'debug',
      cors: {
        ...corsConfig,
        origin: true // Разрешаем все origins в development
      }
    },
    test: {
      strict: true,
      logging: 'error',
      cors: corsConfig
    },
    production: {
      strict: true,
      logging: 'warn',
      cors: corsConfig
    }
  };
  
  return configs[env];
};

export default {
  jwtConfig,
  corsConfig,
  helmetConfig,
  rateLimitConfig,
  passwordConfig,
  sessionConfig,
  attackPreventionConfig,
  encryptionConfig,
  contentSecurityPolicy,
  auditConfig,
  validatePasswordSecurity,
  detectSuspiciousActivity,
  generateSecureToken,
  getSecurityConfig
};