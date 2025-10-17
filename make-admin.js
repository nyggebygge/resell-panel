const { sequelize } = require('./backend/config/database');
const User = require('./backend/models/User');
require('dotenv').config();

async function makeUserAdmin() {
  try {
    // Connect to MySQL
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Find the user by username or email
    const username = process.argv[2] || 'admin';
    console.log(`🔍 Looking for user: ${username}`);

    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: username },
          { email: username }
        ]
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log('  - ID:', user.id);
    console.log('  - Username:', user.username);
    console.log('  - Email:', user.email);
    console.log('  - Current Role:', user.role);
    console.log('  - Is Active:', user.isActive);

    // Update user role to admin
    await user.update({ role: 'admin' });
    console.log('✅ User role updated to admin');

    // Verify the update
    const updatedUser = await User.findByPk(user.id);
    console.log('🔍 Updated user role:', updatedUser.role);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

makeUserAdmin();