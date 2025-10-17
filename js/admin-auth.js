/**
 * Admin Authentication
 * Professional event-driven admin authentication system
 */

class AdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.isAdmin = false;
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Don't check auth status immediately - wait for event
    }

    checkAuthStatus() {
        console.log('🔍 Checking admin auth status...');
        
        // If auth manager is not ready, wait for it
        if (!window.authManager) {
            console.log('⏳ Auth manager not ready, waiting for event...');
            return false;
        }

        // Use the main auth system
        if (window.authManager.getIsLoggedIn()) {
            this.user = window.authManager.getCurrentUser();
            this.isAuthenticated = true;
            this.isAdmin = this.user && this.user.role === 'admin';
            
            console.log('🔐 Admin auth status:', {
                isAuthenticated: this.isAuthenticated,
                isAdmin: this.isAdmin,
                userRole: this.user ? this.user.role : 'No user'
            });
            
            if (!this.isAdmin) {
                console.log('❌ User is not admin');
                return false;
            } else {
                console.log('✅ Admin authentication successful');
                this.isInitialized = true;
                return true;
            }
        } else {
            console.log('❌ Not authenticated');
            return false;
        }
    }

    logout() {
        // Use main auth system for logout
        if (window.authManager) {
            window.authManager.logout();
        } else {
            this.clearAuth();
            window.location.href = 'login.html';
        }
    }

    clearAuth() {
        this.isAuthenticated = false;
        this.user = null;
        this.isAdmin = false;
        this.isInitialized = false;
    }

    isLoggedIn() {
        return this.isAuthenticated && this.isAdmin;
    }

    getCurrentUser() {
        return this.user;
    }

    setupEventListeners() {
        // Listen for auth system ready event
        document.addEventListener('authSystemReady', () => {
            console.log('📡 Auth system ready event received');
            const isAdmin = this.checkAuthStatus();
            if (!isAdmin) {
                console.log('❌ Admin access denied, redirecting to login');
                window.location.href = 'login.html';
            }
        });

        // Handle storage changes (logout from another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' && !e.newValue) {
                this.clearAuth();
                window.location.href = 'login.html';
            }
        });
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
