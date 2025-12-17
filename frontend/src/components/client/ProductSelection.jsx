import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ProductSelection.css';
import { validation, formatPhone, cleanPhone } from '../../utils/validation';

import defaultTypeImage from '../../img/default-type.png';
import defaultProductImage from '../../img/default-product.png';

const ProductSelection = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState('type');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [options, setOptions] = useState({
    material: '',
    size: '',
    comment: ''
  });
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);

  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState({});
  const [materials, setMaterials] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [visibleTypesCount, setVisibleTypesCount] = useState(9);
  const [visibleProductsCount, setVisibleProductsCount] = useState(9);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreTypes, setHasMoreTypes] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState({});

  const [minPrices, setMinPrices] = useState({});

  const typesContainerRef = useRef(null);
  const productsContainerRef = useRef(null);

  const API_BASE = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api'
    : '/api';

  const getProductMinPrice = useCallback(async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/products/${productId}/min-price`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.min_price !== null) {
          return data.data.min_price;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }, [API_BASE]);

  const loadMinPrices = useCallback(async (productsList) => {
    if (!productsList || productsList.length === 0) return;

    const prices = {};
    const promises = productsList.map(async (product) => {
      const minPrice = await getProductMinPrice(product.id);
      if (minPrice !== null) {
        prices[product.id] = minPrice;
      }
    });

    await Promise.all(promises);

    setMinPrices(prev => ({ ...prev, ...prices }));
  }, [getProductMinPrice]);

  const getDisplayPrice = useCallback((product) => {
    if (minPrices[product.id]) {
      return {
        price: minPrices[product.id],
        text: `Цена от ${minPrices[product.id].toLocaleString()} руб.`,
        hasPrice: true,
        source: 'worker'
      };
    }

    if (product.price && product.price > 0) {
      return {
        price: product.price,
        text: `Цена от ${product.price.toLocaleString()} руб.`,
        hasPrice: true,
        source: 'base'
      };
    }

    return {
      price: null,
      text: 'Цена по запросу',
      hasPrice: false,
      source: 'none'
    };
  }, [minPrices]);

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

  const updateSizesForMaterial = useCallback((materialValue) => {
    const selectedMaterial = materials.find(m => m.value === materialValue);
    if (selectedMaterial && selectedMaterial.sizes) {
      setSizes(selectedMaterial.sizes);

      if (options.size && !selectedMaterial.sizes.some(size => size.value === options.size)) {
        setOptions(prev => ({ ...prev, size: '' }));
      }
    }
  }, [materials, options.size]);

  const loadProductData = useCallback(async () => {
    if (!isOpen) return;

    setLoadingData(true);
    try {
      const typesResponse = await fetch(`${API_BASE}/products/types`);
      if (typesResponse.ok) {
        const responseData = await typesResponse.json();
        const typesData = responseData.types || responseData.data || responseData;

        if (Array.isArray(typesData)) {
          setProductTypes(typesData);
          setHasMoreTypes(typesData.length > 9);
        } else {
          setProductTypes([]);
          setHasMoreTypes(false);
        }
      } else {
        setProductTypes([]);
        setHasMoreTypes(false);
      }

      const materialsData = [
        {
          value: 'Гранит',
          name: 'Гранит Черный (Габбро-Диабаз)',
          sizes: [
            { value: '80x45x6', name: '80x45x6' },
            { value: '100x50x6', name: '100x50x6' },
            { value: '100x50x8', name: '100x50x8' },
            { value: '110x55x8', name: '110x55x8' },
            { value: '120x60x8', name: '120x60x8' },
            { value: '140x70x8', name: '140x70x8' },
            { value: '140x70x10', name: '140x70x10' },
            { value: '150x75x8', name: '150x75x8' },
            { value: '150x75x10', name: '150x75x10' }
          ]
        },
        {
          value: 'Мрамор',
          name: 'Мрамор (Уфалей)',
          sizes: [
            { value: '80x45x6', name: '80x45x6' },
            { value: '100x50x8', name: '100x50x8' },
            { value: '120x60x8', name: '120x60x8' }
          ]
        }
      ];

      setMaterials(materialsData);

      setSizes(materialsData[0].sizes);

    } catch (error) {
      setServerAvailable(false);
      setProductTypes([]);
      setHasMoreTypes(false);
    } finally {
      setLoadingData(false);
    }
  }, [isOpen, API_BASE]);

  const loadProductsByType = useCallback(async (type_id) => {
    try {
      const response = await fetch(`${API_BASE}/products/type/${type_id}`);
      if (response.ok) {
        const responseData = await response.json();
        const productsData = responseData.products || responseData.data || responseData;

        if (Array.isArray(productsData)) {
          setProducts(prev => ({
            ...prev,
            [type_id]: productsData
          }));
          setHasMoreProducts(prev => ({
            ...prev,
            [type_id]: productsData.length > 9
          }));

          loadMinPrices(productsData);
        } else {
          setProducts(prev => ({
            ...prev,
            [type_id]: []
          }));
          setHasMoreProducts(prev => ({
            ...prev,
            [type_id]: false
          }));
        }
      } else {
        setHasMoreProducts(prev => ({
          ...prev,
          [type_id]: false
        }));
      }
    } catch (error) {
      setHasMoreProducts(prev => ({
        ...prev,
        [type_id]: false
      }));
    }
  }, [API_BASE, loadMinPrices]);

  useEffect(() => {
    if (isOpen) {
      loadProductData();
      setVisibleTypesCount(9);
      setVisibleProductsCount(9);
    }
  }, [isOpen, loadProductData]);

  useEffect(() => {
    if (selectedType && !products[selectedType.id]) {
      loadProductsByType(selectedType.id);
      setVisibleProductsCount(9);
    }
  }, [selectedType, products, loadProductsByType]);

  const loadMoreTypes = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleTypesCount(prev => {
        const newCount = prev + 9;
        setHasMoreTypes(newCount < productTypes.length);
        return newCount;
      });
      setLoadingMore(false);
    }, 500);
  }, [productTypes.length]);

  const loadMoreProducts = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleProductsCount(prev => {
        const newCount = prev + 9;
        const currentProducts = products[selectedType.id] || [];

        const additionalProducts = currentProducts.slice(prev, newCount);
        if (additionalProducts.length > 0) {
          loadMinPrices(additionalProducts);
        }

        setHasMoreProducts(prevState => ({
          ...prevState,
          [selectedType.id]: newCount < currentProducts.length
        }));
        return newCount;
      });
      setLoadingMore(false);
    }, 500);
  }, [selectedType, products, loadMinPrices]);

  useEffect(() => {
    const container = typesContainerRef.current;
    if (!container || step !== 'type' || !hasMoreTypes || loadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMoreTypes();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [step, hasMoreTypes, loadingMore, loadMoreTypes]);

  useEffect(() => {
    const container = productsContainerRef.current;
    if (!container || step !== 'product' || !hasMoreProducts[selectedType?.id] || loadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMoreProducts();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [step, selectedType, hasMoreProducts, loadingMore, loadMoreProducts]);

  const getMaterialName = (materialKey) => {
    const material = materials.find(m => m.value === materialKey);
    return material ? material.name : materialKey;
  };

  const getSizeName = (sizeKey) => {
    const size = sizes.find(s => s.value === sizeKey);
    return size ? size.name : sizeKey;
  };

  const resetForm = useCallback(() => {
    setStep('type');
    setSelectedType(null);
    setSelectedProduct(null);
    setOptions({ material: '', size: '', comment: '' });
    setContactData({ name: '', phone: '', email: '' });
    setErrors({});
    setTouched({});
    setIsFormValid(false);
    setIsLoading(false);
    setVisibleTypesCount(9);
    setVisibleProductsCount(9);
    setMinPrices({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  useEffect(() => {
    const isValid = options.material !== '' && options.size !== '' &&
      !errors.material && !errors.size;
    setIsFormValid(isValid);
  }, [options.material, options.size, errors.material, errors.size]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const validateOptionField = useCallback((field, value) => {
    let error = '';
    if (field === 'material' || field === 'size') {
      if (!value || value === '') {
        error = `Пожалуйста, выберите ${field === 'material' ? 'материал' : 'размер'}`;
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const handleOptionChange = useCallback((field, value) => {
    setOptions(prev => ({ ...prev, [field]: value }));

    if (field === 'material') {
      updateSizesForMaterial(value);
    }

    if (touched[field]) {
      validateOptionField(field, value);
    }
  }, [touched, validateOptionField, updateSizesForMaterial]);

  const handleOptionBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateOptionField(field, options[field]);
  }, [options, validateOptionField]);

  const handleSubmitOptions = useCallback(() => {
    const newTouched = {
      material: true,
      size: true
    };
    setTouched(newTouched);

    validateOptionField('material', options.material);
    validateOptionField('size', options.size);

    const isValid = options.material !== '' && options.size !== '';
    if (isValid) {
      setStep('contact');
    }
  }, [options.material, options.size, validateOptionField]);

  const sendApplication = useCallback(async (data) => {
    try {
      const API_URL = `${API_BASE}/applications/public`;

      const requestData = {
        name: data.contact.name,
        phone: data.contact.phone,
        email: data.contact.email,
        product_type: data.productType?.name || 'Не указан',
        product: data.product?.name || 'Не указан',
        material: data.material,
        size: data.size,
        comment: data.comment || '',
        product_type_id: data.productType?.id || null,
        product_id: data.product?.id || null
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      return responseData;

    } catch (error) {
      throw error;
    }
  }, [API_BASE]);

  const handleContactChange = (field, value) => {
    let processedValue = field === 'phone' ? formatPhone(value) : value;
    setContactData(prev => ({ ...prev, [field]: processedValue }));
    if (touched[field]) {
      validateContactField(field, processedValue);
    }
  };

  const handleContactBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateContactField(field, contactData[field]);
  };

  const validateContactField = useCallback((field, value) => {
    let error = null;
    switch (field) {
      case 'name': error = validation.required(value, 'Имя') || validation.name(value); break;
      case 'phone': error = validation.required(value, 'Телефон') || validation.phone(value); break;
      case 'email': error = validation.required(value, 'Email') || validation.email(value); break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const validateContactForm = useCallback(() => {
    const newErrors = {};
    const nameError = validation.required(contactData.name, 'Имя') || validation.name(contactData.name);
    const phoneError = validation.required(contactData.phone, 'Телефон') || validation.phone(contactData.phone);
    const emailError = validation.required(contactData.email, 'Email') || validation.email(contactData.email);

    if (nameError) newErrors.name = nameError;
    if (phoneError) newErrors.phone = phoneError;
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    setTouched({ name: true, phone: true, email: true });
    return Object.keys(newErrors).length === 0;
  }, [contactData]);

  const handleTypeSelect = useCallback((type) => {
    setSelectedType(type);
    setStep('product');
  }, []);

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setStep('options');
  }, []);

  const handleSubmitContact = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!validateContactForm()) return;

    setIsLoading(true);

    try {
      const applicationData = {
        productType: selectedType,
        product: selectedProduct,
        ...options,
        contact: {
          name: contactData.name,
          phone: cleanPhone(contactData.phone),
          email: contactData.email
        }
      };

      const response = await sendApplication(applicationData);

      let finalApplicationData = {
        ...applicationData,
        id: response.application?.id || null,
        applicationId: response.application?.id || null
      };

      if (response.application && response.application.id) {
        finalApplicationData.applicationData = {
          ...finalApplicationData.applicationData,
          applicationId: response.application.id
        };
      }

      if (onSubmit) {
        onSubmit(finalApplicationData);
      }

    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: 'Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [
    validateContactForm,
    selectedType,
    selectedProduct,
    options,
    contactData,
    sendApplication,
    onSubmit,
  ]);

  const visibleTypes = productTypes.slice(0, visibleTypesCount);
  const visibleProducts = products[selectedType?.id]?.slice(0, visibleProductsCount) || [];

  if (!isOpen) return null;

  return (
    <div className="overlay-product">
      <div className="window-product">
        <div className="window-product-header">
          <h2>
            {step === 'type' && 'Выберите тип памятника'}
            {step === 'product' && 'Выберите памятник'}
            {step === 'options' && 'Дополнительные опции'}
            {step === 'contact' && 'Контактные данные'}
          </h2>
          <button className="close-product" onClick={handleClose}>×</button>
        </div>

        <div className="content-product">
          {loadingData && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Загрузка данных...</p>
            </div>
          )}

          {!serverAvailable && (
            <div className="alrt alrt-warning" style={{ margin: '10px', padding: '10px' }}>
              ⚠️ Сервер временно недоступен. Работаем в демонстрационном режиме.
            </div>
          )}

          {step === 'type' && !loadingData && (
            <div className="type-product" ref={typesContainerRef}>
              <div className="types-grid">
                {visibleTypes.map(type => (
                  <div
                    key={type.id}
                    className="type-card-product"
                    onClick={() => handleTypeSelect(type)}
                  >
                    <div className="type-image-container-product">
                      <img
                        src={getImageUrl(type.image_url, 'type')}
                        alt={type.name}
                        className="type-image-product"
                        onError={(e) => {
                          e.target.src = defaultTypeImage;
                        }}
                      />
                    </div>
                    <div className="type-info-product">
                      <h3>{type.name}</h3>
                      <p>{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {loadingMore && (
                <div className="loading-more">
                  <div className="spinner small"></div>
                  <p>Загрузка...</p>
                </div>
              )}

              {!hasMoreTypes && productTypes.length > 0 && (
                <div className="end-of-list">
                  <p>Все типы загружены</p>
                </div>
              )}

              {productTypes.length === 0 && !loadingData && (
                <p className='err-load'>Типы товаров не найдены!</p>
              )}
            </div>
          )}

          {step === 'product' && (
            <div className="product-selection">
              <div className="header-type">
                <button className="back-btn-product" onClick={() => setStep('type')}>
                  ← Назад к типам
                </button>
                <div className="selected-type-info">
                  <h3>Выбранный тип: {selectedType.name}</h3>
                  <p>{selectedType.description}</p>
                </div>
              </div>
              <div className="products-grid" ref={productsContainerRef}>
                {visibleProducts.map(product => {
                  const displayPrice = getDisplayPrice(product);
                  return (
                    <div
                      key={product.id}
                      className="prod-card"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="prod-image-container">
                        <img
                          src={getImageUrl(product.image_url, 'product')}
                          alt={product.name}
                          className="prod-image"
                          onError={(e) => {
                            e.target.src = defaultProductImage;
                          }}
                        />
                      </div>
                      <div className="prod-info">
                        <h4>{product.name}</h4>
                        <p className="prod-description">{product.description}</p>
                        <p className={`prod-price ${!displayPrice.hasPrice ? 'no-price' : ''}`}>
                          {displayPrice.text}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {loadingMore && (
                  <div className="loading-more">
                    <div className="spinner small"></div>
                    <p>Загрузка...</p>
                  </div>
                )}

                {!hasMoreProducts[selectedType?.id] && visibleProducts.length > 0 && (
                  <div className="end-of-list">
                    <p>Все товары загружены</p>
                  </div>
                )}

                {(!products[selectedType.id] || products[selectedType.id].length === 0) && !loadingData && (
                  <p className='err-load'>Товары для этого типа не найдены!</p>
                )}
              </div>
            </div>
          )}

          {step === 'options' && (
            <div className="options-selection">
              <button className="back-btn-product" onClick={() => setStep('product')}>
                ← Назад к товарам
              </button>
              <div className="opt-section">
                <div className="selected-product-summary">
                  <div className="summary-image">
                    <img
                      src={getImageUrl(selectedProduct.image_url, 'product')}
                      alt={selectedProduct.name}
                      className="product-summary-image"
                      onError={(e) => {
                        e.target.src = defaultProductImage;
                      }}
                    />
                  </div>
                  <div className="summary-info">
                    <h3>{selectedProduct.name}</h3>
                    <p>Тип: {selectedType.name}</p>
                    {(() => {
                      const displayPrice = getDisplayPrice(selectedProduct);
                      return (
                        <p className={`price ${!displayPrice.hasPrice ? 'no-price' : ''}`}>
                          {displayPrice.text}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="options-form">
                  <div className="form-group">
                    <label>Материал: <span className="required">*</span></label>
                    <select
                      value={options.material}
                      onChange={(e) => handleOptionChange('material', e.target.value)}
                      onBlur={() => handleOptionBlur('material')}
                      className={errors.material && touched.material ? 'error required-field' : ''}
                    >
                      <option value="">Выберите материал</option>
                      {materials.map(material => (
                        <option key={material.value} value={material.value}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                    {errors.material && touched.material && <span className="err-message">{errors.material}</span>}
                  </div>

                  <div className="form-group">
                    <label>Размер: <span className="required">*</span></label>
                    <select
                      value={options.size}
                      onChange={(e) => handleOptionChange('size', e.target.value)}
                      onBlur={() => handleOptionBlur('size')}
                      className={errors.size && touched.size ? 'error required-field' : ''}
                    >
                      <option value="">Выберите размер</option>
                      {sizes.map(size => (
                        <option key={size.value} value={size.value}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                    {errors.size && touched.size && <span className="err-message">{errors.size}</span>}
                  </div>

                  <div className="form-group">
                    <label>Комментарий:</label>
                    <textarea
                      value={options.comment}
                      onChange={(e) => handleOptionChange('comment', e.target.value)}
                      placeholder="Дополнительные пожелания..."
                      rows="4"
                    />
                  </div>

                  <div className="form-validation">
                    <button
                      className={`btn btn-primary ${!isFormValid ? 'btn-disabled' : ''}`}
                      onClick={handleSubmitOptions}
                      disabled={!isFormValid}
                    >
                      Продолжить
                    </button>
                    {!isFormValid && Object.keys(touched).some(key => touched[key]) && (
                      <p className="validation-message">
                        Пожалуйста, заполните все обязательные поля (отмечены *)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'contact' && (
            <div className="contact-selection">
              <button className="back-btn-product" onClick={() => setStep('options')}>
                ← Назад к опциям
              </button>
              <div className="order-sum">
                <div className="application-summary">
                  <h3>Сводка заявки:</h3>
                  <div className="summary-details">
                    <div className="summary-item"><strong>Тип:</strong> {selectedType.name}</div>
                    <div className="summary-item"><strong>Продукт:</strong> {selectedProduct.name}</div>
                    <div className="summary-item"><strong>Материал:</strong> {getMaterialName(options.material)}</div>
                    <div className="summary-item"><strong>Размер:</strong> {getSizeName(options.size)}</div>
                    {(() => {
                      const displayPrice = getDisplayPrice(selectedProduct);
                      return (
                        <div className="summary-item">
                          <strong>Стоимость:</strong> {displayPrice.hasPrice ? `от ${displayPrice.price.toLocaleString()} руб.` : 'по запросу'}
                        </div>
                      );
                    })()}
                    {options.comment && <div className="summary-item"><strong>Комментарий:</strong> {options.comment}</div>}
                  </div>
                </div>

                <form onSubmit={handleSubmitContact} className="contact-form">
                  {errors.submit && (
                    <div className="alrt alrt-error">
                      ❌ {errors.submit}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Имя: <span className="required">*</span></label>
                    <input
                      type="text"
                      value={contactData.name}
                      onChange={(e) => handleContactChange('name', e.target.value)}
                      onBlur={() => handleContactBlur('name')}
                      className={errors.name ? 'error required-field' : ''}
                      disabled={isLoading}
                      placeholder="Введите ваше имя"
                    />
                    {errors.name && <span className="err-message">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Телефон: <span className="required">*</span></label>
                    <input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      onBlur={() => handleContactBlur('phone')}
                      className={errors.phone ? 'error required-field' : ''}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      disabled={isLoading}
                    />
                    {errors.phone && <span className="err-message">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Email: <span className="required">*</span></label>
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      onBlur={() => handleContactBlur('email')}
                      className={errors.email ? 'error required-field' : ''}
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                    {errors.email && <span className="err-message">{errors.email}</span>}
                  </div>

                  <div className="form-validation">
                    <button
                      type="submit"
                      className={`btn btn-primary ${isLoading ? 'btn-disabled' : ''}`}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Отправка...' : 'Отправить заявку'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductSelection;