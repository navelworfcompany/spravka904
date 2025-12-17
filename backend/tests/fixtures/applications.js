export const applicationFixtures = {
  validApplication: {
    name: 'Иван Иванов',
    phone: '+79991234567',
    product_type: 'Мебель',
    product: 'Стул',
    material: 'Дерево',
    size: 'Большой',
    comment: 'Нужно сделать качественно'
  },

  minimalApplication: {
    name: 'Петр Петров',
    phone: '+79998887766',
    product_type: 'Электроника',
    product: 'Телефон'
  },

  applicationWithLongComment: {
    name: 'Сергей Сергеев',
    phone: '+79997776655',
    product_type: 'Одежда',
    product: 'Куртка',
    comment: 'Очень длинный комментарий '.repeat(25) // ~500 символов
  },

  invalidApplications: {
    missingName: {
      phone: '+79991234567',
      product_type: 'Мебель',
      product: 'Стул'
    },
    missingPhone: {
      name: 'Иван Иванов',
      product_type: 'Мебель',
      product: 'Стул'
    },
    invalidPhone: {
      name: 'Иван Иванов',
      phone: 'invalid-phone',
      product_type: 'Мебель',
      product: 'Стул'
    },
    longName: {
      name: 'Очень длинное имя пользователя которое превышает лимит в пятьдесят символов',
      phone: '+79991234567',
      product_type: 'Мебель',
      product: 'Стул'
    }
  }
};

export const workerResponseFixtures = {
  validResponse: {
    response: 'Мы можем выполнить ваш заказ в течение 3-5 рабочих дней. Стоимость составит примерно 5000 рублей.'
  },

  shortResponse: {
    response: 'Короткий ответ' // Меньше 10 символов
  },

  longResponse: {
    response: 'Очень длинный ответ '.repeat(100) // Больше 1000 символов
  }
};