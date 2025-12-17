import { config } from 'dotenv';

// Загружаем переменные окружения
config();

/**
 * Конфигурация окружения приложения
 */

// Базовые настройки приложения
export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Настройки приложения
  app: {
    name: 'Ритуальная справочная',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'Система управления заявками на ритуальные услуги'
  }
};

// Настройки базы данных
export const databaseConfig = {
  path: process.env.DATABASE_PATH || './database.sqlite',
  testPath: process.env.TEST_DATABASE_PATH || './test_database.sqlite',
  
  // Настройки подключения
  connection: {
    timeout: 5000,
    verbose: process.env.NODE_ENV === 'development'
  },
  
  // Настройки производительности
  performance: {
    cacheSize: -64000, // 64MB
    journalMode: 'WAL',
    synchronous: 'NORMAL'
  }
};

// Настройки безопасности
export const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },
  
  cors: {
    enabled: true,
    origins: [process.env.FRONTEND_URL || 'http://localhost:3000']
  }
};

// Настройки email
export const emailConfig = {
  enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  
  // SMTP настройки
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  
  // Ethereal.email для development
  ethereal: {
    user: process.env.ETHEREAL_USER || 'test@ethereal.email',
    pass: process.env.ETHEREAL_PASS || 'test'
  },
  
  // Отправитель по умолчанию
  from: process.env.SMTP_FROM || '"Order System" <noreply@ordersystem.com>',
  
  // Адреса для уведомлений
  adminEmail: process.env.ADMIN_EMAIL || 'admin@system.com',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@system.com'
};

// Настройки загрузки файлов
export const uploadConfig = {
  enabled: process.env.ENABLE_FILE_UPLOADS === 'true',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  uploadPath: process.env.UPLOAD_PATH || './img',
  
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf')
    .split(',')
    .map(type => type.trim()),
  
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
};

// Настройки лимитирования запросов
export const rateLimitConfig = {
  enabled: process.env.ENABLE_RATE_LIMITING === 'true',
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  
  // Лимиты по типам запросов
  limits: {
    auth: 5,        // Попытки входа
    registration: 3, // Регистрации
    applications: 10 // Создание заявок
  }
};

// Настройки логирования
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || './logs/app.log',
  format: process.env.LOG_FORMAT || 'combined',
  
  // Настройки для разных окружений
  development: {
    level: 'debug',
    format: 'dev'
  },
  
  production: {
    level: 'warn',
    format: 'combined'
  }
};

// Feature flags
export const featureFlags = {
  registration: process.env.ENABLE_REGISTRATION !== 'false',
  emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  fileUploads: process.env.ENABLE_FILE_UPLOADS === 'true',
  rateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  securityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
  apiDocs: process.env.API_DOCS_ENABLED === 'true'
};

// Настройки monitoring
export const monitoringConfig = {
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN
  },
  
  newRelic: {
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    appName: process.env.NEW_RELIC_APP_NAME,
    enabled: !!process.env.NEW_RELIC_LICENSE_KEY
  }
};

// Валидация обязательных переменных окружения
export const validateEnvironment = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('   Using default values which may not be secure for production');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Missing required environment variables in production!');
      process.exit(1);
    }
  }
  
  // Проверка security-sensitive переменных
  const securityVars = ['JWT_SECRET', 'SESSION_SECRET'];
  const defaultSecurityVars = securityVars.filter(key => 
    process.env[key] && process.env[key].includes('dev-') || 
    process.env[key] && process.env[key].includes('change-in-production')
  );
  
  if (defaultSecurityVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('❌ Using default security values in production!');
    console.error(`   Please change: ${defaultSecurityVars.join(', ')}`);
    process.exit(1);
  }
  
  return missing.length === 0;
};

// Получение конфигурации для текущего окружения
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    env,
    app: appConfig,
    database: databaseConfig,
    security: securityConfig,
    email: emailConfig,
    upload: uploadConfig,
    rateLimit: rateLimitConfig,
    logging: loggingConfig[env] || loggingConfig,
    features: featureFlags,
    monitoring: monitoringConfig
  };
};

// Экспорт конфигурации по умолчанию
export default getConfig();