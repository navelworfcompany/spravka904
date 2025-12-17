import { initDatabase } from '../database/init.js';

async function initializeDatabase() {
  try {
    console.log('🔄 Starting database initialization...');
    await initDatabase();
    console.log('✅ Database initialized successfully!');
    console.log('📊 You can now start the server with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();