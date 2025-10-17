const mongoose = require('mongoose');

async function clearRailwayDatabase() {
  try {
    // This will use Railway's environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      return;
    }
    
    console.log('🔍 Connecting to Railway MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to Railway MongoDB');

    // Clear all collections
    const collections = ['users', 'transactions', 'generatedkeys'];
    
    for (const collectionName of collections) {
      try {
        const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} documents from ${collectionName}`);
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} doesn't exist or couldn't be cleared`);
      }
    }

    console.log('✅ Railway database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing Railway database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

clearRailwayDatabase();
