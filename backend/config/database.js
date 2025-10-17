const { Sequelize } = require('sequelize');
require('dotenv').config();

// MySQL connection configuration for Railway
const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'resell_panel',
  process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
  process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
  {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.DB_PORT || process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

// Test connection
const connectDB = async () => {
  try {
    console.log('🔍 Attempting to connect to MySQL...');
    console.log('🔍 Database:', process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'resell_panel');
    console.log('🔍 Host:', process.env.DB_HOST || process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost');
    console.log('🔍 Port:', process.env.DB_PORT || process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306);
    console.log('🔍 User:', process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQLUSER || 'root');
    
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');
    
    return sequelize;
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    console.log('⚠️  Continuing without MySQL for now...');
    // Don't exit, let the server start anyway
    return null;
  }
};

// Test connection function
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  connectDB,
  testConnection
};