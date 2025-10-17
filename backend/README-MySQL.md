# Resell Panel Backend - MySQL Version

A comprehensive backend API for the Resell Panel application with MySQL database integration.

## 🚀 Features

- **MySQL Database** - Robust relational database with Sequelize ORM
- **User Authentication** - JWT-based authentication with registration and login
- **Key Generation** - Generate and manage keys with batch tracking
- **Transaction Management** - Complete transaction history and tracking
- **Security** - Rate limiting, CORS, Helmet security headers
- **API Documentation** - RESTful API with comprehensive endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup MySQL Database**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE resell_panel;
   
   # Or run the schema file
   mysql -u root -p < sql/schema.sql
   ```

4. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your MySQL configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=resell_panel
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_DIALECT=mysql
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    credits INT NOT NULL DEFAULT 0,
    total_deposits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_deposit DATETIME NULL,
    keys_generated INT NOT NULL DEFAULT 0,
    theme ENUM('light', 'dark') NOT NULL DEFAULT 'dark',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
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
    payment_method ENUM('credit_card', 'cryptocurrency', 'paypal', 'bank_transfer', 'credits') NOT NULL,
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

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Key Management
- `POST /api/keys/generate` - Generate new keys
- `GET /api/keys` - Get user's keys (with filtering)
- `GET /api/keys/:id` - Get specific key
- `DELETE /api/keys/:id` - Delete single key
- `DELETE /api/keys/batch/delete` - Delete multiple keys
- `DELETE /api/keys/generation/:generationId` - Delete entire generation
- `PUT /api/keys/:id/use` - Mark key as used
- `GET /api/keys/stats/overview` - Get key statistics

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Key Generation

### Generate Keys Request
```json
POST /api/keys/generate
{
  "type": "day|week|month|lifetime",
  "quantity": 1-1000
}
```

### Response
```json
{
  "success": true,
  "message": "Successfully generated 5 day keys",
  "data": {
    "generationId": "gen_1234567890_abc123",
    "generationName": "Day Keys - 12/15/2023",
    "keysGenerated": 5,
    "creditsUsed": 5,
    "keys": [...]
  }
}
```

## 🔍 Filtering and Pagination

### Get Keys with Filters
```
GET /api/keys?page=1&limit=12&type=day&status=active&generationId=gen_123
```

### Response
```json
{
  "success": true,
  "data": {
    "keys": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalKeys": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "generations": [...]
  }
}
```

## 🛡️ Security Features

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - Configurable origin restrictions
- **Helmet Security** - Security headers
- **Input Validation** - Request validation with express-validator
- **Password Hashing** - bcrypt with 12 rounds
- **JWT Security** - Secure token-based authentication

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring

- Health check endpoint: `GET /health`
- Server logs with timestamps
- Error tracking and logging
- Database connection monitoring

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=3001
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=resell_panel
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_DIALECT=mysql
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "errors": array (for validation errors)
}
```

## 🔧 Development

### Project Structure
```
backend/
├── config/         # Database configuration
├── models/         # Sequelize models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── sql/           # SQL schema files
├── server.js      # Main server file
├── package.json   # Dependencies
└── README-MySQL.md # This file
```

### Adding New Features
1. Create model in `models/`
2. Add routes in `routes/`
3. Update server.js with new routes
4. Add tests for new functionality
5. Update documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
