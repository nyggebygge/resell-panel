const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalDeposits: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'total_deposits'
  },
  lastDeposit: {
    type: DataTypes.DATE,
    field: 'last_deposit'
  },
  keysGenerated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'keys_generated'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark'),
    defaultValue: 'dark'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  stripeCustomerId: {
    type: DataTypes.STRING(255),
    field: 'stripe_customer_id',
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

User.prototype.getStats = function() {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    credits: this.credits,
    totalDeposits: this.totalDeposits,
    keysGenerated: this.keysGenerated,
    role: this.role,
    isActive: this.isActive,
    theme: this.theme,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

module.exports = User;