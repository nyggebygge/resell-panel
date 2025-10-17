const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const GeneratedKey = require('../models/GeneratedKey');
const ImportedKey = require('../models/ImportedKey');
const UnusedKeys = require('../models/UnusedKeys');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Admin authentication middleware
router.use(adminAuth);

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalKeys,
            totalRevenue
        ] = await Promise.all([
            User.count(),
            User.count({ where: { isActive: true } }),
            GeneratedKey.count(),
            Transaction.sum('amount', { where: { type: 'deposit' } })
        ]);

        const revenue = totalRevenue || 0;

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                totalKeys,
                totalRevenue: revenue
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin statistics'
        });
    }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = '',
            status = '',
            role = '',
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Build filter query
        const whereClause = {};
        
        if (search) {
            whereClause[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (status) {
            whereClause.isActive = status === 'active';
        }
        
        if (role) {
            whereClause.role = role;
        }

        // Build sort order
        const order = [];
        order.push([sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']);

        const { count: total, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: order,
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get single user
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { username, email, password, role = 'user', credits = 0 } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password,
            role,
            credits: parseFloat(credits)
        });

        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const { username, email, role, credits, isActive } = req.body;
        
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (credits !== undefined) updateData.credits = parseInt(credits);
        if (isActive !== undefined) updateData.isActive = isActive;

        const user = await User.update(updateData, {
            where: { id: req.params.id },
            returning: true
        });

        if (user[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
});

// Toggle user status
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const [updatedRows] = await User.update(
            { isActive },
            { where: { id: req.params.id } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const deletedRows = await User.destroy({
            where: { id: req.params.id }
        });
        
        if (deletedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete related data
        await Promise.all([
            GeneratedKey.destroy({ where: { userId: req.params.id } }),
            Transaction.destroy({ where: { userId: req.params.id } })
        ]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// Bulk activate users
router.post('/users/bulk-activate', async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No user IDs provided'
            });
        }

        const result = await User.update(
            { isActive: true },
            { where: { id: { [Op.in]: userIds } } }
        );

        res.json({
            success: true,
            message: `Activated ${result[0]} users successfully`,
            data: { modifiedCount: result[0] }
        });
    } catch (error) {
        console.error('Bulk activate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate users'
        });
    }
});

// Bulk deactivate users
router.post('/users/bulk-deactivate', async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No user IDs provided'
            });
        }

        const result = await User.update(
            { isActive: false },
            { where: { id: { [Op.in]: userIds } } }
        );

        res.json({
            success: true,
            message: `Deactivated ${result[0]} users successfully`,
            data: { modifiedCount: result[0] }
        });
    } catch (error) {
        console.error('Bulk deactivate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate users'
        });
    }
});

// Bulk delete users
router.post('/users/bulk-delete', async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No user IDs provided'
            });
        }

        // Delete users and related data
        const [userResult, keyResult, transactionResult] = await Promise.all([
            User.destroy({ where: { id: { [Op.in]: userIds } } }),
            GeneratedKey.destroy({ where: { userId: { [Op.in]: userIds } } }),
            Transaction.destroy({ where: { userId: { [Op.in]: userIds } } })
        ]);

        res.json({
            success: true,
            message: `Deleted ${userResult} users successfully`,
            data: {
                deletedUsers: userResult,
                deletedKeys: keyResult,
                deletedTransactions: transactionResult
            }
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete users'
        });
    }
});

// Get recent activity
router.get('/activity', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // Get recent user activities
        const recentUsers = await User.findAll({
            order: [['lastLogin', 'DESC']],
            limit: parseInt(limit),
            attributes: ['username', 'email', 'lastLogin', 'created_at']
        });

        const activities = recentUsers.map(user => ({
            type: 'login',
            title: 'User Activity',
            description: `${user.username} last active`,
            timestamp: user.lastLogin || user.created_at
        }));

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activity'
        });
    }
});

// Verify admin token
router.get('/verify', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Verify admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify admin access'
        });
    }
});

// Key Management Routes

// Import keys
router.post('/import-keys', async (req, res) => {
    try {
        const { type, batch, keys } = req.body;
        
        if (!type || !batch || !keys || !Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Type, batch, and keys array are required'
            });
        }

        // Validate keys
        const validKeys = keys.filter(key => key && key.trim().length > 0);
        if (validKeys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid keys provided'
            });
        }

        // Check for duplicate keys
        const existingKeys = await ImportedKey.findAll({ 
            where: { key: { [Op.in]: validKeys } }
        });
        
        if (existingKeys.length > 0) {
            return res.status(400).json({
                success: false,
                message: `${existingKeys.length} keys already exist in the database`
            });
        }

        // Create key documents
        const keyDocuments = validKeys.map(key => ({
            key: key.trim(),
            type: type,
            batch: batch,
            status: 'available',
            addedBy: req.user.id
        }));

        // Insert keys
        const insertedKeys = await ImportedKey.bulkCreate(keyDocuments);

        res.json({
            success: true,
            message: `Successfully imported ${insertedKeys.length} keys`,
            importedCount: insertedKeys.length,
            keys: insertedKeys
        });
    } catch (error) {
        console.error('Key import error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import keys',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all keys
router.get('/keys', async (req, res) => {
    try {
        console.log('🔑 Admin keys endpoint called');
        const { page = 1, limit = 50, type, status, batch } = req.query;
        
        // Build filter
        const whereClause = {};
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;
        if (batch) whereClause.batch = { [Op.like]: `%${batch}%` };

        // Get keys with pagination
        console.log('🔑 Querying ImportedKey model...');
        const { count: total, rows: keys } = await ImportedKey.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        console.log('🔑 Found keys:', keys.length);
        console.log('🔑 Total keys:', total);

        res.json({
            success: true,
            keys: keys,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get keys error:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve keys',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete key
router.delete('/keys/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const key = await ImportedKey.findByPk(id);
        if (!key) {
            return res.status(404).json({
                success: false,
                message: 'Key not found'
            });
        }

        // Check if key is already used
        if (key.status === 'used') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete used key'
            });
        }

        await ImportedKey.destroy({ where: { id } });

        res.json({
            success: true,
            message: 'Key deleted successfully'
        });
    } catch (error) {
        console.error('Delete key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete key',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get key statistics
router.get('/keys/stats', async (req, res) => {
    try {
        const stats = await ImportedKey.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'available' THEN 1 ELSE 0 END")), 'available'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'used' THEN 1 ELSE 0 END")), 'used']
            ],
            raw: true
        });

        const result = stats[0] || {
            total: 0,
            available: 0,
            used: 0
        };

        res.json({
            success: true,
            stats: {
                total: result.total || 0,
                available: result.available || 0,
                used: result.used || 0
            }
        });
    } catch (error) {
        console.error('Key stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve key statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Unused Keys Management Routes

// Get unused keys statistics
router.get('/unused-keys', async (req, res) => {
    try {
        console.log('🔑 Getting unused keys statistics...');
        const unusedKeys = await UnusedKeys.getUnusedKeys();
        
        res.json({
            success: true,
            data: {
                dayKeys: {
                    total: unusedKeys.totalDayKeys,
                    available: unusedKeys.availableDayKeys,
                    used: unusedKeys.totalDayKeys - unusedKeys.availableDayKeys
                },
                weekKeys: {
                    total: unusedKeys.totalWeekKeys,
                    available: unusedKeys.availableWeekKeys,
                    used: unusedKeys.totalWeekKeys - unusedKeys.availableWeekKeys
                },
                monthKeys: {
                    total: unusedKeys.totalMonthKeys,
                    available: unusedKeys.availableMonthKeys,
                    used: unusedKeys.totalMonthKeys - unusedKeys.availableMonthKeys
                },
                lifetimeKeys: {
                    total: unusedKeys.totalLifetimeKeys,
                    available: unusedKeys.availableLifetimeKeys,
                    used: unusedKeys.totalLifetimeKeys - unusedKeys.availableLifetimeKeys
                },
                lastUpdated: unusedKeys.lastUpdated
            }
        });
    } catch (error) {
        console.error('❌ Get unused keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve unused keys statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add keys to unused keys
router.post('/unused-keys/add', async (req, res) => {
    try {
        const { type, keys } = req.body;
        
        if (!type || !keys || !Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Type and keys array are required'
            });
        }

        if (!['day', 'week', 'month', 'lifetime'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid key type. Must be: day, week, month, or lifetime'
            });
        }

        // Validate keys
        const validKeys = keys.filter(key => key && key.trim().length > 0);
        if (validKeys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid keys provided'
            });
        }

        console.log(`🔑 Adding ${validKeys.length} ${type} keys to unused keys...`);
        console.log('🔑 Request body:', { type, keys: validKeys });

        const unusedKeys = await UnusedKeys.getUnusedKeys();
        console.log('🔑 Got unused keys document:', !!unusedKeys);
        
        await unusedKeys.addKeys(type, validKeys);
        console.log('🔑 Keys added successfully');

        res.json({
            success: true,
            message: `Successfully added ${validKeys.length} ${type} keys`,
            addedCount: validKeys.length,
            type: type
        });
    } catch (error) {
        console.error('❌ Add unused keys error:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to add keys to unused keys',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get available key
router.get('/unused-keys/available/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        if (!['day', 'week', 'month', 'lifetime'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid key type. Must be: day, week, month, or lifetime'
            });
        }

        console.log(`🔑 Getting available ${type} key...`);

        const unusedKeys = await UnusedKeys.getUnusedKeys();
        const availableKey = unusedKeys.getAvailableKey(type);

        if (!availableKey) {
            return res.status(404).json({
                success: false,
                message: `No available ${type} keys found`
            });
        }

        res.json({
            success: true,
            key: {
                id: availableKey.id,
                key: availableKey.key,
                type: type,
                status: availableKey.status,
                addedAt: availableKey.addedAt
            }
        });
    } catch (error) {
        console.error('❌ Get available key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get available key',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Mark key as used
router.post('/unused-keys/use/:type/:keyId', async (req, res) => {
    try {
        const { type, keyId } = req.params;
        const { userId } = req.body;
        
        if (!['day', 'week', 'month', 'lifetime'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid key type. Must be: day, week, month, or lifetime'
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        console.log(`🔑 Marking ${type} key ${keyId} as used by user ${userId}...`);

        const unusedKeys = await UnusedKeys.getUnusedKeys();
        await unusedKeys.markKeyAsUsed(type, keyId, userId);

        res.json({
            success: true,
            message: `${type} key marked as used successfully`
        });
    } catch (error) {
        console.error('❌ Mark key as used error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark key as used',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed unused keys list
router.get('/unused-keys/list/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { page = 1, limit = 50, status } = req.query;
        
        if (!['day', 'week', 'month', 'lifetime'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid key type. Must be: day, week, month, or lifetime'
            });
        }

        console.log(`🔑 Getting ${type} keys list...`);

        const unusedKeys = await UnusedKeys.getUnusedKeys();
        let keyArray;
        
        switch(type) {
            case 'day':
                keyArray = unusedKeys.dayKeys || [];
                break;
            case 'week':
                keyArray = unusedKeys.weekKeys || [];
                break;
            case 'month':
                keyArray = unusedKeys.monthKeys || [];
                break;
            case 'lifetime':
                keyArray = unusedKeys.lifetimeKeys || [];
                break;
        }

        // Filter by status if provided
        let filteredKeys = keyArray;
        if (status) {
            filteredKeys = keyArray.filter(key => key.status === status);
        }

        // Pagination
        const total = filteredKeys.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedKeys = filteredKeys.slice(startIndex, endIndex);

        res.json({
            success: true,
            keys: paginatedKeys,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get unused keys list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve unused keys list',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;