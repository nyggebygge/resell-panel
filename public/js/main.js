// Main application initialization
// Initialize the application with all enhancements
function init() {
    // Wait for authentication to be ready
    setTimeout(() => {
        checkAuthentication();
    }, 100);
}

async function checkAuthentication() {
    // Check authentication after a brief delay to ensure authManager is ready
    if (!window.authManager || !window.authManager.getIsLoggedIn()) {
        window.logger.debug('Not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    window.logger.debug('Authentication successful, initializing dashboard');
    await initializeDashboard();
}

async function initializeDashboard() {
    
    // Initialize animated background
    initAnimatedBackground();
    
    // Load user data and setup
    await loadUserData();
    setupNavigation();
    setupMobileMenu();
    checkAdminAccess();
    setupThemeToggle();
    createNotificationContainer();
    
    // Initialize batch manager
    if (window.batchManager) {
        window.batchManager.loadBatches();
    }
    
    // Add visual effects
    addTiltEffect();
    addMagneticEffect();
    addRippleEffect();
    
    // Setup event listeners
    const transactionsNav = document.querySelector('a[href="#transactions"]');
    transactionsNav.addEventListener('click', () => {
        setTimeout(loadTransactions, 100);
    });
    
    // Setup My Keys navigation
    const myKeysNav = document.querySelector('a[href="#my-keys"]');
    if (myKeysNav) {
        myKeysNav.addEventListener('click', () => {
            setTimeout(() => {
                if (window.batchManager) {
                    window.batchManager.loadBatches();
                }
            }, 100);
        });
    }
    
    // Setup Admin button
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }
    
    window.addEventListener('resize', handleResize);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !menuBtn?.contains(e.target)) {
            sidebar.classList.remove('open');
            
            if (menuBtn) {
                menuBtn.querySelector('i').className = 'fas fa-bars';
                menuBtn.style.transform = 'rotate(0deg)';
            }
        }
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        .ripple-animation {
            animation: ripple 0.6s linear;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .transaction-item {
            animation: slideInUp 0.5s ease forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        
        @keyframes slideInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Check admin access and show/hide admin section
function checkAdminAccess() {
    console.log('🔍 Checking admin access...');
    try {
        // Check if user is admin
        if (window.api && window.api.isAuthenticated()) {
            console.log('✅ User is authenticated, checking profile...');
            window.api.getProfile().then(response => {
                console.log('📊 Profile response:', response);
                if (response && response.success) {
                    const user = response.data.user;
                    const adminSection = document.getElementById('admin-section');
                    const adminBtn = document.getElementById('admin-btn');
                    
                    console.log('👤 User data:', user);
                    console.log('🔑 User role:', user.role);
                    
                    if (user.role === 'admin') {
                        // Show admin section in sidebar
                        if (adminSection) {
                            adminSection.style.display = 'block';
                            console.log('✅ Admin section shown');
                        }
                        // Show admin button in header
                        if (adminBtn) {
                            adminBtn.style.display = 'flex';
                            console.log('✅ Admin button shown');
                        }
                        console.log('🎉 Admin access granted - showing admin controls');
                    } else {
                        // Hide admin section in sidebar
                        if (adminSection) {
                            adminSection.style.display = 'none';
                        }
                        // Hide admin button in header
                        if (adminBtn) {
                            adminBtn.style.display = 'none';
                        }
                        console.log('❌ User is not admin, hiding admin controls');
                    }
                } else {
                    console.log('❌ Profile response failed:', response);
                }
            }).catch(error => {
                console.log('❌ Could not check admin access:', error);
                const adminSection = document.getElementById('admin-section');
                const adminBtn = document.getElementById('admin-btn');
                if (adminSection) {
                    adminSection.style.display = 'none';
                }
                if (adminBtn) {
                    adminBtn.style.display = 'none';
                }
            });
        } else {
            console.log('❌ User is not authenticated');
            const adminSection = document.getElementById('admin-section');
            const adminBtn = document.getElementById('admin-btn');
            if (adminSection) {
                adminSection.style.display = 'none';
            }
            if (adminBtn) {
                adminBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.log('❌ Error checking admin access:', error);
        const adminSection = document.getElementById('admin-section');
        const adminBtn = document.getElementById('admin-btn');
        if (adminSection) {
            adminSection.style.display = 'none';
        }
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
    }
}

// Debug functions removed for production

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
