import { db } from '../database/init.js';

export class WorkerRequest {
  constructor(data) {
    this.id = data.id;
    this.organization = data.organization;
    this.phone = data.phone;
    this.email = data.email;
    this.password = data.password;
    this.locations = data.locations || '';
    this.status = data.status || 'pending';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Найти запрос по телефону
  static async findByPhone(phone) {
    try {
      console.log('🔍 Finding worker request by phone:', phone);

      const stmt = db.prepare('SELECT * FROM worker_requests WHERE phone = ? AND status = ?');
      const request = stmt.get(phone, 'pending');

      console.log('📋 Found request:', request ? 'yes' : 'no');
      return request ? new WorkerRequest(request) : null;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error finding worker request by phone: ${error.message}`);
    }
  }

  // Создать новый запрос
  static async create(requestData) {
    try {
      console.log('🔄 Creating worker request with data:', requestData);

      const { organization, phone, email, password, locations } = requestData;
      const locationsString = Array.isArray(locations) ? locations.join(',') : String(locations || '');

      const stmt = db.prepare(
        `INSERT INTO worker_requests (organization, phone, email, password, locations) 
         VALUES (?, ?, ?, ?, ?)`
      );

      const result = stmt.run(organization, phone, email, password, locationsString);

      console.log('✅ Worker request created with ID:', result.lastInsertRowid);

      // Получаем созданную запись
      const selectStmt = db.prepare('SELECT * FROM worker_requests WHERE id = ?');
      const newRequestData = selectStmt.get(result.lastInsertRowid);

      return new WorkerRequest(newRequestData);
    } catch (error) {
      console.error('❌ Database error:', error);
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Worker request with this phone already exists');
      }
      throw new Error(`Error creating worker request: ${error.message}`);
    }
  }

  // Найти все pending запросы
  static async findPending({ page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const stmt = db.prepare(
        `SELECT * FROM worker_requests 
         WHERE status = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`
      );

      const requests = stmt.all('pending', limit, offset);

      const countStmt = db.prepare('SELECT COUNT(*) as total FROM worker_requests WHERE status = ?');
      const totalResult = countStmt.get('pending');

      return {
        requests: requests.map(request => new WorkerRequest(request)),
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalResult.total / limit)
      };
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error finding pending worker requests: ${error.message}`);
    }
  }

  // Одобрить запрос
  async approve() {
    try {
      // Импортируем модель User
      const { User } = await import('./User.js');

      // Создаем пользователя
      await User.create({
        phone: this.phone,
        password: this.password,
        name: this.organization,
        email: this.email,
        role: 'worker',
        organization: this.organization
      });

      // Обновляем статус запроса
      const stmt = db.prepare(
        `UPDATE worker_requests 
         SET status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      );

      stmt.run('approved', this.id);

      this.status = 'approved';
      this.updated_at = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error approving worker request: ${error.message}`);
    }
  }

  // Отклонить запрос
  async reject() {
    try {
      const stmt = db.prepare(
        `UPDATE worker_requests 
         SET status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      );

      stmt.run('rejected', this.id);

      this.status = 'rejected';
      this.updated_at = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error rejecting worker request: ${error.message}`);
    }
  }

  // Удалить запрос
  async delete() {
    try {
      const stmt = db.prepare('DELETE FROM worker_requests WHERE id = ?');
      stmt.run(this.id);
      return true;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error deleting worker request: ${error.message}`);
    }
  }

  // Получить статистику по запросам
  static async getStats() {
    try {
      const stmt = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM worker_requests 
        GROUP BY status
      `);

      const stats = stmt.all();

      const countStmt = db.prepare('SELECT COUNT(*) as total FROM worker_requests');
      const totalResult = countStmt.get();

      return {
        total: totalResult.total,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error getting worker request stats: ${error.message}`);
    }
  }

  // Получить все запросы (для админки)
  static async findAll({ page = 1, limit = 10, status } = {}) {
    try {
      const offset = (page - 1) * limit;

      let whereClause = '';
      let params = [];

      console.log('🔍 Filter parameters:', { status, page, limit });

      if (status && status !== 'all') {
        whereClause = 'WHERE status = ?';
        params = [status];
      }

      const query = `
      SELECT * FROM worker_requests 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

      console.log('📋 SQL Query:', query);
      console.log('📋 Query params:', [...params, limit, offset]);

      const stmt = db.prepare(query);
      const requests = stmt.all(...params, limit, offset);

      const countQuery = `SELECT COUNT(*) as total FROM worker_requests ${whereClause}`;
      console.log('📋 Count query:', countQuery);

      const countStmt = db.prepare(countQuery);
      const totalResult = countStmt.get(...params);

      console.log('📋 Found requests:', requests.length);
      console.log('📋 Total count:', totalResult.total);

      return {
        requests: requests.map(request => new WorkerRequest(request)),
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalResult.total / limit)
      };
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error finding worker requests: ${error.message}`);
    }
  }

  // Проверить, является ли запрос pending
  isPending() {
    return this.status === 'pending';
  }

  // Получить локации как массив
  getLocationsArray() {
    return this.locations ? this.locations.split(',').filter(loc => loc.trim()) : [];
  }

  toJSON() {
    const { password, ...requestWithoutPassword } = this;
    return {
      ...requestWithoutPassword,
      locations: this.getLocationsArray()
    };
  }

  static async findById(id) {
    try {
      console.log('🔍 Finding worker request by ID:', id);

      const stmt = db.prepare('SELECT * FROM worker_requests WHERE id = ?');
      const request = stmt.get(id);

      console.log('📋 Found request by ID:', request ? 'yes' : 'no');
      return request ? new WorkerRequest(request) : null;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Error finding worker request by ID: ${error.message}`);
    }
  }
}