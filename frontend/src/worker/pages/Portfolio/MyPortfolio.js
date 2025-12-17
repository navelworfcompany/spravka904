import React, { useEffect, useState } from 'react';
import { useWorker } from '../../hooks/useWorker';
import { useNotifications } from '../../../context/NotificationContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Button from '../../../components/common/Button';
import PriceModal from './components/PriceModal';
import './MyPortfolio.css';

import defaultTypeImage from '../../../img/default-type.png';
import defaultProductImage from '../../../img/default-product.png';

const MyPortfolio = () => {
  const {
    portfolio,
    availableProducts,
    loading,
    productsLoading,
    loadPortfolio,
    loadAvailableProducts,
    addToPortfolio,
    removeFromPortfolio
  } = useWorker();
  
  const { showNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceModal, setPriceModal] = useState({
    isOpen: false,
    product: null
  });
  const [retryCount, setRetryCount] = useState(0);

  const getImageUrl = (imagePath, fallbackType = 'product') => {
    if (!imagePath) {
      return fallbackType === 'type' ? defaultTypeImage : defaultProductImage;
    }

    let cleanPath = imagePath;
    if (imagePath.includes('/uploads/products/')) {
      cleanPath = imagePath.replace('/uploads/products/', '/img/products/');
    } else if (imagePath.includes('/uploads/types/')) {
      cleanPath = imagePath.replace('/uploads/types/', '/img/types/');
    } else if (imagePath.includes('/uploads/')) {
      cleanPath = imagePath.replace('/uploads/', '/img/');
    }

    if (cleanPath.startsWith('http')) return cleanPath;

    if (cleanPath.startsWith('/')) {
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : window.location.origin;
      return `${baseUrl}${cleanPath}`;
    }

    return fallbackType === 'type' ? defaultTypeImage : defaultProductImage;
  };

  const getProductImageUrl = (product) => {
    if (product.image_url) {
      return getImageUrl(product.image_url, 'product');
    }
    
    if (product.product_type?.image_url) {
      return getImageUrl(product.product_type.image_url, 'type');
    }
    
    return defaultProductImage;
  };

  const handleImageError = (e, fallbackType = 'product') => {
    e.target.src = fallbackType === 'type' ? defaultTypeImage : defaultProductImage;
    e.target.onerror = null;
  };

  useEffect(() => {
    
    const loadData = async () => {
      try {
        await loadPortfolio();
        await loadAvailableProducts();
      } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
        
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        }
      }
    };
    
    loadData();
  }, [loadPortfolio, loadAvailableProducts, retryCount, showNotification]);

  const handleAddClick = (product) => {
    setPriceModal({
      isOpen: true,
      product
    });
  };

  const handlePriceSubmit = async (price) => {
    try {
      await addToPortfolio(priceModal.product.id, price);
      showNotification('Товар добавлен в портфолио', 'success');
      setPriceModal({ isOpen: false, product: null });
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Ошибка при добавлении товара', 
        'error'
      );
    }
  };

  const handleRemoveFromPortfolio = async (productId) => {
    try {
      await removeFromPortfolio(productId);
      showNotification('Товар удален из портфолио', 'success');
    } catch (error) {
      showNotification('Ошибка при удалении товара', 'error');
    }
  };

  const filteredAvailableProducts = availableProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPortfolioProducts = portfolio.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && portfolio.length === 0) {
    return (
      <div className="portfolio-loading">
        <LoadingSpinner text="Загрузка портфолио..." />
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>Мои товары</h1>
        <p>Управление товарами, с которыми вы работаете</p>
        
        <div className="portfolio-stats">
          <div className="stat-porwok-item">
            <span className="stat-number">{portfolio.length}</span>
            <span className="stat-label">В портфолио</span>
          </div>
          <div className="stat-porwok-item">
            <span className="stat-number">{availableProducts.length}</span>
            <span className="stat-label">Доступно</span>
          </div>
        </div>
      </div>

      <div className="portfolio-search">
        <input
          type="text"
          placeholder="Поиск товаров по названию или типу..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search"
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>

      <div className="portfolio-sections">
        <section className="portfolio-section">
          <h2>Мои товары ({filteredPortfolioProducts.length})</h2>
          <p>Товары, которые вы добавили в свое портфолио</p>
          
          {filteredPortfolioProducts.length === 0 ? (
            <div className="empty-portfolio">
              <div className="empty-icon">💼</div>
              <h3>Портфолио пусто</h3>
              <p>Добавьте товары из доступного списка</p>
            </div>
          ) : (
            <div className="products-porwok-grid">
              {filteredPortfolioProducts.map(product => (
                <div key={product.id} className="portfolio-product-card">
                  <div className="product-image-container">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => handleImageError(e, 'product')}
                      loading="lazy"
                    />
                  </div>
                  <div className="product-porwok-info">
                    <h4>{product.name}</h4>
                    <p className="product-porwok-type">
                      {product.product_type?.name || product.type_name || 'Без типа'}
                    </p>
                    {product.description && (
                      <p className="product-porwok-description">{product.description}</p>
                    )}
                    {product.worker_price && (
                      <p className="worker-price">Ваша цена: {product.worker_price} ₽</p>
                    )}
                    {product.price && (
                      <p className="base-price">Базовая цена: {product.price} ₽</p>
                    )}
                  </div>
                  <div className="product-actions">
                    <Button
                      variant="danger"
                      size="small"
                      className="btn-pokwok"
                      onClick={() => handleRemoveFromPortfolio(product.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="portfolio-section">
          <div className="section-header">
            <h2>Доступные товары ({filteredAvailableProducts.length})</h2>
            <Button
              size="small"             
              onClick={loadAvailableProducts}
              disabled={productsLoading}
            >
              {productsLoading ? 'Обновление...' : 'Обновить'}
            </Button>
          </div>
          
          <p>Выберите товары для добавления в портфолио</p>

          {productsLoading && (
            <div className="products-loading">
              <LoadingSpinner text="Загрузка товаров..." />
            </div>
          )}

          {filteredAvailableProducts.length === 0 && !productsLoading ? (
            <div className="no-products">
              <div className="no-products-icon">📦</div>
              <h3>Нет доступных товаров</h3>
              <p>Все товары добавлены в портфолио</p>
            </div>
          ) : (
            <div className="products-porwok-grid">
              {filteredAvailableProducts.map((product) => (
                <div key={product.id} className="available-product-card">
                  <div className="product-image-container">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => handleImageError(e, 'product')}
                      loading="lazy"
                    />
                  </div>
                  <div className="product-porwok-info">
                    <h4>{product.name}</h4>
                    <p className="product-porwok-type">
                      {product.product_type?.name || product.type_name || 'Без типа'}
                    </p>
                    {product.description && (
                      <p className="product-porwok-description">{product.description}</p>
                    )}
                    {product.price && (
                      <p className="product-porwok-price">Базовая цена: от {product.price} ₽</p>
                    )}
                    {product.materials && product.materials.length > 0 && (
                      <div className="product-porwok-materials">
                        <strong>Материалы:</strong> {Array.isArray(product.materials) ? product.materials.join(', ') : product.materials}
                      </div>
                    )}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="product-porwok-sizes">
                        <strong>Размеры:</strong> {Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes}
                      </div>
                    )}
                  </div>
                  <div className="product-actions">
                    <Button
                      size="small"
                      className="btn-pokwok"
                      onClick={() => handleAddClick(product)}
                    >
                      Добавить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <PriceModal
        isOpen={priceModal.isOpen}
        product={priceModal.product}
        onClose={() => setPriceModal({ isOpen: false, product: null })}
        onSubmit={handlePriceSubmit}
      />
    </div>
  );
};

export default MyPortfolio;