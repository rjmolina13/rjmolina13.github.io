// UI Management Module

class UIManager {
    constructor(app) {
        this.app = app;
        this.currentSection = 'flashcards';
        this.toastQueue = [];
        this.isShowingToast = false;
    }

    // Settings Methods
    toggleAnimations(enabled) {
        this.app.settings.animations = enabled;
        document.body.classList.toggle('no-animations', !enabled);
        this.app.dataManager.saveData();
    }

    updateAutoFlip(seconds) {
        this.app.settings.autoFlip = parseInt(seconds) || 0;
        this.app.dataManager.saveData();
    }

    toggleShuffleDefault(enabled) {
        this.app.settings.shuffleDefault = enabled;
        this.app.dataManager.saveData();
    }

    toggleDifficultyFeature(enabled) {
        this.app.settings.difficultyFeature = enabled;
        this.app.dataManager.saveData();
        
        // Update flashcard UI if currently visible
        if (this.currentSection === 'flashcards') {
            this.app.flashcardManager.showFlashcard(0);
        }
        
        this.showToast(`Difficulty tracking ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }



    // Section Management
    showSection(sectionName) {
        const sections = ['home', 'flashcards', 'quiz', 'mixed', 'content', 'settings', 'about'];
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = section === sectionName ? 'block' : 'none';
                if (section === sectionName) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            }
        });

        // Update navigation
        this.updateNavigation(sectionName);
        this.currentSection = sectionName;

        // Section-specific initialization
        switch (sectionName) {
            case 'flashcards':
                this.app.flashcardManager.showFlashcard(0);
                this.app.flashcardManager.updateDeckSelector();
                break;
            case 'quiz':
                this.app.quizManager.resetQuiz();
                this.updateQuizDeckSelector();
                break;
            case 'mixed':
                this.app.mixedManager.resetMixedMode();
                this.app.mixedManager.updateMixedDeckSelector();
                break;
            case 'content':
                this.app.flashcardManager.updateFlashcardFilters();
                this.app.flashcardManager.renderFlashcardManagement();
                break;
            case 'settings':
                this.loadSettingsUI();
                // Add a small delay to ensure DOM is fully rendered before setting up events
                setTimeout(() => {
                    console.log('🔧 UI Manager: Setting up settings events after DOM render');
                    if (this.app.eventHandler) {
                        this.app.eventHandler.setupSettingsEvents();
                    }
                }, 100);
                break;
            case 'about':
                this.loadAboutContent();
                break;
        }
    }

    updateNavigation(activeSection) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const section = btn.getAttribute('data-section');
            if (section === activeSection) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    getCurrentSection() {
        return this.currentSection;
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        this.toastQueue.push({ message, type, duration });
        if (!this.isShowingToast) {
            this.processToastQueue();
        }
    }

    async processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isShowingToast = false;
            return;
        }

        this.isShowingToast = true;
        const { message, type, duration } = this.toastQueue.shift();
        
        await this.displayToast(message, type, duration);
        this.processToastQueue();
    }

    displayToast(message, type, duration) {
        return new Promise((resolve) => {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icon = this.getToastIcon(type);
            toast.innerHTML = `
                <div class="toast-content">
                    <i class="${icon}"></i>
                    <span class="toast-message">${message}</span>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;

            const toastContainer = document.getElementById('toast-container');
            if (toastContainer) {
                toastContainer.appendChild(toast);
            } else {
                document.body.appendChild(toast);
            }

            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 100);

            // Auto remove
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                    resolve();
                }, 300);
            }, duration);
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Populate deck suggestions for modals with deck inputs
            if (modalId === 'add-flashcard-modal' || modalId === 'add-quiz-modal' || modalId === 'edit-quiz-modal') {
                this.populateAllDeckSuggestions();
            }
            
            // Populate stats modals
            if (modalId === 'best-score-modal') {
                this.populateBestScoreModal();
            } else if (modalId === 'study-streak-modal') {
                this.populateStudyStreakModal();
            }
            
            // Focus first input if available
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Clear form if it exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    // Populate deck suggestions for autocomplete
    populateDeckSuggestions() {
        const datalist = document.getElementById('deck-suggestions');
        if (!datalist) return;
        
        // Get unique deck names from existing flashcards (excluding 'all')
        const existingDecks = [...new Set(this.app.flashcards.map(card => card.deck))]
            .filter(deck => deck && deck.trim() !== '')
            .sort();
        
        // Clear existing options
        datalist.innerHTML = '';
        
        // Add deck suggestions as options
        existingDecks.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck;
            datalist.appendChild(option);
        });
    }

    // Populate all deck suggestion datalists with combined deck names from flashcards and quizzes
    populateAllDeckSuggestions() {
        // Get unique deck names from both flashcards and quizzes
        const allDecks = [...new Set([
            ...this.app.flashcards.map(card => card.deck),
            ...this.app.quizzes.map(quiz => quiz.deck)
        ])].filter(deck => deck && deck.trim() !== '').sort();
        
        // List of all datalist IDs that need deck suggestions
        const datalistIds = [
            'deck-suggestions',           // Add flashcard modal
            'quiz-deck-suggestions',      // Add quiz modal
            'edit-quiz-deck-suggestions'  // Edit quiz modal
        ];
        
        // Populate each datalist
        datalistIds.forEach(datalistId => {
            const datalist = document.getElementById(datalistId);
            if (datalist) {
                // Clear existing options
                datalist.innerHTML = '';
                
                // Add deck suggestions as options
                allDecks.forEach(deck => {
                    const option = document.createElement('option');
                    option.value = deck;
                    datalist.appendChild(option);
                });
            }
        });
    }

    setupFileInputListener() {
        const fileInput = document.getElementById('settings-file-input');
        if (fileInput) {
            console.log('🚨 CRITICAL DEBUG: File input element found in UI Manager, adding event listener');
            fileInput.addEventListener('change', (e) => {
                console.log('🚨 CRITICAL DEBUG: File input change event triggered in UI Manager');
                if (e.target.files[0]) {
                    console.log('🔥 ANALYZE FILE CONTENT FUNCTION CALLED from UI Manager!');
                    console.log('DEBUG: File selected:', e.target.files[0].name, 'Size:', e.target.files[0].size);
                    this.app.dataManager.processFile(e.target.files[0]);
                }
            });
        } else {
            console.log('❌ CRITICAL DEBUG: File input element NOT found in UI Manager');
        }
    }

    // Theme Management
    initializeTheme() {
        try {
            console.log('THEME DEBUG: initializeTheme called');
            console.log('THEME DEBUG: this.app exists:', !!this.app);
            console.log('THEME DEBUG: this.app.settings exists:', !!this.app?.settings);
            console.log('THEME DEBUG: this.app.settings.theme:', this.app?.settings?.theme);
        
        // Load theme from localStorage or use default
        const savedTheme = localStorage.getItem('qw_theme');
        console.log('THEME DEBUG: savedTheme from localStorage:', savedTheme);
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
            this.app.settings.theme = savedTheme;
        }
        console.log('THEME DEBUG: Final theme setting:', this.app.settings.theme);
        
        window.debugLog?.info('theme', `Initializing theme: ${this.app.settings.theme}`);
        this.applyTheme(this.app.settings.theme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.app.settings.theme === 'auto') {
                this.applyTheme('auto');
            }
        });
        } catch (error) {
            console.error('THEME DEBUG: Error in initializeTheme:', error);
        }
    }

    toggleTheme() {
        const currentTheme = this.app.settings.theme;
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        
        this.changeTheme(nextTheme);
        this.showToast(`Theme changed to ${nextTheme}`, 'success');
    }

    changeTheme(theme) {
        this.app.settings.theme = theme;
        localStorage.setItem('qw_theme', theme);
        this.applyTheme(theme);
        this.app.dataManager.saveData();
        
        // Update custom dropdown if visible
        if (this.app.eventHandler && this.app.eventHandler.themeDropdown) {
            this.app.eventHandler.themeDropdown.setValue(theme, true);
        }
        
        this.updateThemeDropdown(theme);
    }
    
    getThemeIcon(theme) {
        const icons = {
            light: '☀️',
            dark: '🌙',
            auto: '🔄'
        };
        return icons[theme] || icons.auto;
    }
    
    getThemeLabel(theme) {
        const labels = {
            light: 'Light',
            dark: 'Dark',
            auto: 'Auto'
        };
        return labels[theme] || labels.auto;
    }
    
    updateThemeDropdown(theme) {
        const selectedTheme = document.querySelector('.selected-theme');
        if (selectedTheme) {
            selectedTheme.innerHTML = `
                <span class="theme-icon">${this.getThemeIcon(theme)}</span>
                ${this.getThemeLabel(theme)}
            `;
        }
        
        // Update selected option
        const options = document.querySelectorAll('.custom-dropdown-option');
        options.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.value === theme) {
                option.classList.add('selected');
            }
        });
    }
    
    setupThemeDropdown() {
        const toggle = document.getElementById('theme-dropdown-toggle');
        const menu = document.getElementById('theme-dropdown-menu');
        const options = document.querySelectorAll('.custom-dropdown-option');
        
        if (!toggle || !menu) return;
        
        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = toggle.classList.contains('active');
            
            // Close all other dropdowns
            document.querySelectorAll('.custom-dropdown-toggle.active').forEach(t => {
                if (t !== toggle) {
                    t.classList.remove('active');
                    t.nextElementSibling.classList.remove('show');
                }
            });
            
            toggle.classList.toggle('active', !isActive);
            menu.classList.toggle('show', !isActive);
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.dataset.value;
                this.changeTheme(value);
                
                // Close dropdown
                toggle.classList.remove('active');
                menu.classList.remove('show');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('show');
        });
    }

    applyTheme(theme) {
        console.log('THEME DEBUG: applyTheme called with:', theme);
        const root = document.documentElement;
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const appliedTheme = prefersDark ? 'dark' : 'light';
            console.log('THEME DEBUG: Auto theme resolved to:', appliedTheme, 'prefersDark:', prefersDark);
            root.setAttribute('data-theme', appliedTheme);
            window.debugLog?.info('theme', `Applied auto theme: ${appliedTheme}`);
        } else {
            console.log('THEME DEBUG: Setting theme to:', theme);
            root.setAttribute('data-theme', theme);
            window.debugLog?.info('theme', `Applied theme: ${theme}`);
        }
        
        // Update theme button icon
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            const icons = {
                light: 'fas fa-sun',
                dark: 'fas fa-moon',
                auto: 'fas fa-adjust'
            };
            themeBtn.innerHTML = `<i class="${icons[theme]}"></i>`;
        }
    }

    // Settings UI
    loadSettingsUI() {
        const settingsContainer = document.getElementById('settings-content');
        if (!settingsContainer) return;

        const stats = this.getOverallStats();
        
        settingsContainer.innerHTML = `
            <div class="settings-grid">
                <div class="settings-section">
                    <h3><i class="fas fa-palette"></i> Appearance</h3>
                    <div class="setting-item">
                        <label for="theme-select">Theme</label>
                        <div class="custom-select" id="theme-selector-container">
                            <button class="select-button" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="selected-value">
                                    <span class="theme-icon">${this.getThemeIcon(this.app.settings.theme)}</span>
                                    ${this.getThemeLabel(this.app.settings.theme)}
                                </span>
                                <i class="fas fa-chevron-down arrow"></i>
                            </button>
                            <ul class="select-dropdown hidden" role="listbox">
                                <li class="select-option ${this.app.settings.theme === 'light' ? 'selected' : ''}" data-value="light" role="option">
                                    <i class="fas fa-sun"></i>
                                    Light
                                </li>
                                <li class="select-option ${this.app.settings.theme === 'dark' ? 'selected' : ''}" data-value="dark" role="option">
                                    <i class="fas fa-moon"></i>
                                    Dark
                                </li>
                                <li class="select-option ${this.app.settings.theme === 'auto' ? 'selected' : ''}" data-value="auto" role="option">
                                    <i class="fas fa-adjust"></i>
                                    Auto
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label for="animations-toggle">Animations</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="animations-toggle" 
                                   ${this.app.settings.animations ? 'checked' : ''}
                                   onchange="app.uiManager.toggleAnimations(this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-cog"></i> Study Settings</h3>
                    <div class="setting-item">
                        <label for="auto-flip">Auto-flip delay (seconds)</label>
                        <input type="number" id="auto-flip" min="0" max="30" 
                               value="${this.app.settings.autoFlip}"
                               onchange="app.uiManager.updateAutoFlip(this.value)">
                        <small>0 = disabled</small>
                    </div>
                    <div class="setting-item">
                        <label for="shuffle-default">Shuffle by default</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="shuffle-default" 
                                   ${this.app.settings.shuffleDefault ? 'checked' : ''}
                                   onchange="app.uiManager.toggleShuffleDefault(this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="difficulty-enabled">Enable difficulty tracking</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="difficulty-enabled" 
                                   ${this.app.settings.difficultyFeature ? 'checked' : ''}
                                   onchange="app.uiManager.toggleDifficultyFeature(this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                        <small>Show difficulty buttons on flashcards</small>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-chart-bar"></i> Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalFlashcards}</div>
                            <div class="stat-label">Total Flashcards</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalQuizzes}</div>
                            <div class="stat-label">Quizzes Taken</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.bestScore}%</div>
                            <div class="stat-label">Best Quiz Score</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.studyTime}</div>
                            <div class="stat-label">Study Time</div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-database"></i> Data Management</h3>
                    <div class="data-actions">
                        <div class="file-upload-container">
                            <input type="file" id="settings-file-input" accept=".json,.csv,.txt,.xml" style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('settings-file-input').click()">
                                <i class="fas fa-upload"></i> Import Data
                            </button>
                        </div>
                        <div class="export-group">
                            <button class="btn btn-secondary" onclick="app.dataManager.exportData('json')">
                                <i class="fas fa-download"></i> Export JSON
                            </button>
                            <button class="btn btn-secondary" onclick="app.dataManager.exportData('csv')">
                                <i class="fas fa-file-csv"></i> Export CSV
                            </button>
                            <button class="btn btn-secondary" onclick="app.dataManager.exportData('xml')">
                                <i class="fas fa-file-code"></i> Export XML
                            </button>
                        </div>
                        <button class="btn btn-danger" onclick="app.dataManager.clearAllData()">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
                    <div class="storage-info">
                        <small>Storage used: ${this.calculateStorageSize()}</small>
                    </div>
                </div>
            </div>
        `;        
        // Setup custom theme dropdown
        setTimeout(() => this.setupThemeDropdown(), 100);
        
        // Setup file input event listener for import functionality
        setTimeout(() => this.setupFileInputListener(), 100);
    }

    // About Page
    loadAboutContent() {
        const aboutContainer = document.getElementById('about-content');
        if (!aboutContainer) return;

        aboutContainer.innerHTML = `
            <div class="about-content">
                <div class="about-header">
                    <div class="app-logo">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h1>QuizWhiz</h1>
                    <p class="version">Version 2.0.0</p>
                </div>

                <div class="about-section">
                    <h2><i class="fas fa-info-circle"></i> About QuizWhiz</h2>
                    <p>
                        QuizWhiz is a comprehensive study application designed to help you learn and retain information 
                        through interactive flashcards, dynamic quizzes, and mixed study sessions. Whether you're 
                        preparing for exams, learning a new language, or mastering any subject, QuizWhiz provides 
                        the tools you need to succeed.
                    </p>
                </div>

                <div class="about-section">
                    <h2><i class="fas fa-lightbulb"></i> The Inspiration Behind This Project</h2>
                    <p>
                        QuizWhiz was born from the recognition that traditional study methods often fall short in 
                        engaging learners and promoting long-term retention. The inspiration came from observing 
                        students struggle with passive reading and highlighting, which research shows is less 
                        effective than active recall and spaced repetition.
                    </p>
                    <p>
                        The project aims to bridge the gap between modern learning science and practical study tools. 
                        By combining the proven effectiveness of flashcards with the engagement of quiz-based learning, 
                        QuizWhiz creates an environment where studying becomes both effective and enjoyable.
                    </p>
                    <p>
                        The mixed study mode was particularly inspired by research showing that varied practice 
                        (interleaving different types of learning activities) leads to better retention and 
                        transfer of knowledge compared to blocked practice of a single activity type.
                    </p>
                </div>

                <div class="about-section">
                    <h2><i class="fas fa-star"></i> Key Features</h2>
                    <div class="features-grid">
                        <div class="feature-item">
                            <i class="fas fa-cards-blank"></i>
                            <h3>Interactive Flashcards</h3>
                            <p>Create, organize, and study with digital flashcards that support rich text and multiple difficulty levels.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-question-circle"></i>
                            <h3>Dynamic Quizzes</h3>
                            <p>Auto-generated quizzes with multiple choice, true/false, and fill-in-the-blank questions.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-random"></i>
                            <h3>Mixed Study Mode</h3>
                            <p>Combine flashcards and quizzes in a single session for varied and effective practice.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-chart-line"></i>
                            <h3>Progress Tracking</h3>
                            <p>Monitor your learning progress with detailed statistics and performance analytics.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-file-import"></i>
                            <h3>Import/Export</h3>
                            <p>Import content from various file formats and export your data for backup or sharing.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-palette"></i>
                            <h3>Customizable Interface</h3>
                            <p>Personalize your study experience with themes, animations, and flexible settings.</p>
                        </div>
                    </div>
                </div>

                <div class="about-section">
                    <h2><i class="fas fa-graduation-cap"></i> Learning Science</h2>
                    <p>
                        QuizWhiz is built on proven learning principles:
                    </p>
                    <ul>
                        <li><strong>Active Recall:</strong> Testing yourself retrieves information from memory, strengthening neural pathways.</li>
                        <li><strong>Spaced Repetition:</strong> Reviewing material at increasing intervals optimizes long-term retention.</li>
                        <li><strong>Interleaving:</strong> Mixing different types of practice improves discrimination and transfer.</li>
                        <li><strong>Immediate Feedback:</strong> Quick correction of mistakes prevents the reinforcement of errors.</li>
                        <li><strong>Metacognition:</strong> Difficulty ratings help you understand your own learning process.</li>
                    </ul>
                </div>

                <div class="about-section">
                    <h2><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h2>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + 1-5</kbd>
                            <span>Navigate between sections</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>←/→</kbd>
                            <span>Previous/Next flashcard</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Space</kbd>
                            <span>Flip flashcard</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Close modal</span>
                        </div>
                    </div>
                </div>

                <div class="about-section">
                    <h2><i class="fas fa-heart"></i> Acknowledgments</h2>
                    <p>
                        Special thanks to the educational research community whose work on learning science 
                        made this project possible, and to all the students and educators who provided 
                        feedback during development.
                    </p>
                </div>

                <div class="about-footer">
                    <p>
                        <i class="fas fa-code"></i> 
                        Built with modern web technologies for optimal performance and accessibility.
                    </p>
                    <p class="copyright">
                        © 2024 QuizWhiz. Made with ❤️ for learners everywhere.
                    </p>
                </div>
            </div>
        `;
    }

    // Settings Handlers
    changeTheme(theme) {
        this.app.settings.theme = theme;
        this.applyTheme(theme);
        this.app.dataManager.saveData();
        this.showToast(`Theme changed to ${theme}`, 'success');
    }

    toggleAnimations(enabled) {
        this.app.settings.animations = enabled;
        document.body.classList.toggle('no-animations', !enabled);
        this.app.dataManager.saveData();
        this.showToast(`Animations ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    updateAutoFlip(seconds) {
        this.app.settings.autoFlip = parseInt(seconds) || 0;
        this.app.dataManager.saveData();
        this.showToast(`Auto-flip set to ${seconds} seconds`, 'success');
    }

    toggleShuffleDefault(enabled) {
        this.app.settings.shuffleDefault = enabled;
        this.app.dataManager.saveData();
        this.showToast(`Shuffle default ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    toggleDifficultyFeature(enabled) {
        this.app.settings.difficultyFeature = enabled;
        
        // Update body attribute to control CSS visibility
        document.body.setAttribute('data-difficulty-enabled', enabled.toString());
        
        // Update flashcards with difficulty if enabled
        if (enabled) {
            this.app.flashcards.forEach(card => {
                if (!card.difficulty) {
                    card.difficulty = 'medium'; // default difficulty
                }
            });
        }
        
        this.app.dataManager.saveData();
        this.showToast(`Difficulty feature ${enabled ? 'enabled' : 'disabled'}`, 'success');
        
        // Refresh UI to show/hide difficulty controls
        this.app.updateUI();
    }

    // Utility Methods
    updateQuizDeckSelector() {
        const selector = document.getElementById('quiz-deck-selector');
        if (!selector) return;

        // Get unique deck names from quizzes
        const decks = [...new Set(this.app.quizzes.map(quiz => quiz.deck))]
            .filter(deck => deck && deck.trim() !== '')
            .sort();

        // Count items per deck
        const deckCounts = {};
        decks.forEach(deck => {
            deckCounts[deck] = this.app.quizzes.filter(quiz => quiz.deck === deck).length;
        });

        // Store current selection
        const currentValue = selector.value;
        const totalQuizzes = this.app.quizzes.length;

        // Update selector with counts
        selector.innerHTML = `
            <option value="all">All Decks (${totalQuizzes} quizzes)</option>
            ${decks.map(deck => `<option value="${deck}">${deck} (${deckCounts[deck]} quizzes)</option>`).join('')}
        `;

        // Restore selection if it still exists
        if (decks.includes(currentValue) || currentValue === 'all') {
            selector.value = currentValue;
        }
    }

    // Stat Card Interaction Methods
    setupStatCardListeners() {
        const statCards = document.querySelectorAll('.stat-card.clickable');
        statCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const action = card.getAttribute('data-action');
                const target = card.getAttribute('data-target');
                
                if (action === 'navigate') {
                    this.app.showSection(target);
                } else if (action === 'modal') {
                    this.openModal(target);
                }
            });
        });
    }

    populateBestScoreModal() {
        const container = document.getElementById('best-score-breakdown');
        if (!container) return;

        // Get quiz stats from localStorage
        const quizStats = JSON.parse(localStorage.getItem('quizwhiz_quiz_stats') || '{}');
        const overallBestScore = this.getOverallBestScore();
        
        let content = `
            <div class="breakdown-section">
                <h3><i class="fas fa-trophy"></i> Overall Performance</h3>
                <div class="breakdown-grid">
                    <div class="breakdown-item highlight">
                        <span class="label">Best Score</span>
                        <span class="value">${overallBestScore}%</span>
                    </div>
                </div>
            </div>
        `;

        // Add deck-specific scores if available
        if (Object.keys(quizStats).length > 0) {
            content += `
                <div class="breakdown-section">
                    <h3><i class="fas fa-layer-group"></i> Best Scores by Deck</h3>
                    <div class="breakdown-grid">
            `;
            
            Object.entries(quizStats).forEach(([deck, stats]) => {
                if (stats.bestScore !== undefined) {
                    content += `
                        <div class="breakdown-item">
                            <span class="label">${deck}</span>
                            <span class="value">${stats.bestScore}%</span>
                        </div>
                    `;
                }
            });
            
            content += `
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="breakdown-section">
                    <p style="text-align: center; color: var(--text-secondary); margin: 0;">
                        <i class="fas fa-info-circle"></i> No quiz data available yet. Take some quizzes to see detailed statistics!
                    </p>
                </div>
            `;
        }

        container.innerHTML = content;
    }

    populateStudyStreakModal() {
        const container = document.getElementById('study-streak-breakdown');
        if (!container) return;

        // Get detailed streak data from data manager
        const streakStats = this.app.dataManager ? this.app.dataManager.getStreakStats() : {
            currentStreak: 0,
            longestStreak: 0,
            totalStudyDays: 0,
            lastStudyDate: null,
            studyDates: []
        };
        
        const currentStreak = streakStats.currentStreak;
        const longestStreak = streakStats.longestStreak;
        const totalStudyDays = streakStats.totalStudyDays;
        const lastStudyDate = streakStats.lastStudyDate;
        
        let content = `
            <div class="breakdown-section">
                <h3><i class="fas fa-fire"></i> Current Streak</h3>
                <div class="breakdown-grid">
                    <div class="breakdown-item highlight">
                        <span class="label">Days Studied</span>
                        <span class="value">${currentStreak}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Status</span>
                        <span class="value">${currentStreak > 0 ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            </div>
            
            <div class="breakdown-section">
                <h3><i class="fas fa-chart-line"></i> Streak Statistics</h3>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <span class="label">Longest Streak</span>
                        <span class="value">${longestStreak} days</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Total Study Days</span>
                        <span class="value">${totalStudyDays}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Streak Level</span>
                        <span class="value">${this.getStreakLevel(currentStreak)}</span>
                    </div>
                    ${lastStudyDate ? `
                        <div class="breakdown-item">
                            <span class="label">Last Study Date</span>
                            <span class="value">${new Date(lastStudyDate).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (currentStreak === 0) {
            content += `
                <div class="breakdown-section">
                    <p style="text-align: center; color: var(--text-secondary); margin: 0;">
                        <i class="fas fa-info-circle"></i> Start studying to build your streak! Complete flashcard reviews or quizzes for consecutive days to maintain it.
                    </p>
                </div>
            `;
        } else {
            // Show recent study activity
            const recentDates = streakStats.studyDates.slice(-7); // Last 7 study dates
            if (recentDates.length > 0) {
                content += `
                    <div class="breakdown-section">
                        <h3><i class="fas fa-calendar-check"></i> Recent Activity</h3>
                        <div class="recent-activity">
                            ${recentDates.map(date => `
                                <div class="activity-day">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${new Date(date).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = content;
    }

    getStreakLevel(streak) {
        if (streak === 0) return 'None';
        if (streak < 7) return 'Beginner';
        if (streak < 30) return 'Consistent';
        if (streak < 100) return 'Dedicated';
        return 'Master';
    }

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

    getOverallStats() {
        const totalFlashcards = this.app.flashcards.length;
        const totalQuizzes = this.app.stats.totalQuizzes || 0;
        const bestScore = this.app.stats.bestScore || 0;
        const totalStudyTime = this.app.stats.totalStudyTime || 0;
        
        const hours = Math.floor(totalStudyTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalStudyTime % (1000 * 60 * 60)) / (1000 * 60));
        const studyTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        return {
            totalFlashcards,
            totalQuizzes,
            bestScore,
            studyTime
        };
    }

    // Responsive Design Helpers
    isMobile() {
        return window.innerWidth <= 768;
    }

    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    isDesktop() {
        return window.innerWidth > 1024;
    }

    // Accessibility Helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Focus Management
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Settings Display Update
    updateSettingsDisplay() {
        const themeSelect = document.getElementById('theme-select');
        const animationToggle = document.getElementById('animation-toggle');
        const autoFlip = document.getElementById('auto-flip');
        const shuffleDefault = document.getElementById('shuffle-default');
        const difficultyFeature = document.getElementById('difficulty-feature');
        
        if (themeSelect) themeSelect.value = this.app.settings.theme || 'auto';
        if (animationToggle) animationToggle.checked = this.app.settings.animations !== false;
        if (autoFlip) autoFlip.value = this.app.settings.autoFlip || 0;
        if (shuffleDefault) shuffleDefault.checked = this.app.settings.shuffleDefault === true;
        if (difficultyFeature) difficultyFeature.checked = this.app.settings.difficultyFeature === true;
        
        // Set body attribute for difficulty feature CSS control
        document.body.setAttribute('data-difficulty-enabled', (this.app.settings.difficultyFeature === true).toString());
    }

    // Storage Info Update
    updateStorageInfo() {
        const storageElement = document.getElementById('storage-used');
        const totalFlashcardsElement = document.getElementById('total-flashcards-count');
        const totalQuizzesElement = document.getElementById('total-quizzes-count');
        
        if (storageElement) {
            storageElement.textContent = this.calculateStorageSize();
        }
        if (totalFlashcardsElement) {
            totalFlashcardsElement.textContent = this.app.flashcards.length;
        }
        if (totalQuizzesElement) {
            totalQuizzesElement.textContent = this.app.quizzes.length;
        }
    }

    // Stats Update
    updateStats() {
        const totalFlashcardsElement = document.getElementById('total-flashcards');
        const totalQuizzesElement = document.getElementById('total-quizzes');
        const quizScoreElement = document.getElementById('quiz-score');
        const studyStreakElement = document.getElementById('study-streak');
        
        if (totalFlashcardsElement) {
            totalFlashcardsElement.textContent = this.app.flashcards.length;
        }
        if (totalQuizzesElement) {
            totalQuizzesElement.textContent = this.app.quizzes.length;
        }
        if (quizScoreElement) {
            // Get overall best score from all decks
            const overallBestScore = this.getOverallBestScore();
            quizScoreElement.textContent = `${overallBestScore}%`;
        }
        if (studyStreakElement) {
            studyStreakElement.textContent = this.app.stats.studyStreak;
        }
    }
    
    // Get overall best score from all quiz decks
    getOverallBestScore() {
        try {
            const quizStats = JSON.parse(localStorage.getItem('quizwhiz_quiz_stats') || '{}');
            let overallBest = 0;
            
            // Iterate through all decks and find the highest score
            Object.values(quizStats).forEach(deckStats => {
                if (deckStats.bestScores) {
                    const deckBestScores = Object.values(deckStats.bestScores);
                    if (deckBestScores.length > 0) {
                        const deckBest = Math.max(...deckBestScores);
                        overallBest = Math.max(overallBest, deckBest);
                    }
                }
            });
            
            return overallBest;
        } catch (error) {
            window.debugLog?.error('uiManager', 'Error getting overall best score:', error);
            return this.app.stats.bestScore || 0;
        }
    }
}

// Make UIManager available globally
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}