import { ProductService } from '../../services/productService.js';
import { Product } from '../../models/Product.js';
import { ProductType } from '../../models/ProductType.js';
import { AppError } from '../../middleware/errorHandler.js';

// Mock моделей
jest.mock('../../models/Product.js');
jest.mock('../../models/ProductType.js');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductTypes', () => {
    it('should return all product types', async () => {
      const mockTypes = [
        { id: 1, name: 'Мебель', toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Мебель' }) },
        { id: 2, name: 'Электроника', toJSON: jest.fn().mockReturnValue({ id: 2, name: 'Электроника' }) }
      ];

      ProductType.findAll.mockResolvedValue(mockTypes);

      const result = await ProductService.getProductTypes();

      expect(ProductType.findAll).toHaveBeenCalled();
      expect(result.types).toHaveLength(2);
      expect(result.types[0].name).toBe('Мебель');
    });
  });

  describe('createProductType', () => {
    it('should create product type successfully', async () => {
      const typeData = {
        name: 'Одежда',
        description: 'Различные виды одежды'
      };

      const mockProductType = {
        id: 1,
        ...typeData,
        toJSON: jest.fn().mockReturnValue({ id: 1, ...typeData })
      };

      ProductType.create.mockResolvedValue(mockProductType);

      const result = await ProductService.createProductType(typeData);

      expect(ProductType.create).toHaveBeenCalledWith(typeData);
      expect(result.type.name).toBe('Одежда');
      expect(result.message).toBe('Тип товара успешно создан');
    });
  });

  describe('updateProductType', () => {
    it('should update product type successfully', async () => {
      const updates = { name: 'Обновленная мебель', description: 'Новое описание' };
      
      const mockProductType = {
        id: 1,
        name: 'Мебель',
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...updates })
      };

      ProductType.findById.mockResolvedValue(mockProductType);

      const result = await ProductService.updateProductType(1, updates);

      expect(ProductType.findById).toHaveBeenCalledWith(1);
      expect(mockProductType.update).toHaveBeenCalledWith(updates);
      expect(result.type.name).toBe('Обновленная мебель');
    });

    it('should throw error if product type not found', async () => {
      ProductType.findById.mockResolvedValue(null);

      await expect(ProductService.updateProductType(999, { name: 'Test' }))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('deleteProductType', () => {
    it('should delete product type successfully', async () => {
      const mockProductType = {
        id: 1,
        name: 'Мебель',
        delete: jest.fn().mockResolvedValue()
      };

      ProductType.findById.mockResolvedValue(mockProductType);

      const result = await ProductService.deleteProductType(1);

      expect(ProductType.findById).toHaveBeenCalledWith(1);
      expect(mockProductType.delete).toHaveBeenCalled();
      expect(result.message).toBe('Тип товара успешно удален');
    });

    it('should throw error if product type has associated products', async () => {
      const mockProductType = {
        id: 1,
        name: 'Мебель',
        delete: jest.fn().mockRejectedValue(new Error('Cannot delete product type with associated products'))
      };

      ProductType.findById.mockResolvedValue(mockProductType);

      await expect(ProductService.deleteProductType(1))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getProductsByType', () => {
    it('should return products by type', async () => {
      const mockProductType = {
        id: 1,
        name: 'Мебель',
        toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Мебель' }),
        getProducts: jest.fn().mockResolvedValue([
          { id: 1, name: 'Стул', toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Стул' }) },
          { id: 2, name: 'Стол', toJSON: jest.fn().mockReturnValue({ id: 2, name: 'Стол' }) }
        ])
      };

      ProductType.findById.mockResolvedValue(mockProductType);

      const result = await ProductService.getProductsByType(1);

      expect(ProductType.findById).toHaveBeenCalledWith(1);
      expect(mockProductType.getProducts).toHaveBeenCalled();
      expect(result.products).toHaveLength(2);
      expect(result.type.name).toBe('Мебель');
    });

    it('should throw error if product type not found', async () => {
      ProductType.findById.mockResolvedValue(null);

      await expect(ProductService.getProductsByType(999))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products with pagination', async () => {
      const mockProducts = [
        { id: 1, name: 'Товар 1', toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Товар 1' }) },
        { id: 2, name: 'Товар 2', toJSON: jest.fn().mockReturnValue({ id: 2, name: 'Товар 2' }) }
      ];

      Product.findAll.mockResolvedValue({
        products: mockProducts,
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      });

      const filters = { page: 1, limit: 10 };
      const result = await ProductService.getAllProducts(filters);

      expect(Product.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        typeId: null
      });
      expect(result.products).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by type id', async () => {
      const filters = { typeId: 1 };
      
      Product.findAll.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      });

      await ProductService.getAllProducts(filters);

      expect(Product.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        typeId: 1
      });
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        type_id: 1,
        name: 'Новый стул',
        description: 'Комфортный стул из дерева',
        price: 1500,
        materials: ['Дерево', 'Ткань'],
        sizes: ['Большой', 'Средний']
      };

      const mockProductType = {
        id: 1,
        name: 'Мебель'
      };

      const mockProduct = {
        id: 1,
        ...productData,
        toJSON: jest.fn().mockReturnValue({ id: 1, ...productData })
      };

      ProductType.findById.mockResolvedValue(mockProductType);
      Product.create.mockResolvedValue(mockProduct);

      const result = await ProductService.createProduct(productData);

      expect(ProductType.findById).toHaveBeenCalledWith(1);
      expect(Product.create).toHaveBeenCalledWith(productData);
      expect(result.product.name).toBe('Новый стул');
      expect(result.message).toBe('Товар успешно создан');
    });

    it('should throw error if product type not found', async () => {
      const productData = { type_id: 999, name: 'Товар' };
      ProductType.findById.mockResolvedValue(null);

      await expect(ProductService.createProduct(productData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updates = { name: 'Обновленный стул', price: 2000 };
      
      const mockProduct = {
        id: 1,
        name: 'Стул',
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...updates })
      };

      Product.findById.mockResolvedValue(mockProduct);

      const result = await ProductService.updateProduct(1, updates);

      expect(Product.findById).toHaveBeenCalledWith(1);
      expect(mockProduct.update).toHaveBeenCalledWith(updates);
      expect(result.product.name).toBe('Обновленный стул');
    });

    it('should validate new type_id if provided', async () => {
      const updates = { type_id: 2 };
      
      const mockProduct = {
        id: 1,
        name: 'Стул',
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...updates })
      };

      const mockProductType = {
        id: 2,
        name: 'Новый тип'
      };

      Product.findById.mockResolvedValue(mockProduct);
      ProductType.findById.mockResolvedValue(mockProductType);

      await ProductService.updateProduct(1, updates);

      expect(ProductType.findById).toHaveBeenCalledWith(2);
    });

    it('should throw error if new type not found', async () => {
      const updates = { type_id: 999 };
      
      const mockProduct = {
        id: 1,
        name: 'Стул'
      };

      Product.findById.mockResolvedValue(mockProduct);
      ProductType.findById.mockResolvedValue(null);

      await expect(ProductService.updateProduct(1, updates))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Стул',
        delete: jest.fn().mockResolvedValue()
      };

      Product.findById.mockResolvedValue(mockProduct);

      const result = await ProductService.deleteProduct(1);

      expect(Product.findById).toHaveBeenCalledWith(1);
      expect(mockProduct.delete).toHaveBeenCalled();
      expect(result.message).toBe('Товар успешно удален');
    });

    it('should throw error if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await expect(ProductService.deleteProduct(999))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([
          { id: 1, name: 'Деревянный стул' },
          { id: 2, name: 'Стул офисный' }
        ])
      };

      // Mock database import
      jest.doMock('../../database/init.js', () => ({
        db: mockDb
      }));

      const { ProductService: ServiceWithMock } = await import('../../services/productService.js');
      
      const result = await ServiceWithMock.searchProducts('стул');

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM products'),
        ['%стул%', '%стул%']
      );
      expect(result).toHaveLength(2);
    });

    it('should apply filters in search', async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([])
      };

      jest.doMock('../../database/init.js', () => ({
        db: mockDb
      }));

      const { ProductService: ServiceWithMock } = await import('../../services/productService.js');
      
      const filters = { typeId: 1, minPrice: 1000, maxPrice: 5000 };
      await ServiceWithMock.searchProducts('стол', filters);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('AND type_id = ?'),
        expect.arrayContaining([1, 1000, 5000])
      );
    });
  });

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      const mockTypeStats = [
        { id: 1, name: 'Мебель', products_count: 5, avg_price: 2500 },
        { id: 2, name: 'Электроника', products_count: 3, avg_price: 15000 }
      ];

      ProductType.getStats = jest.fn().mockResolvedValue(mockTypeStats);
      Product.getTotalCount = jest.fn().mockResolvedValue(8);
      Product.getAvailableCount = jest.fn().mockResolvedValue(6);

      const result = await ProductService.getProductStats();

      expect(ProductType.getStats).toHaveBeenCalled();
      expect(Product.getTotalCount).toHaveBeenCalled();
      expect(result.total_products).toBe(8);
      expect(result.available_products).toBe(6);
      expect(result.by_type).toHaveLength(2);
    });
  });
});