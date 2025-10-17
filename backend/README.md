# Resell Panel Backend API

A comprehensive backend API for the Resell Panel application with user management, key generation, and transaction tracking.

## 🚀 Features

- **User Authentication** - JWT-based authentication with registration and login
- **Key Generation** - Generate and manage keys with batch tracking
- **User Management** - Profile management and statistics
- **Transaction Tracking** - Complete transaction history
- **Database Integration** - MongoDB with Mongoose ODM
- **Security** - Rate limiting, CORS, Helmet security headers
- **API Documentation** - RESTful API with comprehensive endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
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

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/resell_panel
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
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

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String (unique, required)
  email: String (unique, required)
  password: String (hashed, required)
  balance: Number (default: 0)
  credits: Number (default: 0)
  totalDeposits: Number (default: 0)
  keysGenerated: Number (default: 0)
  theme: String (enum: ['light', 'dark'])
  isActive: Boolean (default: true)
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
```

### GeneratedKey Model
```javascript
{
  userId: ObjectId (ref: User)
  key: String (unique, required)
  type: String (enum: ['day', 'week', 'month', 'lifetime'])
  status: String (enum: ['active', 'used', 'expired', 'revoked'])
  generationId: String (required, indexed)
  generationName: String (required)
  batchNumber: Number (default: 1)
  generatedAt: Date (default: now)
  usedAt: Date
  expiresAt: Date
  notes: String
  isActive: Boolean (default: true)
}
```

### Transaction Model
```javascript
{
  userId: ObjectId (ref: User)
  type: String (enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'bonus'])
  amount: Number (required)
  currency: String (enum: ['USD', 'EUR', 'BTC', 'ETH', 'CREDITS'])
  status: String (enum: ['pending', 'completed', 'failed', 'cancelled'])
  paymentMethod: String (required)
  paymentId: String (unique)
  description: String (required)
  metadata: Object
  processedAt: Date
  notes: String
}
```

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
MONGODB_URI=mongodb://your-mongodb-uri
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
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── server.js       # Main server file
├── package.json    # Dependencies
└── README.md       # Documentation
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
