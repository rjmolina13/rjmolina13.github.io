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
    }

    // Display flashcards in content management
    displayFlashcards() {
        const flashcardsContainer = document.getElementById('flashcards-list');
        if (!flashcardsContainer) return;

        const searchTerm = document.getElementById('flashcard-search')?.value?.toLowerCase() || '';
        const deckFilter = document.getElementById('deck-filter')?.value || 'all';
        const difficultyFilter = document.getElementById('difficulty-filter')?.value || 'all';

        let filteredCards = this.app.flashcards.filter(card => {
            const matchesSearch = card.front.toLowerCase().includes(searchTerm) ||
                                card.back.toLowerCase().includes(searchTerm) ||
                                card.deck.toLowerCase().includes(searchTerm);
            const matchesDeck = deckFilter === 'all' || card.deck === deckFilter;
            const matchesDifficulty = difficultyFilter === 'all' || card.difficulty === difficultyFilter;
            
            return matchesSearch && matchesDeck && matchesDifficulty;
        });

        // Update count
        const countElement = document.getElementById('flashcard-count');
        if (countElement) {
            countElement.textContent = `${filteredCards.length} flashcard(s)`;
        }

        if (filteredCards.length === 0) {
            flashcardsContainer.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-inbox"></i>
                    <p>No flashcards found.</p>
                </div>
            `;
            return;
        }

        flashcardsContainer.innerHTML = filteredCards.map(card => `
            <div class="flashcard-item">
                <div class="flashcard-checkbox">
                    <input type="checkbox" class="flashcard-checkbox-input" value="${card.id}">
                </div>
                <div class="flashcard-content">
                    <div class="flashcard-front">
                        <strong>Front:</strong> ${card.front}
                    </div>
                    <div class="flashcard-back">
                        <strong>Back:</strong> ${card.back}
                    </div>
                    <div class="flashcard-meta">
                        <span class="deck-tag">${card.deck}</span>
                        <span class="difficulty-tag difficulty-${card.difficulty}">${card.difficulty}</span>
                    </div>
                </div>
                <div class="flashcard-actions">
                    <button class="edit-btn edit-flashcard-btn" data-card-id="${card.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn delete-flashcard-btn" data-card-id="${card.id}">
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

        const searchTerm = document.getElementById('quiz-content-search')?.value?.toLowerCase() || '';
        const deckFilter = document.getElementById('quiz-content-deck-filter')?.value || 'all';
        const difficultyFilter = document.getElementById('quiz-content-difficulty-filter')?.value || 'all';

        let filteredQuizzes = this.app.quizzes.filter(quiz => {
            const matchesSearch = quiz.question.toLowerCase().includes(searchTerm) ||
                                quiz.correctAnswer.toLowerCase().includes(searchTerm) ||
                                quiz.deck.toLowerCase().includes(searchTerm);
            const matchesDeck = deckFilter === 'all' || quiz.deck === deckFilter;
            const matchesDifficulty = difficultyFilter === 'all' || quiz.difficulty === difficultyFilter;
            
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
            quizzesContainer.innerHTML = '';
            return;
        }

        quizzesContainer.innerHTML = filteredQuizzes.map(quiz => `
            <div class="quiz-item">
                <div class="quiz-checkbox">
                    <input type="checkbox" class="quiz-checkbox" value="${quiz.id}">
                </div>
                <div class="quiz-content">
                    <div class="quiz-question">
                        <strong>Question:</strong> ${quiz.question}
                    </div>
                    <div class="quiz-answer">
                        <strong>Correct Answer:</strong> ${quiz.correctAnswer}
                    </div>
                    <div class="quiz-wrong-answers">
                        <strong>Wrong Answers:</strong> ${quiz.wrongAnswers.join(', ')}
                    </div>
                    <div class="quiz-meta">
                        <span class="deck-tag">${quiz.deck}</span>
                        <span class="difficulty-tag difficulty-${quiz.difficulty}">${quiz.difficulty}</span>
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="edit-btn edit-quiz-btn" data-quiz-id="${quiz.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn delete-quiz-btn" data-quiz-id="${quiz.id}">
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

    // Update deck options in dropdowns
    updateDeckOptions() {
        const allDecks = [...new Set([
            ...this.app.flashcards.map(card => card.deck),
            ...this.app.quizzes.map(quiz => quiz.deck)
        ])].filter(deck => deck);

        // Update flashcard deck filter
        const flashcardDeckFilter = document.getElementById('deck-filter');
        if (flashcardDeckFilter) {
            const currentValue = flashcardDeckFilter.value;
            flashcardDeckFilter.innerHTML = `
                <option value="all">All Decks</option>
                ${allDecks.map(deck => `<option value="${deck}">${deck}</option>`).join('')}
            `;
            if (allDecks.includes(currentValue)) {
                flashcardDeckFilter.value = currentValue;
            }
        }

        // Update quiz deck filter
        const quizDeckFilter = document.getElementById('quiz-content-deck-filter');
        if (quizDeckFilter) {
            const currentValue = quizDeckFilter.value;
            quizDeckFilter.innerHTML = `
                <option value="all">All Decks</option>
                ${allDecks.map(deck => `<option value="${deck}">${deck}</option>`).join('')}
            `;
            if (allDecks.includes(currentValue)) {
                quizDeckFilter.value = currentValue;
            }
        }
    }

    // Add new flashcard
    addFlashcard(flashcardData) {
        const newCard = {
            id: Date.now().toString(),
            ...flashcardData,
            createdAt: new Date().toISOString()
        };
        
        this.app.flashcards.push(newCard);
        this.app.dataManager.saveData();
        this.displayFlashcards();
        this.updateDeckOptions();
    }

    // Update existing flashcard
    updateFlashcard(cardId, flashcardData) {
        const index = this.app.flashcards.findIndex(card => card.id === cardId);
        if (index !== -1) {
            this.app.flashcards[index] = {
                ...this.app.flashcards[index],
                ...flashcardData,
                updatedAt: new Date().toISOString()
            };
            this.app.dataManager.saveData();
            this.displayFlashcards();
            this.updateDeckOptions();
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
    
    confirmDeleteFlashcard() {
        if (this.pendingDeleteFlashcardId) {
            const index = this.app.flashcards.findIndex(card => card.id === this.pendingDeleteFlashcardId);
            if (index !== -1) {
                this.app.flashcards.splice(index, 1);
                this.app.dataManager.saveData();
                this.displayFlashcards();
                this.updateDeckOptions();
            }
            this.pendingDeleteFlashcardId = null;
        }
        this.app.uiManager.closeModal('delete-flashcard-modal');
    }

    // Add new quiz
    addQuiz(quizData) {
        const newQuiz = {
            id: Date.now().toString(),
            ...quizData,
            createdAt: new Date().toISOString()
        };
        
        this.app.quizzes.push(newQuiz);
        this.app.dataManager.saveData();
        this.displayQuizzes();
        this.updateDeckOptions();
    }

    // Update existing quiz
    updateQuiz(quizId, quizData) {
        const index = this.app.quizzes.findIndex(quiz => quiz.id === quizId);
        if (index !== -1) {
            this.app.quizzes[index] = {
                ...this.app.quizzes[index],
                ...quizData,
                updatedAt: new Date().toISOString()
            };
            this.app.dataManager.saveData();
            this.displayQuizzes();
            this.updateDeckOptions();
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
    
    confirmDeleteQuiz() {
        if (this.pendingDeleteQuizId) {
            const index = this.app.quizzes.findIndex(quiz => quiz.id === this.pendingDeleteQuizId);
            if (index !== -1) {
                this.app.quizzes.splice(index, 1);
                this.app.dataManager.saveData();
                this.displayQuizzes();
                this.updateDeckOptions();
            }
            this.pendingDeleteQuizId = null;
        }
        this.app.uiManager.closeModal('delete-quiz-modal');
    }

    // Delete selected flashcards
    deleteSelectedFlashcards() {
        const selectedCheckboxes = document.querySelectorAll('.flashcard-checkbox-input:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
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
    
    confirmBulkDeleteFlashcards() {
        if (this.pendingDeleteFlashcardIds && this.pendingDeleteFlashcardIds.length > 0) {
            const deleteCount = this.pendingDeleteFlashcardIds.length;
            this.app.flashcards = this.app.flashcards.filter(card => !this.pendingDeleteFlashcardIds.includes(card.id));
            this.app.dataManager.saveData();
            this.displayFlashcards();
            this.updateDeckOptions();
            
            // Show success message and update flashcard display if on flashcard page
            if (this.app.showToast) {
                this.app.showToast(`Deleted ${deleteCount} flashcard(s)`, 'success');
            }
            if (this.app.flashcardManager && this.app.flashcardManager.showFlashcard) {
                this.app.flashcardManager.showFlashcard(0);
            }
            
            this.pendingDeleteFlashcardIds = null;
        }
        this.app.uiManager.closeModal('bulk-delete-flashcards-modal');
    }

    // Delete selected quizzes
    deleteSelectedQuizzes() {
        const selectedCheckboxes = document.querySelectorAll('.quiz-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
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
    
    confirmBulkDeleteQuizzes() {
        if (this.pendingDeleteQuizIds && this.pendingDeleteQuizIds.length > 0) {
            this.app.quizzes = this.app.quizzes.filter(quiz => !this.pendingDeleteQuizIds.includes(quiz.id));
            this.app.dataManager.saveData();
            this.displayQuizzes();
            this.updateDeckOptions();
            this.pendingDeleteQuizIds = null;
        }
        this.app.uiManager.closeModal('bulk-delete-quizzes-modal');
    }

    // Toggle select all flashcards
    toggleSelectAllFlashcards() {
        const checkboxes = document.querySelectorAll('.flashcard-checkbox-input');
        const selectAllBtn = document.getElementById('select-all-flashcards');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        if (selectAllBtn) {
            selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
        }
    }

    // Toggle select all quizzes
    toggleSelectAllQuizzes() {
        const checkboxes = document.querySelectorAll('.quiz-checkbox');
        const selectAllBtn = document.getElementById('select-all-quizzes');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        if (selectAllBtn) {
            selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManager;
}