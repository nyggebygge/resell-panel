// Revenue Analytics Dashboard
class RevenueAnalytics {
    constructor() {
        this.charts = {};
        this.data = {};
        this.timeRange = 30; // Default to 30 days
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Wait for API client to be available
        if (window.api) {
            // Ensure API client has the current token
            const token = localStorage.getItem('authToken');
            console.log('Token from localStorage:', token ? 'Present' : 'Missing');
            if (token) {
                window.api.setToken(token);
                console.log('Token set in API client');
                console.log('API client token after set:', window.api.token ? 'Present' : 'Missing');
            } else {
                console.error('No authentication token found');
                this.showError('No authentication token found. Please login again.');
                return;
            }
            this.loadData();
        } else {
            // Wait for API client to initialize
            setTimeout(() => {
                if (window.api) {
                    // Ensure API client has the current token
                    const token = localStorage.getItem('authToken');
                    console.log('Token from localStorage (delayed):', token ? 'Present' : 'Missing');
                    if (token) {
                        window.api.setToken(token);
                        console.log('Token set in API client (delayed)');
                        this.loadData();
                    } else {
                        console.error('No authentication token found (delayed)');
                        this.showError('No authentication token found. Please login again.');
                    }
                } else {
                    console.error('API client not available');
                    this.showError('API client not available');
                }
            }, 1000);
        }
    }

    setupEventListeners() {
        // Time range selector
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.timeRange = parseInt(e.target.value);
                this.loadData();
            });
        }

        // Chart type toggles
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                const container = e.target.closest('.chart-container');
                this.toggleChartType(container, chartType);
            });
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Export button
        const exportBtn = document.getElementById('exportRevenue');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Load all analytics data
            await Promise.all([
                this.loadOverviewData(),
                this.loadRevenueData(),
                this.loadTransactionData(),
                this.loadUserData(),
                this.loadKeyData()
            ]);

            this.renderAllCharts();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading revenue data:', error);
            // Use mock data as fallback
            this.loadMockData();
            this.renderAllCharts();
            this.hideLoading();
        }
    }

    // Force load mock data for immediate display
    loadMockDataImmediately() {
        console.log('Loading mock data immediately');
        this.data.overview = this.getMockOverviewData();
        this.data.revenue = this.getMockRevenueData();
        this.data.transactions = this.getMockTransactionData();
        this.data.users = this.getMockUserData();
        this.data.keys = this.getMockKeyData();
        this.updateMetrics();
        this.renderAllCharts();
    }

    loadMockData() {
        console.log('Loading mock data as fallback');
        this.data.overview = this.getMockOverviewData();
        this.data.revenue = this.getMockRevenueData();
        this.data.transactions = this.getMockTransactionData();
        this.data.users = this.getMockUserData();
        this.data.keys = this.getMockKeyData();
    }

    async loadOverviewData() {
        try {
            // First test if the analytics API is accessible
            try {
                const testResponse = await window.api.request('/admin/analytics/test', {
                    method: 'GET'
                });
                console.log('Analytics API test:', testResponse);
            } catch (testError) {
                console.log('Analytics API test failed:', testError.message);
            }

            // Test authentication
            try {
                const authTestResponse = await window.api.request('/admin/analytics/test-auth', {
                    method: 'GET'
                });
                console.log('Analytics auth test:', authTestResponse);
            } catch (authTestError) {
                console.log('Analytics auth test failed:', authTestError.message);
            }

            const response = await window.api.request('/admin/analytics/overview', {
                method: 'GET',
                headers: {
                    'time-range': this.timeRange.toString()
                }
            });

            this.data.overview = response.data;
            this.updateMetrics();
        } catch (error) {
            console.error('Error loading overview data:', error);
            // Use mock data for development
            this.data.overview = this.getMockOverviewData();
            this.updateMetrics();
        }
    }

    async loadRevenueData() {
        try {
            const response = await window.api.request('/admin/analytics/revenue', {
                method: 'GET',
                headers: {
                    'time-range': this.timeRange.toString()
                }
            });

            this.data.revenue = response.data;
        } catch (error) {
            console.error('Error loading revenue data:', error);
            this.data.revenue = this.getMockRevenueData();
        }
    }

    async loadTransactionData() {
        try {
            const response = await window.api.request('/admin/analytics/transactions', {
                method: 'GET',
                headers: {
                    'time-range': this.timeRange.toString()
                }
            });

            this.data.transactions = response.data;
        } catch (error) {
            console.error('Error loading transaction data:', error);
            this.data.transactions = this.getMockTransactionData();
        }
    }

    async loadUserData() {
        try {
            const response = await window.api.request('/admin/analytics/users', {
                method: 'GET',
                headers: {
                    'time-range': this.timeRange.toString()
                }
            });

            this.data.users = response.data;
        } catch (error) {
            console.error('Error loading user data:', error);
            this.data.users = this.getMockUserData();
        }
    }

    async loadKeyData() {
        try {
            const response = await window.api.request('/admin/analytics/keys', {
                method: 'GET',
                headers: {
                    'time-range': this.timeRange.toString()
                }
            });

            this.data.keys = response.data;
        } catch (error) {
            console.error('Error loading key data:', error);
            this.data.keys = this.getMockKeyData();
        }
    }

    updateMetrics() {
        const overview = this.data.overview;
        if (!overview) return;

        // Update metric cards
        document.getElementById('totalRevenue').textContent = this.formatCurrency(overview.totalRevenue);
        document.getElementById('totalTransactions').textContent = overview.totalTransactions.toLocaleString();
        document.getElementById('activeUsers').textContent = overview.activeUsers.toLocaleString();
        document.getElementById('keysGenerated').textContent = overview.keysGenerated.toLocaleString();

        // Update change indicators
        this.updateChangeIndicator('revenueChange', overview.revenueChange);
        this.updateChangeIndicator('transactionChange', overview.transactionChange);
        this.updateChangeIndicator('userChange', overview.userChange);
        this.updateChangeIndicator('keyChange', overview.keyChange);
    }

    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        element.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
    }

    renderAllCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            this.showError('Chart.js not loaded. Please refresh the page.');
            return;
        }

        // Destroy existing charts first
        this.destroyAllCharts();

        this.renderRevenueChart();
        this.renderRevenueSourceChart();
        this.renderDailyRevenueChart();
        this.renderMonthlyRevenueChart();
        this.renderRevenueDistributionChart();
        this.renderTransactionVolumeChart();
        this.renderTransactionTypesChart();
        this.renderAvgTransactionChart();
        this.renderUserGrowthChart();
        this.renderUserActivityChart();
        this.renderUserRevenueChart();
        this.renderKeyGenerationChart();
        this.renderKeyTypesChart();
        this.renderKeyUsageChart();
        this.renderTopRevenueSources();
        this.renderTopUsers();
        this.renderKeyMetrics();
        this.updateSuccessRate();
    }

    destroyAllCharts() {
        // Destroy all existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const revenueData = this.data.revenue?.trend || this.generateMockTrendData();
        
        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.data,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderRevenueSourceChart() {
        const ctx = document.getElementById('revenueSourceChart');
        if (!ctx) return;

        const sourceData = this.data.revenue?.sources || [
            { label: 'Key Sales', value: 45 },
            { label: 'Credits', value: 30 },
            { label: 'Subscriptions', value: 25 }
        ];

        this.charts.revenueSource = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sourceData.map(item => item.label),
                datasets: [{
                    data: sourceData.map(item => item.value),
                    backgroundColor: [
                        '#00d4ff',
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    renderDailyRevenueChart() {
        const ctx = document.getElementById('dailyRevenueChart');
        if (!ctx) return;

        const dailyData = this.data.revenue?.daily || this.generateMockDailyData();
        
        this.charts.dailyRevenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dailyData.labels,
                datasets: [{
                    label: 'Daily Revenue',
                    data: dailyData.data,
                    backgroundColor: 'rgba(0, 212, 255, 0.8)',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderMonthlyRevenueChart() {
        const ctx = document.getElementById('monthlyRevenueChart');
        if (!ctx) return;

        const monthlyData = this.data.revenue?.monthly || this.generateMockMonthlyData();
        
        this.charts.monthlyRevenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: monthlyData.data,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderRevenueDistributionChart() {
        const ctx = document.getElementById('revenueDistributionChart');
        if (!ctx) return;

        const distributionData = this.data.revenue?.distribution || this.generateMockDistributionData();
        
        this.charts.revenueDistribution = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: distributionData.labels,
                datasets: [{
                    data: distributionData.data,
                    backgroundColor: [
                        '#00d4ff',
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    renderTransactionVolumeChart() {
        const ctx = document.getElementById('transactionVolumeChart');
        if (!ctx) return;

        const volumeData = this.data.transactions?.volume || this.generateMockVolumeData();
        
        this.charts.transactionVolume = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: volumeData.labels,
                datasets: [{
                    label: 'Transaction Volume',
                    data: volumeData.data,
                    backgroundColor: 'rgba(0, 212, 255, 0.8)',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderTransactionTypesChart() {
        const ctx = document.getElementById('transactionTypesChart');
        if (!ctx) return;

        const typesData = this.data.transactions?.types || [
            { label: 'Deposits', value: 60 },
            { label: 'Withdrawals', value: 25 },
            { label: 'Transfers', value: 15 }
        ];

        this.charts.transactionTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: typesData.map(item => item.label),
                datasets: [{
                    data: typesData.map(item => item.value),
                    backgroundColor: [
                        '#00d4ff',
                        '#22c55e',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    renderAvgTransactionChart() {
        const ctx = document.getElementById('avgTransactionChart');
        if (!ctx) return;

        const avgData = this.data.transactions?.average || this.generateMockAverageData();
        
        this.charts.avgTransaction = new Chart(ctx, {
            type: 'line',
            data: {
                labels: avgData.labels,
                datasets: [{
                    label: 'Average Transaction Value',
                    data: avgData.data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;

        const growthData = this.data.users?.growth || this.generateMockGrowthData();
        
        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: growthData.labels,
                datasets: [{
                    label: 'New Users',
                    data: growthData.data,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderUserActivityChart() {
        const ctx = document.getElementById('userActivityChart');
        if (!ctx) return;

        const activityData = this.data.users?.activity || this.generateMockActivityData();
        
        this.charts.userActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: activityData.labels,
                datasets: [{
                    label: 'Active Users',
                    data: activityData.data,
                    backgroundColor: 'rgba(0, 212, 255, 0.8)',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderUserRevenueChart() {
        const ctx = document.getElementById('userRevenueChart');
        if (!ctx) return;

        const userRevenueData = this.data.users?.revenue || this.generateMockUserRevenueData();
        
        this.charts.userRevenue = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'User Revenue',
                    data: userRevenueData.data,
                    backgroundColor: 'rgba(0, 212, 255, 0.6)',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderKeyGenerationChart() {
        const ctx = document.getElementById('keyGenerationChart');
        if (!ctx) return;

        const keyData = this.data.keys?.generation || this.generateMockKeyData();
        
        this.charts.keyGeneration = new Chart(ctx, {
            type: 'line',
            data: {
                labels: keyData.labels,
                datasets: [{
                    label: 'Keys Generated',
                    data: keyData.data,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderKeyTypesChart() {
        const ctx = document.getElementById('keyTypesChart');
        if (!ctx) return;

        const typesData = this.data.keys?.types || [
            { label: 'Week Keys', value: 40 },
            { label: 'Month Keys', value: 35 },
            { label: 'Year Keys', value: 25 }
        ];

        this.charts.keyTypes = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: typesData.map(item => item.label),
                datasets: [{
                    data: typesData.map(item => item.value),
                    backgroundColor: [
                        '#00d4ff',
                        '#22c55e',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    renderKeyUsageChart() {
        const ctx = document.getElementById('keyUsageChart');
        if (!ctx) return;

        const usageData = this.data.keys?.usage || this.generateMockUsageData();
        
        this.charts.keyUsage = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: usageData.labels,
                datasets: [{
                    label: 'Key Usage',
                    data: usageData.data,
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderTopRevenueSources() {
        const container = document.getElementById('topRevenueSources');
        if (!container) return;

        const sources = this.data.revenue?.topSources || [
            { name: 'Key Sales', revenue: 12500, percentage: 45 },
            { name: 'Credit Purchases', revenue: 8500, percentage: 30 },
            { name: 'Subscriptions', revenue: 7000, percentage: 25 }
        ];

        container.innerHTML = sources.map((source, index) => `
            <div class="top-item">
                <div class="top-item-info">
                    <div class="top-item-icon">
                        <i class="fas fa-${index === 0 ? 'crown' : index === 1 ? 'medal' : 'award'}"></i>
                    </div>
                    <div class="top-item-details">
                        <h4>${source.name}</h4>
                        <p>${source.percentage}% of total</p>
                    </div>
                </div>
                <div class="top-item-value">${this.formatCurrency(source.revenue)}</div>
            </div>
        `).join('');
    }

    renderTopUsers() {
        const container = document.getElementById('topUsers');
        if (!container) return;

        const users = this.data.users?.topUsers || [
            { name: 'John Doe', revenue: 2500, transactions: 15 },
            { name: 'Jane Smith', revenue: 1800, transactions: 12 },
            { name: 'Mike Johnson', revenue: 1200, transactions: 8 }
        ];

        container.innerHTML = users.map((user, index) => `
            <div class="top-item">
                <div class="top-item-info">
                    <div class="top-item-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="top-item-details">
                        <h4>${user.name}</h4>
                        <p>${user.transactions} transactions</p>
                    </div>
                </div>
                <div class="top-item-value">${this.formatCurrency(user.revenue)}</div>
            </div>
        `).join('');
    }

    renderKeyMetrics() {
        const container = document.getElementById('keyMetrics');
        if (!container) return;

        const metrics = this.data.keys?.metrics || {
            totalGenerated: 1250,
            averagePerUser: 8.5,
            successRate: 94.2,
            mostPopular: 'Week Keys'
        };

        container.innerHTML = `
            <div class="metric-item">
                <div class="metric-label">Total Generated</div>
                <div class="metric-value">${metrics.totalGenerated.toLocaleString()}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Avg per User</div>
                <div class="metric-value">${metrics.averagePerUser}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">${metrics.successRate}%</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Most Popular</div>
                <div class="metric-value">${metrics.mostPopular}</div>
            </div>
        `;
    }

    updateSuccessRate() {
        const successRate = this.data.transactions?.successRate || 94.2;
        const element = document.getElementById('successRate');
        if (element) {
            element.textContent = `${successRate}%`;
        }
        
        // Update CSS custom property for the circle
        const circle = document.querySelector('.success-rate-circle');
        if (circle) {
            circle.style.setProperty('--success-percentage', `${successRate * 3.6}deg`);
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Activate nav item
        const navItem = document.querySelector(`[href="#${sectionId}"]`).closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    toggleChartType(container, chartType) {
        const buttons = container.querySelectorAll('.chart-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        container.querySelector(`[data-chart="${chartType}"]`).classList.add('active');

        // Update chart type logic would go here
        console.log(`Switching to ${chartType} chart`);
    }

    exportData() {
        const data = {
            overview: this.data.overview,
            revenue: this.data.revenue,
            transactions: this.data.transactions,
            users: this.data.users,
            keys: this.data.keys,
            exportDate: new Date().toISOString(),
            timeRange: this.timeRange
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showLoading() {
        document.querySelectorAll('.chart-container').forEach(container => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                canvas.style.display = 'none';
            }
            container.innerHTML += '<div class="chart-loading"><i class="fas fa-spinner fa-spin"></i></div>';
        });
    }

    hideLoading() {
        document.querySelectorAll('.chart-loading').forEach(loading => {
            loading.remove();
        });
        document.querySelectorAll('.chart-container canvas').forEach(canvas => {
            canvas.style.display = 'block';
        });
    }

    showError(message) {
        console.error('Revenue Analytics Error:', message);
        // Could show a toast notification here
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Mock data generators for development
    getMockOverviewData() {
        return {
            totalRevenue: 28500,
            totalTransactions: 1250,
            activeUsers: 450,
            keysGenerated: 2100,
            revenueChange: 12.5,
            transactionChange: 8.3,
            userChange: 15.2,
            keyChange: 22.1
        };
    }

    getMockRevenueData() {
        return {
            trend: this.generateMockTrendData(),
            sources: [
                { label: 'Key Sales', value: 45 },
                { label: 'Credits', value: 30 },
                { label: 'Subscriptions', value: 25 }
            ],
            daily: this.generateMockDailyData(),
            monthly: this.generateMockMonthlyData(),
            distribution: this.generateMockDistributionData(),
            topSources: [
                { name: 'Key Sales', revenue: 12500, percentage: 45 },
                { name: 'Credit Purchases', revenue: 8500, percentage: 30 },
                { name: 'Subscriptions', revenue: 7000, percentage: 25 }
            ]
        };
    }

    getMockTransactionData() {
        return {
            volume: this.generateMockVolumeData(),
            types: [
                { label: 'Deposits', value: 60 },
                { label: 'Withdrawals', value: 25 },
                { label: 'Transfers', value: 15 }
            ],
            average: this.generateMockAverageData(),
            successRate: 94.2
        };
    }

    getMockUserData() {
        return {
            growth: this.generateMockGrowthData(),
            activity: this.generateMockActivityData(),
            revenue: this.generateMockUserRevenueData(),
            topUsers: [
                { name: 'John Doe', revenue: 2500, transactions: 15 },
                { name: 'Jane Smith', revenue: 1800, transactions: 12 },
                { name: 'Mike Johnson', revenue: 1200, transactions: 8 }
            ]
        };
    }

    getMockKeyData() {
        return {
            generation: this.generateMockKeyData(),
            types: [
                { label: 'Week Keys', value: 40 },
                { label: 'Month Keys', value: 35 },
                { label: 'Year Keys', value: 25 }
            ],
            usage: this.generateMockUsageData(),
            metrics: {
                totalGenerated: 1250,
                averagePerUser: 8.5,
                successRate: 94.2,
                mostPopular: 'Week Keys'
            }
        };
    }

    generateMockTrendData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 2000) + 500);
        }
        
        return { labels, data };
    }

    generateMockDailyData() {
        const days = 7;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            data.push(Math.floor(Math.random() * 1500) + 300);
        }
        
        return { labels, data };
    }

    generateMockMonthlyData() {
        const months = 12;
        const labels = [];
        const data = [];
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            data.push(Math.floor(Math.random() * 10000) + 2000);
        }
        
        return { labels, data };
    }

    generateMockDistributionData() {
        return {
            labels: ['Key Sales', 'Credits', 'Subscriptions', 'Other'],
            data: [45, 30, 20, 5]
        };
    }

    generateMockVolumeData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 100) + 20);
        }
        
        return { labels, data };
    }

    generateMockAverageData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 200) + 50);
        }
        
        return { labels, data };
    }

    generateMockGrowthData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 20) + 5);
        }
        
        return { labels, data };
    }

    generateMockActivityData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 100) + 50);
        }
        
        return { labels, data };
    }

    generateMockUserRevenueData() {
        const data = [];
        for (let i = 0; i < 50; i++) {
            data.push({
                x: Math.floor(Math.random() * 30),
                y: Math.floor(Math.random() * 2000) + 100
            });
        }
        return { data };
    }

    generateMockKeyData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 50) + 10);
        }
        
        return { labels, data };
    }

    generateMockUsageData() {
        const days = this.timeRange;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 80) + 20);
        }
        
        return { labels, data };
    }
}

// Initialize Revenue Analytics
window.revenueAnalytics = new RevenueAnalytics();
