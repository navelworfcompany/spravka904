import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./database.sqlite', { verbose: console.log });

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔄 Starting database initialization...');

      // Users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          organization TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Product types table
      db.exec(`
        CREATE TABLE IF NOT EXISTS product_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Products table
      db.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          materials TEXT,
          sizes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (type_id) REFERENCES product_types (id)
        )
      `);

      // Applications table
      db.exec(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          product_type TEXT NOT NULL,
          product TEXT NOT NULL,
          material TEXT,
          size TEXT,
          comment TEXT,
          product_type_id INTEGER,
          product_id INTEGER,
          status TEXT DEFAULT 'new',
          source TEXT DEFAULT 'public_form',
          marked_for_deletion BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Worker responses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS worker_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          worker_id INTEGER NOT NULL,
          response TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES applications (id),
          FOREIGN KEY (worker_id) REFERENCES users (id)
        )
      `);

      // Worker registration requests
      db.exec(`
        CREATE TABLE IF NOT EXISTS worker_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization TEXT NOT NULL,
          phone TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Database tables created successfully');

      // Insert default admin user
      const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
      if (!adminExists) {
        const hashedPassword = bcrypt.hashSync('admin123', 12);
        db.prepare(
          "INSERT INTO users (phone, password, name, email, role) VALUES (?, ?, ?, ?, ?)"
        ).run('79997778899', hashedPassword, 'Administrator', 'admin@system.com', 'admin');
        console.log('✅ Admin user created');
      }

      // Insert test users
      const testUsers = [
        {
          phone: '79991234567',
          password: bcrypt.hashSync('123456', 12),
          name: 'Тестовый Клиент',
          email: 'client@test.com',
          role: 'user'
        },
        {
          phone: '79991112233',
          password: bcrypt.hashSync('worker123', 12),
          name: 'Тестовый Работник',
          email: 'worker@test.com',
          role: 'worker'
        },
        {
          phone: '79994445566',
          password: bcrypt.hashSync('operator123', 12),
          name: 'Тестовый Оператор',
          email: 'operator@test.com',
          role: 'operator'
        }
      ];

      testUsers.forEach(user => {
        const userExists = db.prepare("SELECT id FROM users WHERE phone = ?").get(user.phone);
        if (!userExists) {
          db.prepare(
            "INSERT INTO users (phone, password, name, email, role) VALUES (?, ?, ?, ?, ?)"
          ).run(user.phone, user.password, user.name, user.email, user.role);
        }
      });
      console.log('✅ Test users created');

      // Insert sample product types
      const typesExists = db.prepare("SELECT id FROM product_types LIMIT 1").get();
      if (!typesExists) {
        const types = [
          ['Мебель', 'Различные виды мебели'],
          ['Электроника', 'Электронные устройства и гаджеты'],
          ['Одежда', 'Одежда и аксессуары'],
          ['Строительные материалы', 'Материалы для строительства и ремонта']
        ];

        types.forEach(type => {
          db.prepare(
            "INSERT INTO product_types (name, description) VALUES (?, ?)"
          ).run(type[0], type[1]);
        });
        console.log('✅ Product types created');
      }

      // Insert sample products
      const productsExists = db.prepare("SELECT id FROM products LIMIT 1").get();
      if (!productsExists) {
        const products = [
          [1, 'Диван', 'Комфортный диван для гостиной', 25000.00, '{"ткань", "дерево"}', '{"200x90x80"}'],
          [1, 'Стол обеденный', 'Деревянный обеденный стол', 15000.00, '{"дерево", "стекло"}', '{"160x90x75"}'],
          [2, 'Смартфон', 'Современный смартфон', 45000.00, '{"пластик", "стекло"}', '{"6.7 дюймов"}'],
          [2, 'Ноутбук', 'Игровой ноутбук', 85000.00, '{"пластик", "металл"}', '{"15.6 дюймов"}'],
          [3, 'Футболка', 'Хлопковая футболка', 1500.00, '{"хлопок"}', '{"S,M,L,XL"}'],
          [4, 'Кирпич', 'Строительный кирпич', 50.00, '{"глина"}', '{"250x120x65"}']
        ];

        products.forEach(product => {
          db.prepare(
            "INSERT INTO products (type_id, name, description, price, materials, sizes) VALUES (?, ?, ?, ?, ?, ?)"
          ).run(product[0], product[1], product[2], product[3], product[4], product[5]);
        });
        console.log('✅ Sample products created');
      }

      console.log('🎉 Database initialization completed successfully');
      resolve();
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      reject(error);
    }
  });
};

export { db, initDatabase };