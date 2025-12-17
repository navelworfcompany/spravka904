// controllers/productsController.js
import { db } from '../database/init.js';

const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;

  // Если это уже массив, возвращаем как есть
  if (Array.isArray(str)) return str;

  // Если строка пустая или null
  if (str === 'null' || str === 'undefined' || str === '') return fallback;

  try {
    // Пробуем распарсить JSON
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.warn('⚠️ JSON parse error for string:', {
      original: str,
      type: typeof str,
      length: str?.length,
      error: error.message
    });

    // Пробуем разные варианты обработки
    try {
      // Если это строка с запятыми, разбиваем на массив
      if (typeof str === 'string' && str.includes(',')) {
        const arrayFromString = str.split(',').map(item => item.trim()).filter(item => item);
        console.log('🔄 Converted from comma-separated string:', arrayFromString);
        return arrayFromString;
      }

      // Если это одиночное значение, возвращаем в массиве
      if (typeof str === 'string' && str.trim()) {
        console.log('🔄 Single value wrapped in array:', [str.trim()]);
        return [str.trim()];
      }
    } catch (fallbackError) {
      console.warn('⚠️ Fallback parsing also failed:', fallbackError);
    }

    return fallback;
  }
};

export const productsController = {
  getProductTypes: async (req, res) => {
    try {
      console.log('📦 Getting all product types...');

      const stmt = db.prepare(`
        SELECT pt.*, 
               COUNT(p.id) as products_count
        FROM product_types pt
        LEFT JOIN products p ON pt.id = p.type_id
        GROUP BY pt.id
        ORDER BY pt.created_at ASC
      `);

      const types = stmt.all();

      console.log(`✅ Found ${types.length} product types`);

      res.json({
        success: true,
        types
      });

    } catch (error) {
      console.error('❌ Get product types error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении типов товаров'
      });
    }
  },

  // Получение всех товаров - ОРИГИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
// controllers/productsController.js - ОБНОВЛЕННАЯ ВЕРСИЯ

  getAllProducts: async (req, res) => {
    try {
      const { page = 1, limit = 1000, type_id } = req.query;
      const offset = (page - 1) * limit;

      console.log('🔍 GET /products - query params:', req.query);
      console.log('🔍 type_id value:', type_id);

      let whereClause = '';
      let queryParams = [];

      // ВАЖНО: Добавляем фильтр по type_id только если он явно указан
      if (type_id !== undefined && type_id !== null && type_id !== '') {
        whereClause = 'WHERE p.type_id = ?';
        queryParams.push(type_id);
        console.log('🎯 FILTERING by type_id:', type_id);
      } else {
        console.log('🎯 NO FILTER - getting ALL products from ALL types');
      }

      // Получаем товары
      const productsStmt = db.prepare(`
        SELECT p.*, pt.name as type_name 
        FROM products p 
        LEFT JOIN product_types pt ON p.type_id = pt.id 
        ${whereClause}
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `);

      const products = productsStmt.all(...queryParams, parseInt(limit), offset);

      console.log('📦 Raw products from database:', products.length);
      
      // Анализ по типам
      const typeCounts = {};
      products.forEach(product => {
        const typeName = product.type_name || 'Unknown';
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
      });
      console.log('📦 Products by type:', typeCounts);

    } catch (error) {
      console.error('❌ Get all products error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении товаров: ' + error.message
      });
    }
  },

  // Создание типа товара - С ДОБАВЛЕНИЕМ ИЗОБРАЖЕНИЯ
  createProductType: async (req, res) => {
    try {
      const { name, description } = req.body;
      const imageFile = req.file;

      console.log('🆕 Creating product type:', { name, description, hasImage: !!imageFile });

      let imageUrl = null;
      if (imageFile) {
        imageUrl = `/img/types/${imageFile.filename}`;
      }

      const stmt = db.prepare(`
        INSERT INTO product_types (name, description, image_url) 
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(name, description, imageUrl);

      // Получаем созданный тип С количеством товаров
      const getStmt = db.prepare(`
        SELECT pt.*, 
               COUNT(p.id) as products_count
        FROM product_types pt
        LEFT JOIN products p ON pt.id = p.type_id
        WHERE pt.id = ?
        GROUP BY pt.id
      `);

      const newType = getStmt.get(result.lastInsertRowid);

      console.log('✅ Product type created successfully:', newType);

      res.status(201).json({
        success: true,
        type: newType,
        message: 'Тип товара успешно создан'
      });

    } catch (error) {
      console.error('❌ Create product type error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании типа товара'
      });
    }
  },

  // Обновление типа товара - С ДОБАВЛЕНИЕМ ИЗОБРАЖЕНИЯ
  updateProductType: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const imageFile = req.file;

      console.log('✏️ Updating product type:', id, 'with data:', { name, description, hasImage: !!imageFile });

      // Сначала получаем текущий тип для удаления старого изображения
      const currentStmt = db.prepare('SELECT image_url FROM product_types WHERE id = ?');
      const currentType = currentStmt.get(id);

      let imageUrl = currentType?.image_url;

      if (imageFile) {
        // Если есть новое изображение, обновляем URL
        imageUrl = `/img/types/${imageFile.filename}`;

        // TODO: Удалить старое изображение с файловой системы
      }

      const stmt = db.prepare(`
        UPDATE product_types 
        SET name = ?, description = ?, image_url = ? 
        WHERE id = ?
      `);

      const result = stmt.run(name, description, imageUrl, id);

      if (result.changes === 0) {
        console.log('❌ Product type not found:', id);
        return res.status(404).json({
          success: false,
          error: 'Тип товара не найден'
        });
      }

      // Получаем обновленный тип С количеством товаров
      const getStmt = db.prepare(`
        SELECT pt.*, 
               COUNT(p.id) as products_count
        FROM product_types pt
        LEFT JOIN products p ON pt.id = p.type_id
        WHERE pt.id = ?
        GROUP BY pt.id
      `);

      const updatedType = getStmt.get(id);

      console.log('✅ Product type updated successfully:', updatedType);

      res.json({
        success: true,
        type: updatedType,
        message: 'Тип товара успешно обновлен'
      });

    } catch (error) {
      console.error('❌ Update product type error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении типа товара'
      });
    }
  },

  // Удаление типа товара
  deleteProductType: async (req, res) => {
    try {
      const { id } = req.params;

      // Проверяем есть ли товары этого типа
      const checkStmt = db.prepare(`
        SELECT id FROM products WHERE type_id = ?
      `);

      const products = checkStmt.all(id);

      if (products.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Невозможно удалить тип товара: существуют связанные товары'
        });
      }

      const stmt = db.prepare(`
        DELETE FROM product_types WHERE id = ?
      `);

      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Тип товара не найден'
        });
      }

      res.json({
        success: true,
        message: 'Тип товара успешно удален'
      });

    } catch (error) {
      console.error('Delete product type error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении типа товара'
      });
    }
  },

  // Получение товаров по типу
  getProductsByType: async (req, res) => {
    try {
      const { type_id } = req.params;

      console.log('🔍 Getting products for type:', type_id);

      const stmt = db.prepare(`
        SELECT p.*, pt.name as type_name 
        FROM products p 
        LEFT JOIN product_types pt ON p.type_id = pt.id 
        WHERE p.type_id = ? 
        ORDER BY p.created_at ASC
      `);

      const products = stmt.all(type_id);

      // Используем безопасный парсинг
      const parsedProducts = products.map(product => ({
        ...product,
        materials: safeJsonParse(product.materials),
        sizes: safeJsonParse(product.sizes)
      }));

      console.log(`✅ Found ${parsedProducts.length} products for type ${type_id}`);

      res.json({
        success: true,
        products: parsedProducts
      });

    } catch (error) {
      console.error('❌ Get products error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении товаров'
      });
    }
  },

  // Создание товара - С ДОБАВЛЕНИЕМ ИЗОБРАЖЕНИЯ
  createProduct: async (req, res) => {
  try {
    const { type_id, name, description, price, materials, sizes } = req.body;
    const imageFile = req.file;

    console.log('🆕 CREATE PRODUCT - START');
    console.log('📦 Request body:', req.body);
    console.log('📁 File:', imageFile);

    // Проверяем обязательные поля
    if (!type_id || !name) {
      console.log('❌ Missing required fields:', { type_id, name });
      return res.status(400).json({
        success: false,
        error: 'Тип товара и название обязательны'
      });
    }

    // Проверяем и преобразуем price
    const priceValue = price ? parseFloat(price) : 0;
    if (isNaN(priceValue)) {
      console.log('❌ Invalid price:', price);
      return res.status(400).json({
        success: false,
        error: 'Неверный формат цены'
      });
    }

    let imageUrl = null;
    if (imageFile) {
      // Теперь filename будет определен
      imageUrl = `/img/products/${imageFile.filename}`;
      console.log('🖼️ Image URL set to:', imageUrl);
    } else {
      console.log('ℹ️ No image file provided');
    }

    // УЛУЧШЕННЫЙ ПАРСИНГ materials и sizes
    let materialsArray = [];
    let sizesArray = [];

    try {
      if (materials) {
        if (typeof materials === 'string' && materials.trim()) {
          // Пробуем распарсить JSON
          try {
            materialsArray = JSON.parse(materials);
          } catch (jsonError) {
            // Если не JSON, используем как массив с одним элементом
            materialsArray = [materials.trim()];
          }
        } else if (Array.isArray(materials)) {
          materialsArray = materials;
        }
      }
      console.log('✅ Materials parsed:', materialsArray);
    } catch (parseError) {
      console.error('❌ Error parsing materials:', parseError);
      materialsArray = [];
    }

    try {
      if (sizes) {
        if (typeof sizes === 'string' && sizes.trim()) {
          try {
            sizesArray = JSON.parse(sizes);
          } catch (jsonError) {
            sizesArray = [sizes.trim()];
          }
        } else if (Array.isArray(sizes)) {
          sizesArray = sizes;
        }
      }
      console.log('✅ Sizes parsed:', sizesArray);
    } catch (parseError) {
      console.error('❌ Error parsing sizes:', parseError);
      sizesArray = [];
    }

    console.log('📝 Final data for insertion:', {
      type_id, name, description,
      price: priceValue,
      materials: materialsArray,
      sizes: sizesArray,
      imageUrl
    });

    const stmt = db.prepare(`
      INSERT INTO products 
      (type_id, name, description, price, materials, sizes, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    console.log('🔍 Executing SQL statement...');

    const result = stmt.run(
      type_id,
      name,
      description || '',
      priceValue,
      JSON.stringify(materialsArray),
      JSON.stringify(sizesArray),
      imageUrl
    );

    console.log('✅ SQL execution result:', result);

    if (!result.lastInsertRowid) {
      throw new Error('No lastInsertRowid returned from database');
    }

    // Получаем созданный товар
    const getStmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
    const newProduct = getStmt.get(result.lastInsertRowid);

    if (!newProduct) {
      throw new Error('Failed to retrieve created product');
    }

    console.log('✅ Retrieved product from database:', newProduct);

    // Парсим JSON поля для ответа
    const parsedProduct = {
      ...newProduct,
      materials: safeJsonParse(newProduct.materials),
      sizes: safeJsonParse(newProduct.sizes)
    };

    console.log('✅ Product created successfully:', parsedProduct);

    res.status(201).json({
      success: true,
      product: parsedProduct,
      message: 'Товар успешно создан'
    });

  } catch (error) {
    console.error('❌ CREATE PRODUCT ERROR DETAILS:');
    console.error('🔍 Error message:', error.message);
    console.error('🔍 Error stack:', error.stack);

    res.status(500).json({
      success: false,
      error: 'Ошибка при создании товара: ' + error.message
    });
  }
},

  // Обновление товара - С ДОБАВЛЕНИЕМ ИЗОБРАЖЕНИЯ
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      // ИСПРАВЛЕННЫЕ ИМЕНА ПОЛЕЙ
      const { name, description, price, materials, sizes } = req.body;
      const imageFile = req.file;

      console.log('✏️ UPDATE PRODUCT - ID:', id, 'Updates:', {
        name, description, price, materials, sizes
      }, 'hasImage:', !!imageFile);

      // Проверяем существование товара
      const checkStmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
      const existingProduct = checkStmt.get(id);

      if (!existingProduct) {
        console.log('❌ Product not found:', id);
        return res.status(404).json({
          success: false,
          error: 'Товар не найден'
        });
      }

      const updateFields = [];
      const values = [];

      // Обрабатываем каждое поле для обновления (используем исправленные имена)
      if (name !== undefined) {
        updateFields.push(`name = ?`);
        values.push(name);
      }

      if (description !== undefined) {
        updateFields.push(`description = ?`);
        values.push(description);
      }

      if (price !== undefined) {
        const priceValue = parseFloat(price);
        if (!isNaN(priceValue)) {
          updateFields.push(`price = ?`);
          values.push(priceValue);
        }
      }

      if (materials !== undefined) {
        try {
          const materialsArray = materials ? JSON.parse(materials) : [];
          updateFields.push(`materials = ?`);
          values.push(JSON.stringify(materialsArray));
        } catch (error) {
          console.error('❌ Error parsing materials:', error);
        }
      }

      if (sizes !== undefined) {
        try {
          const sizesArray = sizes ? JSON.parse(sizes) : [];
          updateFields.push(`sizes = ?`);
          values.push(JSON.stringify(sizesArray));
        } catch (error) {
          console.error('❌ Error parsing sizes:', error);
        }
      }

      // Добавляем обновление изображения если есть новое
      if (imageFile) {
        updateFields.push(`image_url = ?`);
        values.push(`/img/products/${imageFile.filename}`);
      }

      if (updateFields.length === 0) {
        console.log('❌ No valid fields to update');
        return res.status(400).json({
          success: false,
          error: 'Нет данных для обновления'
        });
      }

      values.push(id);

      console.log('🔧 Final update query:', {
        fields: updateFields,
        values: values
      });

      const stmt = db.prepare(`
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

      const result = stmt.run(...values);

      console.log('✅ Update result - changes:', result.changes);

      if (result.changes === 0) {
        console.log('❌ No changes made to product');
        return res.status(400).json({
          success: false,
          error: 'Не удалось обновить товар'
        });
      }

      // Получаем обновленный товар
      const getStmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
      const updatedProduct = getStmt.get(id);

      // Парсим JSON поля для ответа
      const parsedProduct = {
        ...updatedProduct,
        materials: safeJsonParse(updatedProduct.materials),
        sizes: safeJsonParse(updatedProduct.sizes)
      };

      console.log('✅ Product updated successfully:', parsedProduct);

      res.json({
        success: true,
        product: parsedProduct,
        message: 'Товар успешно обновлен'
      });

    } catch (error) {
      console.error('❌ Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении товара: ' + error.message
      });
    }
  },

  // Удаление товара
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const stmt = db.prepare(`
        DELETE FROM products WHERE id = ?
      `);

      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден'
        });
      }

      res.json({
        success: true,
        message: 'Товар успешно удален'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении товара'
      });
    }
  },

  getProductMinPrice: async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log('💰 Получение минимальной цены для товара:', productId);

    const stmt = db.prepare(`
      SELECT MIN(price) as min_price 
      FROM worker_portfolio 
      WHERE product_id = ? AND price > 0
    `);
    
    const result = stmt.get(productId);
    const minPrice = result?.min_price || null;

    console.log('💰 Минимальная цена:', minPrice);

    res.json({
      success: true,
      data: {
        min_price: minPrice
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения минимальной цены:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении минимальной цены' 
    });
  }
}
};