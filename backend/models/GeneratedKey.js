const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GeneratedKey = sequelize.define('GeneratedKey', {
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
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('day', 'week', 'month', 'lifetime'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'used', 'expired', 'revoked'),
    defaultValue: 'active'
  },
  generationId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'generation_id'
  },
  generationName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'generation_name'
  },
  batchNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'batch_number'
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'generated_at'
  },
  usedAt: {
    type: DataTypes.DATE,
    field: 'used_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'generated_keys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'generation_id']
    },
    {
      fields: ['user_id', 'type']
    },
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['generation_id']
    }
  ]
});

// Instance methods
GeneratedKey.prototype.markAsUsed = async function() {
  this.status = 'used';
  this.usedAt = new Date();
  return this.save();
};

module.exports = GeneratedKey;