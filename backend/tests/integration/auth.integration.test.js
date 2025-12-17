import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.js';
import { initDatabase, db } from '../../database/init.js';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // Очистка таблиц перед каждым тестом
    await db.run('DELETE FROM worker_requests');
    await db.run('DELETE FROM users WHERE phone != "admin"');
    
    // Создаем тестового пользователя
    const hashedPassword = await bcrypt.hash('password123', 12);
    await db.run(
      `INSERT INTO users (phone, password, name, email, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['+79998887766', hashedPassword, 'Тестовый пользователь', 'test@example.com', 'user']
    );
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        phone: '+79998887766',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.phone).toBe(loginData.phone);
      expect(response.body.user.name).toBe('Тестовый пользователь');
      expect(response.body.user.role).toBe('user');
      // Пароль не должен возвращаться
      expect(response.body.user.password).toBeUndefined();
    });

    it('should login admin user', async () => {
      const loginData = {
        phone: 'admin',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.phone).toBe('admin');
      expect(response.body.user.role).toBe('admin');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        phone: '+79998887766',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Неверный телефон или пароль');
    });

    it('should reject login with non-existent phone', async () => {
      const loginData = {
        phone: '+79990000000',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Неверный телефон или пароль');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка валидации данных');
    });

    it('should validate phone format', async () => {
      const loginData = {
        phone: 'invalid-phone',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register-worker', () => {
    it('should register worker request successfully', async () => {
      const registrationData = {
        organization: 'ООО "Тестовая компания"',
        phone: '+79995554433',
        email: 'company@test.com',
        password: 'securepassword123'
      };

      const response = await request(app)
        .post('/api/auth/register-worker')
        .send(registrationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Заявка на регистрацию успешно отправлена');
      expect(response.body.requestId).toBeDefined();

      // Проверяем, что запрос создан в базе
      const request = await db.get(
        'SELECT * FROM worker_requests WHERE phone = ?',
        [registrationData.phone]
      );
      expect(request).toBeDefined();
      expect(request.organization).toBe(registrationData.organization);
      expect(request.email).toBe(registrationData.email);
      expect(request.status).toBe('pending');

      // Пароль должен быть захэширован
      const isPasswordHashed = await bcrypt.compare(registrationData.password, request.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('should reject duplicate phone in users', async () => {
      const registrationData = {
        organization: 'ООО "Дубликат"',
        phone: '+79998887766', // Уже существует в users
        email: 'duplicate@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register-worker')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Этот номер телефона уже зарегистрирован');
    });

    it('should reject duplicate pending requests', async () => {
      const registrationData = {
        organization: 'ООО "Первая заявка"',
        phone: '+79993332211',
        email: 'first@test.com',
        password: 'password123'
      };

      // Первая заявка
      await request(app)
        .post('/api/auth/register-worker')
        .send(registrationData)
        .expect(200);

      // Вторая заявка с тем же телефоном
      const response = await request(app)
        .post('/api/auth/register-worker')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Заявка на этот номер телефона уже находится на рассмотрении');
    });

    it('should validate registration data', async () => {
      const invalidData = {
        organization: 'О', // Слишком короткое название
        phone: 'invalid',
        email: 'invalid-email',
        password: '123' // Слишком короткий пароль
      };

      const response = await request(app)
        .post('/api/auth/register-worker')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка валидации данных');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        organization: 'ООО "Тест"',
        phone: '+79991112233',
        email: 'test@test.com',
        password: '12345' // Только цифры
      };

      const response = await request(app)
        .post('/api/auth/register-worker')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Логинимся чтобы получить токен
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+79998887766',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.phone).toBe('+79998887766');
      expect(response.body.user.name).toBe('Тестовый пользователь');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Токен доступа не предоставлен');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+79998887766',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'Обновленное имя',
        email: 'updated@example.com',
        organization: 'Новая организация'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.email).toBe(updateData.email);
      expect(response.body.user.organization).toBe(updateData.organization);
      expect(response.body.message).toBe('Профиль успешно обновлен');

      // Проверяем обновление в базе
      const user = await db.get(
        'SELECT * FROM users WHERE phone = ?',
        ['+79998887766']
      );
      expect(user.name).toBe(updateData.name);
      expect(user.email).toBe(updateData.email);
    });

    it('should validate profile data', async () => {
      const invalidData = {
        name: 'А', // Слишком короткое имя
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Тест' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+79998887766',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newsecurepassword456'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Пароль успешно изменен');

      // Проверяем, что можно войти с новым паролем
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+79998887766',
          password: passwordData.newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject wrong current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Текущий пароль неверен');
    });

    it('should validate new password strength', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: '123' // Слишком короткий
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token expiration and security', () => {
    it('should reject expired tokens', async () => {
      // Создаем просроченный токен (1 секунда жизни)
      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 1, role: 'user', phone: '+79998887766' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1s' }
      );

      // Ждем истечения токена
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject tampered tokens', async () => {
      const jwt = await import('jsonweptoken');
      const validToken = jwt.sign(
        { userId: 1, role: 'user', phone: '+79998887766' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // Подделываем токен
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        phone: '+79998887766',
        password: 'wrongpassword'
      };

      // Делаем несколько неудачных попыток входа
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        if (i < 5) {
          expect(response.status).toBe(401); // Первые 5 попыток - 401
        } else {
          expect(response.status).toBe(429); // 6-я попытка - лимит превышен
          expect(response.body.error).toContain('Слишком много попыток входа');
        }
      }
    });

    it('should rate limit registration attempts', async () => {
      const registrationData = {
        organization: 'ООО "Тест"',
        phone: '+7999000000',
        email: 'test@test.com',
        password: 'password123'
      };

      // Делаем несколько попыток регистрации
      for (let i = 0; i < 4; i++) {
        registrationData.phone = `+799900000${i}`; // Разные телефоны
        const response = await request(app)
          .post('/api/auth/register-worker')
          .send(registrationData);

        if (i < 3) {
          expect(response.status).toBe(200); // Первые 3 попытки успешны
        } else {
          expect(response.status).toBe(429); // 4-я попытка - лимит превышен
        }
      }
    });
  });
});