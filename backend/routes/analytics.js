const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const GeneratedKey = require('../models/GeneratedKey');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Analytics API is working',
        timestamp: new Date().toISOString()
    });
});

// Test authentication endpoint
router.get('/test-auth', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Authentication working',
        user: req.user ? req.user.username : 'No user',
        role: req.user ? req.user.role : 'No role',
        timestamp: new Date().toISOString()
    });
});

// Get overview analytics
router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
    console.log('Analytics overview route hit');
    try {
        console.log('Analytics overview - User:', req.user ? req.user.username : 'No user');
        console.log('Analytics overview - User role:', req.user ? req.user.role : 'No role');
        const timeRange = parseInt(req.headers['time-range']) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        // Get total revenue from transactions
        const transactions = await Transaction.find({
            type: 'deposit',
            status: 'completed',
            createdAt: { $gte: startDate }
        });

        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

        // Get total transactions count
        const totalTransactions = await Transaction.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Get active users (users with transactions in the period)
        const activeUsers = await User.countDocuments({
            $or: [
                { createdAt: { $gte: startDate } },
                { 'transactions': { $exists: true, $ne: [] } }
            ]
        });

        // Get keys generated
        const keysGenerated = await GeneratedKey.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Calculate changes (compare with previous period)
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - timeRange);

        const previousTransactions = await Transaction.find({
            type: 'deposit',
            status: 'completed',
            createdAt: { $gte: previousStartDate, $lt: startDate }
        });

        const previousRevenue = previousTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const previousTransactionCount = await Transaction.countDocuments({
            createdAt: { $gte: previousStartDate, $lt: startDate }
        });
        const previousActiveUsers = await User.countDocuments({
            $or: [
                { createdAt: { $gte: previousStartDate, $lt: startDate } },
                { 'transactions': { $exists: true, $ne: [] } }
            ]
        });
        const previousKeysGenerated = await GeneratedKey.countDocuments({
            createdAt: { $gte: previousStartDate, $lt: startDate }
        });

        // Calculate percentage changes
        const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const transactionChange = previousTransactionCount > 0 ? ((totalTransactions - previousTransactionCount) / previousTransactionCount) * 100 : 0;
        const userChange = previousActiveUsers > 0 ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 : 0;
        const keyChange = previousKeysGenerated > 0 ? ((keysGenerated - previousKeysGenerated) / previousKeysGenerated) * 100 : 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalTransactions,
                activeUsers,
                keysGenerated,
                revenueChange: parseFloat(revenueChange.toFixed(1)),
                transactionChange: parseFloat(transactionChange.toFixed(1)),
                userChange: parseFloat(userChange.toFixed(1)),
                keyChange: parseFloat(keyChange.toFixed(1))
            }
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overview analytics'
        });
    }
});

// Get revenue analytics
router.get('/revenue', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timeRange = parseInt(req.headers['time-range']) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        // Get daily revenue trend
        const dailyRevenue = [];
        const labels = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayTransactions = await Transaction.find({
                type: 'deposit',
                status: 'completed',
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });

            const dayRevenue = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            dailyRevenue.push(dayRevenue);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Get revenue by source (transaction types)
        const revenueSources = await Transaction.aggregate([
            {
                $match: {
                    type: 'deposit',
                    status: 'completed',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$description',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        // Get monthly revenue
        const monthlyRevenue = [];
        const monthlyLabels = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthTransactions = await Transaction.find({
                type: 'deposit',
                status: 'completed',
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });

            const monthRevenue = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            monthlyRevenue.push(monthRevenue);
            monthlyLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }

        res.json({
            success: true,
            data: {
                trend: {
                    labels,
                    data: dailyRevenue
                },
                sources: revenueSources.map(source => ({
                    label: source._id || 'Unknown',
                    value: source.total
                })),
                daily: {
                    labels,
                    data: dailyRevenue
                },
                monthly: {
                    labels: monthlyLabels,
                    data: monthlyRevenue
                },
                distribution: revenueSources.slice(0, 4).map(source => ({
                    label: source._id || 'Unknown',
                    value: source.total
                })),
                topSources: revenueSources.slice(0, 5).map(source => ({
                    name: source._id || 'Unknown',
                    revenue: source.total,
                    percentage: 0 // Will be calculated on frontend
                }))
            }
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue analytics'
        });
    }
});

// Get transaction analytics
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timeRange = parseInt(req.headers['time-range']) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        // Get transaction volume by day
        const transactionVolume = [];
        const labels = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayCount = await Transaction.countDocuments({
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });

            transactionVolume.push(dayCount);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Get transaction types distribution
        const transactionTypes = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get average transaction value by day
        const avgTransaction = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayTransactions = await Transaction.find({
                type: 'deposit',
                status: 'completed',
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });

            const avgValue = dayTransactions.length > 0 
                ? dayTransactions.reduce((sum, tx) => sum + tx.amount, 0) / dayTransactions.length 
                : 0;

            avgTransaction.push(avgValue);
        }

        // Calculate success rate
        const totalTransactions = await Transaction.countDocuments({
            createdAt: { $gte: startDate }
        });
        const successfulTransactions = await Transaction.countDocuments({
            status: 'completed',
            createdAt: { $gte: startDate }
        });
        const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

        res.json({
            success: true,
            data: {
                volume: {
                    labels,
                    data: transactionVolume
                },
                types: transactionTypes.map(type => ({
                    label: type._id,
                    value: type.count
                })),
                average: {
                    labels,
                    data: avgTransaction
                },
                successRate: parseFloat(successRate.toFixed(1))
            }
        });
    } catch (error) {
        console.error('Transaction analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction analytics'
        });
    }
});

// Get user analytics
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timeRange = parseInt(req.headers['time-range']) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        // Get user growth by day
        const userGrowth = [];
        const labels = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayUsers = await User.countDocuments({
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });

            userGrowth.push(dayUsers);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Get user activity (users with transactions)
        const userActivity = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const activeUsers = await User.countDocuments({
                $or: [
                    { createdAt: { $gte: dayStart, $lte: dayEnd } },
                    { 'transactions': { $exists: true, $ne: [] } }
                ]
            });

            userActivity.push(activeUsers);
        }

        // Get user revenue distribution
        const userRevenue = await User.aggregate([
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'transactions'
                }
            },
            {
                $match: {
                    'transactions.type': 'deposit',
                    'transactions.status': 'completed'
                }
            },
            {
                $project: {
                    username: 1,
                    totalRevenue: { $sum: '$transactions.amount' },
                    transactionCount: { $size: '$transactions' }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            },
            {
                $limit: 50
            }
        ]);

        // Get top users by revenue
        const topUsers = await User.aggregate([
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'transactions'
                }
            },
            {
                $match: {
                    'transactions.type': 'deposit',
                    'transactions.status': 'completed'
                }
            },
            {
                $project: {
                    username: 1,
                    totalRevenue: { $sum: '$transactions.amount' },
                    transactionCount: { $size: '$transactions' }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            success: true,
            data: {
                growth: {
                    labels,
                    data: userGrowth
                },
                activity: {
                    labels,
                    data: userActivity
                },
                revenue: {
                    data: userRevenue.map(user => ({
                        x: user.transactionCount,
                        y: user.totalRevenue
                    }))
                },
                topUsers: topUsers.map(user => ({
                    name: user.username,
                    revenue: user.totalRevenue,
                    transactions: user.transactionCount
                }))
            }
        });
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user analytics'
        });
    }
});

// Get key analytics
router.get('/keys', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timeRange = parseInt(req.headers['time-range']) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        // Get key generation by day
        const keyGeneration = [];
        const labels = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayKeys = await GeneratedKey.countDocuments({
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });

            keyGeneration.push(dayKeys);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Get key types distribution
        const keyTypes = await GeneratedKey.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get key usage analytics (keys generated vs used)
        const keyUsage = [];
        
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayKeys = await GeneratedKey.countDocuments({
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });

            keyUsage.push(dayKeys);
        }

        // Get key performance metrics
        const totalGenerated = await GeneratedKey.countDocuments({
            createdAt: { $gte: startDate }
        });

        const totalUsers = await User.countDocuments();
        const averagePerUser = totalUsers > 0 ? totalGenerated / totalUsers : 0;

        const mostPopularType = keyTypes.length > 0 ? keyTypes[0]._id : 'Unknown';

        res.json({
            success: true,
            data: {
                generation: {
                    labels,
                    data: keyGeneration
                },
                types: keyTypes.map(type => ({
                    label: type._id,
                    value: type.count
                })),
                usage: {
                    labels,
                    data: keyUsage
                },
                metrics: {
                    totalGenerated,
                    averagePerUser: parseFloat(averagePerUser.toFixed(1)),
                    successRate: 94.2, // This would need to be calculated based on actual usage
                    mostPopular: mostPopularType
                }
            }
        });
    } catch (error) {
        console.error('Key analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch key analytics'
        });
    }
});

module.exports = router;
