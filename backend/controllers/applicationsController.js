import { EmailService } from '../services/emailService.js';
import { db } from '../database/init.js';
import bcrypt from 'bcrypt';
import { ApplicationService } from '../services/applicationService.js';
import { Application } from '../models/Application.js';
import { AppError } from '../middleware/errorHandler.js';

// Функция для генерации 6-значного цифрового пароля
function generateSixDigitPassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Функция для получения email администраторов
async function getAdminEmails() {
  try {
    console.log('🔍 Поиск email администраторов...');

    // Сначала проверяем переменную окружения ADMIN_EMAIL
    const adminEmailFromEnv = process.env.ADMIN_EMAIL;
    console.log('📋 ADMIN_EMAIL из .env:', adminEmailFromEnv);

    if (adminEmailFromEnv && adminEmailFromEnv.trim() !== '') {
      console.log(`✅ Используем email из .env: ${adminEmailFromEnv}`);
      return [adminEmailFromEnv.trim()];
    }

    console.log('🔍 ADMIN_EMAIL не указан, ищем администраторов в БД...');

    // Если нет переменной окружения, ищем администраторов в БД
    const stmt = db.prepare(`
      SELECT email FROM users 
      WHERE role = 'admin' AND status = 'active' AND email IS NOT NULL AND email != ''
    `);

    const admins = stmt.all();
    console.log('📋 Найдены записи в БД:', admins);

    const adminEmails = admins
      .map(admin => admin.email)
      .filter(email => email && email.trim() !== '' && email !== 'admin@system.com');

    console.log('📋 Отфильтрованные email администраторов:', adminEmails);

    if (adminEmails.length === 0) {
      console.log('⚠️ Администраторы не найдены в БД и ADMIN_EMAIL не указан');
      return [];
    }

    console.log(`✅ Найдены администраторы: ${adminEmails.join(', ')}`);
    return adminEmails;
  } catch (error) {
    console.error('❌ Ошибка получения email администраторов:', error);
    return [];
  }
}

// Функция для создания пользователя
async function createUserFromApplication(name, phone, email, password) {
  try {
    console.log('👤 Создаем пользователя из данных заявки...');
    console.log('📱 Телефон:', phone);
    console.log('📧 Email:', email);
    console.log('🔑 Полученный пароль для сохранения:', password);

    // Проверяем, существует ли уже пользователь с таким телефоном
    const existingUserStmt = db.prepare('SELECT id FROM users WHERE phone = ?');
    const existingUser = existingUserStmt.get(phone);

    if (existingUser) {
      console.log('ℹ️ Пользователь с таким телефоном уже существует, ID:', existingUser.id);
      return { userId: existingUser.id, isNewUser: false, password: null };
    }

    console.log('🔑 Хешируем пароль перед сохранением в БД...');
    // Хешируем переданный пароль (для безопасности)
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('🔑 Пароль захэширован');

    // Создаем нового пользователя
    const insertStmt = db.prepare(`
      INSERT INTO users (phone, password, name, email, role, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      phone,
      hashedPassword,
      name,
      email,
      'user', // роль по умолчанию
      'active' // статус по умолчанию
    );

    console.log('✅ Пользователь создан, ID:', result.lastInsertRowid);
    console.log('🔑 Исходный пароль (для письма):', password);
    console.log('🔑 В БД сохранен хеш пароля');

    return {
      userId: result.lastInsertRowid,
      isNewUser: true,
      password: password // возвращаем исходный пароль для письма
    };

  } catch (error) {
    console.error('❌ Ошибка создания пользователя:', error);
    throw error;
  }
}

// Функция для обновления заявки с user_id
async function updateApplicationWithUserId(applicationId, userId) {
  try {
    const stmt = db.prepare('UPDATE applications SET user_id = ? WHERE id = ?');
    const result = stmt.run(userId, applicationId);

    if (result.changes > 0) {
      console.log('✅ Заявка обновлена с user_id:', userId);
    } else {
      console.log('⚠️ Не удалось обновить заявку с user_id');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления заявки:', error);
  }
};

function normalizePhone(phone) {
  if (!phone) return '';

  // Удаляем все нецифровые символы
  const digitsOnly = phone.replace(/\D/g, '');

  // Если номер начинается с 7 или 8, оставляем 11 цифр
  if (digitsOnly.startsWith('7') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith('8') && digitsOnly.length === 11) {
    return '7' + digitsOnly.slice(1);
  }
  // Если номер начинается с +7, убираем + и оставляем 11 цифр
  if (phone.includes('+7') && digitsOnly.length === 11) {
    return digitsOnly;
  }

  console.log('📞 Original phone:', phone);
  console.log('📞 Normalized phone:', digitsOnly);

  return digitsOnly;
}

export const applicationsController = {
  // Создание публичной заявки
  createPublicApplication: async (req, res) => {
    let tempPassword = null;
    let userId = null;

    try {
      console.log('🎯 ЗАПРОС ПОПАЛ В createPublicApplication!');

      const {
        name,
        phone,
        email,
        product_type = 'Не указан',
        product = 'Не указан',
        material = 'Не указан',
        size = 'Не указан',
        comment = '',
        product_type_id = null,
        product_id = null
      } = req.body;

      // Валидация
      if (!name || !phone || !email) {
        return res.status(400).json({
          success: false,
          error: 'Обязательные поля: имя, телефон и email'
        });
      }

      console.log('🔄 Начинаем процесс создания заявки и пользователя...');

      // 1. Генерируем пароль ОДИН раз
      tempPassword = generateSixDigitPassword();
      console.log('🔑 Основной пароль для всего процесса:', tempPassword);

      // 2. Создаем пользователя с этим паролем
      const userResult = await createUserFromApplication(name, phone, email, tempPassword);
      userId = userResult.userId;

      // 3. Создаем заявку (УБРАЛИ id из полей вставки)
      const stmt = db.prepare(`
      INSERT INTO applications 
      (name, phone, email, product_type, product, material, size, comment, 
       product_type_id, product_id, status, source, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const result = stmt.run(
        name,  // ПЕРВОЕ поле - name, а не id
        phone,
        email,
        product_type,
        product,
        material,
        size,
        comment,
        product_type_id,
        product_id,
        'new',
        'public_form',
        userId
      );

      const applicationId = result.lastInsertRowid; // ПОЛУЧАЕМ ID ЗАЯВКИ
      console.log('✅ Заявка создана, ID:', applicationId);

      // Получаем созданную заявку
      const getStmt = db.prepare(`SELECT * FROM applications WHERE id = ?`);
      const newApplication = getStmt.get(applicationId);

      res.status(201).json({
        success: true,
        application: newApplication,
        message: 'Заявка успешно создана'
      });

      console.log('📧 Запускаем отправку email уведомлений...');

      // 🔥 ВЫЗОВ EMAIL SERVICE - ОТПРАВКА ПИСЕМ
      try {
        // 1. Получаем email администраторов
        const adminEmails = await getAdminEmails();

        console.log('📧 Получены email для отправки администраторам:', adminEmails);

        if (adminEmails && adminEmails.length > 0) {
          // 2. Подготавливаем данные для email (ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ ID)
          const applicationData = {
            name,
            phone,
            email,
            applicationData: {
              id: applicationId, // ИСПОЛЬЗУЕМ ID ЗАЯВКИ
              productType: product_type,
              product: product,
              material: material,
              size: size,
              comment: comment,
              price: null,
              timestamp: new Date().toISOString()
            }
          };

          console.log('📤 Отправляем уведомление администраторам на:', adminEmails);
          // 3. Отправляем уведомление администраторам
          await EmailService.sendProductApplicationNotification(applicationData, adminEmails);
          console.log('✅ Email администраторам отправлен');
        } else {
          console.log('⚠️ Email администраторам не отправлен - нет valid email адресов');
        }

        console.log('📤 Отправляем подтверждение клиенту...');
        console.log('🔑 Пароль для письма клиенту:', tempPassword);

        // 4. Отправляем подтверждение клиенту (ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ ID)
        const emailResult = await EmailService.sendApplicationConfirmationToClient(
          email,
          {
            name,
            phone,
            email,
            applicationData: {
              id: applicationId, // ИСПОЛЬЗУЕМ ID ЗАЯВКИ
              productType: product_type,
              product: product,
              material: material,
              size: size,
              comment: comment,
              price: null,
              timestamp: new Date().toISOString()
            }
          },
          tempPassword,
          !userResult.isNewUser
        );

        if (emailResult) {
          console.log('✅ Email клиенту отправлен успешно');
          console.log('📧 Message ID:', emailResult.messageId);
        } else {
          console.log('⚠️ Email клиенту не отправлен (возвращен null)');
        }

        console.log('🎉 Все процессы завершены успешно!');

      } catch (emailError) {
        console.error('❌ Ошибка отправки email:', emailError);
        console.error('❌ Stack trace:', emailError.stack);
      }

    } catch (error) {
      console.error('❌ ОШИБКА в createPublicApplication:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера: ' + error.message
      });
    }
  },

  // Получение заявок пользователя
  getMyApplications: async (req, res) => {
    try {
      console.log('🔐 Получение заявок текущего пользователя...');

      if (!req.user) {
        console.log('❌ Нет пользователя в запросе');
        return res.status(401).json({
          success: false,
          error: 'Требуется авторизация'
        });
      }

      console.log('👤 Текущий пользователь:', {
        id: req.user.id,
        phone: req.user.phone,
        role: req.user.role
      });

      // 🔥 НОРМАЛИЗУЕМ НОМЕР ТЕЛЕФОНА
      const normalizedPhone = normalizePhone(req.user.phone);
      console.log('📞 Normalized phone for search:', normalizedPhone);

      // Получаем заявки с нормализованным номером
      const applicationsStmt = db.prepare(`
        SELECT 
          a.*,
          COUNT(wr.id) as response_count
        FROM applications a
        LEFT JOIN worker_responses wr ON a.id = wr.application_id
        WHERE a.phone = ?
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `);

      const applications = applicationsStmt.all(normalizedPhone);

      console.log(`✅ Найдено заявок: ${applications.length} для номера ${normalizedPhone}`);

      // Если не нашли по нормализованному номеру, пробуем найти по оригинальному
      let finalApplications = applications;
      if (applications.length === 0 && req.user.phone !== normalizedPhone) {
        console.log('🔍 Пробуем поиск по оригинальному номеру:', req.user.phone);

        const altApplicationsStmt = db.prepare(`
          SELECT 
            a.*,
            COUNT(wr.id) as response_count
          FROM applications a
          LEFT JOIN worker_responses wr ON a.id = wr.application_id
          WHERE a.phone = ?
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `);

        const altApplications = altApplicationsStmt.all(req.user.phone);
        console.log(`🔍 Найдено заявок по оригинальному номеру: ${altApplications.length}`);
        finalApplications = altApplications;
      }

      // Получаем ответы работников для каждой заявки
      const applicationsWithResponses = finalApplications.map(app => {
        const responsesStmt = db.prepare(`
          SELECT wr.*, u.name as worker_name, u.organization
          FROM worker_responses wr
          LEFT JOIN users u ON wr.worker_id = u.id
          WHERE wr.application_id = ?
          ORDER BY wr.created_at ASC
        `);

        const responses = responsesStmt.all(app.id);

        return {
          ...app,
          responses: responses
        };
      });

      res.json({
        success: true,
        data: {
          applications: applicationsWithResponses
        }
      });

    } catch (error) {
      console.error('❌ Get my applications error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении заявок: ' + error.message
      });
    }
  },

  // Получение всех заявок (для админа/оператора)
  getAllApplications: async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '';
      let params = [];

      if (status && status !== 'all') {
        whereClause = 'WHERE a.status = ?';
        params.push(status);
      }

      // Получаем заявки
      const applicationsStmt = db.prepare(`
        SELECT 
          a.*,
          COUNT(wr.id) as response_count
        FROM applications a
        LEFT JOIN worker_responses wr ON a.id = wr.application_id
        ${whereClause}
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `);

      const applications = applicationsStmt.all(...params, limit, offset);

      // Получаем общее количество
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total FROM applications a
        ${whereClause}
      `);

      const totalResult = countStmt.get(...params);
      const total = totalResult.total;

      res.json({
        success: true,
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении заявок'
      });
    }
  },

  // Получение заявки по ID
  getApplicationById: async (req, res) => {
    try {
      const { id } = req.params;

      const applicationStmt = db.prepare('SELECT * FROM applications WHERE id = ?');
      const application = applicationStmt.get(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      // Получаем ответы работников
      const responsesStmt = db.prepare(`
        SELECT wr.*, u.name as worker_name, u.organization
        FROM worker_responses wr
        LEFT JOIN users u ON wr.worker_id = u.id
        WHERE wr.application_id = ?
        ORDER BY wr.created_at ASC
      `);

      const responses = responsesStmt.all(id);

      res.json({
        success: true,
        application: {
          ...application,
          responses
        }
      });

    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении заявки'
      });
    }
  },

  // Создание новой заявки (для авторизованных пользователей)
  createApplication: async (req, res) => {
    try {
      const {
        name,
        phone,
        productType,
        product,
        material,
        size,
        comment
      } = req.body;

      const result = await db.run(
        `INSERT INTO applications 
         (name, phone, product_type, product, material, size, comment) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, phone, productType, product, material, size, comment]
      );

      const newApplication = await db.get(
        `SELECT * FROM applications WHERE id = ?`,
        [result.lastID]
      );

      res.status(201).json({
        success: true,
        application: newApplication,
        message: 'Заявка успешно создана'
      });

    } catch (error) {
      console.error('Create application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании заявки'
      });
    }
  },

  // Обновление заявки
  updateApplication: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('🔄 Updating application:', { id, updateData });

      // Находим заявку (получаем ЭКЗЕМПЛЯР Application)
      const application = await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Заявка не найдена'
        });
      }

      // Если обновляется статус, валидируем его
      if (updateData.status) {
        const validStatuses = ['new', 'pending', 'in_progress', 'assigned', 'completed', 'cancelled', 'for_delete'];
        if (!validStatuses.includes(updateData.status)) {
          return res.status(400).json({
            success: false,
            message: `Неверный статус. Допустимые значения: ${validStatuses.join(', ')}`
          });
        }
      }

      // 🔥 ИСПРАВЛЕНИЕ: вызываем метод ЭКЗЕМПЛЯРА, а не статический метод
      const updatedApplication = await application.update(updateData);

      console.log('✅ Application updated successfully:', updatedApplication);

      res.json({
        success: true,
        application: updatedApplication.toJSON(), // используем toJSON() для правильного формата
        message: 'Заявка успешно обновлена'
      });

    } catch (error) {
      console.error('❌ Error updating application:', error);
      next(new AppError('Ошибка при обновлении заявки', 500));
    }
  },

  // Добавление ответа работника
  addWorkerResponse: async (req, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const workerId = req.userId;

      // Проверяем существование заявки
      const application = await db.get(
        `SELECT * FROM applications WHERE id = ?`,
        [id]
      );

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      // Добавляем ответ
      await db.run(
        `INSERT INTO worker_responses (application_id, worker_id, response) 
         VALUES (?, ?, ?)`,
        [id, workerId, response]
      );

      // Обновляем статус заявки на "в работе"
      if (application.status === 'new') {
        await db.run(
          `UPDATE applications SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [id]
        );
      }

      res.json({
        success: true,
        message: 'Ответ успешно добавлен'
      });

    } catch (error) {
      console.error('Add worker response error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при добавлении ответа'
      });
    }
  },

  // Пометка заявки на удаление
  markForDeletion: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.run(
        `UPDATE applications SET marked_for_deletion = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id]
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      res.json({
        success: true,
        message: 'Заявка помечена на удаление'
      });

    } catch (error) {
      console.error('Mark for deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при пометке заявки на удаление'
      });
    }
  },

  deleteApplication: async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`🗑️ Delete request for application #${id}`);

      // Проверяем существование заявки
      const applicationStmt = db.prepare('SELECT * FROM applications WHERE id = ?');
      const application = applicationStmt.get(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      // Удаляем ответы работников
      const deleteResponsesStmt = db.prepare('DELETE FROM worker_responses WHERE application_id = ?');
      deleteResponsesStmt.run(id);

      // Удаляем заявку
      const deleteAppStmt = db.prepare('DELETE FROM applications WHERE id = ?');
      const result = deleteAppStmt.run(id);

      if (result.changes === 0) {
        return res.status(500).json({
          success: false,
          error: 'Не удалось удалить заявку'
        });
      }

      // ВАЖНО: Возвращаем правильный JSON
      return res.json({
        success: true,
        message: 'Заявка успешно удалена',
        deletedId: parseInt(id)
      });

    } catch (error) {
      console.error('❌ Delete application error:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при удалении заявки'
      });
    }
  },

  async getWorkerApplications(req, res) {
    try {
      const workerId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      console.log('📥 Получение заявок для работника через applications:', {
        workerId,
        status,
        page,
        limit
      });

      // Используем ту же логику, что и в workerController
      const portfolioStmt = db.prepare(`
      SELECT product_id FROM worker_portfolio WHERE worker_id = ?
    `);
      const portfolio = portfolioStmt.all(workerId);
      const productIds = portfolio.map(item => item.product_id);

      let whereClause = '';
      let params = [];

      if (productIds.length === 0) {
        return res.json({
          success: true,
          data: {
            applications: [],
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit)
          }
        });
      }

      whereClause = 'WHERE a.product_id IN (' + productIds.map(() => '?').join(',') + ')';
      params = [...productIds];

      if (status && status !== 'all') {
        whereClause += ' AND a.status = ?';
        params.push(status);
      }

      const offset = (page - 1) * limit;

      const applicationsStmt = db.prepare(`
      SELECT 
        a.*,
        p.name as product_name,
        pt.name as product_type_name
      FROM applications a
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `);

      const applications = applicationsStmt.all(...params, limit, offset);

      const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM applications a
      ${whereClause}
    `);

      const totalResult = countStmt.get(...params);
      const total = totalResult.total;

      res.json({
        success: true,
        data: {
          applications: applications,
          total: total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('❌ Get worker applications error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении заявок работника'
      });
    }
  },

  // Ответить на заявку (альтернативный маршрут)
// Ответить на заявку (альтернативный маршрут)
// Ответить на заявку (альтернативный маршрут)
workerRespondToApplication: async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { id } = req.params;
    const { response, price, deadline } = req.body;

    console.log('📝 Ответ работника на заявку:', {
      workerId,
      applicationId: id,
      response,
      price,
      deadline
    });

    // Валидация
    if (!response) {
      return res.status(400).json({
        success: false,
        error: 'Текст ответа обязателен'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Укажите корректную цену'
      });
    }

    if (!deadline) {
      return res.status(400).json({
        success: false,
        error: 'Укажите срок выполнения'
      });
    }

    // Проверяем существование заявки
    const applicationStmt = db.prepare('SELECT * FROM applications WHERE id = ?');
    const application = applicationStmt.get(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Заявка не найдена'
      });
    }

    const portfolioStmt = db.prepare(`
      SELECT * FROM worker_portfolio 
      WHERE worker_id = ? AND product_id = ?
    `);
    const inPortfolio = portfolioStmt.get(workerId, application.product_id);

    if (!inPortfolio) {
      return res.status(403).json({
        success: false,
        error: 'Доступ к заявке запрещен'
      });
    }

    // Проверяем, не ответил ли уже работник на эту заявку
    const existingResponseStmt = db.prepare(`
      SELECT id FROM worker_responses 
      WHERE application_id = ? AND worker_id = ?
    `);
    const existingResponse = existingResponseStmt.get(id, workerId);

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        error: 'Вы уже отправили ответ на эту заявку'
      });
    }

    // 🔥 ИСПРАВЛЕНИЕ: Получаем информацию о работнике (только существующие колонки)
    const workerInfoStmt = db.prepare(`
      SELECT name, organization, phone, email 
      FROM users 
      WHERE id = ?
    `);
    const workerInfo = workerInfoStmt.get(workerId);

    console.log('👷 Информация о работнике:', workerInfo);

    // 🔥 СОЗДАЕМ ОТВЕТ В ТАБЛИЦЕ worker_responses
    const insertResponseStmt = db.prepare(`
      INSERT INTO worker_responses 
      (application_id, worker_id, response, price, deadline) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const responseResult = insertResponseStmt.run(
      id,
      workerId,
      response,
      parseFloat(price),
      deadline
    );

    console.log('✅ Ответ работника сохранен в БД');

    // 🔥 ОБНОВЛЯЕМ СТАТУС ЗАЯВКИ (только статус, без привязки работника)
    const updateApplicationStmt = db.prepare(`
      UPDATE applications 
      SET 
        status = 'pending', 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'new'
    `);

    updateApplicationStmt.run(id);

    console.log('✅ Статус заявки обновлен');

    // 🔥 ПОЛУЧАЕМ ОБНОВЛЕННУЮ ИНФОРМАЦИЮ О ЗАЯВКЕ
    const updatedApplicationStmt = db.prepare(`
      SELECT 
        a.*,
        p.name as product_name,
        pt.name as product_type_name
      FROM applications a
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN product_types pt ON p.type_id = pt.id
      WHERE a.id = ?
    `);

    const updatedApplication = updatedApplicationStmt.get(id);

    console.log('✅ Данные для ответа получены');

    // 🔥 ОТПРАВЛЯЕМ EMAIL УВЕДОМЛЕНИЕ КЛИЕНТУ
    if (application.email) {
      try {
        console.log('📧 Отправляем email уведомление клиенту:', application.email);
        
        // 🔥 ИСПРАВЛЕНИЕ: Передаем workerInfo без поля experience
        await EmailService.sendApplicationResponseToClient(
          application.email,
          {
            id: application.id,
            product_name: application.product_name || application.product,
            product: application.product,
            product_type_name: application.product_type_name,
            material: application.material,
            size: application.size
          },
          {
            response: response,
            price: parseFloat(price),
            deadline: deadline
          },
          workerInfo || { organization: 'Неизвестная организация' }
        );
        
        console.log('✅ Email уведомление отправлено клиенту');
      } catch (emailError) {
        console.warn('⚠️ Не удалось отправить email уведомление:', emailError);
        // Не прерываем основной поток из-за ошибки email
      }
    } else {
      console.log('ℹ️ У заявки нет email для отправки уведомления');
    }

    // 🔥 ОТПРАВЛЯЕМ ОТВЕТ КЛИЕНТУ
    res.json({
      success: true,
      message: 'Ответ отправлен успешно',
      data: {
        application: updatedApplication,
        workerResponse: {
          id: responseResult.lastInsertRowid,
          response,
          price: parseFloat(price),
          deadline
        }
      }
    });

    console.log('✅ Ответ отправлен клиенту');

  } catch (error) {
    console.error('❌ Ошибка ответа работника на заявку:', error);
    console.error('❌ Детали ошибки:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    next(new AppError('Ошибка при отправке ответа', 500));
  }
},

  selectWorkerForApplication: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { workerResponseId } = req.body;

      console.log('👑 Выбор исполнителя для заявки:', {
        applicationId: id,
        workerResponseId
      });

      // Проверяем существование заявки
      const applicationStmt = db.prepare('SELECT * FROM applications WHERE id = ?');
      const application = applicationStmt.get(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      // Проверяем существование ответа работника
      const responseStmt = db.prepare(`
      SELECT wr.*, u.name as worker_name, u.phone as worker_phone
      FROM worker_responses wr
      LEFT JOIN users u ON wr.worker_id = u.id
      WHERE wr.id = ? AND wr.application_id = ?
    `);
      const workerResponse = responseStmt.get(workerResponseId, id);

      if (!workerResponse) {
        return res.status(404).json({
          success: false,
          error: 'Ответ работника не найден'
        });
      }

      // 🔥 ПРИВЯЗЫВАЕМ РАБОТНИКА К ЗАЯВКЕ
      const updateApplicationStmt = db.prepare(`
      UPDATE applications 
      SET 
        worker_id = ?, 
        status = 'assigned',
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

      const updateResult = updateApplicationStmt.run(workerResponse.worker_id, id);

      if (updateResult.changes === 0) {
        return res.status(500).json({
          success: false,
          error: 'Не удалось привязать исполнителя к заявке'
        });
      }

      console.log('✅ Исполнитель привязан к заявке');

      // 🔥 ОБНОВЛЯЕМ СТАТУС ВСЕХ ОТВЕТОВ
      const updateResponsesStmt = db.prepare(`
      UPDATE worker_responses 
      SET status = CASE 
        WHEN id = ? THEN 'accepted' 
        ELSE 'rejected' 
      END
      WHERE application_id = ?
    `);

      updateResponsesStmt.run(workerResponseId, id);

      console.log('✅ Статусы ответов обновлены');

      // 🔥 ПОЛУЧАЕМ ОБНОВЛЕННУЮ ЗАЯВКУ
      const finalApplicationStmt = db.prepare(`
      SELECT 
        a.*,
        p.name as product_name,
        pt.name as product_type_name,
        u.name as worker_name,
        u.phone as worker_phone,
        wr.response as selected_response,
        wr.price as selected_price,
        wr.deadline as selected_deadline
      FROM applications a
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN product_types pt ON p.type_id = pt.id
      LEFT JOIN users u ON a.worker_id = u.id
      LEFT JOIN worker_responses wr ON wr.id = ?
      WHERE a.id = ?
    `);

      const finalApplication = finalApplicationStmt.get(workerResponseId, id);

      res.json({
        success: true,
        message: 'Исполнитель выбран успешно',
        data: {
          application: finalApplication
        }
      });

    } catch (error) {
      console.error('❌ Ошибка выбора исполнителя:', error);
      next(new AppError('Ошибка при выборе исполнителя', 500));
    }
  },

  // Получить ответы работника на заявку
  getWorkerResponses: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🔄 Получение ответов работников для заявки:', id);
      console.log('🔍 Параметры запроса:', req.params);
      console.log('👤 Пользователь (если есть):', req.user);

      // 1. Проверяем существование заявки
      console.log('🔍 Проверяем заявку в БД...');
      const applicationStmt = db.prepare('SELECT id, name FROM applications WHERE id = ?');
      const application = applicationStmt.get(parseInt(id));

      console.log('📋 Результат проверки заявки:', application);

      if (!application) {
        console.log('❌ Заявка не найдена');
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }

      console.log('✅ Заявка найдена:', application);

      // 2. Получаем ответы работников
      console.log('🔍 Получаем ответы из БД...');
      const stmt = db.prepare(`
      SELECT 
        wr.*,
        u.name as worker_name,
        u.organization,
        u.phone as worker_phone
      FROM worker_responses wr
      LEFT JOIN users u ON wr.worker_id = u.id
      WHERE wr.application_id = ?
      ORDER BY wr.created_at ASC
    `);

      const responses = stmt.all(parseInt(id));
      console.log(`✅ Найдено ${responses.length} ответов`);

      // 3. Форматируем ответ
      const formattedResponses = responses.map(response => ({
        id: response.id,
        worker_name: response.worker_name || 'Неизвестный работник',
        organization: response.organization || 'Не указано',
        response: response.response,
        price: response.price,
        deadline: response.deadline,
        created_at: response.created_at,
        worker_id: response.worker_id
      }));

      console.log('🎯 Отправляем успешный ответ');
      res.json({
        success: true,
        data: {
          responses: formattedResponses,
          application_id: parseInt(id),
          total: responses.length
        }
      });

    } catch (error) {
      console.error('❌ Ошибка получения ответов работника:', error);
      console.error('❌ Stack trace:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера: ' + error.message
      });
    }
  }
};