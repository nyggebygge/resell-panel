const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resellpanel');
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ username: 'kevvy' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log('  - Username:', user.username);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Is Active:', user.isActive);
    console.log('  - Full user object:', JSON.stringify(user, null, 2));

    // Check if role is exactly 'admin'
    console.log('\n🔍 Role check:');
    console.log('  - user.role === "admin":', user.role === 'admin');
    console.log('  - typeof user.role:', typeof user.role);
    console.log('  - user.role length:', user.role ? user.role.length : 'null');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkUser();
