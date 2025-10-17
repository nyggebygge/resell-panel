// Login Page JavaScript
class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

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

    async handleLogin() {
        const formData = new FormData(document.getElementById('login-form'));
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Enhanced validation with specific error messages
        const validation = this.validateLoginForm(credentials);
        if (!validation.valid) {
            this.showError(validation.message);
            return;
        }

        this.showLoading();

        try {
            const success = await window.authManager.login(credentials);
            
            if (success) {
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.hideLoading();
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const formData = new FormData(document.getElementById('register-form'));
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validate input
        if (!this.validateRegisterForm(userData)) {
            return;
        }

        this.showLoading();

        try {
            const success = await window.authManager.register({
                username: userData.username,
                email: userData.email,
                password: userData.password
            });
            
            if (success) {
                this.showSuccess('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.hideLoading();
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Registration failed. Please try again.');
        }
    }

    validateLoginForm(credentials) {
        // Clear previous errors
        this.clearErrors();

        // Email validation
        if (!credentials.email) {
            return { valid: false, message: 'Email is required' };
        }
        if (!this.isValidEmail(credentials.email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }

        // Password validation
        if (!credentials.password) {
            return { valid: false, message: 'Password is required' };
        }
        if (credentials.password.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters long' };
        }

        return { valid: true };
    }

    validateRegisterForm(userData) {
        let isValid = true;

        // Clear previous errors
        this.clearErrors();

        if (!userData.username) {
            this.showFieldError('reg-username', 'Username is required');
            isValid = false;
        } else if (userData.username.length < 3) {
            this.showFieldError('reg-username', 'Username must be at least 3 characters');
            isValid = false;
        }

        if (!userData.email) {
            this.showFieldError('reg-email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(userData.email)) {
            this.showFieldError('reg-email', 'Please enter a valid email');
            isValid = false;
        }

        if (!userData.password) {
            this.showFieldError('reg-password', 'Password is required');
            isValid = false;
        } else if (userData.password.length < 6) {
            this.showFieldError('reg-password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!userData.confirmPassword) {
            this.showFieldError('confirm-password', 'Please confirm your password');
            isValid = false;
        } else if (userData.password !== userData.confirmPassword) {
            this.showFieldError('confirm-password', 'Passwords do not match');
            isValid = false;
        }

        const termsChecked = document.getElementById('terms').checked;
        if (!termsChecked) {
            this.showError('Please accept the Terms of Service');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordMatch() {
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirm-password', 'Passwords do not match');
        } else {
            this.clearFieldError('confirm-password');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    clearErrors() {
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
        });
        
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fed7d7' : '#c6f6d5'};
            color: ${type === 'error' ? '#c53030' : '#22543d'};
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    checkAuthStatus() {
        // If user is already logged in, redirect to dashboard
        if (window.authManager && window.authManager.getIsLoggedIn()) {
            window.location.href = 'index.html';
        }
    }
}

// Global functions for HTML onclick events
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function toggleRegPassword() {
    const passwordInput = document.getElementById('reg-password');
    const toggleBtn = document.querySelector('#register-form .toggle-password');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
