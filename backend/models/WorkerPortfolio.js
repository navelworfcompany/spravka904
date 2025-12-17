// models/WorkerPortfolio.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerPortfolio = sequelize.define('WorkerPortfolio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  }
}, {
  tableName: 'worker_portfolios',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['workerId', 'productId']
    }
  ]
});

module.exports = WorkerPortfolio;