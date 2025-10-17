const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./backend/config/database');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security middleware with disabled CSP for development
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS configuration for Railway
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.RAILWAY_PUBLIC_DOMAIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection is now handled in backend/config/database.js

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.use(express.static('.'));

// Import and use all API routes
const authRoutes = require('./backend/routes/auth');
const adminRoutes = require('./backend/routes/admin');
const keysRoutes = require('./backend/routes/keys');
const paymentsRoutes = require('./backend/routes/payments');
const analyticsRoutes = require('./backend/routes/analytics');

// Use API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/analytics', analyticsRoutes);

// API routes (simplified)
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server is ready!`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    console.log('⚠️  Server failed to start, but continuing...');
  }
};

startServer();
