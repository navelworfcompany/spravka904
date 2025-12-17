import { useContext } from 'react';
import { OperatorContext } from '../context/OperatorContext';

export const useProducts = () => {
  const context = useContext(OperatorContext);
  
  if (!context) {
    throw new Error('useProducts must be used within OperatorProvider');
  }
  
  console.log('🔍 useProducts - проверяем контекст:', {
    hasSetSelectedProductType: typeof context.setSelectedProductType === 'function',
    selectedProductType: context.selectedProductType,
    productTypesCount: context.productTypes?.length
  });
  
  const {
    productTypes,
    products,
    productsLoading,
    selectedProductType,
    setSelectedProductType,
    loadProductsByType,
    refreshProductTypes,
    addSuccessNotification,
    addErrorNotification
  } = context;
  
  return {
    productTypes: productTypes || [],
    products: products || [],
    loading: productsLoading,
    selectedProductType,
    setSelectedProductType: setSelectedProductType || (() => console.warn('setSelectedProductType not available')), // fallback
    loadProductsByType,
    refreshProductTypes,
    addSuccessNotification,
    addErrorNotification
  };
};