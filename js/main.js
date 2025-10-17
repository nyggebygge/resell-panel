/**
 * Professional Main System
 * Clean application initialization and authentication
 */
class MainSystem {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize main system
     */
    async init() {
        console.log('🚀 Initializing Main System...');
        
        // Wait for auth system to be ready
        await this.waitForAuthSystem();
        
        // Check authentication
        const isAuthenticated = await this.checkAuthentication();
        
        // Initialize dashboard if authenticated
        if (isAuthenticated && window.authManager.getIsLoggedIn()) {
            await this.initializeDashboard();
        }
        
        this.isInitialized = true;
        console.log('✅ Main System initialized');
    }

    /**
     * Wait for auth system to be ready
     */
    async waitForAuthSystem() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        console.log('⏳ Waiting for auth system...');
        
        while (!window.authManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`⏳ Still waiting for auth system... (${attempts}/50)`);
            }
        }
        
        if (!window.authManager) {
            console.error('❌ Auth System not available after 5 seconds');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('✅ Auth System ready');
    }

    /**
     * Check authentication status
     */
    async checkAuthentication() {
        console.log('🔐 Checking authentication...');
        
        const isLoggedIn = window.authManager.getIsLoggedIn();
        const hasToken = localStorage.getItem('authToken');
        
        console.log('Auth status:', { isLoggedIn, hasToken });
        
        // If no token at all, redirect to login
        if (!hasToken) {
            console.log('❌ No token found, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        // If we have a token but user is not logged in, try to restore session
        if (hasToken && !isLoggedIn) {
            console.log('🔄 Found token, attempting to restore session...');
            try {
                const restored = await window.authManager.validateToken();
                if (!restored) {
                    console.log('❌ Session restoration failed, redirecting to login');
                    window.location.href = 'login.html';
                    return false;
                }
                console.log('✅ Session restored successfully');
            } catch (error) {
                console.error('❌ Session restoration error:', error);
                window.location.href = 'login.html';
                return false;
            }
        }
        
        // Final check - make sure we're actually logged in
        if (!window.authManager.getIsLoggedIn()) {
            console.log('❌ Still not logged in after checks, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        console.log('✅ Authentication verified');
        return true;
    }

    /**
     * Initialize dashboard
     */
    async initializeDashboard() {
        console.log('📊 Initializing dashboard...');
        
        try {
            // Initialize animated background
            this.initAnimatedBackground();
            
            // Initialize navigation
            this.initNavigation();
            
            // Initialize user interface
            this.initUserInterface();
            
            // Initialize other components
            this.initComponents();
            
            console.log('✅ Dashboard initialized');
        } catch (error) {
            console.error('❌ Dashboard initialization error:', error);
        }
    }

    /**
     * Initialize animated background
     */
    initAnimatedBackground() {
        // Add animated background if needed
        console.log('🎨 Initializing animated background');
    }

    /**
     * Initialize navigation
     */
    initNavigation() {
        // Initialize navigation system
        console.log('🧭 Initializing navigation');
        
        // Setup navigation event listeners
        if (typeof setupNavigation === 'function') {
            setupNavigation();
            console.log('✅ Navigation system initialized');
        } else {
            console.error('❌ setupNavigation function not found');
        }
        
        // Setup mobile menu
        if (typeof setupMobileMenu === 'function') {
            setupMobileMenu();
        }
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
    }

    /**
     * Initialize user interface
     */
    initUserInterface() {
        // Initialize UI components
        console.log('🎨 Initializing user interface');
        
        // Update user info in header
        this.updateUserInfo();
        
        // Update UI with user data
        if (typeof updateUI === 'function') {
            console.log('🔄 Updating UI with user data');
            // Add a small delay to ensure DOM is fully loaded
            setTimeout(() => {
                try {
                    updateUI();
                } catch (error) {
                    console.error('❌ Error updating UI:', error);
                }
            }, 100);
        } else {
            console.log('⚠️ updateUI function not available');
        }
        
        // Update userData with actual user data from auth system
        if (window.authManager && window.authManager.getCurrentUser()) {
            const currentUser = window.authManager.getCurrentUser();
            console.log('👤 Updating userData with current user:', currentUser);
            if (typeof window.userData !== 'undefined') {
                window.userData = {
                    ...window.userData,
                    username: currentUser.username,
                    credits: currentUser.credits,
                    keysGenerated: currentUser.keysGenerated || 0
                };
                console.log('📊 Updated userData:', window.userData);
            }
        }
    }
    
    /**
     * Update user information in the interface
     */
    updateUserInfo() {
        if (window.authManager && window.authManager.getCurrentUser()) {
            const user = window.authManager.getCurrentUser();
            
            // Update username
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = user.username;
            }
            
            // Update credits
            const userCreditsElement = document.getElementById('user-credits');
            const totalCreditsElement = document.getElementById('total-credits');
            
            if (userCreditsElement) {
                userCreditsElement.textContent = user.credits;
            }
            if (totalCreditsElement) {
                totalCreditsElement.textContent = user.credits;
            }
            
            console.log('✅ User interface updated');
        }
    }

    /**
     * Initialize other components
     */
    initComponents() {
        // Initialize other dashboard components
        console.log('🔧 Initializing components');
        
        // Fallback navigation initialization
        setTimeout(() => {
            if (typeof setupNavigation === 'function') {
                console.log('🔄 Fallback navigation initialization');
                setupNavigation();
            }
        }, 1000);
    }
}

// Initialize when DOM is loaded (only on main pages, not login)
if (!window.location.pathname.includes('login.html') && !window.location.pathname.endsWith('/login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        new MainSystem();
        
        // Direct navigation initialization as backup
        setTimeout(() => {
            if (typeof setupNavigation === 'function') {
                console.log('🔄 Direct navigation initialization');
                setupNavigation();
            }
        }, 2000);
    });
}