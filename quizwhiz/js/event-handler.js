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
        
        // Content page events
        this.setupContentEvents();
        
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
                    
                    // Only prevent default for specific cases to avoid interfering with normal page behavior
                    // Prevent default only if clicking on dropdown-related elements that might cause unwanted behavior
                    const isDropdownRelated = e.target.closest('.nav-dropdown, .dropdown-toggle, .dropdown-content');
                    const isCustomDropdown = e.target.closest('.custom-dropdown, .custom-select, .select-button, .select-dropdown');
                    const isEmptySpace = e.target === document.body || e.target === document.documentElement;
                    
                    // Only prevent default for nav dropdown-related clicks or empty space clicks
                    // Exclude custom dropdown containers to avoid conflicts
                    if ((isDropdownRelated || isEmptySpace) && !isCustomDropdown) {
                        e.preventDefault();
                    }
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

        // Add quiz modal button is handled in setupQuizModalEvents()

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

        // Edit flashcard modal
        const editFlashcardForm = document.getElementById('edit-flashcard-form');
        if (editFlashcardForm) {
            editFlashcardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.app.flashcardManager.saveEditedFlashcard();
            });
        }

        // Edit quiz modal
        const editQuizForm = document.getElementById('edit-quiz-form');
        if (editQuizForm) {
            editQuizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveEditedQuiz();
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
        const okFormError = document.getElementById('close-form-error');

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
        const searchInput = document.getElementById('manage-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.contentManager.displayFlashcards();
                }, 300);
            });
        }

        // Flashcard management events
        this.setupFlashcardManagementEvents();

        // Mouse tracking for gradient effect
        this.setupFlashcardMouseTracking();
        
        // Mouse tracking for quiz options
        this.setupQuizOptionMouseTracking();
        
        // Mouse tracking for navigation buttons
        this.setupNavButtonMouseTracking();
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
        const managementSearch = document.getElementById('manage-search');
        if (managementSearch) {
            let searchTimeout;
            managementSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.contentManager.displayFlashcards();
                }, 300);
            });
        }

        // Flashcard management filters
        const deckFilter = document.getElementById('manage-deck-filter');
        if (deckFilter) {
            deckFilter.addEventListener('change', () => {
                this.app.contentManager.displayFlashcards();
            });
        }

        const difficultyFilter = document.getElementById('manage-difficulty-filter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => {
                this.app.contentManager.displayFlashcards();
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

    setupContentEvents() {
        // Refresh flashcard list button
        const refreshFlashcardBtn = document.getElementById('refresh-flashcard-list');
        if (refreshFlashcardBtn) {
            refreshFlashcardBtn.addEventListener('click', () => {
                this.app.contentManager.displayFlashcards();
            });
        }

        // Refresh quiz list button
        const refreshQuizBtn = document.getElementById('refresh-quiz-list');
        if (refreshQuizBtn) {
            refreshQuizBtn.addEventListener('click', () => {
                this.app.contentManager.displayQuizzes();
            });
        }

        // Quiz search
        const quizSearch = document.getElementById('manage-quiz-search');
        if (quizSearch) {
            let searchTimeout;
            quizSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.contentManager.displayQuizzes();
                }, 300);
            });
        }

        // Flashcard search
        const flashcardSearch = document.getElementById('manage-search');
        if (flashcardSearch) {
            let searchTimeout;
            flashcardSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.app.contentManager.displayFlashcards();
                }, 300);
            });
        }

        // Quiz select all button
        const selectAllQuizzesBtn = document.getElementById('select-all-quizzes');
        if (selectAllQuizzesBtn) {
            selectAllQuizzesBtn.addEventListener('click', () => {
                this.app.contentManager.toggleSelectAllQuizzes();
                this.updateContentBulkActionButtons();
            });
        }

        // Quiz bulk delete button
        const deleteSelectedQuizzesBtn = document.getElementById('delete-selected-quizzes-btn');
        if (deleteSelectedQuizzesBtn) {
            deleteSelectedQuizzesBtn.addEventListener('click', () => {
                this.app.contentManager.deleteSelectedQuizzes();
            });
        }
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

    setupQuizOptionMouseTracking() {
        let currentQuizOption = null;
        
        // Use event delegation to handle dynamically created quiz options
        document.addEventListener('mousemove', (e) => {
            const quizOption = e.target && e.target.closest ? e.target.closest('.quiz-option') : null;
            
            if (quizOption) {
                currentQuizOption = quizOption;
                const rect = quizOption.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                // Update CSS custom properties for the quiz option
                quizOption.style.setProperty('--mouse-x', `${x}%`);
                quizOption.style.setProperty('--mouse-y', `${y}%`);
            } else if (currentQuizOption) {
                // Mouse is outside any quiz option, but we had one before
                // Calculate position relative to the last quiz option for smooth exit
                const rect = currentQuizOption.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                currentQuizOption.style.setProperty('--mouse-x', `${x}%`);
                currentQuizOption.style.setProperty('--mouse-y', `${y}%`);
                
                // Clear the current quiz option after a delay to allow smooth transition
                setTimeout(() => {
                    if (!e.target || !e.target.closest || !e.target.closest('.quiz-option')) {
                        currentQuizOption = null;
                    }
                }, 100);
            }
        });
        
        // Handle mouse enter/leave for quiz option containers
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.closest && e.target.closest('.quiz-option')) {
                currentQuizOption = e.target.closest('.quiz-option');
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.closest && e.target.closest('.quiz-option')) {
                const quizOption = e.target.closest('.quiz-option');
                
                // Only reset if we're actually leaving the quiz option area
                setTimeout(() => {
                    if (!document.querySelector('.quiz-option:hover')) {
                        quizOption.style.setProperty('--mouse-x', '50%');
                        quizOption.style.setProperty('--mouse-y', '50%');
                        currentQuizOption = null;
                    }
                }, 150);
            }
        }, true);
    }

    setupNavButtonMouseTracking() {
        let currentNavButton = null;
        
        // Use event delegation to handle navigation buttons
        document.addEventListener('mousemove', (e) => {
            const navButton = e.target && e.target.closest ? e.target.closest('.nav-btn') : null;
            
            if (navButton) {
                currentNavButton = navButton;
                const rect = navButton.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                // Update CSS custom properties for the navigation button
                navButton.style.setProperty('--mouse-x', `${x}%`);
                navButton.style.setProperty('--mouse-y', `${y}%`);
            } else if (currentNavButton) {
                // Mouse is outside any nav button, but we had one before
                // Calculate position relative to the last nav button for smooth exit
                const rect = currentNavButton.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                currentNavButton.style.setProperty('--mouse-x', `${x}%`);
                currentNavButton.style.setProperty('--mouse-y', `${y}%`);
                
                // Clear the current nav button after a delay to allow smooth transition
                setTimeout(() => {
                    if (!e.target || !e.target.closest || !e.target.closest('.nav-btn')) {
                        currentNavButton = null;
                    }
                }, 100);
            }
        });
        
        // Handle mouse enter/leave for navigation button containers
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.closest && e.target.closest('.nav-btn')) {
                currentNavButton = e.target.closest('.nav-btn');
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.closest && e.target.closest('.nav-btn')) {
                const navButton = e.target.closest('.nav-btn');
                
                // Only reset if we're actually leaving the nav button area
                setTimeout(() => {
                    if (!document.querySelector('.nav-btn:hover')) {
                        navButton.style.setProperty('--mouse-x', '50%');
                        navButton.style.setProperty('--mouse-y', '50%');
                        currentNavButton = null;
                    }
                }, 150);
            }
        }, true);
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
        const addQuizBtn = document.getElementById('open-add-quiz-modal');
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

        // Unified content management events with performance optimizations
        document.addEventListener('click', (e) => {
            // Quiz edit button
            if (e.target.classList.contains('edit-quiz-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const quizId = e.target.dataset.quizId;
                
                // Prevent multiple rapid clicks
                if (e.target.disabled) return;
                e.target.disabled = true;
                
                // Add visual feedback
                e.target.classList.add('processing');
                
                setTimeout(() => {
                    if (e.target) {
                        e.target.disabled = false;
                        e.target.classList.remove('processing');
                    }
                }, 1000);
                
                this.openEditQuizModal(quizId);
                return;
            }
            
            // Quiz delete button
            if (e.target.classList.contains('delete-quiz-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const quizId = e.target.dataset.quizId;
                
                // Prevent multiple rapid clicks
                if (e.target.disabled) return;
                e.target.disabled = true;
                
                setTimeout(() => {
                    if (e.target) e.target.disabled = false;
                }, 500);
                
                this.handleDeleteQuiz(quizId);
                return;
            }
            
            // Flashcard edit button
            if (e.target.classList.contains('edit-flashcard-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const cardId = e.target.dataset.cardId;
                
                // Prevent multiple rapid clicks
                if (e.target.disabled) return;
                e.target.disabled = true;
                
                // Add visual feedback
                e.target.classList.add('processing');
                
                setTimeout(() => {
                    if (e.target) {
                        e.target.disabled = false;
                        e.target.classList.remove('processing');
                    }
                }, 1000);
                
                this.openEditFlashcardModal(cardId);
                return;
            }
            
            // Flashcard delete button
            if (e.target.classList.contains('delete-flashcard-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const cardId = e.target.dataset.cardId;
                
                // Prevent multiple rapid clicks
                if (e.target.disabled) return;
                e.target.disabled = true;
                
                setTimeout(() => {
                    if (e.target) e.target.disabled = false;
                }, 500);
                
                this.handleDeleteFlashcard(cardId);
                return;
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
        const quizContentSearch = document.getElementById('manage-quiz-search');
        const quizContentDeckFilter = document.getElementById('manage-quiz-deck-filter');
        const quizContentDifficultyFilter = document.getElementById('manage-quiz-difficulty-filter');
        
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
            this.app.uiManager.openModal('add-quiz-modal');
        }
     }

     closeQuizModal() {
         // Use UI manager for consistent modal state management
         this.app.uiManager.closeModal('add-quiz-modal');
         this.app.uiManager.closeModal('edit-quiz-modal');
     }

     handleSaveQuiz() {
         const addForm = document.getElementById('add-quiz-form');
         const editForm = document.getElementById('edit-quiz-form');
         
         // Simplified form detection - check if add modal is open
         const addModal = document.getElementById('add-quiz-modal');
         const editModal = document.getElementById('edit-quiz-modal');
         
         const addModalOpen = addModal && (addModal.classList.contains('show') || addModal.style.display === 'block');
         const editModalOpen = editModal && (editModal.classList.contains('show') || editModal.style.display === 'block');
         
         // Prioritize add form if add modal is open, otherwise use edit form
         const currentForm = (addModalOpen && addForm) ? addForm : (editModalOpen && editForm) ? editForm : addForm;
         
         if (!currentForm) {
             return;
         }
         
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
         
         // Validate required fields - check for empty strings and whitespace
         if (!quizData.deck || !quizData.deck.trim() || 
             !quizData.question || !quizData.question.trim() || 
             !quizData.correctAnswer || !quizData.correctAnswer.trim()) {
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
         
         // Close modal and refresh display
         this.closeQuizModal();
         
         // Refresh the quiz list if we're on the content page
         if (this.app.contentManager && this.app.contentManager.displayQuizzes) {
             this.app.contentManager.displayQuizzes();
         }
         
         // Show success message
         this.app.showToast('Quiz question added successfully!', 'success');
     }

     openEditQuizModal(quizId) {
         console.log('openEditQuizModal called with quizId:', quizId);
         const quiz = this.app.quizzes.find(q => q.id === quizId);
         if (!quiz) {
             console.log('Quiz not found for id:', quizId);
             this.app.showToast('Quiz not found', 'error');
             return;
         }
         
         const modal = document.getElementById('edit-quiz-modal');
         const form = document.getElementById('edit-quiz-form');
         console.log('Modal element found:', !!modal, 'Form element found:', !!form);
         
         if (!modal) {
             console.error('Edit quiz modal not found in DOM!');
             this.app.showToast('Modal not available', 'error');
             return;
         }
         
         if (!form) {
             console.error('Edit quiz form not found in DOM!');
             this.app.showToast('Form not available', 'error');
             return;
         }
         
         try {
             // Populate form with quiz data
             const idField = form.querySelector('[name="quiz-id"]');
             const deckField = form.querySelector('[name="quiz-deck"]');
             const questionField = form.querySelector('[name="quiz-question"]');
             const correctAnswerField = form.querySelector('[name="quiz-correct-answer"]');
             const wrongAnswersField = form.querySelector('[name="quiz-wrong-answers"]');
             const difficultyField = form.querySelector('[name="quiz-difficulty"]');
             
             if (idField) idField.value = quiz.id;
             if (deckField) deckField.value = quiz.deck || '';
             if (questionField) questionField.value = quiz.question || '';
             if (correctAnswerField) correctAnswerField.value = quiz.correctAnswer || '';
             if (wrongAnswersField) wrongAnswersField.value = (quiz.wrongAnswers || []).join('\n');
             if (difficultyField) difficultyField.value = quiz.difficulty || 'medium';
             
             console.log('Form populated successfully');
         } catch (error) {
             console.error('Error populating form:', error);
             this.app.showToast('Error loading quiz data', 'error');
             return;
         }
         
         // Use setTimeout to ensure DOM is ready
         setTimeout(() => {
             console.log('Opening edit quiz modal');
             this.app.uiManager.openModal('edit-quiz-modal');
         }, 50);
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

     handleSaveEditedQuiz() {
         const form = document.getElementById('edit-quiz-form');
         if (!form) return;

         const formData = new FormData(form);
         const quizId = formData.get('quiz-id');
         const wrongAnswersText = formData.get('quiz-wrong-answers');
         const wrongAnswers = wrongAnswersText ? wrongAnswersText.split('\n').filter(answer => answer.trim()) : [];

         const updates = {
             deck: formData.get('quiz-deck').trim(),
             question: formData.get('quiz-question').trim(),
             correctAnswer: formData.get('quiz-correct-answer').trim(),
             wrongAnswers: wrongAnswers,
             difficulty: formData.get('quiz-difficulty')
         };

         if (!updates.question || !updates.correctAnswer) {
             this.app.showToast('Question and correct answer are required', 'error');
             return;
         }

         // Find and update the quiz
         const quizIndex = this.app.quizzes.findIndex(q => q.id == quizId);
         if (quizIndex !== -1) {
             Object.assign(this.app.quizzes[quizIndex], updates);
             this.app.dataManager.saveData();
             this.app.showToast('Quiz updated successfully', 'success');
             
             // Refresh the content if we're on the content page
             if (this.app.contentManager && this.app.contentManager.displayQuizzes) {
                 this.app.contentManager.displayQuizzes();
             }
             
             this.app.uiManager.closeModal('edit-quiz-modal');
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

    openEditFlashcardModal(cardId) {
        try {
            // Validate cardId
            if (!cardId) {
                if (this.app.showToast) {
                    this.app.showToast('Invalid flashcard ID', 'error');
                }
                return;
            }

            // Check if flashcard exists
            const flashcard = this.app.flashcards.find(card => card.id == cardId);
            if (!flashcard) {
                if (this.app.showToast) {
                    this.app.showToast('Flashcard not found', 'error');
                }
                return;
            }

            // Check if flashcard manager is available
            if (!this.app.flashcardManager || !this.app.flashcardManager.openEditFlashcardModal) {
                if (this.app.showToast) {
                    this.app.showToast('Flashcard manager not available', 'error');
                }
                return;
            }

            // Check if modal elements exist
            const modal = document.getElementById('edit-flashcard-modal');
            const form = document.getElementById('edit-flashcard-form');
            if (!modal || !form) {
                if (this.app.showToast) {
                    this.app.showToast('Edit flashcard modal not found', 'error');
                }
                return;
            }

            // Use setTimeout to ensure DOM readiness
            setTimeout(() => {
                this.app.flashcardManager.openEditFlashcardModal(cardId);
            }, 50);

        } catch (error) {
            console.error('Error opening edit flashcard modal:', error);
            if (this.app.showToast) {
                this.app.showToast('Failed to open edit modal', 'error');
            }
        }
    }

    handleDeleteFlashcard(cardId) {
        try {
            // Validate cardId
            if (!cardId) {
                if (this.app.showToast) {
                    this.app.showToast('Invalid flashcard ID', 'error');
                }
                return;
            }

            // Check if flashcard exists
            const flashcard = this.app.flashcards.find(card => card.id == cardId);
            if (!flashcard) {
                if (this.app.showToast) {
                    this.app.showToast('Flashcard not found', 'error');
                }
                return;
            }

            // Use the content manager's delete method which already has custom modal
            if (this.app.contentManager && this.app.contentManager.deleteFlashcard) {
                this.app.contentManager.deleteFlashcard(cardId);
            } else if (this.app.flashcardManager && this.app.flashcardManager.deleteFlashcard) {
                // Fallback to flashcard manager
                this.app.flashcardManager.deleteFlashcard(cardId);
            } else {
                if (this.app.showToast) {
                    this.app.showToast('Delete functionality not available', 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            if (this.app.showToast) {
                this.app.showToast('Failed to delete flashcard', 'error');
            }
        }
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
                // Prevent default behavior and event bubbling
                e.preventDefault();
                e.stopPropagation();
                
                // Only trigger file input if not clicking directly on the file input
                if (e.target !== settingsFileInput) {
                    settingsFileInput.click();
                }
            });
            
            // Prevent the file input itself from bubbling up
            settingsFileInput.addEventListener('click', (e) => {
                e.stopPropagation();
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
                // Prevent default behavior and event bubbling
                e.preventDefault();
                e.stopPropagation();
                
                // Only trigger file input if not clicking directly on the file input
                if (e.target !== fileInput) {
                    fileInput.click();
                }
            });
            
            // Prevent the file input itself from bubbling up
            fileInput.addEventListener('click', (e) => {
                e.stopPropagation();
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