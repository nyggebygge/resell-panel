// Authentication Management for Resell Panel
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    // Initialize authentication
    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    // Check if user is authenticated
    async checkAuthStatus() {
        if (window.api.isAuthenticated()) {
            try {
                const response = await window.api.getProfile();
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.isLoggedIn = true;
                    this.updateUI();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
            }
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await window.api.login(credentials);
            if (response.success) {
                this.currentUser = response.data.user;
                this.isLoggedIn = true;
                this.updateUI();
                this.showNotification('Login Successful', 'Welcome back!', 'success');
                return true;
            } else {
                this.showNotification('Login Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Login Error', error.message, 'error');
            return false;
        }
    }

    // Register user
    async register(userData) {
        try {
            const response = await window.api.register(userData);
            if (response.success) {
                this.currentUser = response.data.user;
                this.isLoggedIn = true;
                this.updateUI();
                this.showNotification('Registration Successful', 'Account created!', 'success');
                return true;
            } else {
                this.showNotification('Registration Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Registration Error', error.message, 'error');
            return false;
        }
    }

    // Logout user
    async logout() {
        try {
            await window.api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.isLoggedIn = false;
            window.api.clearToken();
            this.updateUI();
            this.showNotification('Logged Out', 'You have been logged out', 'info');
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await window.api.updateProfile(profileData);
            if (response.success) {
                this.currentUser = response.data.user;
                this.updateUI();
                this.showNotification('Profile Updated', 'Your profile has been updated', 'success');
                return true;
            } else {
                this.showNotification('Update Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Update Error', error.message, 'error');
            return false;
        }
    }

    // Change password
    async changePassword(passwordData) {
        try {
            const response = await window.api.changePassword(passwordData);
            if (response.success) {
                this.showNotification('Password Changed', 'Your password has been updated', 'success');
                return true;
            } else {
                this.showNotification('Password Change Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Password Change Error', error.message, 'error');
            return false;
        }
    }

    // Update UI based on auth status
    updateUI() {
        const authElements = document.querySelectorAll('[data-auth]');
        const guestElements = document.querySelectorAll('[data-guest]');
        
        if (this.isLoggedIn) {
            // Show authenticated elements
            authElements.forEach(el => el.style.display = 'block');
            guestElements.forEach(el => el.style.display = 'none');
            
            // Update user info
            this.updateUserInfo();
        } else {
            // Show guest elements
            authElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = 'block');
        }
    }

    // Update user information in UI
    updateUserInfo() {
        if (!this.currentUser) return;

        // Update username
        const usernameElements = document.querySelectorAll('[data-username]');
        usernameElements.forEach(el => {
            el.textContent = this.currentUser.username;
        });

        // Update balance
        const balanceElements = document.querySelectorAll('[data-balance]');
        balanceElements.forEach(el => {
            el.textContent = this.currentUser.balance.toLocaleString();
        });

        // Update credits
        const creditsElements = document.querySelectorAll('[data-credits]');
        creditsElements.forEach(el => {
            el.textContent = this.currentUser.credits.toLocaleString();
        });

        // Update keys generated
        const keysElements = document.querySelectorAll('[data-keys-generated]');
        keysElements.forEach(el => {
            el.textContent = this.currentUser.keysGenerated.toLocaleString();
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const credentials = {
                    email: formData.get('email'),
                    password: formData.get('password')
                };
                await this.login(credentials);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const userData = {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password')
                };
                await this.register(userData);
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // Show notification
    showNotification(title, message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(title, message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if logged in
    getIsLoggedIn() {
        return this.isLoggedIn;
    }
}

// Create global auth manager
window.authManager = new AuthManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
