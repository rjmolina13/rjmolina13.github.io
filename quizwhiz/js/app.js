// Quiz Whiz - Main Application Class

class QuizWhizApp {
    constructor() {
        this.flashcards = [];
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
        
        this.init();
    }

    init() {
        this.loadData();
        this.initializeTheme();
        this.setupEventListeners();
        this.showSection('home');
        this.updateUI();
    }

    // Navigation
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Section-specific updates
        if (sectionName === 'flashcards') {
            this.flashcardManager.showFlashcard(0);
            this.flashcardManager.updateDeckSelector();
        } else if (sectionName === 'quiz') {
            this.updateQuizDeckSelector();
        } else if (sectionName === 'mixed') {
            this.resetMixedMode();
        } else if (sectionName === 'settings') {
            this.updateSettingsDisplay();
        }
    }

    getCurrentSection() {
        const activeSection = document.querySelector('.content-section.active');
        return activeSection ? activeSection.id : 'home';
    }

    updateUI() {
        // Update statistics display
        document.getElementById('total-flashcards').textContent = this.flashcards.length;
        document.getElementById('quiz-score').textContent = this.stats.bestScore + '%';
        document.getElementById('study-streak').textContent = this.stats.studyStreak;
        
        // Update flashcard display if on flashcards section
        if (this.getCurrentSection() === 'flashcards') {
            this.flashcardManager.updateDeckSelector();
            this.flashcardManager.showFlashcard(0);
        }
        
        // Update flashcard management interface if on content section
        if (this.getCurrentSection() === 'content') {
            this.flashcardManager.updateFlashcardFilters();
            this.flashcardManager.renderFlashcardManagement();
        }
    }

    // Utility method for shuffling arrays
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' :
                    type === 'error' ? 'fas fa-exclamation-circle' :
                    type === 'warning' ? 'fas fa-exclamation-triangle' :
                    'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Utility Methods
    calculateStorageSize() {
        try {
            // Calculate total size of all QuizWhiz localStorage data
            let totalBytes = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('quizwhiz_')) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        totalBytes += new Blob([value]).size;
                    }
                }
            }
            
            if (totalBytes < 1024) return `${totalBytes} B`;
            if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
            return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        } catch (error) {
            return 'Unknown';
        }
    }
}

// Note: App initialization is now handled in main.js
// This code is kept for reference but is no longer active
/*
// Global app instance
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new QuizWhizApp();
});
*/

// Handle theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (window.app && window.app.settings.theme === 'auto') {
        window.app.applyTheme();
    }
});