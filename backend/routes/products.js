// routes/products.js
import express from 'express';
import multer from 'multer';
import { productsController } from '../controllers/productsController.js';
import { 
  validateProductType,
  validateProduct,
  validateProductUpdate,
  validateTypeIdParam,
  validateIdParam,
  validatePagination 
} from '../middleware/validation.js';
import { 
  authenticateToken,
  requireActiveUser,
  requireAdmin,
  logUserAction 
} from '../middleware/auth.js';
import { 
  uploadType, 
  uploadProduct,
  handleUploadError 
} from '../middleware/upload.js';

import { 
  parseFormDataFields
} from '../middleware/formDataParser.js';

const router = express.Router();

// 🔥 ПУБЛИЧНЫЕ РОУТЫ - получение товаров доступно всем
router.get('/types', 
  logUserAction('get_product_types'),
  productsController.getProductTypes
);

router.get('/type/:type_id', 
  logUserAction('get_products_by_type'),
  validateTypeIdParam,
  productsController.getProductsByType
);

router.get('/:productId/min-price', 
  logUserAction('get_product_min_price'),
  productsController.getProductMinPrice
);

router.get('/', 
  logUserAction('get_all_products'),
  validatePagination,
  productsController.getAllProducts
);

// 🔥 ЗАЩИЩЕННЫЕ РОУТЫ - управление товарами только для админов
router.use(authenticateToken);
router.use(requireActiveUser);
router.use(requireAdmin);

// Управление типами товаров
router.post('/types', 
  logUserAction('create_product_type'),
  uploadType.single('image'), // ПОТОМ обрабатываем файл
  handleUploadError,
  validateProductType,
  productsController.createProductType
);

router.put('/types/:id', 
  logUserAction('update_product_type'),
  uploadType.single('image'), // ПОТОМ обрабатываем файл
  handleUploadError,
  validateIdParam,
  validateProductType,
  productsController.updateProductType
);

router.delete('/types/:id', 
  logUserAction('delete_product_type'),
  validateIdParam,
  productsController.deleteProductType
);

// Управление товарами
router.post('/', 
  logUserAction('create_product'),
  
  // ДОБАВЬТЕ ПРОВЕРКУ - если в теле запроса уже есть success, это вероятно ошибочный запрос
  (req, res, next) => {
    if (req.body && req.body.success !== undefined) {
      console.log('⚠️ Possible duplicate request detected, skipping...');
      return res.status(400).json({
        success: false,
        error: 'Invalid request format'
      });
    }
    next();
  },
  
  uploadProduct.single('image'),
  validateProduct,
  productsController.createProduct
);

router.put('/:id', 
  logUserAction('update_product'),
  uploadProduct.single('image'), // ПОТОМ обрабатываем файл
  handleUploadError,
  validateIdParam,
  validateProductUpdate,
  productsController.updateProduct
);

router.delete('/:id', 
  logUserAction('delete_product'),
  validateIdParam,
  productsController.deleteProduct
);

export default router;