import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDatabase, db } from './database/init.js';
import contactRoutes from './routes/contact.js';
import productsRouter from './routes/products.js';
import usersRouter from './routes/users.js';
import workerRoutes from './routes/worker.js';
import statsRouter from './routes/stats.js';
import applicationsRouter from './routes/applications.js';
import authRoutes from './routes/auth.js';
import workerRequestsRouter from './routes/workerRequests.js';
import path from 'path';
import { fileURLToPath } from 'url';
import reviewsRouter from './routes/reviews.js';
import operatorUsersRouter from './routes/operatorUsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Обработка необработанных исключений
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

console.log('🔧 Loading environment variables...');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Not found');
console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS || 'Not found');

// Инициализация базы данных
console.log('🔄 Initializing database...');
initDatabase().then(() => {
  console.log('✅ Database initialized successfully');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

// CORS
app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (curl, postman, серверные запросы)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      // Production URLs
      'https://spravka940.ru',
      'http://spravka940.ru',
      'https://www.spravka940.ru',
      'http://www.spravka940.ru',
      // IP адрес сервера
      'http://155.212.216.198',
      'https://155.212.216.198',
      // Переменная окружения
      process.env.FRONTEND_URL
    ].filter(Boolean);

    console.log('CORS check:', {
      origin,
      allowedOrigins,
      isAllowed: allowedOrigins.includes(origin)
    });

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.options('*', cors());

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔥 ВАЖНО: ВСЕ МАРШРУТЫ ДОЛЖНЫ БЫТЬ ЗДЕСЬ, ДО 404 HANDLER

// Обслуживание статических файлов из папки img
app.use('/img', express.static(path.join(__dirname, 'img')));

// Маршруты
app.use('/api/contact', contactRoutes);
app.use('/api/products', productsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRouter);
app.use('/api/operator/users', operatorUsersRouter);
app.use('/api/worker', workerRoutes);
app.use('/api/stats', statsRouter);
app.use('/api/worker-requests', workerRequestsRouter);
app.use('/api/reviews', reviewsRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Для better-sqlite3 используем prepare().get()
    const stmt = db.prepare("SELECT 1 as test");
    const result = stmt.get();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      test: result
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// CORS test
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Email config check - 🔥 ДОБАВЛЕНО
app.get('/api/email-config', (req, res) => {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ Missing',
    SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Missing',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ Set' : '❌ Missing',
    ADMIN_EMAILS: process.env.ADMIN_EMAILS ? `✅ ${process.env.ADMIN_EMAILS}` : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  res.json(config);
});

app.get('/api/smtp-test', async (req, res) => {
  try {
    const { EmailService } = await import('./services/emailService.js');
    
    console.log('🧪 SMTP Diagnostic Test');
    console.log('=== SMTP CONFIGURATION ===');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length + ' chars' : 'Missing');
    
    // Тестируем подключение
    console.log('=== CONNECTION TEST ===');
    const isConnected = await EmailService.verifyConnection();
    
    if (isConnected) {
      // Тестируем отправку
      console.log('=== SEND TEST ===');
      const testEmail = process.env.SMTP_USER;
      await EmailService.sendContactFormNotification(
        testEmail,
        'SMTP Test Email',
        '<h1>Test</h1><p>This is a test email</p>'
      );
      
      res.json({
        success: true,
        message: 'SMTP test passed! Email sent successfully.',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'SMTP connection failed',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER
        }
      });
    }
    
  } catch (error) {
    console.error('SMTP test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Email test - 🔥 ДОБАВЛЕНО
app.get('/api/email-test', async (req, res) => {
  try {
    console.log('🧪 Testing email service...');
    
    const { EmailService } = await import('./services/emailService.js');
    
    const isConnected = await EmailService.verifyConnection();
    console.log('Email connection:', isConnected);
    
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        error: 'Email connection failed'
      });
    }
    
    const testEmail = process.env.SMTP_USER || 'test@example.com';
    console.log('Sending test email to:', testEmail);
    
    await EmailService.sendEmail(
      testEmail,
      'Test Email from Contact System',
      '<h1>Test Email</h1><p>This is a test email from your contact system.</p>'
    );
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      to: testEmail
    });
    
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check your SMTP configuration'
    });
  }
});

// Contact test endpoint
app.get('/api/contact/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Contact routes are working!' 
  });
});

// Test application
app.post('/api/test-application', async (req, res) => {
  try {
    const { name, phone, product_type, product } = req.body;
    
    const result = await db.run(
      `INSERT INTO applications (name, phone, product_type, product) 
       VALUES (?, ?, ?, ?)`,
      [name || 'Test User', phone || '+79991234567', product_type || 'Test Type', product || 'Test Product']
    );

    res.json({
      success: true,
      message: 'Test application created',
      id: result.lastID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Routes list - ФИНАЛЬНАЯ ВЕРСИЯ
app.get('/api/routes', (req, res) => {
  res.json({
    available_routes: [
      'GET  /api/health',
      'GET  /api/cors-test',
      'GET  /api/email-config',
      'GET  /api/email-test',
      'GET  /api/smtp-test',
      'GET  /api/routes',
      'GET  /api/contact/test',
      'GET  /api/contact/callback-test',  // 🔥 НОВЫЙ
      'GET  /api/contact/product-test',   // 🔥 НОВЫЙ
      'POST /api/contact/callback',       // 🔥 НОВЫЙ
      'POST /api/contact/product',        // 🔥 НОВЫЙ
      'POST /api/test-application'
    ]
  });
});

app.use('*', (req, res, next) => {
  console.log('🔍 BEFORE 404 - Checking request:', {
    method: req.method,
    url: req.originalUrl,
    path: req.path
  });
  next();
});

// 🔥 ВАЖНО: 404 handler ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy blocked the request'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Email config: http://localhost:${PORT}/api/email-config`);
  console.log(`🔗 Email test: http://localhost:${PORT}/api/email-test`);
  console.log(`🔗 Routes: http://localhost:${PORT}/api/routes`);
});

export default app;