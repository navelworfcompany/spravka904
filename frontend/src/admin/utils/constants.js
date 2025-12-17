// src/admin/utils/constants.js
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  APPLICATIONS: '/admin/applications',
  USERS: '/admin/users',
  PRODUCTS: '/admin/products',
  WOKERS: '/admin/worker-requests',
  REVIEWS: '/admin/reviews',
  SETTINGS: '/admin/settings'
};

export const APPLICATION_STATUSES = {
  new: { label: 'Новая', color: 'green' },
  pending: { label: 'Принята', color: 'white' },
  in_progress: { label: 'В работе', color: 'orange' },
  assigned: { label: 'Исполняется', color: 'aqua' },
  completed: { label: 'Завершена', color: 'blue' },
  cancelled: { label: 'Отменена', color: 'red' },
  for_delete: { label: 'На удалении', color: 'yellow' }
};

export const USER_ROLES = {
  user: 'Клиент',
  worker: 'Мастер',
  operator: 'Оператор',
  admin: 'Администратор'
};