// Unified Data and User Management Module
// Combines DataManager and UserManager functionality with Supabase integration
class UnifiedDataManager {
    constructor(app) {
        this.app = app;
        this.supabaseAuthService = null;
        this.isSupabaseReady = false;
        this.isInitialized = false;
        
        // User profile data
        this.currentUser = {
            username: 'Guest User',
            avatar: null
        };
        this.avatars = [];
        
        // Initialize avatars and migrate legacy data
        this.generateAvatars();
        this.migrateLegacyData();
        
        // Initialize Supabase authentication service
        this.initSupabaseAuthService();
        
        // Listen for Supabase ready event
        document.addEventListener('supabase-ready', () => {
            this.initSupabaseAuthService();
        });
        
        // Listen for data service ready event
        document.addEventListener('supabase-data-ready', () => {
            this.updateSupabaseReadyState();
        });
        
        // Listen for auth state changes to load user profile
        document.addEventListener('auth:changed', (e) => {
            if (e.detail.user) {
                this.loadUserProfile(e.detail.user);
            } else {
                this.resetUserProfile();
            }
        });
    }
    
    initSupabaseAuthService() {
        if (typeof window.supabaseAuthService !== 'undefined') {
            this.supabaseAuthService = window.supabaseAuthService;
            window.debugLog?.info('unifiedDataManager', 'Supabase Auth Service initialized');
            
            // Set up auth state listener - but coordinate with AuthManager
            this.supabaseAuthService.onAuthStateChange((event, session) => {
                if (session?.user) {
                    // Only load profile data, don't update UI - let AuthManager handle that
                    this.loadUserProfile(session.user);
                } else {
                    // Only reset when user actually logs out (SIGNED_OUT event)
                    if (event === 'SIGNED_OUT') {
                        this.resetUserProfile();
                    }
                }
            });
        } else {
            window.debugLog?.warn('unifiedDataManager', 'SupabaseAuthService not yet available');
        }
        
        // Check if both auth and data services are ready
        this.updateSupabaseReadyState();
    }
    
    updateSupabaseReadyState() {
        this.isSupabaseReady = (typeof window.supabaseAuthService !== 'undefined') && 
                              (typeof window.supabaseDataService !== 'undefined') &&
                              (this.app && this.app.supabaseDataService);
        
        if (this.isSupabaseReady) {
            window.debugLog?.info('unifiedDataManager', 'All Supabase services ready for operations');
        }
    }
    
    // ===== USER PROFILE MANAGEMENT =====
    
    generateAvatars() {
        const icons = [
            'fa-user', 'fa-cat', 'fa-dog', 'fa-dragon', 'fa-robot', 'fa-rocket',
            'fa-star', 'fa-heart', 'fa-crown', 'fa-gem', 'fa-fire', 'fa-leaf',
            'fa-snowflake', 'fa-sun', 'fa-moon', 'fa-bolt', 'fa-magic', 'fa-wand-magic-sparkles'
        ];
        
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
        ];
        
        const backgrounds = [
            '#FFE5E5', '#E5F9F6', '#E5F3FF', '#E8F5E8', '#FFF8E1', '#F3E5F5',
            '#E8F6F3', '#FEF9E7', '#F4ECF7', '#EBF5FB', '#FEF5E7', '#EAFAF1'
        ];
        
        this.avatars = [];
        for (let i = 0; i < 18; i++) {
            this.avatars.push({
                id: i + 1,
                icon: icons[i % icons.length],
                color: colors[i % colors.length],
                background: backgrounds[i % backgrounds.length]
            });
        }
    }
    
    // Helper method to format username with proper capitalization
    _formatUsername(username) {
        if (!username) return username;
        return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
    }
    
    async loadUserProfile(supabaseUser) {
        try {
            if (!this.isSupabaseReady || !supabaseUser) {
                this.loadGuestProfile();
                return;
            }
            
            // Try to load user profile from Supabase
            const userProfile = await this.supabaseAuthService.getUserProfile(supabaseUser.id);
            
            if (userProfile) {
                this.currentUser = {
                    username: this._formatUsername(userProfile.username || supabaseUser.user_metadata?.username || supabaseUser.email || 'User'),
                    avatar: userProfile.avatar || this.avatars[0],
                    uid: supabaseUser.id
                };
            } else {
                // Create new profile for first-time user
                this.currentUser = {
                    username: this._formatUsername(supabaseUser.user_metadata?.username || supabaseUser.email || 'User'),
                    avatar: this.avatars[0],
                    uid: supabaseUser.id
                };
                await this.saveUserProfile();
            }
            
            // Don't call updateUserDisplay() here - let AuthManager handle username display
            // Only update avatar displays to avoid conflicts
            this.updateAvatarDisplay();
            window.debugLog?.info('unifiedDataManager', 'User profile loaded:', this.currentUser.username);
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error loading user profile:', error);
            this.loadGuestProfile();
        }
    }
    
    loadGuestProfile() {
        // Load from localStorage for guest users
        try {
            const savedUser = localStorage.getItem('quizwhiz_guest_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                // Ensure avatar exists
                if (!this.currentUser.avatar || !this.avatars.find(a => a.id === this.currentUser.avatar.id)) {
                    this.currentUser.avatar = this.avatars[0];
                }
            } else {
                this.currentUser = {
                    username: 'Guest User',
                    avatar: this.avatars[0]
                };
            }
        } catch (error) {
            this.currentUser = {
                username: 'Guest User',
                avatar: this.avatars[0]
            };
        }
        this.updateUserDisplay();
    }
    
    async saveUserProfile() {
        try {
            if (this.isSupabaseReady && this.supabaseAuthService?.isAuthenticated()) {
                await this.supabaseAuthService.saveUserProfile(this.currentUser);
                window.debugLog?.info('unifiedDataManager', 'User profile saved to Supabase');
            } else {
                // Save guest profile to localStorage
                localStorage.setItem('quizwhiz_guest_user', JSON.stringify(this.currentUser));
                window.debugLog?.info('unifiedDataManager', 'Guest profile saved to localStorage');
            }
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error saving user profile:', error);
        }
    }
    
    updateUsername(newUsername) {
        if (newUsername && newUsername.trim()) {
            this.currentUser.username = newUsername.trim();
            this.saveUserProfile();
            this.updateUserDisplay();
            return true;
        }
        return false;
    }
    
    updateAvatar(avatarId) {
        const avatar = this.avatars.find(a => a.id === avatarId);
        if (avatar) {
            this.currentUser.avatar = avatar;
            this.saveUserProfile();
            this.updateUserDisplay();
            return true;
        }
        return false;
    }
    
    updateUserDisplay() {
        // Update all user display elements
        const elements = {
            userAvatar: document.getElementById('user-avatar'),
            userAvatarDisplay: document.getElementById('user-avatar-display'),
            userName: document.getElementById('user-name'),
            userDisplayName: document.getElementById('userDisplayName')
        };
        
        // Update avatar displays - use img elements for actual avatar files
        this.updateAvatarDisplay();
        
        // DON'T update name displays here - let AuthManager handle username display
        // This prevents conflicts between UnifiedDataManager and AuthManager
        // AuthManager's formatDisplayName() should be the single source of truth for username display
    }
    
    updateAvatarDisplay() {
        const elements = {
            userAvatar: document.getElementById('user-avatar'),
            userAvatarDisplay: document.getElementById('user-avatar-display')
        };
        
        [elements.userAvatar, elements.userAvatarDisplay].forEach(el => {
            if (el && this.currentUser.avatar) {
                const avatarId = this.currentUser.avatar.id || 1;
                const avatarPath = `/assets/avatars/avatar-${avatarId}.svg`;
                
                // If element is an img tag, set src directly
                if (el.tagName === 'IMG') {
                    el.src = avatarPath;
                    el.alt = 'User Avatar';
                    el.onerror = () => {
                        el.src = 'assets/avatars/avatar-1.svg'; // Fallback
                    };
                } else {
                    // If element is a container, create img element
                    el.innerHTML = `<img src="${avatarPath}" alt="User Avatar" class="user-avatar" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/avatars/avatar-1.svg'">`;
                }
            }
        });
    }
    
    resetUserProfile() {
        this.currentUser = {
            username: 'Guest User',
            avatar: this.avatars[0]
        };
        localStorage.removeItem('quizwhiz_guest_user');
        this.updateUserDisplay();
    }
    
    getUser() {
        return this.currentUser;
    }
    
    // ===== DATA MANAGEMENT =====
    
    async initializeUserData() {
        if (!this.isSupabaseReady || !this.supabaseAuthService?.isAuthenticated()) {
            window.debugLog?.warn('unifiedDataManager', 'Cannot initialize user data: Supabase not ready or user not authenticated');
            return;
        }
        
        try {
            window.debugLog?.info('unifiedDataManager', 'Initializing user data for new user...');
            
            // Initialize empty data structures
            this.app.flashcards = [];
            this.app.quizzes = [];
            this.app.settings = {
                theme: 'auto',
                studyReminders: true,
                soundEffects: true,
                autoAdvance: false,
                studyGoal: 10
            };
            this.app.stats = {
                totalStudySessions: 0,
                totalCardsStudied: 0,
                averageScore: 0,
                streakDays: 0
            };
            this.app.streakData = this.getDefaultStreakData();
            
            // Save initial data to Supabase
            await this.saveData();
            
            this.isInitialized = true;
            window.debugLog?.info('unifiedDataManager', 'User data initialized successfully');
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error initializing user data:', error);
            throw error;
        }
    }
    
    async loadData() {
        try {
            // Priority 1: Load from Supabase if user is authenticated
            if (this.isSupabaseReady && this.supabaseAuthService?.isAuthenticated()) {
                window.debugLog?.info('unifiedDataManager', 'Loading data from Supabase...');
                try {
                    const userId = this.supabaseAuthService.getCurrentUser()?.id;
                    if (userId && window.supabaseDataService) {
                        // Load user data from Supabase
                        const userData = await window.supabaseDataService.loadUserData(userId);
                        const flashcards = await window.supabaseDataService.loadFlashcards(userId);
                        const quizzes = await window.supabaseDataService.loadQuizzes(userId);
                        
                        console.log('DEBUG: loadData - Loading for user ID:', userId);
                        console.log('DEBUG: loadData - flashcards from DB:', flashcards?.length || 0, flashcards);
                        console.log('DEBUG: loadData - quizzes from DB:', quizzes?.length || 0, quizzes);
                        
                        // Update app data
                        this.app.flashcards = flashcards || [];
                        this.app.quizzes = quizzes || [];
                        
                        console.log('DEBUG: loadData - app.flashcards after update:', this.app.flashcards?.length || 0);
                        console.log('DEBUG: loadData - app.quizzes after update:', this.app.quizzes?.length || 0);
                        if (userData) {
                            this.app.settings = { ...this.app.settings, ...(userData.settings || {}) };
                            this.app.stats = { ...this.app.stats, ...(userData.stats || {}) };
                            this.app.streakData = userData.streak_data || this.getDefaultStreakData();
                        }
                        
                        this.migrateFlashcardDifficulties();
                        this.isInitialized = true;
                        
                        // Cache essential data locally for offline access
                        this.cacheDataLocally();
                        return;
                    }
                } catch (supabaseError) {
                    window.debugLog?.warn('unifiedDataManager', 'Supabase load failed, trying cache:', supabaseError);
                    // Fall through to cache loading
                }
            }
            
            // Priority 2: Load from cache if available (offline or Supabase unavailable)
            if (this.loadFromCache()) {
                window.debugLog?.info('unifiedDataManager', 'Data loaded from cache');
                return;
            }
            
            // Priority 3: Initialize with default data for new users
            window.debugLog?.info('unifiedDataManager', 'No data found, initializing defaults...');
            this.initializeDefaultData();
            
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error loading data:', error);
            this.app.showToast('Error loading saved data', 'error');
            
            // Last resort: initialize with defaults
            this.initializeDefaultData();
        }
    }
    
    loadFromCache() {
        try {
            const cacheKey = this.app.authManager?.isUserAuthenticated() 
                ? `quizwhiz_cache_${this.app.authManager.getUserId()}`
                : 'quizwhiz_cache_guest';
            
            const cachedData = localStorage.getItem(cacheKey);
            if (!cachedData) return false;
            
            const data = JSON.parse(cachedData);
            
            // Check cache validity (24 hours)
            const cacheAge = Date.now() - (data.timestamp || 0);
            if (cacheAge > 24 * 60 * 60 * 1000) {
                window.debugLog?.info('unifiedDataManager', 'Cache expired, removing...');
                localStorage.removeItem(cacheKey);
                return false;
            }
            
            // Load cached data
            this.app.flashcards = data.flashcards || [];
            this.app.quizzes = data.quizzes || [];
            this.app.settings = { ...this.app.settings, ...(data.settings || {}) };
            this.app.stats = { ...this.app.stats, ...(data.stats || {}) };
            this.app.streakData = data.streakData || this.getDefaultStreakData();
            
            this.migrateFlashcardDifficulties();
            return true;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error loading from cache:', error);
            return false;
        }
    }
    
    cacheDataLocally() {
        try {
            const cacheKey = this.app.authManager?.isUserAuthenticated() 
                ? `quizwhiz_cache_${this.app.authManager.getUserId()}`
                : 'quizwhiz_cache_guest';
            
            const dataToCache = {
                flashcards: this.app.flashcards,
                quizzes: this.app.quizzes,
                settings: this.app.settings,
                stats: this.app.stats,
                streakData: this.app.streakData,
                timestamp: Date.now()
            };
            
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
            window.debugLog?.info('unifiedDataManager', 'Data cached locally for offline access');
        } catch (error) {
            window.debugLog?.warn('unifiedDataManager', 'Failed to cache data locally:', error);
        }
    }
    
    initializeDefaultData() {
        this.app.flashcards = [];
        this.app.quizzes = [];
        this.app.settings = {
            theme: 'auto',
            studyReminders: true,
            soundEffects: true,
            autoAdvance: false,
            studyGoal: 10
        };
        this.app.stats = {
            totalStudySessions: 0,
            totalCardsStudied: 0,
            averageScore: 0,
            streakDays: 0
        };
        this.app.streakData = this.getDefaultStreakData();
        this.isInitialized = true;
    }
    
    getDefaultStreakData() {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
            studyDates: []
        };
    }
    
    async saveData() {
        try {
            // Save to Supabase if authenticated
            if (this.isSupabaseReady && this.supabaseAuthService?.isAuthenticated()) {
                try {
                    const userId = this.supabaseAuthService.getCurrentUser()?.id;
                    if (userId && window.supabaseDataService) {
                        // Save user data to Supabase
                        const userData = {
                            user_id: userId,
                            settings: this.app.settings,
                            stats: this.app.stats,
                            streak_data: this.app.streakData,
                            updated_at: new Date().toISOString()
                        };
                        
                        await window.supabaseDataService.saveUserData(userData);
                        
                        // Note: Flashcards and quizzes are saved individually through their respective methods
                        // This method only saves user settings, stats, and streak data
                        
                        window.debugLog?.info('unifiedDataManager', 'Data saved to Supabase successfully');
                        
                        // Also cache locally for offline access
                        this.cacheDataLocally();
                    }
                } catch (supabaseError) {
                    window.debugLog?.error('unifiedDataManager', 'Supabase save failed:', supabaseError);
                    this.app.showToast('Failed to sync data to cloud', 'warning');
                    
                    // Still cache locally as fallback
                    this.cacheDataLocally();
                }
            } else {
                // For guest users, only save to cache
                this.cacheDataLocally();
                window.debugLog?.info('unifiedDataManager', 'Data saved to local cache (guest mode)');
            }
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error saving data:', error);
            this.app.showToast('Error saving data', 'error');
        }
    }
    
    // ===== IMPORT/EXPORT WITH SUPABASE =====
    
    async exportData(format = 'json') {
        try {
            let flashcards = this.app.flashcards;
            let quizzes = this.app.quizzes;
            
            // Fetch latest data from Supabase if authenticated
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                try {
                    const supabaseFlashcards = await this.app.supabaseDataService.getAllFlashcards();
                    const supabaseQuizzes = await this.app.supabaseDataService.getAllQuizzes();
                    
                    if (supabaseFlashcards && supabaseFlashcards.length > 0) {
                        flashcards = supabaseFlashcards;
                    }
                    if (supabaseQuizzes && supabaseQuizzes.length > 0) {
                        quizzes = supabaseQuizzes;
                    }
                    
                    window.debugLog?.info('unifiedDataManager', 'Exported data from Supabase');
                } catch (error) {
                    window.debugLog?.warn('unifiedDataManager', 'Failed to fetch data from Supabase for export, using local data:', error);
                }
            }
            
            const data = {
                flashcards: flashcards,
                quizzes: quizzes,
                settings: this.app.settings,
                stats: this.app.stats,
                streakData: this.app.streakData,
                userProfile: this.currentUser,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            let content, filename, mimeType;
            
            if (format === 'json') {
                content = JSON.stringify(data, null, 2);
                filename = `quizwhiz-backup-${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
            } else if (format === 'xml') {
                content = this.convertToXML(data);
                filename = `quizwhiz-backup-${new Date().toISOString().split('T')[0]}.xml`;
                mimeType = 'application/xml';
            } else if (format === 'csv') {
                content = this.convertToCSV(flashcards);
                filename = `quizwhiz-flashcards-${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
            }
            
            // If user is authenticated, also save backup to Supabase
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                try {
                    await this.app.supabaseDataService.saveBackup({
                        filename: filename,
                        content: content,
                        format: format,
                        size: content.length,
                        created_at: new Date().toISOString()
                    });
                    this.app.showToast('Backup saved to cloud and downloaded', 'success');
                } catch (error) {
                    window.debugLog?.warn('unifiedDataManager', 'Cloud backup failed:', error);
                    this.app.showToast('Downloaded locally (cloud backup failed)', 'warning');
                }
            } else {
                this.app.showToast('Data exported successfully', 'success');
            }
            
            this.downloadFile(content, filename, mimeType);
            
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Export failed:', error);
            this.app.showToast('Export failed', 'error');
        }
    }
    
    // ===== DATA IMPORT/EXPORT METHODS =====
    
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
    
    clearAllData(showConfirmation = true) {
        if (showConfirmation) {
            // Open the custom confirmation modal instead of native confirm
            this.app.uiManager.openModal('clear-data-modal');
        } else {
            // Clear data silently without confirmation
            this.clearAllDataSilent();
        }
    }
    
    async clearAllDataSilent() {
        try {
            // Clear Supabase data if user is authenticated
            if (this.isSupabaseReady && this.supabaseAuthService?.isAuthenticated()) {
                window.debugLog?.info('unifiedDataManager', 'Clearing Supabase data...');
                const userId = this.supabaseAuthService.getCurrentUser()?.id;
                if (userId && window.supabaseDataService) {
                    await window.supabaseDataService.deleteAllUserData(userId);
                }
            }
            
            // Clear all cache data
            this.clearAllCacheData();
            
            // Reset app data to defaults
            this.initializeDefaultData();
            
            // Update UI
            if (window.app && typeof window.app.updateUI === 'function') {
                window.app.updateUI();
            }
            
            // Refresh page-specific displays after import
            const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
            if (currentPage === 'flashcards' && this.app.flashcardManager && typeof this.app.flashcardManager.initializeFlashcards === 'function') {
                this.app.flashcardManager.initializeFlashcards();
            } else if (currentPage === 'quiz' && this.app.quizManager && typeof this.app.quizManager.initializeQuiz === 'function') {
                this.app.quizManager.initializeQuiz();
            }
            this.app.showToast('All data cleared successfully', 'success');
            
            return true;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error clearing data:', error);
            this.app.showToast('Error clearing data. Please try again.', 'error');
            return false;
        }
    }

    clearAllCacheData() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('quizwhiz_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    confirmClearAllData() {
        // Close the modal first
        this.app.uiManager.closeModal('clear-data-modal');
        
        // Count flashcards and quizzes before clearing
        const flashcardCount = this.app.flashcards.length;
        const quizCount = this.app.quizzes.length;
        
        // Clear all localStorage items that start with 'quizwhiz_'
        this.clearAllCacheData();
        
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
        
        // Reset user data
        this.currentUser = {
            username: 'Guest User',
            avatar: this.avatars[0]
        };
        
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
        window.debugLog?.warn('unifiedDataManager', 'importData() method called but is deprecated. Use settings-file-input directly.');
    }

    async processFile(file) {
        console.log('DEBUG: processFile called with file:', file.name);
        
        // Guard: If settings page owns the handlers, don't create duplicate modals
        if (document.body.dataset.settingsHandlers === 'true') {
            console.log('DEBUG: Settings page owns handlers, skipping processFile modal creation');
            return;
        }
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        try {
            console.log('DEBUG: Starting file processing for:', file.name);
            window.debugLog?.info('unifiedDataManager', `Starting to process file: ${file.name} (${file.size} bytes, type: ${fileExtension})`);
            
            // First analyze the file content
            console.log('DEBUG: About to call analyzeFileContent');
            const analysis = await this.analyzeFileContent(file);
            console.log('DEBUG: analyzeFileContent completed, analysis:', analysis);
            
            // Check if Supabase is ready and user is authenticated before showing import modal
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                analysis.willSaveToCloud = true;
            } else {
                analysis.willSaveToCloud = false;
            }
            
            // Show import confirmation modal with analysis
            this.showImportConfirmationModal(file, analysis);
            window.debugLog?.info('unifiedDataManager', `Successfully processed file: ${file.name}`);
        } catch (error) {
            // Comprehensive error logging
            console.error('=== COMPREHENSIVE ERROR ANALYSIS ===');
            console.error('ERROR: processFile failed for:', file.name);
            console.error('ERROR: Full error object:', error);
            console.error('ERROR: Error message:', error.message);
            console.error('ERROR: Error stack:', error.stack);
            console.error('ERROR: Error name:', error.name);
            console.error('ERROR: File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString(),
                extension: file.name.split('.').pop().toLowerCase()
            });
            console.error('ERROR: Current timestamp:', new Date().toISOString());
            console.error('ERROR: Browser info:', {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            });
            console.error('=== END ERROR ANALYSIS ===');
            
            window.debugLog?.error('unifiedDataManager', `Error processing file ${file.name}:`, error);
            
            // Provide more specific error message based on error type
            let errorMessage = `Failed to analyze ${file.name}`;
            if (error.message.includes('Invalid JSON format')) {
                errorMessage += ': The file contains invalid JSON data';
            } else if (error.message.includes('Failed to read file')) {
                errorMessage += ': Unable to read the file content';
            } else if (error.message.includes('Failed to detect backup schema')) {
                errorMessage += ': Unrecognized file format or structure';
            } else {
                errorMessage += `: ${error.message}`;
            }
            
            console.error('FINAL ERROR MESSAGE TO USER:', errorMessage);
            this.app.showToast(errorMessage, 'error');
        }
    }

    // ===== UTILITY METHODS =====
    
    migrateLegacyData() {
        // Migrate old localStorage data to new structure
        try {
            const oldData = localStorage.getItem('quizwhiz_data');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                if (parsed.flashcards) {
                    localStorage.setItem('quizwhiz_cache_guest', JSON.stringify({
                        flashcards: parsed.flashcards,
                        quizzes: parsed.quizzes || [],
                        settings: parsed.settings || {},
                        stats: parsed.stats || {},
                        streakData: parsed.streakData || this.getDefaultStreakData(),
                        timestamp: Date.now()
                    }));
                    localStorage.removeItem('quizwhiz_data');
                    window.debugLog?.info('unifiedDataManager', 'Legacy data migrated');
                }
            }
        } catch (error) {
            window.debugLog?.warn('unifiedDataManager', 'Legacy data migration failed:', error);
        }
    }
    
    migrateFlashcardDifficulties() {
        this.app.flashcards.forEach(card => {
            if (!card.difficulty) {
                card.difficulty = 'medium';
            }
        });
    }
    
    convertToXML(data) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<quizwhiz-backup>\n';
        xml += `  <exportDate>${data.exportDate}</exportDate>\n`;
        xml += `  <version>${data.version}</version>\n`;
        
        // Flashcards
        xml += '  <flashcards>\n';
        if (data.flashcards && data.flashcards.length > 0) {
            data.flashcards.forEach(card => {
                xml += '    <flashcard>\n';
                xml += `      <id>${this.escapeXML(card.id || '')}</id>\n`;
                xml += `      <question>${this.escapeXML(card.question || '')}</question>\n`;
                xml += `      <answer>${this.escapeXML(card.answer || '')}</answer>\n`;
                xml += `      <deck>${this.escapeXML(card.deck || 'Default')}</deck>\n`;
                xml += `      <difficulty>${this.escapeXML(card.difficulty || 'medium')}</difficulty>\n`;
                xml += `      <created>${card.created || ''}</created>\n`;
                xml += `      <lastReviewed>${card.lastReviewed || ''}</lastReviewed>\n`;
                xml += '    </flashcard>\n';
            });
        }
        xml += '  </flashcards>\n';
        
        // Quizzes
        xml += '  <quizzes>\n';
        if (data.quizzes && data.quizzes.length > 0) {
            data.quizzes.forEach(quiz => {
                xml += '    <quiz>\n';
                xml += `      <id>${this.escapeXML(quiz.id || '')}</id>\n`;
                xml += `      <name>${this.escapeXML(quiz.name || '')}</name>\n`;
                xml += `      <deck>${this.escapeXML(quiz.deck || '')}</deck>\n`;
                xml += `      <created>${quiz.created || ''}</created>\n`;
                xml += `      <score>${quiz.score || 0}</score>\n`;
                xml += `      <totalQuestions>${quiz.totalQuestions || 0}</totalQuestions>\n`;
                xml += '    </quiz>\n';
            });
        }
        xml += '  </quizzes>\n';
        
        // Settings
        xml += '  <settings>\n';
        if (data.settings) {
            Object.keys(data.settings).forEach(key => {
                xml += `    <${key}>${this.escapeXML(String(data.settings[key]))}</${key}>\n`;
            });
        }
        xml += '  </settings>\n';
        
        // Stats
        xml += '  <stats>\n';
        if (data.stats) {
            Object.keys(data.stats).forEach(key => {
                xml += `    <${key}>${this.escapeXML(String(data.stats[key]))}</${key}>\n`;
            });
        }
        xml += '  </stats>\n';
        
        // User Profile
        xml += '  <userProfile>\n';
        if (data.userProfile) {
            Object.keys(data.userProfile).forEach(key => {
                if (key !== 'avatars') {
                    xml += `    <${key}>${this.escapeXML(String(data.userProfile[key]))}</${key}>\n`;
                }
            });
        }
        xml += '  </userProfile>\n';
        
        xml += '</quizwhiz-backup>\n';
        return xml;
    }
    
    escapeXML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    convertToCSV(flashcards) {
        if (!flashcards || flashcards.length === 0) {
            return 'Front,Back,Category,Difficulty\n';
        }
        
        const headers = 'Front,Back,Category,Difficulty\n';
        const rows = flashcards.map(card => {
            const front = (card.front || '').replace(/"/g, '""');
            const back = (card.back || '').replace(/"/g, '""');
            const category = (card.category || 'General').replace(/"/g, '""');
            const difficulty = card.difficulty || 'medium';
            return `"${front}","${back}","${category}","${difficulty}"`;
        }).join('\n');
        
        return headers + rows;
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            preview: [],
            validation: {
                errors: [],
                warnings: [],
                successes: []
            }
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
            // Comprehensive error logging for analyzeFileContent
            console.error('=== ANALYZE FILE CONTENT ERROR ===');
            console.error('ERROR: analyzeFileContent failed for:', file.name);
            console.error('ERROR: Full error object:', error);
            console.error('ERROR: Error message:', error.message);
            console.error('ERROR: Error stack:', error.stack);
            console.error('ERROR: Error name:', error.name);
            console.error('ERROR: File extension:', fileExtension);
            console.error('ERROR: Analysis object state:', analysis);
            console.error('=== END ANALYZE FILE CONTENT ERROR ===');
            
            // Provide more specific error messages
            let specificError = 'Unknown error';
            if (error.message) {
                if (error.message.includes('JSON')) {
                    specificError = 'Invalid JSON format - file may be corrupted or not a valid JSON file';
                } else if (error.message.includes('XML')) {
                    specificError = 'Invalid XML format - file may be corrupted or not a valid XML file';
                } else if (error.message.includes('read')) {
                    specificError = 'Unable to read file content - file may be corrupted or too large';
                } else if (error.message.includes('schema')) {
                    specificError = 'Unrecognized file format - this may not be a QuizWhiz backup file';
                } else if (error.message.includes('Unsupported')) {
                    specificError = `Unsupported file format: ${fileExtension.toUpperCase()}`;
                } else {
                    specificError = error.message;
                }
            }
            
            analysis.error = specificError;
            analysis.validation.errors.push(specificError);
        }

        // Set isValid based on whether we found any importable content
        analysis.isValid = (analysis.flashcards > 0 || analysis.quizzes > 0 || analysis.settings || analysis.stats || analysis.userProfile);
        
        console.log('🔍 UNIFIED MANAGER DEBUG: Analysis completed:', {
            fileName: analysis.fileName,
            isValid: analysis.isValid,
            flashcards: analysis.flashcards,
            quizzes: analysis.quizzes,
            settings: analysis.settings,
            stats: analysis.stats,
            userProfile: analysis.userProfile
        });
        
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
        let text, data;
        
        try {
            text = await file.text();
            window.debugLog?.info('unifiedDataManager', `Reading file: ${file.name}, size: ${file.size} bytes`);
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', `Failed to read file text for ${file.name}:`, error);
            throw new Error(`Failed to read file: ${error.message}`);
        }
        
        try {
            data = JSON.parse(text);
            window.debugLog?.info('unifiedDataManager', `Successfully parsed JSON for ${file.name}`);
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', `JSON parsing failed for ${file.name}:`, error);
            window.debugLog?.error('unifiedDataManager', `First 500 chars of file content:`, text.substring(0, 500));
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
        
        // Detect backup schema type
        let backupType;
        try {
            backupType = this.detectBackupSchema(data);
            window.debugLog?.info('unifiedDataManager', `Detected backup type: ${backupType} for ${file.name}`);
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', `Schema detection failed for ${file.name}:`, error);
            throw new Error(`Failed to detect backup schema: ${error.message}`);
        }
        
        if (backupType === 'complete_backup') {
            analysis.isCompleteBackup = true;
            analysis.preview.push('Complete QuizWhiz backup detected');
            
            let totalItems = 0;
            
            // Store flashcards data for preview
            if (data.quizwhiz_flashcards && Array.isArray(data.quizwhiz_flashcards)) {
                analysis.flashcards = data.quizwhiz_flashcards; // Store actual flashcard data, not just count
                totalItems += data.quizwhiz_flashcards.length;
                analysis.preview.push(`${data.quizwhiz_flashcards.length} flashcards`);
            }
            
            // Store quizzes data for preview - transform to deck format
            if (data.quizwhiz_quizzes && Array.isArray(data.quizwhiz_quizzes)) {
                // Transform quiz data from individual records to deck-grouped format for preview
                const quizzesByDeck = {};
                data.quizwhiz_quizzes.forEach(quiz => {
                    const deckName = quiz.deck || 'Untitled Quiz';
                    if (!quizzesByDeck[deckName]) {
                        quizzesByDeck[deckName] = {
                            title: deckName,
                            category: quiz.category || 'General',
                            questions: []
                        };
                    }
                    // Transform quiz question format to match Supabase expectations
                    const questionObj = {
                        question: quiz.question,
                        correct: quiz.correctAnswer || quiz.correct || quiz.answer
                    };
                    
                    // Handle options - combine correct answer with wrong answers
                    const options = [];
                    if (quiz.wrongAnswers && Array.isArray(quiz.wrongAnswers)) {
                        options.push(...quiz.wrongAnswers);
                    }
                    if (questionObj.correct) {
                        options.push(questionObj.correct);
                    }
                    // Shuffle options to randomize correct answer position
                    questionObj.options = options.sort(() => Math.random() - 0.5);
                    
                    quizzesByDeck[deckName].questions.push(questionObj);
                });
                analysis.quizzes = Object.values(quizzesByDeck); // Store transformed deck data for preview
                totalItems += data.quizwhiz_quizzes.length;
                analysis.preview.push(`${data.quizwhiz_quizzes.length} quiz records in ${analysis.quizzes.length} decks`);
            }
            
            // Count scores
            if (data.quizwhiz_scores && Array.isArray(data.quizwhiz_scores)) {
                analysis.scores = data.quizwhiz_scores.length;
                totalItems += data.quizwhiz_scores.length;
                analysis.preview.push(`${data.quizwhiz_scores.length} score records`);
            }
            
            // Check for other data
            if (data.settings || data.quizwhiz_settings) {
                analysis.settings = true;
                totalItems += 1;
                analysis.preview.push('Settings configuration');
            }
            
            if (data.stats || data.quizwhiz_stats) {
                analysis.stats = true;
                totalItems += 1;
                analysis.preview.push('Statistics data');
            }
            
            if (data.account || data.quizwhiz_user) {
                analysis.userProfile = true;
                totalItems += 1;
                analysis.preview.push('User account data');
            }
            
            // Check for additional backup data
            if (data.quizwhiz_streak_data) {
                totalItems += 1;
                analysis.preview.push('Streak data');
            }
            
            if (data.quizwhiz_quiz_stats && Array.isArray(data.quizwhiz_quiz_stats)) {
                totalItems += data.quizwhiz_quiz_stats.length;
                analysis.preview.push(`${data.quizwhiz_quiz_stats.length} quiz statistics`);
            }
            
            // Set total count for import modal
            analysis.totalItems = totalItems;
            
        } else if (data.exportVersion === '2.0') {
            analysis.isCompleteBackup = true;
            analysis.preview.push('QuizWhiz export v2.0 detected');
            
            if (data.flashcards || data.quizwhiz_flashcards) {
                const flashcards = data.flashcards || data.quizwhiz_flashcards;
                analysis.flashcards = Array.isArray(flashcards) ? flashcards : [];
            }
            
            if (data.quizzes || data.quizwhiz_quizzes) {
                const quizzes = data.quizzes || data.quizwhiz_quizzes;
                analysis.quizzes = Array.isArray(quizzes) ? quizzes : [];
            }
            
            analysis.settings = !!(data.settings || data.quizwhiz_settings);
            analysis.stats = !!(data.stats || data.quizwhiz_stats);
            analysis.userProfile = !!(data.userProfile || data.quizwhiz_user);
            
        } else if (Array.isArray(data)) {
            // Array of flashcards
            analysis.flashcards = data.length;
            analysis.preview.push(`${data.length} flashcards found`);
        }
    }

    async analyzeXML(file, analysis) {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        const flashcards = xmlDoc.querySelectorAll('flashcard');
        const quizzes = xmlDoc.querySelectorAll('quiz');
        
        analysis.flashcards = flashcards.length;
        analysis.quizzes = quizzes.length;
        
        if (flashcards.length > 0) {
            analysis.preview.push(`${flashcards.length} flashcards found`);
        }
        if (quizzes.length > 0) {
            analysis.preview.push(`${quizzes.length} quizzes found`);
        }
    }

    async analyzeCSV(file, analysis) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
            analysis.flashcards = lines.length - 1; // Subtract header
            analysis.preview.push(`${lines.length - 1} flashcards found`);
        }
    }

    async analyzeTXT(file, analysis) {
        const text = await file.text();
        const flashcards = this.extractFlashcardsFromText(text);
        
        analysis.flashcards = flashcards.length;
        if (flashcards.length > 0) {
            analysis.preview.push(`${flashcards.length} flashcards extracted`);
        }
    }
    
    showImportConfirmationModal(file, analysis) {
        console.log('DEBUG: showImportConfirmationModal called with file:', file.name, 'analysis:', analysis);
        const modalHTML = `
            <div id="import-confirmation-modal" class="import-confirmation-modal show">
                <div class="import-modal-content">
                    <div class="import-modal-header">
                        <h3><i class="fas fa-file-import"></i> Import Confirmation</h3>
                        <button class="import-modal-close" aria-label="Close"
                            onclick="document.getElementById('import-confirmation-modal').classList.remove('show')">&times;</button>
                    </div>

                    <div class="import-modal-body">
                        <div class="import-analysis">
                            <h4>File Analysis</h4>
                            <div class="file-info">
                                <p><strong>File:</strong> ${analysis.fileName}</p>
                                <p><strong>Size:</strong> ${analysis.fileSize}</p>
                                <p><strong>Type:</strong> ${analysis.fileType}</p>
                            </div>

                            <div class="content-summary">
                                ${analysis.flashcards ? `
                                    <div class="summary-item">
                                        <div class="summary-count">${analysis.flashcards}</div>
                                        <div class="summary-label"><i class="fas fa-clone"></i> Flashcards</div>
                                    </div>` : ''}

                                ${analysis.quizzes ? `
                                    <div class="summary-item">
                                        <div class="summary-count">${analysis.quizzes}</div>
                                        <div class="summary-label"><i class="fas fa-question-circle"></i> Quizzes</div>
                                    </div>` : ''}

                                ${analysis.settings ? `
                                    <div class="summary-item">
                                        <div class="summary-count">1</div>
                                        <div class="summary-label"><i class="fas fa-cog"></i> Settings</div>
                                    </div>` : ''}

                                ${analysis.stats ? `
                                    <div class="summary-item">
                                        <div class="summary-count">1</div>
                                        <div class="summary-label"><i class="fas fa-chart-bar"></i> Statistics</div>
                                    </div>` : ''}

                                ${analysis.userProfile ? `
                                    <div class="summary-item">
                                        <div class="summary-count">1</div>
                                        <div class="summary-label"><i class="fas fa-user"></i> Profile</div>
                                    </div>` : ''}
                            </div>

                            ${analysis.decks?.length ? `<p><strong>Decks:</strong> ${analysis.decks.join(', ')}</p>` : ''}
                            ${analysis.difficulties?.length ? `<p><strong>Difficulties:</strong> ${analysis.difficulties.join(', ')}</p>` : ''}

                            ${analysis.preview?.length ? `
                                <div class="content-preview">
                                    <h5>Preview</h5>
                                    <ul>${analysis.preview.map(item => `<li>${item}</li>`).join('')}</ul>
                                </div>` : ''}

                            ${analysis.error ? `
                                <div class="error-box"><i class="fas fa-exclamation-triangle"></i> ${analysis.error}</div>` : ''}
                        </div>

                        ${!analysis.error ? `
                        <div class="import-options">
                            <h4>Import Options</h4>
                            <div class="option-buttons">
                                <button class="option-btn" id="opt-merge">
                                    <h5><i class="fas fa-plus-circle"></i> Merge/Append</h5>
                                    <p>Add to existing data</p>
                                </button>
                                <button class="option-btn" id="opt-replace">
                                    <h5><i class="fas fa-sync-alt"></i> Replace</h5>
                                    <p>Replace all existing data</p>
                                </button>
                            </div>
                            <div class="import-warning">
                                <h5><i class="fas fa-exclamation-triangle"></i> Warning</h5>
                                <p><strong>Merge/Append:</strong> adds imported content to your current data.<br>
                                   <strong>Replace:</strong> completely overwrites your current data.</p>
                            </div>
                        </div>` : ''}
                        
                        ${analysis.willSaveToCloud
                            ? `<div class="cloud-notice"><p>✅ Data will be saved to your cloud account (Supabase)</p></div>`
                            : `<div class="local-notice"><p>💾 You're offline or not signed in—data will be stored locally</p></div>`}
                    </div>

                    <div class="import-modal-footer">
                        <button class="btn btn-ghost" onclick="document.getElementById('import-confirmation-modal').classList.remove('show')">Cancel</button>
                        <button class="btn btn-primary" id="import-confirm">Import</button>
                    </div>
                </div>
            </div>
        `;

        // Remove any existing modal, then insert
        document.getElementById('import-confirmation-modal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Attach option-selection behavior (visual "selected" state)
        const mergeBtn = document.getElementById('opt-merge');
        const replaceBtn = document.getElementById('opt-replace');
        let mode = 'merge';
        const select = (btn, val) => {
            mergeBtn?.classList.toggle('selected', val === 'merge');
            replaceBtn?.classList.toggle('selected', val === 'replace');
            mode = val;
        };
        mergeBtn?.addEventListener('click', () => select(mergeBtn, 'merge'));
        replaceBtn?.addEventListener('click', () => select(replaceBtn, 'replace'));
        select(mergeBtn, 'merge'); // default

        // Import action uses *new* pipeline (Supabase-aware)
        document.getElementById('import-confirm')?.addEventListener('click', () => {
            try {
                this.executeImport(file.name, mode);
            } finally {
                document.getElementById('import-confirmation-modal')?.classList.remove('show');
            }
        });

        this.currentImportFile = file;
        console.log('DEBUG: Import confirmation modal added to DOM');
    }

    async executeImport(fileName, mode) {
        console.log('DEBUG: executeImport called with fileName:', fileName, 'mode:', mode);
        if (!this.currentImportFile) {
            console.log('DEBUG: No current import file found');
            this.app.showToast('No file selected for import', 'error');
            return;
        }

        console.log('DEBUG: Starting import process for file:', this.currentImportFile.name);
        try {
            const fileExtension = this.currentImportFile.name.split('.').pop().toLowerCase();
            let importedData;

            switch (fileExtension) {
                case 'json':
                    importedData = await this.parseJSON(this.currentImportFile, mode);
                    break;
                case 'xml':
                    importedData = await this.parseXML(this.currentImportFile, mode);
                    break;
                case 'csv':
                    importedData = await this.parseCSV(this.currentImportFile, mode);
                    break;
                case 'txt':
                    importedData = await this.parseTXT(this.currentImportFile, mode);
                    break;
                case 'pdf':
                    importedData = await this.parsePDF(this.currentImportFile, mode);
                    break;
                case 'docx':
                    importedData = await this.parseDOCX(this.currentImportFile, mode);
                    break;
                default:
                    throw new Error('Unsupported file format');
            }

            // Hand the freshly parsed import to Supabase (or local) — not app state.
            let importResults = { flashcards: 0, quizzes: 0 };
            const parsed = importedData || { flashcards: [], quizzes: [] };

            console.log('DEBUG: Import execution details:', {
                isSupabaseReady: this.isSupabaseReady,
                hasSupabaseAuthService: !!this.supabaseAuthService,
                isAuthenticated: this.supabaseAuthService?.isAuthenticated(),
                parsedFlashcards: parsed.flashcards?.length || 0,
                parsedQuizzes: parsed.quizzes?.length || 0
            });

            if (this.isSupabaseReady && this.supabaseAuthService?.isAuthenticated()) {
                // Ensure a live auth session so RLS sees auth.uid()
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                const userId = session?.user?.id || this.supabaseAuthService.getCurrentUser()?.id;
                
                console.log('DEBUG: Authentication check:', {
                    hasSession: !!session,
                    sessionUserId: session?.user?.id,
                    currentUserId: this.supabaseAuthService.getCurrentUser()?.id,
                    finalUserId: userId
                });
                
                if (!userId) {
                    console.error('DEBUG: No user ID found - not authenticated');
                    throw new Error('Not authenticated');
                }

                console.log('DEBUG: Calling bulkImport with:', { userId, mode, dataToImport: parsed });
                importResults = await this.app.supabaseDataService.bulkImport(userId, parsed, mode);
                console.log('DEBUG: bulkImport results:', importResults);
                if (importResults.errors?.length) {
                    // Bubble up DB errors with user-friendly message
                    const errorMsg = importResults.errors.join('\n');
                    console.error('DB import errors:', errorMsg);
                    throw new Error(`Database import failed: ${errorMsg}`);
                }

                // keep local mirrors in sync with what's now in the DB
                if (mode === 'replace') {
                    this.app.flashcards = parsed.flashcards || [];
                    this.app.quizzes    = parsed.quizzes || [];
                } else {
                    this.app.flashcards = [...this.app.flashcards, ...(parsed.flashcards || [])];
                    this.app.quizzes    = [...this.app.quizzes,    ...(parsed.quizzes || [])];
                }
                await this.saveData();
            } else {
                // Local-only fallback
                if (mode === 'replace') {
                    this.app.flashcards = parsed.flashcards || [];
                    this.app.quizzes    = parsed.quizzes || [];
                } else {
                    this.app.flashcards = [...this.app.flashcards, ...(parsed.flashcards || [])];
                    this.app.quizzes    = [...this.app.quizzes,    ...(parsed.quizzes || [])];
                }
                await this.saveData();
                importResults.flashcards = this.app.flashcards.length;
                importResults.quizzes    = this.app.quizzes.length;
            }
            
            // Reload data from database to refresh app arrays
            if (this.isSupabaseReady && this.supabaseAuthService?.isAuthenticated()) {
                console.log('DEBUG: Reloading data from database after import');
                await this.loadData();
            }
            
            // Update UI
            if (window.app && typeof window.app.updateUI === 'function') {
                window.app.updateUI();
            }
            
            // Refresh page-specific displays after import
            const currentPage = window.router ? window.router.getCurrentPageFromURL() : 'home';
            if (currentPage === 'flashcards' && this.app.flashcardManager && typeof this.app.flashcardManager.initializeFlashcards === 'function') {
                this.app.flashcardManager.initializeFlashcards();
            } else if (currentPage === 'quiz' && this.app.quizManager && typeof this.app.quizManager.initializeQuiz === 'function') {
                this.app.quizManager.initializeQuiz();
            }
            
            // Show success message with exact counts
            const totalItems = importResults.flashcards + importResults.quizzes;
            const message = mode === 'replace' ? 
                `Data replaced successfully! Imported ${totalItems} items (${importResults.flashcards} flashcards, ${importResults.quizzes} quizzes)` : 
                `Data imported and merged successfully! Imported ${totalItems} items (${importResults.flashcards} flashcards, ${importResults.quizzes} quizzes)`;
            
            // Use styled toast component
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast(message, 'success');
            } else {
                console.log('SUCCESS:', message);
            }
            
            // Clear the current import file
            this.currentImportFile = null;
            console.log('DEBUG: Import completed successfully');
            
        } catch (error) {
            console.log('DEBUG: Import failed with error:', error);
            window.debugLog?.error('unifiedDataManager', 'Import failed:', error);
            this.app.showToast('Import failed: ' + error.message, 'error');
        }
    }

    extractFlashcardsFromText(text) {
        const flashcards = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < lines.length; i += 2) {
            if (i + 1 < lines.length) {
                flashcards.push({
                    id: Date.now() + Math.random(),
                    question: lines[i].trim(),
                    answer: lines[i + 1].trim(),
                    deck: 'Imported',
                    difficulty: 'medium',
                    created: Date.now()
                });
            }
        }
        
        return flashcards;
    }

    recordStudySession() {
        const today = new Date().toDateString();
        
        if (!this.app.streakData) {
            this.app.streakData = this.getDefaultStreakData();
        }
        
        // Check if already studied today
        if (this.app.streakData.studyDates.includes(today)) {
            return; // Already recorded for today
        }
        
        // Add today to study dates
        this.app.streakData.studyDates.push(today);
        this.app.streakData.totalStudyDays++;
        this.app.streakData.lastStudyDate = today;
        
        // Calculate current streak
        this.calculateCurrentStreak();
        
        // Update longest streak if necessary
        if (this.app.streakData.currentStreak > this.app.streakData.longestStreak) {
            this.app.streakData.longestStreak = this.app.streakData.currentStreak;
        }
        
        // Save the updated streak data
        this.saveData();
    }

    calculateCurrentStreak() {
        if (!this.app.streakData.studyDates.length) {
            this.app.streakData.currentStreak = 0;
            return;
        }
        
        const sortedDates = this.app.streakData.studyDates
            .map(date => new Date(date))
            .sort((a, b) => b - a); // Sort descending (newest first)
        
        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if the most recent study date is today or yesterday
        const mostRecent = sortedDates[0];
        mostRecent.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
            // More than 1 day gap, streak is broken
            this.app.streakData.currentStreak = daysDiff === 0 ? 1 : 0;
            return;
        }
        
        // Count consecutive days
        for (let i = 1; i < sortedDates.length; i++) {
            const current = sortedDates[i];
            const previous = sortedDates[i - 1];
            current.setHours(0, 0, 0, 0);
            previous.setHours(0, 0, 0, 0);
            
            const diff = Math.floor((previous - current) / (1000 * 60 * 60 * 24));
            
            if (diff === 1) {
                streak++;
            } else {
                break;
            }
        }
        
        this.app.streakData.currentStreak = streak;
    }

    // =====// PARSING METHODS
    async parseJSON(file, mode = 'merge') {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Detect backup schema type
        const backupType = this.detectBackupSchema(data);
        
        if (mode === 'replace') {
            // Replace all data
            if (backupType === 'complete_backup') {
                // Complete QuizWhiz backup with proper schema
                await this.importCompleteBackup(data, 'replace');
            } else if (data.exportVersion === '2.0') {
                // New format backup
                this.app.flashcards = data.flashcards || [];
                this.app.quizzes = data.quizzes || [];
                this.app.settings = { ...this.app.settings, ...(data.settings || {}) };
                this.app.stats = { ...this.app.stats, ...(data.stats || {}) };
                this.app.streakData = data.streakData || this.getDefaultStreakData();
                if (data.userProfile) {
                    this.currentUser = data.userProfile;
                }
            } else {
                // Legacy or simple format
                await this.importAllLocalStorageData(data);
            }
        } else {
            // Merge data
            if (backupType === 'complete_backup') {
                // Complete QuizWhiz backup with proper schema
                await this.importCompleteBackup(data, 'merge');
            } else if (data.exportVersion === '2.0') {
                // New format backup
                if (data.flashcards) {
                    this.app.flashcards = [...this.app.flashcards, ...data.flashcards];
                }
                if (data.quizzes) {
                    this.app.quizzes = [...this.app.quizzes, ...data.quizzes];
                }
            } else if (Array.isArray(data)) {
                // Array of flashcards
                this.app.flashcards = [...this.app.flashcards, ...data];
            } else {
                // Legacy format
                await this.importAllLocalStorageData(data);
            }
        }
        
        return data;
    }

    // Detect the type of backup schema
    detectBackupSchema(data) {
        console.log('DEBUG: detectBackupSchema called with data type:', typeof data);
        console.log('DEBUG: Data is array:', Array.isArray(data));
        
        if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
            console.log('DEBUG: Invalid data type for schema detection, returning unknown');
            return 'unknown';
        }
        
        console.log('DEBUG: Available data keys:', Object.keys(data));
        
        // Check for complete QuizWhiz backup schema (updated to include actual backup keys)
        const completeBackupKeys = [
            'account', 'settings', 'quizwhiz_flashcards', 'quizwhiz_quizzes', 'quizwhiz_scores', 'stats',
            'quizwhiz_user', 'quizwhiz_settings', 'quizwhiz_stats', 'quizwhiz_streak_data', 'quizwhiz_quiz_stats'
        ];
        
        const foundKeys = completeBackupKeys.filter(key => data.hasOwnProperty(key));
        console.log('DEBUG: Found complete backup keys:', foundKeys);
        
        const hasCompleteSchema = foundKeys.length > 0;
        
        if (hasCompleteSchema) {
            console.log('DEBUG: Detected complete_backup schema');
            return 'complete_backup';
        }
        
        // Check for export version 2.0
        if (data.exportVersion === '2.0') {
            console.log('DEBUG: Detected export_v2 schema');
            return 'export_v2';
        }
        
        // Check for simple flashcard array
        if (Array.isArray(data)) {
            console.log('DEBUG: Detected flashcard_array schema');
            return 'flashcard_array';
        }
        
        // Check for legacy localStorage format
        const legacyKeys = Object.keys(data).filter(key => key.startsWith('quizwhiz_'));
        console.log('DEBUG: Found legacy keys:', legacyKeys);
        
        if (legacyKeys.length > 0) {
            console.log('DEBUG: Detected legacy_format schema');
            return 'legacy_format';
        }
        
        console.log('DEBUG: No schema detected, returning unknown');
        return 'unknown';
    }

    // Import complete QuizWhiz backup with proper schema
    async importCompleteBackup(data, mode = 'merge') {
        try {
            window.debugLog?.info('unifiedDataManager', `Importing complete backup in ${mode} mode`);
            
            // Import account/user profile data
            const userProfile = data.account || data.quizwhiz_user;
            if (userProfile) {
                if (mode === 'replace') {
                    this.currentUser = { ...this.currentUser, ...userProfile };
                } else {
                    this.currentUser = { ...this.currentUser, ...userProfile };
                }
                window.debugLog?.info('unifiedDataManager', 'Imported account data');
            }
            
            // Import settings (quizwhiz_settings or settings)
            const settings = data.settings || data.quizwhiz_settings;
            if (settings) {
                if (mode === 'replace') {
                    this.app.settings = { ...settings };
                } else {
                    this.app.settings = { ...this.app.settings, ...settings };
                }
                window.debugLog?.info('unifiedDataManager', 'Imported settings data');
            }
            
            // Import flashcards
            if (data.quizwhiz_flashcards && Array.isArray(data.quizwhiz_flashcards)) {
                if (mode === 'replace') {
                    this.app.flashcards = [...data.quizwhiz_flashcards];
                } else {
                    this.app.flashcards = [...this.app.flashcards, ...data.quizwhiz_flashcards];
                }
                
                // Save flashcards to Supabase if authenticated
                if (this.isSupabaseReady && this.supabaseAuthService && this.supabaseAuthService.isAuthenticated()) {
                    const userId = this.supabaseAuthService.getCurrentUser()?.id;
                    if (userId) {
                        if (mode === 'replace') {
                            // Clear existing flashcards first, then bulk import
                            await this.app.supabaseDataService.clearAllFlashcards(userId);
                        }
                        // Transform flashcard data from backup format to Supabase format
                        const transformedFlashcards = data.quizwhiz_flashcards.map(flashcard => {
                            // Convert difficulty from string to integer (1-5)
                            let difficultyNum = 1;
                            if (flashcard.difficulty) {
                                const diffStr = flashcard.difficulty.toLowerCase();
                                if (diffStr === 'easy') difficultyNum = 1;
                                else if (diffStr === 'medium') difficultyNum = 3;
                                else if (diffStr === 'hard') difficultyNum = 5;
                                else if (!isNaN(parseInt(flashcard.difficulty))) {
                                    difficultyNum = Math.max(1, Math.min(5, parseInt(flashcard.difficulty)));
                                }
                            }
                            
                            return {
                                question: flashcard.front || flashcard.question,
                                answer: flashcard.back || flashcard.answer,
                                category: flashcard.deck || flashcard.category || 'General',
                                difficulty: difficultyNum
                            };
                        });
                        const importData = {
                            flashcards: transformedFlashcards,
                            quizzes: []
                        };
                        await this.app.supabaseDataService.bulkImport(userId, importData);
                    }
                }
                
                window.debugLog?.info('unifiedDataManager', `Imported ${data.quizwhiz_flashcards.length} flashcards`);
            }
            
            // Import quizzes
            if (data.quizwhiz_quizzes && Array.isArray(data.quizwhiz_quizzes)) {
                // Transform quiz data from backup format (individual records) to Supabase format (grouped by deck)
                const quizzesByDeck = {};
                data.quizwhiz_quizzes.forEach(quiz => {
                    const deckName = quiz.deck || 'Untitled Quiz';
                    if (!quizzesByDeck[deckName]) {
                        quizzesByDeck[deckName] = {
                            title: deckName,
                            category: quiz.category || 'General',
                            questions: []
                        };
                    }
                    // Transform quiz question format to match Supabase expectations
                    const questionObj = {
                        question: quiz.question,
                        correct: quiz.correctAnswer || quiz.correct || quiz.answer
                    };
                    
                    // Handle options - combine correct answer with wrong answers
                    const options = [];
                    if (quiz.wrongAnswers && Array.isArray(quiz.wrongAnswers)) {
                        options.push(...quiz.wrongAnswers);
                    }
                    if (questionObj.correct) {
                        options.push(questionObj.correct);
                    }
                    // Shuffle options to randomize correct answer position
                    questionObj.options = options.sort(() => Math.random() - 0.5);
                    
                    quizzesByDeck[deckName].questions.push(questionObj);
                });
                const transformedQuizzes = Object.values(quizzesByDeck);
                
                // Update local app data with transformed quizzes
                if (mode === 'replace') {
                    this.app.quizzes = [...transformedQuizzes];
                } else {
                    this.app.quizzes = [...this.app.quizzes, ...transformedQuizzes];
                }
                
                // Save quizzes to Supabase if authenticated
                if (this.isSupabaseReady && this.supabaseAuthService && this.supabaseAuthService.isAuthenticated()) {
                    const userId = this.supabaseAuthService.getCurrentUser()?.id;
                    if (userId) {
                        if (mode === 'replace') {
                            // Clear existing quizzes first, then bulk import
                            await this.app.supabaseDataService.clearAllQuizzes(userId);
                        }
                        const importData = {
                            flashcards: [],
                            quizzes: transformedQuizzes
                        };
                        await this.app.supabaseDataService.bulkImport(userId, importData);
                    }
                } else {
                    // Save transformed quizzes to localStorage
                    localStorage.setItem('quizwhiz_quizzes', JSON.stringify(this.app.quizzes));
                }
                
                window.debugLog?.info('unifiedDataManager', `Imported ${data.quizwhiz_quizzes.length} quiz records into ${transformedQuizzes.length} decks`);
            }
            
            // Import scores/statistics
            if (data.quizwhiz_scores && Array.isArray(data.quizwhiz_scores)) {
                // Process scores into stats format
                const processedStats = this.processScoresIntoStats(data.quizwhiz_scores);
                if (mode === 'replace') {
                    this.app.stats = { ...processedStats };
                } else {
                    this.app.stats = { ...this.app.stats, ...processedStats };
                }
                window.debugLog?.info('unifiedDataManager', `Imported ${data.quizwhiz_scores.length} score records`);
            }
            
            // Import general stats
            const statsData = data.stats || data.quizwhiz_stats;
            if (statsData) {
                if (mode === 'replace') {
                    this.app.stats = { ...this.app.stats, ...statsData };
                } else {
                    this.app.stats = { ...this.app.stats, ...statsData };
                }
                window.debugLog?.info('unifiedDataManager', 'Imported general statistics');
            }
            
            // Import streak data if available
            const streakData = data.streakData || data.quizwhiz_streak_data;
            if (streakData) {
                this.app.streakData = streakData;
                window.debugLog?.info('unifiedDataManager', 'Imported streak data');
            }
            
            // Import quiz statistics if available
            if (data.quizwhiz_quiz_stats && Array.isArray(data.quizwhiz_quiz_stats)) {
                // Process quiz stats into app stats format if needed
                if (mode === 'replace') {
                    this.app.quizStats = [...data.quizwhiz_quiz_stats];
                } else {
                    this.app.quizStats = [...(this.app.quizStats || []), ...data.quizwhiz_quiz_stats];
                }
                window.debugLog?.info('unifiedDataManager', `Imported ${data.quizwhiz_quiz_stats.length} quiz statistics`);
            }
            
            return true;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error importing complete backup:', error);
            throw new Error(`Failed to import complete backup: ${error.message}`);
        }
    }

    // Process score records into stats format
    processScoresIntoStats(scores) {
        const stats = {
            totalStudySessions: scores.length,
            totalCardsStudied: 0,
            averageScore: 0,
            bestScore: 0,
            recentSessions: []
        };
        
        if (scores.length === 0) return stats;
        
        let totalScore = 0;
        scores.forEach(score => {
            if (score.score !== undefined) {
                totalScore += score.score;
                stats.bestScore = Math.max(stats.bestScore, score.score);
            }
            if (score.cardsStudied !== undefined) {
                stats.totalCardsStudied += score.cardsStudied;
            }
            
            // Add to recent sessions (keep last 10)
            stats.recentSessions.push({
                date: score.date || score.timestamp || Date.now(),
                score: score.score || 0,
                deck: score.deck || 'Unknown',
                cardsStudied: score.cardsStudied || 0
            });
        });
        
        stats.averageScore = scores.length > 0 ? totalScore / scores.length : 0;
        stats.recentSessions = stats.recentSessions.slice(-10); // Keep only last 10
        
        return stats;
    }

    async importAllLocalStorageData(data) {
        // Import legacy localStorage format
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('quizwhiz_')) {
                const cleanKey = key.replace('quizwhiz_', '');
                
                switch (cleanKey) {
                    case 'flashcards':
                        if (Array.isArray(value)) {
                            this.app.flashcards = [...this.app.flashcards, ...value];
                        }
                        break;
                    case 'quizzes':
                        if (Array.isArray(value)) {
                            this.app.quizzes = [...this.app.quizzes, ...value];
                        }
                        break;
                    case 'settings':
                        this.app.settings = { ...this.app.settings, ...value };
                        break;
                    case 'stats':
                        this.app.stats = { ...this.app.stats, ...value };
                        break;
                    case 'streakData':
                        this.app.streakData = value;
                        break;
                }
            }
        }
    }

    async parseXML(file, mode = 'merge') {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        const flashcards = [];
        const quizzes = [];
        
        // Parse flashcards
        xmlDoc.querySelectorAll('flashcard').forEach(card => {
            flashcards.push({
                id: card.getAttribute('id') || Date.now() + Math.random(),
                question: card.querySelector('question')?.textContent || '',
                answer: card.querySelector('answer')?.textContent || '',
                deck: card.querySelector('deck')?.textContent || 'Imported',
                difficulty: card.querySelector('difficulty')?.textContent || 'medium',
                created: card.querySelector('created')?.textContent || Date.now()
            });
        });
        
        // Parse quizzes
        xmlDoc.querySelectorAll('quiz').forEach(quiz => {
            const wrongAnswers = [];
            quiz.querySelectorAll('wrongAnswer').forEach(wa => {
                wrongAnswers.push(wa.textContent);
            });
            
            quizzes.push({
                id: quiz.getAttribute('id') || Date.now() + Math.random(),
                question: quiz.querySelector('question')?.textContent || '',
                correctAnswer: quiz.querySelector('correctAnswer')?.textContent || '',
                wrongAnswers: wrongAnswers,
                deck: quiz.querySelector('deck')?.textContent || 'Imported',
                difficulty: quiz.querySelector('difficulty')?.textContent || 'medium',
                created: quiz.querySelector('created')?.textContent || Date.now()
            });
        });
        
        if (mode === 'replace') {
            this.app.flashcards = flashcards;
            this.app.quizzes = quizzes;
        } else {
            this.app.flashcards = [...this.app.flashcards, ...flashcards];
            this.app.quizzes = [...this.app.quizzes, ...quizzes];
        }
        
        return { flashcards, quizzes };
    }

    async parseCSV(file, mode = 'merge') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }
        
        const flashcards = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const fields = this.parseCSVLine(lines[i]);
            if (fields.length >= 2) {
                flashcards.push({
                    id: Date.now() + Math.random(),
                    question: fields[0] || '',
                    answer: fields[1] || '',
                    deck: fields[2] || 'Imported',
                    difficulty: fields[3] || 'medium',
                    created: Date.now()
                });
            }
        }
        
        if (mode === 'replace') {
            this.app.flashcards = flashcards;
        } else {
            this.app.flashcards = [...this.app.flashcards, ...flashcards];
        }
        
        return { flashcards };
    }

    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        fields.push(current.trim());
        return fields;
    }

    async parseTXT(file, mode = 'merge') {
        const text = await file.text();
        const flashcards = this.extractFlashcardsFromText(text);
        
        if (mode === 'replace') {
            this.app.flashcards = flashcards;
        } else {
            this.app.flashcards = [...this.app.flashcards, ...flashcards];
        }
        
        return { flashcards };
    }

    async parsePDF(file, mode = 'merge') {
        // PDF parsing would require a library like PDF.js
        // For now, throw an error
        throw new Error('PDF import not yet implemented');
    }

    async parseDOCX(file, mode = 'merge') {
        // DOCX parsing would require a library
        // For now, throw an error
        throw new Error('DOCX import not yet implemented');
    }

    // PROFILE MODAL METHODS =====
    
    async showProfileModal() {
        await this.loadModals();
        
        if (this.app.uiManager) {
            this.populateAvatarGrid();
            this.populateProfileForm();
            this.app.uiManager.openModal('profile-modal');
        }
    }
    
    async loadModals() {
        if (document.getElementById('profile-modal')) {
            return;
        }
        
        try {
            const response = await fetch('../components/user-modals.html');
            if (response.ok) {
                const modalHTML = await response.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = modalHTML;
                
                while (tempDiv.firstChild) {
                    document.body.appendChild(tempDiv.firstChild);
                }
            }
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error loading user modals:', error);
        }
    }
    
    populateAvatarGrid() {
        const avatarGrid = document.getElementById('avatar-grid');
        if (!avatarGrid) return;
        
        avatarGrid.innerHTML = this.avatars.map(avatar => `
            <div class="avatar-option ${this.currentUser.avatar.id === avatar.id ? 'selected' : ''}" 
                 data-avatar-id="${avatar.id}" 
                 style="background-color: ${avatar.background};">
                <i class="fas ${avatar.icon}" style="color: ${avatar.color}; font-size: 1rem;"></i>
            </div>
        `).join('');
        
        avatarGrid.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                const avatarId = parseInt(option.dataset.avatarId);
                this.selectAvatar(avatarId);
            });
        });
    }
    
    selectAvatar(avatarId) {
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-avatar-id="${avatarId}"]`).classList.add('selected');
        
        const avatar = this.avatars.find(a => a.id === avatarId);
        const previewAvatar = document.getElementById('preview-avatar');
        if (previewAvatar && avatar) {
            previewAvatar.innerHTML = `<i class="fas ${avatar.icon}" style="color: ${avatar.color}; font-size: 1.8rem;"></i>`;
            previewAvatar.style.backgroundColor = avatar.background;
        }
    }
    
    populateProfileForm() {
        const usernameInput = document.getElementById('user-modal-username');
        const previewUsername = document.getElementById('preview-username');
        const previewAvatar = document.getElementById('preview-avatar');
        
        if (usernameInput) {
            usernameInput.value = this.currentUser.username;
        }
        
        if (previewUsername) {
            previewUsername.textContent = this.currentUser.username;
        }
        
        if (previewAvatar && this.currentUser.avatar) {
            const avatar = this.currentUser.avatar;
            previewAvatar.innerHTML = `<i class="fas ${avatar.icon}" style="color: ${avatar.color}; font-size: 1.8rem;"></i>`;
            previewAvatar.style.backgroundColor = avatar.background;
        }
    }
    
    saveProfile() {
        const usernameInput = document.getElementById('user-modal-username');
        const selectedAvatar = document.querySelector('.avatar-option.selected');
        
        if (usernameInput && selectedAvatar) {
            const newUsername = usernameInput.value.trim();
            const avatarId = parseInt(selectedAvatar.dataset.avatarId);
            
            if (newUsername) {
                this.updateUsername(newUsername);
                this.updateAvatar(avatarId);
                
                if (this.app.uiManager) {
                    this.app.uiManager.closeModal('profile-modal');
                    this.app.uiManager.showToast('Profile updated successfully!', 'success');
                }
            } else {
                if (this.app.uiManager) {
                    this.app.uiManager.showToast('Please enter a username', 'error');
                }
            }
        }
    }

    // ===== DATA MANAGER METHODS FOR IMPORT =====
    
    async insertFlashcard(flashcard) {
        try {
            // Add to local array
            this.app.flashcards.push(flashcard);
            
            // Save to Supabase if authenticated
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                await this.app.supabaseDataService.saveFlashcard(flashcard);
            } else {
                // Save to localStorage
                localStorage.setItem('quizwhiz_flashcards', JSON.stringify(this.app.flashcards));
            }
            
            return flashcard;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error inserting flashcard:', error);
            throw error;
        }
    }
    
    async insertQuiz(quiz) {
        try {
            // Add to local array
            this.app.quizzes.push(quiz);
            
            // Save to Supabase if authenticated
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                await this.app.supabaseDataService.saveQuiz(quiz);
            } else {
                // Save to localStorage
                localStorage.setItem('quizwhiz_quizzes', JSON.stringify(this.app.quizzes));
            }
            
            return quiz;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error inserting quiz:', error);
            throw error;
        }
    }
    
    async upsertFlashcard(flashcard) {
        try {
            // Find existing flashcard by ID
            const existingIndex = this.app.flashcards.findIndex(f => f.id === flashcard.id);
            
            if (existingIndex >= 0) {
                // Update existing
                this.app.flashcards[existingIndex] = flashcard;
            } else {
                // Insert new
                this.app.flashcards.push(flashcard);
            }
            
            // Save to Supabase if authenticated
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                await this.app.supabaseDataService.saveFlashcard(flashcard);
            } else {
                // Save to localStorage
                localStorage.setItem('quizwhiz_flashcards', JSON.stringify(this.app.flashcards));
            }
            
            return flashcard;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error upserting flashcard:', error);
            throw error;
        }
    }
    
    async upsertQuiz(quiz) {
        try {
            // Find existing quiz by ID
            const existingIndex = this.app.quizzes.findIndex(q => q.id === quiz.id);
            
            if (existingIndex >= 0) {
                // Update existing
                this.app.quizzes[existingIndex] = quiz;
            } else {
                // Insert new
                this.app.quizzes.push(quiz);
            }
            
            // Save to Supabase if authenticated
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                await this.app.supabaseDataService.saveQuiz(quiz);
            } else {
                // Save to localStorage
                localStorage.setItem('quizwhiz_quizzes', JSON.stringify(this.app.quizzes));
            }
            
            return quiz;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error upserting quiz:', error);
            throw error;
        }
    }
    
    async bulkImport(userId, data, mode = 'append') {
        try {
            console.log('UnifiedDataManager bulkImport called with:', { userId, dataKeys: Object.keys(data), mode });
            console.log('UnifiedDataManager state:', { isSupabaseReady: this.isSupabaseReady, hasApp: !!this.app, hasSupabaseDataService: !!this.app?.supabaseDataService });
            
            window.debugLog?.info('unifiedDataManager', `Starting bulk import for user ${userId} in ${mode} mode`);
            
            // Delegate to supabaseDataService for the actual import
            if (this.isSupabaseReady && this.app.supabaseDataService) {
                console.log('Delegating to supabaseDataService.bulkImport');
                const result = await this.app.supabaseDataService.bulkImport(userId, data, mode);
                
                // Update local arrays based on mode
                if (mode === 'replace') {
                    this.app.flashcards = data.flashcards || [];
                    this.app.quizzes = data.quizzes || [];
                } else {
                    // Append mode - add to existing arrays
                    if (data.flashcards) {
                        this.app.flashcards.push(...data.flashcards);
                    }
                    if (data.quizzes) {
                        this.app.quizzes.push(...data.quizzes);
                    }
                }
                
                window.debugLog?.info('unifiedDataManager', `Bulk import completed: ${result.flashcards || 0} flashcards, ${result.quizzes || 0} quizzes`);
                return result;
            } else {
                console.log('Supabase service check failed:', { isSupabaseReady: this.isSupabaseReady, hasSupabaseDataService: !!this.app?.supabaseDataService });
                throw new Error('Supabase data service not available for bulk import');
            }
        } catch (error) {
            console.error('UnifiedDataManager bulkImport error:', error);
            window.debugLog?.error('unifiedDataManager', 'Error in bulk import:', error);
            throw error;
        }
    }
    
    async clearAllData() {
        try {
            // Clear local arrays
            this.app.flashcards = [];
            this.app.quizzes = [];
            
            // Clear from Supabase if authenticated
            if (this.isSupabaseReady && this.app.authManager && this.app.authManager.isUserAuthenticated()) {
                const userId = this.app.authManager.getCurrentUser()?.id;
                if (userId) {
                    await this.app.supabaseDataService.deleteAllUserData(userId);
                }
            } else {
                // Clear from localStorage
                localStorage.removeItem('quizwhiz_flashcards');
                localStorage.removeItem('quizwhiz_quizzes');
            }
            
            return true;
        } catch (error) {
            window.debugLog?.error('unifiedDataManager', 'Error clearing all data:', error);
            throw error;
        }
    }
}

// Export for module usage
if (typeof window !== 'undefined') {
    window.UnifiedDataManager = UnifiedDataManager;
}