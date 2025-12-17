import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Утилиты для работы с приложением
 */

// Получение текущей директории для ES modules
export const getCurrentDir = (importMetaUrl) => {
  const __filename = fileURLToPath(importMetaUrl);
  return dirname(__filename);
};

// Генерация случайной строки
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Генерация уникального ID
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Хеширование пароля
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Проверка пароля
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Форматирование телефона
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Убираем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  // Форматируем в международный формат
  if (cleaned.length === 11 && cleaned.startsWith('8')) {
    return '+7' + cleaned.slice(1);
  }
  
  if (cleaned.length === 10) {
    return '+7' + cleaned;
  }
  
  return '+' + cleaned;
};

// Валидация телефона
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Валидация email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Форматирование даты
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return new Date(date).toLocaleString('ru-RU', formatOptions);
};

// Форматирование цены
export const formatPrice = (price, currency = '₽') => {
  if (!price && price !== 0) return 'Цена не указана';
  
  return `${currency}${price.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

// Обрезка текста
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substr(0, maxLength) + '...';
};

// Создание slug из строки
export const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Генерация псевдослучайного цвета
export const generateColor = (seed) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Пагинация
export const calculatePagination = (totalItems, currentPage = 1, pageSize = 10) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
  
  return {
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    startIndex,
    endIndex,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
    pages: Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
      if (totalPages <= 7) return i + 1;
      
      if (currentPage <= 4) return i + 1;
      if (currentPage >= totalPages - 3) return totalPages - 6 + i;
      
      return currentPage - 3 + i;
    })
  };
};

// Сортировка массива объектов
export const sortArray = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    let aValue = a[key];
    let bValue = b[key];
    
    // Приведение к нижнему регистру для строк
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Фильтрация массива
export const filterArray = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true;
      
      const itemValue = item[key];
      
      if (typeof value === 'string') {
        return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
      }
      
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      
      return itemValue === value;
    });
  });
};

// Группировка массива по ключу
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

// Глубокое клонирование объекта
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Слияние объектов
export const mergeObjects = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = mergeObjects(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
};

// Удаление null/undefined полей
export const removeEmptyFields = (obj) => {
  const cleaned = { ...obj };
  
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
      delete cleaned[key];
    }
  });
  
  return cleaned;
};

// Валидация Russian INN
export const isValidINN = (inn) => {
  if (!inn) return false;
  if (!/^\d+$/.test(inn)) return false;
  
  const length = inn.length;
  if (length !== 10 && length !== 12) return false;
  
  // Алгоритм проверки контрольной суммы
  const checkDigit = (inn, coefficients) => {
    let sum = 0;
    for (let i = 0; i < coefficients.length; i++) {
      sum += parseInt(inn[i]) * coefficients[i];
    }
    return (sum % 11) % 10;
  };
  
  if (length === 10) {
    const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    return checkDigit(inn, coefficients) === parseInt(inn[9]);
  }
  
  if (length === 12) {
    const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    
    return (
      checkDigit(inn, coefficients1) === parseInt(inn[10]) &&
      checkDigit(inn, coefficients2) === parseInt(inn[11])
    );
  }
  
  return false;
};

// Генерация пароля
export const generatePassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Гарантируем наличие хотя бы одной цифры и одного специального символа
  password += '0123456789'.charAt(Math.floor(Math.random() * 10));
  password += '!@#$%^&*'.charAt(Math.floor(Math.random() * 8));
  
  for (let i = 2; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Перемешиваем пароль
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Задержка выполнения
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Обработка ошибок с повторными попытками
export const retry = async (fn, retries = 3, delayMs = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs * 2); // Экспоненциальная задержка
  }
};

// Валидация файла
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options;
  
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`);
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`Недопустимый тип файла. Разрешены: ${allowedTypes.join(', ')}`);
  }
  
  const extension = file.originalname.toLowerCase().substr(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    errors.push(`Недопустимое расширение файла. Разрешены: ${allowedExtensions.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Создание дерева из плоского массива
export const buildTree = (items, idKey = 'id', parentKey = 'parent_id', childrenKey = 'children') => {
  const itemMap = {};
  const tree = [];
  
  // Создаем хэш-таблицу
  items.forEach(item => {
    itemMap[item[idKey]] = { ...item, [childrenKey]: [] };
  });
  
  // Строим дерево
  items.forEach(item => {
    if (item[parentKey] && itemMap[item[parentKey]]) {
      itemMap[item[parentKey]][childrenKey].push(itemMap[item[idKey]]);
    } else {
      tree.push(itemMap[item[idKey]]);
    }
  });
  
  return tree;
};

// Сериализация ошибки для логирования
export const serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error
    };
  }
  return error;
};

// Десериализация ошибки
export const deserializeError = (serialized) => {
  if (serialized && serialized.name && serialized.message) {
    const error = new Error(serialized.message);
    error.name = serialized.name;
    error.stack = serialized.stack;
    return Object.assign(error, serialized);
  }
  return serialized;
};

export default {
  generateRandomString,
  generateUniqueId,
  hashPassword,
  verifyPassword,
  formatPhone,
  isValidPhone,
  isValidEmail,
  formatDate,
  formatPrice,
  truncateText,
  createSlug,
  generateColor,
  calculatePagination,
  sortArray,
  filterArray,
  groupBy,
  deepClone,
  mergeObjects,
  removeEmptyFields,
  isValidINN,
  generatePassword,
  delay,
  retry,
  validateFile,
  buildTree,
  serializeError,
  deserializeError
};