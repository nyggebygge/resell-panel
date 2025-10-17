// Production-ready logging system
class Logger {
    constructor() {
        this.isDebug = window.CONFIG?.DEV?.DEBUG_MODE || false;
        this.logLevel = this.isDebug ? 'debug' : 'error';
    }

    debug(message, ...args) {
        if (this.isDebug) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.isDebug) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    }

    // Production-safe logging
    log(message, ...args) {
        if (this.isDebug) {
            console.log(message, ...args);
        }
    }
}

// Create global logger instance
window.logger = new Logger();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
