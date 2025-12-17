import React, { useState } from 'react';
import { workerRequestsAPI } from '../../services/api';
import { formatPhone, cleanPhone } from '../../utils/validation';
import './WorkerRegistration.css';

const WorkerRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    locations: []
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  const availableLocations = [
    "Старый Оскол",
    "Губкин",
    "Новый Оскол",
    "Чернянка",
    "Белгород"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const formattedPhone = formatPhone(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationSelect = (e) => {
    setSelectedLocation(e.target.value);
  };

  const addLocation = () => {
    if (selectedLocation && !formData.locations.includes(selectedLocation)) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, selectedLocation]
      }));
      setSelectedLocation('');
    }
  };

  const removeLocation = (locationToRemove) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter(location => location !== locationToRemove)
    }));
  };

  const clearAllLocations = () => {
    setFormData(prev => ({
      ...prev,
      locations: []
    }));
  };

  const downloadContractTemplate = () => {
    const link = document.createElement('a');
    link.href = '/documents/contract-template.docx';
    link.download = 'Образец_договора_с_работником.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      alert('Пожалуйста, введите ваше имя');
      setLoading(false);
      return;
    }

    const cleanPhoneNumber = cleanPhone(formData.phone);
    if (cleanPhoneNumber.length !== 11) {
      alert('Пожалуйста, введите корректный номер телефона');
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        name: formData.name.trim(),
        organization: formData.organization,
        phone: cleanPhoneNumber,
        email: formData.email,
        password: formData.password,
        locations: formData.locations
      };

      const response = await workerRequestsAPI.createRequest(requestData);

      if (response.success) {
        setShowSuccessModal(true);

        setFormData({
          name: '',
          organization: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
          locations: []
        });
        setSelectedLocation('');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      alert(error.response?.data?.message || 'Ошибка при отправке заявки');
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="worker-registration-container dark-theme">
      <div className="worker-registration-content">
        <div className="contract-section-top">
          <div className="contract-header">
            <div className="contract-icon">📋</div>
            <h2>Договор сотрудничества</h2>
          </div>
          <div className="contract-info">
            <p className="contract-description">
              Перед регистрацией обязательно ознакомьтесь с образцом договора сотрудничества.
              Это поможет вам понять условия работы и наши обязательства перед друг другом.
            </p>
            <div className="regwok-block">
              <div className="contract-features">
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Прозрачные условия сотрудничества</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Четкое распределение обязанностей</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Гарантии для обеих сторон</span>
                </div>
              </div>
              <button
                className="download-contract-btn"
                onClick={downloadContractTemplate}
              >
                📄 Скачать образец договора
              </button>
            </div>
          </div>
        </div>

        <div className="worker-registration-form">
          <h2>Регистрация работника</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Ваше имя *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Введите ваше полное имя"
              />
            </div>

            <div className="form-group">
              <label htmlFor="organization">Название организации *</label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
                placeholder="ООО 'Ваша компания'"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+7 (999) 123-45-67"
              />
              <div className="phone-format-hint">
                Формат: +7 (XXX) XXX-XX-XX
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                placeholder="Минимум 6 символов"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Повторите пароль"
              />
            </div>

            <div className="form-group">
              <label htmlFor="locations">Обслуживаемые локации</label>

              <div className="location-selector">
                <select
                  id="locations"
                  value={selectedLocation}
                  onChange={handleLocationSelect}
                  className="location-select"
                >
                  <option value="">Выберите локацию</option>
                  {availableLocations.map(location => (
                    <option
                      key={location}
                      value={location}
                      disabled={formData.locations.includes(location)}
                    >
                      {location}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="add-location-btn"
                  onClick={addLocation}
                  disabled={!selectedLocation}
                >
                  Добавить
                </button>
              </div>

              {formData.locations.length > 0 && (
                <div className="selected-locations">
                  <div className="selected-locations-header">
                    <span className="selected-label">Выбранные локации:</span>
                    <button
                      type="button"
                      className="clear-all-btn"
                      onClick={clearAllLocations}
                    >
                      Очистить все
                    </button>
                  </div>
                  <div className="location-tags">
                    {formData.locations.map(location => (
                      <span key={location} className="location-tag">
                        {location}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => removeLocation(location)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Отправка...' : 'Отправить запрос на регистрацию'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div className="modal-overlay" onClick={closeSuccessModal}>
          <div className="success-regwok-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-regwok-header">
              <div className="success-icon">✅</div>
              <h3>Заявка отправлена успешно!</h3>
            </div>

            <div className="modal-regwok-content">
              <p>
                Ваша заявка на регистрацию работника успешно отправлена и находится на рассмотрении.
              </p>

              <div className="next-steps">
                <h4>Что дальше?</h4>
                <ul>
                  <li>✅ Мы проверим ваши данные в течение 1-2 рабочих дней</li>
                  <li>✅ Вы получите уведомление по email или телефону</li>
                  <li>✅ После одобрения вы сможете войти в систему</li>
                  <li>✅ Начните принимать заявки от клиентов</li>
                </ul>
              </div>

              <div className="contact-info">
                <p>Если у вас есть вопросы, свяжитесь с нами:</p>
                <div className="contact-details">
                  <span>📞 +7 (995) 53-777-28</span>
                  <span>✉️ sm.art.em@yandex.ru</span>
                </div>
              </div>
            </div>

            <div className="modal-regwok-actions">
              <button
                className="modal-regwok-close-btn"
                onClick={closeSuccessModal}
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerRegistration;