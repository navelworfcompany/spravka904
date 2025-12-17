import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

/**
 * Middleware для валидации входящих данных
 */

// Обработчик результатов валидации
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    console.log('❌ VALIDATION ERRORS DETAILS:');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🚫 Validation errors:', JSON.stringify(errorMessages, null, 2));
    
    // Логируем каждый параметр отдельно
    errorMessages.forEach(error => {
      console.log(`🔍 ${error.field}:`, {
        value: error.value,
        type: typeof error.value,
        message: error.message
      });
    });

    return next(new AppError('Ошибка валидации данных', 400, {
      details: errorMessages
    }));
  }
  
  next();
};

// Валидация для аутентификации
export const validateLogin = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Телефон обязателен')
    .isMobilePhone('any')
    .withMessage('Неверный формат телефона'),

  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 1 })
    .withMessage('Пароль не может быть пустым'),

  handleValidationErrors
];

// Валидация для регистрации работника
export const validateWorkerRegistration = [
  body('organization')
    .trim()
    .notEmpty()
    .withMessage('Название организации обязательно')
    .isLength({ min: 2, max: 100 })
    .withMessage('Название организации должно быть от 2 до 100 символов'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Телефон обязателен')
    .isMobilePhone('any')
    .withMessage('Неверный формат телефона'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать буквы и цифры'),

  handleValidationErrors
];

// Валидация для запроса звонка
export const validateCallMe = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Имя обязательно')
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Телефон обязателен')
    .isMobilePhone('any')
    .withMessage('Неверный формат телефона'),

  handleValidationErrors
];

// Валидация для создания заявки
export const validatePublicApplicationCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Имя обязательно')
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Телефон обязателен')
    .isMobilePhone('any')
    .withMessage('Неверный формат телефона'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),

  body('product_type')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Тип продукта не должен превышать 100 символов'),

  body('product')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Продукт не должен превышать 100 символов'),

  body('material')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Материал не должен превышать 100 символов'),

  body('size')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Размер не должен превышать 50 символов'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Комментарий не должен превышать 500 символов'),

  body('product_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID типа продукта должен быть положительным числом'),

  body('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID продукта должен быть положительным числом'),

  handleValidationErrors
];

export const validateApplicationCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Имя обязательно')
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Телефон обязателен')
    .isMobilePhone('any')
    .withMessage('Неверный формат телефона'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),

  body('productType')
    .trim()
    .notEmpty()
    .withMessage('Тип товара обязателен'),

  body('product')
    .trim()
    .notEmpty()
    .withMessage('Товар обязателен'),

  body('material')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Материал не должен превышать 100 символов'),

  body('size')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Размер не должен превышать 50 символов'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Комментарий не должен превышать 500 символов'),

  handleValidationErrors
];

// Валидация для ответа работника
export const validateWorkerResponse = [
  body('response')
    .trim()
    .notEmpty()
    .withMessage('Ответ не может быть пустым')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Ответ должен быть от 10 до 1000 символов'),

  handleValidationErrors
];

// Валидация для создания/обновления типа товара
export const validateProductType = [

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Название типа обязательно')
    .isLength({ min: 2, max: 50 })
    .withMessage('Название типа должно быть от 2 до 50 символов'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Описание не должно превышать 200 символов'),

  handleValidationErrors
];

// Валидация для создания/обновления товара
export const validateProduct = [
  // ПРОСТАЯ валидация без кастомных сантитайзеров
  body('type_id')
    .isInt({ min: 1 })
    .withMessage('ID типа товара должен быть положительным числом'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Название товара обязательно')
    .isLength({ min: 2, max: 100 })
    .withMessage('Название товара должно быть от 2 до 100 символов'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),

  body('materials')
    .optional(),

  body('sizes')
    .optional(),

  // ДОБАВЬТЕ middleware для преобразования ДО валидации
  (req, res, next) => {
    console.log('🔍 Before validation - raw body:', req.body);
    
    // Преобразуем поля вручную
    if (req.body.type_id) {
      req.body.type_id = parseInt(req.body.type_id);
    }
    
    if (req.body.price && req.body.price !== '') {
      req.body.price = parseFloat(req.body.price);
    }
    
    // Парсим JSON поля
    if (req.body.materials && typeof req.body.materials === 'string') {
      try {
        req.body.materials = JSON.parse(req.body.materials);
      } catch (error) {
        req.body.materials = [];
      }
    }
    
    if (req.body.sizes && typeof req.body.sizes === 'string') {
      try {
        req.body.sizes = JSON.parse(req.body.sizes);
      } catch (error) {
        req.body.sizes = [];
      }
    }
    
    console.log('🔍 After manual parsing:', req.body);
    next();
  },

  handleValidationErrors
];

// Валидация для обновления товара (с поддержкой FormData)
export const validateProductUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID товара должен быть положительным числом'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название товара должно быть от 2 до 100 символов'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов'),

  body('price')
    .optional()
    .custom((value, { req }) => {
      if (!value || value === '') return true; // Разрешаем пустое значение
      
      // Для FormData price приходит как строка
      const priceValue = parseFloat(value);
      if (isNaN(priceValue) || priceValue < 0) {
        throw new Error('Цена должна быть положительным числом');
      }
      return true;
    })
    .customSanitizer(value => {
      // Преобразуем в число для дальнейшей обработки
      return value ? parseFloat(value) : null;
    }),

  body('materials')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Разрешаем пустое значение
      
      try {
        // Для FormData materials приходит как JSON строка
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(parsed)) {
          throw new Error('Материалы должны быть массивом');
        }
        return true;
      } catch (error) {
        throw new Error('Неверный формат материалов');
      }
    })
    .customSanitizer(value => {
      // Преобразуем в массив для дальнейшей обработки
      if (!value || value === '') return [];
      return typeof value === 'string' ? JSON.parse(value) : value;
    }),

  body('sizes')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Разрешаем пустое значение
      
      try {
        // Для FormData sizes приходит как JSON строка
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(parsed)) {
          throw new Error('Размеры должны быть массивом');
        }
        return true;
      } catch (error) {
        throw new Error('Неверный формат размеров');
      }
    })
    .customSanitizer(value => {
      // Преобразуем в массив для дальнейшей обработки
      if (!value || value === '') return [];
      return typeof value === 'string' ? JSON.parse(value) : value;
    }),

  // Добавьте детальное логирование
  (req, res, next) => {
    console.log('🔍 ValidateProductUpdate - FormData processing:');
    console.log('📦 Raw body:', req.body);
    console.log('📁 File:', req.file ? `Exists: ${req.file.filename}` : 'No file');
    console.log('🆔 Product ID:', req.params.id);
    
    next();
  },

  handleValidationErrors
];

// Валидация для создания/обновления пользователя
export const validateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Имя обязательно')
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Телефон обязателен')
    .custom((value) => {
      const cleanPhone = value.replace(/\D/g, '');
      return cleanPhone.length === 11;
    })
    .withMessage('Неверный формат телефона. Должно быть 11 цифр'),

  body('email')
    .optional({ checkFalsy: true }) // Разрешаем пустые строки и null
    .trim()
    .if(value => value && value !== '') // Проверяем только если значение не пустое
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),

  body('role')
    .isIn(['admin', 'operator', 'worker', 'user'])
    .withMessage('Неверная роль пользователя'),

  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать буквы и цифры'),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Название организации не должно превышать 100 символов'),

  // Добавьте логирование перед обработкой ошибок
  (req, res, next) => {
  console.log('🔍 ValidateUser - checking data:', {
    body: req.body,
    phone: req.body.phone,
    phoneCleaned: req.body.phone?.replace(/\D/g, ''),
    phoneLength: req.body.phone?.replace(/\D/g, '').length
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
  }
  
  next();
},

  handleValidationErrors
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),
  
  body('phone')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Разрешаем пустое значение
      const cleanPhone = value.replace(/\D/g, '');
      return cleanPhone.length === 11;
    })
    .withMessage('Неверный формат телефона. Должно быть 11 цифр'),
  
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .if(value => value && value !== '')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'operator', 'worker', 'user'])
    .withMessage('Неверная роль пользователя'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Название организации не должно превышать 100 символов'),
  
  // Логирование для отладки
  (req, res, next) => {
    console.log('🔍 ValidateUserUpdate - checking data:', req.body);
    next();
  },
  
  handleValidationErrors
];

// Валидация ID параметров
export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным числом')
    .toInt(),

  handleValidationErrors
];

export const validateTypeIdParam = [
  param('type_id')
    .isInt({ min: 1 })
    .withMessage('Type ID должен быть положительным числом')
    .toInt(),

  // Добавьте отладочное логирование
  (req, res, next) => {
    console.log('🔍 validateTypeIdParam - params:', req.params);
    console.log('🔍 validateTypeIdParam - type_id:', req.params.type_id);
    next();
  },

  handleValidationErrors
];

// Валидация query параметров для пагинации
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Страница должна быть положительным числом')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть от 1 до 100')
    .toInt(),

  // ДОБАВЬТЕ ЛОГИРОВАНИЕ
  (req, res, next) => {
    console.log('🔍 validatePagination - ORIGINAL query:', req.query);
    console.log('🔍 validatePagination - AFTER validation query:', req.query);
    next();
  },

  handleValidationErrors
];

// Валидация для обновления профиля
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),

  body('email')
    .optional({ checkFalsy: true }) // Разрешаем пустые строки и null
    .trim()
    .if(value => value && value !== '') // Проверяем только если значение не пустое
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Название организации не должно превышать 100 символов'),

  handleValidationErrors
];

// Валидация для смены пароля
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),

  body('newPassword')
    .notEmpty()
    .withMessage('Новый пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Новый пароль должен содержать минимум 6 символов')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Новый пароль должен содержать буквы и цифры'),

  handleValidationErrors
];

// Санитизация входящих данных
export const sanitizeInput = [
  body('*').trim().escape(),
  query('*').trim().escape(),
  param('*').trim().escape()
];

// Валидация для создания отзыва
export const validateReview = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Текст отзыва обязателен')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Отзыв должен содержать от 10 до 1000 символов'),

  handleValidationErrors
];

// Валидация для обновления статуса отзыва
export const validateReviewStatus = [
  body('status')
    .isIn(['pending', 'checked', 'rejected'])
    .withMessage('Неверный статус отзыва'),

  handleValidationErrors
];

export const validateProductIdParam = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('ID товара должен быть положительным числом')
    .toInt(),

  // Добавьте отладочное логирование
  (req, res, next) => {
    console.log('🔍 validateProductIdParam - params:', req.params);
    console.log('🔍 validateProductIdParam - productId:', req.params.productId);
    next();
  },

  handleValidationErrors
];
