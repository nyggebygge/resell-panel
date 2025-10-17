// Visual effects and animations
// Initialize animated background
function initAnimatedBackground() {
    canvas = document.getElementById('background-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create particles
    function createParticles() {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                color: Math.random() > 0.5 ? '#00d4ff' : '#0099cc'
            });
        }
    }
    
    // Animate particles
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
            ctx.fill();
            
            // Draw connections to nearby particles
            particles.slice(index + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });
        
        animationFrameId = requestAnimationFrame(animateParticles);
    }
    
    createParticles();
    animateParticles();
}

// Enhanced tilt effect
function addTiltEffect() {
    const tiltElements = document.querySelectorAll('[data-tilt]');
    
    tiltElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / centerY * -10;
            const rotateY = (x - centerX) / centerX * 10;
            
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}

// Magnetic button effect
function addMagneticEffect() {
    const magneticElements = document.querySelectorAll('.magnetic-btn');
    
    magneticElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) translateY(-3px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate(0px, 0px) translateY(0px)';
        });
    });
}

// Ripple effect for buttons
function addRippleEffect() {
    const rippleButtons = document.querySelectorAll('.magnetic-btn');
    
    rippleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const ripple = button.querySelector('.btn-ripple');
            if (ripple) {
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                ripple.classList.add('ripple-animation');
                
                setTimeout(() => {
                    ripple.classList.remove('ripple-animation');
                }, 600);
            }
        });
    });
}

// Theme Toggle Functionality
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Apply saved theme
    if (userData.theme === 'light') {
        body.classList.add('light-theme');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        
        // Update icon with animation
        const icon = themeToggle.querySelector('i');
        icon.style.transform = 'scale(0)';
        
        setTimeout(() => {
            icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
            icon.style.transform = 'scale(1)';
        }, 150);
        
        // Save theme preference
        userData.theme = isLight ? 'light' : 'dark';
        saveUserData();
        
        // Show notification
        showNotification(
            'Theme Changed',
            `Switched to ${isLight ? 'light' : 'dark'} mode`,
            'info'
        );
    });
}

// Export functions
window.initAnimatedBackground = initAnimatedBackground;
window.addTiltEffect = addTiltEffect;
window.addMagneticEffect = addMagneticEffect;
window.addRippleEffect = addRippleEffect;
window.setupThemeToggle = setupThemeToggle;
