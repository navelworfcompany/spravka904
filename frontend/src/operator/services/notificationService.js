/**
 * Сервис для управления уведомлениями оператора
 */

class NotificationService {
  constructor() {
    this.maxNotifications = 10;
    this.notificationTypes = {
      SUCCESS: 'success',
      ERROR: 'error',
      WARNING: 'warning',
      INFO: 'info'
    };
  }

  /**
   * Создание уведомления
   * @param {string} type - Тип уведомления
   * @param {string} title - Заголовок уведомления
   * @param {string} message - Сообщение уведомления
   * @returns {object} - Объект уведомления
   */
  createNotification(type, title, message) {
    return {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      type: type || this.notificationTypes.INFO,
      title: title || this.getDefaultTitle(type),
      message: message || '',
      timestamp: new Date().toISOString(),
      read: false
    };
  }

  /**
   * Получение заголовка по умолчанию для типа уведомления
   * @param {string} type - Тип уведомления
   * @returns {string} - Заголовок по умолчанию
   */
  getDefaultTitle(type) {
    const titles = {
      [this.notificationTypes.SUCCESS]: 'Успешно',
      [this.notificationTypes.ERROR]: 'Ошибка',
      [this.notificationTypes.WARNING]: 'Внимание',
      [this.notificationTypes.INFO]: 'Информация'
    };
    
    return titles[type] || 'Уведомление';
  }

  /**
   * Создание уведомления об успехе
   * @param {string} message - Сообщение
   * @param {string} title - Заголовок (необязательно)
   * @returns {object} - Уведомление об успехе
   */
  success(message, title = 'Успешно') {
    return this.createNotification(this.notificationTypes.SUCCESS, title, message);
  }

  /**
   * Создание уведомления об ошибке
   * @param {string} message - Сообщение об ошибке
   * @param {string} title - Заголовок (необязательно)
   * @returns {object} - Уведомление об ошибке
   */
  error(message, title = 'Ошибка') {
    return this.createNotification(this.notificationTypes.ERROR, title, message);
  }

  /**
   * Создание предупреждающего уведомления
   * @param {string} message - Сообщение
   * @param {string} title - Заголовок (необязательно)
   * @returns {object} - Предупреждающее уведомление
   */
  warning(message, title = 'Внимание') {
    return this.createNotification(this.notificationTypes.WARNING, title, message);
  }

  /**
   * Создание информационного уведомления
   * @param {string} message - Сообщение
   * @param {string} title - Заголовок (необязательно)
   * @returns {object} - Информационное уведомление
   */
  info(message, title = 'Информация') {
    return this.createNotification(this.notificationTypes.INFO, title, message);
  }

  /**
   * Фильтрация уведомлений (ограничение количества)
   * @param {Array} notifications - Массив уведомлений
   * @returns {Array} - Отфильтрованный массив уведомлений
   */
  filterNotifications(notifications) {
    if (!Array.isArray(notifications)) {
      return [];
    }
    
    // Сортируем по времени (новые сверху)
    const sorted = [...notifications].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Ограничиваем количество
    return sorted.slice(0, this.maxNotifications);
  }

  /**
   * Получение количества непрочитанных уведомлений
   * @param {Array} notifications - Массив уведомлений
   * @returns {number} - Количество непрочитанных
   */
  getUnreadCount(notifications) {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Маркировка всех уведомлений как прочитанных
   * @param {Array} notifications - Массив уведомлений
   * @returns {Array} - Обновленный массив уведомлений
   */
  markAllAsRead(notifications) {
    if (!Array.isArray(notifications)) return [];
    return notifications.map(notification => ({
      ...notification,
      read: true
    }));
  }

  /**
   * Маркировка уведомления как прочитанного
   * @param {Array} notifications - Массив уведомлений
   * @param {string|number} id - ID уведомления
   * @returns {Array} - Обновленный массив уведомлений
   */
  markAsRead(notifications, id) {
    if (!Array.isArray(notifications)) return [];
    return notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
  }

  /**
   * Удаление уведомления
   * @param {Array} notifications - Массив уведомлений
   * @param {string|number} id - ID уведомления
   * @returns {Array} - Обновленный массив уведомлений
   */
  removeNotification(notifications, id) {
    if (!Array.isArray(notifications)) return [];
    return notifications.filter(notification => notification.id !== id);
  }

  /**
   * Очистка всех уведомлений
   * @returns {Array} - Пустой массив
   */
  clearAll() {
    return [];
  }

  /**
   * Создание системных уведомлений для оператора
   */
  systemNotifications = {
    // Заявки
    applicationCreated: (applicationId) => ({
      type: this.notificationTypes.INFO,
      title: 'Новая заявка',
      message: `Создана новая заявка #${applicationId}`,
      timestamp: new Date().toISOString()
    }),

    applicationUpdated: (applicationId, status) => ({
      type: this.notificationTypes.SUCCESS,
      title: 'Заявка обновлена',
      message: `Статус заявки #${applicationId} изменен на "${status}"`,
      timestamp: new Date().toISOString()
    }),

    applicationMarkedForDeletion: (applicationId) => ({
      type: this.notificationTypes.WARNING,
      title: 'Заявка помечена на удаление',
      message: `Заявка #${applicationId} помечена на удаление`,
      timestamp: new Date().toISOString()
    }),

    // Отзывы
    reviewAdded: (reviewId) => ({
      type: this.notificationTypes.INFO,
      title: 'Новый отзыв',
      message: `Добавлен новый отзыв #${reviewId}`,
      timestamp: new Date().toISOString()
    }),

    reviewStatusChanged: (reviewId, status) => ({
      type: this.notificationTypes.SUCCESS,
      title: 'Статус отзыва изменен',
      message: `Статус отзыва #${reviewId} изменен на "${status}"`,
      timestamp: new Date().toISOString()
    }),

    // Системные
    dataRefreshed: () => ({
      type: this.notificationTypes.INFO,
      title: 'Данные обновлены',
      message: 'Данные успешно обновлены',
      timestamp: new Date().toISOString()
    }),

    errorOccurred: (errorMessage) => ({
      type: this.notificationTypes.ERROR,
      title: 'Системная ошибка',
      message: errorMessage || 'Произошла ошибка в системе',
      timestamp: new Date().toISOString()
    }),

    // Уведомления о работниках
    workerResponded: (workerName, applicationId) => ({
      type: this.notificationTypes.INFO,
      title: 'Новый ответ работника',
      message: `Работник ${workerName} ответил на заявку #${applicationId}`,
      timestamp: new Date().toISOString()
    }),

    workerAssigned: (workerName, applicationId) => ({
      type: this.notificationTypes.SUCCESS,
      title: 'Исполнитель назначен',
      message: `Работник ${workerName} назначен исполнителем заявки #${applicationId}`,
      timestamp: new Date().toISOString()
    }),

    // Организации
    organizationUpdated: (orgName) => ({
      type: this.notificationTypes.INFO,
      title: 'Организация обновлена',
      message: `Данные организации "${orgName}" были обновлены администратором`,
      timestamp: new Date().toISOString()
    })
  };
}

// Экспортируем синглтон
export const notificationService = new NotificationService();
export default notificationService;