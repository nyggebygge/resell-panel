/**
 * Admin Authentication
 * Handles admin authentication and authorization
 */

class AdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    checkAuthStatus() {
        // Check if user is already authenticated through regular auth
        if (window.api && window.api.isAuthenticated()) {
            this.verifyAdminStatus();
        } else {
            // Fallback to admin-specific tokens
            const token = localStorage.getItem('adminToken');
            const userData = localStorage.getItem('adminUser');
            
            if (token && userData) {
                try {
                    this.user = JSON.parse(userData);
                    this.isAuthenticated = true;
                    this.isAdmin = this.user.role === 'admin';
                    
                    // Verify token with backend
                    this.verifyToken();
                } catch (error) {
                    console.error('Error parsing admin user data:', error);
                    this.clearAuth();
                }
            }
        }
    }

    async verifyAdminStatus() {
        try {
            const response = await window.api.getProfile();
            if (response && response.success) {
                this.user = response.data.user;
                this.isAuthenticated = true;
                this.isAdmin = this.user.role === 'admin';
                
                if (this.isAdmin) {
                    console.log('✅ Admin access verified');
                    this.onAuthSuccess();
                } else {
                    console.log('❌ User is not an admin');
                    this.redirectToLogin();
                }
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Admin status verification failed:', error);
            this.redirectToLogin();
        }
    }

    async verifyToken() {
        try {
            const response = await window.api.request('/admin/verify');
            if (response && response.success) {
                this.user = response.data.user;
                this.isAdmin = this.user.role === 'admin';
                localStorage.setItem('adminUser', JSON.stringify(this.user));
            } else {
                this.clearAuth();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.clearAuth();
        }
    }

    async login(email, password) {
        try {
            const response = await window.api.request('/admin/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response && response.success) {
                const { token, user } = response.data;
                
                // Store authentication data
                localStorage.setItem('adminToken', token);
                localStorage.setItem('adminUser', JSON.stringify(user));
                
                this.isAuthenticated = true;
                this.user = user;
                this.isAdmin = user.role === 'admin';
                
                return { success: true, user };
            } else {
                return { success: false, message: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Admin login error:', error);
            return { success: false, message: 'Login failed' };
        }
    }

    logout() {
        this.clearAuth();
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    clearAuth() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        this.isAuthenticated = false;
        this.user = null;
        this.isAdmin = false;
    }

    isLoggedIn() {
        return this.isAuthenticated && this.isAdmin;
    }

    getCurrentUser() {
        return this.user;
    }

    getToken() {
        return localStorage.getItem('adminToken');
    }

    setupEventListeners() {
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated) {
                this.verifyToken();
            }
        });

        // Handle storage changes (logout from another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminToken' && !e.newValue) {
                this.clearAuth();
                window.location.href = 'login.html';
            }
        });
    }

    // Handle successful authentication
    onAuthSuccess() {
        this.isAuthenticated = true;
        console.log('Admin authentication successful');
        // Admin dashboard should be accessible now
    }

    // Redirect to login if not admin
    redirectToLogin() {
        console.log('Redirecting to login - user is not admin');
        window.location.href = 'login.html';
    }

    // Admin permission checks
    canManageUsers() {
        return this.isAdmin;
    }

    canViewStats() {
        return this.isAdmin;
    }

    canManageSystem() {
        return this.isAdmin;
    }

    // Check if user is admin
    checkIsAdmin() {
        return this.isAdmin;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.isAuthenticated;
    }

    // Redirect if not admin
    requireAdmin() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Initialize admin authentication
window.adminAuth = new AdminAuth();
