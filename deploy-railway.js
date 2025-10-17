const { sequelize } = require('./backend/config/database');
const User = require('./backend/models/User');
const GeneratedKey = require('./backend/models/GeneratedKey');
const Transaction = require('./backend/models/Transaction');
const ImportedKey = require('./backend/models/ImportedKey');
const UnusedKeys = require('./backend/models/UnusedKeys');

async function setupRailwayDatabase() {
  try {
    console.log('🚀 Setting up Railway MySQL database...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to Railway MySQL');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');
    
    // Create default admin user if none exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@resellpanel.com',
        password: 'admin123', // Change this in production!
        role: 'admin',
        credits: 1000,
        isActive: true
      });
      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Email: admin@resellpanel.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGE THE PASSWORD IN PRODUCTION!');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create default unused keys document
    const unusedKeysExists = await UnusedKeys.findOne();
    if (!unusedKeysExists) {
      await UnusedKeys.create({
        dayKeys: [],
        weekKeys: [],
        monthKeys: [],
        lifetimeKeys: []
      });
      console.log('✅ Unused keys document created');
    } else {
      console.log('✅ Unused keys document already exists');
    }
    
    console.log('🎉 Railway database setup complete!');
    console.log('📊 Database status:');
    console.log(`   - Users: ${await User.count()}`);
    console.log(`   - Generated Keys: ${await GeneratedKey.count()}`);
    console.log(`   - Transactions: ${await Transaction.count()}`);
    console.log(`   - Imported Keys: ${await ImportedKey.count()}`);
    
  } catch (error) {
    console.error('❌ Railway database setup failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupRailwayDatabase();
}

module.exports = setupRailwayDatabase;
