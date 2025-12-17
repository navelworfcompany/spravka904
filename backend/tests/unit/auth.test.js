import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.js';
import { initDatabase, db } from '../database/init.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => {
  await initDatabase();
});

describe('Auth API', () => {
  test('POST /api/auth/login - should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: 'admin',
        password: 'admin123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('phone', 'admin');
  });

  test('POST /api/auth/login - should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: 'admin',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});