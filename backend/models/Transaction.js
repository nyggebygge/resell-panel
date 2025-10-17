const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'purchase', 'refund', 'bonus'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('USD', 'EUR', 'BTC', 'ETH', 'CREDITS'),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('credit_card', 'cryptocurrency', 'paypal', 'bank_transfer', 'credits', 'stripe', 'stripe_free'),
    allowNull: false,
    field: 'payment_method'
  },
  paymentId: {
    type: DataTypes.STRING(255),
    unique: true,
    field: 'payment_id',
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  productId: {
    type: DataTypes.STRING(255),
    field: 'product_id',
    allowNull: true
  },
  productName: {
    type: DataTypes.STRING(255),
    field: 'product_name',
    allowNull: true
  },
  keyCount: {
    type: DataTypes.INTEGER,
    field: 'key_count',
    allowNull: true
  },
  generationId: {
    type: DataTypes.STRING(255),
    field: 'generation_id',
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    field: 'processed_at',
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'type']
    },
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['payment_id']
    }
  ]
});

module.exports = Transaction;