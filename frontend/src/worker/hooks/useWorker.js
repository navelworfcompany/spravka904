// src/worker/hooks/useWorker.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { applicationsAPI, workerAPI } from '../../services/api';

const WorkerContext = createContext();

export const useWorker = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorker must be used within a WorkerProvider');
  }
  return context;
};

export const WorkerProvider = ({ children }) => {
  const [applications, setApplications] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api' 
    : '/api';

  // НОВЫЙ МЕТОД: Загрузка всех товаров через прямой fetch
const loadAvailableProducts = useCallback(async () => {
  try {
    setProductsLoading(true);
    console.log('📦 [WORKER] Loading products by types...');
    
    // Сначала получаем все типы
    const typesResponse = await fetch(`${API_BASE}/products/types`);
    if (!typesResponse.ok) throw new Error('Failed to load types');
    
    const typesData = await typesResponse.json();
    const types = typesData.types || typesData.data || [];
    
    console.log(`📦 Found ${types.length} types`);
    
    // Загружаем товары для каждого типа
    let allProducts = [];
    
    for (const type of types) {
      try {
        const productsResponse = await fetch(`${API_BASE}/products/type/${type.id}?limit=50`);
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const typeProducts = productsData.products || productsData.data || [];
          allProducts = [...allProducts, ...typeProducts];
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load products for type ${type.id}:`, error);
      }
    }
    
    console.log(`✅ [WORKER] Loaded ${allProducts.length} products from ${types.length} types`);
    setAvailableProducts(allProducts);
    
    return allProducts;
  } catch (error) {
    console.error('❌ [WORKER] Error loading products by types:', error);
    setAvailableProducts([]);
    throw error;
  } finally {
    setProductsLoading(false);
  }
}, [API_BASE]);

  // Загрузка портфолио работника
  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      console.log('💼 [WORKER] Loading portfolio...');
      const response = await workerAPI.getMyPortfolio();
      
      let portfolioData = [];
      if (response && response.success) {
        portfolioData = response.data?.portfolio || response.data || response.portfolio || [];
      }

      if (!Array.isArray(portfolioData)) {
        portfolioData = [];
      }

      console.log(`✅ [WORKER] Loaded ${portfolioData.length} portfolio items`);
      setPortfolio(portfolioData);
      
      return response;
    } catch (error) {
      console.error('❌ [WORKER] Error loading portfolio:', error);
      setPortfolio([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Добавление товара в портфолио
  const addToPortfolio = useCallback(async (productId, price) => {
    try {
      console.log('➕ [WORKER] Adding product to portfolio:', { productId, price });
      const response = await workerAPI.addToPortfolio(productId, price);
      
      if (response && response.success) {
        const newProduct = response.data?.product || { 
          id: productId, 
          worker_price: price,
          // Добавляем базовую информацию о товаре
          ...availableProducts.find(p => p.id === productId)
        };
        
        // Добавляем в портфолио
        setPortfolio(prev => [...prev, newProduct]);
        
        // Удаляем из доступных товаров
        setAvailableProducts(prev => 
          prev.filter(product => product.id !== productId)
        );
        
        console.log('✅ [WORKER] Product added to portfolio');
        return response;
      }
      throw new Error(response?.message || 'Ошибка добавления в портфолио');
    } catch (error) {
      console.error('❌ [WORKER] Error adding to portfolio:', error);
      throw error;
    }
  }, [availableProducts]);

  // Удаление товара из портфолио
  const removeFromPortfolio = useCallback(async (productId) => {
    try {
      console.log('➖ [WORKER] Removing product from portfolio:', productId);
      const response = await workerAPI.removeFromPortfolio(productId);
      
      if (response && response.success) {
        const removedProduct = portfolio.find(p => p.id === parseInt(productId));
        
        // Удаляем из портфолио
        setPortfolio(prev => prev.filter(item => item.id !== parseInt(productId)));
        
        // Добавляем обратно в доступные товары (если найден товар)
        if (removedProduct) {
          setAvailableProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            if (!existingIds.has(removedProduct.id)) {
              const productWithoutWorkerPrice = { ...removedProduct };
              delete productWithoutWorkerPrice.worker_price;
              return [...prev, productWithoutWorkerPrice];
            }
            return prev;
          });
        }
        
        console.log('✅ [WORKER] Product removed from portfolio');
        return response;
      }
      throw new Error(response?.message || 'Ошибка удаления из портфолио');
    } catch (error) {
      console.error('❌ [WORKER] Error removing from portfolio:', error);
      throw error;
    }
  }, [portfolio]);

  // Фильтрация: доступные товары = все товары минус те, что в портфолио
  const availableProductsFiltered = availableProducts.filter(product => 
    !portfolio.some(p => p.id === product.id)
  );

  const value = {
    applications,
    portfolio,
    availableProducts: availableProductsFiltered,
    allAvailableProducts: availableProducts, // для отладки
    loading,
    productsLoading,
    loadApplications: useCallback(async (filters = {}) => {
      // существующая реализация
      setLoading(true);
      try {
        const response = await applicationsAPI.getWorkerApplications(filters);
        let applicationsData = [];
        if (response && response.success) {
          applicationsData = response.data?.applications || response.data || response.applications || [];
        }
        setApplications(applicationsData);
        return response;
      } catch (error) {
        console.error('Error loading applications:', error);
        setApplications([]);
        throw error;
      } finally {
        setLoading(false);
      }
    }, []),
    loadPortfolio,
    loadAvailableProducts,
    addToPortfolio,
    removeFromPortfolio,
    respondToApplication: useCallback(async (applicationId, responseData) => {
      // существующая реализация
      try {
        const response = await applicationsAPI.respondToApplication(applicationId, responseData);
        if (response && response.success) {
          const updatedApp = response.data?.application || { id: applicationId, ...responseData };
          setApplications(prev =>
            prev.map(app =>
              app.id === applicationId ? updatedApp : app
            )
          );
        }
        return response;
      } catch (error) {
        console.error('Error responding to application:', error);
        throw error;
      }
    }, []),
    stats: {
      totalApplications: applications.length,
      portfolioCount: portfolio.length,
      availableProductsCount: availableProductsFiltered.length
    }
  };

  return (
    <WorkerContext.Provider value={value}>
      {children}
    </WorkerContext.Provider>
  );
};