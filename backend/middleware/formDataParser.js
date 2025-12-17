// middleware/formDataParser.js
export const parseFormDataFields = (req, res, next) => {
  console.log('🔍 Raw req.body after multer:', req.body);
  
  // Multer с diskStorage парсит текстовые поля FormData в req.body
  // Но нам нужно убедиться, что они правильно обработаны
  
  // Преобразуем type_id в число
  if (req.body.type_id) {
    req.body.type_id = parseInt(req.body.type_id);
  } else {
    console.error('❌ type_id is missing!');
  }
  
  // Преобразуем price в число
  if (req.body.price && req.body.price !== '') {
    req.body.price = parseFloat(req.body.price);
  } else if (req.body.price === '') {
    req.body.price = null;
  }
  
  // Парсим JSON строки в массивы
  if (req.body.materials) {
    try {
      if (typeof req.body.materials === 'string') {
        req.body.materials = JSON.parse(req.body.materials);
      }
    } catch (error) {
      console.log('❌ Ошибка парсинга materials:', error);
      req.body.materials = [];
    }
  } else {
    req.body.materials = [];
  }
  
  if (req.body.sizes) {
    try {
      if (typeof req.body.sizes === 'string') {
        req.body.sizes = JSON.parse(req.body.sizes);
      }
    } catch (error) {
      console.log('❌ Ошибка парсинга sizes:', error);
      req.body.sizes = [];
    }
  } else {
    req.body.sizes = [];
  }
  
  // Убедимся, что все обязательные поля существуют
  if (!req.body.name) {
    console.error('❌ name is missing!');
    req.body.name = '';
  }
  
  if (!req.body.description) {
    req.body.description = '';
  }
  
  console.log('🔍 Parsed req.body:', req.body);
  next();
};