/**
 * Глобальный обработчик ошибок
 */

// Кастомный класс для ошибок приложения
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Обработчик для async функций
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Основной обработчик ошибок
export const errorHandler = (err, req, res, next) => {
  // Установка стандартных значений
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'Внутренняя ошибка сервера';

  // Логирование ошибки
  logError(err, req);

  // Ответ в development режиме
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } 
  // Ответ в production режиме
  else {
    sendErrorProd(err, res);
  }
};

// Логирование ошибок
const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      isOperational: err.isOperational
    }
  };

  console.error('Error occurred:', JSON.stringify(logEntry, null, 2));

  // Здесь можно добавить отправку в сервис мониторинга (Sentry, LogRocket и т.д.)
  // sendToMonitoringService(logEntry);
};

// Отправка ошибки в development режиме
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      status: err.status,
      statusCode: err.statusCode
    }
  });
};

// Отправка ошибки в production режиме
const sendErrorProd = (err, res) => {
  // Операционные ошибки - отправляем клиенту
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        status: err.status,
        statusCode: err.statusCode
      }
    });
  } 
  // Программные ошибки - не раскрываем детали
  else {
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      error: {
        message: 'Что-то пошло не так!',
        status: 'error',
        statusCode: 500
      }
    });
  }
};

// Обработчик для несуществующих маршрутов
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Не найден маршрут: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

// Обработчик для необработанных rejection'ов
export const unhandledRejectionHandler = (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Здесь можно добавить логику graceful shutdown
  // server.close(() => {
  //   process.exit(1);
  // });
};

// Обработчик для необработанных исключений
export const uncaughtExceptionHandler = (error) => {
  console.error('Uncaught Exception:', error);
  
  // Всегда выходим из процесса при необработанных исключениях
  process.exit(1);
};

// Обработчик ошибок валидации
export const validationErrorHandler = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return new AppError(`Ошибка валидации: ${messages.join(', ')}`, 400);
  }
  return error;
};

// Обработчик ошибок базы данных
export const databaseErrorHandler = (error) => {
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      return new AppError('Запись с такими данными уже существует', 400);
    }
    if (error.message.includes('FOREIGN KEY')) {
      return new AppError('Нарушение целостности данных', 400);
    }
  }
  
  if (error.code === 'SQLITE_ERROR') {
    return new AppError('Ошибка базы данных', 500);
  }
  
  return error;
};

// Обработчик JWT ошибок
export const jwtErrorHandler = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Неверный токен', 401);
  }
  if (error.name === 'TokenExpiredError') {
    return new AppError('Токен истек', 401);
  }
  return error;
};