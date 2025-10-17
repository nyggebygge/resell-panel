const { sequelize } = require('./backend/config/database');
require('dotenv').config();

async function clearDatabase() {
  try {
    // Load environment variables from .env file
    require('dotenv').config({ path: './.env' });
    
    console.log('🔍 Database:', process.env.DB_NAME || 'resell_panel');
    console.log('🔍 Host:', process.env.DB_HOST || 'localhost');
    console.log('🔍 Port:', process.env.DB_PORT || 3306);
    
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Clear all tables
    const tables = ['transactions', 'generated_keys', 'imported_keys', 'unused_keys', 'users'];
    
    for (const tableName of tables) {
      try {
        await sequelize.query(`DELETE FROM ${tableName}`);
        console.log(`🗑️  Cleared table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Table ${tableName} doesn't exist or couldn't be cleared:`, error.message);
      }
    }

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

clearDatabase();