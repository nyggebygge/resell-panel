// Navigation functionality
// Enhanced navigation with smooth transitions
function showSection(sectionId) {
    const currentSection = document.querySelector('.section.active');
    const targetSection = document.getElementById(sectionId);
    
    if (currentSection === targetSection) return;
    
    // Fade out current section
    if (currentSection) {
        currentSection.style.opacity = '0';
        currentSection.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            currentSection.classList.remove('active');
            currentSection.style.opacity = '';
            currentSection.style.transform = '';
        }, 300);
    }
    
    // Fade in target section
    setTimeout(() => {
        targetSection.classList.add('active');
        targetSection.style.opacity = '0';
        targetSection.style.transform = 'translateY(20px)';
        
        // Trigger reflow
        targetSection.offsetHeight;
        
        targetSection.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        targetSection.style.opacity = '1';
        targetSection.style.transform = 'translateY(0)';
        
        // Reset transition after animation
        setTimeout(() => {
            targetSection.style.transition = '';
        }, 500);
    }, currentSection ? 150 : 0);
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Update breadcrumb with glow effect
    const breadcrumb = document.querySelector('.breadcrumb .current');
    breadcrumb.style.opacity = '0';
    
    setTimeout(() => {
        switch(sectionId) {
            case 'dashboard-section':
                breadcrumb.textContent = 'General';
                document.querySelector('a[href="#dashboard"]').parentElement.classList.add('active');
                break;
            case 'credits-section':
                breadcrumb.textContent = 'Credits';
                document.querySelector('a[href="#credits"]').parentElement.classList.add('active');
                break;
            case 'transactions-section':
                breadcrumb.textContent = 'Transactions';
                document.querySelector('a[href="#transactions"]').parentElement.classList.add('active');
                break;
            case 'store-section':
                breadcrumb.textContent = 'Store';
                document.querySelector('a[href="#store"]').parentElement.classList.add('active');
                break;
            case 'my-keys-section':
                breadcrumb.textContent = 'My Keys';
                document.querySelector('a[href="#my-keys"]').parentElement.classList.add('active');
                break;
        }
        
        breadcrumb.style.transition = 'opacity 0.3s ease';
        breadcrumb.style.opacity = '1';
    }, 200);
}

// Handle navigation clicks with enhanced effects
function setupNavigation() {
    console.log('🔧 Setting up navigation...');
    
    const navLinks = document.querySelectorAll('.nav-item a');
    console.log(`📊 Found ${navLinks.length} navigation links`);
    
    navLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        console.log(`🔗 Link ${index + 1}: ${href}`);
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`🖱️ Navigation clicked: ${href}`);
            
            // Add click effect
            link.style.transform = 'translateX(10px) scale(0.95)';
            setTimeout(() => {
                link.style.transform = '';
            }, 150);
            
            switch(href) {
                case '#dashboard':
                    console.log('📊 Navigating to dashboard');
                    showSection('dashboard-section');
                    break;
                case '#credits':
                    console.log('💰 Navigating to credits');
                    showSection('credits-section');
                    break;
                case '#transactions':
                    console.log('📋 Navigating to transactions');
                    showSection('transactions-section');
                    break;
                case '#store':
                    console.log('🏪 Navigating to store');
                    showSection('store-section');
                    if (typeof loadStore === 'function') {
                        loadStore();
                    }
                    break;
                case '#my-keys':
                    console.log('🔑 Navigating to my keys');
                    showSection('my-keys-section');
                    if (typeof loadMyKeys === 'function') {
                        loadMyKeys();
                    }
                    break;
                case 'admin.html':
                    console.log('🛡️ Navigating to admin');
                    // Navigate to admin dashboard
                    window.location.href = 'admin.html';
                    break;
                default:
                    console.log(`❓ Unknown navigation: ${href}`);
            }
        });
    });
    
    console.log('✅ Navigation setup complete');
}

// Enhanced mobile menu
function setupMobileMenu() {
    if (window.innerWidth <= 768) {
        const header = document.querySelector('.header');
        let menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (!menuBtn) {
            menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            menuBtn.style.cssText = `
                background: none;
                border: none;
                color: #00d4ff;
                font-size: 20px;
                cursor: pointer;
                display: block;
                transition: transform 0.3s ease;
            `;
            
            menuBtn.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('open');
                
                // Animate menu icon
                const icon = menuBtn.querySelector('i');
                if (sidebar.classList.contains('open')) {
                    icon.className = 'fas fa-times';
                    menuBtn.style.transform = 'rotate(180deg)';
                } else {
                    icon.className = 'fas fa-bars';
                    menuBtn.style.transform = 'rotate(0deg)';
                }
            });
            
            header.insertBefore(menuBtn, header.firstChild);
        }
    }
}

// Handle window resize
function handleResize() {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('open');
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.remove();
        }
    } else {
        setupMobileMenu();
    }
}

// Export functions
window.showSection = showSection;
window.setupNavigation = setupNavigation;
window.setupMobileMenu = setupMobileMenu;
window.handleResize = handleResize;
