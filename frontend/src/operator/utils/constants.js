export const OPERATOR_ROUTES = {
  DASHBOARD: '/operator/dashboard',
  APPLICATIONS: '/operator/applications',
  ORGANIZATIONS: '/operator/organizations',
  PRODUCTS: '/operator/products',
  REVIEWS: '/operator/reviews',
};

export const OPERATOR_PERMISSIONS = {
  VIEW_APPLICATIONS: 'view_applications',
  EDIT_APPLICATIONS: 'edit_applications',
  VIEW_ORGANIZATIONS: 'view_organizations',
  VIEW_PRODUCTS: 'view_products',
  VIEW_REVIEWS: 'view_reviews',
  EDIT_REVIEWS: 'edit_reviews',
};

export const OPERATOR_NOTIFICATION_TYPES = {
  NEW_APPLICATION: 'new_application',
  APPLICATION_UPDATED: 'application_updated',
  NEW_REVIEW: 'new_review',
};

export const APPLICATION_STATUSES = {
  new: { label: 'Новая', color: 'blue' },
  pending: { label: 'В ожидании', color: 'orange' },
  in_progress: { label: 'В работе', color: 'purple' },
  assigned: { label: 'Назначена', color: 'green' },
  completed: { label: 'Завершена', color: 'teal' },
  cancelled: { label: 'Отменена', color: 'red' },
  for_delete: { label: 'На удалении', color: 'gray' }
};