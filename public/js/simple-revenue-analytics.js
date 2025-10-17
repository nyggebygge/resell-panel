// Simple Revenue Analytics Dashboard
class SimpleRevenueAnalytics {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        console.log('🚀 Initializing Awesome Revenue Analytics');
        this.addSparkleCSS(); // Add sparkle animations
        this.showMessage('🚀 Loading awesome revenue data...', 'loading');
        this.loadData();
    }

    async loadData() {
        try {
            // Load overview data
            const overviewResponse = await window.api.request('/admin/analytics/overview');
            this.updateMetrics(overviewResponse.data);
            this.addTrendIndicators(overviewResponse.data);
            this.addSparkleEffect('total-revenue-overview'); // Add sparkle to revenue!
            this.showMessage('💰 Revenue data loaded with sparkles!', 'success');

            // Load chart data
            const [revenueData, transactionData, userData, keyData] = await Promise.all([
                window.api.request('/admin/analytics/revenue'),
                window.api.request('/admin/analytics/transactions'),
                window.api.request('/admin/analytics/users'),
                window.api.request('/admin/analytics/keys')
            ]);

            // Render charts
            this.renderRevenueChart(revenueData.data);
            this.renderTransactionChart(transactionData.data);
            this.renderUserChart(userData.data);
            this.renderKeyChart(keyData.data);

            this.showMessage('🎉 Awesome revenue analytics ready! Charts are glowing!', 'success');

        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showMessage(`Error loading analytics: ${error.message}`, 'error');
        }
    }

    updateMetrics(data) {
        // Update overview metrics with animation
        this.animateCounter('total-revenue-overview', data.totalRevenue, '$');
        this.animateCounter('total-transactions-overview', data.totalTransactions, '');
        this.animateCounter('new-users-overview', data.newUsers, '');
        this.animateCounter('keys-generated-overview', data.keysGenerated, '');

        const totalTransactionsEl = document.getElementById('total-transactions-overview');
        if (totalTransactionsEl) {
            totalTransactionsEl.textContent = data.totalTransactions.toLocaleString();
        }

        const newUsersEl = document.getElementById('new-users-overview');
        if (newUsersEl) {
            newUsersEl.textContent = data.newUsers.toLocaleString();
        }

        const keysGeneratedEl = document.getElementById('keys-generated-overview');
        if (keysGeneratedEl) {
            keysGeneratedEl.textContent = data.keysGenerated.toLocaleString();
        }

        // Update change indicators
        this.updateMetricChange('revenue-change', data.revenueChange);
        this.updateMetricChange('transactions-change', data.transactionsChange);
        this.updateMetricChange('new-users-change', data.newUsersChange);
        this.updateMetricChange('keys-generated-change', data.keysGeneratedChange);

        // Update success rate
        const successRateText = document.getElementById('success-rate-text');
        if (successRateText) {
            successRateText.textContent = `${data.transactionSuccessRate.toFixed(1)}%`;
        }
    }

    updateMetricChange(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        element.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
    }

    renderRevenueChart(data) {
        const ctx = document.getElementById('revenueTransactionChart');
        if (!ctx) return;

        const labels = data.dailyRevenue.map(d => d.date);
        const revenueData = data.dailyRevenue.map(d => d.amount);
        const transactionData = data.dailyTransactions ? data.dailyTransactions.map(d => d.count) : [];

        if (this.charts.revenueTransactionChart) {
            this.charts.revenueTransactionChart.destroy();
        }

        this.charts.revenueTransactionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '💰 Revenue',
                        data: revenueData,
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.2)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: '💳 Transactions',
                        data: transactionData,
                        borderColor: '#8e44ad',
                        backgroundColor: 'rgba(142, 68, 173, 0.2)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    }
                },
                plugins: {
                    legend: { 
                        labels: { 
                            color: '#ffffff',
                            font: { size: 14, weight: 'bold' }
                        } 
                    }
                }
            }
        });
    }

    renderTransactionChart(data) {
        const ctx = document.getElementById('transactionVolumeChart');
        if (!ctx) return;

        const labels = data.dailyTransactions.map(d => d.date);
        const values = data.dailyTransactions.map(d => d.count);

        if (this.charts.transactionVolumeChart) {
            this.charts.transactionVolumeChart.destroy();
        }

        this.charts.transactionVolumeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Transaction Volume',
                    data: values,
                    borderColor: '#f1c40f',
                    backgroundColor: 'rgba(241, 196, 15, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#ffffff' } }
                }
            }
        });
    }

    renderUserChart(data) {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;

        const labels = data.userGrowth.map(d => d.date);
        const values = data.userGrowth.map(d => d.count);

        if (this.charts.userGrowthChart) {
            this.charts.userGrowthChart.destroy();
        }

        this.charts.userGrowthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Users',
                    data: values,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#ffffff' } }
                }
            }
        });
    }

    renderKeyChart(data) {
        const ctx = document.getElementById('keyGenerationChart');
        if (!ctx) return;

        const labels = data.keyGenerationTrend.map(d => d.date);
        const values = data.keyGenerationTrend.map(d => d.count);

        if (this.charts.keyGenerationChart) {
            this.charts.keyGenerationChart.destroy();
        }

        this.charts.keyGenerationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Keys Generated',
                    data: values,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#ffffff' } }
                }
            }
        });
    }

    // Animate counter with smooth counting effect
    animateCounter(elementId, targetValue, prefix = '', suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = `${prefix}${currentValue.toLocaleString()}${suffix}`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = `${prefix}${targetValue.toLocaleString()}${suffix}`;
            }
        };

        requestAnimationFrame(animate);
    }

    // Add sparkle effect to revenue numbers
    addSparkleEffect(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';

        // Create sparkle particles
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #00d4ff;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: sparkle 1.5s ease-out forwards;
                `;
                
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.top = Math.random() * 100 + '%';
                
                element.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 1500);
            }, i * 200);
        }
    }

    // Add CSS for sparkle animation
    addSparkleCSS() {
        if (document.getElementById('sparkle-styles')) return;

        const style = document.createElement('style');
        style.id = 'sparkle-styles';
        style.textContent = `
            @keyframes sparkle {
                0% {
                    opacity: 1;
                    transform: scale(0) rotate(0deg);
                }
                50% {
                    opacity: 1;
                    transform: scale(1) rotate(180deg);
                }
                100% {
                    opacity: 0;
                    transform: scale(0) rotate(360deg);
                }
            }
            
            .revenue-glow {
                animation: revenueGlow 2s ease-in-out infinite alternate;
            }
            
            @keyframes revenueGlow {
                from {
                    text-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff;
                }
                to {
                    text-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add revenue trend indicators
    addTrendIndicators(data) {
        // Add trend arrows to metrics
        this.addTrendArrow('revenue-change', data.revenueChange);
        this.addTrendArrow('transactions-change', data.transactionsChange);
        this.addTrendArrow('new-users-change', data.newUsersChange);
        this.addTrendArrow('keys-generated-change', data.keysGeneratedChange);
    }

    addTrendArrow(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const arrow = change >= 0 ? '↗️' : '↘️';
        const color = change >= 0 ? '#10b981' : '#ef4444';
        
        element.innerHTML = `${arrow} ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        element.style.color = color;
        element.style.fontWeight = 'bold';
    }

    showMessage(message, type) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create a beautiful notification with animation
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 350px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            transform: translateX(400px);
            transition: transform 0.3s ease-out;
            ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669);' : ''}
            ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626);' : ''}
            ${type === 'loading' ? 'background: linear-gradient(135deg, #3b82f6, #2563eb);' : ''}
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⏳'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 4 seconds with animation
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for admin auth to initialize
    setTimeout(() => {
        console.log('Checking admin access...');
        console.log('Admin auth available:', !!window.adminAuth);
        console.log('Is admin:', window.adminAuth ? window.adminAuth.checkIsAdmin() : 'No admin auth');
        
        // Check admin authentication
        if (!window.adminAuth || !window.adminAuth.checkIsAdmin()) {
            console.log('Not admin, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('Admin access confirmed, initializing simple revenue analytics');
        // Wait for Chart.js to be fully loaded
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js loaded, initializing simple revenue analytics');
                // Initialize simple revenue analytics
                window.simpleRevenueAnalytics = new SimpleRevenueAnalytics();
            } else {
                console.error('Chart.js not loaded after timeout');
            }
        }, 500);
    }, 1000);
});
