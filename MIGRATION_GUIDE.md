# MongoDB to MySQL Migration Guide

This guide explains how to migrate your Resell Panel application from MongoDB to MySQL.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up MySQL Database
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE resell_panel;
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=resell_panel
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Other configurations remain the same...
```

### 4. Run Migration (if you have existing MongoDB data)
```bash
node migrate-to-mysql.js
```

### 5. Start the Server
```bash
npm start
```

## 📋 What Changed

### Dependencies
- **Removed**: `mongoose` (MongoDB ODM)
- **Added**: `mysql2` (MySQL driver), `sequelize` (MySQL ORM)

### Database Models
All models have been converted from Mongoose to Sequelize:

#### User Model
- **Before**: MongoDB with Mongoose
- **After**: MySQL with Sequelize
- **Changes**: 
  - `_id` → `id` (auto-increment integer)
  - Field names converted to snake_case for database
  - Added proper foreign key constraints

#### GeneratedKey Model
- **Before**: MongoDB with ObjectId references
- **After**: MySQL with integer foreign keys
- **Changes**:
  - `userId` now references `users.id`
  - Added proper indexes for performance

#### Transaction Model
- **Before**: MongoDB with ObjectId references
- **After**: MySQL with integer foreign keys
- **Changes**:
  - `userId` now references `users.id`
  - Added proper indexes for performance

### API Changes
All API endpoints remain the same, but internal database operations have been updated:

#### Query Changes
```javascript
// MongoDB (Before)
User.findById(id)
User.findOne({ email: email })
User.countDocuments()

// MySQL/Sequelize (After)
User.findByPk(id)
User.findOne({ where: { email: email } })
User.count()
```

#### Aggregation Changes
```javascript
// MongoDB (Before)
Transaction.aggregate([
  { $match: { type: 'deposit' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
])

// MySQL/Sequelize (After)
Transaction.sum('amount', { where: { type: 'deposit' } })
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    credits INT NOT NULL DEFAULT 0,
    total_deposits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_deposit DATETIME NULL,
    keys_generated INT NOT NULL DEFAULT 0,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    theme ENUM('light', 'dark') NOT NULL DEFAULT 'dark',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    stripe_customer_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Generated Keys Table
```sql
CREATE TABLE generated_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    key VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('day', 'week', 'month', 'lifetime') NOT NULL,
    status ENUM('active', 'used', 'expired', 'revoked') NOT NULL DEFAULT 'active',
    generation_id VARCHAR(255) NOT NULL,
    generation_name VARCHAR(255) NOT NULL,
    batch_number INT NOT NULL DEFAULT 1,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    expires_at DATETIME NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal', 'purchase', 'refund', 'bonus') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency ENUM('USD', 'EUR', 'BTC', 'ETH', 'CREDITS') NOT NULL DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    payment_method ENUM('credit_card', 'cryptocurrency', 'paypal', 'bank_transfer', 'credits', 'stripe', 'stripe_free') NOT NULL,
    payment_id VARCHAR(255) NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    product_id VARCHAR(255) NULL,
    product_name VARCHAR(255) NULL,
    key_count INT NULL,
    generation_id VARCHAR(255) NULL,
    processed_at DATETIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 Configuration Files

### Environment Variables
Update your `.env` file with MySQL configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=resell_panel
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql

# Remove MongoDB configuration
# MONGODB_URI=mongodb://localhost:27017/resell_panel
```

### Package.json
Dependencies have been updated:
```json
{
  "dependencies": {
    "mysql2": "^3.6.0",
    "sequelize": "^6.32.1"
  }
}
```

## 🚨 Breaking Changes

### 1. Database Connection
- **Before**: MongoDB connection string
- **After**: MySQL connection parameters

### 2. Model References
- **Before**: `user._id` (ObjectId)
- **After**: `user.id` (Integer)

### 3. Query Syntax
- **Before**: Mongoose query syntax
- **After**: Sequelize query syntax

### 4. Aggregation
- **Before**: MongoDB aggregation pipeline
- **After**: Sequelize aggregation methods

## 🧪 Testing

### 1. Test Database Connection
```bash
node check-users.js
```

### 2. Test Admin Creation
```bash
node make-admin.js admin
```

### 3. Test API Endpoints
```bash
# Start server
npm start

# Test health endpoint
curl http://localhost:3001/health

# Test API endpoints
curl http://localhost:3001/api/test
```

## 🔄 Migration Process

### 1. Backup Existing Data
```bash
# Backup MongoDB data
mongodump --db resell_panel --out backup/
```

### 2. Run Migration Script
```bash
node migrate-to-mysql.js
```

### 3. Verify Migration
```bash
# Check users
node check-users.js

# Test API endpoints
npm start
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MySQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Ensure MySQL is running and credentials are correct.

#### 2. Table Not Found
```
Error: Table 'resell_panel.users' doesn't exist
```
**Solution**: Run `npm start` to auto-create tables, or run migration script.

#### 3. Foreign Key Constraint Error
```
Error: Cannot add or update a child row: a foreign key constraint fails
```
**Solution**: Ensure parent records exist before creating child records.

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
```

## 📊 Performance Considerations

### Indexes
The migration includes proper indexes for performance:
- User lookups: `username`, `email`
- Key queries: `user_id`, `generation_id`, `type`, `status`
- Transaction queries: `user_id`, `type`, `status`, `created_at`

### Connection Pooling
Sequelize is configured with connection pooling:
```javascript
pool: {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

## 🎯 Benefits of Migration

1. **ACID Compliance**: Full transaction support
2. **Better Performance**: Optimized queries and indexes
3. **Data Integrity**: Foreign key constraints
4. **Standardization**: SQL standard compliance
5. **Tooling**: Better admin tools (phpMyAdmin, etc.)

## 📞 Support

If you encounter issues during migration:

1. Check the logs for specific error messages
2. Verify MySQL is running and accessible
3. Ensure all environment variables are set correctly
4. Test database connection with provided scripts

## 🔄 Rollback Plan

If you need to rollback to MongoDB:

1. Restore from MongoDB backup
2. Revert package.json dependencies
3. Restore original model files
4. Update server.js connection logic

---

**Migration completed successfully!** 🎉

Your Resell Panel application is now running on MySQL with improved performance and data integrity.
