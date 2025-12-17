import { db } from '../database/init.js';

export class Application {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.phone = data.phone;
    this.product_type = data.product_type;
    this.product = data.product;
    this.material = data.material;
    this.size = data.size;
    this.comment = data.comment;
    this.status = data.status || 'new';
    this.marked_for_deletion = data.marked_for_deletion || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.responses = data.responses || [];
  }

  // Статические методы

  // Найти заявку по ID
  static async findById(id) {
    try {
      const application = db.prepare(
        `SELECT * FROM applications WHERE id = ?`
      ).get(id);

      if (!application) return null;

      // Загружаем ответы работников
      const responses = db.prepare(
        `SELECT wr.*, u.name as worker_name, u.organization
         FROM worker_responses wr
         LEFT JOIN users u ON wr.worker_id = u.id
         WHERE wr.application_id = ?
         ORDER BY wr.created_at ASC`
      ).all(id);

      return new Application({
        ...application,
        responses
      });
    } catch (error) {
      throw new Error(`Error finding application by ID: ${error.message}`);
    }
  }

  // Найти все заявки с фильтрацией и пагинацией
  static async findAll({
    page = 1,
    limit = 10,
    status = null,
    phone = null,
    markedForDeletion = false
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT a.*, 
               COUNT(wr.id) as response_count
        FROM applications a
        LEFT JOIN worker_responses wr ON a.id = wr.application_id
      `;
      let countQuery = `SELECT COUNT(*) as total FROM applications a`;
      const params = [];
      const countParams = [];

      const whereConditions = [];

      if (status && status !== 'all') {
        whereConditions.push('a.status = ?');
        params.push(status);
        countParams.push(status);
      }

      if (phone) {
        whereConditions.push('a.phone = ?');
        params.push(phone);
        countParams.push(phone);
      }

      if (!markedForDeletion) {
        whereConditions.push('a.marked_for_deletion = 0');
      }

      if (whereConditions.length > 0) {
        const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
      }

      query += ` GROUP BY a.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const applications = db.prepare(query).all(...params);
      const totalResult = db.prepare(countQuery).get(...countParams);

      return {
        applications: applications.map(app => new Application(app)),
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalResult.total / limit)
      };
    } catch (error) {
      throw new Error(`Error finding applications: ${error.message}`);
    }
  }

  // Найти заявки по номеру телефона
  static async findByPhone(phone) {
    try {
      const applications = db.prepare(
        `SELECT a.*, 
                COUNT(wr.id) as response_count
         FROM applications a
         LEFT JOIN worker_responses wr ON a.id = wr.application_id
         WHERE a.phone = ? 
         GROUP BY a.id 
         ORDER BY a.created_at DESC`
      ).all(phone);

      return applications.map(app => new Application(app));
    } catch (error) {
      throw new Error(`Error finding applications by phone: ${error.message}`);
    }
  }

  // Создать новую заявку
  static async create(applicationData) {
    try {
      const {
        name,
        phone,
        product_type,
        product,
        material = null,
        size = null,
        comment = null,
        user_id = null
      } = applicationData;

      const result = db.prepare(
        `INSERT INTO applications 
         (name, phone, product_type, product, material, size, comment, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(name, phone, product_type, product, material, size, comment, user_id);

      const newApplication = db.prepare(
        `SELECT * FROM applications WHERE id = ?`
      ).get(result.lastInsertRowid);

      return new Application(newApplication);
    } catch (error) {
      throw new Error(`Error creating application: ${error.message}`);
    }
  }

  // Обновить заявку
  async update(updates) {
    try {
      const allowedFields = [
        'name', 'phone', 'product_type', 'product', 'material', 
        'size', 'comment', 'status', 'marked_for_deletion'
      ];
      
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.id);

      db.prepare(
        `UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`
      ).run(...values);

      // Обновляем текущий объект
      const updatedApplication = db.prepare(
        `SELECT * FROM applications WHERE id = ?`
      ).get(this.id);

      Object.assign(this, updatedApplication);
      return this;
    } catch (error) {
      throw new Error(`Error updating application: ${error.message}`);
    }
  }

  // Добавить ответ работника
  async addWorkerResponse(workerId, response) {
    try {
      db.prepare(
        `INSERT INTO worker_responses (application_id, worker_id, response) 
         VALUES (?, ?, ?)`
      ).run(this.id, workerId, response);

      // Обновляем статус на "в работе" если он был "новый"
      if (this.status === 'new') {
        await this.update({ status: 'pending' });
      }

      // Обновляем responses текущего объекта
      const responses = db.prepare(
        `SELECT wr.*, u.name as worker_name, u.organization
         FROM worker_responses wr
         LEFT JOIN users u ON wr.worker_id = u.id
         WHERE wr.application_id = ?
         ORDER BY wr.created_at ASC`
      ).all(this.id);

      this.responses = responses;
      return this;
    } catch (error) {
      throw new Error(`Error adding worker response: ${error.message}`);
    }
  }

  // Пометить на удаление
  async markForDeletion() {
    try {
      await this.update({ marked_for_deletion: 1 });
      return true;
    } catch (error) {
      throw new Error(`Error marking application for deletion: ${error.message}`);
    }
  }

  // Удалить заявку (hard delete)
  async delete() {
    try {
      // Сначала удаляем связанные ответы
      db.prepare(
        `DELETE FROM worker_responses WHERE application_id = ?`
      ).run(this.id);

      // Затем удаляем саму заявку
      db.prepare(
        `DELETE FROM applications WHERE id = ?`
      ).run(this.id);

      return true;
    } catch (error) {
      throw new Error(`Error deleting application: ${error.message}`);
    }
  }

  /**
   * Выбор исполнителя для заявки
   */
  async markResponseAsChosen(workerId) {
    // Обновляем все ответы: помечаем выбранный
    const responses = this.responses || [];
    const updatedResponses = responses.map(response => ({
      ...response,
      is_chosen: response.worker_id === workerId
    }));
    
    await this.update({ responses: updatedResponses });
  }

  // Получить статистику по заявкам (ИСПРАВЛЕННЫЙ МЕТОД)
  static async getStats() {
    try {
      console.log('📊 Getting application statistics...');
      
      // Статистика по статусам
      const statusStats = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM applications 
        WHERE marked_for_deletion = 0
        GROUP BY status
      `).all();

      // Общее количество заявок
      const totalResult = db.prepare(`
        SELECT COUNT(*) as total FROM applications WHERE marked_for_deletion = 0
      `).get();

      // Количество новых заявок за последние 7 дней
      const recentCount = db.prepare(`
        SELECT COUNT(*) as count FROM applications 
        WHERE created_at >= datetime('now', '-7 days') AND marked_for_deletion = 0
      `).get();

      const stats = {
        total: totalResult.total,
        recent: recentCount.count,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {})
      };

      console.log('📊 Application stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error in Application.getStats:', error);
      throw new Error(`Error getting application stats: ${error.message}`);
    }
  }

  // Проверить, можно ли редактировать заявку
  canEdit() {
    return this.status === 'new' || this.status === 'in_progress';
  }

  // Проверить, помечена ли заявка на удаление
  isMarkedForDeletion() {
    return this.marked_for_deletion === 1;
  }

  // Получить форматированные данные для ответа
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      phone: this.phone,
      product_type: this.product_type,
      product: this.product,
      material: this.material,
      size: this.size,
      comment: this.comment,
      status: this.status,
      marked_for_deletion: this.isMarkedForDeletion(),
      responses: this.responses,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}