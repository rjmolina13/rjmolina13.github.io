// Mixed Study Mode Management Module

class MixedManager {
    constructor(app) {
        this.app = app;
        this.mixedSession = {
            active: false,
            items: [],
            currentIndex: 0,
            startTime: null,
            duration: 10, // minutes
            flashcardRatio: 50, // percentage
            score: 0,
            totalAnswered: 0,
            flashcardsReviewed: 0,
            quizQuestionsAnswered: 0,
            mistakes: [],
            timer: null
        };
    }

    // Mixed Mode Setup and Control
    startMixedMode(deck = 'all', duration = 10, flashcardRatio = 50) {
        let availableCards = deck === 'all' ? 
            this.app.flashcards : 
            this.app.flashcards.filter(card => card.deck === deck);

        if (availableCards.length === 0) {
            this.app.showToast('No flashcards available for mixed mode', 'error');
            return;
        }

        this.mixedSession.duration = duration;
        this.mixedSession.flashcardRatio = flashcardRatio;
        this.mixedSession.items = this.generateMixedItems(availableCards);
        this.mixedSession.currentIndex = 0;
        this.mixedSession.score = 0;
        this.mixedSession.totalAnswered = 0;
        this.mixedSession.flashcardsReviewed = 0;
        this.mixedSession.quizQuestionsAnswered = 0;
        this.mixedSession.mistakes = [];
        this.mixedSession.startTime = Date.now();
        this.mixedSession.active = true;

        this.showCurrentMixedItem();
        this.startMixedTimer();
        this.app.showToast('Mixed study session started!', 'success');
    }

    generateMixedItems(availableCards) {
        const totalItems = Math.min(50, availableCards.length * 2); // Reasonable limit
        const flashcardCount = Math.floor(totalItems * (this.mixedSession.flashcardRatio / 100));
        const quizCount = totalItems - flashcardCount;
        
        const items = [];
        
        // Add flashcards
        for (let i = 0; i < flashcardCount; i++) {
            const card = availableCards[i % availableCards.length];
            items.push({
                type: 'flashcard',
                card: card,
                id: `flashcard_${i}_${card.id}`
            });
        }
        
        // Add quiz questions
        for (let i = 0; i < quizCount; i++) {
            const card = availableCards[i % availableCards.length];
            items.push({
                type: 'quiz',
                question: this.app.quizManager.generateQuizQuestion(card, availableCards),
                id: `quiz_${i}_${card.id}`
            });
        }
        
        return this.app.shuffleArray(items);
    }

    showCurrentMixedItem() {
        if (!this.mixedSession.active || this.mixedSession.currentIndex >= this.mixedSession.items.length) {
            this.endMixedSession();
            return;
        }

        const item = this.mixedSession.items[this.mixedSession.currentIndex];
        const contentContainer = document.getElementById('mixed-content');
        
        if (!contentContainer) return;

        if (item.type === 'flashcard') {
            contentContainer.innerHTML = this.renderMixedFlashcard(item.card);
            this.updateModeIndicator('flashcard');
        } else {
            contentContainer.innerHTML = this.renderMixedQuiz(item.question);
            this.updateModeIndicator('quiz');
        }

        this.updateMixedProgress();
    }

    renderMixedFlashcard(card) {
        return `
            <div class="mixed-flashcard" id="mixed-current-card">
                <div class="mixed-flashcard-inner">
                    <div class="mixed-flashcard-front">
                        <div class="mixed-card-header">
                            <span class="deck-badge">${card.deck}</span>
                            <span class="difficulty-badge difficulty-${card.difficulty}">${card.difficulty}</span>
                        </div>
                        <div class="mixed-card-question">
                            ${card.question}
                        </div>
                        <div class="mixed-card-actions">
                            <button class="btn btn-secondary" onclick="flipMixedFlashcard()">
                                <i class="fas fa-sync-alt"></i> Show Answer
                            </button>
                        </div>
                    </div>
                    <div class="mixed-flashcard-back">
                        <div class="mixed-card-header">
                            <span class="deck-badge">${card.deck}</span>
                            <span class="difficulty-badge difficulty-${card.difficulty}">${card.difficulty}</span>
                        </div>
                        <div class="mixed-card-answer">
                            ${card.answer}
                        </div>
                        <div class="mixed-card-actions">
                            <button class="btn btn-success" onclick="app.mixedManager.rateMixedFlashcard('easy')">
                                <i class="fas fa-thumbs-up"></i> Easy
                            </button>
                            <button class="btn btn-warning" onclick="app.mixedManager.rateMixedFlashcard('medium')">
                                <i class="fas fa-minus"></i> Medium
                            </button>
                            <button class="btn btn-danger" onclick="app.mixedManager.rateMixedFlashcard('hard')">
                                <i class="fas fa-thumbs-down"></i> Hard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMixedQuiz(question) {
        let questionHTML = '';

        switch (question.type) {
            case 'multiple-choice':
                questionHTML = `
                    <div class="mixed-quiz-question">
                        <h4>Quiz Question</h4>
                        <p class="question-text">${question.question}</p>
                        <div class="mixed-quiz-options">
                            ${question.options.map((option, index) => `
                                <button class="mixed-quiz-option" onclick="selectMixedAnswer(${index})">
                                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                                    <span class="option-text">${option}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
            case 'true-false':
                questionHTML = `
                    <div class="mixed-quiz-question">
                        <h4>Quiz Question</h4>
                        <p class="question-text">${question.question}</p>
                        <div class="mixed-quiz-options">
                            <button class="mixed-quiz-option" onclick="selectMixedAnswer(true)">
                                <span class="option-letter">T</span>
                                <span class="option-text">True</span>
                            </button>
                            <button class="mixed-quiz-option" onclick="selectMixedAnswer(false)">
                                <span class="option-letter">F</span>
                                <span class="option-text">False</span>
                            </button>
                        </div>
                    </div>
                `;
                break;
            case 'fill-blank':
                questionHTML = `
                    <div class="mixed-quiz-question">
                        <h4>Quiz Question</h4>
                        <p class="question-text">${question.question}</p>
                        <div class="fill-blank-container">
                            <p class="blanked-text">${question.blankedAnswer}</p>
                            <div class="blank-inputs">
                                ${question.correctAnswer.map((_, index) => `
                                    <input type="text" class="blank-input" placeholder="Fill blank ${index + 1}" 
                                           onkeypress="if(event.key==='Enter') app.mixedManager.submitMixedFillBlank()">
                                `).join('')}
                            </div>
                            <button class="btn btn-primary" onclick="app.mixedManager.submitMixedFillBlank()">
                                Submit Answer
                            </button>
                        </div>
                    </div>
                `;
                break;
        }

        return questionHTML;
    }

    // Mixed Mode Interactions
    flipMixedFlashcard() {
        const flashcard = document.getElementById('mixed-current-card');
        if (flashcard) {
            flashcard.classList.toggle('flipped');
        }
    }

    rateMixedFlashcard(difficulty) {
        const item = this.mixedSession.items[this.mixedSession.currentIndex];
        if (item && item.type === 'flashcard') {
            // Update the original flashcard difficulty
            const originalCard = this.app.flashcards.find(card => card.id === item.card.id);
            if (originalCard) {
                originalCard.difficulty = difficulty;
                originalCard.lastReviewed = new Date().toISOString();
                originalCard.reviewCount = (originalCard.reviewCount || 0) + 1;
            }
            
            this.mixedSession.flashcardsReviewed++;
            this.nextMixedItem();
        }
    }

    selectMixedAnswer(answer) {
        const item = this.mixedSession.items[this.mixedSession.currentIndex];
        if (item && item.type === 'quiz') {
            const question = item.question;
            question.userAnswer = answer;
            
            const isCorrect = this.app.quizManager.checkAnswer(question);
            
            if (isCorrect) {
                this.mixedSession.score++;
            } else {
                this.mixedSession.mistakes.push({
                    question: question.question,
                    userAnswer: answer,
                    correctAnswer: question.correctAnswer,
                    correctCard: question.correctCard
                });
            }
            
            this.mixedSession.totalAnswered++;
            this.mixedSession.quizQuestionsAnswered++;
            
            this.showMixedAnswerFeedback(isCorrect, question);
            
            setTimeout(() => {
                this.nextMixedItem();
            }, 1500);
        }
    }

    submitMixedFillBlank() {
        const inputs = document.querySelectorAll('.blank-input');
        const userAnswers = Array.from(inputs).map(input => input.value.trim().toLowerCase());
        const item = this.mixedSession.items[this.mixedSession.currentIndex];
        
        if (item && item.type === 'quiz') {
            const question = item.question;
            const correctAnswers = question.correctAnswer.map(answer => answer.toLowerCase());
            
            question.userAnswer = userAnswers;
            const isCorrect = userAnswers.every((answer, index) => 
                answer === correctAnswers[index]
            );
            
            if (isCorrect) {
                this.mixedSession.score++;
            } else {
                this.mixedSession.mistakes.push({
                    question: question.question,
                    userAnswer: userAnswers,
                    correctAnswer: correctAnswers,
                    correctCard: question.correctCard
                });
            }
            
            this.mixedSession.totalAnswered++;
            this.mixedSession.quizQuestionsAnswered++;
            
            this.showMixedAnswerFeedback(isCorrect, question);
            
            setTimeout(() => {
                this.nextMixedItem();
            }, 1500);
        }
    }

    showMixedAnswerFeedback(isCorrect, question) {
        const contentContainer = document.getElementById('mixed-content');
        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackIcon = isCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle';
        const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';

        let correctAnswerText = '';
        if (!isCorrect) {
            switch (question.type) {
                case 'multiple-choice':
                    correctAnswerText = `Correct answer: ${question.options[question.correctAnswer]}`;
                    break;
                case 'true-false':
                    correctAnswerText = `Correct answer: ${question.correctAnswer ? 'True' : 'False'}`;
                    break;
                case 'fill-blank':
                    correctAnswerText = `Correct answer: ${question.correctAnswer.join(', ')}`;
                    break;
            }
        }

        contentContainer.innerHTML = `
            <div class="mixed-answer-feedback ${feedbackClass}">
                <div class="feedback-icon">
                    <i class="${feedbackIcon}"></i>
                </div>
                <h3>${feedbackText}</h3>
                ${correctAnswerText ? `<p class="correct-answer">${correctAnswerText}</p>` : ''}
            </div>
        `;
    }

    nextMixedItem() {
        this.mixedSession.currentIndex++;
        this.showCurrentMixedItem();
    }

    // Timer Management
    startMixedTimer() {
        const endTime = this.mixedSession.startTime + (this.mixedSession.duration * 60 * 1000);
        
        this.mixedSession.timer = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                this.endMixedSession();
                return;
            }
            
            this.updateMixedTimer(remaining);
        }, 1000);
    }

    updateMixedTimer(remaining) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const timerElement = document.getElementById('mixed-timer');
        
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Add warning class when less than 1 minute remaining
            if (remaining < 60000) {
                timerElement.classList.add('warning');
            }
        }
    }

    // Session Management
    endMixedSession() {
        this.mixedSession.active = false;
        
        if (this.mixedSession.timer) {
            clearInterval(this.mixedSession.timer);
            this.mixedSession.timer = null;
        }
        
        const duration = Date.now() - this.mixedSession.startTime;
        
        // Update statistics
        this.app.stats.totalMixedSessions = (this.app.stats.totalMixedSessions || 0) + 1;
        this.app.stats.totalStudyTime = (this.app.stats.totalStudyTime || 0) + duration;
        
        this.showMixedResults(duration);
        this.app.dataManager.saveData();
    }

    showMixedResults(duration) {
        const resultsContainer = document.getElementById('mixed-results');
        if (!resultsContainer) return;

        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const quizAccuracy = this.mixedSession.quizQuestionsAnswered > 0 ? 
            Math.round((this.mixedSession.score / this.mixedSession.quizQuestionsAnswered) * 100) : 0;

        resultsContainer.innerHTML = `
            <div class="mixed-results-content">
                <div class="results-header">
                    <h2>Mixed Session Complete!</h2>
                    <div class="session-summary">
                        Great job on your mixed study session!
                    </div>
                </div>
                
                <div class="mixed-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-value">${timeString}</div>
                        <div class="stat-label">Study Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-cards-blank"></i></div>
                        <div class="stat-value">${this.mixedSession.flashcardsReviewed}</div>
                        <div class="stat-label">Flashcards Reviewed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-question-circle"></i></div>
                        <div class="stat-value">${this.mixedSession.quizQuestionsAnswered}</div>
                        <div class="stat-label">Quiz Questions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-percentage"></i></div>
                        <div class="stat-value">${quizAccuracy}%</div>
                        <div class="stat-label">Quiz Accuracy</div>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="btn btn-primary" onclick="app.mixedManager.startMixedMode()">
                        <i class="fas fa-redo"></i> Start New Session
                    </button>
                    ${this.mixedSession.mistakes.length > 0 ? `
                        <button class="btn btn-secondary" onclick="app.mixedManager.reviewMixedMistakes()">
                            <i class="fas fa-eye"></i> Review Mistakes (${this.mixedSession.mistakes.length})
                        </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="app.showSection('flashcards')">
                        <i class="fas fa-arrow-left"></i> Back to Flashcards
                    </button>
                </div>
            </div>
        `;

        this.restoreMixedResults();
    }

    reviewMixedMistakes() {
        if (this.mixedSession.mistakes.length === 0) {
            this.app.showToast('No mistakes to review!', 'info');
            return;
        }

        const resultsContainer = document.getElementById('mixed-results');
        let mistakesHTML = `
            <div class="mixed-mistakes-review">
                <div class="mistakes-header">
                    <h2>Review Your Mistakes</h2>
                    <p>Study these quiz questions to improve</p>
                </div>
                <div class="mistakes-list">
        `;

        this.mixedSession.mistakes.forEach((mistake, index) => {
            mistakesHTML += `
                <div class="mistake-item">
                    <div class="mistake-number">${index + 1}</div>
                    <div class="mistake-content">
                        <div class="mistake-question">
                            <strong>Q:</strong> ${mistake.question}
                        </div>
                        <div class="mistake-answers">
                            <div class="user-answer incorrect">
                                <strong>Your answer:</strong> ${Array.isArray(mistake.userAnswer) ? mistake.userAnswer.join(', ') : mistake.userAnswer}
                            </div>
                            <div class="correct-answer">
                                <strong>Correct answer:</strong> ${Array.isArray(mistake.correctAnswer) ? mistake.correctAnswer.join(', ') : mistake.correctAnswer}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        mistakesHTML += `
                </div>
                <div class="mistakes-actions">
                    <button class="btn btn-primary" onclick="app.mixedManager.createMixedMistakeFlashcards()">
                        <i class="fas fa-plus"></i> Create Flashcards from Mistakes
                    </button>
                    <button class="btn btn-secondary" onclick="app.mixedManager.showMixedResults(${Date.now() - this.mixedSession.startTime})">
                        <i class="fas fa-arrow-left"></i> Back to Results
                    </button>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = mistakesHTML;
    }

    createMixedMistakeFlashcards() {
        let created = 0;
        this.mixedSession.mistakes.forEach(mistake => {
            if (mistake.correctCard) {
                const exists = this.app.flashcards.some(card => 
                    card.question === mistake.correctCard.question
                );
                
                if (!exists) {
                    this.app.flashcardManager.addFlashcard(
                        mistake.correctCard.question,
                        mistake.correctCard.answer,
                        'Mixed Mode Mistakes',
                        'hard'
                    );
                    created++;
                }
            }
        });

        if (created > 0) {
            this.app.showToast(`Created ${created} flashcards from mistakes`, 'success');
        } else {
            this.app.showToast('No new flashcards created (duplicates avoided)', 'info');
        }
    }

    // UI Updates
    updateMixedProgress() {
        const progressBar = document.getElementById('mixed-progress-bar');
        const progressText = document.getElementById('mixed-progress-text');
        
        if (progressBar && progressText) {
            const progress = ((this.mixedSession.currentIndex + 1) / this.mixedSession.items.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Item ${this.mixedSession.currentIndex + 1} of ${this.mixedSession.items.length}`;
        }

        // Update session stats
        const statsContainer = document.getElementById('mixed-session-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="session-stat">
                    <span class="stat-label">Flashcards:</span>
                    <span class="stat-value">${this.mixedSession.flashcardsReviewed}</span>
                </div>
                <div class="session-stat">
                    <span class="stat-label">Quiz Score:</span>
                    <span class="stat-value">${this.mixedSession.score}/${this.mixedSession.quizQuestionsAnswered}</span>
                </div>
            `;
        }
    }

    updateModeIndicator(mode) {
        const indicator = document.getElementById('mixed-mode-indicator');
        if (indicator) {
            indicator.className = `mode-indicator ${mode}`;
            indicator.innerHTML = `
                <i class="fas ${mode === 'flashcard' ? 'fa-cards-blank' : 'fa-question-circle'}"></i>
                <span>${mode === 'flashcard' ? 'Flashcard' : 'Quiz'}</span>
            `;
        }
    }

    restoreMixedResults() {
        document.getElementById('mixed-setup').style.display = 'none';
        document.getElementById('mixed-session').style.display = 'none';
        document.getElementById('mixed-results').style.display = 'block';
    }

    resetMixedMode() {
        if (this.mixedSession.timer) {
            clearInterval(this.mixedSession.timer);
        }
        
        this.mixedSession = {
            active: false,
            items: [],
            currentIndex: 0,
            startTime: null,
            duration: 10,
            flashcardRatio: 50,
            score: 0,
            totalAnswered: 0,
            flashcardsReviewed: 0,
            quizQuestionsAnswered: 0,
            mistakes: [],
            timer: null
        };

        // Reset UI
        document.getElementById('mixed-setup').style.display = 'block';
        document.getElementById('mixed-session').style.display = 'none';
        document.getElementById('mixed-results').style.display = 'none';
        
        // Reset timer display
        const timerElement = document.getElementById('mixed-timer');
        if (timerElement) {
            timerElement.textContent = '10:00';
            timerElement.classList.remove('warning');
        }
    }

    updateMixedDeckSelector() {
        const selector = document.getElementById('mixed-deck-selector');
        if (!selector) return;

        const decks = ['all', ...new Set(this.app.flashcards.map(card => card.deck))];
        
        selector.innerHTML = decks.map(deck => 
            `<option value="${deck}">
                ${deck === 'all' ? 'All Decks' : deck}
            </option>`
        ).join('');
    }

    // Mixed Mode Statistics
    getMixedStats() {
        const totalSessions = this.app.stats.totalMixedSessions || 0;
        const averageAccuracy = totalSessions > 0 ? 
            (this.app.stats.totalMixedAccuracy || 0) / totalSessions : 0;
        
        return {
            totalSessions,
            averageAccuracy: Math.round(averageAccuracy * 100) / 100
        };
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MixedManager;
}