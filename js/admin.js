/**
 * Admin Dashboard - Main Controller
 * Handles admin dashboard initialization and core functionality
 */

class AdminDashboard {
    constructor() {
        this.stats = {
            totalUsers: 0,
            activeUsers: 0,
            totalKeys: 0,
            totalRevenue: 0
        };
        this.users = [];
        this.selectedUsers = new Set();
        this.sortField = 'username';
        this.sortOrder = 'asc';
        this.filters = {
            search: '',
            status: '',
            role: ''
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Dashboard...');
        
        try {
            // Load dashboard data
            await this.loadStats();
            await this.loadUsers();
            await this.loadRecentActivity();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Admin Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.showNotification('Error', 'Failed to load admin dashboard', 'error');
        }
    }

    async loadStats() {
        try {
            // Load admin statistics
            const response = await window.api.request('/admin/stats');
            if (response && response.success) {
                this.stats = response.data;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Set default values
            this.updateStatsDisplay();
        }
    }

    updateStatsDisplay() {
        const elements = {
            'total-users': this.stats.totalUsers || 0,
            'active-users': this.stats.activeUsers || 0,
            'total-keys': this.stats.totalKeys || 0,
            'total-revenue': `$${(this.stats.totalRevenue || 0).toFixed(2)}`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateCounter(element, value);
            }
        });
    }

    animateCounter(element, targetValue) {
        const isNumeric = typeof targetValue === 'number';
        const startValue = isNumeric ? 0 : 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            if (isNumeric) {
                const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutCubic);
                element.textContent = currentValue.toLocaleString();
            } else {
                element.textContent = targetValue;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    async loadUsers() {
        try {
            const response = await window.api.request('/admin/users');
            if (response && response.success) {
                this.users = response.data.users || [];
                this.renderUsersTable();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.showNotification('Error', 'Failed to load users', 'error');
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #8892b0;">
                        <i class="fas fa-users" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        // Apply filters
        let filteredUsers = this.users.filter(user => {
            const matchesSearch = !this.filters.search || 
                user.username.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                user.email.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesStatus = !this.filters.status || 
                (this.filters.status === 'active' && user.isActive) ||
                (this.filters.status === 'inactive' && !user.isActive);
            
            const matchesRole = !this.filters.role || user.role === this.filters.role;
            
            return matchesSearch && matchesStatus && matchesRole;
        });

        // Apply sorting
        filteredUsers.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        tbody.innerHTML = filteredUsers.map(user => this.createUserRow(user)).join('');
    }

    createUserRow(user) {
        const isSelected = this.selectedUsers.has(user._id);
        const statusClass = user.isActive ? 'active' : 'inactive';
        const statusText = user.isActive ? 'Active' : 'Inactive';
        const lastLogin = user.lastLogin ? this.formatDate(user.lastLogin) : 'Never';
        
        return `
            <tr class="${isSelected ? 'selected' : ''}">
                <td>
                    <input type="checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="adminDashboard.toggleUserSelection('${user._id}')">
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-details">
                            <h4>${user.username}</h4>
                            <p>${user.role || 'user'}</p>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.credits || 0}</td>
                <td>${user.keysGenerated || 0}</td>
                <td>${lastLogin}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="user-actions">
                        <button class="action-icon edit" onclick="adminUsers.editUser('${user._id}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon toggle" onclick="adminUsers.toggleUserStatus('${user._id}')" title="Toggle Status">
                            <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                        </button>
                        <button class="action-icon delete" onclick="adminUsers.deleteUser('${user._id}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    toggleUserSelection(userId) {
        if (this.selectedUsers.has(userId)) {
            this.selectedUsers.delete(userId);
        } else {
            this.selectedUsers.add(userId);
        }
        
        this.updateBulkActions();
        this.renderUsersTable();
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-users');
        const isChecked = selectAllCheckbox.checked;
        
        if (isChecked) {
            // Select all visible users
            this.users.forEach(user => {
                this.selectedUsers.add(user._id);
            });
        } else {
            // Deselect all
            this.selectedUsers.clear();
        }
        
        this.updateBulkActions();
        this.renderUsersTable();
    }

    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (this.selectedUsers.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedUsers.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    sortUsers(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'asc';
        }
        
        this.renderUsersTable();
    }

    async loadRecentActivity() {
        try {
            const response = await window.api.request('/admin/activity');
            if (response && response.success) {
                this.renderRecentActivity(response.data);
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    }

    renderRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #8892b0; padding: 20px;">
                    <i class="fas fa-history" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                    No recent activity
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'user_created': 'user-plus',
            'user_updated': 'user-edit',
            'user_deleted': 'user-minus',
            'key_generated': 'key',
            'login': 'sign-in-alt',
            'logout': 'sign-out-alt'
        };
        return icons[type] || 'info-circle';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.renderUsersTable();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.renderUsersTable();
            });
        }

        // Role filter
        const roleFilter = document.getElementById('role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filters.role = e.target.value;
                this.renderUsersTable();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-users');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                this.toggleSelectAll();
            });
        }
    }

    showNotification(title, message, type = 'info') {
        try {
            if (window.showNotification) {
                window.showNotification(title, message, type);
            } else {
                console.log(`${type.toUpperCase()}: ${title} - ${message}`);
            }
        } catch (error) {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
}

// Initialize admin dashboard
window.adminDashboard = new AdminDashboard();
