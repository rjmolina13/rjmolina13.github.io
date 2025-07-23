/* Quiz Whiz - Quiz Manager */

class QuizManager {
    constructor(app) {
        this.app = app;
        this.currentQuiz = {
            active: false,
            questions: [],
            currentIndex: 0,
            answers: [],
            score: 0,
            startTime: null,
            endTime: null,
            settings: {
                numQuestions: 10,
                deck: 'all',
                difficulty: 'all',
                mode: 'normal',
                timeLimit: null
            },
            timer: null,
            timeRemaining: 0
        };
        
        this.eventListenersInitialized = false;
        this.keyboardNavigationInitialized = false;
        this.keyboardHandler = null;
    }

    initializeQuiz() {
        // Only initialize event listeners when on quiz page
        if (!this.eventListenersInitialized) {
            this.initializeEventListeners();
        }
        
        this.setupQuizForm();
        this.updateQuizDeckSelector();
        this.resetQuiz();
    }

    initializeEventListeners() {
        if (this.eventListenersInitialized) {
            return;
        }
        
        // If DOM is already ready, set up immediately
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.setupKeyboardNavigation();
            });
        } else {
            this.setupEventListeners();
            this.setupKeyboardNavigation();
        }
        
        this.eventListenersInitialized = true;
    }

    setupEventListeners() {
        // Only set up event listeners if we're on the quiz page
        const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
        if (currentPage !== 'quiz') {
            return;
        }
        
        // Quiz setup form
        const setupForm = document.getElementById('quiz-setup-form');
        if (setupForm) {
            setupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startQuiz();
            });
        }

        // Question count buttons
        const countButtons = document.querySelectorAll('.question-count-selector .btn');
        countButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectQuestionCount(btn);
            });
        });

        // Difficulty buttons
        const difficultyButtons = document.querySelectorAll('.difficulty-selector .btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectDifficulty(btn);
            });
        });

        // Quiz mode buttons
        const modeButtons = document.querySelectorAll('.quiz-mode-selector .btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectQuizMode(btn);
            });
        });

        // Quiz action buttons
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitAnswer();
            });
        }

        const endBtn = document.getElementById('end-quiz-btn');
        if (endBtn) {
            endBtn.addEventListener('click', () => {
                this.endQuiz();
            });
        }

        // Navigation buttons
        const prevBtn = document.getElementById('prev-question-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousQuestion();
            });
        }

        const nextBtn = document.getElementById('next-question-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }

        // Results buttons
        const retakeBtn = document.getElementById('retake-quiz-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                this.retakeQuiz();
            });
        }

        const newQuizBtn = document.getElementById('new-quiz-btn');
        if (newQuizBtn) {
            newQuizBtn.addEventListener('click', () => {
                this.newQuiz();
            });
        }
    }

    setupKeyboardNavigation() {
        if (this.keyboardNavigationInitialized) {
            return;
        }
        
        // Track current selected option index for keyboard navigation
        this.selectedOptionIndex = -1;
        
        // Add global keyboard event listener
        this.keyboardHandler = (e) => {
            this.handleKeyboardInput(e);
        };
        document.addEventListener('keydown', this.keyboardHandler);
        
        this.keyboardNavigationInitialized = true;
    }
    
    cleanup() {
        // Remove keyboard event listener if it exists
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
        
        // Reset initialization flags
        this.eventListenersInitialized = false;
        this.keyboardNavigationInitialized = false;
        
        // Stop any running timers
        if (this.currentQuiz.timer) {
            clearInterval(this.currentQuiz.timer);
            this.currentQuiz.timer = null;
        }
    }

    handleKeyboardInput(e) {
        // Only handle keyboard events when we're on the quiz page
        const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
        if (currentPage !== 'quiz') {
            return;
        }
        
        // Only handle keyboard events when quiz elements are visible
        const quizSection = document.getElementById('quiz');
        if (!quizSection || quizSection.style.display === 'none') {
            return;
        }
        
        // Prevent default behavior for handled keys
        const handledKeys = ['Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'];
        
        // Check if we're in an input field or textarea
        const activeElement = document.activeElement;
        const isInInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
        
        // Don't handle keyboard navigation if user is typing in an input
        if (isInInput && !['Escape'].includes(e.key)) {
            return;
        }
        
        // Determine current quiz state
        const isSetupVisible = !document.getElementById('quiz-setup')?.classList.contains('hidden');
        const isActiveVisible = !document.getElementById('quiz-active')?.classList.contains('hidden');
        const isResultsVisible = !document.getElementById('quiz-results')?.classList.contains('hidden');
        
        if (handledKeys.includes(e.key)) {
            e.preventDefault();
        }
        
        // Handle keyboard input based on current state
        if (isSetupVisible) {
            this.handleSetupKeyboard(e);
        } else if (isActiveVisible) {
            this.handleActiveQuizKeyboard(e);
        } else if (isResultsVisible) {
            this.handleResultsKeyboard(e);
        }
    }

    handleSetupKeyboard(e) {
        switch (e.key) {
            case 'Enter':
                // Start quiz
                this.startQuiz();
                break;
        }
    }

    handleActiveQuizKeyboard(e) {
        switch (e.key) {
            case 'ArrowLeft':
                // Previous question
                this.previousQuestion();
                break;
            case 'ArrowRight':
                // Next question
                this.nextQuestion();
                break;
            case 'ArrowUp':
                // Navigate up through choices
                this.navigateOptions(-1);
                break;
            case 'ArrowDown':
                // Navigate down through choices
                this.navigateOptions(1);
                break;
            case 'Enter':
                // Submit answer or select highlighted option
                this.handleEnterInActiveQuiz();
                break;
            case 'Escape':
                // End quiz
                this.endQuiz();
                break;
        }
    }

    handleResultsKeyboard(e) {
        switch (e.key) {
            case 'Enter':
                // Retake quiz (default action)
                this.retakeQuiz();
                break;
            case 'Escape':
                // New quiz
                this.newQuiz();
                break;
        }
    }

    navigateOptions(direction) {
        const options = document.querySelectorAll('.quiz-option');
        if (options.length === 0) return;
        
        // Remove previous keyboard highlight
        options.forEach(option => option.classList.remove('keyboard-highlighted'));
        
        // Update selected index
        this.selectedOptionIndex += direction;
        
        // Wrap around
        if (this.selectedOptionIndex < 0) {
            this.selectedOptionIndex = options.length - 1;
        } else if (this.selectedOptionIndex >= options.length) {
            this.selectedOptionIndex = 0;
        }
        
        // Highlight current option
        const currentOption = options[this.selectedOptionIndex];
        if (currentOption) {
            currentOption.classList.add('keyboard-highlighted');
            // Scroll into view if needed
            currentOption.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    handleEnterInActiveQuiz() {
        const options = document.querySelectorAll('.quiz-option');
        const submitBtn = document.getElementById('submit-answer-btn');
        
        // If an option is highlighted, select it
        if (this.selectedOptionIndex >= 0 && this.selectedOptionIndex < options.length) {
            const highlightedOption = options[this.selectedOptionIndex];
            if (highlightedOption && !highlightedOption.classList.contains('selected')) {
                const optionText = highlightedOption.dataset.option;
                this.selectOption(highlightedOption, optionText);
                return;
            }
        }
        
        // If an answer is selected, submit it
        if (submitBtn && !submitBtn.disabled) {
            this.submitAnswer();
        }
    }

    setupQuizForm() {
        // Set default values
        const numQuestionsInput = document.getElementById('num-questions');
        if (numQuestionsInput) {
            numQuestionsInput.value = this.currentQuiz.settings.numQuestions;
        }

        // Set default active buttons
        this.setActiveButton('.difficulty-selector', '[data-difficulty="all"]');
        this.setActiveButton('.quiz-mode-selector', '[data-mode="normal"]');
    }

    setActiveButton(containerSelector, buttonSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = container.querySelector(buttonSelector);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    }

    selectQuestionCount(button) {
        // Remove active class from all count buttons
        document.querySelectorAll('.question-count-selector .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Set the count value
        const count = button.dataset.count;
        const input = document.getElementById('num-questions');
        if (input && count) {
            input.value = count;
            this.currentQuiz.settings.numQuestions = parseInt(count);
        }
    }

    selectDifficulty(button) {
        // Remove active class from all difficulty buttons
        document.querySelectorAll('.difficulty-selector .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        this.currentQuiz.settings.difficulty = button.dataset.difficulty;
    }

    selectQuizMode(button) {
        // Remove active class from all mode buttons
        document.querySelectorAll('.quiz-mode-selector .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        this.currentQuiz.settings.mode = button.dataset.mode;
        
        // Show/hide timer info based on mode
        const timerInfo = document.getElementById('quiz-info-timer');
        if (timerInfo) {
            if (button.dataset.mode === 'timed') {
                timerInfo.classList.remove('hidden');
            } else {
                timerInfo.classList.add('hidden');
            }
        }
    }

    updateQuizDeckSelector() {
        const selector = document.getElementById('quiz-deck-selector');
        if (!selector) return;

        // Clear existing options except "All Decks"
        selector.innerHTML = '<option value="all">All Decks</option>';

        // Get unique deck names from quizzes
        const decks = [...new Set(this.app.quizzes.map(quiz => quiz.deck))]
            .filter(deck => deck && deck.trim() !== '')
            .sort();

        // Add deck options
        decks.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck;
            option.textContent = deck;
            selector.appendChild(option);
        });
    }

    startQuiz() {
        // Get quiz settings
        this.getQuizSettings();
        
        // Generate questions
        const questions = this.generateQuestions();
        
        if (questions.length === 0) {
            this.app.showToast('No questions available with the selected criteria.', 'error');
            return;
        }

        // Initialize quiz
        this.currentQuiz.questions = questions;
        this.currentQuiz.currentIndex = 0;
        this.currentQuiz.answers = new Array(questions.length).fill(null);
        this.currentQuiz.score = 0;
        this.currentQuiz.active = true;
        this.currentQuiz.startTime = new Date();
        
        // Initialize keyboard navigation state
        this.selectedOptionIndex = -1;

        // Start timer if timed mode
        if (this.currentQuiz.settings.mode === 'timed') {
            this.startTimer();
        }

        // Show quiz interface
        this.showQuizInterface();
        
        // Load first question
        this.loadQuestion(0);
        
        this.app.showToast('Quiz started! Good luck! Use arrow keys to navigate and Enter to select/submit.', 'success');
    }

    getQuizSettings() {
        const numQuestionsInput = document.getElementById('num-questions');
        const deckSelector = document.getElementById('quiz-deck-selector');
        
        this.currentQuiz.settings.numQuestions = numQuestionsInput ? 
            parseInt(numQuestionsInput.value) || 10 : 10;
        this.currentQuiz.settings.deck = deckSelector ? 
            deckSelector.value : 'all';
        
        // Get active difficulty
        const activeDifficulty = document.querySelector('.difficulty-selector .btn.active');
        this.currentQuiz.settings.difficulty = activeDifficulty ? 
            activeDifficulty.dataset.difficulty : 'all';
        
        // Get active mode
        const activeMode = document.querySelector('.quiz-mode-selector .btn.active');
        this.currentQuiz.settings.mode = activeMode ? 
            activeMode.dataset.mode : 'normal';
    }

    generateQuestions() {
        let availableQuizzes = [...this.app.quizzes];
        
        // Filter by deck
        if (this.currentQuiz.settings.deck !== 'all') {
            availableQuizzes = availableQuizzes.filter(quiz => 
                quiz.deck === this.currentQuiz.settings.deck
            );
        }
        
        // Filter by difficulty
        if (this.currentQuiz.settings.difficulty !== 'all') {
            availableQuizzes = availableQuizzes.filter(quiz => 
                quiz.difficulty === this.currentQuiz.settings.difficulty
            );
        }
        
        // Shuffle and limit
        const shuffled = this.app.shuffleArray(availableQuizzes);
        const limited = shuffled.slice(0, this.currentQuiz.settings.numQuestions);
        
        // Convert to quiz questions format
        return limited.map((quiz, index) => {
            return this.createQuizQuestion(quiz, index);
        });
    }

    createQuizQuestion(quiz, index) {
        const question = {
            id: index,
            quizId: quiz.id,
            question: quiz.question,
            correctAnswer: quiz.correctAnswer,
            type: 'multiple-choice',
            options: [],
            difficulty: quiz.difficulty,
            deck: quiz.deck
        };
        
        // Use predefined wrong answers if available, otherwise generate them
        if (quiz.wrongAnswers && quiz.wrongAnswers.length >= 3) {
            question.options = this.createOptionsFromQuiz(quiz);
        } else {
            question.options = this.generateMultipleChoiceOptions(quiz);
        }
        
        return question;
    }

    createOptionsFromQuiz(quiz) {
        const options = [quiz.correctAnswer];
        
        // Add the predefined wrong answers
        const wrongAnswers = quiz.wrongAnswers.slice(0, 3); // Take up to 3 wrong answers
        options.push(...wrongAnswers);
        
        // If we need more options, fill with generic ones
        while (options.length < 4) {
            options.push(`Option ${options.length}`);
        }
        
        // Shuffle options
        return this.app.shuffleArray(options);
    }

    generateMultipleChoiceOptions(quiz) {
        const options = [quiz.correctAnswer];
        
        // First, try to get wrong answers from other quizzes in the same deck and difficulty
        let otherQuizzes = this.app.quizzes.filter(q => 
            q.id !== quiz.id && 
            q.correctAnswer.toLowerCase() !== quiz.correctAnswer.toLowerCase() &&
            q.deck === quiz.deck &&
            q.difficulty === quiz.difficulty
        );
        
        // If not enough options from same deck/difficulty, expand to same deck
        if (otherQuizzes.length < 3) {
            otherQuizzes = this.app.quizzes.filter(q => 
                q.id !== quiz.id && 
                q.correctAnswer.toLowerCase() !== quiz.correctAnswer.toLowerCase() &&
                q.deck === quiz.deck
            );
        }
        
        // If still not enough, expand to same difficulty across all decks
        if (otherQuizzes.length < 3) {
            otherQuizzes = this.app.quizzes.filter(q => 
                q.id !== quiz.id && 
                q.correctAnswer.toLowerCase() !== quiz.correctAnswer.toLowerCase() &&
                q.difficulty === quiz.difficulty
            );
        }
        
        // If still not enough, use any other quizzes
        if (otherQuizzes.length < 3) {
            otherQuizzes = this.app.quizzes.filter(q => 
                q.id !== quiz.id && 
                q.correctAnswer.toLowerCase() !== quiz.correctAnswer.toLowerCase()
            );
        }
        
        // Add 3 random wrong answers
        const shuffledOthers = this.app.shuffleArray(otherQuizzes);
        for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
            options.push(shuffledOthers[i].correctAnswer);
        }
        
        // If we don't have enough options, add some generic ones
        while (options.length < 4) {
            options.push(`Option ${options.length}`);
        }
        
        // Shuffle options
        return this.app.shuffleArray(options);
    }

    showQuizInterface() {
        // Hide setup, show active quiz
        const setup = document.getElementById('quiz-setup');
        const active = document.getElementById('quiz-active');
        const results = document.getElementById('quiz-results');
        const navigation = document.getElementById('quiz-navigation-container');
        
        if (setup) setup.classList.add('hidden');
        if (active) active.classList.remove('hidden');
        if (results) results.classList.add('hidden');
        if (navigation) navigation.classList.remove('hidden');
        
        // Update quiz info
        this.updateQuizInfo();
    }

    updateQuizInfo() {
        // Update quiz configuration info in progress bar
        this.updateQuizConfigInfo();
        
        // Update current question info in quiz card
        this.updateCurrentQuestionInfo();
        
        // Update score and progress in footer
        const scoreInfo = document.getElementById('quiz-info-score');
        const progressInfo = document.getElementById('quiz-info-progress');
        
        if (scoreInfo) {
            scoreInfo.textContent = `Score: ${this.currentQuiz.score}`;
        }
        
        if (progressInfo) {
            progressInfo.textContent = `Question: ${this.currentQuiz.currentIndex + 1}/${this.currentQuiz.questions.length}`;
        }
    }
    
    updateQuizConfigInfo() {
        // Update quiz configuration elements in progress bar
        const questionsConfig = document.getElementById('quiz-config-questions');
        const deckConfig = document.getElementById('quiz-config-deck');
        const difficultyConfig = document.getElementById('quiz-config-difficulty');
        const modeConfig = document.getElementById('quiz-config-mode');
        const timerConfig = document.getElementById('quiz-config-timer');
        
        if (questionsConfig) {
            questionsConfig.innerHTML = `<i class="fas fa-question-circle"></i> ${this.currentQuiz.questions.length}`;
        }
        
        if (deckConfig) {
            const deckText = this.currentQuiz.settings.deck === 'all' ? 'All Decks' : this.currentQuiz.settings.deck;
            deckConfig.innerHTML = `<i class="fas fa-layer-group"></i> ${deckText}`;
        }
        
        if (difficultyConfig) {
            const difficultyText = this.currentQuiz.settings.difficulty.charAt(0).toUpperCase() + 
                this.currentQuiz.settings.difficulty.slice(1);
            difficultyConfig.innerHTML = `<i class="fas fa-signal"></i> ${difficultyText}`;
        }
        
        if (modeConfig) {
            const modeText = this.currentQuiz.settings.mode.charAt(0).toUpperCase() + 
                this.currentQuiz.settings.mode.slice(1);
            modeConfig.innerHTML = `<i class="fas fa-cog"></i> ${modeText}`;
        }
        
        // Show/hide timer based on mode
        if (timerConfig) {
            if (this.currentQuiz.settings.mode === 'timed') {
                timerConfig.classList.remove('hidden');
            } else {
                timerConfig.classList.add('hidden');
            }
        }
    }
    
    processQuestionText(questionText) {
        // Replace sequences of underscores with styled blank lines
        // Match 3 or more consecutive underscores
        return questionText.replace(/_{3,}/g, (match) => {
            // Create a blank line span with width proportional to underscore count
            const width = Math.max(80, match.length * 12); // Minimum 80px, 12px per underscore
            return `<span class="blank-line" style="min-width: ${width}px;"></span>`;
        });
    }

    updateCurrentQuestionInfo() {
        // Update current question deck and difficulty in quiz card header
        const currentQuestionDeck = document.getElementById('current-question-deck');
        const currentQuestionDifficulty = document.getElementById('current-question-difficulty');
        
        if (this.currentQuiz.questions.length > 0 && this.currentQuiz.currentIndex < this.currentQuiz.questions.length) {
            const currentQuestion = this.currentQuiz.questions[this.currentQuiz.currentIndex];
            
            if (currentQuestionDeck) {
                currentQuestionDeck.innerHTML = `<i class="fas fa-layer-group"></i> ${currentQuestion.deck || 'Unknown'}`;
            }
            
            if (currentQuestionDifficulty) {
                const difficultyText = currentQuestion.difficulty ? 
                    currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1) : 
                    'Unknown';
                currentQuestionDifficulty.innerHTML = `<i class="fas fa-signal"></i> ${difficultyText}`;
            }
        } else {
            if (currentQuestionDeck) {
                currentQuestionDeck.innerHTML = '<i class="fas fa-layer-group"></i> Loading...';
            }
            
            if (currentQuestionDifficulty) {
                currentQuestionDifficulty.innerHTML = '<i class="fas fa-signal"></i> Loading...';
            }
        }
    }

    loadQuestion(index) {
        if (index < 0 || index >= this.currentQuiz.questions.length) return;
        
        const question = this.currentQuiz.questions[index];
        this.currentQuiz.currentIndex = index;
        
        // Reset keyboard navigation state
        this.selectedOptionIndex = -1;
        
        // Update question content
        const questionTitle = document.getElementById('question-title');
        if (questionTitle) {
            // Process question text to replace underscores with styled blank lines
            const processedQuestion = this.processQuestionText(question.question);
            questionTitle.innerHTML = processedQuestion;
        }
        
        // Update options
        this.renderQuizOptions(question);
        
        // Update progress bar
        this.updateProgressBar();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update quiz info
        this.updateQuizInfo();
    }

    renderQuizOptions(question) {
        const optionsContainer = document.getElementById('quiz-options');
        if (!optionsContainer) return;
        
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'quiz-option';
            optionElement.textContent = option;
            optionElement.dataset.option = option;
            
            // Check if this option was previously selected
            if (this.currentQuiz.answers[this.currentQuiz.currentIndex] === option) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => {
                this.selectOption(optionElement, option);
            });
            
            optionsContainer.appendChild(optionElement);
        });
    }

    selectOption(optionElement, option) {
        // Remove selection from all options
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select clicked option
        optionElement.classList.add('selected');
        
        // Store answer
        this.currentQuiz.answers[this.currentQuiz.currentIndex] = option;
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    submitAnswer() {
        const currentAnswer = this.currentQuiz.answers[this.currentQuiz.currentIndex];
        if (!currentAnswer) return;
        
        const question = this.currentQuiz.questions[this.currentQuiz.currentIndex];
        const isCorrect = currentAnswer === question.correctAnswer;
        
        // Update score
        if (isCorrect) {
            this.currentQuiz.score++;
        }
        
        // Show correct/incorrect feedback
        this.showAnswerFeedback(isCorrect, question.correctAnswer);
        
        // Move to next question after delay
        setTimeout(() => {
            if (this.currentQuiz.currentIndex < this.currentQuiz.questions.length - 1) {
                this.nextQuestion();
            } else {
                this.endQuiz();
            }
        }, 2000);
    }

    showAnswerFeedback(isCorrect, correctAnswer) {
        const options = document.querySelectorAll('.quiz-option');
        
        options.forEach(option => {
            if (option.dataset.option === correctAnswer) {
                option.classList.add('correct');
            } else if (option.classList.contains('selected') && !isCorrect) {
                option.classList.add('incorrect');
            }
            
            // Remove keyboard highlight and disable clicking
            option.classList.remove('keyboard-highlighted');
            option.style.pointerEvents = 'none';
        });
        
        // Reset keyboard navigation state
        this.selectedOptionIndex = -1;
        
        // Disable submit button
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    updateProgressBar() {
        const progressBar = document.getElementById('quiz-progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar && this.currentQuiz.questions.length > 0) {
            const percentage = ((this.currentQuiz.currentIndex + 1) / this.currentQuiz.questions.length) * 100;
            progressBar.style.width = `${percentage}%`;
            
            if (progressText) {
                const currentQuestion = this.currentQuiz.currentIndex + 1;
                const totalQuestions = this.currentQuiz.questions.length;
                progressText.textContent = `Question ${currentQuestion} of ${totalQuestions} (${Math.round(percentage)}%)`;
            }
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-question-btn');
        const nextBtn = document.getElementById('next-question-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentQuiz.currentIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentQuiz.currentIndex === this.currentQuiz.questions.length - 1;
        }
    }

    previousQuestion() {
        if (this.currentQuiz.currentIndex > 0) {
            this.loadQuestion(this.currentQuiz.currentIndex - 1);
        }
    }

    nextQuestion() {
        if (this.currentQuiz.currentIndex < this.currentQuiz.questions.length - 1) {
            this.loadQuestion(this.currentQuiz.currentIndex + 1);
        }
    }

    startTimer() {
        // Set timer for 30 seconds per question
        this.currentQuiz.timeRemaining = this.currentQuiz.questions.length * 30;
        
        this.currentQuiz.timer = setInterval(() => {
            this.currentQuiz.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.currentQuiz.timeRemaining <= 0) {
                this.endQuiz();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            const minutes = Math.floor(this.currentQuiz.timeRemaining / 60);
            const seconds = this.currentQuiz.timeRemaining % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    endQuiz() {
        this.currentQuiz.active = false;
        this.currentQuiz.endTime = new Date();
        
        // Stop timer
        if (this.currentQuiz.timer) {
            clearInterval(this.currentQuiz.timer);
            this.currentQuiz.timer = null;
        }
        
        // Show results
        this.showResults();
    }

    showResults() {
        // Hide active quiz, show results
        const active = document.getElementById('quiz-active');
        const results = document.getElementById('quiz-results');
        const navigation = document.getElementById('quiz-navigation-container');
        
        if (active) active.classList.add('hidden');
        if (results) results.classList.remove('hidden');
        if (navigation) navigation.classList.add('hidden');
        
        // Calculate results
        const totalQuestions = this.currentQuiz.questions.length;
        const correctAnswers = this.currentQuiz.score;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Update results display
        const finalScore = document.getElementById('final-score');
        const totalAnswered = document.getElementById('total-questions-answered');
        const scorePercentage = document.getElementById('score-percentage');
        const correctCount = document.getElementById('correct-answers-count');
        const incorrectCount = document.getElementById('incorrect-answers-count');
        
        if (finalScore) finalScore.textContent = correctAnswers;
        if (totalAnswered) totalAnswered.textContent = totalQuestions;
        if (scorePercentage) scorePercentage.textContent = `${percentage}%`;
        if (correctCount) correctCount.textContent = correctAnswers;
        if (incorrectCount) incorrectCount.textContent = incorrectAnswers;
        
        // Show inspirational quote
        this.showInspirationalQuote(percentage);
        
        // Show mistakes
        this.showMistakes();
        
        // Show completion message
        this.app.showToast(`Quiz completed! You scored ${correctAnswers}/${totalQuestions} (${percentage}%)`, 
            percentage >= 70 ? 'success' : 'warning');
    }

    showMistakes() {
        const mistakesList = document.getElementById('mistakes-list');
        if (!mistakesList) return;
        
        mistakesList.innerHTML = '';
        
        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.currentQuiz.answers[index];
            if (userAnswer && userAnswer !== question.correctAnswer) {
                const mistakeItem = document.createElement('div');
                mistakeItem.className = 'mistake-item';
                
                mistakeItem.innerHTML = `
                    <div class="mistake-question">${question.question}</div>
                    <div class="mistake-details">
                        Your answer: <span class="your-answer">${userAnswer}</span><br>
                        Correct answer: <span class="correct-answer">${question.correctAnswer}</span>
                    </div>
                `;
                
                mistakesList.appendChild(mistakeItem);
            }
        });
        
        // Hide mistakes section if no mistakes
        const mistakesSection = document.getElementById('mistakes-summary');
        if (mistakesSection) {
            if (mistakesList.children.length === 0) {
                mistakesSection.style.display = 'none';
            } else {
                mistakesSection.style.display = 'block';
            }
        }
    }

    showInspirationalQuote(percentage) {
        const quoteText = document.getElementById('quote-text');
        const quoteAuthor = document.getElementById('quote-author');
        
        if (!quoteText || !quoteAuthor) return;
        
        const quotes = this.getQuotesByPercentage(percentage);
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        quoteText.textContent = randomQuote.text;
        quoteAuthor.textContent = randomQuote.author;
    }

    getQuotesByPercentage(percentage) {
        if (percentage >= 90) {
            return [
                { text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.", author: "Aristotle" },
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
                { text: "Outstanding! Your dedication to learning shines through.", author: "QuizWhiz" }
            ];
        } else if (percentage >= 80) {
            return [
                { text: "Great job! You're well on your way to mastery.", author: "QuizWhiz" },
                { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
                { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
                { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" }
            ];
        } else if (percentage >= 70) {
            return [
                { text: "Good work! Every step forward is progress.", author: "QuizWhiz" },
                { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
                { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
                { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" }
            ];
        } else if (percentage >= 50) {
            return [
                { text: "Keep going! Every mistake is a step closer to understanding.", author: "QuizWhiz" },
                { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
                { text: "The only way to learn mathematics is to do mathematics.", author: "Paul Halmos" },
                { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" }
            ];
        } else {
            return [
                { text: "Don't give up! Every expert was once a beginner.", author: "QuizWhiz" },
                { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
                { text: "It is impossible for a man to learn what he thinks he already knows.", author: "Epictetus" },
                { text: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb" }
            ];
        }
    }

    retakeQuiz() {
        // Reset answers but keep same questions
        this.currentQuiz.answers = new Array(this.currentQuiz.questions.length).fill(null);
        this.currentQuiz.score = 0;
        this.currentQuiz.currentIndex = 0;
        this.currentQuiz.active = true;
        this.currentQuiz.startTime = new Date();
        
        // Restart timer if needed
        if (this.currentQuiz.settings.mode === 'timed') {
            this.startTimer();
        }
        
        // Show quiz interface
        this.showQuizInterface();
        this.loadQuestion(0);
        
        this.app.showToast('Quiz restarted!', 'info');
    }

    newQuiz() {
        this.resetQuiz();
        
        // Show setup screen
        const setup = document.getElementById('quiz-setup');
        const active = document.getElementById('quiz-active');
        const results = document.getElementById('quiz-results');
        const navigation = document.getElementById('quiz-navigation-container');
        
        if (setup) setup.classList.remove('hidden');
        if (active) active.classList.add('hidden');
        if (results) results.classList.add('hidden');
        if (navigation) navigation.classList.add('hidden');
    }

    resetQuiz() {
        // Stop any running timer
        if (this.currentQuiz.timer) {
            clearInterval(this.currentQuiz.timer);
            this.currentQuiz.timer = null;
        }
        
        // Reset quiz state
        this.currentQuiz.active = false;
        this.currentQuiz.questions = [];
        this.currentQuiz.currentIndex = 0;
        this.currentQuiz.answers = [];
        this.currentQuiz.score = 0;
        this.currentQuiz.startTime = null;
        this.currentQuiz.endTime = null;
        this.currentQuiz.timeRemaining = 0;
    }

    // Method for MixedManager compatibility
    generateQuizQuestion(flashcard) {
        return this.createQuizQuestion(flashcard, 0);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizManager;
}