// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  WORKER: 'worker',
  USER: 'user'
};

// Статусы заявок
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ASSIGNED: 'assigned',
  CANCELLED: 'cancelled',
  DELETED: 'deleted',
  FOR_DELETE: 'for_delete'
};

// Типы уведомлений
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Типы товаров (пример)
export const PRODUCT_TYPES = {
  FURNITURE: 'furniture',
  CLOTHING: 'clothing',
  ELECTRONICS: 'electronics',
  OTHER: 'other'
};

// Материалы (пример)
export const MATERIALS = {
  WOOD: 'wood',
  METAL: 'metal',
  PLASTIC: 'plastic',
  FABRIC: 'fabric',
  LEATHER: 'leather',
  OTHER: 'other'
};

// Размеры (пример)
export const SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XL: 'xl',
  CUSTOM: 'custom'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER_WORKER: '/auth/register-worker',
    ME: '/auth/me',
    VALIDATE_PHONE: '/auth/validate-phone',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout'
  },
  APPLICATIONS: {
    BASE: '/applications',
    USER: '/applications/user',
    WORKER: '/applications/worker',
    MARK_DELETION: '/applications/mark-deletion',
    RESPONSE: '/applications/response',
    STATS: '/applications/stats'
  },
  PRODUCTS: {
    TYPES: '/products/types',
    PRODUCTS: '/products',
    BY_TYPE: '/products/type',
    OPTIONS: '/products/options',
    MATERIALS: '/products/materials',
    SIZES: '/products/sizes'
  },
  USERS: {
    BASE: '/users',
    WORKER_REQUESTS: '/users/worker-requests',
    PROFILE: '/users/profile',
    ROLES: '/users/roles'
  },
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/download'
  }
};

// Коды ошибок
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Необходима авторизация',
  [ERROR_CODES.FORBIDDEN]: 'Доступ запрещен',
  [ERROR_CODES.NOT_FOUND]: 'Ресурс не найден',
  [ERROR_CODES.VALIDATION_ERROR]: 'Ошибка валидации данных',
  [ERROR_CODES.SERVER_ERROR]: 'Внутренняя ошибка сервера',
  [ERROR_CODES.NETWORK_ERROR]: 'Ошибка сети. Проверьте подключение к интернету',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Превышено время ожидания ответа',
  
  DEFAULT: 'Произошла непредвиденная ошибка',
  UNKNOWN: 'Неизвестная ошибка'
};

// Лимиты и настройки
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COMMENT_LENGTH: 500,
  MAX_RESPONSE_LENGTH: 1000,
  PASSWORD_MIN_LENGTH: 6,
  PHONE_LENGTH: 11,
  ITEMS_PER_PAGE: 10,
  SEARCH_DEBOUNCE: 300 // ms
};

// Время в миллисекундах
export const TIMING = {
  TOAST_DURATION: 5000,
  AUTO_LOGOUT: 30 * 60 * 1000, // 30 минут
  DEBOUNCE_DELAY: 300,
  REFRESH_INTERVAL: 2 * 60 * 1000 // 2 минуты
};

// Локализация
export const LOCALIZATION = {
  RU: {
    ROLES: {
      [USER_ROLES.ADMIN]: 'Администратор',
      [USER_ROLES.OPERATOR]: 'Оператор',
      [USER_ROLES.WORKER]: 'Работник',
      [USER_ROLES.USER]: 'Клиент'
    },
    STATUSES: {
      [APPLICATION_STATUS.PENDING]: 'Ожидает',
      [APPLICATION_STATUS.IN_PROGRESS]: 'В работе',
      [APPLICATION_STATUS.COMPLETED]: 'Завершена',
      [APPLICATION_STATUS.CANCELLED]: 'Отменена',
      [APPLICATION_STATUS.DELETED]: 'Удалена',
      [APPLICATION_STATUS.FOR_DELETE]: 'На удаление',
      [APPLICATION_STATUS.ASSIGNED]: 'Исполняется'
    },
    PRODUCT_TYPES: {
      [PRODUCT_TYPES.FURNITURE]: 'Мебель',
      [PRODUCT_TYPES.CLOTHING]: 'Одежда',
      [PRODUCT_TYPES.ELECTRONICS]: 'Электроника',
      [PRODUCT_TYPES.OTHER]: 'Другое'
    },
    MATERIALS: {
      [MATERIALS.WOOD]: 'Дерево',
      [MATERIALS.METAL]: 'Металл',
      [MATERIALS.PLASTIC]: 'Пластик',
      [MATERIALS.FABRIC]: 'Ткань',
      [MATERIALS.LEATHER]: 'Кожа',
      [MATERIALS.OTHER]: 'Другое'
    },
    SIZES: {
      [SIZES.SMALL]: 'Маленький',
      [SIZES.MEDIUM]: 'Средний',
      [SIZES.LARGE]: 'Большой',
      [SIZES.XL]: 'Очень большой',
      [SIZES.CUSTOM]: 'Индивидуальный'
    }
  }
};

// Цвета для статусов
export const STATUS_COLORS = {
  [APPLICATION_STATUS.PENDING]: '#ffc107',
  [APPLICATION_STATUS.IN_PROGRESS]: '#17a2b8',
  [APPLICATION_STATUS.COMPLETED]: '#28a745',
  [APPLICATION_STATUS.CANCELLED]: '#dc3545',
  [APPLICATION_STATUS.DELETED]: '#6c757d',
  [APPLICATION_STATUS.FOR_DELETE]: '#000000ff',
  [APPLICATION_STATUS.ASSIGNED]: '#e800fdff'
};

// Настройки темы
export const THEME = {
  COLORS: {
    PRIMARY: '#3498db',
    SECONDARY: '#2ecc71',
    DANGER: '#e74c3c',
    WARNING: '#f39c12',
    INFO: '#17a2b8',
    DARK: '#2c3e50',
    LIGHT: '#ecf0f1',
    GRAY: '#95a5a6'
  },
  BREAKPOINTS: {
    MOBILE: '768px',
    TABLET: '1024px',
    DESKTOP: '1200px'
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px'
  }
};

// Ключи для localStorage
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  REMEMBER_ME: 'rememberMe',
  LAST_ROUTE: 'lastRoute'
};

// Настройки приложения
export const APP_CONFIG = {
  NAME: 'ProductOrderSystem',
  VERSION: '1.0.0',
  DESCRIPTION: 'Система управления заявками на товары',
  SUPPORT_EMAIL: 'support@productordersystem.com',
  SUPPORT_PHONE: '+7 (999) 123-45-67',
  COMPANY_NAME: 'Product Order System Inc.',
  COPYRIGHT_YEAR: new Date().getFullYear()
};

// Экспорт по умолчанию для удобства
export default {
  USER_ROLES,
  APPLICATION_STATUS,
  NOTIFICATION_TYPES,
  PRODUCT_TYPES,
  MATERIALS,
  SIZES,
  API_ENDPOINTS,
  ERROR_CODES,
  ERROR_MESSAGES,
  LIMITS,
  TIMING,
  LOCALIZATION,
  STATUS_COLORS,
  THEME,
  STORAGE_KEYS,
  APP_CONFIG
};