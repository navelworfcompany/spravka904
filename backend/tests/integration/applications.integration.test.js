import request from 'supertest';
import express from 'express';
import applicationsRoutes from '../../routes/applications.js';
import { authenticateToken } from '../../middleware/auth.js';
import { initDatabase, db } from '../../database/init.js';

// Mock аутентификации
jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'admin', phone: '+79991234567' };
    req.userId = 1;
    next();
  }),
  requireActiveUser: jest.fn((req, res, next) => next()),
  canManageApplications: jest.fn((req, res, next) => next()),
  logUserAction: jest.fn(() => (req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use('/api/applications', applicationsRoutes);

describe('Applications API Integration Tests', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // Очистка таблиц перед каждым тестом
    await db.run('DELETE FROM worker_responses');
    await db.run('DELETE FROM applications');
    
    // Сброс моков
    jest.clearAllMocks();
  });

  describe('POST /api/applications', () => {
    it('should create a new application', async () => {
      const applicationData = {
        name: 'Тестовый пользователь',
        phone: '+79998887766',
        product_type: 'Мебель',
        product: 'Стул',
        material: 'Дерево',
        size: 'Большой',
        comment: 'Тестовый комментарий'
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.application.name).toBe(applicationData.name);
      expect(response.body.application.phone).toBe(applicationData.phone);
      expect(response.body.application.product_type).toBe(applicationData.product_type);
      expect(response.body.message).toBe('Заявка успешно создана');

      // Проверяем, что заявка действительно создана в базе
      const applications = await db.all('SELECT * FROM applications WHERE phone = ?', [applicationData.phone]);
      expect(applications).toHaveLength(1);
      expect(applications[0].name).toBe(applicationData.name);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Только имя' // Отсутствуют обязательные поля
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка валидации данных');
    });
  });

  describe('GET /api/applications', () => {
    beforeEach(async () => {
      // Создаем тестовые заявки
      await db.run(
        `INSERT INTO applications (name, phone, product_type, product, status) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Пользователь 1', '+79991112233', 'Мебель', 'Стул', 'new']
      );
      await db.run(
        `INSERT INTO applications (name, phone, product_type, product, status) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Пользователь 2', '+79994445566', 'Электроника', 'Телефон', 'in_progress']
      );
    });

    it('should return all applications', async () => {
      const response = await request(app)
        .get('/api/applications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.applications).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter applications by status', async () => {
      const response = await request(app)
        .get('/api/applications?status=new')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].status).toBe('new');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/applications?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/applications/user/:phone', () => {
    beforeEach(async () => {
      await db.run(
        `INSERT INTO applications (name, phone, product_type, product) 
         VALUES (?, ?, ?, ?)`,
        ['Тестовый пользователь', '+79998887766', 'Мебель', 'Стул']
      );
    });

    it('should return user applications', async () => {
      const response = await request(app)
        .get('/api/applications/user/+79998887766')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].phone).toBe('+79998887766');
    });

    it('should return empty array for non-existent user', async () => {
      const response = await request(app)
        .get('/api/applications/user/+79990000000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.applications).toHaveLength(0);
    });
  });

  describe('POST /api/applications/:id/responses', () => {
    let applicationId;

    beforeEach(async () => {
      // Создаем тестовую заявку
      const result = await db.run(
        `INSERT INTO applications (name, phone, product_type, product) 
         VALUES (?, ?, ?, ?)`,
        ['Тестовый пользователь', '+79998887766', 'Мебель', 'Стул']
      );
      applicationId = result.lastID;
    });

    it('should add worker response to application', async () => {
      const responseData = {
        response: 'Мы можем выполнить ваш заказ в течение 3 рабочих дней'
      };

      const response = await request(app)
        .post(`/api/applications/${applicationId}/responses`)
        .send(responseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ответ успешно добавлен');

      // Проверяем, что ответ действительно добавлен
      const responses = await db.all(
        'SELECT * FROM worker_responses WHERE application_id = ?',
        [applicationId]
      );
      expect(responses).toHaveLength(1);
      expect(responses[0].response).toBe(responseData.response);
    });

    it('should update application status to in_progress', async () => {
      const responseData = {
        response: 'Тестовый ответ'
      };

      await request(app)
        .post(`/api/applications/${applicationId}/responses`)
        .send(responseData)
        .expect(200);

      // Проверяем, что статус обновлен
      const application = await db.get(
        'SELECT * FROM applications WHERE id = ?',
        [applicationId]
      );
      expect(application.status).toBe('in_progress');
    });
  });

  describe('PATCH /api/applications/:id/mark-deletion', () => {
    let applicationId;

    beforeEach(async () => {
      const result = await db.run(
        `INSERT INTO applications (name, phone, product_type, product) 
         VALUES (?, ?, ?, ?)`,
        ['Тестовый пользователь', '+79998887766', 'Мебель', 'Стул']
      );
      applicationId = result.lastID;
    });

    it('should mark application for deletion', async () => {
      const response = await request(app)
        .patch(`/api/applications/${applicationId}/mark-deletion`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Заявка помечена на удаление');

      // Проверяем, что заявка помечена на удаление
      const application = await db.get(
        'SELECT * FROM applications WHERE id = ?',
        [applicationId]
      );
      expect(application.marked_for_deletion).toBe(1);
    });

    it('should return 404 for non-existent application', async () => {
      const response = await request(app)
        .patch('/api/applications/999/mark-deletion')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});