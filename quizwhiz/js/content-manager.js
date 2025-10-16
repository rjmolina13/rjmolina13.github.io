// Content Management Module

class ContentManager {
    constructor(app) {
        this.app = app;
    }

    // Initialize content page
    initializeContent() {
        this.displayFlashcards();
        this.displayQuizzes();
        this.updateDeckOptions();
        this.initializeRenameDeckButtons();
    }

    // Display flashcards in content management
    displayFlashcards() {
        const flashcardsContainer = document.getElementById('flashcard-management-list');
        if (!flashcardsContainer) return;

        const searchTerm = document.getElementById('manage-search')?.value?.toLowerCase() || '';
        const deckFilter = document.getElementById('manage-deck-filter')?.value || '';
        const difficultyFilter = document.getElementById('manage-difficulty-filter')?.value || '';

        let filteredCards = this.app.flashcards.filter(card => {
            const matchesSearch = card.question.toLowerCase().includes(searchTerm) ||
                                card.answer.toLowerCase().includes(searchTerm) ||
                                card.deck.toLowerCase().includes(searchTerm);
            const matchesDeck = !deckFilter || card.deck === deckFilter;
            const matchesDifficulty = !difficultyFilter || card.difficulty === difficultyFilter;
            
            return matchesSearch && matchesDeck && matchesDifficulty;
        });

        // Update count
        const displayedCount = document.getElementById('displayed-count');
        const totalCount = document.getElementById('total-count');
        if (displayedCount && totalCount) {
            displayedCount.textContent = filteredCards.length;
            totalCount.textContent = this.app.flashcards.length;
        }

        if (filteredCards.length === 0) {
            flashcardsContainer.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-search"></i>
                    <p>${this.app.flashcards.length === 0 ? 'No flashcards found. Create some flashcards to get started!' : 'No flashcards match your current filters.'}</p>
                </div>
            `;
            document.getElementById('no-flashcards-message')?.style.setProperty('display', 'block');
            return;
        }

        document.getElementById('no-flashcards-message')?.style.setProperty('display', 'none');
        flashcardsContainer.innerHTML = filteredCards.map(card => `
            <div class="flashcard-item" data-id="${card.id}">
                <input type="checkbox" class="flashcard-checkbox" data-id="${card.id}">
                <div class="flashcard-content">
                    <div class="flashcard-question-management">${this.truncateText(card.question, 100)}</div>
                    <div class="flashcard-answer-management">${this.truncateText(card.answer, 80)}</div>
                    <div class="flashcard-meta">
                        <div class="flashcard-deck">
                            <i class="fas fa-folder"></i>
                            <span>${card.deck}</span>
                        </div>
                        <div class="flashcard-difficulty">
                            <span class="difficulty-badge difficulty-${card.difficulty || 'medium'}">${card.difficulty || 'medium'}</span>
                        </div>
                        <div class="flashcard-stats">
                            <i class="fas fa-eye"></i>
                            <span>${card.reviewCount || 0} reviews</span>
                        </div>
                    </div>
                </div>
                <div class="flashcard-actions">
                    <button class="edit-btn edit-flashcard-btn" data-card-id="${card.id}" title="Edit flashcard">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn delete-flashcard-btn" data-card-id="${card.id}" title="Delete flashcard">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update bulk action buttons after rendering
        if (this.app.eventHandler && this.app.eventHandler.updateContentBulkActionButtons) {
            this.app.eventHandler.updateContentBulkActionButtons();
        }
    }

    // Display quizzes in content management
    displayQuizzes() {
        const quizzesContainer = document.getElementById('quiz-management-list');
        if (!quizzesContainer) return;

        const searchTerm = document.getElementById('manage-quiz-search')?.value?.toLowerCase() || '';
        const deckFilter = document.getElementById('manage-quiz-deck-filter')?.value || '';
        const difficultyFilter = document.getElementById('manage-quiz-difficulty-filter')?.value || '';

        let filteredQuizzes = this.app.quizzes.filter(quiz => {
            const matchesSearch = quiz.question.toLowerCase().includes(searchTerm) ||
                                quiz.correctAnswer.toLowerCase().includes(searchTerm) ||
                                (quiz.wrongAnswers && quiz.wrongAnswers.some(answer => answer.toLowerCase().includes(searchTerm))) ||
                                quiz.deck.toLowerCase().includes(searchTerm);
            const matchesDeck = !deckFilter || quiz.deck === deckFilter;
            const matchesDifficulty = !difficultyFilter || quiz.difficulty === difficultyFilter;
            
            return matchesSearch && matchesDeck && matchesDifficulty;
        });

        // Update count
        const displayedCountElement = document.getElementById('displayed-quiz-count');
        const totalCountElement = document.getElementById('total-quiz-count');
        if (displayedCountElement) {
            displayedCountElement.textContent = filteredQuizzes.length;
        }
        if (totalCountElement) {
            totalCountElement.textContent = this.app.quizzes.length;
        }

        // Show/hide no quizzes message
        const noQuizzesMessage = document.getElementById('no-quizzes-message');
        if (noQuizzesMessage) {
            noQuizzesMessage.style.display = filteredQuizzes.length === 0 ? 'block' : 'none';
        }

        if (filteredQuizzes.length === 0) {
            quizzesContainer.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-search"></i>
                    <p>${this.app.quizzes.length === 0 ? 'No quiz questions found. Start by adding some quiz questions!' : 'No quiz questions match your current filters.'}</p>
                </div>
            `;
            document.getElementById('no-quizzes-message')?.style.setProperty('display', 'block');
            return;
        }

        document.getElementById('no-quizzes-message')?.style.setProperty('display', 'none');
        quizzesContainer.innerHTML = filteredQuizzes.map(quiz => `
            <div class="quiz-item" data-id="${quiz.id}">
                <input type="checkbox" class="quiz-checkbox" data-id="${quiz.id}">
                <div class="quiz-content">
                    <div class="quiz-question-management">${quiz.question}</div>
                    <div class="quiz-answer-management">
                        <strong>Correct:</strong> ${this.truncateText(quiz.correctAnswer, 60)}
                    </div>
                    ${quiz.wrongAnswers && quiz.wrongAnswers.length > 0 ? `
                        <div class="quiz-wrong-answers">
                            <strong>Wrong:</strong> ${quiz.wrongAnswers.map(answer => this.truncateText(answer, 40)).join(', ')}
                        </div>
                    ` : ''}
                    <div class="quiz-meta">
                        <div class="quiz-deck">
                            <i class="fas fa-folder"></i>
                            <span>${quiz.deck}</span>
                        </div>
                        <div class="quiz-difficulty">
                            <span class="difficulty-badge difficulty-${quiz.difficulty}">${quiz.difficulty}</span>
                        </div>
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="edit-btn edit-quiz-btn" data-quiz-id="${quiz.id}" title="Edit quiz question">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn delete-quiz-btn" data-quiz-id="${quiz.id}" title="Delete quiz question">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update bulk action buttons
        if (this.app.eventHandler && this.app.eventHandler.updateContentBulkActionButtons) {
            this.app.eventHandler.updateContentBulkActionButtons();
        }
    }

    // Utility method to truncate text
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Update deck options in dropdowns
    updateDeckOptions() {
        // Get flashcard decks for flashcard filter
        const flashcardDecks = [...new Set(this.app.flashcards.map(card => card.deck))].filter(deck => deck);
        
        // Get quiz decks for quiz filter
        const quizDecks = [...new Set(this.app.quizzes.map(quiz => quiz.deck))].filter(deck => deck);

        // Count items per deck for flashcards
        const flashcardDeckCounts = {};
        flashcardDecks.forEach(deck => {
            flashcardDeckCounts[deck] = this.app.flashcards.filter(card => card.deck === deck).length;
        });

        // Count items per deck for quizzes
        const quizDeckCounts = {};
        quizDecks.forEach(deck => {
            quizDeckCounts[deck] = this.app.quizzes.filter(quiz => quiz.deck === deck).length;
        });

        // Update flashcard deck filter
        const flashcardDeckFilter = document.getElementById('manage-deck-filter');
        if (flashcardDeckFilter) {
            const currentValue = flashcardDeckFilter.value;
            const totalFlashcards = this.app.flashcards.length;
            flashcardDeckFilter.innerHTML = `
                <option value="">All Decks (${totalFlashcards} flashcards)</option>
                ${flashcardDecks.map(deck => `<option value="${deck}">${deck} (${flashcardDeckCounts[deck]} flashcards)</option>`).join('')}
            `;
            if (flashcardDecks.includes(currentValue)) {
                flashcardDeckFilter.value = currentValue;
            }
        }

        // Update quiz deck filter - only show quiz decks
        const quizDeckFilter = document.getElementById('manage-quiz-deck-filter');
        if (quizDeckFilter) {
            const currentValue = quizDeckFilter.value;
            const totalQuizzes = this.app.quizzes.length;
            quizDeckFilter.innerHTML = `
                <option value="">All Decks (${totalQuizzes} quizzes)</option>
                ${quizDecks.map(deck => `<option value="${deck}">${deck} (${quizDeckCounts[deck]} quizzes)</option>`).join('')}
            `;
            if (quizDecks.includes(currentValue)) {
                quizDeckFilter.value = currentValue;
            }
        }
        
        // Update deck suggestions for all modals
        this.app.uiManager.populateAllDeckSuggestions();
    }

    // Deck rename functionality
    initializeRenameDeckButtons() {
        // Initialize rename buttons for flashcard deck filter
        const flashcardRenameBtn = document.getElementById('rename-flashcard-deck-btn');
        const flashcardDeleteDeckBtn = document.getElementById('delete-flashcard-deck-btn');
        const flashcardDeckFilter = document.getElementById('manage-deck-filter');
        
        if (flashcardRenameBtn && flashcardDeckFilter) {
            // Initial state check
            this.updateRenameDeckButtonState(flashcardRenameBtn, flashcardDeckFilter);
            
            // Listen for dropdown changes
            flashcardDeckFilter.addEventListener('change', () => {
                this.updateRenameDeckButtonState(flashcardRenameBtn, flashcardDeckFilter);
                if (flashcardDeleteDeckBtn) {
                    this.updateRenameDeckButtonState(flashcardDeleteDeckBtn, flashcardDeckFilter);
                }
            });
            
            flashcardRenameBtn.addEventListener('click', () => {
                const selectedDeck = flashcardDeckFilter.value;
                if (selectedDeck && selectedDeck !== '') {
                    this.openRenameDeckModal(selectedDeck);
                } else {
                    this.app.showToast('Please select a deck to rename', 'warning');
                }
            });
        }

        if (flashcardDeleteDeckBtn && flashcardDeckFilter) {
            // Initial state check
            this.updateRenameDeckButtonState(flashcardDeleteDeckBtn, flashcardDeckFilter);
            
            flashcardDeleteDeckBtn.addEventListener('click', () => {
                const selectedDeck = flashcardDeckFilter.value;
                if (selectedDeck && selectedDeck !== '') {
                    this.openDeleteDeckModal(selectedDeck, 'flashcard');
                } else {
                    this.app.showToast('Please select a deck to delete', 'warning');
                }
            });
        }

        // Initialize rename buttons for quiz deck filter
        const quizRenameBtn = document.getElementById('rename-quiz-deck-btn');
        const quizDeleteDeckBtn = document.getElementById('delete-quiz-deck-btn');
        const quizDeckFilter = document.getElementById('manage-quiz-deck-filter');
        
        if (quizRenameBtn && quizDeckFilter) {
            // Initial state check
            this.updateRenameDeckButtonState(quizRenameBtn, quizDeckFilter);
            
            // Listen for dropdown changes
            quizDeckFilter.addEventListener('change', () => {
                this.updateRenameDeckButtonState(quizRenameBtn, quizDeckFilter);
                if (quizDeleteDeckBtn) {
                    this.updateRenameDeckButtonState(quizDeleteDeckBtn, quizDeckFilter);
                }
            });
            
            quizRenameBtn.addEventListener('click', () => {
                const selectedDeck = quizDeckFilter.value;
                if (selectedDeck && selectedDeck !== '') {
                    this.openRenameDeckModal(selectedDeck);
                } else {
                    this.app.showToast('Please select a deck to rename', 'warning');
                }
            });
        }

        if (quizDeleteDeckBtn && quizDeckFilter) {
            // Initial state check
            this.updateRenameDeckButtonState(quizDeleteDeckBtn, quizDeckFilter);
            
            quizDeleteDeckBtn.addEventListener('click', () => {
                const selectedDeck = quizDeckFilter.value;
                if (selectedDeck && selectedDeck !== '') {
                    this.openDeleteDeckModal(selectedDeck, 'quiz');
                } else {
                    this.app.showToast('Please select a deck to delete', 'warning');
                }
            });
        }

        // Initialize rename deck modal
        this.initializeRenameDeckModal();
        this.initializeDeleteDeckModal();
    }

    updateRenameDeckButtonState(button, deckFilter) {
        const selectedValue = deckFilter.value;
        const shouldDisable = !selectedValue || selectedValue === '';
        
        button.disabled = shouldDisable;
        if (shouldDisable) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    }

    openRenameDeckModal(currentDeckName) {
        const modal = document.getElementById('rename-deck-modal');
        const currentDeckInput = document.getElementById('current-deck-name');
        const newDeckInput = document.getElementById('new-deck-name');
        
        if (modal && currentDeckInput && newDeckInput) {
            currentDeckInput.value = currentDeckName;
            newDeckInput.value = '';
            modal.classList.add('show');
            newDeckInput.focus();
        }
    }

    initializeRenameDeckModal() {
        const modal = document.getElementById('rename-deck-modal');
        const closeBtn = document.getElementById('close-rename-deck-modal');
        const cancelBtn = document.getElementById('cancel-rename-deck');
        const form = document.getElementById('rename-deck-form');

        // Close modal handlers
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        // Click outside to close
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }

        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRenameDeck();
            });
        }
    }

    handleRenameDeck() {
        const currentDeckName = document.getElementById('current-deck-name').value;
        const newDeckName = document.getElementById('new-deck-name').value.trim();
        
        if (!newDeckName) {
            this.app.showToast('Please enter a new deck name', 'error');
            return;
        }

        if (currentDeckName === newDeckName) {
            this.app.showToast('New deck name must be different from current name', 'warning');
            return;
        }

        // Check if new deck name already exists
        const allDecks = [...new Set([
            ...this.app.flashcards.map(card => card.deck),
            ...this.app.quizzes.map(quiz => quiz.deck)
        ])].filter(deck => deck);

        if (allDecks.includes(newDeckName)) {
            this.app.showToast('A deck with this name already exists', 'error');
            return;
        }

        // Rename deck in flashcards
        let flashcardCount = 0;
        this.app.flashcards.forEach(card => {
            if (card.deck === currentDeckName) {
                card.deck = newDeckName;
                flashcardCount++;
            }
        });

        // Rename deck in quizzes
        let quizCount = 0;
        this.app.quizzes.forEach(quiz => {
            if (quiz.deck === currentDeckName) {
                quiz.deck = newDeckName;
                quizCount++;
            }
        });

        // Save changes
        this.app.dataManager.saveData();

        // Update UI
        this.updateDeckOptions();
        this.displayFlashcards();
        this.displayQuizzes();

        // Close modal
        document.getElementById('rename-deck-modal').classList.remove('show');

        // Show success message
        const totalItems = flashcardCount + quizCount;
        const flashcardText = flashcardCount === 1 ? 'flashcard' : 'flashcards';
        const quizText = quizCount === 1 ? 'quiz' : 'quizzes';
        
        let message = `Deck renamed successfully! Updated ${flashcardCount} ${flashcardText}`;
        if (quizCount > 0) {
            message += ` and ${quizCount} ${quizText}`;
        }
        
        this.app.showToast(message, 'success');
    }

    openDeleteDeckModal(deckName, type) {
        const modal = document.getElementById('delete-deck-modal');
        const deckNameSpan = document.getElementById('deck-to-delete');
        
        if (modal && deckNameSpan) {
            deckNameSpan.textContent = deckName;
            this.pendingDeleteDeckName = deckName;
            this.pendingDeleteDeckType = type;
            modal.classList.add('show');
        }
    }

    initializeDeleteDeckModal() {
        const modal = document.getElementById('delete-deck-modal');
        const closeBtn = document.getElementById('close-delete-deck-modal');
        const cancelBtn = document.getElementById('cancel-delete-deck');
        const confirmBtn = document.getElementById('confirm-delete-deck');

        // Close modal handlers
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        // Click outside to close
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }

        // Confirm deletion
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleDeleteDeck();
            });
        }
    }

    handleDeleteDeck() {
        if (!this.pendingDeleteDeckName) {
            this.app.showToast('No deck selected for deletion', 'error');
            return;
        }

        const deckName = this.pendingDeleteDeckName;
        
        // Delete flashcards in this deck
        let flashcardCount = 0;
        this.app.flashcards = this.app.flashcards.filter(card => {
            if (card.deck === deckName) {
                flashcardCount++;
                return false;
            }
            return true;
        });

        // Delete quizzes in this deck
        let quizCount = 0;
        this.app.quizzes = this.app.quizzes.filter(quiz => {
            if (quiz.deck === deckName) {
                quizCount++;
                return false;
            }
            return true;
        });

        // Save changes
        this.app.dataManager.saveData();

        // Update UI
        this.updateDeckOptions();
        this.displayFlashcards();
        this.displayQuizzes();

        // Close modal
        document.getElementById('delete-deck-modal').classList.remove('show');

        // Show success message
        const totalItems = flashcardCount + quizCount;
        const flashcardText = flashcardCount === 1 ? 'flashcard' : 'flashcards';
        const quizText = quizCount === 1 ? 'quiz' : 'quizzes';
        
        let message = `Deck "${deckName}" deleted successfully! Removed ${flashcardCount} ${flashcardText}`;
        if (quizCount > 0) {
            message += ` and ${quizCount} ${quizText}`;
        }
        
        this.app.showToast(message, 'success');
        
        // Clear pending deletion data
        this.pendingDeleteDeckName = null;
        this.pendingDeleteDeckType = null;
    }

    // Add new flashcard
    async addFlashcard(flashcardData) {
        try {
            const newCard = {
                ...flashcardData,
                createdAt: new Date().toISOString()
            };
            
            // Save to Supabase
            const savedCard = await this.app.supabaseDataService.saveFlashcard(newCard);
            
            // Update local array
            this.app.flashcards.push(savedCard);
            this.displayFlashcards();
            this.updateDeckOptions();
            this.app.showToast('Flashcard added successfully!', 'success');
        } catch (error) {
            console.error('Error adding flashcard:', error);
            this.app.showToast('Failed to add flashcard. Please try again.', 'error');
            throw error;
        }
    }

    // Update existing flashcard
    async updateFlashcard(cardId, flashcardData) {
        try {
            // Use loose equality to handle string/number ID mismatches
            const index = this.app.flashcards.findIndex(card => card.id == cardId);
            if (index !== -1) {
                const updatedData = {
                    ...this.app.flashcards[index],
                    ...flashcardData,
                    updatedAt: new Date().toISOString()
                };
                
                // Save to Supabase
                const savedCard = await this.app.supabaseDataService.saveFlashcard(updatedData);
                
                // Update local array
                this.app.flashcards[index] = savedCard;
                this.displayFlashcards();
                this.updateDeckOptions();
                this.app.showToast('Flashcard updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating flashcard:', error);
            this.app.showToast('Failed to update flashcard. Please try again.', 'error');
            throw error;
        }
    }

    // Delete flashcard
    deleteFlashcard(cardId) {
        // Store the card ID for the confirmation modal
        this.pendingDeleteFlashcardId = cardId;
        
        // Show custom confirmation modal
        const modal = document.getElementById('delete-flashcard-modal');
        const message = document.getElementById('delete-flashcard-message');
        message.textContent = 'Are you sure you want to delete this flashcard?';
        
        this.app.uiManager.openModal('delete-flashcard-modal');
    }
    
    async confirmDeleteFlashcard() {
        if (this.pendingDeleteFlashcardId) {
            try {
                // Use loose equality to handle string/number ID mismatches
                const index = this.app.flashcards.findIndex(card => card.id == this.pendingDeleteFlashcardId);
                if (index !== -1) {
                    // Delete from Supabase
                    await this.app.supabaseDataService.deleteFlashcard(this.pendingDeleteFlashcardId);
                    
                    // Remove from local array
                    this.app.flashcards.splice(index, 1);
                    this.displayFlashcards();
                    this.updateDeckOptions();
                    this.app.showToast('Flashcard deleted successfully!', 'success');
                } else {
                    window.debugLog?.error('contentManager', 'Flashcard not found for deletion. ID:', this.pendingDeleteFlashcardId);
                    this.app.showToast('Failed to delete flashcard - not found', 'error');
                }
            } catch (error) {
                console.error('Error deleting flashcard:', error);
                this.app.showToast('Failed to delete flashcard. Please try again.', 'error');
            }
            this.pendingDeleteFlashcardId = null;
        }
        this.app.uiManager.closeModal('delete-flashcard-modal');
    }

    // Add new quiz
    async addQuiz(quizData) {
        try {
            const newQuiz = {
                ...quizData,
                createdAt: new Date().toISOString()
            };
            
            // Save to Supabase
            const savedQuiz = await this.app.supabaseDataService.saveQuiz(newQuiz);
            
            // Update local array
            this.app.quizzes.push(savedQuiz);
            this.displayQuizzes();
            this.updateDeckOptions();
            this.app.showToast('Quiz added successfully!', 'success');
        } catch (error) {
            console.error('Error adding quiz:', error);
            this.app.showToast('Failed to add quiz. Please try again.', 'error');
            throw error;
        }
    }

    // Update existing quiz
    async updateQuiz(quizId, quizData) {
        try {
            const index = this.app.quizzes.findIndex(quiz => quiz.id === quizId);
            if (index !== -1) {
                const updatedData = {
                    ...this.app.quizzes[index],
                    ...quizData,
                    updatedAt: new Date().toISOString()
                };
                
                // Save to Supabase
                const savedQuiz = await this.app.supabaseDataService.saveQuiz(updatedData);
                
                // Update local array
                this.app.quizzes[index] = savedQuiz;
                this.displayQuizzes();
                this.updateDeckOptions();
                this.app.showToast('Quiz updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating quiz:', error);
            this.app.showToast('Failed to update quiz. Please try again.', 'error');
            throw error;
        }
    }

    // Delete quiz
    deleteQuiz(quizId) {
        // Store the quiz ID for the confirmation modal
        this.pendingDeleteQuizId = quizId;
        
        // Show custom confirmation modal
        const modal = document.getElementById('delete-quiz-modal');
        const message = document.getElementById('delete-quiz-message');
        message.textContent = 'Are you sure you want to delete this quiz question?';
        
        this.app.uiManager.openModal('delete-quiz-modal');
    }
    
    async confirmDeleteQuiz() {
        if (this.pendingDeleteQuizId) {
            try {
                const index = this.app.quizzes.findIndex(quiz => quiz.id === this.pendingDeleteQuizId);
                if (index !== -1) {
                    // Delete from Supabase
                    await this.app.supabaseDataService.deleteQuiz(this.pendingDeleteQuizId);
                    
                    // Remove from local array
                    this.app.quizzes.splice(index, 1);
                    this.displayQuizzes();
                    this.updateDeckOptions();
                    this.app.showToast('Quiz deleted successfully!', 'success');
                } else {
                    this.app.showToast('Failed to delete quiz - not found', 'error');
                }
            } catch (error) {
                console.error('Error deleting quiz:', error);
                this.app.showToast('Failed to delete quiz. Please try again.', 'error');
            }
            this.pendingDeleteQuizId = null;
        }
        this.app.uiManager.closeModal('delete-quiz-modal');
    }

    // Delete selected flashcards
    deleteSelectedFlashcards() {
        const selectedCheckboxes = document.querySelectorAll('.flashcard-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));
        
        if (selectedIds.length === 0) {
            if (this.app.showToast) {
                this.app.showToast('Please select flashcards to delete.', 'warning');
            }
            return;
        }
        
        // Store the selected IDs for the confirmation modal
        this.pendingDeleteFlashcardIds = selectedIds;
        
        // Show custom confirmation modal
        const message = document.getElementById('bulk-delete-flashcards-message');
        message.textContent = `Are you sure you want to delete ${selectedIds.length} flashcard(s)?`;
        
        this.app.uiManager.openModal('bulk-delete-flashcards-modal');
    }
    
    async confirmBulkDeleteFlashcards() {
        if (this.pendingDeleteFlashcardIds && this.pendingDeleteFlashcardIds.length > 0) {
            const deleteCount = this.pendingDeleteFlashcardIds.length;
            const initialCount = this.app.flashcards.length;
            
            try {
                // Delete from Supabase
                for (const cardId of this.pendingDeleteFlashcardIds) {
                    await this.app.supabaseDataService.deleteFlashcard(cardId);
                }
                
                // Use loose equality to handle string/number ID mismatches
                this.app.flashcards = this.app.flashcards.filter(card => 
                    !this.pendingDeleteFlashcardIds.some(id => card.id == id)
                );
                
                const actualDeleteCount = initialCount - this.app.flashcards.length;
                
                this.displayFlashcards();
                this.updateDeckOptions();
                
                // Show success message and update flashcard display if on flashcard page
                if (this.app.showToast) {
                    if (actualDeleteCount > 0) {
                        this.app.showToast(`Deleted ${actualDeleteCount} flashcard${actualDeleteCount !== 1 ? 's' : ''}`, 'success');
                    } else {
                        this.app.showToast('No flashcards were deleted - IDs not found', 'warning');
                    }
                }
            } catch (error) {
                console.error('Error deleting flashcards:', error);
                this.app.showToast('Failed to delete flashcards. Please try again.', 'error');
            }
            // Don't call showFlashcard on content management page
            
            this.pendingDeleteFlashcardIds = null;
        }
        this.app.uiManager.closeModal('bulk-delete-flashcards-modal');
    }

    // Delete selected quizzes
    deleteSelectedQuizzes() {
        const selectedCheckboxes = document.querySelectorAll('.quiz-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));
        
        if (selectedIds.length === 0) {
            if (this.app.showToast) {
                this.app.showToast('Please select quizzes to delete.', 'warning');
            }
            return;
        }
        
        // Store the selected IDs for the confirmation modal
        this.pendingDeleteQuizIds = selectedIds;
        
        // Show custom confirmation modal
        const message = document.getElementById('bulk-delete-quizzes-message');
        message.textContent = `Are you sure you want to delete ${selectedIds.length} quiz question(s)?`;
        
        this.app.uiManager.openModal('bulk-delete-quizzes-modal');
    }
    
    async confirmBulkDeleteQuizzes() {
        if (this.pendingDeleteQuizIds && this.pendingDeleteQuizIds.length > 0) {
            const deleteCount = this.pendingDeleteQuizIds.length;
            const initialCount = this.app.quizzes.length;
            
            try {
                // Delete from Supabase
                for (const quizId of this.pendingDeleteQuizIds) {
                    await this.app.supabaseDataService.deleteQuiz(quizId);
                }
                
                // Remove from local array
                this.app.quizzes = this.app.quizzes.filter(quiz => !this.pendingDeleteQuizIds.includes(quiz.id));
                
                const actualDeleteCount = initialCount - this.app.quizzes.length;
                
                this.displayQuizzes();
                this.updateDeckOptions();
                
                // Show success message
                if (actualDeleteCount > 0) {
                    this.app.showToast(`Deleted ${actualDeleteCount} quiz${actualDeleteCount !== 1 ? 'zes' : ''}`, 'success');
                } else {
                    this.app.showToast('No quizzes were deleted - IDs not found', 'warning');
                }
            } catch (error) {
                console.error('Error deleting quizzes:', error);
                this.app.showToast('Failed to delete quizzes. Please try again.', 'error');
            }
            
            this.pendingDeleteQuizIds = null;
        }
        this.app.uiManager.closeModal('bulk-delete-quizzes-modal');
    }

    // Toggle select all flashcards
    toggleSelectAllFlashcards() {
        const checkboxes = document.querySelectorAll('.flashcard-checkbox');
        const selectAllBtn = document.getElementById('select-all-flashcards');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        if (selectAllBtn) {
            selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
        }
    }

    // Toggle quiz selection styling
    toggleQuizSelection(quizId) {
        const checkbox = document.querySelector(`input.quiz-checkbox[data-id="${quizId}"]`);
        const item = document.querySelector(`.quiz-item[data-id="${quizId}"]`);
        
        if (checkbox && item) {
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
    }

    // Toggle select all quizzes
    toggleSelectAllQuizzes() {
        const checkboxes = document.querySelectorAll('.quiz-checkbox');
        const selectAllBtn = document.getElementById('select-all-quizzes');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            this.toggleQuizSelection(cb.dataset.id);
        });
        
        if (selectAllBtn) {
            selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
        }
    }
}

// Make ContentManager available globally
if (typeof window !== 'undefined') {
    window.ContentManager = ContentManager;
}