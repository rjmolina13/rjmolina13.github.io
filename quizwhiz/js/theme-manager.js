/**
 * Theme Manager - Handles theme switching and authentication guards for settings page
 * Uses local storage authentication via UserManager system
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'auto';
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupAuthGuards();
        this.setupThemeSelector();
        this.setupEventListeners();
    }

    /**
     * Load theme from localStorage
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('qw_theme') || 'auto';
        this.currentTheme = savedTheme;
        this.applyTheme(savedTheme);
    }

    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const effectiveTheme = prefersDark ? 'dark' : 'light';
            root.dataset.theme = effectiveTheme;
            root.classList.remove('theme-light', 'theme-dark');
            root.classList.add(effectiveTheme === 'dark' ? 'theme-dark' : 'theme-light');
        } else {
            root.dataset.theme = theme;
            root.classList.remove('theme-light', 'theme-dark');
            root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
        }
    }

    /**
     * Change theme and save to localStorage
     */
    changeTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('qw_theme', theme);
        this.applyTheme(theme);
        this.updateThemeSelector(theme);
    }

    /**
     * Setup authentication guards - show/hide sections based on user authentication
     */
    setupAuthGuards() {
        // Check if user exists in localStorage (UserManager system)
        const userData = localStorage.getItem('quizwhiz_user');
        const isAuthenticated = userData !== null;

        // Get all elements with auth-required class
        const authRequiredElements = document.querySelectorAll('.auth-required');
        
        authRequiredElements.forEach(element => {
            if (isAuthenticated) {
                // User is authenticated - show the section
                element.classList.remove('auth-hidden', 'auth-loading');
                element.classList.add('auth-visible');
            } else {
                // User is not authenticated - hide the section
                element.classList.remove('auth-visible', 'auth-loading');
                element.classList.add('auth-hidden');
            }
        });

        // Listen for storage changes to update auth state in real-time
        window.addEventListener('storage', (e) => {
            if (e.key === 'quizwhiz_user') {
                this.setupAuthGuards();
            }
        });
    }

    /**
     * Setup theme selector dropdown
     */
    setupThemeSelector() {
        const container = document.getElementById('theme-selector-container');
        if (!container) return;

        const button = container.querySelector('.select-button');
        const dropdown = container.querySelector('.select-dropdown');
        const options = container.querySelectorAll('.select-option');

        if (!button || !dropdown || !options.length) return;

        // Update initial selection
        this.updateThemeSelector(this.currentTheme);

        // Toggle dropdown
        button.addEventListener('click', () => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', !isExpanded);
            dropdown.classList.toggle('hidden');
        });

        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                this.changeTheme(value);
                
                // Close dropdown
                button.setAttribute('aria-expanded', 'false');
                dropdown.classList.add('hidden');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                button.setAttribute('aria-expanded', 'false');
                dropdown.classList.add('hidden');
            }
        });
    }

    /**
     * Update theme selector to reflect current theme
     */
    updateThemeSelector(theme) {
        const container = document.getElementById('theme-selector-container');
        if (!container) return;

        const selectedValue = container.querySelector('.selected-value');
        const options = container.querySelectorAll('.select-option');

        // Update selected value display
        if (selectedValue) {
            const themeConfig = {
                light: { icon: 'fas fa-sun', label: 'Light' },
                dark: { icon: 'fas fa-moon', label: 'Dark' },
                auto: { icon: 'fas fa-adjust', label: 'Auto' }
            };

            const config = themeConfig[theme] || themeConfig.auto;
            selectedValue.innerHTML = `
                <i class="${config.icon}"></i>
                ${config.label}
            `;
        }

        // Update option selection states
        options.forEach(option => {
            if (option.dataset.value === theme) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });

        // Listen for user authentication changes
        window.addEventListener('userAuthenticated', () => {
            this.setupAuthGuards();
        });

        window.addEventListener('userLoggedOut', () => {
            this.setupAuthGuards();
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return localStorage.getItem('quizwhiz_user') !== null;
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
}