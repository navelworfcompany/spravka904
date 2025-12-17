export const formatDate = (dateString) => {
  if (!dateString) return '—';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return '—';
  }
};

export const formatPhone = (phone) => {
  if (!phone) return '—';
  
  // Удаляем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // Формат: +7 (999) 123-45-67
    return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
  } else if (cleaned.length === 10) {
    // Формат: 8 (999) 123-45-67
    return `8 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8)}`;
  }
  
  return phone;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getStatusColor = (status) => {
  const colors = {
    new: '#ef4444',
    in_progress: '#f59e0b',
    completed: '#10b981',
    pending: '#f59e0b',
    checked: '#10b981',
    rejected: '#ef4444'
  };
  
  return colors[status] || '#6b7280';
};

export const getStatusLabel = (status, type = 'application') => {
  if (type === 'application') {
    const labels = {
      new: 'Новая',
      in_progress: 'В работе',
      completed: 'Завершена'
    };
    return labels[status] || status;
  } else if (type === 'review') {
    const labels = {
      pending: 'На модерации',
      checked: 'Проверено',
      rejected: 'Отклонено'
    };
    return labels[status] || status;
  }
  
  return status;
};