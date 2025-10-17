const mongoose = require('mongoose');

async function clearRailwayDatabase() {
  try {
    // Use your Railway MongoDB Atlas URI
    const mongoURI = 'mongodb+srv://Kevvy:Trokadero66@resellpanel.en1bjxe.mongodb.net/resell_panel?retryWrites=true&w=majority&appName=Resellpanel';
    
    console.log('🔍 Connecting to Railway MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to Railway MongoDB Atlas');

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
