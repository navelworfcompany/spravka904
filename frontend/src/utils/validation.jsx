// Регулярные выражения для валидации
export const PATTERNS = {
  PHONE: /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
  NAME: /^[a-zA-Zа-яА-ЯёЁ\s\-']{2,50}$/,
  ORGANIZATION_NAME: /^[a-zA-Zа-яА-ЯёЁ0-9\s\-'&.,]{2,100}$/,
  COMMENT: /^[\s\S]{0,500}$/ // Максимум 500 символов
};

// Основные функции валидации
export const validation = {
  // Обязательное поле
  required: (value, fieldName = 'Поле') => {
    if (!value || value.toString().trim() === '') {
      return `Поле "${fieldName}" обязательно для заполнения!`;
    }
    return null;
  },

  // Email
  email: (value, fieldName = 'Email') => {
    if (!value) return `${fieldName} обязателен`;
    
    if (!PATTERNS.EMAIL.test(value)) {
      return 'Введите корректный email адрес';
    }
    return null;
  },

  // Телефон
  phone: (value, fieldName = 'Телефон') => {
    if (!value) return `${fieldName} обязателен`;
    
    const cleanPhone = value.replace(/\D/g, '');
    if (!PATTERNS.PHONE.test(cleanPhone)) {
      return 'Введите корректный номер телефона';
    }
    return null;
  },

  // Пароль
  password: (value, fieldName = 'Пароль') => {
    if (!value) return `${fieldName} обязателен`;
    
    if (value.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    
    // Опциональная сложность пароля
    if (!PATTERNS.PASSWORD.test(value)) {
      return 'Пароль должен содержать буквы в верхнем и нижнем регистре и цифры';
    }
    
    return null;
  },

  // Подтверждение пароля
  confirmPassword: (password, confirmPassword, fieldName = 'Пароль') => {
    if (!confirmPassword) return 'Подтвердите пароль';
    
    if (password !== confirmPassword) {
      return 'Пароли не совпадают';
    }
    return null;
  },

  // Минимальная длина
  minLength: (value, min, fieldName = 'Поле') => {
    if (value && value.length < min) {
      return `${fieldName} должен содержать минимум ${min} символов`;
    }
    return null;
  },

  // Максимальная длина
  maxLength: (value, max, fieldName = 'Поле') => {
    if (value && value.length > max) {
      return `${fieldName} должен содержать максимум ${max} символов`;
    }
    return null;
  },

  // Имя
  name: (value, fieldName = 'Имя') => {
    if (!value) return `${fieldName} обязательно`;
    
    if (!PATTERNS.NAME.test(value)) {
      return `${fieldName} должно содержать только буквы и быть от 2 до 50 символов`;
    }
    return null;
  },

  // Название организации
  organizationName: (value, fieldName = 'Название организации') => {
    if (!value) return `${fieldName} обязательно`;
    
    if (!PATTERNS.ORGANIZATION_NAME.test(value)) {
      return `${fieldName} должно быть от 2 до 100 символов и может содержать только буквы, цифры и специальные символы (&.,-)`;
    }
    return null;
  },

  // Комментарий
  comment: (value, fieldName = 'Комментарий') => {
    if (value && value.length > 500) {
      return `${fieldName} не должен превышать 500 символов`;
    }
    return null;
  },

  // Число в диапазоне
  numberRange: (value, min, max, fieldName = 'Число') => {
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} должно быть числом`;
    }
    
    if (num < min || num > max) {
      return `${fieldName} должно быть между ${min} и ${max}`;
    }
    return null;
  },

  // Положительное число
  positiveNumber: (value, fieldName = 'Число') => {
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} должно быть числом`;
    }
    
    if (num <= 0) {
      return `${fieldName} должно быть положительным`;
    }
    return null;
  },

  // URL
  url: (value, fieldName = 'URL') => {
    if (!value) return null;
    
    try {
      new URL(value);
      return null;
    } catch {
      return 'Введите корректный URL адрес';
    }
  },

  // Дата (не в прошлом)
  futureDate: (value, fieldName = 'Дата') => {
    if (!value) return null;
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return `${fieldName} не может быть в прошлом`;
    }
    return null;
  }
};

// Специальные валидаторы для форм

// Валидация контактной формы (для ContactModal)
export const contactValidation = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Имя обязательно для заполнения';
  } else if (data.name.length < 2) {
    errors.name = 'Имя должно содержать минимум 2 символа';
  } else if (!PATTERNS.NAME.test(data.name)) {
    errors.name = 'Имя должно содержать только буквы';
  }

  if (!data.phone || data.phone.trim() === '') {
    errors.phone = 'Телефон обязателен для заполнения';
  } else {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (!PATTERNS.PHONE.test(cleanPhone)) {
      errors.phone = 'Введите корректный номер телефона';
    }
  }

  return errors;
};

// Валидация формы продукта
export const productValidation = (data) => {
  const errors = {};

  if (!data.productType || data.productType.trim() === '') {
    errors.productType = 'Тип товара обязателен';
  }

  if (!data.product || data.product.trim() === '') {
    errors.product = 'Товар обязателен';
  }

  return errors;
};

// Валидатор форм
export const createValidator = (rules) => {
  return (field, value, allValues = {}) => {
    if (rules[field]) {
      for (const rule of rules[field]) {
        const error = rule(value, allValues);
        if (error) return error;
      }
    }
    return null;
  };
};

// Схемы валидации для разных форм

// Схема для регистрации работника
export const WORKER_REGISTRATION_SCHEMA = {
  organizationName: [
    (value) => validation.required(value, 'Название организации'),
    (value) => validation.organizationName(value)
  ],
  phone: [
    (value) => validation.required(value, 'Телефон'),
    (value) => validation.phone(value)
  ],
  email: [
    (value) => validation.required(value, 'Email'),
    (value) => validation.email(value)
  ],
  password: [
    (value) => validation.required(value, 'Пароль'),
    (value) => validation.password(value)
  ],
  confirmPassword: [
    (value, _, allValues) => validation.confirmPassword(allValues.password, value, 'Пароль')
  ]
};

// Схема для входа
export const LOGIN_SCHEMA = {
  phone: [
    (value) => validation.required(value, 'Телефон'),
    (value) => validation.phone(value)
  ],
  password: [
    (value) => validation.required(value, 'Пароль')
  ]
};

// Схема для создания заявки
export const APPLICATION_SCHEMA = {
  clientName: [
    (value) => validation.required(value, 'Имя клиента'),
    (value) => validation.name(value, 'Имя клиента')
  ],
  phone: [
    (value) => validation.required(value, 'Телефон'),
    (value) => validation.phone(value)
  ],
  productType: [
    (value) => validation.required(value, 'Тип товара')
  ],
  product: [
    (value) => validation.required(value, 'Товар')
  ],
  clientComment: [
    (value) => validation.comment(value, 'Комментарий')
  ]
};

// Схема для контактной формы
export const CONTACT_SCHEMA = {
  name: [
    (value) => validation.required(value, 'Имя'),
    (value) => validation.name(value, 'Имя')
  ],
  phone: [
    (value) => validation.required(value, 'Телефон'),
    (value) => validation.phone(value)
  ]
};

// Схема для ответа работника
export const WORKER_RESPONSE_SCHEMA = {
  response: [
    (value) => validation.required(value, 'Ответ'),
    (value) => validation.minLength(value, 10, 'Ответ'),
    (value) => validation.maxLength(value, 1000, 'Ответ')
  ]
};

// Вспомогательные функции
export const validateForm = (values, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const value = values[field];
    const fieldErrors = [];
    
    schema[field].forEach(rule => {
      const error = rule(value, values);
      if (error) {
        fieldErrors.push(error);
      }
    });
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors[0]; // Берем первую ошибку
    }
  });
  
  return errors;
};

export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Функция для форматирования телефона
export const formatPhone = (value) => {
  if (!value) return '+7';
  
  // Удаляем все нецифровые символы, кроме плюса
  const cleanValue = value.replace(/[^\d+]/g, '');
  
  // Если значение пустое или только +7, возвращаем +7
  if (cleanValue === '+7' || cleanValue === '7' || cleanValue === '8' || cleanValue.length <= 1) {
    return '+7';
  }
  
  // Убираем код страны если он есть
  let numbers = cleanValue;
  if (numbers.startsWith('+7')) {
    numbers = numbers.substring(2);
  } else if (numbers.startsWith('7') || numbers.startsWith('8')) {
    numbers = numbers.substring(1);
  }
  
  // Форматируем оставшуюся часть
  let result = '+7';
  
  if (numbers.length > 0) {
    result += ` (${numbers.substring(0, 3)}`;
  }
  
  if (numbers.length > 3) {
    result += `) ${numbers.substring(3, 6)}`;
  }
  
  if (numbers.length > 6) {
    result += `-${numbers.substring(6, 8)}`;
  }
  
  if (numbers.length > 8) {
    result += `-${numbers.substring(8, 10)}`;
  }
  
  return result;
};

// Функция для очистки телефона
export const cleanPhone = (value) => {
  if (!value) return '';
  
  // Если значение равно "+7", возвращаем пустую строку или "7" в зависимости от требований бэкенда
  if (value === '+7') return '';
  
  const numbers = value.replace(/\D/g, '');
  
  // Обрабатываем случай, когда номер начинается с 7 или 8
  if (numbers.startsWith('7') || numbers.startsWith('8')) {
    return numbers;
  }
  
  return numbers;
};

// Валидация файлов
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB по умолчанию
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles = 1
  } = options;

  const errors = [];

  if (file.size > maxSize) {
    errors.push(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`Недопустимый тип файла. Разрешены: ${allowedTypes.join(', ')}`);
  }

  return errors;
};

// Хелпер для отображения ошибок
export const getFieldError = (errors, touched, fieldName) => {
  return touched[fieldName] ? errors[fieldName] : null;
};

// Проверка, есть ли ошибки в форме
export const isFormValid = (errors, touched, requiredFields = []) => {
  const hasValidationErrors = Object.keys(errors).some(field => errors[field]);
  const allRequiredTouched = requiredFields.every(field => touched[field]);
  
  return !hasValidationErrors && allRequiredTouched;
};

// Экспорт по умолчанию для удобства
export default {
  PATTERNS,
  validation,
  contactValidation,
  productValidation,
  createValidator,
  validateForm,
  hasErrors,
  getFieldError,
  isFormValid,
  formatPhone,
  cleanPhone,
  validateFile,
  SCHEMAS: {
    WORKER_REGISTRATION: WORKER_REGISTRATION_SCHEMA,
    LOGIN: LOGIN_SCHEMA,
    APPLICATION: APPLICATION_SCHEMA,
    CONTACT: CONTACT_SCHEMA,
    WORKER_RESPONSE: WORKER_RESPONSE_SCHEMA
  }
};