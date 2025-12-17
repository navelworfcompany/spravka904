// utils/validationSchemas.js
import * as yup from 'yup';

// Упрощенная валидация телефона (только цифры)
const phoneRegex = /^7\d{10}$/; // 79991234567

// Схема для логина
export const loginSchema = yup.object({
  phone: yup
    .string()
    .required('Телефон обязателен')
    .transform(value => value.replace(/\D/g, '')) // Удаляем все нецифровые символы
    .matches(phoneRegex, 'Неверный формат телефона. Пример: +7 (999) 123-45-67'),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  role: yup
    .string()
    .oneOf(['user', 'worker', 'operator', 'admin'], 'Неверная роль')
    .default('user')
});

// Схема для регистрации работника
export const workerRegistrationSchema = yup.object({
  phone: yup
    .string()
    .required('Телефон обязателен')
    .transform(value => value.replace(/\D/g, ''))
    .matches(phoneRegex, 'Неверный формат телефона. Пример: +7 (999) 123-45-67'),
  name: yup
    .string()
    .required('Имя обязательно')
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя должно содержать максимум 50 символов'),
  email: yup
    .string()
    .email('Неверный формат email')
    .optional()
    .nullable(),
  experience: yup
    .string()
    .optional()
    .nullable(),
  skills: yup
    .string()
    .optional()
    .nullable()
});

// Схема для обновления профиля
export const profileUpdateSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя должно содержать максимум 50 символов')
    .optional()
    .nullable(),
  email: yup
    .string()
    .email('Неверный формат email')
    .optional()
    .nullable()
});

// Схема для смены пароля
export const passwordChangeSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Текущий пароль обязателен'),
  newPassword: yup
    .string()
    .required('Новый пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .notOneOf([yup.ref('currentPassword')], 'Новый пароль должен отличаться от текущего')
});

// Вспомогательные функции для простой валидации (если нужно)
export const validatePhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return phoneRegex.test(cleanPhone);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, min) => {
  return value && value.toString().length >= min;
};

// Простые валидаторы (альтернатива yup)
export const simpleValidators = {
  login: (data) => {
    const errors = {};
    
    if (!validateRequired(data.phone)) {
      errors.phone = 'Телефон обязателен';
    } else if (!validatePhone(data.phone)) {
      errors.phone = 'Неверный формат телефона';
    }
    
    if (!validateRequired(data.password)) {
      errors.password = 'Пароль обязателен';
    } else if (!validateMinLength(data.password, 6)) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  workerRegistration: (data) => {
    const errors = {};
    
    if (!validateRequired(data.name)) {
      errors.name = 'Имя обязательно';
    } else if (!validateMinLength(data.name, 2)) {
      errors.name = 'Имя должно содержать минимум 2 символа';
    }
    
    if (!validateRequired(data.phone)) {
      errors.phone = 'Телефон обязателен';
    } else if (!validatePhone(data.phone)) {
      errors.phone = 'Неверный формат телефона';
    }
    
    if (data.email && !validateEmail(data.email)) {
      errors.email = 'Неверный формат email';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default {
  loginSchema,
  workerRegistrationSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  simpleValidators
};