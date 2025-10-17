const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportedKey = sequelize.define('ImportedKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('steam', 'origin', 'uplay', 'epic', 'other'),
    allowNull: false
  },
  batch: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'used', 'reserved'),
    defaultValue: 'available'
  },
  usedBy: {
    type: DataTypes.INTEGER,
    field: 'used_by',
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  usedAt: {
    type: DataTypes.DATE,
    field: 'used_at',
    allowNull: true
  },
  addedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'added_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  addedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'added_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'imported_keys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['type', 'status']
    },
    {
      fields: ['batch']
    },
    {
      fields: ['used_by']
    },
    {
      fields: ['added_by']
    }
  ]
});

module.exports = ImportedKey;