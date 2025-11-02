/**
 * Auth Manager - Compatibility layer for authentication system
 * This file provides a compatibility layer for any legacy references to auth-manager.js
 * The actual authentication is handled by UserManager and ThemeManager.setupAuthGuards()
 */

class AuthManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Initialize compatibility layer
        this.isInitialized = true;
        console.log('AuthManager compatibility layer initialized');
    }

    /**
     * Check if user is authenticated
     * Delegates to the existing localStorage-based authentication
     */
    isAuthenticated() {
        const userData = localStorage.getItem('quizwhiz_user');
        return userData !== null;
    }

    /**
     * Get current user data
     * Delegates to the existing UserManager system
     */
    getCurrentUser() {
        const userData = localStorage.getItem('quizwhiz_user');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Setup authentication guards
     * Delegates to ThemeManager.setupAuthGuards()
     */
    setupAuthGuards() {
        if (window.themeManager && typeof window.themeManager.setupAuthGuards === 'function') {
            window.themeManager.setupAuthGuards();
        }
    }

    /**
     * Compatibility method for any legacy code
     */
    checkAuthState() {
        return this.isAuthenticated();
    }
}

// Initialize global instance for compatibility
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
    window.authManager = new AuthManager();
}

// Module export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}