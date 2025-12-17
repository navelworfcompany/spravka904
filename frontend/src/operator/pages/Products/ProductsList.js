import React, { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useOperatorNotifications } from '../../hooks/useOperatorNotifications';
import OperatorProductTypeCard from './OperatorProductTypeCard';
import OperatorProductCard from './OperatorProductCard';
import './ProductsList.css';

const ProductsList = () => {
  console.log('🏪 ProductsList рендерится');
  
  const {
    productTypes,
    loading: typesLoading,
    products,
    productsLoading,
    selectedProductType,
    setSelectedProductType,
    loadProductsByType,
    refreshProductTypes
  } = useProducts();

  const { addErrorNotification } = useOperatorNotifications();

  const [displayProducts, setDisplayProducts] = useState([]);
  const [displayLoading, setDisplayLoading] = useState(false);
  const [localSelectedType, setLocalSelectedType] = useState(null);

  // Синхронизируем локальное состояние с контекстом
  useEffect(() => {
    if (selectedProductType && selectedProductType.id) {
      setLocalSelectedType(selectedProductType);
    }
  }, [selectedProductType]);

  // Загружаем товары при выборе типа
  useEffect(() => {
    const fetchProducts = async () => {
      if (localSelectedType && localSelectedType.id) {
        console.log('📡 Загрузка товаров для типа ID:', localSelectedType.id);
        setDisplayLoading(true);
        try {
          await loadProductsByType(localSelectedType.id);
        } catch (error) {
          console.error('Ошибка при загрузке товаров:', error);
          addErrorNotification('Ошибка загрузки товаров');
        } finally {
          setDisplayLoading(false);
        }
      } else {
        setDisplayProducts([]);
      }
    };

    fetchProducts();
  }, [localSelectedType, loadProductsByType, addErrorNotification]);

  // Обновляем локальные товары
  useEffect(() => {
    if (products && Array.isArray(products)) {
      setDisplayProducts(products);
    }
  }, [products]);

  const handleViewProducts = (productType) => {
    console.log('👁️ Нажата кнопка просмотра товаров для типа:', {
      id: productType.id,
      name: productType.name,
      type: typeof productType.id
    });
    
    if (!productType || !productType.id) {
      console.error('❌ Неверный тип товара:', productType);
      addErrorNotification('Ошибка: неверный тип товара');
      return;
    }
    
    // Устанавливаем в контекст
    if (setSelectedProductType) {
      setSelectedProductType(productType);
    }
    
    // И локально
    setLocalSelectedType(productType);
  };

  const handleBackToTypes = () => {
    console.log('🔙 Возврат к типам товаров');
    if (setSelectedProductType) {
      setSelectedProductType(null);
    }
    setLocalSelectedType(null);
    setDisplayProducts([]);
  };

  if (typesLoading && productTypes.length === 0) {
    return (
      <div className="operator-products-loading">
        <div className="operator-loading-spinner">⟳</div>
        <p>Загрузка типов товаров...</p>
      </div>
    );
  }

  const currentType = localSelectedType || selectedProductType;

  return (
    <div className="operator-products-page">
      {!currentType ? (
        // Страница типов товаров
        <>
          <div className="operator-page-header">
            <div className="operator-header-content">
              <h1>Каталог памятников</h1>
              <p>Просмотр типов товаров и их характеристик</p>
            </div>
            
            <div className="operator-header-stats">
              <span className="operator-types-count">
                Типов товаров: <strong>{productTypes.length}</strong>
              </span>
              <button
                className="operator-refresh-btn"
                onClick={refreshProductTypes}
                disabled={typesLoading}
                title="Обновить"
              >
                {typesLoading ? '⟳' : '🔄'}
              </button>
            </div>
          </div>

          {productTypes.length > 0 ? (
            <div className="operator-product-types-grid">
              {productTypes.map(type => {
                // Проверяем данные типа
                if (!type || !type.id) {
                  console.warn('⚠️ Пропущен невалидный тип товара:', type);
                  return null;
                }
                
                return (
                  <OperatorProductTypeCard
                    key={type.id}
                    productType={type}
                    onViewProducts={handleViewProducts}
                  />
                );
              })}
            </div>
          ) : (
            <div className="operator-no-product-types">
              <div className="operator-no-types-icon">🛍️</div>
              <h3>Типы товаров не найдены</h3>
              <p>В системе пока нет типов товаров</p>
            </div>
          )}
        </>
      ) : (
        // Страница товаров выбранного типа
        <>
          <div className="operator-page-header">
            <div className="operator-header-content">
              <button 
                className="operator-back-button"
                onClick={handleBackToTypes}
              >
                ← Назад к типам
              </button>
              <h1>Товары: {currentType.name || 'Неизвестный тип'}</h1>
              <p>{currentType.description || 'Товары этого типа'}</p>
            </div>
            
            <div className="operator-header-stats">
              <span className="operator-products-count">
                Товаров: <strong>{displayProducts.length}</strong>
              </span>
              <button
                className="operator-refresh-btn"
                onClick={() => currentType.id && loadProductsByType(currentType.id)}
                disabled={displayLoading}
                title="Обновить товары"
              >
                {displayLoading ? '⟳' : '🔄'}
              </button>
            </div>
          </div>

          <div className="operator-products-info">
            <span>
              Товаров в категории: <strong>{displayProducts.length}</strong>
            </span>
            {displayLoading && <span className="operator-loading-text"> (Загрузка...)</span>}
          </div>

          {displayLoading ? (
            <div className="operator-products-loading">
              <div className="operator-loading-spinner">⟳</div>
              <p>Загрузка товаров...</p>
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="operator-products-grid">
              {displayProducts.map(product => (
                <OperatorProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="operator-no-products">
              <div className="operator-no-products-icon">📦</div>
              <h3>Товары не найдены</h3>
              <p>В этом типе товаров пока нет товаров</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsList;