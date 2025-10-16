class Router {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.navigateTo(event.state.page, false);
            }
        });

        // Set initial page state
        const initialPage = this.getCurrentPageFromURL();
        history.replaceState({ page: initialPage }, '', window.location.href);
        this.currentPage = initialPage;
        this.updatePageTitle(initialPage);
        
        // Setup navigation event listeners
        this.setupNavigationListeners();
    }

    getCurrentPageFromURL() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '');
        return pageName || 'home';
    }

    navigateTo(page, addToHistory = true) {
        if (page === this.currentPage) return;

        // Determine the correct path based on current location
        let pageUrl;
        if (window.location.pathname.includes('/pages/')) {
            pageUrl = `${page}.html`;
        } else {
            pageUrl = `pages/${page}.html`;
        }
        
        if (addToHistory) {
            history.pushState({ page }, '', pageUrl);
        }
        
        this.currentPage = page;
        this.updatePageTitle(page);
        
        // Check if we have a QuizWhizApp instance for SPA navigation
        if (window.app && typeof window.app.loadPageContent === 'function') {
            // Use SPA navigation to avoid page reload and preserve auth state
            console.log(`🔄 SPA Navigation to ${page} (preserving auth state)`);
            
            // Load page content first, then initialize page functionality
            window.app.loadPageContent(page).then(() => {
                // After content is loaded, initialize the page
                return window.app.initializePage(page);
            }).then(() => {
                console.log(`✅ SPA navigation to ${page} completed`);
            }).catch(error => {
                console.error('SPA navigation failed, falling back to hard navigation:', error);
                window.location.href = pageUrl;
            });
        } else {
            // Fallback to hard navigation if app is not available
            console.log(`🔄 Hard navigation to ${page} (app not available)`);
            window.location.href = pageUrl;
        }
    }

    setupNavigationListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attachNavigationEvents();
            });
        } else {
            this.attachNavigationEvents();
        }
    }

    attachNavigationEvents() {
        // Attach click listeners to navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn[data-section]');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.getAttribute('data-section');
                this.navigateTo(section);
            });
        });

        // Handle dropdown navigation
        const dropdownButtons = document.querySelectorAll('.nav-btn[data-section]');
        dropdownButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.getAttribute('data-section');
                if (section) {
                    this.navigateTo(section);
                }
            });
        });
    }

    updatePageTitle(page) {
        const titles = {
            home: 'QuizWhiz - Smart Study Companion',
            flashcards: 'Flashcards - QuizWhiz',
            quiz: 'Quiz - QuizWhiz',
            mixed: 'Mixed Study Mode - QuizWhiz',
            content: 'Content - QuizWhiz',
            settings: 'Settings - QuizWhiz',
            about: 'About - QuizWhiz'
        };
        
        document.title = titles[page] || 'QuizWhiz';
    }

    // Method to be called by navigation buttons and app
    showSection(sectionName) {
        this.navigateTo(sectionName);
    }

    // Update navigation active state
    updateNavigation(activeSection) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === activeSection) {
                btn.classList.add('active');
            }
        });
    }
}

// Create global router instance
window.router = new Router();

// Make router available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.showSection = (section) => window.router.showSection(section);
}

// No module exports, only use window object
window.Router = Router;