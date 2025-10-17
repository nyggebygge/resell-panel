const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Simple analytics routes with mock data
router.get('/overview', authenticateToken, requireAdmin, (req, res) => {
    console.log('📊 Simple analytics overview route hit');
    console.log('👤 User:', req.user ? req.user.username : 'No user');
    console.log('🔑 Role:', req.user ? req.user.role : 'No role');
    
    const mockData = {
        totalRevenue: 125000,
        totalTransactions: 450,
        newUsers: 25,
        keysGenerated: 1200,
        revenueChange: 12.5,
        transactionsChange: 8.3,
        newUsersChange: 15.2,
        keysGeneratedChange: 22.1,
        transactionSuccessRate: 96.8
    };
    
    res.json({
        success: true,
        data: mockData
    });
});

router.get('/revenue', authenticateToken, requireAdmin, (req, res) => {
    console.log('💰 Simple revenue route hit');
    
    const mockData = {
        dailyRevenue: [
            { date: '2025-10-10', amount: 1200 },
            { date: '2025-10-11', amount: 1500 },
            { date: '2025-10-12', amount: 1800 },
            { date: '2025-10-13', amount: 2100 },
            { date: '2025-10-14', amount: 1900 },
            { date: '2025-10-15', amount: 2200 },
            { date: '2025-10-16', amount: 2500 }
        ],
        monthlyRevenue: [
            { month: 'Aug 2025', amount: 25000 },
            { month: 'Sep 2025', amount: 32000 },
            { month: 'Oct 2025', amount: 28000 }
        ],
        revenueSources: [
            { source: 'Key Sales', amount: 75000 },
            { source: 'Subscriptions', amount: 30000 },
            { source: 'Credits', amount: 20000 }
        ],
        revenueDistribution: [
            { type: 'Key Sales', amount: 75000 },
            { type: 'Subscriptions', amount: 30000 },
            { type: 'Credits', amount: 20000 }
        ]
    };
    
    res.json({
        success: true,
        data: mockData
    });
});

router.get('/transactions', authenticateToken, requireAdmin, (req, res) => {
    console.log('💳 Simple transactions route hit');
    
    const mockData = {
        dailyTransactions: [
            { date: '2025-10-10', count: 45 },
            { date: '2025-10-11', count: 52 },
            { date: '2025-10-12', count: 48 },
            { date: '2025-10-13', count: 61 },
            { date: '2025-10-14', count: 55 },
            { date: '2025-10-15', count: 67 },
            { date: '2025-10-16', count: 72 }
        ],
        transactionTypes: [
            { type: 'purchase', count: 250 },
            { type: 'deposit', count: 120 },
            { type: 'withdrawal', count: 30 },
            { type: 'refund', count: 15 }
        ],
        dailyAvgValue: [
            { date: '2025-10-10', avgValue: 26.67 },
            { date: '2025-10-11', avgValue: 28.85 },
            { date: '2025-10-12', avgValue: 37.50 },
            { date: '2025-10-13', avgValue: 34.43 },
            { date: '2025-10-14', avgValue: 34.55 },
            { date: '2025-10-15', avgValue: 32.84 },
            { date: '2025-10-16', avgValue: 34.72 }
        ]
    };
    
    res.json({
        success: true,
        data: mockData
    });
});

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    console.log('👥 Simple users route hit');
    
    const mockData = {
        userGrowth: [
            { date: '2025-10-10', count: 5 },
            { date: '2025-10-11', count: 3 },
            { date: '2025-10-12', count: 7 },
            { date: '2025-10-13', count: 4 },
            { date: '2025-10-14', count: 6 },
            { date: '2025-10-15', count: 8 },
            { date: '2025-10-16', count: 2 }
        ],
        userActivity: [
            { date: '2025-10-10', activeUsers: 45, totalUsers: 120 },
            { date: '2025-10-11', activeUsers: 52, totalUsers: 123 },
            { date: '2025-10-12', activeUsers: 48, totalUsers: 130 },
            { date: '2025-10-13', activeUsers: 61, totalUsers: 134 },
            { date: '2025-10-14', activeUsers: 55, totalUsers: 140 },
            { date: '2025-10-15', activeUsers: 67, totalUsers: 148 },
            { date: '2025-10-16', activeUsers: 72, totalUsers: 150 }
        ],
        topRevenueUsers: [
            { username: 'user1', totalRevenue: 5000 },
            { username: 'user2', totalRevenue: 4200 },
            { username: 'user3', totalRevenue: 3800 },
            { username: 'user4', totalRevenue: 3200 },
            { username: 'user5', totalRevenue: 2800 }
        ]
    };
    
    res.json({
        success: true,
        data: mockData
    });
});

router.get('/keys', authenticateToken, requireAdmin, (req, res) => {
    console.log('🔑 Simple keys route hit');
    
    const mockData = {
        keyGenerationTrend: [
            { date: '2025-10-10', count: 150 },
            { date: '2025-10-11', count: 180 },
            { date: '2025-10-12', count: 165 },
            { date: '2025-10-13', count: 200 },
            { date: '2025-10-14', count: 175 },
            { date: '2025-10-15', count: 220 },
            { date: '2025-10-16', count: 190 }
        ],
        keyTypesDistribution: [
            { type: 'Standard', count: 800 },
            { type: 'Premium', count: 300 },
            { type: 'Enterprise', count: 100 }
        ],
        keyUsagePatterns: [
            { date: '2025-10-10', usageCount: 120 },
            { date: '2025-10-11', usageCount: 135 },
            { date: '2025-10-12', usageCount: 110 },
            { date: '2025-10-13', usageCount: 145 },
            { date: '2025-10-14', usageCount: 130 },
            { date: '2025-10-15', usageCount: 160 },
            { date: '2025-10-16', usageCount: 140 }
        ],
        keyMetrics: [
            { name: 'Total Keys', value: '1,200' },
            { name: 'Active Keys', value: '980' },
            { name: 'Used Keys', value: '220' },
            { name: 'Success Rate', value: '96.8%' }
        ]
    };
    
    res.json({
        success: true,
        data: mockData
    });
});

module.exports = router;
