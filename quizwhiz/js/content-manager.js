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
                    <button class="btn btn-sm btn-outline edit-flashcard-btn" data-card-id="${card.id}" title="Edit flashcard">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-flashcard-btn" data-card-id="${card.id}" title="Delete flashcard">
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
                    <div class="quiz-question-management">${this.truncateText(quiz.question, 100)}</div>
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
                    <button class="btn btn-sm btn-outline edit-quiz-btn" data-quiz-id="${quiz.id}" title="Edit quiz question">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-quiz-btn" data-quiz-id="${quiz.id}" title="Delete quiz question">
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
        const allDecks = [...new Set([
            ...this.app.flashcards.map(card => card.deck),
            ...this.app.quizzes.map(quiz => quiz.deck)
        ])].filter(deck => deck);

        // Update flashcard deck filter
        const flashcardDeckFilter = document.getElementById('manage-deck-filter');
        if (flashcardDeckFilter) {
            const currentValue = flashcardDeckFilter.value;
            flashcardDeckFilter.innerHTML = `
                <option value="">All Decks</option>
                ${allDecks.map(deck => `<option value="${deck}">${deck}</option>`).join('')}
            `;
            if (allDecks.includes(currentValue)) {
                flashcardDeckFilter.value = currentValue;
            }
        }

        // Update quiz deck filter
        const quizDeckFilter = document.getElementById('manage-quiz-deck-filter');
        if (quizDeckFilter) {
            const currentValue = quizDeckFilter.value;
            quizDeckFilter.innerHTML = `
                <option value="">All Decks</option>
                ${allDecks.map(deck => `<option value="${deck}">${deck}</option>`).join('')}
            `;
            if (allDecks.includes(currentValue)) {
                quizDeckFilter.value = currentValue;
            }
        }
        
        // Update deck suggestions for all modals
        this.app.uiManager.populateAllDeckSuggestions();
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
        // Use loose equality to handle string/number ID mismatches
        const index = this.app.flashcards.findIndex(card => card.id == cardId);
        if (index !== -1) {
            this.app.flashcards[index] = {
                ...this.app.flashcards[index],
                ...flashcardData,
                updatedAt: new Date().toISOString()
            };
            this.app.dataManager.saveData();
            this.displayFlashcards();
            this.updateDeckOptions();
            this.app.showToast('Flashcard updated successfully!', 'success');
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
            // Use loose equality to handle string/number ID mismatches
            const index = this.app.flashcards.findIndex(card => card.id == this.pendingDeleteFlashcardId);
            if (index !== -1) {
                this.app.flashcards.splice(index, 1);
                this.app.dataManager.saveData();
                this.displayFlashcards();
                this.updateDeckOptions();
                this.app.showToast('Flashcard deleted successfully!', 'success');
            } else {
                console.error('Flashcard not found for deletion. ID:', this.pendingDeleteFlashcardId);
                this.app.showToast('Failed to delete flashcard - not found', 'error');
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
            this.app.showToast('Quiz updated successfully!', 'success');
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
                this.app.showToast('Quiz deleted successfully!', 'success');
            } else {
                this.app.showToast('Failed to delete quiz - not found', 'error');
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
            const initialCount = this.app.flashcards.length;
            
            // Use loose equality to handle string/number ID mismatches
            this.app.flashcards = this.app.flashcards.filter(card => 
                !this.pendingDeleteFlashcardIds.some(id => card.id == id)
            );
            
            const actualDeleteCount = initialCount - this.app.flashcards.length;
            
            this.app.dataManager.saveData();
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
            const deleteCount = this.pendingDeleteQuizIds.length;
            const initialCount = this.app.quizzes.length;
            
            this.app.quizzes = this.app.quizzes.filter(quiz => !this.pendingDeleteQuizIds.includes(quiz.id));
            
            const actualDeleteCount = initialCount - this.app.quizzes.length;
            
            this.app.dataManager.saveData();
            this.displayQuizzes();
            this.updateDeckOptions();
            
            // Show success message
            if (actualDeleteCount > 0) {
                this.app.showToast(`Deleted ${actualDeleteCount} quiz${actualDeleteCount !== 1 ? 'zes' : ''}`, 'success');
            } else {
                this.app.showToast('No quizzes were deleted - IDs not found', 'warning');
            }
            
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