import express from 'express';
import bcrypt from 'bcrypt';
import { body } from 'express-validator';
import { EmailService } from '../services/emailService.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Функция генерации 6-значного цифрового пароля
const generatePassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Генерирует число от 100000 до 999999
};

const sanitizePhone = (req, res, next) => {
  if (req.body.phone) {
    // Удаляем все нецифровые символы кроме +
    req.body.phone = req.body.phone.replace(/[^\d+]/g, '');
    console.log('📞 Sanitized phone:', req.body.phone);
  }
  next();
};

// Функция для создания пользователя в базе данных
const createUserInDatabase = async (phone, password, email, name) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO users (phone, password, email, name, role, created_at) 
       VALUES (?, ?, ?, ?, 'user', datetime('now'))`,
      [phone, hashedPassword, email, name]
    );
    return { success: true, userId: result.lastID };
  } catch (error) {
    console.error('Error creating user:', error);
    // Если пользователь уже существует, просто возвращаем успех
    if (error.message.includes('UNIQUE constraint failed')) {
      return { success: true, existingUser: true };
    }
    return { success: false, error: error.message };
  }
};

// Валидация для формы обратного звонка (только имя и телефон)
const validateContactForm = [
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
    .withMessage('Неверный формат телефона')
];

// Валидация для формы заявки на товар (имя, телефон, email)
const validateProductApplicationForm = [
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
];

// Роут для обратного звонка (только имя и телефон)
router.post('/callback', sanitizePhone, validateContactForm, handleValidationErrors, async (req, res) => {
  console.log('📞 Callback form submission received:', req.body);

  try {
    const { name, phone } = req.body;

    // Получаем email администраторов
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
      [process.env.SMTP_USER];

    console.log('📧 Admin emails:', adminEmails);

    if (!adminEmails.length || !adminEmails[0]) {
      console.log('❌ No admin emails configured');
      return res.status(500).json({
        success: false,
        message: 'Не настроены email для уведомлений'
      });
    }

    // Проверяем подключение email
    console.log('🔗 Verifying email connection...');
    const isEmailConnected = await EmailService.verifyConnection();
    console.log('📧 Email connection status:', isEmailConnected);

    if (!isEmailConnected) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка подключения к email серверу'
      });
    }

    // Отправляем уведомление о обратном звонке
    console.log('🚀 Sending callback email...');
    await EmailService.sendContactFormNotification({
      name,
      phone
    }, adminEmails);

    console.log('✅ Callback email sent successfully');

    res.status(200).json({
      success: true,
      message: 'Заявка на обратный звонок успешно отправлена! Мы свяжемся с вами в ближайшее время.'
    });

  } catch (error) {
    console.error('💥 Error in callback route:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Внутренняя ошибка сервера';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Ошибка аутентификации email';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Ошибка подключения к email серверу';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = 'Неверные учетные данные email';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Роут для заявки на товар (имя, телефон, email + данные товара)
router.post('/product', validateProductApplicationForm, handleValidationErrors, async (req, res) => {
  console.log('🪦 Product application submission received:', req.body);

  try {
    const { name, phone, email, applicationData } = req.body;

    // Генерируем пароль для пользователя
    const password = generatePassword();
    console.log(`🔐 Generated password for ${phone}: ${password}`);

    // Создаем пользователя в базе данных
    const userCreationResult = await createUserInDatabase(phone, password, email, name);
    
    if (!userCreationResult.success) {
      console.error('❌ Failed to create user:', userCreationResult.error);
      // Продолжаем обработку заявки даже если не удалось создать пользователя
    }

    // Получаем email администраторов
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
      [process.env.SMTP_USER];

    console.log('📧 Admin emails:', adminEmails);

    if (!adminEmails.length || !adminEmails[0]) {
      console.log('❌ No admin emails configured');
      return res.status(500).json({
        success: false,
        message: 'Не настроены email для уведомлений'
      });
    }

    // Проверяем подключение email
    console.log('🔗 Verifying email connection...');
    const isEmailConnected = await EmailService.verifyConnection();
    console.log('📧 Email connection status:', isEmailConnected);

    if (!isEmailConnected) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка подключения к email серверу'
      });
    }

    // Отправляем уведомление о заявке на товар администраторам
    console.log('🚀 Sending product application email to admins...');
    await EmailService.sendProductApplicationNotification({
      name,
      phone,
      email,
      applicationData
    }, adminEmails);

    // Отправляем подтверждение клиенту с логином и паролем
    if (email) {
      console.log('🚀 Sending confirmation email to client with login details...');
      await EmailService.sendApplicationConfirmationToClient(
        email, 
        {
          name,
          phone,
          email,
          applicationData
        },
        password,
        userCreationResult.existingUser // Передаем информацию о том, существовал ли пользователь ранее
      );
    } else {
      console.log('⚠️ No client email provided, skipping confirmation');
    }

    console.log('✅ All emails sent successfully');

    res.status(200).json({
      success: true,
      message: 'Заявка на памятник успешно отправлена! Мы свяжемся с вами в ближайшее время.'
    });

  } catch (error) {
    console.error('💥 Error in product application route:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Внутренняя ошибка сервера';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Ошибка аутентификации email';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Ошибка подключения к email серверу';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = 'Неверные учетные данные email';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/callback-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Callback route is working!',
    endpoint: 'POST /api/contact/callback'
  });
});

router.get('/product-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Product route is working!',
    endpoint: 'POST /api/contact/product'
  });
});

// Обновите существующий тестовый endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Contact API is working!',
    endpoints: [
      'GET  /api/contact/test',
      'GET  /api/contact/callback-test',
      'GET  /api/contact/product-test',
      'POST /api/contact/callback',
      'POST /api/contact/product'
    ]
  });
});

export default router;