/**
 * Global Debug Configuration
 * Controls verbose logging throughout the QuizWhiz application
 */

// Global debug configuration object
window.DEBUG_CONFIG = {
    // Master debug flag - controls all debug output
    enabled: true,
    
    // Specific module debug flags
    modules: {
        supabase: true,        // Supabase authentication and data operations
        dataManager: true,     // Data loading and management
        unifiedDataManager: true, // Unified data manager for import/export
        navbar: true,          // Navigation bar operations
        auth: true,           // Authentication operations
        modals: true,         // Modal operations
        initialization: true,  // App initialization
        api: true,            // API calls and responses
        ui: true,             // UI interactions and updates
        theme: true           // Theme management and switching
    },
    
    // Debug levels
    levels: {
        info: true,
        warn: true,
        error: true,
        debug: false,
        verbose: false
    }
};

// Helper function to check if debug is enabled for a specific module
window.isDebugEnabled = function(module = null) {
    if (!window.DEBUG_CONFIG.enabled) return false;
    if (!module) return true;
    return window.DEBUG_CONFIG.modules[module] || false;
};

// Enhanced console logging functions
window.debugLog = {
    info: function(module, message, ...args) {
        if (window.isDebugEnabled(module) && window.DEBUG_CONFIG.levels.info) {
            console.log(`[${module.toUpperCase()}] ${message}`, ...args);
        }
    },
    
    warn: function(module, message, ...args) {
        if (window.isDebugEnabled(module) && window.DEBUG_CONFIG.levels.warn) {
            console.warn(`[${module.toUpperCase()}] ${message}`, ...args);
        }
    },
    
    error: function(module, message, ...args) {
        if (window.isDebugEnabled(module) && window.DEBUG_CONFIG.levels.error) {
            console.error(`[${module.toUpperCase()}] ${message}`, ...args);
        }
    },
    
    debug: function(module, message, ...args) {
        if (window.isDebugEnabled(module) && window.DEBUG_CONFIG.levels.debug) {
            console.log(`[DEBUG][${module.toUpperCase()}] ${message}`, ...args);
        }
    },
    
    verbose: function(module, message, ...args) {
        if (window.isDebugEnabled(module) && window.DEBUG_CONFIG.levels.verbose) {
            console.log(`[VERBOSE][${module.toUpperCase()}] ${message}`, ...args);
        }
    }
};

// Quick enable/disable functions for development
window.enableDebug = function(module = null) {
    window.DEBUG_CONFIG.enabled = true;
    if (module) {
        window.DEBUG_CONFIG.modules[module] = true;
        console.log(`Debug enabled for module: ${module}`);
    } else {
        Object.keys(window.DEBUG_CONFIG.modules).forEach(key => {
            window.DEBUG_CONFIG.modules[key] = true;
        });
        console.log('Debug enabled for all modules');
    }
};

window.disableDebug = function(module = null) {
    if (module) {
        window.DEBUG_CONFIG.modules[module] = false;
        console.log(`Debug disabled for module: ${module}`);
    } else {
        window.DEBUG_CONFIG.enabled = false;
        console.log('Debug disabled globally');
    }
};

// Development helper - uncomment to enable debug mode
// window.enableDebug();

console.log('Debug configuration loaded');