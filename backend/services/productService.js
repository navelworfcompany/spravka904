import { Product } from '../models/Product.js';
import { ProductType } from '../models/ProductType.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProductService {
  /**
   * Получение всех типов товаров
   */
  static async getProductTypes() {
    try {
      const types = await ProductType.findAll();

      return {
        types: types.map(type => type.toJSON())
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении типов товаров', 500);
    }
  }

  /**
   * Создание типа товара
   */
  static async createProductType(typeData, imageFile) {
    try {
      let imageUrl = null;

      // Если есть изображение, сохраняем его
      if (imageFile) {
        imageUrl = `/img/types/${imageFile.filename}`;
      }

      const productType = await ProductType.create({
        ...typeData,
        image_url: imageUrl
      });

      return {
        type: productType.toJSON(),
        message: 'Тип товара успешно создан'
      };
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (imageFile) {
        this.deleteImageFile(imageFile.path);
      }

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при создании типа товара', 500);
    }
  }

  /**
   * Обновление типа товара
   */
  static async updateProductType(id, updates, imageFile) {
    try {
      const productType = await ProductType.findById(id);

      if (!productType) {
        throw new AppError('Тип товара не найден', 404);
      }

      let imageUrl = productType.image_url;

      // Если есть новое изображение
      if (imageFile) {
        // Удаляем старое изображение если оно есть
        if (productType.image_url) {
          this.deleteImageFile(path.join(__dirname, '..', productType.image_url));
        }

        imageUrl = `/img/types/${imageFile.filename}`;
      }

      await productType.update({
        ...updates,
        image_url: imageUrl
      });

      return {
        type: productType.toJSON(),
        message: 'Тип товара успешно обновлен'
      };
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (imageFile) {
        this.deleteImageFile(imageFile.path);
      }

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при обновлении типа товара', 500);
    }
  }

  /**
   * Удаление типа товара
   */
  static async deleteProductType(id) {
    try {
      const productType = await ProductType.findById(id);

      if (!productType) {
        throw new AppError('Тип товара не найден', 404);
      }

      // Удаляем изображение если оно есть
      if (productType.image_url) {
        this.deleteImageFile(path.join(__dirname, '..', productType.image_url));
      }

      await productType.delete();

      return {
        message: 'Тип товара успешно удален'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при удалении типа товара', 500);
    }
  }

  /**
   * Получение товаров по типу
   */
  static async getProductsByType(type_id) {
    try {
      const productType = await ProductType.findById(type_id);

      if (!productType) {
        throw new AppError('Тип товара не найден', 404);
      }

      const products = await productType.getProducts();

      return {
        type: productType.toJSON(),
        products: products.map(product => product.toJSON())
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении товаров', 500);
    }
  }

  /**
   * Получение всех товаров с пагинацией
   */
  static async getAllProducts(filters = {}) {
    try {
      console.log('🔍 ProductService.getAllProducts - START');

      // Упростите параметры
      const result = await Product.findAll({
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit) || 100,
        type_id: filters.type_id // без значения по умолчанию
      });

      console.log('✅ Products loaded successfully:', result.products.length);

      return {
        products: result.products.map(product => product.toJSON()),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      };

    } catch (error) {
      console.error('❌ CRITICAL ERROR in ProductService.getAllProducts:', error);
      throw new AppError('Database error: ' + error.message, 500);
    }
  }

  /**
   * Создание товара
   */
  static async createProduct(productData, imageFile) {
    try {
      // Проверяем существование типа товара
      const productType = await ProductType.findById(productData.type_id);
      if (!productType) {
        throw new AppError('Тип товара не найден', 404);
      }

      let imageUrl = null;

      // Если есть изображение, сохраняем его
      if (imageFile) {
        imageUrl = `/img/products/${imageFile.filename}`;
      }

      const product = await Product.create({
        ...productData,
        image_url: imageUrl
      });

      return {
        product: product.toJSON(),
        message: 'Товар успешно создан'
      };
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (imageFile) {
        this.deleteImageFile(imageFile.path);
      }

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при создании товара', 500);
    }
  }

  /**
   * Обновление товара
   */
  static async updateProduct(id, updates, imageFile) {
    try {
      const product = await Product.findById(id);

      if (!product) {
        throw new AppError('Товар не найден', 404);
      }

      // Если обновляется type_id, проверяем существование нового типа
      if (updates.type_id) {
        const productType = await ProductType.findById(updates.type_id);
        if (!productType) {
          throw new AppError('Тип товара не найден', 404);
        }
      }

      let imageUrl = product.image_url;

      // Если есть новое изображение
      if (imageFile) {
        // Удаляем старое изображение если оно есть
        if (product.image_url) {
          this.deleteImageFile(path.join(__dirname, '..', product.image_url));
        }

        imageUrl = `/img/products/${imageFile.filename}`;
      }

      await product.update({
        ...updates,
        image_url: imageUrl
      });

      return {
        product: product.toJSON(),
        message: 'Товар успешно обновлен'
      };
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (imageFile) {
        this.deleteImageFile(imageFile.path);
      }

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при обновлении товара', 500);
    }
  }

  /**
   * Удаление товара
   */
  static async deleteProduct(id) {
    try {
      const product = await Product.findById(id);

      if (!product) {
        throw new AppError('Товар не найден', 404);
      }

      // Удаляем изображение если оно есть
      if (product.image_url) {
        this.deleteImageFile(path.join(__dirname, '..', product.image_url));
      }

      await product.delete();

      return {
        message: 'Товар успешно удален'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при удалении товара', 500);
    }
  }

  /**
   * Удаление файла изображения
   */
  static deleteImageFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted image file: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Error deleting image file:', error);
    }
  }

  /**
   * Получение статистики по товарам
   */
  static async getProductStats() {
    try {
      const typeStats = await ProductType.getStats();

      // Общая статистика по товарам
      const totalProducts = await Product.getTotalCount();
      const availableProducts = await Product.getAvailableCount();

      return {
        total_products: totalProducts,
        available_products: availableProducts,
        by_type: typeStats
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при получении статистики товаров', 500);
    }
  }

  /**
   * Поиск товаров
   */
  static async searchProducts(query, filters = {}) {
    try {
      const { type_id = null, minPrice = null, maxPrice = null } = filters;

      let searchQuery = `
        SELECT * FROM products 
        WHERE name LIKE ? OR description LIKE ?
      `;
      const params = [`%${query}%`, `%${query}%`];

      if (type_id) {
        searchQuery += ` AND type_id = ?`;
        params.push(type_id);
      }

      if (minPrice !== null) {
        searchQuery += ` AND price >= ?`;
        params.push(minPrice);
      }

      if (maxPrice !== null) {
        searchQuery += ` AND price <= ?`;
        params.push(maxPrice);
      }

      searchQuery += ` ORDER BY created_at DESC`;

      const { db } = await import('../database/init.js');
      const products = await db.all(searchQuery, params);

      return products.map(product => new Product(product).toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Ошибка при поиске товаров', 500);
    }
  }
}

export default ProductService;