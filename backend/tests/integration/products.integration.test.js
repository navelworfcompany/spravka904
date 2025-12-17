import request from 'supertest';
import express from 'express';
import productsRoutes from '../../routes/products.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { initDatabase, db } from '../../database/init.js';

// Mock аутентификации для admin доступа
jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'admin', phone: '+79991234567' };
    req.userId = 1;
    next();
  }),
  requireActiveUser: jest.fn((req, res, next) => next()),
  requireAdmin: jest.fn((req, res, next) => next()),
  logUserAction: jest.fn(() => (req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use('/api/products', productsRoutes);

describe('Products API Integration Tests', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // Очистка таблиц перед каждым тестом
    await db.run('DELETE FROM products');
    await db.run('DELETE FROM product_types WHERE name != "Мебель" AND name != "Электроника"');
  });

  describe('Public endpoints', () => {
    // Временно отключаем auth для публичных endpoints
    beforeEach(() => {
      authenticateToken.mockImplementation((req, res, next) => next());
      requireAdmin.mockImplementation((req, res, next) => next());
    });

    describe('GET /api/products/types', () => {
      it('should return all product types', async () => {
        const response = await request(app)
          .get('/api/products/types')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.types).toBeInstanceOf(Array);
        // Должны быть типы по умолчанию из initDatabase
        expect(response.body.types.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/products/type/:typeId', () => {
      let typeId;

      beforeEach(async () => {
        // Создаем тестовый тип товара
        const result = await db.run(
          'INSERT INTO product_types (name, description) VALUES (?, ?)',
          ['Тестовый тип', 'Описание тестового типа']
        );
        typeId = result.lastID;

        // Создаем тестовые товары
        await db.run(
          `INSERT INTO products (type_id, name, description, price) 
           VALUES (?, ?, ?, ?)`,
          [typeId, 'Тестовый товар 1', 'Описание 1', 1000]
        );
        await db.run(
          `INSERT INTO products (type_id, name, description, price) 
           VALUES (?, ?, ?, ?)`,
          [typeId, 'Тестовый товар 2', 'Описание 2', 2000]
        );
      });

      it('should return products by type', async () => {
        const response = await request(app)
          .get(`/api/products/type/${typeId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.type.id).toBe(typeId);
        expect(response.body.products).toHaveLength(2);
        expect(response.body.products[0].name).toBe('Тестовый товар 1');
        expect(response.body.products[1].name).toBe('Тестовый товар 2');
      });

      it('should return empty array for type without products', async () => {
        // Создаем пустой тип
        const result = await db.run(
          'INSERT INTO product_types (name) VALUES (?)',
          ['Пустой тип']
        );
        const emptyTypeId = result.lastID;

        const response = await request(app)
          .get(`/api/products/type/${emptyTypeId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.products).toHaveLength(0);
      });

      it('should return 404 for non-existent type', async () => {
        const response = await request(app)
          .get('/api/products/type/999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Тип товара не найден');
      });
    });
  });

  describe('Admin endpoints', () => {
    describe('POST /api/products/types', () => {
      it('should create product type', async () => {
        const typeData = {
          name: 'Новый тип товаров',
          description: 'Описание нового типа'
        };

        const response = await request(app)
          .post('/api/products/types')
          .send(typeData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.type.name).toBe(typeData.name);
        expect(response.body.type.description).toBe(typeData.description);
        expect(response.body.message).toBe('Тип товара успешно создан');

        // Проверяем создание в базе
        const types = await db.all(
          'SELECT * FROM product_types WHERE name = ?',
          [typeData.name]
        );
        expect(types).toHaveLength(1);
      });

      it('should validate product type data', async () => {
        const invalidData = {
          name: 'А', // Слишком короткое название
          description: 'Описание'
        };

        const response = await request(app)
          .post('/api/products/types')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/products/types/:id', () => {
      let typeId;

      beforeEach(async () => {
        const result = await db.run(
          'INSERT INTO product_types (name, description) VALUES (?, ?)',
          ['Старое название', 'Старое описание']
        );
        typeId = result.lastID;
      });

      it('should update product type', async () => {
        const updateData = {
          name: 'Обновленное название',
          description: 'Обновленное описание'
        };

        const response = await request(app)
          .put(`/api/products/types/${typeId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.type.name).toBe(updateData.name);
        expect(response.body.type.description).toBe(updateData.description);
        expect(response.body.message).toBe('Тип товара успешно обновлен');

        // Проверяем обновление в базе
        const type = await db.get(
          'SELECT * FROM product_types WHERE id = ?',
          [typeId]
        );
        expect(type.name).toBe(updateData.name);
      });

      it('should return 404 for non-existent type', async () => {
        const response = await request(app)
          .put('/api/products/types/999')
          .send({ name: 'Новое название' })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/products/types/:id', () => {
      let typeId;

      beforeEach(async () => {
        const result = await db.run(
          'INSERT INTO product_types (name) VALUES (?)',
          ['Тип для удаления']
        );
        typeId = result.lastID;
      });

      it('should delete product type', async () => {
        const response = await request(app)
          .delete(`/api/products/types/${typeId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Тип товара успешно удален');

        // Проверяем удаление из базы
        const type = await db.get(
          'SELECT * FROM product_types WHERE id = ?',
          [typeId]
        );
        expect(type).toBeUndefined();
      });

      it('should prevent deletion of type with products', async () => {
        // Создаем тип с товаром
        const result = await db.run(
          'INSERT INTO product_types (name) VALUES (?)',
          ['Тип с товарами']
        );
        const typeWithProductsId = result.lastID;

        await db.run(
          'INSERT INTO products (type_id, name) VALUES (?, ?)',
          [typeWithProductsId, 'Товар']
        );

        const response = await request(app)
          .delete(`/api/products/types/${typeWithProductsId}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('невозможно удалить');
      });
    });

    describe('POST /api/products', () => {
      let typeId;

      beforeEach(async () => {
        const result = await db.run(
          'INSERT INTO product_types (name) VALUES (?)',
          ['Тип для товаров']
        );
        typeId = result.lastID;
      });

      it('should create product', async () => {
        const productData = {
          type_id: typeId,
          name: 'Новый товар',
          description: 'Описание товара',
          price: 1500.50,
          materials: ['Дерево', 'Металл'],
          sizes: ['Большой', 'Средний']
        };

        const response = await request(app)
          .post('/api/products')
          .send(productData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.product.name).toBe(productData.name);
        expect(response.body.product.description).toBe(productData.description);
        expect(response.body.product.price).toBe(productData.price);
        expect(response.body.message).toBe('Товар успешно создан');

        // Проверяем создание в базе
        const products = await db.all(
          'SELECT * FROM products WHERE name = ?',
          [productData.name]
        );
        expect(products).toHaveLength(1);
      });

      it('should validate product data', async () => {
        const invalidData = {
          type_id: typeId,
          name: 'Т', // Слишком короткое название
          price: -100 // Отрицательная цена
        };

        const response = await request(app)
          .post('/api/products')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 404 for non-existent type', async () => {
        const productData = {
          type_id: 999,
          name: 'Товар'
        };

        const response = await request(app)
          .post('/api/products')
          .send(productData)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/products', () => {
      beforeEach(async () => {
        // Создаем тестовые товары
        const typeResult = await db.run('INSERT INTO product_types (name) VALUES (?)', ['Тип 1']);
        const typeId = typeResult.lastID;

        await db.run(
          'INSERT INTO products (type_id, name, price) VALUES (?, ?, ?)',
          [typeId, 'Товар 1', 1000]
        );
        await db.run(
          'INSERT INTO products (type_id, name, price) VALUES (?, ?, ?)',
          [typeId, 'Товар 2', 2000]
        );
      });

      it('should return all products with pagination', async () => {
        const response = await request(app)
          .get('/api/products')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.products).toHaveLength(2);
        expect(response.body.pagination.total).toBe(2);
      });

      it('should filter by type_id', async () => {
        const typeResult = await db.run('INSERT INTO product_types (name) VALUES (?)', ['Тип 2']);
        const typeId2 = typeResult.lastID;

        await db.run(
          'INSERT INTO products (type_id, name) VALUES (?, ?)',
          [typeId2, 'Товар типа 2']
        );

        const response = await request(app)
          .get(`/api/products?typeId=${typeId2}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0].name).toBe('Товар типа 2');
      });
    });
  });

  describe('Authorization', () => {
    it('should reject non-admin access to admin endpoints', async () => {
      // Мокаем пользователя с ролью user
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 2, role: 'user', phone: '+79998887766' };
        req.userId = 2;
        next();
      });

      requireAdmin.mockImplementation((req, res, next) => {
        res.status(403).json({
          success: false,
          error: 'Только администраторы могут управлять товарами'
        });
      });

      const response = await request(app)
        .post('/api/products/types')
        .send({ name: 'Новый тип' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Только администраторы');
    });
  });
});