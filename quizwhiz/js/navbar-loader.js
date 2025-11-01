/**
 * Navbar Component Loader
 * Handles loading and managing the modular navbar component
 */
class NavbarLoader {
    constructor() {
        this.currentPage = this.getCurrentPageName();
    }

    /**
     * Get the current page name from the URL
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'home';
    }

    /**
     * Load the navbar component into the specified container
     */
    async loadNavbar(containerId = 'navbar-container') {
        try {
            const response = await fetch('../components/navbar.html');
            if (!response.ok) {
                throw new Error(`Failed to load navbar: ${response.status}`);
            }
            
            const navbarHTML = await response.text();
            const container = document.getElementById(containerId);
            
            if (container) {
                container.innerHTML = navbarHTML;
                this.setActiveNavItem();
                this.setupNavigation();
                
                // Initialize user manager
                this.initializeUserManager();
            } else {
                console.error(`Navbar container '${containerId}' not found`);
            }
        } catch (error) {
            console.error('Error loading navbar:', error);
            // Fallback: show error message or keep existing navbar
        }
    }

    /**
     * Set the active navigation item based on current page
     */
    setActiveNavItem() {
        // Remove all active classes
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current page button
        const activeBtn = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        document.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = btn.getAttribute('data-page');
                this.navigateToPage(targetPage);
            });
        });

        // Setup mobile menu toggle
        this.setupMobileMenu();
        
        // Handle dropdown toggles
        document.addEventListener('click', (e) => {
            const dropdownToggle = e.target.closest('.dropdown-toggle');
            const userAvatar = e.target.closest('.user-avatar-btn');
            const dropdownItem = e.target.closest('.dropdown-item');
            
            if (dropdownToggle) {
                e.preventDefault();
                const dropdown = dropdownToggle.parentElement;
                dropdown.classList.toggle('active');
                
                // Close other dropdowns
                document.querySelectorAll('.nav-dropdown, .user-dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('active');
                    }
                });
                
                // On mobile, don't close the main menu when toggling dropdowns
                e.stopPropagation();
            } else if (userAvatar) {
                e.preventDefault();
                const dropdown = userAvatar.parentElement;
                dropdown.classList.toggle('active');
                
                // Close other dropdowns
                document.querySelectorAll('.nav-dropdown, .user-dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('active');
                    }
                });
            } else if (dropdownItem) {
                e.preventDefault();
                const action = dropdownItem.getAttribute('data-action');
                
                // Handle dropdown item actions
                if (action === 'edit-profile' && window.userManager) {
                    window.userManager.showProfileModal();
                } else if (action === 'export-data' && window.app && window.app.dataManager) {
                    window.app.dataManager.exportData('json');
                }
                
                // Close all dropdowns after action
                document.querySelectorAll('.nav-dropdown, .user-dropdown').forEach(d => {
                    d.classList.remove('active');
                });
            } else {
                // Close all dropdowns when clicking outside
                document.querySelectorAll('.nav-dropdown, .user-dropdown').forEach(d => {
                    d.classList.remove('active');
                });
                
                // Prevent default behavior to avoid unwanted page scrolling
                // Only prevent default if the click target is not an interactive element
                // and if it's not within a settings-group or other content areas
                const isInteractiveElement = e.target.closest('button, input, select, textarea, a[href], [tabindex], [contenteditable="true"], .setting-item, .settings-group, .content-section');
                if (!isInteractiveElement) {
                    e.preventDefault();
                }
             }
        });
    }
    
    initializeUserManager() {
        // Load user manager script if not already loaded
        if (typeof UserManager === 'undefined') {
            const script = document.createElement('script');
            script.src = '../js/user-manager.js';
            script.onload = () => {
                window.userManager = new UserManager();
            };
            document.head.appendChild(script);
        } else {
            window.userManager = new UserManager();
        }
        
        // Load user profile CSS if not already loaded
        if (!document.querySelector('link[href*="user-profile.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../css/user-profile.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Setup mobile hamburger menu functionality
     */
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle active classes
                mobileMenuToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                
                // Update aria-expanded for accessibility
                const isExpanded = navMenu.classList.contains('active');
                mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
            });
            
            // Close mobile menu when clicking on nav items (but not dropdown toggles)
            navMenu.addEventListener('click', (e) => {
                const navBtn = e.target.closest('.nav-btn');
                if (navBtn && !navBtn.classList.contains('dropdown-toggle') && navBtn.hasAttribute('data-page')) {
                    // Close mobile menu when navigating to a page
                    mobileMenuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    mobileMenuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    mobileMenuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    /**
     * Navigate to a specific page
     */
    navigateToPage(pageName) {
        if (pageName === this.currentPage) {
            return; // Already on this page
        }

        const targetUrl = `${pageName}.html`;
        window.location.href = targetUrl;
    }

    /**
     * Initialize the navbar loader
     */
    static async init(containerId = 'navbar-container') {
        const loader = new NavbarLoader();
        await loader.loadNavbar(containerId);
        return loader;
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    NavbarLoader.init();
});

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavbarLoader;
}
if (typeof window !== 'undefined') {
    window.NavbarLoader = NavbarLoader;
}