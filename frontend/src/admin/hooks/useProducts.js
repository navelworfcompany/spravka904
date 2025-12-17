// src/admin/hooks/useProducts.js
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminAPI';
import { useAdmin } from './useAdmin';

export const useProducts = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const { addNotification } = useAdmin();

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProductTypes();
      setProductTypes(response.types || []);
    } catch (error) {
      console.error('Error loading product types:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить типы товаров'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (type_id = null) => {
    try {
      setLoading(true);
      const params = type_id ? { type_id } : {};
      const response = await adminAPI.getProducts(params);
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить товары'
      });
    } finally {
      setLoading(false);
    }
  };

  const createProductType = async (data) => {
    try {
      await adminAPI.createProductType(data);
      await loadProductTypes();
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Тип товара создан'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось создать тип товара'
      });
      throw error;
    }
  };

  const updateProductType = async (id, data) => {
    try {
      await adminAPI.updateProductType(id, data);
      await loadProductTypes();
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Тип товара обновлен'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось обновить тип товара'
      });
      throw error;
    }
  };

  const deleteProductType = async (id) => {
    try {
      await adminAPI.deleteProductType(id);
      await loadProductTypes();
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Тип товара удален'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить тип товара'
      });
      throw error;
    }
  };

  const createProduct = async (data) => {
    try {
      await adminAPI.createProduct(data);
      await loadProducts(selectedType?.id);
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Товар создан'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось создать товар'
      });
      throw error;
    }
  };

  const updateProduct = async (id, data) => {
    try {
      await adminAPI.updateProduct(id, data);
      await loadProducts(selectedType?.id);
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Товар обновлен'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось обновить товар'
      });
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await adminAPI.deleteProduct(id);
      await loadProducts(selectedType?.id);
      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Товар удален'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить товар'
      });
      throw error;
    }
  };

  useEffect(() => {
    loadProductTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadProducts(selectedType.id);
    } else {
      setProducts([]);
    }
  }, [selectedType]);

  return {
    productTypes,
    products,
    loading,
    selectedType,
    setSelectedType,
    createProductType,
    updateProductType,
    deleteProductType,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProductTypes: loadProductTypes,
    refreshProducts: () => loadProducts(selectedType?.id)
  };
};