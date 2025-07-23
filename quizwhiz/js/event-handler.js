// Event Handler Module

class EventHandler {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Navigation
        this.setupNavigationEvents();
        
        // Theme toggle
        this.setupThemeEvents();
        
        // Modal events
        this.setupModalEvents();
        
        // Flashcard events
        this.setupFlashcardEvents();
        
        // Quiz events
        this.setupQuizEvents();
        
        // Quiz modal events
        this.setupQuizModalEvents();
        
        // Mixed mode events
        this.setupMixedModeEvents();
        
        // File upload events
        this.setupFileEvents();
        
        // Settings events
        this.setupSettingsEvents();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window events
        this.setupWindowEvents();
    }

    setupNavigationEvents() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                if (section) {
                    this.app.showSection(section);
                }
            });
        });

        // Dropdown navigation handling
        this.setupDropdownEvents();
    }

    setupDropdownEvents() {
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const content = dropdown.querySelector('.dropdown-content');
            let hoverTimeout;

            // Handle mouse enter on dropdown
            dropdown.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                content.style.display = 'block';
                // Small delay to allow for smooth animation
                setTimeout(() => {
                    content.style.opacity = '1';
                    content.style.visibility = 'visible';
                }, 10);
            });

            // Handle mouse leave on dropdown
            dropdown.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    content.style.opacity = '0';
                    content.style.visibility = 'hidden';
                    setTimeout(() => {
                        if (content.style.opacity === '0') {
                            content.style.display = 'none';
                        }
                    }, 300);
                }, 100); // Small delay to prevent flickering
            });

            // Prevent dropdown from closing when clicking inside content
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    content.style.opacity = '0';
                    content.style.visibility = 'hidden';
                    setTimeout(() => {
                        if (content.style.opacity === '0') {
                            content.style.display = 'none';
                        }
                    }, 300);
                }
            });
        });

        // Mobile menu toggle (if exists)
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                const nav = document.querySelector('.nav');
                nav.classList.toggle('mobile-open');
            });
        }
    }

    setupThemeEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.app.uiManager.toggleTheme();
            });
        }
    }

    setupModalEvents() {
        // Content page modal buttons
        const openAddFlashcardBtn = document.getElementById('open-add-flashcard-modal');
        if (openAddFlashcardBtn) {
            openAddFlashcardBtn.addEventListener('click', () => {
                this.app.uiManager.openModal('add-flashcard-modal');
            });
        }

        const openAddQuizBtn = document.getElementById('open-add-quiz-modal');
        if (openAddQuizBtn) {
            openAddQuizBtn.addEventListener('click', () => {
                this.app.uiManager.openModal('add-quiz-modal');
            });
        }

        // Add flashcard modal
        const addFlashcardForm = document.getElementById('add-flashcard-form');
        if (addFlashcardForm) {
            addFlashcardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddFlashcard(e);
            });
        }

        // Add flashcard modal cancel and close buttons
        const cancelAddFlashcard = document.getElementById('cancel-add-flashcard');
        const closeAddFlashcard = document.getElementById('close-add-flashcard-modal');
        
        if (cancelAddFlashcard) {
            cancelAddFlashcard.addEventListener('click', () => {
                this.app.uiManager.closeModal('add-flashcard-modal');
            });
        }
        
        if (closeAddFlashcard) {
            closeAddFlashcard.addEventListener('click', () => {
                this.app.uiManager.closeModal('add-flashcard-modal');
            });
        }

        // Add quiz modal
        const addQuizForm = document.getElementById('add-quiz-form');
        if (addQuizForm) {
            addQuizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveQuiz();
            });
        }

        // Add quiz modal cancel and close buttons
        const cancelAddQuiz = document.getElementById('cancel-add-quiz');
        const closeAddQuiz = document.getElementById('close-add-quiz-modal');
        
        if (cancelAddQuiz) {
            cancelAddQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('add-quiz-modal');
            });
        }
        
        if (closeAddQuiz) {
            closeAddQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('add-quiz-modal');
            });
        }

        // Edit flashcard modal cancel and close buttons
        const cancelEditFlashcard = document.getElementById('cancel-edit-flashcard');
        const closeEditFlashcard = document.getElementById('close-edit-flashcard-modal');
        
        if (cancelEditFlashcard) {
            cancelEditFlashcard.addEventListener('click', () => {
                this.app.uiManager.closeModal('edit-flashcard-modal');
            });
        }
        
        if (closeEditFlashcard) {
            closeEditFlashcard.addEventListener('click', () => {
                this.app.uiManager.closeModal('edit-flashcard-modal');
            });
        }

        // Edit quiz modal cancel and close buttons
        const cancelEditQuiz = document.getElementById('cancel-edit-quiz');
        const closeEditQuiz = document.getElementById('close-edit-quiz-modal');
        
        if (cancelEditQuiz) {
            cancelEditQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('edit-quiz-modal');
            });
        }
        
        if (closeEditQuiz) {
            closeEditQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('edit-quiz-modal');
            });
        }

        // Modal close buttons and overlay clicks
        document.addEventListener('click', (e) => {
            // Handle modal overlay clicks (clicking outside modal content)
            if (e.target.classList.contains('modal')) {
                this.app.uiManager.closeModal(e.target.id);
            }
            
            // Handle close button clicks
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.app.uiManager.closeModal(modal.id);
                }
            }
        });

        // Prevent modal content clicks from closing modal
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.app.uiManager.closeModal(openModal.id);
                }
            }
        });

        // Delete confirmation modal events
        this.setupDeleteConfirmationEvents();
    }

    setupDeleteConfirmationEvents() {
        // Delete Flashcard Modal
        const confirmDeleteFlashcard = document.getElementById('confirm-delete-flashcard');
        const cancelDeleteFlashcard = document.getElementById('cancel-delete-flashcard');
        const closeDeleteFlashcard = document.getElementById('close-delete-flashcard-modal');

        if (confirmDeleteFlashcard) {
            confirmDeleteFlashcard.addEventListener('click', () => {
                this.app.contentManager.confirmDeleteFlashcard();
            });
        }

        if (cancelDeleteFlashcard) {
            cancelDeleteFlashcard.addEventListener('click', () => {
                this.app.uiManager.closeModal('delete-flashcard-modal');
            });
        }

        if (closeDeleteFlashcard) {
            closeDeleteFlashcard.addEventListener('click', () => {
                this.app.uiManager.closeModal('delete-flashcard-modal');
            });
        }

        // Delete Quiz Modal
        const confirmDeleteQuiz = document.getElementById('confirm-delete-quiz');
        const cancelDeleteQuiz = document.getElementById('cancel-delete-quiz');
        const closeDeleteQuiz = document.getElementById('close-delete-quiz-modal');

        if (confirmDeleteQuiz) {
            confirmDeleteQuiz.addEventListener('click', () => {
                this.app.contentManager.confirmDeleteQuiz();
            });
        }

        if (cancelDeleteQuiz) {
            cancelDeleteQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('delete-quiz-modal');
            });
        }

        if (closeDeleteQuiz) {
            closeDeleteQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('delete-quiz-modal');
            });
        }

        // Bulk Delete Flashcards Modal
        const confirmBulkDeleteFlashcards = document.getElementById('confirm-bulk-delete-flashcards');
        const cancelBulkDeleteFlashcards = document.getElementById('cancel-bulk-delete-flashcards');
        const closeBulkDeleteFlashcards = document.getElementById('close-bulk-delete-flashcards-modal');

        if (confirmBulkDeleteFlashcards) {
            confirmBulkDeleteFlashcards.addEventListener('click', () => {
                this.app.contentManager.confirmBulkDeleteFlashcards();
            });
        }

        if (cancelBulkDeleteFlashcards) {
            cancelBulkDeleteFlashcards.addEventListener('click', () => {
                this.app.uiManager.closeModal('bulk-delete-flashcards-modal');
            });
        }

        if (closeBulkDeleteFlashcards) {
            closeBulkDeleteFlashcards.addEventListener('click', () => {
                this.app.uiManager.closeModal('bulk-delete-flashcards-modal');
            });
        }

        // Bulk Delete Quizzes Modal
        const confirmBulkDeleteQuizzes = document.getElementById('confirm-bulk-delete-quizzes');
        const cancelBulkDeleteQuizzes = document.getElementById('cancel-bulk-delete-quizzes');
        const closeBulkDeleteQuizzes = document.getElementById('close-bulk-delete-quizzes-modal');

        if (confirmBulkDeleteQuizzes) {
            confirmBulkDeleteQuizzes.addEventListener('click', () => {
                this.app.contentManager.confirmBulkDeleteQuizzes();
            });
        }

        if (cancelBulkDeleteQuizzes) {
            cancelBulkDeleteQuizzes.addEventListener('click', () => {
                this.app.uiManager.closeModal('bulk-delete-quizzes-modal');
            });
        }

        if (closeBulkDeleteQuizzes) {
            closeBulkDeleteQuizzes.addEventListener('click', () => {
                this.app.uiManager.closeModal('bulk-delete-quizzes-modal');
            });
        }

        // End Quiz Modal
        const confirmEndQuiz = document.getElementById('confirm-end-quiz');
        const cancelEndQuiz = document.getElementById('cancel-end-quiz');
        const closeEndQuiz = document.getElementById('close-end-quiz-modal');

        if (confirmEndQuiz) {
            confirmEndQuiz.addEventListener('click', () => {
                this.confirmEndQuiz();
            });
        }

        if (cancelEndQuiz) {
            cancelEndQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('end-quiz-modal');
            });
        }

        if (closeEndQuiz) {
            closeEndQuiz.addEventListener('click', () => {
                this.app.uiManager.closeModal('end-quiz-modal');
            });
        }

        // End Session Modal
        const confirmEndSession = document.getElementById('confirm-end-session');
        const cancelEndSession = document.getElementById('cancel-end-session');
        const closeEndSession = document.getElementById('close-end-session-modal');

        if (confirmEndSession) {
            confirmEndSession.addEventListener('click', () => {
                this.confirmEndSession();
            });
        }

        if (cancelEndSession) {
            cancelEndSession.addEventListener('click', () => {
                this.app.uiManager.closeModal('end-session-modal');
            });
        }

        if (closeEndSession) {
            closeEndSession.addEventListener('click', () => {
                this.app.uiManager.closeModal('end-session-modal');
            });
        }

        // Form Error Modal
        const closeFormError = document.getElementById('close-form-error-modal');
        const okFormError = document.getElementById('ok-form-error');

        if (closeFormError) {
            closeFormError.addEventListener('click', () => {
                this.app.uiManager.closeModal('form-error-modal');
            });
        }

        if (okFormError) {
            okFormError.addEventListener('click', () => {
                this.app.uiManager.closeModal('form-error-modal');
            });
        }
    }

    setupFlashcardEvents() {
        // Flashcard navigation
        const prevBtn = document.getElementById('prev-flashcard');
        const nextBtn = document.getElementById('next-flashcard');
        const shuffleBtn = document.getElementById('shuffle-flashcards');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.app.flashcardManager.previousFlashcard();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.app.flashcardManager.nextFlashcard();
            });
        }
        
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this.app.flashcardManager.shuffleFlashcards();
            });
        }

        const sortBtn = document.getElementById('sort-flashcards');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.app.flashcardManager.sortFlashcards();
            });
        }

        // Note: Deck selector and difficulty filter events are now handled by custom dropdowns
        // in flashcard-manager.js through onChange callbacks

        // Flashcard search
        const searchInput = document.getElementById('flashcard-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.flashcardManager.searchFlashcards(e.target.value);
                }, 300);
            });
        }

        // Flashcard management events
        this.setupFlashcardManagementEvents();

        // Mouse tracking for gradient effect
        this.setupFlashcardMouseTracking();
    }

    setupFlashcardMouseTracking() {
        let currentFlashcard = null;
        
        // Use event delegation to handle dynamically created flashcards
        document.addEventListener('mousemove', (e) => {
            const flashcardInner = e.target && e.target.closest ? e.target.closest('.flashcard-inner') : null;
            
            if (flashcardInner) {
                currentFlashcard = flashcardInner;
                const rect = flashcardInner.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                // Update CSS custom properties for both front and back cards
                const frontCard = flashcardInner.querySelector('.flashcard-front');
                const backCard = flashcardInner.querySelector('.flashcard-back');
                
                if (frontCard) {
                    frontCard.style.setProperty('--mouse-x', `${x}%`);
                    frontCard.style.setProperty('--mouse-y', `${y}%`);
                }
                
                if (backCard) {
                    backCard.style.setProperty('--mouse-x', `${x}%`);
                    backCard.style.setProperty('--mouse-y', `${y}%`);
                }
            } else if (currentFlashcard) {
                // Mouse is outside any flashcard, but we had one before
                // Calculate position relative to the last flashcard for smooth exit
                const rect = currentFlashcard.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                const frontCard = currentFlashcard.querySelector('.flashcard-front');
                const backCard = currentFlashcard.querySelector('.flashcard-back');
                
                if (frontCard) {
                    frontCard.style.setProperty('--mouse-x', `${x}%`);
                    frontCard.style.setProperty('--mouse-y', `${y}%`);
                }
                
                if (backCard) {
                    backCard.style.setProperty('--mouse-x', `${x}%`);
                    backCard.style.setProperty('--mouse-y', `${y}%`);
                }
                
                // Clear the current flashcard after a delay to allow smooth transition
                setTimeout(() => {
                    if (!e.target || !e.target.closest || !e.target.closest('.flashcard-inner')) {
                        currentFlashcard = null;
                    }
                }, 100);
            }
        });
        
        // Handle mouse enter/leave for flashcard containers
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.closest && e.target.closest('.flashcard-inner')) {
                currentFlashcard = e.target.closest('.flashcard-inner');
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.closest && e.target.closest('.flashcard-inner')) {
                const flashcardInner = e.target.closest('.flashcard-inner');
                
                // Only reset if we're actually leaving the flashcard area
                setTimeout(() => {
                    if (!document.querySelector('.flashcard-inner:hover')) {
                        const frontCard = flashcardInner.querySelector('.flashcard-front');
                        const backCard = flashcardInner.querySelector('.flashcard-back');
                        
                        if (frontCard) {
                            frontCard.style.setProperty('--mouse-x', '50%');
                            frontCard.style.setProperty('--mouse-y', '50%');
                        }
                        
                        if (backCard) {
                            backCard.style.setProperty('--mouse-x', '50%');
                            backCard.style.setProperty('--mouse-y', '50%');
                        }
                        
                        currentFlashcard = null;
                    }
                }, 150);
            }
        }, true);
    }

    setupFlashcardManagementEvents() {
        // Flashcard management search
        const managementSearch = document.getElementById('flashcard-search');
        if (managementSearch) {
            let searchTimeout;
            managementSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.flashcardManager.handleFlashcardSearch();
                }, 300);
            });
        }

        // Flashcard management filters
        const deckFilter = document.getElementById('flashcard-deck-filter');
        if (deckFilter) {
            deckFilter.addEventListener('change', () => {
                this.app.flashcardManager.handleFlashcardFilter();
            });
        }

        const difficultyFilter = document.getElementById('flashcard-difficulty-filter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => {
                this.app.flashcardManager.handleFlashcardFilter();
            });
        }

        // Select all button
        const selectAllBtn = document.getElementById('select-all-flashcards');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                if (this.app.getCurrentSection() === 'content') {
                    this.app.contentManager.toggleSelectAllFlashcards();
                    this.updateContentBulkActionButtons();
                } else {
                    this.app.flashcardManager.toggleAllFlashcards();
                }
            });
        }

        // Bulk action buttons
        const bulkDeleteBtn = document.getElementById('bulk-delete-flashcards');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                if (this.app.getCurrentSection() === 'content') {
                    this.app.contentManager.deleteSelectedFlashcards();
                } else {
                    this.app.flashcardManager.bulkDeleteSelected();
                }
            });
        }

        const bulkDifficultyBtn = document.getElementById('bulk-difficulty-flashcards');
        if (bulkDifficultyBtn) {
            bulkDifficultyBtn.addEventListener('click', () => {
                this.app.flashcardManager.bulkUpdateSelectedDifficulty();
            });
        }

        const bulkMoveBtn = document.getElementById('bulk-move-flashcards');
        if (bulkMoveBtn) {
            bulkMoveBtn.addEventListener('click', () => {
                this.app.flashcardManager.bulkMoveSelectedToDeck();
            });
        }

        // Individual flashcard checkboxes (using event delegation)
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('flashcard-checkbox')) {
                this.app.flashcardManager.toggleFlashcardSelection(e.target.dataset.id);
            }
            if (e.target.classList.contains('flashcard-checkbox-input')) {
                this.updateContentBulkActionButtons();
            }
            // Individual quiz checkboxes
            if (e.target.classList.contains('quiz-checkbox')) {
                this.updateContentBulkActionButtons();
            }
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'edit-flashcard-modal') {
                this.app.flashcardManager.closeEditFlashcardModal();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const editModal = document.getElementById('edit-flashcard-modal');
                if (editModal && editModal.style.display === 'block') {
                    this.app.flashcardManager.closeEditFlashcardModal();
                }
            }
        });
    }

    // Helper method to ensure flashcard mouse tracking is reinitialized when flashcards are updated
    reinitializeFlashcardTracking() {
        // This method can be called when flashcards are dynamically updated
        // The event delegation approach means we don't need to rebind events
    }

    // Update bulk action buttons for content page
    updateContentBulkActionButtons() {
        // Handle flashcard bulk actions
        const selectedFlashcardCheckboxes = document.querySelectorAll('.flashcard-checkbox-input:checked');
        const flashcardBulkDeleteBtn = document.getElementById('bulk-delete-flashcards');
        
        if (flashcardBulkDeleteBtn) {
            flashcardBulkDeleteBtn.disabled = selectedFlashcardCheckboxes.length === 0;
        }
        
        // Update flashcard select all button text
        const flashcardSelectAllBtn = document.getElementById('select-all-flashcards');
        if (flashcardSelectAllBtn) {
            const allFlashcardCheckboxes = document.querySelectorAll('.flashcard-checkbox-input');
            const allFlashcardsChecked = allFlashcardCheckboxes.length > 0 && Array.from(allFlashcardCheckboxes).every(cb => cb.checked);
            flashcardSelectAllBtn.textContent = allFlashcardsChecked ? 'Deselect All' : 'Select All';
        }
        
        // Handle quiz bulk actions
        const selectedQuizCheckboxes = document.querySelectorAll('.quiz-checkbox:checked');
        const quizBulkDeleteBtn = document.getElementById('delete-selected-quizzes-btn');
        
        if (quizBulkDeleteBtn) {
            quizBulkDeleteBtn.disabled = selectedQuizCheckboxes.length === 0;
        }
        
        // Update quiz select all button text
        const quizSelectAllBtn = document.getElementById('select-all-quizzes');
        if (quizSelectAllBtn) {
            const allQuizCheckboxes = document.querySelectorAll('.quiz-checkbox');
            const allQuizzesChecked = allQuizCheckboxes.length > 0 && Array.from(allQuizCheckboxes).every(cb => cb.checked);
            quizSelectAllBtn.textContent = allQuizzesChecked ? 'Deselect All' : 'Select All';
        }
    }

    setupQuizEvents() {
        // Start quiz button
        const startQuizBtn = document.getElementById('start-quiz');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => {
                this.handleStartQuiz();
            });
        }

        // Quiz count selector buttons
        this.setupQuizCountSelector();

        // Quiz settings
        const quizDeckSelector = document.getElementById('quiz-deck-selector');
        const questionCountInput = document.getElementById('quiz-count');
        const difficultySelector = document.getElementById('quiz-difficulty');
        
        // Store quiz settings in app for easy access
        if (quizDeckSelector) {
            quizDeckSelector.addEventListener('change', () => {
                this.app.quizSettings = this.app.quizSettings || {};
                this.app.quizSettings.deck = quizDeckSelector.value;
            });
        }
        
        if (questionCountInput) {
            questionCountInput.addEventListener('change', () => {
                this.app.quizSettings = this.app.quizSettings || {};
                this.app.quizSettings.questionCount = parseInt(questionCountInput.value);
            });
        }
        
        if (difficultySelector) {
            difficultySelector.addEventListener('change', () => {
                this.app.quizSettings = this.app.quizSettings || {};
                this.app.quizSettings.difficulty = difficultySelector.value;
            });
        }

        // Submit answer button
        const submitAnswerBtn = document.getElementById('submit-answer');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', () => {
                this.app.quizManager.submitAnswer();
            });
        }
        
        // End quiz button
        const endQuizBtn = document.getElementById('end-quiz');
        if (endQuizBtn) {
            endQuizBtn.addEventListener('click', () => {
                this.showEndQuizModal();
            });
        }

        // Retake quiz button
        const retakeQuizBtn = document.getElementById('retake-quiz');
        if (retakeQuizBtn) {
            retakeQuizBtn.addEventListener('click', () => {
                this.handleRetakeQuiz();
            });
        }

        // Side navigation buttons for quiz
        const prevQuizBtn = document.querySelector('.quiz-nav-prev');
        const nextQuizBtn = document.querySelector('.quiz-nav-next');
        const shuffleQuizBtn = document.getElementById('shuffle-quiz');
        const sortQuizBtn = document.getElementById('sort-quiz');
        
        if (prevQuizBtn) {
            prevQuizBtn.addEventListener('click', () => {
                // Check if we're in an active quiz or browsing mode
                if (this.app.quizManager.quiz.active) {
                    this.app.quizManager.previousQuestion();
                } else {
                    this.app.quizManager.previousQuiz();
                }
            });
        }
        
        if (nextQuizBtn) {
            nextQuizBtn.addEventListener('click', () => {
                // Check if we're in an active quiz or browsing mode
                if (this.app.quizManager.quiz.active) {
                    this.app.quizManager.nextQuestion();
                } else {
                    this.app.quizManager.nextQuiz();
                }
            });
        }
        
        if (shuffleQuizBtn) {
            shuffleQuizBtn.addEventListener('click', () => {
                this.app.quizManager.shuffleQuizzes();
            });
        }

        if (sortQuizBtn) {
            sortQuizBtn.addEventListener('click', () => {
                this.app.quizManager.sortQuizzes();
            });
        }

        // Quiz search
        const quizSearchInput = document.getElementById('quiz-search');
        if (quizSearchInput) {
            let searchTimeout;
            quizSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.quizManager.showQuiz(0);
                }, 300);
            });
        }

        // Quiz deck and difficulty filters
        const quizDeckFilter = document.getElementById('quiz-deck-filter');
        const quizDifficultyFilter = document.getElementById('quiz-difficulty-filter');
        
        if (quizDeckFilter) {
            quizDeckFilter.addEventListener('change', () => {
                this.app.quizManager.showQuiz(0);
            });
        }
        
        if (quizDifficultyFilter) {
            quizDifficultyFilter.addEventListener('change', () => {
                this.app.quizManager.showQuiz(0);
            });
        }

        // Quiz card flip
        const flipQuizBtn = document.getElementById('flip-quiz-card');
        if (flipQuizBtn) {
            flipQuizBtn.addEventListener('click', () => {
                this.app.quizManager.flipQuizCard();
            });
        }

        // Quiz modal events
        this.setupQuizModalEvents();
    }

    setupQuizModalEvents() {
        // Add quiz modal
        const addQuizBtn = document.getElementById('add-quiz-btn');
        const addQuizModal = document.getElementById('add-quiz-modal');
        const addQuizForm = document.getElementById('add-quiz-form');
        const cancelAddQuizBtn = document.getElementById('cancel-add-quiz');
        
        if (addQuizBtn && addQuizModal) {
            addQuizBtn.addEventListener('click', () => {
                this.openQuizModal();
            });
        }
        
        // Handle add quiz form submission
        if (addQuizForm) {
            addQuizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveQuiz();
            });
        }
        
        if (cancelAddQuizBtn) {
            cancelAddQuizBtn.addEventListener('click', () => {
                this.closeQuizModal();
            });
        }

        // Edit quiz events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-quiz-btn')) {
                const quizId = e.target.dataset.quizId;
                this.openEditQuizModal(quizId);
            }
            
            if (e.target.classList.contains('delete-quiz-btn')) {
                const quizId = e.target.dataset.quizId;
                this.handleDeleteQuiz(quizId);
            }
        });

        // Quiz management events
        const selectAllQuizzesBtn = document.getElementById('select-all-quizzes');
        const deleteSelectedQuizzesBtn = document.getElementById('delete-selected-quizzes-btn');
        
        if (selectAllQuizzesBtn) {
            selectAllQuizzesBtn.addEventListener('click', () => {
                this.toggleSelectAllQuizzes();
            });
        }
        
        if (deleteSelectedQuizzesBtn) {
            deleteSelectedQuizzesBtn.addEventListener('click', () => {
                this.handleDeleteSelectedQuizzes();
            });
        }

        // Quiz search and filters in content page
        const quizContentSearch = document.getElementById('quiz-content-search');
        const quizContentDeckFilter = document.getElementById('quiz-content-deck-filter');
        const quizContentDifficultyFilter = document.getElementById('quiz-content-difficulty-filter');
        
        if (quizContentSearch) {
            let searchTimeout;
            quizContentSearch.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.contentManager.displayQuizzes();
                }, 300);
            });
        }
        
        if (quizContentDeckFilter) {
            quizContentDeckFilter.addEventListener('change', () => {
                this.app.contentManager.displayQuizzes();
            });
        }
        
        if (quizContentDifficultyFilter) {
            quizContentDifficultyFilter.addEventListener('change', () => {
                this.app.contentManager.displayQuizzes();
            });
        }
     }

     // Quiz modal handlers
     openQuizModal() {
         const modal = document.getElementById('add-quiz-modal');
         const form = document.getElementById('add-quiz-form');
         
         if (form) {
             form.reset();
         }
         
         if (modal) {
             modal.style.display = 'block';
             document.body.style.overflow = 'hidden';
         }
     }

     closeQuizModal() {
         const addModal = document.getElementById('add-quiz-modal');
         const editModal = document.getElementById('edit-quiz-modal');
         
         if (addModal) {
             addModal.style.display = 'none';
         }
         
         if (editModal) {
             editModal.style.display = 'none';
         }
         
         document.body.style.overflow = 'auto';
     }

     handleSaveQuiz() {
         const addForm = document.getElementById('add-quiz-form');
         const editForm = document.getElementById('edit-quiz-form');
         const currentForm = addForm && addForm.offsetParent !== null ? addForm : editForm;
         
         if (!currentForm) return;
         
         const formData = new FormData(currentForm);
         
         // Handle wrong answers - both forms now use the same textarea format
         let wrongAnswers = [];
         const wrongAnswersText = formData.get('quiz-wrong-answers');
         if (wrongAnswersText) {
             wrongAnswers = wrongAnswersText.split('\n')
                 .map(answer => answer.trim())
                 .filter(answer => answer.length > 0);
         }
         
         const quizData = {
             id: formData.get('quiz-id') || Date.now().toString(),
             deck: formData.get('quiz-deck'),
             question: formData.get('quiz-question'),
             correctAnswer: formData.get('quiz-correct-answer'),
             wrongAnswers: wrongAnswers,
             difficulty: formData.get('quiz-difficulty')
         };
         
         // Validate required fields
         if (!quizData.deck || !quizData.question || !quizData.correctAnswer) {
             this.showFormErrorModal('Please fill in all required fields.');
             return;
         }
         
         if (quizData.wrongAnswers.length === 0) {
             this.showFormErrorModal('Please provide at least one wrong answer.');
             return;
         }
         
         // Save or update quiz
         if (formData.get('quiz-id')) {
             // Update existing quiz
             if (this.app.contentManager) {
                 this.app.contentManager.updateQuiz(quizData.id, quizData);
             } else {
                 const index = this.app.quizzes.findIndex(q => q.id === quizData.id);
                 if (index !== -1) {
                     this.app.quizzes[index] = quizData;
                 }
                 this.app.dataManager.saveData();
             }
         } else {
             // Add new quiz
             if (this.app.contentManager) {
                 this.app.contentManager.addQuiz(quizData);
             } else {
                 this.app.quizzes.push(quizData);
                 this.app.dataManager.saveData();
             }
         }
         
         this.closeQuizModal();
     }

     openEditQuizModal(quizId) {
         const quiz = this.app.quizzes.find(q => q.id === quizId);
         if (!quiz) return;
         
         const modal = document.getElementById('edit-quiz-modal');
         const form = document.getElementById('edit-quiz-form');
         
         if (form) {
             // Populate form with quiz data
             form.querySelector('[name="quiz-id"]').value = quiz.id;
             form.querySelector('[name="quiz-deck"]').value = quiz.deck;
             form.querySelector('[name="quiz-question"]').value = quiz.question;
             form.querySelector('[name="quiz-correct-answer"]').value = quiz.correctAnswer;
             form.querySelector('[name="quiz-wrong-answer-1"]').value = quiz.wrongAnswers[0] || '';
             form.querySelector('[name="quiz-wrong-answer-2"]').value = quiz.wrongAnswers[1] || '';
             form.querySelector('[name="quiz-wrong-answer-3"]').value = quiz.wrongAnswers[2] || '';
             form.querySelector('[name="quiz-difficulty"]').value = quiz.difficulty;
         }
         
         if (modal) {
             modal.style.display = 'block';
             document.body.style.overflow = 'hidden';
         }
     }

     handleDeleteQuiz(quizId) {
         // Use the content manager's delete method which already has custom modal
         if (this.app.contentManager && this.app.contentManager.deleteQuiz) {
             this.app.contentManager.deleteQuiz(quizId);
         } else {
             // Fallback for other pages
             this.pendingDeleteQuizId = quizId;
             this.app.uiManager.openModal('delete-quiz-modal');
         }
     }

     toggleSelectAllQuizzes() {
         if (this.app.contentManager && this.app.contentManager.toggleSelectAllQuizzes) {
             this.app.contentManager.toggleSelectAllQuizzes();
         }
     }

     handleDeleteSelectedQuizzes() {
        if (this.app.contentManager && this.app.contentManager.deleteSelectedQuizzes) {
            this.app.contentManager.deleteSelectedQuizzes();
        }
    }

    // Custom modal methods
    showEndQuizModal() {
        this.app.uiManager.openModal('end-quiz-modal');
    }

    showEndSessionModal() {
        this.app.uiManager.openModal('end-session-modal');
    }

    showFormErrorModal(message) {
        const modal = document.getElementById('form-error-modal');
        const messageElement = document.getElementById('form-error-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        this.app.uiManager.openModal('form-error-modal');
    }

    confirmEndQuiz() {
        this.app.uiManager.closeModal('end-quiz-modal');
        this.app.quizManager.endQuiz();
    }

    confirmEndSession() {
        this.app.uiManager.closeModal('end-session-modal');
        this.app.mixedManager.endMixedSession();
    }

    confirmDeleteQuiz() {
        if (this.pendingDeleteQuizId) {
            const index = this.app.quizzes.findIndex(q => q.id === this.pendingDeleteQuizId);
            if (index !== -1) {
                this.app.quizzes.splice(index, 1);
                this.app.dataManager.saveData();
                
                // Refresh display if on content page
                if (this.app.contentManager && this.app.contentManager.displayQuizzes) {
                    this.app.contentManager.displayQuizzes();
                }
            }
            this.pendingDeleteQuizId = null;
        }
        this.app.uiManager.closeModal('delete-quiz-modal');
    }

     setupMixedModeEvents() {
        // Start mixed session
        const startMixedBtn = document.getElementById('start-mixed');
        if (startMixedBtn) {
            startMixedBtn.addEventListener('click', () => {
                this.handleStartMixed();
            });
        }

        // Mixed mode navigation
        const nextMixedBtn = document.getElementById('next-mixed');
        if (nextMixedBtn) {
            nextMixedBtn.addEventListener('click', () => {
                this.app.mixedManager.nextMixedItem();
            });
        }

        // End mixed session
        const endMixedBtn = document.getElementById('end-mixed');
        if (endMixedBtn) {
            endMixedBtn.addEventListener('click', () => {
                this.showEndSessionModal();
            });
        }

        // Reset mixed mode
        const resetMixedBtn = document.getElementById('reset-mixed');
        if (resetMixedBtn) {
            resetMixedBtn.addEventListener('click', () => {
                this.app.mixedManager.resetMixedMode();
            });
        }

        // Flashcard ratio slider
        const flashcardRatioSlider = document.getElementById('flashcard-ratio');
        const flashcardRatioValue = document.getElementById('flashcard-ratio-value');
        
        if (flashcardRatioSlider && flashcardRatioValue) {
            flashcardRatioSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                flashcardRatioValue.textContent = `${value}%`;
            });
        }

        // Mixed session duration
        const sessionDuration = document.getElementById('session-duration');
        if (sessionDuration) {
            sessionDuration.addEventListener('change', () => {
                this.app.mixedSettings = this.app.mixedSettings || {};
                this.app.mixedSettings.duration = parseInt(sessionDuration.value);
            });
        }
    }

    setupFileEvents() {
        // Content page file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.app.dataManager.processFile(e.target.files[0]);
                }
            });
        }

        // Settings page file input
        const settingsFileInput = document.getElementById('settings-file-input');
        if (settingsFileInput) {
            settingsFileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.app.dataManager.processFile(e.target.files[0]);
                }
            });
        }

        // Content page drag and drop
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                files.forEach(file => {
                    this.app.dataManager.processFile(file);
                });
            });
        }

        // Settings page file upload area drag and drop
        const settingsFileUploadArea = document.getElementById('settings-file-upload-area');
        if (settingsFileUploadArea && settingsFileInput) {
            settingsFileUploadArea.addEventListener('click', (e) => {
                // Only prevent default if the click target is not the file input itself
                if (e.target !== settingsFileInput) {
                    e.preventDefault();
                }
                settingsFileInput.click();
            });

            settingsFileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                settingsFileUploadArea.classList.add('drag-over');
            });

            settingsFileUploadArea.addEventListener('dragleave', () => {
                settingsFileUploadArea.classList.remove('drag-over');
            });

            settingsFileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                settingsFileUploadArea.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                files.forEach(file => {
                    this.app.dataManager.processFile(file);
                });
            });
        }

        // Content page file upload area click to browse
        const fileUploadArea = document.getElementById('file-upload-area');
        if (fileUploadArea && fileInput) {
            fileUploadArea.addEventListener('click', (e) => {
                // Only prevent default if the click target is not the file input itself
                if (e.target !== fileInput) {
                    e.preventDefault();
                }
                fileInput.click();
            });
        }
    }

    setupSettingsEvents() {
        // Theme selector - Initialize custom dropdown
        const themeSelectorContainer = document.getElementById('theme-selector-container');
        if (themeSelectorContainer) {
            this.themeDropdown = new CustomDropdown('theme-selector-container');
            this.themeDropdown.onChange((value) => {
                this.app.settings.theme = value;
                this.app.uiManager.changeTheme(value);
                this.app.dataManager.saveData();
            });
            
            // Set initial value
            this.themeDropdown.setValue(this.app.settings.theme, true);
        }
        
        // Initialize custom checkboxes (only if CustomCheckbox is available)
        if (typeof CustomCheckbox !== 'undefined') {
            CustomCheckbox.initializeAll();
        }
        
        // Animation toggle - Custom checkbox
        const animationToggleContainer = document.getElementById('animation-toggle-container');
        if (animationToggleContainer && typeof CustomCheckbox !== 'undefined') {
            this.animationCheckbox = new CustomCheckbox('animation-toggle-container');
            this.animationCheckbox.onChange((checked) => {
                this.app.uiManager.toggleAnimations(checked);
            });
            
            // Set initial value
            this.animationCheckbox.setChecked(this.app.settings.animations || false, true);
        }
        
        // Auto-flip setting
        const autoFlip = document.getElementById('auto-flip');
        if (autoFlip) {
            autoFlip.addEventListener('input', (e) => {
                clearTimeout(this.autoFlipTimeout);
                this.autoFlipTimeout = setTimeout(() => {
                    this.app.uiManager.updateAutoFlip(e.target.value);
                }, 1000);
            });
        }
        
        // Shuffle default toggle - Custom checkbox
        const shuffleDefaultContainer = document.getElementById('shuffle-default-container');
        if (shuffleDefaultContainer && typeof CustomCheckbox !== 'undefined') {
            this.shuffleDefaultCheckbox = new CustomCheckbox('shuffle-default-container');
            this.shuffleDefaultCheckbox.onChange((checked) => {
                this.app.uiManager.toggleShuffleDefault(checked);
            });
            
            // Set initial value
            this.shuffleDefaultCheckbox.setChecked(this.app.settings.shuffleDefault || false, true);
        }
        
        // Difficulty feature toggle - Custom checkbox
        const difficultyFeatureContainer = document.getElementById('difficulty-feature-container');
        if (difficultyFeatureContainer && typeof CustomCheckbox !== 'undefined') {
            this.difficultyFeatureCheckbox = new CustomCheckbox('difficulty-feature-container');
            this.difficultyFeatureCheckbox.onChange((checked) => {
                this.app.uiManager.toggleDifficultyFeature(checked);
            });
            
            // Set initial value
            this.difficultyFeatureCheckbox.setChecked(this.app.settings.difficultyFeature || false, true);
        }
        
        // Data Management buttons
        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.app.dataManager.exportData('json');
                this.app.updateUI(); // Update storage info after export
            });
        }

        const exportXmlBtn = document.getElementById('export-xml-btn');
        if (exportXmlBtn) {
            exportXmlBtn.addEventListener('click', () => {
                this.app.dataManager.exportData('xml');
                this.app.updateUI(); // Update storage info after export
            });
        }

        // Removed importDataBtn handler as the element doesn't exist
        // File upload is handled by settingsFileUploadArea click event

        const clearAllDataBtn = document.getElementById('clear-all-data-btn');
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => {
                this.app.dataManager.clearAllData();
                this.app.updateUI(); // Update storage info after clearing data
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.app.showSection('flashcards');
                        break;
                    case '2':
                        e.preventDefault();
                        this.app.showSection('quiz');
                        break;
                    case '3':
                        e.preventDefault();
                        this.app.showSection('mixed');
                        break;
                    case '4':
                        e.preventDefault();
                        this.app.showSection('settings');
                        break;
                    case '5':
                        e.preventDefault();
                        this.app.showSection('about');
                        break;
                }
            }

            // Section-specific shortcuts
            switch (e.key) {
                case 'Escape':
                    // Close any open modals
                    const openModal = document.querySelector('.modal[style*="flex"]');
                    if (openModal) {
                        this.app.uiManager.closeModal(openModal.id);
                    }
                    break;
                    
                case 'ArrowLeft':
                    if (this.app.getCurrentSection() === 'flashcards') {
                        e.preventDefault();
                        this.app.flashcardManager.previousFlashcard();
                    }
                    break;
                    
                case 'ArrowRight':
                    if (this.app.getCurrentSection() === 'flashcards') {
                        e.preventDefault();
                        this.app.flashcardManager.nextFlashcard();
                    }
                    break;
                    
                case ' ': // Spacebar
                    if (this.app.getCurrentSection() === 'flashcards') {
                        e.preventDefault();
                        this.app.flashcardManager.flipCard();
                    }
                    break;
                    
                case 'Enter':
                    // Handle enter key in various contexts
                    if (e.target.classList.contains('quiz-option')) {
                        e.target.click();
                    }
                    break;
            }
        });
    }

    setupWindowEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle visibility change (for pausing timers)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Handle before unload (warn about unsaved changes)
        window.addEventListener('beforeunload', (e) => {
            if (this.app.mixedManager.mixedSession.active || this.app.quizManager.currentQuiz.active) {
                e.preventDefault();
                e.returnValue = 'You have an active session. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.app.uiManager.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.app.uiManager.showToast('You are offline. Data will be saved locally.', 'warning');
        });
    }

    // Event Handlers
    handleAddFlashcard(e) {
        e.preventDefault();
        
        const question = document.getElementById('modal-question-input')?.value?.trim();
        const answer = document.getElementById('modal-answer-input')?.value?.trim();
        const deck = document.getElementById('modal-deck-name')?.value?.trim() || 'General';
        const difficulty = document.getElementById('modal-difficulty-select')?.value || 'medium';

        if (!question || !answer) {
            this.app.uiManager.showToast('Please fill in both question and answer', 'error');
            return;
        }

        this.app.flashcardManager.addFlashcard(question, answer, deck, difficulty);
        this.app.uiManager.closeModal('add-flashcard-modal');
        this.app.uiManager.showToast('Flashcard added successfully!', 'success');
    }

    setupQuizCountSelector() {
        const countButtons = document.querySelectorAll('.count-btn:not(.custom-btn)');
        const customButton = document.getElementById('custom-count-btn');
        const customDropdown = document.getElementById('custom-count-dropdown');
        const customInput = document.getElementById('custom-quiz-count');
        const applyButton = document.getElementById('apply-custom-count');
        const cancelButton = document.getElementById('cancel-custom-count');
        const hiddenInput = document.getElementById('quiz-count');
        
        // Initialize quiz settings
        this.app.quizSettings = this.app.quizSettings || {};
        this.app.quizSettings.questionCount = 10;
        
        // Handle regular count button clicks
        countButtons.forEach(button => {
            button.addEventListener('click', () => {
                const count = parseInt(button.dataset.count);
                if (count) {
                    // Remove active class from all buttons
                    countButtons.forEach(btn => btn.classList.remove('active'));
                    if (customButton) customButton.classList.remove('active');
                    // Add active class to clicked button
                    button.classList.add('active');
                    // Update quiz settings and hidden input
                    this.app.quizSettings.questionCount = count;
                    if (hiddenInput) hiddenInput.value = count;
                    // Hide custom dropdown with animation
                    this.hideCustomDropdown();
                }
            });
        });
        
        // Handle custom button click
        if (customButton) {
            customButton.addEventListener('click', () => {
                // Remove active class from all regular buttons
                countButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to custom button
                customButton.classList.add('active');
                // Show custom dropdown with animation
                this.showCustomDropdown();
            });
        }
        
        // Handle apply custom count
        if (applyButton) {
            applyButton.addEventListener('click', () => {
                let value = parseInt(customInput.value);
                if (isNaN(value) || value < 10) value = 10;
                if (value > 200) value = 200;
                customInput.value = value;
                this.app.quizSettings.questionCount = value;
                if (hiddenInput) hiddenInput.value = value;
                this.hideCustomDropdown();
            });
        }
        
        // Handle cancel custom count
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                if (customButton) customButton.classList.remove('active');
                this.hideCustomDropdown();
                // Restore previous selection or default to 10
                const currentCount = this.app.quizSettings.questionCount || 10;
                const matchingButton = document.querySelector(`.count-btn[data-count="${currentCount}"]`);
                if (matchingButton) {
                    matchingButton.classList.add('active');
                }
            });
        }
        
        // Handle custom input validation
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                if (value < 10) {
                    e.target.setCustomValidity('Minimum value is 10');
                } else if (value > 200) {
                    e.target.setCustomValidity('Maximum value is 200');
                } else {
                    e.target.setCustomValidity('');
                }
            });
            
            // Handle Enter key in custom input
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && applyButton) {
                    applyButton.click();
                }
            });
            
            // Handle Escape key in custom input
            customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && cancelButton) {
                    cancelButton.click();
                }
            });
        }
        
        // Set initial active state for default value (10)
        const defaultButton = document.querySelector('.count-btn[data-count="10"]');
        if (defaultButton) {
            defaultButton.classList.add('active');
        }
        if (hiddenInput) hiddenInput.value = 10;
    }
    
    showCustomDropdown() {
        const customDropdown = document.getElementById('custom-count-dropdown');
        const customInput = document.getElementById('custom-quiz-count');
        
        if (customDropdown) {
            customDropdown.style.display = 'flex';
            // Force reflow
            customDropdown.offsetHeight;
            customDropdown.classList.add('show');
            
            // Focus input after animation
            setTimeout(() => {
                if (customInput) {
                    customInput.focus();
                    customInput.select();
                }
            }, 200);
        }
    }
    
    hideCustomDropdown() {
        const customDropdown = document.getElementById('custom-count-dropdown');
        
        if (customDropdown) {
            customDropdown.classList.remove('show');
            
            // Hide after animation completes
            setTimeout(() => {
                if (!customDropdown.classList.contains('show')) {
                    customDropdown.style.display = 'none';
                }
            }, 400);
        }
    }

    handleStartQuiz() {
        const settings = this.app.quizSettings || {};
        const deck = settings.deck || document.getElementById('quiz-deck-selector')?.value || 'all';
        const questionCount = settings.questionCount || parseInt(document.getElementById('quiz-count')?.value) || parseInt(document.getElementById('custom-quiz-count')?.value) || 10;
        const difficulty = settings.difficulty || document.getElementById('quiz-difficulty')?.value || 'all';

        this.app.quizManager.startQuiz(deck, questionCount, difficulty);
    }

    handleRetakeQuiz() {
        // Try to retake with cached questions first
        if (!this.app.quizManager.retakeQuiz()) {
            // If no cached questions available, start a new quiz with same settings
            this.handleStartQuiz();
        }
    }

    handleStartMixed() {
        const settings = this.app.mixedSettings || {};
        const deck = document.getElementById('mixed-deck-selector')?.value || 'all';
        const duration = settings.duration || parseInt(document.getElementById('session-duration')?.value) || 10;
        const flashcardRatio = parseInt(document.getElementById('flashcard-ratio')?.value) || 50;

        this.app.mixedManager.startMixedMode(deck, duration, flashcardRatio);
    }

    handleResize() {
        // Update UI for different screen sizes
        const isMobile = this.app.uiManager.isMobile();
        
        // Adjust modal sizes
        document.querySelectorAll('.modal-content').forEach(modal => {
            if (isMobile) {
                modal.style.width = '95%';
                modal.style.maxHeight = '90vh';
            } else {
                modal.style.width = '';
                modal.style.maxHeight = '';
            }
        });

        // Update navigation for mobile
        const nav = document.querySelector('.nav');
        if (nav) {
            if (isMobile) {
                nav.classList.add('mobile');
            } else {
                nav.classList.remove('mobile', 'mobile-open');
            }
        }
    }

    handlePageHidden() {
        // Pause any running timers
        if (this.app.mixedManager.mixedSession.active && this.app.mixedManager.mixedSession.timer) {
            this.app.mixedManager.pauseTimer = Date.now();
        }
    }

    handlePageVisible() {
        // Resume timers if they were paused
        if (this.app.mixedManager.pauseTimer) {
            const pauseDuration = Date.now() - this.app.mixedManager.pauseTimer;
            this.app.mixedManager.mixedSession.startTime += pauseDuration;
            delete this.app.mixedManager.pauseTimer;
        }
    }

    // Touch Events for Mobile
    setupTouchEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Only handle horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (this.app.getCurrentSection() === 'flashcards') {
                    if (deltaX > 0) {
                        // Swipe right - previous flashcard
                        this.app.flashcardManager.previousFlashcard();
                    } else {
                        // Swipe left - next flashcard
                        this.app.flashcardManager.nextFlashcard();
                    }
                }
            }
            
            touchStartX = 0;
            touchStartY = 0;
        });
    }

    // Accessibility Events
    setupAccessibilityEvents() {
        // Focus management for modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('shown', () => {
                this.app.uiManager.trapFocus(modal);
            });
        });

        // Announce important changes to screen readers
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Announce when new content is added
                    const addedNodes = Array.from(mutation.addedNodes);
                    addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const announcement = node.getAttribute('data-announce');
                            if (announcement) {
                                this.app.uiManager.announceToScreenReader(announcement);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Cleanup
    destroy() {
        // Remove all event listeners if needed
        // This would be called if the app is being destroyed
        document.removeEventListener('keydown', this.handleKeyboard);
        window.removeEventListener('resize', this.handleResize);
        // ... remove other listeners as needed
    }
}

// Global functions for HTML onclick handlers
function openAddFlashcardModal() {
    if (window.app) {
        window.app.uiManager.openModal('add-flashcard-modal');
    }
}

function closeAddFlashcardModal() {
    if (window.app) {
        window.app.uiManager.closeModal('add-flashcard-modal');
    }
}

function flipMixedFlashcard() {
    if (window.app) {
        window.app.mixedManager.flipMixedFlashcard();
    }
}

function selectMixedAnswer(answer) {
    if (window.app) {
        window.app.mixedManager.selectMixedAnswer(answer);
    }
}

function markDifficulty(difficulty) {
    if (window.app) {
        window.app.flashcardManager.markDifficulty(difficulty);
    }
}

function startQuiz() {
    if (window.app) {
        window.app.eventHandler.handleStartQuiz();
    }
}

function nextQuestion() {
    if (window.app) {
        window.app.quizManager.nextQuestion();
    }
}

function shuffleCards() {
    if (window.app) {
        window.app.flashcardManager.shuffleFlashcards();
        window.app.flashcardManager.showFlashcard(0);
    }
}

function previousCard() {
    if (window.app) {
        window.app.flashcardManager.previousFlashcard();
    }
}

function nextCard() {
    if (window.app) {
        window.app.flashcardManager.nextFlashcard();
    }
}

function startMixedMode() {
    if (window.app) {
        window.app.eventHandler.handleStartMixed();
    }
}

function nextMixedItem() {
    if (window.app) {
        window.app.mixedManager.nextMixedItem();
    }
}

function endMixedSession() {
    if (window.app) {
        window.app.mixedManager.endMixedSession();
    }
}

function reviewMixedMistakes() {
    if (window.app) {
        window.app.mixedManager.reviewMixedMistakes();
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventHandler;
}