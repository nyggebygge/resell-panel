const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const GeneratedKey = require('../models/GeneratedKey');
const UnusedKeys = require('../models/UnusedKeys');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken, requireCredits } = require('../middleware/auth');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Generate random key
const generateRandomKey = () => {
  const chars = process.env.KEY_CHARS || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = parseInt(process.env.KEY_LENGTH) || 16;
  
  console.log('🔑 Generating key with chars:', chars, 'length:', length);
  
  // Ensure we have valid parameters
  if (!chars || chars.length === 0) {
    console.error('❌ Invalid chars:', chars);
    return 'INVALID_CHARS';
  }
  
  if (!length || length <= 0) {
    console.error('❌ Invalid length:', length);
    return 'INVALID_LENGTH';
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  
  console.log('🔑 Generated key:', result);
  
  // Ensure we actually generated something
  if (!result || result.length === 0) {
    console.error('❌ Generated empty key!');
    return 'EMPTY_KEY';
  }
  
  return result;
};

// Generate keys
router.post('/generate', authenticateToken, [
  body('type')
    .isIn(['day', 'week', 'month', 'lifetime'])
    .withMessage('Type must be day, week, month, or lifetime'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('You can only generate 100 keys at a time. Please reduce the quantity.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, quantity } = req.body;
    
    // Additional validation: Ensure quantity doesn't exceed 100
    if (quantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'You can only generate 100 keys at a time. Please reduce the quantity.',
        error: 'QUANTITY_LIMIT_EXCEEDED'
      });
    }
    
    // Calculate required credits (example: 1 credit per key)
    const requiredCredits = quantity;
    
    // Check if user has sufficient credits
    if (req.user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Required: ${requiredCredits}, Available: ${req.user.credits}`
      });
    }

    // Create generation batch
    const generationId = `gen_${Date.now()}_${uuidv4().substr(0, 8)}`;
    const generationName = `${type.charAt(0).toUpperCase() + type.slice(1)} Keys - ${new Date().toLocaleDateString()}`;

    // Get unused keys from database
    const unusedKeys = await UnusedKeys.getUnusedKeys();
    let availableKeys = [];
    
    // Get available keys based on type
    switch(type) {
      case 'day':
        availableKeys = (unusedKeys.dayKeys || []).filter(key => key.status === 'available');
        break;
      case 'week':
        availableKeys = (unusedKeys.weekKeys || []).filter(key => key.status === 'available');
        break;
      case 'month':
        availableKeys = (unusedKeys.monthKeys || []).filter(key => key.status === 'available');
        break;
      case 'lifetime':
        availableKeys = (unusedKeys.lifetimeKeys || []).filter(key => key.status === 'available');
        break;
    }

    if (availableKeys.length < quantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough ${type} keys available. Requested: ${quantity}, Available: ${availableKeys.length}`
      });
    }

    // Take the required number of keys
    const keysToUse = availableKeys.slice(0, quantity);
    const generatedKeys = [];

    // Move keys from unused to generated
    for (const unusedKey of keysToUse) {
      // Create generated key record
      const generatedKey = await GeneratedKey.create({
        userId: req.user.id,
        key: unusedKey.key,
        type: type,
        status: 'active',
        generationId: generationId,
        generationName: generationName,
        batchNumber: 1,
        generatedAt: new Date(),
        isActive: true
      });

      generatedKeys.push(generatedKey);
    }

    // Remove used keys from unused keys arrays
    switch(type) {
      case 'day':
        unusedKeys.dayKeys = unusedKeys.dayKeys.filter(key => 
          !keysToUse.some(usedKey => usedKey.key === key.key)
        );
        break;
      case 'week':
        unusedKeys.weekKeys = unusedKeys.weekKeys.filter(key => 
          !keysToUse.some(usedKey => usedKey.key === key.key)
        );
        break;
      case 'month':
        unusedKeys.monthKeys = unusedKeys.monthKeys.filter(key => 
          !keysToUse.some(usedKey => usedKey.key === key.key)
        );
        break;
      case 'lifetime':
        unusedKeys.lifetimeKeys = unusedKeys.lifetimeKeys.filter(key => 
          !keysToUse.some(usedKey => usedKey.key === key.key)
        );
        break;
    }

    // Save unused keys with removed keys
    await unusedKeys.save();

    // Deduct credits and update user stats
    await User.update({
      credits: req.user.credits - requiredCredits,
      keysGenerated: req.user.keysGenerated + quantity
    }, {
      where: { id: req.user.id }
    });

    // Create transaction record
    await Transaction.create({
      userId: req.user.id,
      type: 'purchase',
      amount: requiredCredits,
      currency: 'CREDITS',
      status: 'completed',
      paymentMethod: 'credits',
      description: `Generated ${quantity} ${type} keys`,
      keyCount: quantity,
      generationId: generationId,
      productName: `${type} Keys`
    });

    res.json({
      success: true,
      message: `Successfully generated ${quantity} ${type} keys`,
      data: {
        type: type,
        generationId,
        generationName,
        keysGenerated: generatedKeys.length,
        creditsUsed: requiredCredits,
        keys: generatedKeys.map(key => ({
          id: key.id,
          key: key.key,
          type: key.type,
          status: key.status,
          generatedAt: key.generatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Key generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Key generation failed'
    });
  }
});

// Get user's keys with filtering and pagination
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['day', 'week', 'month', 'lifetime']).withMessage('Invalid type filter'),
  query('status').optional().isIn(['active', 'used', 'expired', 'revoked']).withMessage('Invalid status filter'),
  query('generationId').optional().isString().withMessage('Invalid generation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    // Build filter object
    const whereClause = { userId: req.user.id };
    if (req.query.type) whereClause.type = req.query.type;
    if (req.query.status) whereClause.status = req.query.status;
    if (req.query.generationId) whereClause.generationId = req.query.generationId;

    // Get keys with pagination
    const { count, rows: keys } = await GeneratedKey.findAndCountAll({
      where: whereClause,
      order: [['generatedAt', 'DESC']],
      limit: limit,
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    // Get generation overview
    const generations = await GeneratedKey.findAll({
      where: { userId: req.user.id },
      attributes: [
        'generationId',
        'generationName',
        'type',
        'generatedAt'
      ],
      group: ['generationId', 'generationName', 'type', 'generatedAt'],
      order: [['generatedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        keys,
        pagination: {
          currentPage: page,
          totalPages,
          totalKeys: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        generations
      }
    });
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch keys'
    });
  }
});

// Get key by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const key = await GeneratedKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }

    res.json({
      success: true,
      data: { key }
    });
  } catch (error) {
    console.error('Get key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch key'
    });
  }
});

// Delete single key
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const key = await GeneratedKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }

    await GeneratedKey.destroy({
      where: { id: req.params.id }
    });

    // Update user stats
    await User.update({
      keysGenerated: req.user.keysGenerated - 1
    }, {
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Key deleted successfully'
    });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete key'
    });
  }
});

// Delete multiple keys
router.delete('/batch/delete', authenticateToken, [
  body('keyIds')
    .isArray({ min: 1 })
    .withMessage('Key IDs array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { keyIds } = req.body;

    // Delete keys
    const deletedCount = await GeneratedKey.destroy({
      where: {
        id: { [Op.in]: keyIds },
        userId: req.user.id
      }
    });

    // Update user stats
    await User.update({
      keysGenerated: req.user.keysGenerated - deletedCount
    }, {
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} keys`,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete keys'
    });
  }
});

// Delete entire generation
router.delete('/generation/:generationId', authenticateToken, async (req, res) => {
  try {
    const { generationId } = req.params;

    // Get generation info first
    const generationKeys = await GeneratedKey.findAll({
      where: {
        userId: req.user.id,
        generationId
      }
    });

    if (generationKeys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Generation not found'
      });
    }

    // Delete all keys in generation
    const deletedCount = await GeneratedKey.destroy({
      where: {
        userId: req.user.id,
        generationId: generationId
      }
    });

    // Update user stats
    await User.update({
      keysGenerated: req.user.keysGenerated - deletedCount
    }, {
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: `Successfully deleted generation with ${deletedCount} keys`,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('Delete generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete generation'
    });
  }
});

// Mark key as used
router.put('/:id/use', authenticateToken, async (req, res) => {
  try {
    const key = await GeneratedKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }

    if (key.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Key is not active'
      });
    }

    await key.markAsUsed();

    res.json({
      success: true,
      message: 'Key marked as used',
      data: { key }
    });
  } catch (error) {
    console.error('Use key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark key as used'
    });
  }
});

// Get key statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await GeneratedKey.findAll({
      where: { userId: req.user.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalKeys'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'activeKeys'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'used' THEN 1 ELSE 0 END")), 'usedKeys'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN type = 'day' THEN 1 ELSE 0 END")), 'dayKeys'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN type = 'week' THEN 1 ELSE 0 END")), 'weekKeys'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN type = 'lifetime' THEN 1 ELSE 0 END")), 'lifetimeKeys']
      ],
      raw: true
    });

    const result = stats[0] || {
      totalKeys: 0,
      activeKeys: 0,
      usedKeys: 0,
      dayKeys: 0,
      weekKeys: 0,
      lifetimeKeys: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;