const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
require('dotenv').config({ path: './.env' });

// Environment variables loaded from .env file
console.log('✅ Environment variables loaded successfully');

// Import database and models
const User = require('./models/User');
const GeneratedKey = require('./models/GeneratedKey');
const Transaction = require('./models/Transaction');
const ImportedKey = require('./models/ImportedKey');
const UnusedKeys = require('./models/UnusedKeys');

// Import routes
const authRoutes = require('./routes/auth');
const keyRoutes = require('./routes/keys');
const adminRoutes = require('./routes/admin');
const simpleAnalyticsRoutes = require('./routes/simple-analytics');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration for Railway
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.RAILWAY_PUBLIC_DOMAIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection and sync
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing MySQL...');
    
    // Connect to MySQL
    await connectDB();
    
    console.log('✅ MySQL initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/analytics', simpleAnalyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Sequelize validation error
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  // Sequelize unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0].path;
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🗄️  Database: MySQL`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  const { sequelize } = require('./config/database');
  await sequelize.close();
  console.log('MySQL connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  const { sequelize } = require('./config/database');
  await sequelize.close();
  console.log('MySQL connection closed');
  process.exit(0);
});

module.exports = app;