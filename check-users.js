const { sequelize } = require('./backend/config/database');
const User = require('./backend/models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'createdAt']
    });
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

checkUsers();