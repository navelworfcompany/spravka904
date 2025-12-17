// models/Product.js
import { db } from '../database/init.js';

export class Product {
  constructor(data) {
    this.id = data.id;
    this.type_id = data.type_id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.materials = data.materials ? JSON.parse(data.materials) : [];
    this.sizes = data.sizes ? JSON.parse(data.sizes) : [];
    this.image_url = data.image_url; // Добавляем image_url
    this.created_at = data.created_at;
  }

  // Статические методы

  // Найти товар по ID
  static async findById(id) {
    try {
      const product = await db.get(
        `SELECT * FROM products WHERE id = ?`,
        [id]
      );
      return product ? new Product(product) : null;
    } catch (error) {
      throw new Error(`Error finding product by ID: ${error.message}`);
    }
  }

  // Найти все товары по типу
  static async findByType(type_id) {
    try {
      const products = await db.all(
        `SELECT p.*, pt.name as type_name 
         FROM products p 
         LEFT JOIN product_types pt ON p.type_id = pt.id 
         WHERE p.type_id = ? 
         ORDER BY p.created_at ASC`,
        [type_id]
      );
      return products.map(product => new Product(product));
    } catch (error) {
      throw new Error(`Error finding products by type: ${error.message}`);
    }
  }

  // Найти все товары с пагинацией - ИСПРАВЛЕННАЯ ВЕРСИЯ
  static async findAll({ page = 1, limit = 10, type_id = null } = {}) {
    try {
      // ПРИВЕДИТЕ К ЦЕЛЫМ ЧИСЛАМ
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      let whereClause = '';
      let queryParams = [];
      let countParams = [];

      if (type_id) {
        whereClause = 'WHERE p.type_id = ?';
        queryParams.push(type_id);
        countParams.push(type_id);
      }

      // ЗАПРОС С ЦЕЛЫМИ ЧИСЛАМИ
      const productsQuery = `
      SELECT p.*, pt.name as type_name 
      FROM products p 
      LEFT JOIN product_types pt ON p.type_id = pt.id 
      ${whereClause}
      ORDER BY p.created_at DESC 
      LIMIT ? OFFSET ?
    `;

      const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      ${whereClause}
    `;

      console.log('🔍 Executing products query...');

      // ПЕРЕДАВАЙТЕ ЦЕЛЫЕ ЧИСЛА
      const products = await db.all(productsQuery, [...queryParams, limitNum, offset]);
      const countResult = await db.get(countQuery, countParams);

      console.log(`✅ Found ${products.length} products`);

      return {
        products: products.map(product => new Product(product)),
        total: countResult.total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(countResult.total / limitNum)
      };
    } catch (error) {
      console.error('❌ Database error in Product.findAll:', error);
      throw error;
    }
  }

  // Создать новый товар
  static async create(productData) {
    try {
      const {
        type_id,
        name,
        description = null,
        price = null,
        materials = [],
        sizes = [],
        image_url = null
      } = productData;

      const result = await db.run(
        `INSERT INTO products (type_id, name, description, price, materials, sizes, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          type_id,
          name,
          description,
          price,
          JSON.stringify(materials),
          JSON.stringify(sizes),
          image_url
        ]
      );

      const newProduct = await db.get(
        `SELECT * FROM products WHERE id = ?`,
        [result.lastID]
      );

      return new Product(newProduct);
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  // Обновить товар
  async update(updates) {
    try {
      const allowedFields = [
        'type_id', 'name', 'description', 'price', 'materials', 'sizes', 'image_url'
      ];

      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          if (key === 'materials' || key === 'sizes') {
            updateFields.push(`${key} = ?`);
            values.push(JSON.stringify(updates[key]));
          } else {
            updateFields.push(`${key} = ?`);
            values.push(updates[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(this.id);

      await db.run(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      // Обновляем текущий объект
      const updatedProduct = await db.get(
        `SELECT * FROM products WHERE id = ?`,
        [this.id]
      );

      Object.assign(this, updatedProduct);
      return this;
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  // Удалить товар
  async delete() {
    try {
      await db.run(
        `DELETE FROM products WHERE id = ?`,
        [this.id]
      );
      return true;
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  // Получить тип товара
  async getType() {
    try {
      const ProductType = await import('./ProductType.js');
      return ProductType.findById(this.type_id);
    } catch (error) {
      throw new Error(`Error getting product type: ${error.message}`);
    }
  }

  // Проверить, доступен ли товар
  isAvailable() {
    return this.price !== null && this.price > 0;
  }

  // Получить форматированную цену
  getFormattedPrice() {
    return this.price ? `₽${this.price.toLocaleString('ru-RU')}` : 'Цена не указана';
  }

  // Получить данные для ответа
  toJSON() {
    return {
      id: this.id,
      type_id: this.type_id,
      name: this.name,
      description: this.description,
      price: this.price,
      formatted_price: this.getFormattedPrice(),
      materials: this.materials,
      sizes: this.sizes,
      image_url: this.image_url,
      is_available: this.isAvailable(),
      created_at: this.created_at
    };
  }
}