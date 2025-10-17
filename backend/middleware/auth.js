const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth middleware - Authorization header:', authHeader);
    console.log('Auth middleware - Token:', token ? token.substring(0, 20) + '...' : 'No token');

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    const user = await User.findByPk(decoded.userId);
    console.log('Auth middleware - User from DB:', user ? {
      username: user.username,
      role: user.role,
      isActive: user.isActive
    } : 'No user found');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
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

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Optional authentication (for public endpoints that can use user data if available)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Check if user has sufficient credits
const requireCredits = (requiredCredits) => {
  return (req, res, next) => {
    if (req.user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Required: ${requiredCredits}, Available: ${req.user.credits}`
      });
    }
    next();
  };
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  console.log('🔒 requireAdmin middleware called');
  console.log('requireAdmin - User:', req.user ? req.user.username : 'No user');
  console.log('requireAdmin - User role:', req.user ? req.user.role : 'No role');
  console.log('requireAdmin - User object:', req.user);
  
  if (!req.user || req.user.role !== 'admin') {
    console.log('❌ requireAdmin - Access denied');
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  console.log('✅ requireAdmin - Access granted');
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireCredits,
  requireAdmin
};