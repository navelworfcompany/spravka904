import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Конфигурация базы данных
 */

// Путь к файлу базы данных
export const getDatabasePath = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const paths = {
    development: process.env.DATABASE_PATH || './database.sqlite',
    test: process.env.TEST_DATABASE_PATH || './test_database.sqlite',
    production: process.env.DATABASE_PATH || '/data/database.sqlite'
  };

  return path.resolve(__dirname, '..', paths[env]);
};

// Настройки подключения к базе данных
export const databaseConfig = {
  // SQLite специфичные настройки
  sqlite: {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    timeout: 5000,
    // Включить WAL mode для лучшей производительности
    pragmas: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      foreign_keys: 'ON',
      busy_timeout: 5000,
      cache_size: -64000, // 64MB
      temp_store: 'MEMORY'
    }
  },

  // Общие настройки базы данных
  common: {
    // Максимальное количество соединений в пуле
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    
    // Настройки логирования
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Настройки ретраев
    retry: {
      max: 3,
      timeout: 1000
    }
  }
};

// Создание экземпляра базы данных
export const createDatabase = () => {
  const dbPath = getDatabasePath();
  const env = process.env.NODE_ENV || 'development';
  
  console.log(`Initializing database for ${env} environment`);
  console.log(`Database path: ${dbPath}`);

  // Создаем директорию для базы данных если её нет
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }

  // Создаем подключение к базе данных
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      throw err;
    }
    
    console.log(`Connected to SQLite database: ${dbPath}`);
    
    // Включаем foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Устанавливаем WAL mode для лучшей производительности
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA synchronous = NORMAL');
    db.run('PRAGMA cache_size = -64000');
    db.run('PRAGMA temp_store = MEMORY');
    db.run('PRAGMA busy_timeout = 5000');
  });

  // Промисфицируем методы базы данных
  db.run = promisify(db.run);
  db.get = promisify(db.get);
  db.all = promisify(db.all);
  db.each = promisify(db.each);
  db.exec = promisify(db.exec);

  // Обработка ошибок базы данных
  db.on('error', (err) => {
    console.error('Database error:', err);
    
    // Логируем критичные ошибки
    if (err.code === 'SQLITE_CORRUPT') {
      console.error('DATABASE CORRUPTION DETECTED!');
      // Здесь можно добавить логику восстановления из backup
    }
  });

  return db;
};

// Функция для закрытия базы данных
export const closeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};

// Функция для проверки состояния базы данных
export const checkDatabaseHealth = async (db) => {
  try {
    // Проверяем что база отвечает
    const result = await db.get('SELECT 1 as health_check');
    
    // Проверяем основные таблицы
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('users', 'applications', 'products', 'product_types')
    `);
    
    const requiredTables = ['users', 'applications', 'products', 'product_types'];
    const missingTables = requiredTables.filter(
      table => !tables.some(t => t.name === table)
    );

    return {
      status: 'healthy',
      database: 'connected',
      tables: {
        total: tables.length,
        missing: missingTables,
        allPresent: missingTables.length === 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Функция для создания backup базы данных
export const createBackup = async (db, backupPath = null) => {
  const sourcePath = getDatabasePath();
  const env = process.env.NODE_ENV || 'development';
  
  if (!backupPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = path.resolve(
      __dirname, 
      '..', 
      'backups', 
      `backup-${env}-${timestamp}.sqlite`
    );
  }

  // Создаем директорию для backup если её нет
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    // Используем VACUUM INTO для создания backup (требует SQLite 3.27+)
    db.run(`VACUUM INTO ?`, [backupPath], function(err) {
      if (err) {
        // Fallback: копируем файл вручную
        try {
          fs.copyFileSync(sourcePath, backupPath);
          console.log(`Database backup created using file copy: ${backupPath}`);
          resolve(backupPath);
        } catch (copyError) {
          console.error('Error creating database backup:', copyError);
          reject(copyError);
        }
      } else {
        console.log(`Database backup created using VACUUM: ${backupPath}`);
        resolve(backupPath);
      }
    });
  });
};

// Функция для оптимизации базы данных
export const optimizeDatabase = async (db) => {
  try {
    console.log('Starting database optimization...');
    
    // VACUUM перестраивает базу данных, освобождая неиспользуемое пространство
    await db.run('VACUUM');
    
    // ANALYZE обновляет статистику для оптимизатора запросов
    await db.run('ANALYZE');
    
    // Перестраиваем индексы
    await db.run('REINDEX');
    
    console.log('Database optimization completed');
    
    return {
      success: true,
      operations: ['VACUUM', 'ANALYZE', 'REINDEX'],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database optimization failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Миграции базы данных
export const migrations = [
  {
    version: 1,
    description: 'Initial database schema',
    up: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    version: 2,
    description: 'Add updated_at triggers',
    up: `
      -- Триггер для автоматического обновления updated_at в users
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      -- Триггер для автоматического обновления updated_at в applications
      CREATE TRIGGER IF NOT EXISTS update_applications_timestamp 
      AFTER UPDATE ON applications
      FOR EACH ROW
      BEGIN
        UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `
  }
];

// Применение миграций
export const runMigrations = async (db) => {
  try {
    // Создаем таблицу для отслеживания миграций если её нет
    await db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Получаем примененные миграции
    const appliedMigrations = await db.all('SELECT version FROM schema_migrations');
    const appliedVersions = appliedMigrations.map(m => m.version);

    // Применяем недостающие миграции
    const migrationsToApply = migrations.filter(m => !appliedVersions.includes(m.version));
    
    for (const migration of migrationsToApply) {
      console.log(`Applying migration v${migration.version}: ${migration.description}`);
      
      await db.exec(migration.up);
      
      // Записываем информацию о примененной миграции
      await db.run(
        'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
        [migration.version, migration.description]
      );
      
      console.log(`Migration v${migration.version} applied successfully`);
    }

    console.log(`All migrations applied. Total: ${migrationsToApply.length} new migrations`);
    
    return {
      success: true,
      applied: migrationsToApply.length,
      migrations: migrationsToApply.map(m => ({
        version: m.version,
        description: m.description
      }))
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

export default {
  getDatabasePath,
  databaseConfig,
  createDatabase,
  closeDatabase,
  checkDatabaseHealth,
  createBackup,
  optimizeDatabase,
  migrations,
  runMigrations
};