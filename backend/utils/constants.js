// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  WORKER: 'worker',
  USER: 'user'
};

// Статусы заявок
export const APPLICATION_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Типы товаров (заглушка)
export const PRODUCT_TYPES = [
  {
    id: 1,
    name: 'Мебель',
    description: 'Различные виды мебели'
  },
  {
    id: 2,
    name: 'Электроника',
    description: 'Электронные устройства и гаджеты'
  },
  {
    id: 3,
    name: 'Одежда',
    description: 'Одежда и аксессуары'
  }
];

// Материалы
export const MATERIALS = [
  'Дерево',
  'Металл',
  'Пластик',
  'Стекло',
  'Ткань',
  'Кожа'
];

// Размеры
export const SIZES = [
  'Маленький',
  'Средний',
  'Большой',
  'XL'
];

// Время акции (24 часа в секундах)
export const PROMOTION_TIME = 24 * 60 * 60;

// Локализация
export const LOCALIZATION = {
  ru: {
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Выйти',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    applications: 'Заявки',
    products: 'Товары',
    users: 'Пользователи',
    settings: 'Настройки'
  }
};