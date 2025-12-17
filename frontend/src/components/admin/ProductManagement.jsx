import React, { useState, useEffect } from 'react';
import './ProductManagement.css';

const ProductManagement = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState({});
  const [editingType, setEditingType] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Заглушка данных
    const mockTypes = [
      { id: 1, name: 'Тип 1', description: 'Описание типа 1' },
      { id: 2, name: 'Тип 2', description: 'Описание типа 2' },
    ];

    const mockProducts = {
      1: [
        { id: 1, name: 'Товар 1-1', price: 1000, description: 'Описание товара 1-1' },
        { id: 2, name: 'Товар 1-2', price: 1500, description: 'Описание товара 1-2' },
      ],
      2: [
        { id: 3, name: 'Товар 2-1', price: 2000, description: 'Описание товара 2-1' },
      ]
    };

    setProductTypes(mockTypes);
    setProducts(mockProducts);
  };

  const handleAddType = (typeData) => {
    const newType = { ...typeData, id: Date.now() };
    setProductTypes(prev => [...prev, newType]);
    setShowTypeForm(false);
  };

  const handleEditType = (typeData) => {
    setProductTypes(prev => 
      prev.map(type => type.id === editingType.id ? { ...type, ...typeData } : type)
    );
    setEditingType(null);
  };

  const handleDeleteType = (typeId) => {
    if (window.confirm('Удалить этот тип товара?')) {
      setProductTypes(prev => prev.filter(type => type.id !== typeId));
      // Также удаляем связанные товары
      const newProducts = { ...products };
      delete newProducts[typeId];
      setProducts(newProducts);
    }
  };

  return (
    <div className="product-management">
      <div className="management-header">
        <h2>Управление товарами</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowTypeForm(true)}
        >
          Добавить тип товара
        </button>
      </div>

      <div className="product-types">
        <h3>Типы товаров</h3>
        <div className="types-list">
          {productTypes.map(type => (
            <div key={type.id} className="type-item">
              <div className="type-info">
                <h4>{type.name}</h4>
                <p>{type.description}</p>
                <span className="product-count">
                  Товаров: {products[type.id]?.length || 0}
                </span>
              </div>
              
              <div className="type-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setEditingType(type)}
                >
                  Редактировать
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDeleteType(type.id)}
                >
                  Удалить
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowProductForm(type)}
                >
                  Добавить товар
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Форма для типа товара */}
      {showTypeForm && (
        <ProductTypeForm
          type={null}
          onSubmit={handleAddType}
          onClose={() => setShowTypeForm(false)}
        />
      )}

      {editingType && (
        <ProductTypeForm
          type={editingType}
          onSubmit={handleEditType}
          onClose={() => setEditingType(null)}
        />
      )}

      {/* Форма для товара */}
      {showProductForm && (
        <ProductForm
          type={showProductForm}
          onClose={() => setShowProductForm(false)}
          onSubmit={(productData) => {
            const typeId = showProductForm.id;
            setProducts(prev => ({
              ...prev,
              [typeId]: [...(prev[typeId] || []), { ...productData, id: Date.now() }]
            }));
            setShowProductForm(false);
          }}
        />
      )}
    </div>
  );
};

// Компонент формы для типа товара
const ProductTypeForm = ({ type, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: type?.name || '',
    description: type?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{type ? 'Редактировать тип' : 'Добавить тип товара'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название типа:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {type ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент формы для товара
const ProductForm = ({ type, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    materials: [''],
    sizes: ['']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseInt(formData.price)
    });
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, '']
    }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Добавить товар для {type.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название товара:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Цена:</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Добавить товар
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManagement;