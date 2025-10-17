/**
 * Professional Login System
 * Clean login/registration management
 */
class LoginManager {
    constructor() {
        this.isProcessing = false;
        this.init();
    }

    /**
     * Initialize login system
     */
    init() {
        this.setupEventListeners();
        console.log('🔐 Login System initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Password confirmation validation
        const confirmPassword = document.getElementById('confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    /**
     * Handle login
     */
    async handleLogin() {
        if (this.isProcessing) {
            console.log('🚫 Login already in progress');
            return;
        }

        this.isProcessing = true;
        this.showLoading('Logging in...');

        try {
            const credentials = {
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value
            };

            // Validate input
            if (!this.validateLoginForm(credentials)) {
                this.hideLoading();
                this.isProcessing = false;
                return;
            }

            // Attempt login
            const result = await window.authManager.login(credentials);

            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.hideLoading();
                this.showError(result.message || 'Login failed');
                this.isProcessing = false;
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Login failed. Please try again.');
            this.isProcessing = false;
        }
    }

    /**
     * Handle registration
     */
    async handleRegister() {
        if (this.isProcessing) {
            console.log('🚫 Registration already in progress');
            return;
        }

        this.isProcessing = true;
        this.showRegisterLoading('Creating account...');

        try {
            const userData = {
                username: document.getElementById('reg-username').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                password: document.getElementById('reg-password').value,
                confirmPassword: document.getElementById('confirm-password').value
            };

            // Validate input
            if (!this.validateRegisterForm(userData)) {
                this.hideRegisterLoading();
                this.isProcessing = false;
                return;
            }

            // Attempt registration
            const result = await window.authManager.register(userData);

            if (result.success) {
                this.showSuccess('Account created successfully! Please log in.');
                this.hideRegisterLoading();
                this.isProcessing = false;
                
                // Close register modal and show login form
                setTimeout(() => {
                    this.hideRegisterModal();
                    this.showLoginForm();
                }, 2000);
            } else {
                this.hideRegisterLoading();
                this.showError(result.message || 'Registration failed');
                this.isProcessing = false;
            }
        } catch (error) {
            this.hideRegisterLoading();
            this.showError('Registration failed. Please try again.');
            this.isProcessing = false;
        }
    }

    /**
     * Validate login form
     */
    validateLoginForm(credentials) {
        this.clearErrors();

        if (!credentials.email) {
            this.showError('Email is required');
            return false;
        }

        if (!credentials.password) {
            this.showError('Password is required');
            return false;
        }

        if (!this.isValidEmail(credentials.email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    /**
     * Validate register form
     */
    validateRegisterForm(userData) {
        this.clearErrors();

        if (!userData.username) {
            this.showError('Username is required');
            return false;
        }

        if (!userData.email) {
            this.showError('Email is required');
            return false;
        }

        if (!userData.password) {
            this.showError('Password is required');
            return false;
        }

        if (!userData.confirmPassword) {
            this.showError('Please confirm your password');
            return false;
        }

        if (userData.username.length < 3) {
            this.showError('Username must be at least 3 characters');
            return false;
        }

        if (!this.isValidEmail(userData.email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (userData.password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return false;
        }

        if (userData.password !== userData.confirmPassword) {
            this.showError('Passwords do not match');
            return false;
        }

        return true;
    }

    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const confirmPasswordField = document.getElementById('confirm-password');

        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordField.style.borderColor = '#e74c3c';
        } else {
            confirmPasswordField.style.borderColor = '#27ae60';
        }
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            // Update the text in the p tag
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingOverlay.classList.add('show');
        } else {
            // Create a simple loading indicator if overlay doesn't exist
            console.log('Loading overlay not found, using notification fallback');
            this.showNotification(message, 'info');
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
        // Clear any loading notifications
        const loadingNotifications = document.querySelectorAll('.notification-info');
        loadingNotifications.forEach(notification => {
            if (notification.textContent.includes('Loading') || notification.textContent.includes('Logging in') || notification.textContent.includes('Creating account')) {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }
        });
    }

    /**
     * Show registration loading state
     */
    showRegisterLoading(message = 'Creating account...') {
        // Try to use the main loading overlay first
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingOverlay.classList.add('show');
        } else {
            // Use notification for registration
            this.showNotification(message, 'info');
        }
    }

    /**
     * Hide registration loading state
     */
    hideRegisterLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
        // Clear any loading notifications
        const loadingNotifications = document.querySelectorAll('.notification-info');
        loadingNotifications.forEach(notification => {
            if (notification.textContent.includes('Creating account')) {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }
        });
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        // Remove existing notifications
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Hide register modal
     */
    hideRegisterModal() {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Show login form
     */
    showLoginForm() {
        this.clearErrors();
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.focus();
        }
    }
}

// Initialize when DOM is loaded (only on login page)
if (window.location.pathname.includes('login.html') || window.location.pathname.endsWith('/login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        new LoginManager();
    });
}

// Global functions for HTML onclick events
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function toggleRegPassword() {
    const passwordInput = document.getElementById('reg-password');
    const toggleBtn = document.querySelector('.toggle-reg-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function showRegister() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideRegister() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}