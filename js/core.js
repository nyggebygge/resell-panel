// Core application functionality
// User data storage (in a real app, this would be handled by a backend)
let userData = {
    credits: 0,
    totalDeposits: 0,
    lastDeposit: null,
    transactions: [],
    theme: 'dark',
    wishlist: [],
    purchases: [],
    username: 'User',
    keysGenerated: 0,
    generatedKeys: []
};

// Animation and effects variables
let animationFrameId;
let particles = [];
let canvas, ctx;

// Loading state management
function showLoadingState(button, loadingText = 'Loading...') {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        ${loadingText}
    `;
    button.classList.add('loading');
}

function hideLoadingState(button, originalText) {
    if (!button) return;
    
    button.disabled = false;
    button.textContent = originalText || button.dataset.originalText || 'Submit';
    button.classList.remove('loading');
}

// Input validation utilities
const Validator = {
    // Validate email format
    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate password strength
    password(password) {
        const minLength = 6;
        if (password.length < minLength) {
            return { valid: false, message: `Password must be at least ${minLength} characters long` };
        }
        return { valid: true };
    },
    
    // Validate username
    username(username) {
        const minLength = 3;
        const maxLength = 30;
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        
        if (username.length < minLength) {
            return { valid: false, message: `Username must be at least ${minLength} characters long` };
        }
        if (username.length > maxLength) {
            return { valid: false, message: `Username must be no more than ${maxLength} characters long` };
        }
        if (!usernameRegex.test(username)) {
            return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
        }
        return { valid: true };
    },
    
    // Validate key quantity
    keyQuantity(quantity) {
        const min = 1;
        const max = 100;
        const num = parseInt(quantity);
        
        if (isNaN(num)) {
            return { valid: false, message: 'Quantity must be a number' };
        }
        if (num < min) {
            return { valid: false, message: `Minimum quantity is ${min}` };
        }
        if (num > max) {
            return { valid: false, message: `You can only generate ${max} keys at a time. Please reduce the quantity.` };
        }
        return { valid: true };
    },
    
    // Validate required fields
    required(value, fieldName) {
        if (!value || value.toString().trim() === '') {
            return { valid: false, message: `${fieldName} is required` };
        }
        return { valid: true };
    }
};

// Load user data from backend API or localStorage
async function loadUserData() {
    // Try to load from backend API first if authenticated
    if (window.api && window.api.isAuthenticated()) {
        try {
            console.log('Loading user data from backend API...');
            const response = await window.api.getProfile();
            if (response && response.success) {
                const user = response.data.user;
                
                // Update userData with backend data
                userData = {
                    ...userData,
                    credits: user.credits || 0,
                    totalDeposits: user.totalDeposits || 0,
                    lastDeposit: user.lastDeposit,
                    username: user.username || 'User',
                    keysGenerated: user.keysGenerated || 0,
                    theme: user.theme || 'dark'
                };
                
                console.log('Loaded user data from backend:', {
                    credits: userData.credits,
                    totalDeposits: userData.totalDeposits,
                    username: userData.username
                });
                
                try {
                    updateUI();
                } catch (error) {
                    console.error('❌ Error updating UI after loading user data:', error);
                }
                return;
            }
        } catch (error) {
            console.log('Backend API failed, using local storage fallback:', error);
        }
    }
    
    // Fallback: Load from localStorage
    console.log('Loading user data from local storage...');
    const saved = localStorage.getItem('resellerPanelData');
    if (saved) {
        userData = { ...userData, ...JSON.parse(saved) };
    }
    
    // Clear all demo/hardcoded data from local storage
    if (userData.generatedKeys && userData.generatedKeys.length > 0) {
        const hasDemoKeys = userData.generatedKeys.some(key => 
            key.key && (key.key.includes('DEMO-KEY') || 
                       key.generationName && key.generationName.includes('Demo') ||
                       key.generationId && key.generationId.includes('demo'))
        );
        if (hasDemoKeys) {
            console.log('Clearing demo/hardcoded keys from local storage');
            userData.generatedKeys = [];
            userData.keysGenerated = 0;
            saveUserData();
        }
    }
    
    try {
        updateUI();
    } catch (error) {
        console.error('❌ Error updating UI in loadUserData:', error);
    }
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('resellerPanelData', JSON.stringify(userData));
}

// Update UI elements with current data and animations
function updateUI() {
    try {
        console.log('🔄 updateUI called');
        
        // Safety check - ensure DOM is ready
        if (document.readyState !== 'complete') {
            console.log('⚠️ DOM not ready, skipping updateUI');
            return;
        }
        
        // Additional safety check - ensure userData exists and has required properties
        if (!userData || typeof userData !== 'object') {
            console.warn('⚠️ userData not available, skipping updateUI');
            return;
        }
        
        // Ensure userData has credits property
        if (typeof userData.credits !== 'number') {
            console.warn('⚠️ userData.credits not available, setting to 0');
            userData.credits = 0;
        }
    
    // Try to get user data from backend API first
    if (window.api && window.api.isAuthenticated()) {
        window.api.getProfile().then(response => {
            if (response && response.success) {
                const user = response.data.user;
                
                // Update credits displays with backend data
                console.log('🔄 Getting credit elements for backend data...');
                const userCredits = document.getElementById('user-credits');
                const totalCredits = document.getElementById('total-credits');
                const availableCredits = document.getElementById('available-credits');
                const creditsDisplay = document.getElementById('credits-display');
                
                console.log('🔍 Credit elements found for backend data:', {
                    userCredits: !!userCredits,
                    totalCredits: !!totalCredits,
                    availableCredits: !!availableCredits,
                    creditsDisplay: !!creditsDisplay
                });
                
                try {
                    if (userCredits) animateCounter(userCredits, user.credits || 0, 1500, true);
                    if (totalCredits) animateCounter(totalCredits, user.credits || 0, 1500, true);
                    if (availableCredits) animateCounter(availableCredits, user.credits || 0, 1500, true);
                    if (creditsDisplay) animateCounter(creditsDisplay, user.credits || 0, 2000);
                } catch (error) {
                    console.error('❌ Error animating credit elements with backend data:', error);
                }
                
                // Update credits value
                const creditsValue = document.getElementById('credits-value');
                if (creditsValue) {
                    creditsValue.textContent = ((user.credits || 0) / 100).toFixed(2);
                }
                
                // Update deposit count with backend data
                const totalDeposits = document.getElementById('total-deposits');
                if (totalDeposits) animateCounter(totalDeposits, user.totalDeposits || 0, 1000);
                
                // Update last deposit
                const lastDeposit = document.getElementById('last-deposit');
                if (lastDeposit) {
                    lastDeposit.textContent = user.lastDeposit ? new Date(user.lastDeposit).toLocaleDateString() : 'Never';
                }
                
                // Update username
                const usernameElement = document.getElementById('username');
                if (usernameElement) {
                    usernameElement.textContent = user.username || 'User';
                }
                
                console.log('Updated UI with backend data:', {
                    credits: user.credits,
                    totalDeposits: user.totalDeposits,
                    username: user.username
                });
                
                return;
            }
        }).catch(error => {
            console.log('Backend API failed, using local storage fallback:', error);
        });
    }
    
    // Fallback: Use local storage data
    console.log('Using local storage fallback for user data');
    
    // Animate credits displays
    console.log('🔄 Getting credit elements...');
    const userCredits = document.getElementById('user-credits');
    const totalCredits = document.getElementById('total-credits');
    const availableCredits = document.getElementById('available-credits');
    const creditsDisplay = document.getElementById('credits-display');
    
    console.log('🔍 Credit elements found:', {
        userCredits: !!userCredits,
        totalCredits: !!totalCredits,
        availableCredits: !!availableCredits,
        creditsDisplay: !!creditsDisplay
    });
    
    try {
        if (userCredits) animateCounter(userCredits, userData.credits, 1500, true);
        if (totalCredits) animateCounter(totalCredits, userData.credits, 1500, true);
        if (availableCredits) animateCounter(availableCredits, userData.credits, 1500, true);
        if (creditsDisplay) animateCounter(creditsDisplay, userData.credits, 2000);
    } catch (error) {
        console.error('❌ Error animating credit elements:', error);
    }
    
    // Update credits value
    const creditsValue = document.getElementById('credits-value');
    if (creditsValue) {
        creditsValue.textContent = (userData.credits / 100).toFixed(2);
    }
    
    // Animate deposit count
    const totalDeposits = document.getElementById('total-deposits');
    if (totalDeposits) animateCounter(totalDeposits, userData.totalDeposits, 1000);
    
    // Update last deposit
    const lastDeposit = document.getElementById('last-deposit');
    if (lastDeposit) {
        lastDeposit.textContent = userData.lastDeposit || 'Never';
    }
    
    // Update username
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userData.username;
    }
    
    // Update keys generated count from backend API
    const keysCountElement = document.getElementById('keys-count');
    if (keysCountElement) {
        // Try to get keys count from backend API first
        if (window.api && window.authManager && window.authManager.getIsLoggedIn()) {
            console.log('🔑 Loading keys count from API...');
            window.api.getKeyStats().then(stats => {
                console.log('🔑 Keys stats from API:', stats);
                if (stats && stats.success) {
                    animateCounter(keysCountElement, stats.data.totalKeys || 0, 1000);
                } else {
                    // Fallback to local storage
                    console.log('🔑 Using fallback keys count:', userData.keysGenerated);
                    animateCounter(keysCountElement, userData.keysGenerated, 1000);
                }
            }).catch(error => {
                console.error('🔑 API error, using fallback:', error);
                // Fallback to local storage if API fails
                animateCounter(keysCountElement, userData.keysGenerated, 1000);
            });
        } else {
            // Not authenticated, use local storage
            console.log('🔑 Not authenticated, using local keys count:', userData.keysGenerated);
            animateCounter(keysCountElement, userData.keysGenerated, 1000);
        }
        
        // Immediate fallback - set the count directly if it's still 0
        setTimeout(() => {
            if (keysCountElement && keysCountElement.textContent === '0' && userData.keysGenerated > 0) {
                console.log('🔑 Setting keys count directly:', userData.keysGenerated);
                keysCountElement.textContent = userData.keysGenerated;
            }
        }, 2000);
    }
    
    // Update credits bar animation
    updateCreditsBar();
    } catch (error) {
        console.error('❌ Error in updateUI function:', error);
    }
}

// Update credits bar with animation
function updateCreditsBar() {
    const creditsFill = document.querySelector('.credits-fill');
    if (creditsFill) {
        const maxCredits = 20000; // Example max for visualization
        const percentage = Math.min((userData.credits / maxCredits) * 100, 100);
        creditsFill.style.width = percentage + '%';
    }
}

// Animated counter function
function animateCounter(element, target, duration = 2000, isDecimal = false) {
    console.log('🔍 animateCounter called with:', { element, target, duration, isDecimal });
    
    if (!element) {
        console.warn('⚠️ animateCounter: Element is null or undefined');
        return;
    }
    
    if (!element.textContent) {
        console.warn('⚠️ animateCounter: Element has no textContent:', element);
        return;
    }
    
    const start = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        // Check if element still exists
        if (!element || !element.textContent) {
            clearInterval(timer);
            return;
        }
        
        current += increment;
        
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            current = target;
            clearInterval(timer);
        }
        
        if (isDecimal) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Enhanced message system
function showMessage(text, type = 'info') {
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    message.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${text}</span>
    `;
    
    const activeSection = document.querySelector('.section.active');
    activeSection.insertBefore(message, activeSection.firstChild);
    
    // Add entrance animation
    message.style.transform = 'translateY(-20px)';
    message.style.opacity = '0';
    
    setTimeout(() => {
        message.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        message.style.transform = 'translateY(0)';
        message.style.opacity = '1';
    }, 10);
    
    // Auto-remove with exit animation
    setTimeout(() => {
        message.style.transform = 'translateY(-20px)';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
    }, 4500);
}

// Enhanced Notification System
function createNotificationContainer() {
    if (!document.querySelector('.notification-container')) {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        console.log('✅ Notification container created');
    } else {
        console.log('📦 Notification container already exists');
    }
}

function showNotificationInternal(title, message, type = 'info', duration = 4000) {
    // Ensure notification container exists
    createNotificationContainer();
    
    const container = document.querySelector('.notification-container');
    if (!container) {
        console.error('❌ Notification container not found, using fallback');
        // Fallback to console and alert
        console.log(`📢 ${type.toUpperCase()}: ${title} - ${message}`);
        if (type === 'error') {
            alert(`Error: ${title}\n${message}`);
        }
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type} notification-enhanced fade-in-scale`;
    
    const iconMap = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${iconMap[type]}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    try {
        container.appendChild(notification);
        console.log('✅ Notification appended to container');
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
            console.log('✅ Notification shown');
        }, 10);
    } catch (error) {
        console.error('❌ Error appending notification:', error);
        // Fallback to console
        console.log(`📢 ${type.toUpperCase()}: ${title} - ${message}`);
    }
    
    // Auto-remove
    const autoRemove = setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeNotification(notification);
    });
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 500);
}

// Confetti effect for successful actions
function createConfetti() {
    const colors = ['#00d4ff', '#0099cc', '#22c55e', '#f59e0b', '#ef4444'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            z-index: 10000;
            pointer-events: none;
            border-radius: 50%;
        `;
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
}

// Key Generator Functionality
let selectedKeyType = null;

function showKeyOptions() {
    const modal = document.getElementById('key-options-modal');
    modal.classList.add('show');
    addMagneticEffect();
}

function closeKeyOptionsModal() {
    const modal = document.getElementById('key-options-modal');
    modal.classList.remove('show');
    selectedKeyType = null;
    document.getElementById('key-quantity').value = 1;
    document.getElementById('confirm-generate').disabled = true;
    document.querySelectorAll('.key-type-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function selectKeyType(type) {
    selectedKeyType = type;
    console.log('🔑 Key type selected:', type);
    
    // Update visual selection
    document.querySelectorAll('.key-type-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    event.target.closest('.key-type-btn').classList.add('selected');
    
    // Enable confirm button
    document.getElementById('confirm-generate').disabled = false;
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('key-quantity');
    const currentValue = parseInt(quantityInput.value) || 1;
    const newValue = Math.max(1, Math.min(100, currentValue + delta));
    quantityInput.value = newValue;
}

// Prevent multiple simultaneous key generation calls
let isGeneratingKeys = false;

async function confirmKeyGeneration() {
    console.log('🔑 Starting key generation process...');
    
    // Prevent multiple simultaneous calls
    if (isGeneratingKeys) {
        console.log('⚠️ Key generation already in progress, ignoring duplicate call');
        return;
    }
    
    if (!selectedKeyType) {
        console.log('❌ No key type selected');
        showNotification('Selection Required', 'Please select a key type.', 'warning');
        return;
    }
    
    console.log(`🔑 Selected key type: ${selectedKeyType}`);
    
    const quantityInput = document.getElementById('key-quantity');
    const quantity = parseInt(quantityInput.value) || 1;
    
    // Validate input
    const quantityValidation = Validator.keyQuantity(quantity);
    if (!quantityValidation.valid) {
        showNotification('Invalid Input', quantityValidation.message, 'error');
        quantityInput.focus();
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-generate');
    const originalText = confirmBtn.textContent;
    
    // Set generating flag
    isGeneratingKeys = true;
    
    // Disable button to prevent multiple clicks
    confirmBtn.disabled = true;
    confirmBtn.style.pointerEvents = 'none';
    
    // Show loading state
    showLoadingState(confirmBtn, 'Generating...');
    
    try {
        // Debug authentication status
        console.log('🔐 Auth Manager available:', !!window.authManager);
        console.log('🔐 Is logged in:', window.authManager ? window.authManager.getIsLoggedIn() : false);
        console.log('🔐 Current user:', window.authManager ? window.authManager.getCurrentUser() : null);
        console.log('🔌 API available:', !!window.api);
        console.log('🔌 API methods:', window.api ? Object.keys(window.api) : 'No API');
        
        // Use backend API for key generation
        if (window.authManager && window.authManager.getIsLoggedIn() && window.api) {
            console.log('🔑 Calling API to generate keys...');
            
            // Validate API method exists
            if (typeof window.api.generateKeys !== 'function') {
                console.error('❌ generateKeys method not available on API');
                showNotification('System Error', 'Key generation API not available', 'error');
                return;
            }
            
            const response = await window.api.generateKeys({
                type: selectedKeyType,
                quantity: quantity
            });
            console.log('🔑 API response:', response);
            
            // Validate response structure
            if (!response || typeof response !== 'object') {
                console.error('❌ Invalid API response structure:', response);
                showNotification('Generation Error', 'Invalid response from server', 'error');
                return;
            }
            
            if (response.success) {
                // Close modal
                closeKeyOptionsModal();
                
                // Get key type from response or fallback to selectedKeyType
                const keyType = response.data?.type || selectedKeyType || 'unknown';
                console.log('🔑 Key generation success - keyType:', keyType, 'quantity:', quantity);
                
                showNotification(
                    'Keys Generated!',
                    `Successfully generated ${quantity} ${keyType} key${quantity > 1 ? 's' : ''}`,
                    'success'
                );
                
                // Create confetti effect
                createConfetti();
                
                // Refresh keys display
                if (window.smartKeys) {
                    window.smartKeys.loadKeys();
                }
                
                // Refresh batch manager
                if (window.batchManager) {
                    window.batchManager.refreshBatches();
                }
                
                // Update UI with additional safety checks
                try {
                    console.log('🔄 Updating UI after successful key generation');
                    // Small delay to ensure DOM is stable
                    setTimeout(() => {
                        try {
                            updateUI();
                        } catch (uiError) {
                            console.error('❌ Error in delayed updateUI after key generation:', uiError);
                        }
                    }, 100);
                } catch (error) {
                    console.error('❌ Error updating UI after key generation:', error);
                }
            } else {
                showNotification('Generation Failed', response.message, 'error');
            }
        } else {
            // Fallback to local storage if not authenticated or API not available
            if (!window.api) {
                console.log('❌ API not available');
                showNotification('System Error', 'API not loaded. Please refresh the page.', 'error');
            } else {
                console.log('❌ Not authenticated, using fallback key generation');
                showNotification('Authentication Required', 'Please login to generate keys.', 'warning');
                
                // Try to redirect to login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Key generation error:', error);
        
        // Enhanced error handling with specific messages
        let errorMessage = 'Failed to generate keys. Please try again.';
        
        if (error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('Authentication')) {
            errorMessage = 'Authentication failed. Please login again.';
        } else if (error.message.includes('Server')) {
            errorMessage = 'Server error. Please try again in a few moments.';
        } else if (error.message.includes('Validation')) {
            errorMessage = 'Invalid input. Please check your selections and try again.';
        } else if (error.message.includes('100 keys at a time')) {
            errorMessage = 'You can only generate 100 keys at a time. Please reduce the quantity and try again.';
        } else if (error.message.includes('textContent')) {
            errorMessage = 'UI update error. Keys may have been generated successfully.';
        } else if (error.message.includes('balance')) {
            errorMessage = 'System error: Balance reference found. Please refresh the page.';
        }
        
        showNotification('Generation Error', errorMessage, 'error');
    } finally {
        // Reset button state and generating flag
        hideLoadingState(confirmBtn, originalText);
        confirmBtn.disabled = false;
        confirmBtn.style.pointerEvents = '';
        isGeneratingKeys = false;
    }
}

function generateRandomKey() {
    const config = window.CONFIG?.KEYS || {};
    const chars = config.KEY_CHARS || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = config.KEY_LENGTH || 16;
    
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Simple fallback notification function
function fallbackNotification(title, message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${title} - ${message}`);
    if (type === 'error') {
        alert(`Error: ${title}\n${message}`);
    }
}

// Export the showNotification function with fallback
window.showNotification = function(title, message, type = 'info', duration = 4000) {
    try {
        showNotificationInternal(title, message, type, duration);
    } catch (error) {
        console.error('❌ Notification system error:', error);
        fallbackNotification(title, message, type);
    }
};

// Export functions for global access
window.userData = userData;
window.loadUserData = loadUserData;
window.saveUserData = saveUserData;
window.updateUI = updateUI;
window.showMessage = showMessage;
window.createConfetti = createConfetti;
window.showKeyOptions = showKeyOptions;
window.closeKeyOptionsModal = closeKeyOptionsModal;
window.selectKeyType = selectKeyType;
window.changeQuantity = changeQuantity;
window.confirmKeyGeneration = confirmKeyGeneration;
