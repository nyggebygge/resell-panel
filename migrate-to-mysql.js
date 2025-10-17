const { sequelize } = require('./backend/config/database');
const User = require('./backend/models/User');
const GeneratedKey = require('./backend/models/GeneratedKey');
const Transaction = require('./backend/models/Transaction');
const ImportedKey = require('./backend/models/ImportedKey');
const UnusedKeys = require('./backend/models/UnusedKeys');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB models (for reading existing data)
const mongooseUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  credits: Number,
  totalDeposits: Number,
  lastDeposit: Date,
  keysGenerated: Number,
  role: String,
  theme: String,
  isActive: Boolean,
  lastLogin: Date,
  stripeCustomerId: String
}, { timestamps: true });

const mongooseGeneratedKeySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  key: String,
  type: String,
  status: String,
  generationId: String,
  generationName: String,
  batchNumber: Number,
  generatedAt: Date,
  usedAt: Date,
  expiresAt: Date,
  notes: String,
  isActive: Boolean
}, { timestamps: true });

const mongooseTransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  currency: String,
  status: String,
  paymentMethod: String,
  paymentId: String,
  description: String,
  productId: String,
  productName: String,
  keyCount: Number,
  generationId: String,
  processedAt: Date,
  notes: String
}, { timestamps: true });

const MongooseUser = mongoose.model('User', mongooseUserSchema);
const MongooseGeneratedKey = mongoose.model('GeneratedKey', mongooseGeneratedKeySchema);
const MongooseTransaction = mongoose.model('Transaction', mongooseTransactionSchema);

async function migrateData() {
  try {
    console.log('🚀 Starting migration from MongoDB to MySQL...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resell_panel';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Connect to MySQL
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');
    
    // Sync MySQL tables
    await sequelize.sync({ force: true });
    console.log('✅ MySQL tables synchronized');
    
    // Migrate Users
    console.log('📦 Migrating users...');
    const mongoUsers = await MongooseUser.find({});
    const userMap = new Map(); // Map MongoDB _id to MySQL id
    
    for (const mongoUser of mongoUsers) {
      const mysqlUser = await User.create({
        username: mongoUser.username,
        email: mongoUser.email,
        password: mongoUser.password,
        credits: mongoUser.credits || 0,
        totalDeposits: mongoUser.totalDeposits || 0,
        lastDeposit: mongoUser.lastDeposit,
        keysGenerated: mongoUser.keysGenerated || 0,
        role: mongoUser.role || 'user',
        theme: mongoUser.theme || 'dark',
        isActive: mongoUser.isActive !== false,
        lastLogin: mongoUser.lastLogin,
        stripeCustomerId: mongoUser.stripeCustomerId,
        createdAt: mongoUser.createdAt,
        updatedAt: mongoUser.updatedAt
      });
      
      userMap.set(mongoUser._id.toString(), mysqlUser.id);
      console.log(`  ✅ Migrated user: ${mongoUser.username} (${mongoUser._id} -> ${mysqlUser.id})`);
    }
    
    // Migrate Generated Keys
    console.log('🔑 Migrating generated keys...');
    const mongoKeys = await MongooseGeneratedKey.find({});
    
    for (const mongoKey of mongoKeys) {
      const mysqlUserId = userMap.get(mongoKey.userId.toString());
      if (mysqlUserId) {
        await GeneratedKey.create({
          userId: mysqlUserId,
          key: mongoKey.key,
          type: mongoKey.type,
          status: mongoKey.status || 'active',
          generationId: mongoKey.generationId,
          generationName: mongoKey.generationName,
          batchNumber: mongoKey.batchNumber || 1,
          generatedAt: mongoKey.generatedAt || mongoKey.createdAt,
          usedAt: mongoKey.usedAt,
          expiresAt: mongoKey.expiresAt,
          notes: mongoKey.notes,
          isActive: mongoKey.isActive !== false,
          createdAt: mongoKey.createdAt,
          updatedAt: mongoKey.updatedAt
        });
        console.log(`  ✅ Migrated key: ${mongoKey.key}`);
      }
    }
    
    // Migrate Transactions
    console.log('💰 Migrating transactions...');
    const mongoTransactions = await MongooseTransaction.find({});
    
    for (const mongoTransaction of mongoTransactions) {
      const mysqlUserId = userMap.get(mongoTransaction.userId.toString());
      if (mysqlUserId) {
        await Transaction.create({
          userId: mysqlUserId,
          type: mongoTransaction.type,
          amount: mongoTransaction.amount,
          currency: mongoTransaction.currency || 'USD',
          status: mongoTransaction.status || 'pending',
          paymentMethod: mongoTransaction.paymentMethod,
          paymentId: mongoTransaction.paymentId,
          description: mongoTransaction.description,
          productId: mongoTransaction.productId,
          productName: mongoTransaction.productName,
          keyCount: mongoTransaction.keyCount,
          generationId: mongoTransaction.generationId,
          processedAt: mongoTransaction.processedAt,
          notes: mongoTransaction.notes,
          createdAt: mongoTransaction.createdAt,
          updatedAt: mongoTransaction.updatedAt
        });
        console.log(`  ✅ Migrated transaction: ${mongoTransaction.type} - ${mongoTransaction.amount}`);
      }
    }
    
    // Create default unused keys document
    console.log('🗝️  Creating unused keys document...');
    await UnusedKeys.create({
      dayKeys: [],
      weekKeys: [],
      monthKeys: [],
      lifetimeKeys: []
    });
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Migrated:`);
    console.log(`  - ${mongoUsers.length} users`);
    console.log(`  - ${mongoKeys.length} generated keys`);
    console.log(`  - ${mongoTransactions.length} transactions`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    await sequelize.close();
    console.log('🔌 Database connections closed');
  }
}

migrateData();
