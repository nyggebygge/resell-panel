const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UnusedKeys = sequelize.define('UnusedKeys', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dayKeys: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'day_keys'
  },
  weekKeys: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'week_keys'
  },
  monthKeys: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'month_keys'
  },
  lifetimeKeys: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'lifetime_keys'
  },
  totalDayKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_day_keys'
  },
  totalWeekKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_week_keys'
  },
  totalMonthKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_month_keys'
  },
  totalLifetimeKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_lifetime_keys'
  },
  availableDayKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'available_day_keys'
  },
  availableWeekKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'available_week_keys'
  },
  availableMonthKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'available_month_keys'
  },
  availableLifetimeKeys: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'available_lifetime_keys'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_updated'
  }
}, {
  tableName: 'unused_keys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeSave: (instance) => {
      // Update counts before saving
      if (instance.dayKeys) {
        instance.totalDayKeys = instance.dayKeys.length;
        instance.availableDayKeys = instance.dayKeys.filter(key => key.status === 'available').length;
      }
      if (instance.weekKeys) {
        instance.totalWeekKeys = instance.weekKeys.length;
        instance.availableWeekKeys = instance.weekKeys.filter(key => key.status === 'available').length;
      }
      if (instance.monthKeys) {
        instance.totalMonthKeys = instance.monthKeys.length;
        instance.availableMonthKeys = instance.monthKeys.filter(key => key.status === 'available').length;
      }
      if (instance.lifetimeKeys) {
        instance.totalLifetimeKeys = instance.lifetimeKeys.length;
        instance.availableLifetimeKeys = instance.lifetimeKeys.filter(key => key.status === 'available').length;
      }
      instance.lastUpdated = new Date();
    }
  }
});

// Static method to get or create the unused keys document
UnusedKeys.getUnusedKeys = async function() {
  let unusedKeys = await this.findOne();
  if (!unusedKeys) {
    unusedKeys = await this.create({
      dayKeys: [],
      weekKeys: [],
      monthKeys: [],
      lifetimeKeys: []
    });
  }
  return unusedKeys;
};

// Method to add keys
UnusedKeys.prototype.addKeys = function(type, keys) {
  const keyArray = keys.map(key => ({
    key: key.trim(),
    status: 'available',
    addedAt: new Date()
  }));
  
  switch(type) {
    case 'day':
      this.dayKeys = [...(this.dayKeys || []), ...keyArray];
      break;
    case 'week':
      this.weekKeys = [...(this.weekKeys || []), ...keyArray];
      break;
    case 'month':
      this.monthKeys = [...(this.monthKeys || []), ...keyArray];
      break;
    case 'lifetime':
      this.lifetimeKeys = [...(this.lifetimeKeys || []), ...keyArray];
      break;
    default:
      throw new Error('Invalid key type');
  }
  
  return this.save();
};

// Method to get available key
UnusedKeys.prototype.getAvailableKey = function(type) {
  let keyArray;
  switch(type) {
    case 'day':
      keyArray = this.dayKeys || [];
      break;
    case 'week':
      keyArray = this.weekKeys || [];
      break;
    case 'month':
      keyArray = this.monthKeys || [];
      break;
    case 'lifetime':
      keyArray = this.lifetimeKeys || [];
      break;
    default:
      throw new Error('Invalid key type');
  }
  
  return keyArray.find(key => key.status === 'available');
};

// Method to mark key as used
UnusedKeys.prototype.markKeyAsUsed = function(type, keyId, userId) {
  let keyArray;
  switch(type) {
    case 'day':
      keyArray = this.dayKeys || [];
      break;
    case 'week':
      keyArray = this.weekKeys || [];
      break;
    case 'month':
      keyArray = this.monthKeys || [];
      break;
    case 'lifetime':
      keyArray = this.lifetimeKeys || [];
      break;
    default:
      throw new Error('Invalid key type');
  }
  
  const keyIndex = keyArray.findIndex(key => key.id === keyId);
  if (keyIndex !== -1) {
    keyArray[keyIndex].status = 'used';
    keyArray[keyIndex].usedBy = userId;
    keyArray[keyIndex].usedAt = new Date();
    
    // Update the array in the instance
    switch(type) {
      case 'day':
        this.dayKeys = keyArray;
        break;
      case 'week':
        this.weekKeys = keyArray;
        break;
      case 'month':
        this.monthKeys = keyArray;
        break;
      case 'lifetime':
        this.lifetimeKeys = keyArray;
        break;
    }
    
    return this.save();
  }
  throw new Error('Key not found');
};

module.exports = UnusedKeys;