// Flashcard Management Module

class FlashcardManager {
    constructor(app) {
        this.app = app;
        this.currentIndex = 0;
        this.currentDeck = 'all';
        this.currentDifficulty = 'all';
        this.filteredFlashcards = [];
        this.deckDropdown = null;
        this.difficultyDropdown = null;
    }

    // Flashcard Navigation
    showFlashcard(index = 0) {
        this.filteredFlashcards = this.getFilteredFlashcards();
        
        if (this.filteredFlashcards.length === 0) {
            document.getElementById('flashcard-content').innerHTML = `
                <div class="no-flashcards">
                    <i class="fas fa-inbox"></i>
                    <h3>No flashcards available</h3>
                    <p>Add some flashcards to get started!</p>
                    <button class="btn btn-primary" onclick="openAddFlashcardModal()">
                        <i class="fas fa-plus-circle"></i> Add Flashcard
                    </button>
                </div>
            `;
            return;
        }

        this.currentIndex = Math.max(0, Math.min(index, this.filteredFlashcards.length - 1));
        const flashcard = this.filteredFlashcards[this.currentIndex];
        
        // Ensure flashcard has a difficulty value (fallback for older flashcards)
        if (!flashcard.difficulty) {
            flashcard.difficulty = 'medium';
            // Update the original flashcard in the app data - use loose equality for ID comparison
            const originalCard = this.app.flashcards.find(card => card.id == flashcard.id);
            if (originalCard) {
                originalCard.difficulty = 'medium';
                this.app.dataManager.saveData();
            }
        }
        
        document.getElementById('flashcard-content').innerHTML = `
            <div class="flashcard ${this.app.settings.animations ? 'animate' : ''}" id="current-flashcard">
                <div class="flashcard-inner" onclick="app.flashcardManager.flipCard()">
                    <div class="flashcard-front">
                        <div class="flashcard-header">
                            <span class="deck-badge">${flashcard.deck}</span>
                            <span class="difficulty-badge difficulty-${flashcard.difficulty || 'medium'}">${flashcard.difficulty || 'medium'}</span>
                        </div>
                        <div class="flashcard-question">
                            ${flashcard.question}
                        </div>
                        <div class="flashcard-footer">
                            <button class="btn btn-secondary flip-hint" onclick="event.stopPropagation(); app.flashcardManager.flipCard()">
                                <i class="fas fa-hand-pointer"></i> Click the card to flip
                            </button>
                        </div>
                    </div>
                    <div class="flashcard-back">
                        <div class="flashcard-header">
                            <span class="deck-badge">${flashcard.deck}</span>
                            <span class="difficulty-badge difficulty-${flashcard.difficulty}">${flashcard.difficulty}</span>
                        </div>
                        <div class="flashcard-answer">
                            ${flashcard.answer}
                        </div>
                        <div class="flashcard-footer">
                            <button class="btn btn-secondary flip-hint" onclick="event.stopPropagation(); app.flashcardManager.flipCard()">
                                <i class="fas fa-hand-pointer"></i> Click the card to flip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateFlashcardNavigation();
        this.updateFlashcardCounter();
        
        // Auto-flip if enabled
        if (this.app.settings.autoFlip > 0) {
            setTimeout(() => this.flipCard(), this.app.settings.autoFlip * 1000);
        }
        
        // Ensure flashcard gets focus for keyboard navigation
        setTimeout(() => {
            const flashcardContainer = document.getElementById('current-flashcard');
            if (flashcardContainer) {
                flashcardContainer.setAttribute('tabindex', '0');
                flashcardContainer.focus();
            }
        }, 50);
    }

    flipCard() {
        const flashcard = document.getElementById('current-flashcard');
        if (flashcard) {
            flashcard.classList.toggle('flipped');
        }
    }

    displayCurrentFlashcard() {
        if (this.filteredFlashcards.length === 0) {
            document.getElementById('flashcard-content').innerHTML = `
                <div class="no-flashcards">
                    <i class="fas fa-inbox"></i>
                    <h3>No flashcards available</h3>
                    <p>Add some flashcards to get started!</p>
                    <button class="btn btn-primary" onclick="openAddFlashcardModal()">
                        <i class="fas fa-plus-circle"></i> Add Flashcard
                    </button>
                </div>
            `;
            return;
        }

        this.currentIndex = Math.max(0, Math.min(this.currentIndex, this.filteredFlashcards.length - 1));
        const flashcard = this.filteredFlashcards[this.currentIndex];
        
        // Ensure flashcard has a difficulty value (fallback for older flashcards)
        if (!flashcard.difficulty) {
            flashcard.difficulty = 'medium';
            // Update the original flashcard in the app data
            const originalCard = this.app.flashcards.find(card => card.id === flashcard.id);
            if (originalCard) {
                originalCard.difficulty = 'medium';
                this.app.dataManager.saveData();
            }
        }
        
        document.getElementById('flashcard-content').innerHTML = `
            <div class="flashcard ${this.app.settings.animations ? 'animate' : ''}" id="current-flashcard">
                <div class="flashcard-inner" onclick="app.flashcardManager.flipCard()">
                    <div class="flashcard-front">
                        <div class="flashcard-header">
                            <span class="deck-badge">${flashcard.deck}</span>
                            <span class="difficulty-badge difficulty-${flashcard.difficulty || 'medium'}">${flashcard.difficulty || 'medium'}</span>
                        </div>
                        <div class="flashcard-question">
                            ${flashcard.question}
                        </div>
                        <div class="flashcard-footer">
                            <button class="btn btn-secondary flip-hint" onclick="event.stopPropagation(); app.flashcardManager.flipCard()">
                                <i class="fas fa-hand-pointer"></i> Click the card to flip
                            </button>
                        </div>
                    </div>
                    <div class="flashcard-back">
                        <div class="flashcard-header">
                            <span class="deck-badge">${flashcard.deck}</span>
                            <span class="difficulty-badge difficulty-${flashcard.difficulty}">${flashcard.difficulty}</span>
                        </div>
                        <div class="flashcard-answer">
                            ${flashcard.answer}
                        </div>
                        <div class="flashcard-footer">
                            <button class="btn btn-secondary flip-hint" onclick="event.stopPropagation(); app.flashcardManager.flipCard()">
                                <i class="fas fa-hand-pointer"></i> Click the card to flip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateFlashcardNavigation();
        this.updateFlashcardCounter();
        
        // Auto-flip if enabled
        if (this.app.settings.autoFlip > 0) {
            setTimeout(() => this.flipCard(), this.app.settings.autoFlip * 1000);
        }
    }

    nextFlashcard() {
        if (this.currentIndex < this.filteredFlashcards.length - 1) {
            this.currentIndex++;
            this.displayCurrentFlashcard();
        } else if (this.app.settings.shuffleDefault) {
            this.shuffleFlashcards();
        }
    }

    previousFlashcard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentFlashcard();
        }
    }

    shuffleFlashcards() {
        // First ensure we have the current filtered flashcards
        if (this.filteredFlashcards.length === 0) {
            this.filteredFlashcards = this.getFilteredFlashcards();
        }
        this.filteredFlashcards = this.app.shuffleArray([...this.filteredFlashcards]);
        this.currentIndex = 0;
        this.displayCurrentFlashcard();
        this.app.showToast('Flashcards shuffled!', 'info');
    }

    sortFlashcards() {
        // First ensure we have the current filtered flashcards
        if (this.filteredFlashcards.length === 0) {
            this.filteredFlashcards = this.getFilteredFlashcards();
        }
        this.filteredFlashcards = [...this.filteredFlashcards].sort((a, b) => {
            // Sort chronologically by creation time (oldest first)
            return new Date(a.created) - new Date(b.created);
        });
        this.currentIndex = 0;
        this.displayCurrentFlashcard();
        this.app.showToast('Flashcards sorted by creation order!', 'info');
    }

    // Deck Management
    filterByDeck(deck) {
        this.currentDeck = deck;
        this.currentIndex = 0;
        this.showFlashcard(0);
        // Don't call updateDeckSelector here to prevent infinite loop
    }

    // Difficulty Management
    filterByDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.currentIndex = 0;
        this.showFlashcard(0);
        // Don't call updateDifficultySelector here to prevent infinite loop
    }

    updateDifficultySelector() {
        // Check if difficulty feature is enabled
        if (!this.app.settings.difficultyFeature) {
            return;
        }
        
        // Initialize custom dropdown if not already done
        if (!this.difficultyDropdown) {
            this.difficultyDropdown = new CustomDropdown('difficulty-filter-container');
            this.difficultyDropdown.onChange((value) => {
                this.filterByDifficulty(value);
            });
        }

        const dropdown = document.getElementById('difficulty-filter-dropdown');
        if (!dropdown) return;

        const difficulties = [
            { value: 'all', text: 'All Difficulties', icon: '<i class="fas fa-smile"></i>' },
            { value: 'easy', text: 'Easy', icon: '<i class="fas fa-smile difficulty-icon difficulty-easy"></i>' },
            { value: 'medium', text: 'Medium', icon: '<i class="fas fa-meh difficulty-icon difficulty-medium"></i>' },
            { value: 'hard', text: 'Hard', icon: '<i class="fas fa-frown difficulty-icon difficulty-hard"></i>' }
        ];
        
        // Clear existing options
        this.difficultyDropdown.clearOptions();
        
        // Add difficulty options with face icons and CSS classes
        difficulties.forEach(difficulty => {
            this.difficultyDropdown.addOption(difficulty.value, difficulty.text, difficulty.icon);
        });
        
        // Set current selection silently to prevent infinite loop
        this.difficultyDropdown.setValue(this.currentDifficulty, true);
    }

    getFilteredFlashcards() {
        let filtered = this.app.flashcards;
        
        // Filter by deck
        if (this.currentDeck !== 'all') {
            filtered = filtered.filter(card => card.deck === this.currentDeck);
        }
        
        // Filter by difficulty
        if (this.currentDifficulty !== 'all') {
            filtered = filtered.filter(card => card.difficulty === this.currentDifficulty);
        }
        
        return filtered;
    }

    updateDeckSelector() {
        // Initialize custom dropdown if not already done
        if (!this.deckDropdown) {
            this.deckDropdown = new CustomDropdown('deck-selector-container');
            this.deckDropdown.onChange((value) => {
                this.filterByDeck(value);
            });
        }

        const dropdown = document.getElementById('deck-selector-dropdown');
        if (!dropdown) return;

        const decks = ['all', ...new Set(this.app.flashcards.map(card => card.deck))];
        
        // Clear existing options except the first one
        this.deckDropdown.clearOptions();
        
        // Add deck options with number icons
        decks.forEach((deck, index) => {
            const value = deck;
            const text = deck === 'all' ? 'All Decks' : deck;
            let icon;
            
            if (deck === 'all') {
                icon = '<i class="fas fa-layer-group"></i>';
            } else {
                // Use number icons for individual decks (1-9, then fallback to generic icon)
                const numberIcons = [
                    '<i class="fas fa-1"></i>',
                    '<i class="fas fa-2"></i>',
                    '<i class="fas fa-3"></i>',
                    '<i class="fas fa-4"></i>',
                    '<i class="fas fa-5"></i>',
                    '<i class="fas fa-6"></i>',
                    '<i class="fas fa-7"></i>',
                    '<i class="fas fa-8"></i>',
                    '<i class="fas fa-9"></i>'
                ];
                icon = numberIcons[index - 1] || '<i class="fas fa-folder"></i>';
            }
            
            this.deckDropdown.addOption(value, text, icon);
        });
        
        // Set current selection silently to prevent infinite loop
        this.deckDropdown.setValue(this.currentDeck, true);
    }

    // Difficulty Management
    markDifficulty(difficulty) {
        if (this.filteredFlashcards.length === 0) return;
        
        const flashcard = this.filteredFlashcards[this.currentIndex];
        const originalCard = this.app.flashcards.find(card => card.id === flashcard.id);
        
        if (originalCard) {
            originalCard.difficulty = difficulty;
            originalCard.lastReviewed = new Date().toISOString();
            originalCard.reviewCount = (originalCard.reviewCount || 0) + 1;
            
            this.app.dataManager.saveData();
            
            // Record study session for streak tracking
            if (this.app.dataManager) {
                this.app.dataManager.recordStudySession();
            }
            
            this.showFlashcard(this.currentIndex); // Refresh to show updated difficulty
            this.app.showToast(`Marked as ${difficulty}`, 'success');
            
            // Update statistics
            this.app.stats.totalReviews = (this.app.stats.totalReviews || 0) + 1;
        }
    }

    // Flashcard CRUD Operations
    addFlashcard(question, answer, deck = 'General', difficulty = 'medium') {
        const newFlashcard = {
            id: Date.now() + Math.random(),
            question: question.trim(),
            answer: answer.trim(),
            deck: deck.trim(),
            difficulty,
            created: new Date().toISOString(),
            lastReviewed: null,
            reviewCount: 0
        };

        this.app.flashcards.push(newFlashcard);
        this.app.dataManager.saveData();
        this.app.updateUI();
        this.updateFlashcardCounter();
        this.app.showToast('Flashcard added successfully!', 'success');
        
        return newFlashcard;
    }

    editFlashcard(id, updates) {
        const flashcard = this.app.flashcards.find(card => card.id == id);
        if (flashcard) {
            Object.assign(flashcard, updates);
            this.app.dataManager.saveData();
            this.app.updateUI();
            this.updateFlashcardCounter();
            this.app.showToast('Flashcard updated successfully!', 'success');
        }
    }

    deleteFlashcard(id) {
        // Use loose equality to handle string/number ID mismatches
        const index = this.app.flashcards.findIndex(card => card.id == id);
        if (index !== -1) {
            this.app.flashcards.splice(index, 1);
            this.app.dataManager.saveData();
            this.app.updateUI();
            this.updateFlashcardCounter();
            this.app.showToast('Flashcard deleted successfully!', 'success');
            
            // Adjust current index if necessary
            if (this.currentIndex >= this.filteredFlashcards.length - 1) {
                this.currentIndex = Math.max(0, this.filteredFlashcards.length - 2);
            }
            this.showFlashcard(this.currentIndex);
        }
    }

    // UI Updates
    updateFlashcardNavigation() {
        const prevBtn = document.getElementById('prev-flashcard');
        const nextBtn = document.getElementById('next-flashcard');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.filteredFlashcards.length - 1;
        }
    }
    updateFlashcardCounter() {
        const currentCardNum = document.getElementById('current-card-num');
        const totalCards = document.getElementById('total-cards');
        
        if (currentCardNum && totalCards) {
            if (this.filteredFlashcards.length > 0) {
                currentCardNum.textContent = this.currentIndex + 1;
                totalCards.textContent = this.filteredFlashcards.length;
            } else {
                currentCardNum.textContent = '0';
                totalCards.textContent = '0';
            }
        }
    }

    // Search and Filter
    searchFlashcards(query) {
        if (!query.trim()) {
            this.filteredFlashcards = this.getFilteredFlashcards();
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredFlashcards = this.getFilteredFlashcards().filter(card => 
                card.question.toLowerCase().includes(searchTerm) ||
                card.answer.toLowerCase().includes(searchTerm) ||
                card.deck.toLowerCase().includes(searchTerm)
            );
        }
        
        this.currentIndex = 0;
        this.showFlashcard(0);
    }

    // Statistics
    getFlashcardStats() {
        const total = this.app.flashcards.length;
        const byDifficulty = {
            easy: this.app.flashcards.filter(card => card.difficulty === 'easy').length,
            medium: this.app.flashcards.filter(card => card.difficulty === 'medium').length,
            hard: this.app.flashcards.filter(card => card.difficulty === 'hard').length
        };
        const byDeck = {};
        
        this.app.flashcards.forEach(card => {
            byDeck[card.deck] = (byDeck[card.deck] || 0) + 1;
        });
        
        const reviewed = this.app.flashcards.filter(card => card.lastReviewed).length;
        const averageReviews = total > 0 ? 
            this.app.flashcards.reduce((sum, card) => sum + (card.reviewCount || 0), 0) / total : 0;
        
        return {
            total,
            byDifficulty,
            byDeck,
            reviewed,
            averageReviews: Math.round(averageReviews * 100) / 100
        };
    }

    // Bulk Operations
    bulkUpdateDifficulty(cardIds, difficulty) {
        let updated = 0;
        cardIds.forEach(id => {
            const card = this.app.flashcards.find(c => c.id === id);
            if (card) {
                card.difficulty = difficulty;
                updated++;
            }
        });
        
        if (updated > 0) {
            this.app.dataManager.saveData();
            this.app.updateUI();
            this.app.showToast(`Updated ${updated} flashcards`, 'success');
        }
    }

    bulkMoveToDeck(cardIds, deck) {
        let moved = 0;
        cardIds.forEach(id => {
            const card = this.app.flashcards.find(c => c.id === id);
            if (card) {
                card.deck = deck;
                moved++;
            }
        });
        
        if (moved > 0) {
            this.app.dataManager.saveData();
            this.app.updateUI();
            this.app.showToast(`Moved ${moved} flashcards to ${deck}`, 'success');
        }
    }

    bulkDelete(cardIds) {
        // Store the card IDs for the confirmation modal
        this.app.contentManager.pendingDeleteFlashcardIds = cardIds;
        
        // Show custom confirmation modal
        const message = document.getElementById('bulk-delete-flashcards-message');
        message.textContent = `Are you sure you want to delete ${cardIds.length} flashcard(s)?`;
        
        this.app.uiManager.openModal('bulk-delete-flashcards-modal');
    }

    // Flashcard Management Interface
    renderFlashcardManagement() {
        const container = document.getElementById('flashcard-management-list');
        if (!container) return;

        const searchQuery = document.getElementById('manage-search')?.value.toLowerCase() || '';
        const deckFilter = document.getElementById('manage-deck-filter')?.value || '';
        const difficultyFilter = document.getElementById('manage-difficulty-filter')?.value || '';

        let filteredCards = this.app.flashcards;

        // Apply filters
        if (searchQuery) {
            filteredCards = filteredCards.filter(card => 
                card.question.toLowerCase().includes(searchQuery) ||
                card.answer.toLowerCase().includes(searchQuery) ||
                card.deck.toLowerCase().includes(searchQuery)
            );
        }

        if (deckFilter) {
            filteredCards = filteredCards.filter(card => card.deck === deckFilter);
        }

        if (difficultyFilter) {
            filteredCards = filteredCards.filter(card => card.difficulty === difficultyFilter);
        }

        // Update count info
        const displayedCount = document.getElementById('displayed-count');
        const totalCount = document.getElementById('total-count');
        if (displayedCount && totalCount) {
            displayedCount.textContent = filteredCards.length;
            totalCount.textContent = this.app.flashcards.length;
        }

        // Render flashcard list
        if (filteredCards.length === 0) {
            container.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-search"></i>
                    <p>${this.app.flashcards.length === 0 ? 'No flashcards found. Create some flashcards to get started!' : 'No flashcards match your current filters.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredCards.map(card => `
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
                    <button class="action-btn edit" onclick="app.flashcardManager.openEditFlashcardModal('${card.id}')" title="Edit flashcard">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="app.flashcardManager.deleteFlashcardFromList('${card.id}')" title="Delete flashcard">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Update bulk action buttons state
        this.updateBulkActionButtons();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    updateFlashcardFilters() {
        // Update deck filter options
        const deckFilter = document.getElementById('manage-deck-filter');
        if (deckFilter) {
            const decks = [...new Set(this.app.flashcards.map(card => card.deck))];
            deckFilter.innerHTML = '<option value="">All Decks</option>' + 
                decks.map(deck => `<option value="${deck}">${deck}</option>`).join('');
        }
    }

    handleFlashcardSearch() {
        this.renderFlashcardManagement();
    }

    handleFlashcardFilter() {
        this.renderFlashcardManagement();
    }

    toggleFlashcardSelection(cardId) {
        const checkbox = document.querySelector(`input[data-id="${cardId}"]`);
        const item = document.querySelector(`.flashcard-item[data-id="${cardId}"]`);
        
        if (checkbox && item) {
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
        
        this.updateBulkActionButtons();
    }

    toggleAllFlashcards() {
        const checkboxes = document.querySelectorAll('.flashcard-checkbox');
        const selectAllBtn = document.getElementById('select-all-flashcards');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
            this.toggleFlashcardSelection(checkbox.dataset.id);
        });
        
        selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }

    getSelectedFlashcardIds() {
        const checkboxes = document.querySelectorAll('.flashcard-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.dataset.id);
    }

    updateBulkActionButtons() {
        const selectedIds = this.getSelectedFlashcardIds();
        const bulkButtons = document.querySelectorAll('.bulk-action-btn');
        const selectAllBtn = document.getElementById('select-all-flashcards');
        
        bulkButtons.forEach(btn => {
            btn.disabled = selectedIds.length === 0;
        });
        
        if (selectAllBtn) {
            const allCheckboxes = document.querySelectorAll('.flashcard-checkbox');
            const allChecked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
            selectAllBtn.textContent = allChecked ? 'Deselect All' : 'Select All';
        }
    }

    bulkDeleteSelected() {
        const selectedIds = this.getSelectedFlashcardIds();
        if (selectedIds.length === 0) {
            this.app.showToast('No flashcards selected', 'warning');
            return;
        }
        
        this.bulkDelete(selectedIds);
        this.renderFlashcardManagement();
    }

    bulkUpdateSelectedDifficulty() {
        const selectedIds = this.getSelectedFlashcardIds();
        if (selectedIds.length === 0) {
            this.app.showToast('No flashcards selected', 'warning');
            return;
        }
        
        const difficulty = prompt('Enter difficulty (easy, medium, hard):');
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
            this.bulkUpdateDifficulty(selectedIds, difficulty.toLowerCase());
            this.renderFlashcardManagement();
        } else {
            this.app.showToast('Invalid difficulty. Use: easy, medium, or hard', 'error');
        }
    }

    bulkMoveSelectedToDeck() {
        const selectedIds = this.getSelectedFlashcardIds();
        if (selectedIds.length === 0) {
            this.app.showToast('No flashcards selected', 'warning');
            return;
        }
        
        const deck = prompt('Enter deck name:');
        if (deck && deck.trim()) {
            this.bulkMoveToDeck(selectedIds, deck.trim());
            this.renderFlashcardManagement();
            this.updateFlashcardFilters();
        }
    }

    deleteFlashcardFromList(cardId) {
        // Use the content manager's delete method which already has custom modal
        if (this.app.contentManager && this.app.contentManager.deleteFlashcard) {
            this.app.contentManager.deleteFlashcard(cardId);
        } else {
            // Fallback for other pages
            this.pendingDeleteFlashcardId = cardId;
            this.app.uiManager.openModal('delete-flashcard-modal');
        }
    }

    confirmDeleteFlashcard() {
        if (this.pendingDeleteFlashcardId) {
            this.deleteFlashcard(this.pendingDeleteFlashcardId);
            this.renderFlashcardManagement();
            this.pendingDeleteFlashcardId = null;
        }
        this.app.uiManager.closeModal('delete-flashcard-modal');
    }

    openEditFlashcardModal(cardId) {
        console.log('flashcard-manager openEditFlashcardModal called with cardId:', cardId);
        const card = this.app.flashcards.find(c => c.id == cardId);
        if (!card) {
            console.log('Flashcard not found for id:', cardId);
            return;
        }
        
        // Populate the edit modal with current values
        const questionInput = document.getElementById('edit-question-input');
        const answerInput = document.getElementById('edit-answer-input');
        const deckInput = document.getElementById('edit-deck-name');
        const difficultySelect = document.getElementById('edit-difficulty-select');
        const form = document.getElementById('edit-flashcard-form');
        
        console.log('Form elements found:', {
            questionInput: !!questionInput,
            answerInput: !!answerInput,
            deckInput: !!deckInput,
            difficultySelect: !!difficultySelect,
            form: !!form
        });
        
        if (questionInput) questionInput.value = card.question;
        if (answerInput) answerInput.value = card.answer;
        if (deckInput) deckInput.value = card.deck;
        if (difficultySelect) difficultySelect.value = card.difficulty;
        
        // Store the card ID for saving
        if (form) form.dataset.cardId = cardId;
        
        // Show the modal
        console.log('Opening edit flashcard modal');
        this.app.uiManager.openModal('edit-flashcard-modal');
    }

    saveEditedFlashcard() {
        const form = document.getElementById('edit-flashcard-form');
        const cardId = form.dataset.cardId;
        
        const updates = {
            question: document.getElementById('edit-question-input').value.trim(),
            answer: document.getElementById('edit-answer-input').value.trim(),
            deck: document.getElementById('edit-deck-name').value.trim(),
            difficulty: document.getElementById('edit-difficulty-select').value
        };
        
        if (!updates.question || !updates.answer) {
            this.app.showToast('Question and answer are required', 'error');
            return;
        }
        
        this.editFlashcard(cardId, updates);
        this.closeEditFlashcardModal();
        this.renderFlashcardManagement();
        this.updateFlashcardFilters();
        
        // Refresh the content page if we're on it
        if (this.app.contentManager && this.app.contentManager.displayFlashcards) {
            this.app.contentManager.displayFlashcards();
        }
    }

    closeEditFlashcardModal() {
        this.app.uiManager.closeModal('edit-flashcard-modal');
    }

    initializeFlashcards() {
        // Update deck selector with available decks
        this.updateDeckSelector();
        
        // Update difficulty filter with available difficulties
        this.updateDifficultySelector();
        
        // Get filtered flashcards based on current settings
        const filteredCards = this.getFilteredFlashcards();
        
        // If we have flashcards, show the first one
        if (filteredCards.length > 0) {
            this.currentIndex = 0;
            this.showFlashcard();
        } else {
            // No flashcards available, show helpful message
            const flashcardContent = document.getElementById('flashcard-content');
            if (flashcardContent) {
                flashcardContent.innerHTML = `
                    <div class="no-flashcards">
                        <i class="fas fa-inbox"></i>
                        <h3>No flashcards available</h3>
                        <p>Add some flashcards to get started!</p>
                        <button class="btn btn-primary" onclick="app.router.navigate('content')">
                            <i class="fas fa-plus-circle"></i> Add Flashcards
                        </button>
                    </div>
                `;
            }
            // Update counter for empty state
            this.updateFlashcardCounter();
        }
        
        // Focus management: Set focus to flashcard container instead of dropdown
        setTimeout(() => {
            const flashcardContainer = document.getElementById('current-flashcard');
            const flashcardContent = document.getElementById('flashcard-content');
            
            if (flashcardContainer) {
                // Make the flashcard container focusable and focus it
                flashcardContainer.setAttribute('tabindex', '0');
                flashcardContainer.focus();
            } else if (flashcardContent) {
                // Fallback to flashcard content container
                flashcardContent.setAttribute('tabindex', '0');
                flashcardContent.focus();
            }
        }, 100);
    }


}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardManager;
}