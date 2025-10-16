/**
 * Footer Loader Module
 * Handles loading and initialization of the global footer component
 */

class FooterLoader {
    constructor() {
        this.footerContainer = null;
        this.isLoaded = false;
    }

    /**
     * Initialize the footer loader
     */
    async init() {
        try {
            await this.loadFooter();
            this.setupFooter();
            this.isLoaded = true;
            window.debugLog?.info('footerLoader', 'Footer loaded successfully');
        } catch (error) {
            window.debugLog?.error('footerLoader', 'Error loading footer:', error);
        }
    }

    /**
     * Load the footer HTML component
     */
    async loadFooter() {
        try {
            const response = await fetch('../components/footer.html');
            if (!response.ok) {
                throw new Error(`Failed to load footer: ${response.status}`);
            }
            
            const footerHTML = await response.text();
            
            // Create footer container if it doesn't exist
            this.footerContainer = document.getElementById('footer-container');
            if (!this.footerContainer) {
                this.footerContainer = document.createElement('div');
                this.footerContainer.id = 'footer-container';
                document.body.appendChild(this.footerContainer);
            }
            
            // Insert footer HTML
            this.footerContainer.innerHTML = footerHTML;
            
        } catch (error) {
            window.debugLog?.error('footerLoader', 'Error loading footer HTML:', error);
            throw error;
        }
    }

    /**
     * Setup footer functionality
     */
    setupFooter() {
        this.updateCurrentYear();
        this.updateAppVersion();
    }

    /**
     * Update the current year in the footer
     */
    updateCurrentYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    /**
     * Update the app version from main.js
     */
    updateAppVersion() {
        const versionElement = document.getElementById('app-version');
        
        if (versionElement) {
            // Try to get version from window.APP_VERSION first
            if (window.APP_VERSION) {
                versionElement.textContent = window.APP_VERSION;
            } else if (window.app && window.app.version) {
                // Fallback to app instance version
                versionElement.textContent = window.app.version;
            } else {
                // If neither is available, try multiple times with increasing delays
                let attempts = 0;
                const maxAttempts = 5;
                
                const tryUpdate = () => {
                    attempts++;
                    if (window.APP_VERSION) {
                        versionElement.textContent = window.APP_VERSION;
                    } else if (window.app && window.app.version) {
                        versionElement.textContent = window.app.version;
                    } else if (attempts < maxAttempts) {
                        setTimeout(tryUpdate, attempts * 100);
                    } else {
                        // Fallback to hardcoded version if all else fails
                        versionElement.textContent = '3.8';
                    }
                };
                
                setTimeout(tryUpdate, 100);
            }
        }
    }

    /**
     * Refresh footer data (useful for dynamic updates)
     */
    refresh() {
        if (this.isLoaded) {
            this.updateCurrentYear();
            this.updateAppVersion();
        }
    }

    /**
     * Force update the app version (useful when app is initialized after footer)
     */
    refreshVersion() {
        this.updateAppVersion();
    }

    /**
     * Get footer container element
     */
    getContainer() {
        return this.footerContainer;
    }

    /**
     * Check if footer is loaded
     */
    getLoadStatus() {
        return this.isLoaded;
    }
}

// Create and export footer loader instance
const footerLoader = new FooterLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => footerLoader.init());
} else {
    footerLoader.init();
}

// Export for external use
window.footerLoader = footerLoader;