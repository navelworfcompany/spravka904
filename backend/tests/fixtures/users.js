export const userFixtures = {
  adminUser: {
    phone: 'admin',
    password: 'admin123',
    name: 'Администратор',
    email: 'navelworf@gmail.com',
    role: 'admin'
  },

  operatorUser: {
    phone: '+79991112233',
    password: 'operator123',
    name: 'Оператор',
    email: 'operator@system.com',
    role: 'operator'
  },

  workerUser: {
    phone: '+79994445566',
    password: 'worker123',
    name: 'Работник ООО',
    email: 'worker@company.com',
    role: 'worker',
    organization: 'ООО "СтройМастер"'
  },

  regularUser: {
    phone: '+79997778899',
    password: 'user123',
    name: 'Обычный пользователь',
    email: 'user@example.com',
    role: 'user'
  },

  workerRegistration: {
    organization: 'ИП Иванов',
    phone: '+79996665544',
    email: 'ivanov@ip.com',
    password: 'password123'
  },

  invalidUsers: {
    shortPassword: {
      phone: '+79991234567',
      password: '123',
      name: 'Пользователь',
      email: 'user@example.com'
    },
    invalidEmail: {
      phone: '+79991234567',
      password: 'password123',
      name: 'Пользователь',
      email: 'invalid-email'
    },
    invalidPhone: {
      phone: 'not-a-phone',
      password: 'password123',
      name: 'Пользователь',
      email: 'user@example.com'
    },
    missingName: {
      phone: '+79991234567',
      password: 'password123',
      email: 'user@example.com'
    }
  }
};