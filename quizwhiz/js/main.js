// Main Application Entry Point

// Global app instance will be set by QuizWhizApp constructor

// Initialize the QuizWhiz Application
class QuizWhizApp {
    constructor() {
        // App version information
        this.version = "4.6";
        this.lastUpdated = "2025-10-16";
        
        // Expose version globally for footer
        window.APP_VERSION = this.version;
        
        this.flashcards = [];
        this.quizzes = [];
        this.currentCardIndex = 0;
        this.currentDeck = 'all';
        this.isCardFlipped = false;
        this.quizState = {
            active: false,
            questions: [],
            currentQuestion: 0,
            score: 0,
            answers: []
        };
        this.settings = {
            theme: 'auto',
            animations: true,
            autoFlip: 0,
            shuffleDefault: false,
            difficultyFeature: false
        };
        this.stats = {
            totalFlashcards: 0,
            bestScore: 0,
            studyStreak: 0
        };
        this.mixedSession = {
            active: false,
            items: [],
            currentIndex: 0,
            startTime: null,
            duration: 15, // minutes
            flashcardRatio: 50, // percentage
            score: 0,
            totalAnswered: 0,
            flashcardsReviewed: 0,
            quizQuestionsAnswered: 0,
            mistakes: [],
            timer: null
        };
        
        // Initialize managers
        this.dataManager = new UnifiedDataManager(this);
        this.flashcardManager = new FlashcardManager(this);
        this.quizManager = new QuizManager(this);
        this.mixedManager = new MixedManager(this);
        this.contentManager = new ContentManager(this);
        this.uiManager = new UIManager(this);
        // UserManager functionality is now integrated into UnifiedDataManager
        
        // Initialize AuthManager immediately since scripts load synchronously now
        this.authManager = null;
        this.initAuthManager();
        
        this.eventHandler = new EventHandler(this);
        
        // Track current page for cleanup
        this.currentPage = null;
        
        // Set global app reference
        window.app = this;
        
        // Initialize asynchronously
        this.init().catch(error => {
            window.debugLog?.error('initialization', 'App initialization failed:', error);
        });
    }

    async initAuthManager() {
        if (window.AuthManager && !this.authManager) {
            window.debugLog?.info('initialization', 'Initializing AuthManager...');
            this.authManager = new window.AuthManager(this);
            
            // Wait for both initialization and ready promise
            await this.authManager.initialize();
            await this.authManager.ready;
            
            window.debugLog?.info('initialization', 'AuthManager initialization and session restoration completed');
        } else if (!window.AuthManager) {
            window.debugLog?.info('initialization', 'AuthManager not available yet, retrying...');
            setTimeout(() => this.initAuthManager(), 100);
        }
    }

    async init() {
        window.debugLog?.info('initialization', 'QuizWhizApp init started');
        
        // Theme initialization is handled by theme-manager.js to avoid conflicts
        // Commenting out UIManager theme initialization
        // console.log('THEME DEBUG: About to call initializeTheme, uiManager exists:', !!this.uiManager);
        // try {
        //     this.uiManager.initializeTheme();
        //     console.log('THEME DEBUG: initializeTheme call completed');
        // } catch (error) {
        //     console.error('THEME DEBUG: Error calling initializeTheme:', error);
        // }
        
        // AuthManager is already fully initialized in initAuthManager()
        // No need to wait again since we await both initialize() and ready
        window.debugLog?.info('initialization', 'AuthManager already ready, proceeding with initialization...');
        
        // Initialize Supabase authentication first
        const waitForSupabase = () => {
            if (typeof window.supabaseClient !== 'undefined') {
                window.debugLog?.info('initialization', 'Supabase ready, loading data...');
                
                // Attach supabaseDataService to app object when available
                if (window.supabaseDataService) {
                    this.supabaseDataService = window.supabaseDataService;
                    window.debugLog?.info('initialization', 'SupabaseDataService attached to app');
                } else {
                    // Wait for supabaseDataService to be available
                    const waitForDataService = () => {
                        if (window.supabaseDataService) {
                            this.supabaseDataService = window.supabaseDataService;
                            window.debugLog?.info('initialization', 'SupabaseDataService attached to app (delayed)');
                        } else {
                            setTimeout(waitForDataService, 50);
                        }
                    };
                    waitForDataService();
                }
                
                this.dataManager.loadData();
                
                // Supabase-ready event is already dispatched by supabase-config.js
            } else {
                setTimeout(waitForSupabase, 50);
            }
        };
        
        waitForSupabase();
        
        // Get current page from router if available
        const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
        
        // Initialize the current page
        await this.initializePage(currentPage);
        
        this.updateUI();
        this.updateVersionInfo();
    }
    
    async initializePage(pageName) {
        // Cleanup previous page if switching pages
        if (this.currentPage && this.currentPage !== pageName) {
            this.cleanupPage(this.currentPage);
        }
        
        // Update current page
        this.currentPage = pageName;
        
        // Load navbar for all pages first
        await this.loadNavbar();
        
        // Initialize specific functionality based on the current page
        switch(pageName) {
            case 'flashcards':
                this.flashcardManager.initializeFlashcards();
                break;
            case 'quiz':
                this.quizManager.initializeQuiz();
                break;
            case 'mixed':
                this.mixedManager.initializeMixed();
                break;
            case 'content':
                this.contentManager.initializeContent();
                break;
            case 'settings':
                this.initializeSettingsPage();
                break;
            case 'about':
                this.initializeAboutPage();
                break;
            default:
                // Home page or fallback
                await this.initializeHomePage();
                break;
        }
        
        // Update navigation to show current page as active
        if (window.router) {
            window.router.updateNavigation(pageName);
        }
        
        // Ensure auth UI is updated after page load
        if (this.authManager && this.authManager.updateAuthUI) {
            setTimeout(() => {
                this.authManager.updateAuthUI();
                console.log('🔧 Auth UI updated after SPA navigation');
            }, 100);
        }
    }
    
    cleanupPage(pageName) {
        // Cleanup specific functionality when leaving a page
        switch(pageName) {
            case 'quiz':
                if (this.quizManager && typeof this.quizManager.cleanup === 'function') {
                    this.quizManager.cleanup();
                }
                break;
            case 'mixed':
                if (this.mixedManager && typeof this.mixedManager.cleanup === 'function') {
                    this.mixedManager.cleanup();
                }
                break;
            // Add other page cleanups as needed
        }
    }
    
    async initializeHomePage() {
        // Initialize home page specific functionality
        // NavbarLoader handles auth button setup automatically
        // No need to call setupAuthButtons() again here
        
        this.updateStats();
    }
    
    initializeContentPage() {
        // Initialize content management page
        if (this.flashcardManager.refreshFlashcardList) {
            this.flashcardManager.refreshFlashcardList();
        }
    }
    
    initializeSettingsPage() {
        // Initialize settings page
        this.uiManager.loadSettingsUI();
        this.updateUI(); // Update storage info and other UI elements
    }
    
    initializeAboutPage() {
        // Initialize about page
        this.updateVersionInfo();
    }
    
    updateStats() {
        // Update statistics on home page
        this.stats.totalFlashcards = this.flashcards.length;
        this.uiManager.updateStats();
    }
    
    // Helper method to ensure page-specific CSS is loaded during SPA navigation
    _ensurePageStyles(doc) {
        const head = document.head;
        const newLinks = doc.querySelectorAll('link[rel="stylesheet"]');
        
        newLinks.forEach(newLink => {
            const href = newLink.getAttribute('href');
            if (href && !head.querySelector(`link[href="${href}"]`)) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = href;
                head.appendChild(linkElement);
                console.log(`📎 Added CSS: ${href}`);
            }
        });
    }
    
    // Helper method to re-apply theme on SPA loads
    _applyThemeFromLocal() {
        try {
            const savedTheme = localStorage.getItem('quizwhiz_theme') || 'auto';
            document.documentElement.setAttribute('data-theme', savedTheme);
            console.log(`🎨 Applied theme: ${savedTheme}`);
        } catch (error) {
            console.warn('Failed to apply theme:', error);
        }
    }
    
    async loadPageContent(pageName) {
        // For SPA navigation, we need to load the page content dynamically
        const mainContent = document.querySelector('main') || document.body;
        
        try {
            // Determine the correct page path
            let pageUrl;
            if (window.location.pathname.includes('/pages/')) {
                pageUrl = `${pageName}.html`;
            } else {
                pageUrl = `pages/${pageName}.html`;
            }
            
            // Load content for SPA navigation when navigating to a different page
            // This includes first navigation (when currentPage is null) and subsequent navigations
            if (this.currentPage !== pageName) {
                console.log(`📄 Loading content for ${pageName} via SPA`);
                
                const response = await fetch(pageUrl);
                if (response.ok) {
                    const html = await response.text();
                    
                    // Parse the HTML and extract the main content
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newMain = doc.querySelector('main');
                    
                    if (newMain && mainContent) {
                        // Preserve navbar and footer before replacing content
                        const navbar = mainContent.querySelector('#navbar-container');
                        const footer = mainContent.querySelector('footer');
                        
                        // Replace main content
                        mainContent.innerHTML = newMain.innerHTML;
                        
                        // Re-insert navbar if it existed
                        if (navbar) {
                            const newNavbarContainer = mainContent.querySelector('#navbar-container');
                            if (newNavbarContainer) {
                                newNavbarContainer.replaceWith(navbar);
                            } else {
                                mainContent.insertBefore(navbar, mainContent.firstChild);
                            }
                        }
                        
                        // Re-insert footer if it existed
                        if (footer) {
                            const newFooterContainer = mainContent.querySelector('footer');
                            if (newFooterContainer) {
                                newFooterContainer.replaceWith(footer);
                            } else {
                                mainContent.appendChild(footer);
                            }
                        }
                        
                        console.log(`✅ Content loaded for ${pageName}`);
                        
                        // Ensure page-specific styles are loaded
                        this._ensurePageStyles(doc);
                        
                        // Re-apply theme from localStorage
                        this._applyThemeFromLocal();
                        
                        // Update current page after successful content load
                        this.currentPage = pageName;
                    }
                } else {
                    console.warn(`Failed to load content for ${pageName}, status: ${response.status}`);
                    throw new Error(`HTTP ${response.status}: Failed to load page content`);
                }
            } else {
                console.log(`📄 Already on ${pageName}, skipping content load`);
            }
        } catch (error) {
            console.error(`Error loading content for ${pageName}:`, error);
            // Show user-friendly error message
            this.showToast(`Failed to load ${pageName} page. Please try again.`, 'error');
            throw error;
        }
    }
    
    async loadNavbar() {
        const navbarContainer = document.getElementById('navbar-container');
        
        if (navbarContainer) {
            // Only load if container is empty
            if (navbarContainer.innerHTML.trim().length === 0) {
                window.debugLog?.info('initialization', 'Loading navbar...');
                await NavbarLoader.load();
                window.debugLog?.info('initialization', 'Navbar loaded successfully');
            } else {
                window.debugLog?.info('initialization', 'Navbar already loaded, skipping');
            }
        } else {
            window.debugLog?.warn('initialization', 'No navbar container found on this page');
        }
    }

    updateVersionInfo() {
        // Update version information in the about page
        const versionElement = document.getElementById('app-version');
        const lastUpdatedElement = document.getElementById('last-updated');
        const storageUsageElement = document.getElementById('storage-usage');
        
        if (versionElement) versionElement.textContent = this.version;
        if (lastUpdatedElement) lastUpdatedElement.textContent = this.lastUpdated;
        if (storageUsageElement) storageUsageElement.textContent = this.calculateStorageSize();
    }

    showSection(sectionName) {
        // In multi-page mode, use router to navigate
        if (window.router) {
            window.router.showSection(sectionName);
        } else {
            // Fallback for single-page mode
            this.uiManager.showSection(sectionName);
        }
    }

    getCurrentSection() {
        return this.uiManager.getCurrentSection();
    }

    updateUI() {
        this.uiManager.updateStorageInfo();
        this.uiManager.updateStats();
        this.uiManager.updateSettingsDisplay();
        
        // Only update flashcard selectors if containers exist (flashcards page)
        if (document.getElementById('deck-selector-container')) {
            this.flashcardManager.updateDeckSelector();
        }
        if (document.getElementById('difficulty-filter-container')) {
            this.flashcardManager.updateDifficultySelector();
        }
        
        this.flashcardManager.updateFlashcardCounter();
        
        // Only update quiz deck selector if container exists (quiz page)
        if (document.getElementById('quiz-deck-selector')) {
            this.uiManager.updateQuizDeckSelector();
        }
        
        // Only update mixed deck selector if container exists (mixed page)
        if (document.getElementById('mixed-deck-selector')) {
            this.mixedManager.updateMixedDeckSelector();
        }
        
        // Update flashcard management interface if on content section
        const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
        if (currentPage === 'content') {
            this.flashcardManager.updateFlashcardFilters();
            this.flashcardManager.renderFlashcardManagement();
        }
        
        this.updateVersionInfo(); // Update version info whenever UI is refreshed
    }

    // Utility methods
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showToast(message, type = 'info') {
        this.uiManager.showToast(message, type);
    }

    calculateStorageSize() {
        return this.uiManager.calculateStorageSize();
    }

    // Authentication event handlers (now handled by UnifiedDataManager)
    async onUserAuthenticated(user) {
        window.debugLog?.info('auth', 'User authenticated:', user);
        // Load user profile from Supabase into UnifiedDataManager
        if (this.dataManager && this.dataManager.loadUserProfile) {
            await this.dataManager.loadUserProfile(user);
            window.debugLog?.info('auth', 'User profile loaded into UnifiedDataManager');
            
            // Update avatar after profile is loaded
            if (this.authManager && this.authManager.updateUserAvatar) {
                this.authManager.updateUserAvatar();
                window.debugLog?.info('auth', 'User avatar updated after profile load');
            }
        }
        this.updateUI();
    }

    onUserSignedOut() {
        window.debugLog?.info('auth', 'User signed out');
        // UnifiedDataManager handles profile reset automatically
        this.updateUI();
    }
}

// Export for module usage
window.QuizWhizApp = QuizWhizApp;

// Bootstrap function removed - initialization is handled by individual pages

// No module exports, only use window object