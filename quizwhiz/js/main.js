// Main Application Entry Point

// Initialize the QuizWhiz Application
class QuizWhizApp {
    constructor() {
        console.log('QuizWhizApp constructor started');
        // App version information
        this.version = "3.9";
        this.lastUpdated = "2025-08-10";
        console.log('Version info set');
        
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
        console.log('Creating DataManager');
        this.dataManager = new DataManager(this);
        console.log('Creating FlashcardManager');
        this.flashcardManager = new FlashcardManager(this);
        console.log('Creating QuizManager');
        this.quizManager = new QuizManager(this);
        console.log('Creating MixedManager');
        this.mixedManager = new MixedManager(this);
        console.log('Creating ContentManager');
        this.contentManager = new ContentManager(this);
        console.log('Creating UIManager');
        this.uiManager = new UIManager(this);
        console.log('Creating UserManager');
        this.userManager = new UserManager(this);
        console.log('About to create EventHandler');
        this.eventHandler = new EventHandler(this);
        console.log('EventHandler created successfully');
        
        // Track current page for cleanup
        this.currentPage = null;
        
        this.init();
    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        if (this.eventHandler && typeof this.eventHandler.cleanup === 'function') {
            this.eventHandler.cleanup();
        }
    }

    init() {
        this.dataManager.loadData();
        this.uiManager.initializeTheme();
        
        // Get current page from router if available
        const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
        
        // Initialize the current page
        this.initializePage(currentPage);
        
        this.updateUI();
        this.updateVersionInfo();
    }
    
    initializePage(pageName) {
        // Cleanup previous page if switching pages
        if (this.currentPage && this.currentPage !== pageName) {
            this.cleanupPage(this.currentPage);
        }
        
        // Update current page
        this.currentPage = pageName;
        
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
                this.initializeHomePage();
                break;
        }
        
        // Update navigation to show current page as active
        if (window.router) {
            window.router.updateNavigation(pageName);
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
    
    initializeHomePage() {
        // Initialize home page specific functionality
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new QuizWhizApp();
    // Make it available as 'app' for backward compatibility
    if (typeof app === 'undefined') {
        app = window.app;
    }
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizWhizApp;
}