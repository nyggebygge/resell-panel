/**
 * Professional Authentication System
 * Clean, single-source authentication management
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.token = null;
        this.init();
    }

    /**
     * Initialize authentication system
     */
    async init() {
        console.log('🔐 Initializing Auth System...');
        
        // Check for existing token
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            this.token = storedToken;
            // Don't validate token immediately to avoid race conditions
            // Token validation will happen in main.js
        }
        
        this.setupEventListeners();
        console.log('✅ Auth System initialized');
        
        // Dispatch event that auth system is ready
        console.log('📡 Dispatching authSystemReady event');
        document.dispatchEvent(new CustomEvent('authSystemReady'));
    }

    /**
     * Validate existing token
     */
    async validateToken() {
        try {
            // Try to get user profile to validate token
            const response = await this.apiCall('/auth/me', 'GET');
                   if (response.success) {
                       this.currentUser = response.data.user;
                       this.isLoggedIn = true;
                       this.updateUI();
                       console.log('✅ Token validated, user authenticated');
                       console.log('👤 User data:', {
                           username: this.currentUser.username,
                           email: this.currentUser.email,
                           role: this.currentUser.role,
                           isAdmin: this.currentUser.role === 'admin'
                       });
                       return true;
            } else {
                console.log('❌ Token validation failed, clearing auth');
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('❌ Token validation failed:', error);
            this.clearAuth();
            return false;
        }
    }

    /**
     * Login user
     */
    async login(credentials) {
        try {
            console.log('🔐 Attempting login...');
            const response = await this.apiCall('/auth/login', 'POST', credentials);
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.token = response.data.token;
                this.isLoggedIn = true;
                
                // Store token
                localStorage.setItem('authToken', this.token);
                
                console.log('👤 User logged in:', {
                    username: this.currentUser.username,
                    email: this.currentUser.email,
                    role: this.currentUser.role,
                    isAdmin: this.currentUser.role === 'admin'
                });
                
                this.updateUI();
                console.log('✅ Login successful');
                return { success: true, user: this.currentUser };
            } else {
                console.error('❌ Login failed:', response.message);
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    /**
     * Register user
     */
    async register(userData) {
        try {
            console.log('📝 Attempting registration...');
            const response = await this.apiCall('/auth/register', 'POST', userData);
            
            if (response.success) {
                console.log('✅ Registration successful');
                return { success: true, message: 'Account created successfully!' };
            } else {
                console.error('❌ Registration failed:', response.message);
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            console.log('🚪 Logging out...');
            
            // Call logout API (optional)
            try {
                await this.apiCall('/auth/logout', 'POST');
            } catch (error) {
                console.log('Logout API call failed, continuing...');
            }
            
            this.clearAuth();
            console.log('✅ Logout successful');
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('❌ Logout error:', error);
            this.clearAuth();
            // Still redirect even if there's an error
            window.location.href = 'login.html';
        }
    }

    /**
     * Clear authentication state
     */
    clearAuth() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.token = null;
        localStorage.removeItem('authToken');
        this.updateUI();
        console.log('🧹 Auth state cleared');
    }

    /**
     * Check if user is authenticated
     */
    getIsLoggedIn() {
        return this.isLoggedIn && this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.isLoggedIn && this.currentUser && this.currentUser.role === 'admin';
    }

    /**
     * Make API call
     */
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `/api${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add token to headers if available
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add data for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            return result;
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }

    /**
     * Update UI based on authentication state
     */
    updateUI() {
        const authElements = document.querySelectorAll('[data-auth]');
        const guestElements = document.querySelectorAll('[data-guest]');
        const usernameElement = document.getElementById('nav-username');
        const creditsElement = document.getElementById('nav-credits');
        const adminButton = document.getElementById('admin-btn');
        const adminSidebarLink = document.querySelector('.admin-link');
        const adminSection = document.getElementById('admin-section');

        if (this.isLoggedIn) {
            // Show authenticated elements, hide guest elements
            authElements.forEach(el => el.style.display = 'block');
            guestElements.forEach(el => el.style.display = 'none');

            // Update user info
            if (usernameElement && this.currentUser) {
                usernameElement.textContent = this.currentUser.username;
            }
            if (creditsElement && this.currentUser) {
                creditsElement.textContent = `${this.currentUser.credits}`;
            }

            // Show admin button if user is admin
            if (adminButton && this.currentUser && this.currentUser.role === 'admin') {
                adminButton.style.display = 'block';
                console.log('✅ Admin button shown for admin user');
            } else if (adminButton) {
                adminButton.style.display = 'none';
                console.log('❌ Admin button hidden - user is not admin');
            }

            // Show admin section if user is admin
            if (adminSection && this.currentUser && this.currentUser.role === 'admin') {
                adminSection.style.display = 'block';
                console.log('✅ Admin section shown for admin user');
            } else if (adminSection) {
                adminSection.style.display = 'none';
                console.log('❌ Admin section hidden - user is not admin');
            }
        } else {
            // Show guest elements, hide authenticated elements
            authElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = 'block');
            
            // Hide admin button when not logged in
            if (adminButton) {
                adminButton.style.display = 'none';
            }
            if (adminSection) {
                adminSection.style.display = 'none';
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isLoggedIn) {
                this.validateToken();
            }
        });

        // Handle storage changes (for multi-tab logout)
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' && !e.newValue) {
                this.clearAuth();
            }
        });

        // Handle logout button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-btn')) {
                e.preventDefault();
                console.log('🔴 Logout button clicked');
                this.logout();
            }
        });

        // Handle admin button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#admin-btn')) {
                e.preventDefault();
                console.log('🛡️ Admin button clicked');
                window.location.href = 'admin.html';
            }
        });
    }

    /**
     * Show a notification
     */
    showNotification(title, message, type = 'info', duration = 3000) {
        if (window.showNotification) {
            window.showNotification(title, message, type, duration);
        } else {
            console.log(`Notification: ${title} - ${message}`);
        }
    }
}

// Create global auth manager
window.authManager = new AuthManager();

// Global logout function for easy access
window.logout = function() {
    if (window.authManager) {
        window.authManager.logout();
    }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}