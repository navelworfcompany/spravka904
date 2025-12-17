// src/admin/pages/Products/ProductTypes.js
import React, { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductTypeCard from './ProductTypeCard';
import ProductCard from './ProductCard';
import CreateProductTypeModal from './CreateProductTypeModal';
import CreateProductModal from './CreateProductModal';
import './ProductTypes.css';

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001/api'
  : '/api';

const ProductTypes = () => {
  const {
    productTypes,
    loading,
    selectedType,
    setSelectedType,
    createProductType,
    updateProductType,
    deleteProductType,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProducts();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);

  const loadProductsByType = async (type_id) => {
    if (!type_id) {
      setProducts([]);
      return;
    }

    setProductsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/type/${type_id}`);
      if (response.ok) {
        const responseData = await response.json();
        const productsData = responseData.products || responseData.data || responseData;

        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedType) {
      loadProductsByType(selectedType.id);
    } else {
      setProducts([]);
    }
  }, [selectedType]);

  const handleViewProducts = (productType) => {
    setSelectedType(productType);
  };

  const handleBackToTypes = () => {
    setSelectedType(null);
    setProducts([]);
  };

  const handleCreateProductType = async (data) => {
    await createProductType(data);
    setIsCreateTypeModalOpen(false);
  };

  const handleCreateProduct = async (newProduct) => {
    try {
      const createdProduct = await createProduct({
        ...newProduct,
        type_id: selectedType.id
      });

      setIsCreateProductModalOpen(false);

      // Вместо loadProductsByType, просто добавляем новый товар в список
      setProducts(prev => [...prev, createdProduct]);

    } catch (error) {
      console.error('Ошибка при создании товара:', error);
      alert('Не удалось создать товар. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleUpdateProduct = async (id, data) => {
    await updateProduct(id, data);
    loadProductsByType(selectedType.id);
  };

  const handleDeleteProduct = async (productId) => {
    // Сохраняем удаляемый товар
    const productToDelete = products.find(p => p.id === productId);

    // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: мгновенное удаление из UI
    setProducts(prev => prev.filter(p => p.id !== productId));

    try {
      // API запрос выполняется в фоне
      await deleteProduct(productId);
      // Успех - ничего не делаем, товар уже удален из UI
    } catch (error) {
      console.error('Ошибка при удалении товара:', error);

      // ВОССТАНАВЛИВАЕМ товар при ошибке
      if (productToDelete) {
        setProducts(prev => [...prev, productToDelete].sort((a, b) => a.id - b.id));
      }

      // Показываем пользователю ошибку
      alert('Не удалось удалить товар. Пожалуйста, попробуйте еще раз.');
    }
  };

  if (loading && productTypes.length === 0) {
    return (
      <div className="products-loading">
        <div className="loading-spinner">⟳</div>
        <p>Загрузка типов товаров...</p>
      </div>
    );
  }

  return (
    <div className="products-page-adm-pro">
      {!selectedType ? (
        // Страница типов товаров
        <>
          <div className="page-header-adm-pro">
            <div className="header-content-adm-pro">
              <h1>Типы товаров</h1>
              <p>Управление категориями и типами товаров</p>
            </div>

            <div className="header-actions">
              <button
                className="create-type-btn"
                onClick={() => setIsCreateTypeModalOpen(true)}
              >
                + Создать тип
              </button>
            </div>
          </div>

          {productTypes.length > 0 ? (
            <div className="product-types-grid">
              {productTypes.map(type => (
                <ProductTypeCard
                  key={type.id}
                  productType={type}
                  onUpdate={updateProductType}
                  onDelete={deleteProductType}
                  onViewProducts={handleViewProducts}
                />
              ))}
            </div>
          ) : (
            <div className="no-product-types">
              <div className="no-types-icon">🛍️</div>
              <h3>Типы товаров не найдены</h3>
              <p>Создайте первый тип товаров для начала работы</p>
              <button
                className="create-type-btn"
                onClick={() => setIsCreateTypeModalOpen(true)}
              >
                Создать тип товара
              </button>
            </div>
          )}
        </>
      ) : (
        // Страница товаров выбранного типа
        <>
          <div className="page-header-adm-pro">
            <div className="header-content-adm-pro">
              <button
                className="back-button"
                onClick={handleBackToTypes}
              >
                ← Назад к типам
              </button>
              <h1>Товары: {selectedType.name}</h1>
              <p>{selectedType.description || 'Товары этого типа'}</p>
            </div>

            <div className="header-actions">
              <button
                className="create-product-btn"
                onClick={() => setIsCreateProductModalOpen(true)}
              >
                + Добавить товар
              </button>
            </div>
          </div>

          <div className="products-info">
            <span>
              Товаров в категории: <strong>{products.length}</strong>
            </span>
            {productsLoading && <span className="loading-text"> (Загрузка...)</span>}
          </div>

          {productsLoading ? (
            <div className="products-loading">
              <div className="loading-spinner">⟳</div>
              <p>Загрузка товаров...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <div className="no-products-icon">📦</div>
              <h3>Товары не найдены</h3>
              <p>В этом типе товаров пока нет товаров</p>
              <button
                className="create-product-btn"
                onClick={() => setIsCreateProductModalOpen(true)}
              >
                Добавить первый товар
              </button>
            </div>
          )}
        </>
      )}

      {/* Модальные окна */}
      <CreateProductTypeModal
        isOpen={isCreateTypeModalOpen}
        onClose={() => setIsCreateTypeModalOpen(false)}
        onCreate={handleCreateProductType}
      />

      <CreateProductModal
        isOpen={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        onCreate={handleCreateProduct}
        productTypes={productTypes}
        selectedType={selectedType}
        onSuccess={(product) => {
          // Добавляем товар в список после успешного создания
          setProducts(prev => [...prev, product]);
        }}
      />
    </div>
  );
};

export default ProductTypes;