// models/ProductType.js
import { db } from '../database/init.js';

export class ProductType {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.image_url = data.image_url; // Добавляем image_url
    this.created_at = data.created_at;
    this.products_count = data.products_count || 0;
  }

  // Статические методы

  // Найти тип по ID
  static async findById(id) {
    try {
      console.log('🔍 Finding product type by ID:', id);
      
      const type = db.prepare(
        `SELECT pt.*, COUNT(p.id) as products_count
         FROM product_types pt
         LEFT JOIN products p ON pt.id = p.type_id
         WHERE pt.id = ?
         GROUP BY pt.id`
      ).get(id);
      
      console.log('✅ Found product type:', type);
      return type ? new ProductType(type) : null;
    } catch (error) {
      console.error('❌ Error finding product type by ID:', error);
      throw new Error(`Error finding product type by ID: ${error.message}`);
    }
  }

  // Найти все типы товаров
  static async findAll() {
    try {
      console.log('🔍 Finding all product types...');
      
      const types = db.prepare(`
        SELECT pt.*, COUNT(p.id) as products_count
        FROM product_types pt
        LEFT JOIN products p ON pt.id = p.type_id
        GROUP BY pt.id
        ORDER BY pt.created_at ASC
      `).all();
      
      console.log(`✅ Found ${types.length} product types`);
      return types.map(type => new ProductType(type));
    } catch (error) {
      console.error('❌ Error finding product types:', error);
      throw new Error(`Error finding product types: ${error.message}`);
    }
  }

  // Создать новый тип
  static async create(typeData) {
    try {
      const { name, description = null, image_url = null } = typeData;
      console.log('🆕 Creating product type:', { name, description, image_url });

      const result = db.prepare(
        `INSERT INTO product_types (name, description, image_url) VALUES (?, ?, ?)`
      ).run(name, description, image_url);

      console.log('✅ Product type created with ID:', result.lastInsertRowid);

      const newType = db.prepare(
        `SELECT pt.*, COUNT(p.id) as products_count
         FROM product_types pt
         LEFT JOIN products p ON pt.id = p.type_id
         WHERE pt.id = ?
         GROUP BY pt.id`
      ).get(result.lastInsertRowid);

      return new ProductType(newType);
    } catch (error) {
      console.error('❌ Error creating product type:', error);
      throw new Error(`Error creating product type: ${error.message}`);
    }
  }

  // Обновить тип
  async update(updates) {
    try {
      console.log('✏️ Updating product type:', this.id, 'with:', updates);
      
      const allowedFields = ['name', 'description', 'image_url'];
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(this.id);

      const result = db.prepare(
        `UPDATE product_types SET ${updateFields.join(', ')} WHERE id = ?`
      ).run(...values);

      console.log('✅ Product type updated, changes:', result.changes);

      // Обновляем текущий объект
      const updatedType = db.prepare(
        `SELECT pt.*, COUNT(p.id) as products_count
         FROM product_types pt
         LEFT JOIN products p ON pt.id = p.type_id
         WHERE pt.id = ?
         GROUP BY pt.id`
      ).get(this.id);

      Object.assign(this, updatedType);
      return this;
    } catch (error) {
      console.error('❌ Error updating product type:', error);
      throw new Error(`Error updating product type: ${error.message}`);
    }
  }

  // Удалить тип
  async delete() {
    try {
      console.log('🗑️ Deleting product type:', this.id);
      
      // Проверяем, есть ли связанные товары
      const products = db.prepare(
        `SELECT id FROM products WHERE type_id = ?`
      ).all(this.id);

      if (products.length > 0) {
        console.log('❌ Cannot delete - has associated products:', products.length);
        throw new Error('Cannot delete product type with associated products');
      }

      const result = db.prepare(
        `DELETE FROM product_types WHERE id = ?`
      ).run(this.id);

      console.log('✅ Product type deleted, changes:', result.changes);
      return true;
    } catch (error) {
      console.error('❌ Error deleting product type:', error);
      throw new Error(`Error deleting product type: ${error.message}`);
    }
  }

  // Получить товары этого типа
  async getProducts() {
    try {
      const Product = await import('./Product.js');
      return Product.findByType(this.id);
    } catch (error) {
      console.error('❌ Error getting products for type:', error);
      throw new Error(`Error getting products for type: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      image_url: this.image_url,
      products_count: this.products_count,
      created_at: this.created_at
    };
  }
}