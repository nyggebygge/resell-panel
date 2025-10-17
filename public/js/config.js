// Application Configuration
const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: '/api', // Railway will serve from same domain
        TIMEOUT: 10000
    },
    
    // Frontend Configuration
    FRONTEND: {
        PORT: 3000,
        URL: 'http://localhost:3000'
    },
    
    // Backend Configuration
    BACKEND: {
        PORT: 3001,
        URL: 'http://localhost:3001'
    },
    
    // Key Configuration
    KEYS: {
        NEW_KEY_THRESHOLD: 5 * 60 * 1000, // 5 minutes in milliseconds
        BATCH_SIZE: 100,
        GENERATION_PREFIX: 'GEN',
        KEY_LENGTH: 16,
        KEY_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        KEY_FORMAT: 'XXXX-XXXX-XXXX-XXXX', // Optional: for formatted keys
    DEMO_KEYS: {
        ENABLED: false, // Disable demo keys - use backend API instead
        PREFIX: 'DEMO-KEY',
        COUNT: 2
    }
    },
    
    // UI Configuration
    UI: {
        NOTIFICATION_DURATION: 3000,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500
    },
    
    // Date Configuration
    DATE: {
        FORMAT: 'YYYY-MM-DD',
        LOCALE: 'en-US',
        TIMEZONE: 'local'
    },
    
    // Development Configuration
    DEV: {
        DEFAULT_EMAIL: 'test@example.com',
        DEFAULT_PASSWORD: 'password123',
        DEBUG_MODE: false
    },
    
    // Stripe Configuration
    STRIPE: {
        PUBLISHABLE_KEY: 'pk_live_51PxwPBI64jb3mEnWxbWnCS4PYjiXaPFIEPOTuyC7zSIIGTSWo0Tm5dseh6px3b0EvKZWGBXBfKjQXQTejcCH5IOo00JK0TcyEz', // Replace with your actual publishable key
        CURRENCY: 'usd',
        COUNTRY: 'US'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
