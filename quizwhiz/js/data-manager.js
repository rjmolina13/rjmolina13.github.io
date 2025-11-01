// Data Management Module

class DataManager {
    constructor(app) {
        this.app = app;
    }

    // Import quiz data from external sources
    // TODO: Previously used for Google Form extraction
    async importQuizData(quizzes) {
        if (!Array.isArray(quizzes)) {
            throw new Error('Invalid quiz data format');
        }

        // Add imported quizzes to existing data
        this.app.quizzes.push(...quizzes);
        
        // Save updated data
        this.saveData();
        
        // Update UI
        this.app.updateUI();
        
        return quizzes.length;
    }

    // Data Management
    loadData() {
        try {
            const savedFlashcards = localStorage.getItem('quizwhiz_flashcards');
            const savedQuizzes = localStorage.getItem('quizwhiz_quizzes');
            const savedSettings = localStorage.getItem('quizwhiz_settings');
            const savedStats = localStorage.getItem('quizwhiz_stats');
            const savedStreakData = localStorage.getItem('quizwhiz_streak_data');

            if (savedFlashcards) {
                this.app.flashcards = JSON.parse(savedFlashcards);
                // Migrate flashcards without difficulty values
                this.migrateFlashcardDifficulties();
            }
            if (savedQuizzes) {
                this.app.quizzes = JSON.parse(savedQuizzes);
            }
            if (savedSettings) {
                this.app.settings = { ...this.app.settings, ...JSON.parse(savedSettings) };
            }
            if (savedStats) {
                this.app.stats = { ...this.app.stats, ...JSON.parse(savedStats) };
            }
            
            // Load and update study streak data
            this.loadAndUpdateStreakData(savedStreakData);
            
            // Ensure all flashcards have difficulty values after loading
            this.migrateFlashcardDifficulties();
        } catch (error) {
            console.error('Error loading data:', error);
            this.app.showToast('Error loading saved data', 'error');
        }
    }

    // Migration function to ensure all flashcards have difficulty values
    migrateFlashcardDifficulties() {
        let migrated = false;
        
        this.app.flashcards.forEach(card => {
            if (!card.difficulty) {
                card.difficulty = 'medium';
                migrated = true;
            }
        });
        
        // Save data if any cards were migrated
        if (migrated) {
            this.saveData();
        }
    }



    saveData() {
        try {
            localStorage.setItem('quizwhiz_flashcards', JSON.stringify(this.app.flashcards));
            localStorage.setItem('quizwhiz_quizzes', JSON.stringify(this.app.quizzes));
            localStorage.setItem('quizwhiz_settings', JSON.stringify(this.app.settings));
            localStorage.setItem('quizwhiz_stats', JSON.stringify(this.app.stats));
            
            // Save streak data
            if (this.app.streakData) {
                localStorage.setItem('quizwhiz_streak_data', JSON.stringify(this.app.streakData));
            }
        } catch (error) {
            console.error('Error saving data:', error);
            this.app.showToast('Error saving data', 'error');
        }
    }

    exportData(format = 'json') {
        // Export all localStorage content
        const allLocalStorageData = {};
        
        // Get all localStorage keys that start with 'quizwhiz_'
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('quizwhiz_')) {
                try {
                    const value = localStorage.getItem(key);
                    // Try to parse as JSON, if it fails, store as string
                    try {
                        allLocalStorageData[key] = JSON.parse(value);
                    } catch {
                        allLocalStorageData[key] = value;
                    }
                } catch (error) {
                    console.warn(`Failed to export localStorage key: ${key}`, error);
                }
            }
        }
        
        const data = {
            ...allLocalStorageData,
            exportDate: new Date().toISOString(),
            exportVersion: '2.0' // Version to track export format
        };

        // Get current username for filename
        const currentUser = this.app.userManager && this.app.userManager.currentUser ? this.app.userManager.currentUser.username : 'User';
        const sanitizedUsername = currentUser.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize username for filename
        const timestamp = new Date().toISOString().split('T')[0];

        let content, filename, mimeType;

        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename = `quizwhiz_backup-${sanitizedUsername}-${timestamp}.json`;
                mimeType = 'application/json';
                break;
            case 'xml':
                content = this.convertToXML(data);
                filename = `quizwhiz_backup-${sanitizedUsername}-${timestamp}.xml`;
                mimeType = 'application/xml';
                break;
            case 'csv':
                content = this.convertToCSV(this.app.flashcards);
                filename = `quizwhiz_flashcards-${sanitizedUsername}-${timestamp}.csv`;
                mimeType = 'text/csv';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        this.app.showToast(`Data exported as ${format.toUpperCase()}`, 'success');
    }

    // Study Streak Management
    loadAndUpdateStreakData(savedStreakData) {
        const today = new Date().toDateString();
        
        // Initialize default streak data
        let streakData = {
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
            studyDates: [], // Array of study dates for detailed tracking
            totalStudyDays: 0
        };
        
        // Load existing streak data if available
        if (savedStreakData) {
            try {
                streakData = { ...streakData, ...JSON.parse(savedStreakData) };
            } catch (error) {
                console.warn('Error parsing streak data, using defaults:', error);
            }
        }
        
        // Update streak based on last study date
        this.updateStreakOnLogin(streakData, today);
        
        // Store in app
        this.app.streakData = streakData;
        this.app.stats.studyStreak = streakData.currentStreak;
    }
    
    updateStreakOnLogin(streakData, today) {
        const lastStudyDate = streakData.lastStudyDate;
        
        if (!lastStudyDate) {
            // First time user - no streak yet
            return;
        }
        
        const lastDate = new Date(lastStudyDate);
        const todayDate = new Date(today);
        const daysDifference = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference === 1) {
            // Consecutive day - maintain streak
            return;
        } else if (daysDifference > 1) {
            // Missed days - reset streak
            streakData.currentStreak = 0;
        }
        // If daysDifference === 0, it's the same day, no change needed
    }
    
    recordStudySession() {
        const today = new Date().toDateString();
        
        if (!this.app.streakData) {
            this.loadAndUpdateStreakData(null);
        }
        
        const streakData = this.app.streakData;
        
        // Check if already studied today
        if (streakData.lastStudyDate === today) {
            return; // Already recorded for today
        }
        
        const lastStudyDate = streakData.lastStudyDate;
        
        if (!lastStudyDate) {
            // First study session ever
            streakData.currentStreak = 1;
            streakData.longestStreak = 1;
            streakData.totalStudyDays = 1;
        } else {
            const lastDate = new Date(lastStudyDate);
            const todayDate = new Date(today);
            const daysDifference = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDifference === 1) {
                // Consecutive day
                streakData.currentStreak += 1;
                streakData.totalStudyDays += 1;
            } else if (daysDifference > 1) {
                // Missed days - start new streak
                streakData.currentStreak = 1;
                streakData.totalStudyDays += 1;
            }
            // If daysDifference === 0, it's the same day, no change needed
        }
        
        // Update longest streak if current is higher
        if (streakData.currentStreak > streakData.longestStreak) {
            streakData.longestStreak = streakData.currentStreak;
        }
        
        // Record the study date
        streakData.lastStudyDate = today;
        
        // Add to study dates array (keep last 30 days for performance)
        if (!streakData.studyDates.includes(today)) {
            streakData.studyDates.push(today);
            // Keep only last 30 entries
            if (streakData.studyDates.length > 30) {
                streakData.studyDates = streakData.studyDates.slice(-30);
            }
        }
        
        // Update app stats
        this.app.stats.studyStreak = streakData.currentStreak;
        
        // Save data
        this.saveData();
        
        // Update UI if on home page
        if (this.app.uiManager && typeof this.app.uiManager.updateStats === 'function') {
            this.app.uiManager.updateStats();
        }
    }

    convertToXML(data) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<quizwhiz>\n';
        
        // Add export metadata
        xml += `  <exportDate>${data.exportDate}</exportDate>\n`;
        xml += `  <exportVersion>${data.exportVersion || '2.0'}</exportVersion>\n`;
        
        // Export all localStorage data
        for (const [key, value] of Object.entries(data)) {
            // Skip metadata fields as they're already added
            if (key === 'exportDate' || key === 'exportVersion') {
                continue;
            }
            
            // Only export quizwhiz localStorage keys
            if (key.startsWith('quizwhiz_')) {
                const cleanKey = key.replace('quizwhiz_', '');
                xml += `  <${cleanKey}>\n`;
                
                if (key === 'quizwhiz_flashcards' && Array.isArray(value)) {
                    value.forEach(card => {
                        xml += `    <flashcard id="${card.id}">\n`;
                        xml += `      <question><![CDATA[${card.question}]]></question>\n`;
                        xml += `      <answer><![CDATA[${card.answer}]]></answer>\n`;
                        xml += `      <deck><![CDATA[${card.deck}]]></deck>\n`;
                        xml += `      <difficulty>${card.difficulty}</difficulty>\n`;
                        xml += `      <created>${card.created}</created>\n`;
                        xml += `    </flashcard>\n`;
                    });
                } else if (key === 'quizwhiz_quizzes' && Array.isArray(value)) {
                    value.forEach(quiz => {
                        xml += `    <quiz id="${quiz.id}">\n`;
                        xml += `      <question><![CDATA[${quiz.question}]]></question>\n`;
                        xml += `      <correctAnswer><![CDATA[${quiz.correctAnswer}]]></correctAnswer>\n`;
                        xml += `      <deck><![CDATA[${quiz.deck}]]></deck>\n`;
                        xml += `      <difficulty>${quiz.difficulty}</difficulty>\n`;
                        if (quiz.wrongAnswers && Array.isArray(quiz.wrongAnswers)) {
                            quiz.wrongAnswers.forEach(wrongAnswer => {
                                xml += `      <wrongAnswer><![CDATA[${wrongAnswer}]]></wrongAnswer>\n`;
                            });
                        }
                        xml += `      <created>${quiz.created}</created>\n`;
                        xml += `    </quiz>\n`;
                    });
                } else if (typeof value === 'object') {
                    // Handle objects (settings, stats, user data)
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        xml += `    <${subKey}><![CDATA[${JSON.stringify(subValue)}]]></${subKey}>\n`;
                    });
                } else {
                    // Handle primitive values
                    xml += `    <![CDATA[${value}]]>\n`;
                }
                
                xml += `  </${cleanKey}>\n`;
            }
        }
        
        xml += '</quizwhiz>';
        return xml;
    }

    convertToCSV(flashcards) {
        const headers = ['ID', 'Question', 'Answer', 'Deck', 'Difficulty', 'Created', 'Last Reviewed', 'Review Count'];
        let csv = headers.join(',') + '\n';
        
        flashcards.forEach(card => {
            const row = [
                card.id,
                `"${card.question.replace(/"/g, '""')}"`,
                `"${card.answer.replace(/"/g, '""')}"`,
                `"${card.deck.replace(/"/g, '""')}"`,
                card.difficulty,
                card.created,
                card.lastReviewed || '',
                card.reviewCount || 0
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getStreakStats() {
        if (!this.app.streakData) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                totalStudyDays: 0,
                lastStudyDate: null,
                studyDates: []
            };
        }
        
        return { ...this.app.streakData };
    }
    
    clearAllData() {
        // Open the custom confirmation modal instead of native confirm
        this.app.uiManager.openModal('clear-data-modal');
    }

    confirmClearAllData() {
        // Close the modal first
        this.app.uiManager.closeModal('clear-data-modal');
        
        // Count flashcards and quizzes before clearing
        const flashcardCount = this.app.flashcards.length;
        const quizCount = this.app.quizzes.length;
        
        // Clear all localStorage items that start with 'quizwhiz_'
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('quizwhiz_')) {
                keysToRemove.push(key);
            }
        }
        
        // Remove all identified keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reset app state to defaults
        this.app.flashcards = [];
        this.app.quizzes = [];
        this.app.settings = {
            theme: 'auto',
            animations: true,
            autoFlip: 0,
            shuffleDefault: false,
            difficultyFeature: false
        };
        this.app.stats = {
            totalFlashcards: 0,
            bestScore: 0,
            studyStreak: 0
        };
        
        // Reset user data if userManager exists
        if (this.app.userManager) {
            this.app.userManager.currentUser = null;
        }
        
        // Reset theme to default
        if (this.app.uiManager) {
            this.app.uiManager.applyTheme('auto');
        }
        
        this.app.updateUI();
        
        // Show specific clear message with counts
        const parts = [];
        if (flashcardCount > 0) parts.push(`${flashcardCount} flashcard${flashcardCount !== 1 ? 's' : ''}`);
        if (quizCount > 0) parts.push(`${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`);
        const message = parts.length > 0 ? `Successfully cleared ${parts.join(' and ')}` : 'All data cleared successfully';
        
        this.app.showToast(message, 'success');
    }

    importData() {
        // This method is deprecated - file upload is now handled directly by the settings-file-input
        // through the settingsFileUploadArea click event in event-handler.js
        console.warn('importData() method called but is deprecated. Use settings-file-input directly.');
    }

    async processFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        try {
            // First analyze the file content
            const analysis = await this.analyzeFileContent(file);
            
            // Show import confirmation modal with analysis
            this.showImportConfirmationModal(file, analysis);
        } catch (error) {
            console.error('Error processing file:', error);
            this.app.showToast('Error processing file: ' + error.message, 'error');
        }
    }

    async analyzeFileContent(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const analysis = {
            fileName: file.name,
            fileSize: this.formatFileSize(file.size),
            fileType: fileExtension.toUpperCase(),
            flashcards: 0,
            quizzes: 0,
            settings: false,
            stats: false,
            userProfile: false,
            decks: [],
            difficulties: [],
            isCompleteBackup: false,
            preview: []
        };

        try {
            switch (fileExtension) {
                case 'json':
                    await this.analyzeJSON(file, analysis);
                    break;
                case 'xml':
                    await this.analyzeXML(file, analysis);
                    break;
                case 'csv':
                    await this.analyzeCSV(file, analysis);
                    break;
                case 'txt':
                    await this.analyzeTXT(file, analysis);
                    break;
                case 'pdf':
                    analysis.preview.push('PDF content will be extracted and converted to flashcards');
                    break;
                case 'docx':
                    analysis.preview.push('DOCX content will be extracted and converted to flashcards');
                    break;
                default:
                    throw new Error('Unsupported file format');
            }
        } catch (error) {
            analysis.error = error.message;
        }

        return analysis;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async analyzeJSON(file, analysis) {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Check if this is a complete backup
        if (data.exportVersion === '2.0' || data.quizwhiz_settings || data.quizwhiz_stats) {
            analysis.isCompleteBackup = true;
            analysis.preview.push('Complete QuizWhiz backup detected');
            
            if (data.quizwhiz_flashcards) {
                analysis.flashcards = Array.isArray(data.quizwhiz_flashcards) ? data.quizwhiz_flashcards.length : 0;
            }
            if (data.quizwhiz_quizzes) {
                analysis.quizzes = Array.isArray(data.quizwhiz_quizzes) ? data.quizwhiz_quizzes.length : 0;
            }
            if (data.quizwhiz_settings) {
                analysis.settings = true;
            }
            if (data.quizwhiz_stats) {
                analysis.stats = true;
            }
            if (data.quizwhiz_user) {
                analysis.userProfile = true;
            }
        } else if (data.flashcards && Array.isArray(data.flashcards)) {
            analysis.flashcards = data.flashcards.length;
            analysis.decks = [...new Set(data.flashcards.map(f => f.deck || 'General'))];
            analysis.difficulties = [...new Set(data.flashcards.map(f => f.difficulty || 'medium'))];
            
            if (data.quizzes && Array.isArray(data.quizzes)) {
                analysis.quizzes = data.quizzes.length;
            }
            if (data.settings) {
                analysis.settings = true;
            }
            if (data.stats) {
                analysis.stats = true;
            }
            
            // Add preview of first few flashcards
            const previewCount = Math.min(3, data.flashcards.length);
            for (let i = 0; i < previewCount; i++) {
                const card = data.flashcards[i];
                analysis.preview.push(`Q: ${card.question?.substring(0, 50)}${card.question?.length > 50 ? '...' : ''}`);
            }
        }
    }

    async analyzeXML(file, analysis) {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        const flashcards = xmlDoc.querySelectorAll('flashcard');
        analysis.flashcards = flashcards.length;
        
        const decks = new Set();
        const difficulties = new Set();
        
        flashcards.forEach((card, index) => {
            if (index < 3) {
                const question = card.querySelector('question')?.textContent;
                if (question) {
                    analysis.preview.push(`Q: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`);
                }
            }
            
            const deck = card.querySelector('deck')?.textContent || 'General';
            const difficulty = card.querySelector('difficulty')?.textContent || 'medium';
            decks.add(deck);
            difficulties.add(difficulty);
        });
        
        analysis.decks = Array.from(decks);
        analysis.difficulties = Array.from(difficulties);
    }

    async analyzeCSV(file, analysis) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
            analysis.flashcards = lines.length - 1; // Subtract header row
            
            const decks = new Set();
            const difficulties = new Set();
            
            for (let i = 1; i < Math.min(4, lines.length); i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= 2) {
                    const question = values[0]?.replace(/^"|"$/g, '');
                    if (question) {
                        analysis.preview.push(`Q: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`);
                    }
                    
                    if (values[2]) decks.add(values[2].replace(/^"|"$/g, ''));
                    if (values[3]) difficulties.add(values[3]);
                }
            }
            
            analysis.decks = Array.from(decks);
            analysis.difficulties = Array.from(difficulties);
        }
    }

    async analyzeTXT(file, analysis) {
        const text = await file.text();
        const flashcards = this.extractFlashcardsFromText(text, true); // true for analysis mode
        
        analysis.flashcards = flashcards.length;
        analysis.decks = [...new Set(flashcards.map(f => f.deck || 'General'))];
        analysis.difficulties = [...new Set(flashcards.map(f => f.difficulty || 'medium'))];
        
        const previewCount = Math.min(3, flashcards.length);
        for (let i = 0; i < previewCount; i++) {
            const card = flashcards[i];
            analysis.preview.push(`Q: ${card.question?.substring(0, 50)}${card.question?.length > 50 ? '...' : ''}`);
        }
    }

    showImportConfirmationModal(file, analysis) {
        // Create modal HTML
        const modalHTML = `
            <div id="import-confirmation-modal" class="import-confirmation-modal show">
                <div class="import-modal-content">
                    <div class="import-modal-header">
                        <h2><i class="fas fa-file-import"></i> Import Confirmation</h2>
                        <span class="import-modal-close" onclick="this.closest('.import-confirmation-modal').classList.remove('show')">&times;</span>
                    </div>
                    <div class="import-modal-body">
                        <div class="import-analysis">
                            <h3>File Analysis</h3>
                            <div class="file-info">
                                <p><strong>File:</strong> ${analysis.fileName}</p>
                                <p><strong>Size:</strong> ${analysis.fileSize}</p>
                                <p><strong>Type:</strong> ${analysis.fileType}</p>
                                ${analysis.isCompleteBackup ? '<p class="backup-badge"><i class="fas fa-shield-alt"></i> Complete Backup</p>' : ''}
                            </div>
                            
                            <div class="content-summary">
                                <h4>Content Summary</h4>
                                <div class="summary-grid">
                                    ${analysis.flashcards > 0 ? `<div class="summary-item"><i class="fas fa-layer-group"></i> ${analysis.flashcards} Flashcard${analysis.flashcards !== 1 ? 's' : ''}</div>` : ''}
                                    ${analysis.quizzes > 0 ? `<div class="summary-item"><i class="fas fa-question-circle"></i> ${analysis.quizzes} Quiz${analysis.quizzes !== 1 ? 'zes' : ''}</div>` : ''}
                                    ${analysis.settings ? '<div class="summary-item"><i class="fas fa-cog"></i> Settings</div>' : ''}
                                    ${analysis.stats ? '<div class="summary-item"><i class="fas fa-chart-bar"></i> Statistics</div>' : ''}
                                    ${analysis.userProfile ? '<div class="summary-item"><i class="fas fa-user"></i> User Profile</div>' : ''}
                                </div>
                                
                                ${analysis.decks.length > 0 ? `<p><strong>Decks:</strong> ${analysis.decks.join(', ')}</p>` : ''}
                                ${analysis.difficulties.length > 0 ? `<p><strong>Difficulties:</strong> ${analysis.difficulties.join(', ')}</p>` : ''}
                            </div>
                            
                            ${analysis.preview.length > 0 ? `
                                <div class="content-preview">
                                    <h4>Preview</h4>
                                    <ul>
                                        ${analysis.preview.map(item => `<li>${item}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${analysis.error ? `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> ${analysis.error}</div>` : ''}
                        </div>
                        
                        ${!analysis.error ? `
                            <div class="import-options">
                                <h3>Import Options</h3>
                                <p>How would you like to handle this import?</p>
                                
                                <div class="option-buttons">
                                    <button class="btn btn-primary import-option-btn" onclick="app.dataManager.executeImport('${file.name}', 'merge')">
                                        <div class="btn-content">
                                            <div class="btn-main">
                                                <i class="fas fa-plus-circle"></i> Merge/Append
                                            </div>
                                            <div class="btn-subtitle">
                                                Add to existing data
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="btn btn-warning import-option-btn" onclick="app.dataManager.executeImport('${file.name}', 'replace')">
                                        <div class="btn-content">
                                            <div class="btn-main">
                                                <i class="fas fa-sync-alt"></i> Replace
                                            </div>
                                            <div class="btn-subtitle">
                                                Replace all existing data
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                
                                <div class="warning-message">
                                    <h4><i class="fas fa-exclamation-triangle"></i> Warning</h4>
                                    <p>
                                        <strong>Merge/Append:</strong> Adds imported content to your existing data.<br>
                                        <strong>Replace:</strong> Completely replaces your current data with the imported content.
                                    </p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('import-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners for option buttons
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove selected class from all buttons
                optionButtons.forEach(btn => btn.classList.remove('selected'));
                // Add selected class to clicked button
                button.classList.add('selected');
            });
        });
        
        // Add click outside to close modal
        const modal = document.getElementById('import-confirmation-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
        
        // Store file for later use
        this.pendingImportFile = file;
        this.pendingImportAnalysis = analysis;
    }

    async executeImport(fileName, mode) {
        // Close the modal
        const modal = document.getElementById('import-confirmation-modal');
        if (modal) {
            modal.classList.remove('show');
        }

        if (!this.pendingImportFile) {
            this.app.showToast('No file to import', 'error');
            return;
        }

        const file = this.pendingImportFile;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        try {
            // Clear existing data if replace mode
            if (mode === 'replace') {
                this.clearAllDataSilent();
            }

            switch (fileExtension) {
                case 'json':
                    await this.parseJSON(file, mode);
                    break;
                case 'xml':
                    await this.parseXML(file, mode);
                    break;
                case 'csv':
                    await this.parseCSV(file, mode);
                    break;
                case 'txt':
                    await this.parseTXT(file, mode);
                    break;
                case 'pdf':
                    await this.parsePDF(file, mode);
                    break;
                case 'docx':
                    await this.parseDOCX(file, mode);
                    break;
                default:
                    throw new Error('Unsupported file format');
            }
        } catch (error) {
            console.error('Error importing file:', error);
            this.app.showToast('Error importing file: ' + error.message, 'error');
        } finally {
            // Clean up
            this.pendingImportFile = null;
            this.pendingImportAnalysis = null;
        }
    }

    clearAllDataSilent() {
        // Clear data without showing confirmation modal
        this.app.flashcards = [];
        this.app.quizzes = [];
        this.app.settings = {
            theme: 'light',
            animations: true,
            autoFlip: 5,
            shuffleDefault: false,
            difficultyFeature: true
        };
        this.app.stats = {
            totalStudyTime: 0,
            flashcardsReviewed: 0,
            quizzesCompleted: 0,
            averageScore: 0,
            streakDays: 0,
            lastStudyDate: null
        };
        
        // Clear localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('quizwhiz_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    async parseJSON(file, mode = 'merge') {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Check if this is a new format export (v2.0) with all localStorage data
        if (data.exportVersion === '2.0') {
            return this.importAllLocalStorageData(data);
        }
        
        // Check if this is a localStorage-style export (with quizwhiz_ prefixed keys)
        if (data.quizwhiz_settings || data.quizwhiz_stats || data.quizwhiz_quizzes || data.quizwhiz_flashcards) {
            return this.importAllLocalStorageData(data);
        }
        
        // Handle legacy format or partial imports
        if (data.flashcards && Array.isArray(data.flashcards)) {
            if (mode === 'replace') {
                this.app.flashcards = [...data.flashcards];
            } else {
                this.app.flashcards.push(...data.flashcards);
            }
            
            let flashcardCount = data.flashcards.length;
            let quizCount = 0;
            
            // Also import other data if available
            if (data.quizzes && Array.isArray(data.quizzes)) {
                if (mode === 'replace') {
                    this.app.quizzes = [...data.quizzes];
                } else {
                    this.app.quizzes.push(...data.quizzes);
                }
                quizCount = data.quizzes.length;
            }
            if (data.settings) {
                if (mode === 'replace') {
                    this.app.settings = { ...data.settings };
                } else {
                    this.app.settings = { ...this.app.settings, ...data.settings };
                }
            }
            if (data.stats) {
                if (mode === 'replace') {
                    this.app.stats = { ...data.stats };
                } else {
                    this.app.stats = { ...this.app.stats, ...data.stats };
                }
            }
            
            this.saveData();
            this.app.updateUI();
            
            // Show specific import message
            const parts = [];
            if (flashcardCount > 0) parts.push(`${flashcardCount} flashcard${flashcardCount !== 1 ? 's' : ''}`);
            if (quizCount > 0) parts.push(`${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`);
            const action = mode === 'replace' ? 'Successfully imported' : 'Successfully appended';
            const message = parts.length > 0 ? `${action} ${parts.join(' and ')}` : `${action} data`;
            
            this.app.showToast(message, 'success');
        } else {
            throw new Error('Invalid JSON format');
        }
    }
    
    async importAllLocalStorageData(data) {
        let importedItems = 0;
        const importedKeys = [];
        let flashcardCount = 0;
        let quizCount = 0;
        
        // Import all localStorage data
        for (const [key, value] of Object.entries(data)) {
            // Skip metadata fields
            if (key === 'exportDate' || key === 'exportVersion') {
                continue;
            }
            
            // Only import keys that start with 'quizwhiz_'
            if (key.startsWith('quizwhiz_')) {
                try {
                    // Handle array data (flashcards and quizzes) with merge/append logic
                    if ((key === 'quizwhiz_flashcards' || key === 'quizwhiz_quizzes') && Array.isArray(value)) {
                        const existingData = localStorage.getItem(key);
                        let mergedData = [];
                        
                        if (existingData) {
                            try {
                                const existing = JSON.parse(existingData);
                                if (Array.isArray(existing)) {
                                    mergedData = [...existing];
                                }
                            } catch (error) {
                                console.warn(`Failed to parse existing ${key}:`, error);
                            }
                        }
                        
                        // Append new items to existing data
                        mergedData.push(...value);
                        localStorage.setItem(key, JSON.stringify(mergedData));
                        
                        // Count imported items
                        if (key === 'quizwhiz_flashcards') {
                            flashcardCount = value.length;
                        } else if (key === 'quizwhiz_quizzes') {
                            quizCount = value.length;
                        }
                    } else {
                        // Handle non-array data (settings, stats, etc.) - replace as before
                        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                        localStorage.setItem(key, stringValue);
                    }
                    
                    importedKeys.push(key);
                    importedItems++;
                } catch (error) {
                    console.warn(`Failed to import localStorage key: ${key}`, error);
                }
            }
        }
        
        // Reload data from localStorage to update app state
        this.loadData();
        
        // Reload user data if it was imported
        if (importedKeys.includes('quizwhiz_user') && this.app.userManager) {
            this.app.userManager.loadUser();
        }
        
        // Reload theme if it was imported
        if (importedKeys.includes('quizwhiz_theme') && this.app.uiManager) {
            const savedTheme = localStorage.getItem('quizwhiz_theme');
            if (savedTheme) {
                this.app.uiManager.applyTheme(savedTheme);
            }
        }
        
        this.app.updateUI();
        
        // Show specific import message
        let message = 'Successfully appended backup data';
        if (flashcardCount > 0 || quizCount > 0) {
            const parts = [];
            if (flashcardCount > 0) parts.push(`${flashcardCount} flashcard${flashcardCount !== 1 ? 's' : ''}`);
            if (quizCount > 0) parts.push(`${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`);
            message = `Successfully appended ${parts.join(' and ')}`;
        }
        
        this.app.showToast(message, 'success');
    }

    async parseXML(file, mode = 'merge') {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        const flashcards = xmlDoc.querySelectorAll('flashcard');
        const importedCards = [];
        
        flashcards.forEach(card => {
            const question = card.querySelector('question')?.textContent;
            const answer = card.querySelector('answer')?.textContent;
            const deck = card.querySelector('deck')?.textContent || 'General';
            const difficulty = card.querySelector('difficulty')?.textContent || 'medium';
            
            if (question && answer) {
                importedCards.push({
                    id: Date.now() + Math.random(),
                    question,
                    answer,
                    deck,
                    difficulty,
                    created: new Date().toISOString(),
                    lastReviewed: null,
                    reviewCount: 0
                });
            }
        });
        
        if (mode === 'replace') {
            this.app.flashcards = [...importedCards];
        } else {
            this.app.flashcards.push(...importedCards);
        }
        this.saveData();
        this.app.updateUI();
        const action = mode === 'replace' ? 'Successfully imported' : 'Successfully appended';
        const count = importedCards.length;
        this.app.showToast(`${action} ${count} flashcard${count !== 1 ? 's' : ''}`, 'success');
    }

    async parseCSV(file, mode = 'merge') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const importedCards = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= 2) {
                const question = values[0] || values[headers.indexOf('question')] || '';
                const answer = values[1] || values[headers.indexOf('answer')] || '';
                const deck = values[2] || values[headers.indexOf('deck')] || 'General';
                const difficulty = values[3] || values[headers.indexOf('difficulty')] || 'medium';
                
                if (question && answer) {
                    importedCards.push({
                        id: Date.now() + Math.random(),
                        question: question.replace(/^"|"$/g, ''),
                        answer: answer.replace(/^"|"$/g, ''),
                        deck: deck.replace(/^"|"$/g, ''),
                        difficulty,
                        created: new Date().toISOString(),
                        lastReviewed: null,
                        reviewCount: 0
                    });
                }
            }
        }
        
        if (mode === 'replace') {
            this.app.flashcards = [...importedCards];
        } else {
            this.app.flashcards.push(...importedCards);
        }
        this.saveData();
        this.app.updateUI();
        const action = mode === 'replace' ? 'Successfully imported' : 'Successfully appended';
        const count = importedCards.length;
        this.app.showToast(`${action} ${count} flashcard${count !== 1 ? 's' : ''}`, 'success');
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    async parseTXT(file, mode = 'merge') {
        const text = await file.text();
        const flashcards = this.extractFlashcardsFromText(text);
        
        if (mode === 'replace') {
            this.app.flashcards = [...flashcards];
        } else {
            this.app.flashcards.push(...flashcards);
        }
        this.saveData();
        this.app.updateUI();
        const action = mode === 'replace' ? 'Successfully imported' : 'Successfully appended';
        const count = flashcards.length;
        this.app.showToast(`${action} ${count} flashcard${count !== 1 ? 's' : ''}`, 'success');
    }

    async parsePDF(file, mode = 'merge') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let text = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                text += textContent.items.map(item => item.str).join(' ') + '\n';
            }
            
            const flashcards = this.extractFlashcardsFromText(text);
            
            if (mode === 'replace') {
                this.app.flashcards = [...flashcards];
            } else {
                this.app.flashcards.push(...flashcards);
            }
            this.saveData();
            this.app.updateUI();
            const action = mode === 'replace' ? 'Successfully imported' : 'Successfully appended';
            const count = flashcards.length;
            this.app.showToast(`${action} ${count} flashcard${count !== 1 ? 's' : ''}`, 'success');
        } catch (error) {
            throw new Error('Failed to parse PDF: ' + error.message);
        }
    }

    async parseDOCX(file, mode = 'merge') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const doc = await zip.file('word/document.xml').async('string');
            
            // Extract text from DOCX XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(doc, 'text/xml');
            const textNodes = xmlDoc.querySelectorAll('w\\:t, t');
            
            let text = '';
            textNodes.forEach(node => {
                text += node.textContent + ' ';
            });
            
            const flashcards = this.extractFlashcardsFromText(text);
            
            if (mode === 'replace') {
                this.app.flashcards = [...flashcards];
            } else {
                this.app.flashcards.push(...flashcards);
            }
            this.saveData();
            this.app.updateUI();
            const action = mode === 'replace' ? 'Successfully imported' : 'Successfully appended';
            const count = flashcards.length;
            this.app.showToast(`${action} ${count} flashcard${count !== 1 ? 's' : ''}`, 'success');
        } catch (error) {
            throw new Error('Failed to parse DOCX: ' + error.message);
        }
    }

    extractFlashcardsFromText(text) {
        const flashcards = [];
        
        // Try different patterns to extract Q&A pairs
        const patterns = [
            /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis,
            /Question:\s*(.+?)\s*Answer:\s*(.+?)(?=Question:|$)/gis,
            /\d+\.\s*(.+?)\s*-\s*(.+?)(?=\d+\.|$)/gis
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const question = match[1].trim();
                const answer = match[2].trim();
                
                if (question && answer && question.length > 3 && answer.length > 3) {
                    flashcards.push({
                        id: Date.now() + Math.random(),
                        question,
                        answer,
                        deck: 'Imported',
                        difficulty: 'medium',
                        created: new Date().toISOString(),
                        lastReviewed: null,
                        reviewCount: 0
                    });
                }
            }
            
            if (flashcards.length > 0) break;
        }
        
        // If no patterns match, try splitting by paragraphs
        if (flashcards.length === 0) {
            const paragraphs = text.split('\n').filter(p => p.trim().length > 10);
            
            for (let i = 0; i < paragraphs.length - 1; i += 2) {
                const question = paragraphs[i].trim();
                const answer = paragraphs[i + 1]?.trim();
                
                if (question && answer) {
                    flashcards.push({
                        id: Date.now() + Math.random(),
                        question,
                        answer,
                        deck: 'Imported',
                        difficulty: 'medium',
                        created: new Date().toISOString(),
                        lastReviewed: null,
                        reviewCount: 0
                    });
                }
            }
        }
        
        return flashcards;
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}