/**
 * Authentication Manager for QuizWhiz
 * Handles user authentication, registration, and account management
 */

// Export a promise that resolves when auth is ready
let authReady;
let authReadyResolve;

class AuthManager {
    constructor(app) {
        console.log('🚀 AuthManager constructor called - SUPABASE VERSION');
        this.app = app;
        this.supabaseAuth = null;
        this.currentUser = null;      // object or null
        this.isAuthenticated = false; // boolean
        this._isUpdatingUI = false;
        this.avatars = this.generateAvatars();
        this.selectedAvatarId = 1;
        this.selectedAvatar = this.avatars[0]; // Initialize with first avatar object
        this.userProfileData = null;
        this.debugMode = true; // Set to true for verbose logging
        this.isLoadingModals = false; // Flag to prevent concurrent modal loading
        this.isLoadingStatsModal = false; // Flag to prevent concurrent stats modal loading
        
        // Wire auth listener after Supabase is ready and expose ready promise
        this.ready = new Promise(async (resolve) => {
            // Wait for Supabase to be ready
            if (typeof window.supabaseAuthService === 'undefined') {
                await new Promise(supabaseResolve => {
                    document.addEventListener('supabase-ready', supabaseResolve, { once: true });
                });
            }
            
            const supabaseAuth = window.supabaseAuthService;
            supabaseAuth.onAuthStateChange((event, session) => {
                const user = session?.user || null;
                this.handleAuthStateChange(user); // sets state + dispatches ONE event
                resolve();                        // resolve on first fire
            });
        });
        
        this.log('AuthManager constructor called with immediate auth listener');
        
        // Initialize immediately if Supabase is ready, otherwise wait
        if (typeof window.supabaseAuthService !== 'undefined') {
            this.log('Supabase already ready, initializing AuthManager immediately');
            setTimeout(() => this.initialize(), 0);
        } else {
            this.log('Supabase not ready, waiting for supabase-ready event');
            document.addEventListener('supabase-ready', () => this.initialize());
        }
    }
    
    /**
     * Debug logging method - only logs when debugMode is true
     */
    log(message, ...args) {
        if (this.debugMode) {
            window.debugLog?.info('authManager', message, ...args);
        }
    }
    
    /**
     * Initialize the authentication manager
     */
    async initialize() {
        this.log('🔧 Initializing AuthManager');
        
        // Wait for Supabase services to be available
        const waitForServices = () => {
            return new Promise((resolve) => {
                const checkServices = () => {
                    this.supabaseAuth = window.supabaseAuthService;
                    
                    if (!this.supabaseAuth) {
                        this.log('⏳ Waiting for SupabaseAuthService to be ready...');
                        setTimeout(checkServices, 50);
                        return;
                    }
                    
                    this.log('✅ Supabase services available, setting up auth state listener');
                    resolve();
                };
                checkServices();
            });
        };
        
        await waitForServices();
        
        // Wait for session restoration to complete before setting up UI
        this.log('⏳ Waiting for session restoration to complete...');
        await this.ready; // Wait for the auth state to be determined
        
        // Set up auth state listener for future changes
        this.supabaseAuth.onAuthStateChange((event, session) => {
            const user = session?.user || null;
            this.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
            this.handleAuthStateChange(user);
        });
        
        // Initialize UI elements after session restoration
        this.initUI();
        
        this.log('🎉 AuthManager initialization completed');
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initUI() {
        // Load auth modals if not already in the DOM
        this.loadAuthModals().then(() => {
            if (this.debugMode) window.debugLog?.info('authManager', 'AuthManager: Auth modals loaded, setting up UI components');
            
            // Setup logout button
            this.setupLogoutButton();
            
            // Setup auth button event listeners - with retry mechanism
            this.setupAuthButtons();
            
            // Setup user dropdown event listeners
            this.setupUserDropdown();
            
            // Update UI based on auth state
            this.updateAuthUI();
        }).catch(error => {
            window.debugLog?.error('authManager', 'AuthManager: Error loading auth modals:', error);
            // Still try to setup buttons even if modal loading fails
            this.setupAuthButtons();
        });
    }
    
    /**
     * Handle authentication state changes
     * @param {Object} user - Supabase user object
     */
    handleAuthStateChange(user) {
        this.currentUser = user || null;
        this.isAuthenticated = !!user;

        document.dispatchEvent(new CustomEvent('auth:changed', {
            detail: { isAuthenticated: this.isAuthenticated, user: this.currentUser }
        }));
        
        if (user) {
            this.log('🔥 Supabase Auth State Change: User signed in', {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata
            });
            
            // Get user profile data from Supabase
            this.getUserProfile().then(() => {
                this.log('✅ User profile loaded successfully');
                
                // Notify app of authentication with complete profile
                this.app.onUserAuthenticated(user);
                
                // Load user data from Supabase
                if (this.app.dataManager) {
                    this.app.dataManager.loadData();
                }
                
                // Trigger post-login activities
                this.onPostLogin();
            }).catch(error => {
                window.debugLog?.error('authManager', '❌ Error loading user profile:', error);
                this.app.onUserAuthenticated(user);
                this.onPostLogin();
            });
        } else {
            this.log('🔥 Supabase Auth State Change: User signed out');
            this.selectedAvatarId = 1;
            this.selectedAvatar = this.avatars[0]; // Reset to first avatar
            
            // Notify app of sign out
            this.app.onUserSignedOut();
            
            // Clear any cached user data
            this.clearUserCache();
        }
    }
    
    /**
     * Get the navbar root element, preferring the last injected one
     */
    getNavbarRoot() {
        // Prefer the last injected navbar to avoid toggling a stale one
        const roots = document.querySelectorAll('#navbar-container .navbar-root, nav.navbar-root, #navbar');
        return roots.length ? roots[roots.length - 1] : null;
    }

    /**
     * Format display name from user data
     * Extracts username from email and capitalizes first letter
     */
    formatDisplayName(user) {
        if (!user) return 'Account';
        
        // Check cached profile data first
        if (this.userProfileData && this.userProfileData.username) {
            this.log('🔍 Using cached profile username:', this.userProfileData.username);
            return this.userProfileData.username.charAt(0).toUpperCase() + this.userProfileData.username.slice(1);
        }
        
        // Check user metadata for username
        if (user.user_metadata && user.user_metadata.username) {
            this.log('🔍 Using user metadata username:', user.user_metadata.username);
            return user.user_metadata.username.charAt(0).toUpperCase() + user.user_metadata.username.slice(1);
        }
        
        // Check user metadata for display name
        if (user.user_metadata && user.user_metadata.displayName) {
            this.log('🔍 Using user metadata displayName:', user.user_metadata.displayName);
            return user.user_metadata.displayName.charAt(0).toUpperCase() + user.user_metadata.displayName.slice(1);
        }
        
        // If displayName exists, use it
        if (user.displayName) {
            this.log('🔍 Using user displayName:', user.displayName);
            return user.displayName.charAt(0).toUpperCase() + user.displayName.slice(1);
        }
        
        // Extract username from email and capitalize first letter
        if (user.email) {
            const username = user.email.split('@')[0];
            this.log('🔍 Using email-derived username:', username);
            return username.charAt(0).toUpperCase() + username.slice(1);
        }
        
        this.log('⚠️ No username found, falling back to "Account"');
        return 'Account';
    }

    /**
     * Update UI elements based on authentication state
     * @param {Element} root - Optional root element to scope the search
     */
    updateAuthUI(root) {
        if (this._isUpdatingUI) return;
        this._isUpdatingUI = true;
        try {
            root = root || document.querySelector('#navbar-container .navbar-root') || document.getElementById('navbar');
            if (!root) return;

            const authButtons = root.querySelector('.auth-buttons');
            const userMenu    = root.querySelector('.user-menu');
            if (!authButtons || !userMenu) return;

            if (this.currentUser) {
                authButtons.classList.add('hidden');
                userMenu.classList.remove('hidden');
                const el = root.querySelector('#userDisplayName');
                if (el) {
                    el.textContent = this.formatDisplayName(this.currentUser);
                }
                
                // Update avatar
                this.updateUserAvatar();
                
                // Setup user dropdown functionality
                this.setupUserDropdown();
            } else {
                userMenu.classList.add('hidden');
                authButtons.classList.remove('hidden');
            }
            // IMPORTANT: no events emitted from here.
        } finally {
            this._isUpdatingUI = false;
        }
    }
    
    /**
     * Force update authentication UI with more aggressive approach
     */
    forceUpdateAuthUI() {
        this.log('🔧 Force updating authentication UI with aggressive approach');
        
        // Wait for DOM to be ready
        if (document.readyState !== 'complete') {
            setTimeout(() => this.forceUpdateAuthUI(), 100);
            return;
        }
        
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        console.log('🔧 FORCE UPDATE DEBUG:', {
            isAuthenticated: this.isAuthenticated,
            currentUser: !!this.currentUser,
            authButtons: !!authButtons,
            userMenu: !!userMenu,
            authButtonsHidden: authButtons?.classList.contains('hidden'),
            userMenuHidden: userMenu?.classList.contains('hidden')
        });
        
        if (this.isAuthenticated && this.currentUser) {
            // Hide auth buttons
            if (authButtons) {
                authButtons.style.display = 'none';
                authButtons.classList.add('hidden');
                console.log('🔧 Forcefully hidden auth buttons');
            }
            
            // Show user menu
            if (userMenu) {
                userMenu.style.display = 'flex';
                userMenu.classList.remove('hidden');
                console.log('🔧 Forcefully shown user menu');
                
                // Update username
                const usernameEl = userMenu.querySelector('.username');
                if (usernameEl) {
                    const displayName = this.formatDisplayName(this.currentUser);
                    usernameEl.textContent = displayName;
                    console.log('🔧 Updated username to:', displayName);
                }
            }
        } else {
            // Show auth buttons
            if (authButtons) {
                authButtons.style.display = 'flex';
                authButtons.classList.remove('hidden');
                console.log('🔧 Forcefully shown auth buttons');
            }
            
            // Hide user menu
            if (userMenu) {
                userMenu.style.display = 'none';
                userMenu.classList.add('hidden');
                console.log('🔧 Forcefully hidden user menu');
            }
        }
    }
    
    /**
     * Clean up existing auth modals from DOM
     */
    cleanupExistingModals() {
        const modalIds = ['login-modal', 'register-modal', 'profile-modal', 'user-stats-modal', 'account-settings-modal'];
        modalIds.forEach(modalId => {
            const existingModal = document.getElementById(modalId);
            if (existingModal) {
                console.log(`🔧 Removing existing modal: ${modalId}`);
                existingModal.remove();
            }
        });
    }

    /**
     * Load authentication modals into the DOM
     */
    async loadAuthModals() {
        console.log('🔧 loadAuthModals() called - DIRECT CONSOLE LOG');
        
        // Prevent multiple simultaneous calls
        if (this.isLoadingModals) {
            console.log('🔧 loadAuthModals - Already loading, returning early');
            return;
        }
        
        // Check if modals are already loaded FIRST
        if (document.getElementById('login-modal')) {
            console.log('🔧 loadAuthModals - Login modal already exists, returning early');
            if (this.debugMode) window.debugLog?.info('authManager', 'AuthManager: Auth modals already loaded, skipping');
            return;
        }
        
        try {
            // Set loading flag to prevent concurrent calls
            this.isLoadingModals = true;
            
            // Clean up any existing modals before loading new ones
            this.cleanupExistingModals();
            
            if (this.debugMode) window.debugLog?.info('authManager', 'AuthManager: Loading auth modals from external file...');
            
            // Try different paths based on current location
            const possiblePaths = [
                '/components/auth-modals.html',  // Absolute path from root
                '../components/auth-modals.html', // From pages folder
                'components/auth-modals.html',  // Relative from root
                './components/auth-modals.html'   // Alternative root path
            ];
            
            let modalHTML = null;
            let successPath = null;
            
            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        modalHTML = await response.text();
                        successPath = path;
                        if (this.debugMode) window.debugLog?.info('authManager', `AuthManager: Successfully loaded auth modals from: ${path}`);
                        break;
                    }
                } catch (fetchError) {
                    // Silently continue to next path - 404 errors are expected during fallback
                }
            }
            
            if (!modalHTML) {
                window.debugLog?.error('authManager', 'AuthManager: Could not load auth modals from external file');
                throw new Error('Auth modals could not be loaded');
            }
            
            // Double-check that modals weren't added by another call while we were fetching
            if (document.getElementById('login-modal')) {
                console.log('🔧 loadAuthModals - Modal was added by another call, returning early');
                return;
            }
            
            // Add to DOM using the same method as UserManager
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = modalHTML;
            
            console.log('🔧 Inserting modal HTML into DOM...');
            // Append modals to body
            while (tempDiv.firstChild) {
                document.body.appendChild(tempDiv.firstChild);
            }
            
            console.log('🔧 Auth modals inserted, checking if login-modal exists...');
            const loginModalCheck = document.getElementById('login-modal');
            console.log('🔧 Login modal exists after insertion:', !!loginModalCheck);
            
            if (this.debugMode) window.debugLog?.info('authManager', `AuthManager: Auth modals loaded successfully${successPath ? ' from ' + successPath : ' (inline)'}`);
            
            // Verify modals were added
            const loginModal = document.getElementById('login-modal');
            const registerModal = document.getElementById('register-modal');
            console.log('🔧 Modal verification - Login:', !!loginModal, 'Register:', !!registerModal);
            if (this.debugMode) window.debugLog?.info('authManager', `AuthManager: Modal verification - Login: ${!!loginModal}, Register: ${!!registerModal}`);
            
            // Set up form event listeners after modals are inserted (only once)
            console.log('🔧 loadAuthModals - Setting up form event listeners');
            this.setupLoginForm();
            this.setupRegisterForm();
            this.setupProfileForm();
            
            // Set up close button event listeners
            this.setupCloseModalEvents();
            
            // Populate avatar selection in register modal
            const avatarGrid = document.getElementById('avatar-selection');
            if (avatarGrid) {
                this.setupAvatarSelection(avatarGrid);
            }
            
            console.log('🔧 loadAuthModals - Setup completed');
            
        } catch (error) {
            window.debugLog?.error('authManager', 'AuthManager: Error loading auth modals:', error);
            throw error;
        } finally {
            // Always reset the loading flag
            this.isLoadingModals = false;
        }
    }
    
    /**
     * Get user-friendly error message from Supabase error
     * @param {Error} error - Supabase error object
     * @returns {string} User-friendly error message
     */
    getUserFriendlyErrorMessage(error) {
        const errorMessage = error.message || '';
        
        // Map Supabase error messages to user-friendly messages
        const errorMap = {
            'Invalid login credentials': 'Invalid username or password. Please check your credentials and try again.',
            'User already registered': 'This username is already taken. Please choose a different username.',
            'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
            'Signup requires a valid password': 'Please enter a valid password.',
            'Email not confirmed': 'Please check your email and confirm your account.',
            'Too many requests': 'Too many failed attempts. Please try again later.',
            'Network request failed': 'Network error. Please check your internet connection and try again.',
            'Username must be 3-20 characters and contain only letters, numbers, and underscores': 'Username must be 3-20 characters and contain only letters, numbers, and underscores.',
            'Username and password are required': 'Username and password are required.',
            'Invalid username format': 'Invalid username format. Please enter a valid username.',
            'Password must be at least 6 characters': 'Password must be at least 6 characters long.'
        };
        
        // Check for exact message matches first
        if (errorMap[errorMessage]) {
            return errorMap[errorMessage];
        }
        
        // Check for partial matches
        for (const [key, value] of Object.entries(errorMap)) {
            if (errorMessage.includes(key)) {
                return value;
            }
        }
        
        // Return original message or fallback to generic message
        return errorMessage || 'An error occurred. Please try again.';
    }



    /**
     * Highlight error fields based on error type
     * @param {Error} error - The error object
     * @param {string} formType - The form type (register/login)
     */
    highlightErrorFields(error, formType) {
        const errorMessage = error?.message || error?.error_description || error?.error || '';
        const lowerMessage = errorMessage.toLowerCase();
        
        // Highlight specific fields based on error type
        if (lowerMessage.includes('username') || lowerMessage.includes('user already registered')) {
            const usernameField = document.getElementById(`${formType}-username`);
            if (usernameField) {
                usernameField.classList.add('border-red-500', 'error');
                usernameField.classList.remove('border-gray-300');
            }
        }
        
        if (lowerMessage.includes('password')) {
            const passwordField = document.getElementById(`${formType}-password`);
            if (passwordField) {
                passwordField.classList.add('border-red-500', 'error');
                passwordField.classList.remove('border-gray-300');
            }
        }
    }

    /**
     * Set up login form event listeners
     */
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        console.log('🔧 setupLoginForm - Login form found:', !!loginForm);
        if (!loginForm) {
            console.log('❌ setupLoginForm - Login form not found, returning early');
            return;
        }
        
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        console.log('🔧 setupLoginForm - Username input found:', !!usernameInput);
        console.log('🔧 setupLoginForm - Password input found:', !!passwordInput);
        
        console.log('🔧 setupLoginForm - Adding submit event listener to login form');
        
        // Remove any existing event listeners first
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        // Re-get the form reference after replacement
        const freshLoginForm = document.getElementById('login-form');
        console.log('🔧 setupLoginForm - Fresh form reference obtained:', !!freshLoginForm);
        
        // Setup password toggle functionality AFTER form replacement
        this.setupPasswordToggle('login-password');
        
        // Add focus listeners to remove error styling AFTER form replacement
        const freshUsernameInput = document.getElementById('login-username');
        const freshPasswordInput = document.getElementById('login-password');
        
        if (freshUsernameInput) {
            freshUsernameInput.addEventListener('focus', () => {
                freshUsernameInput.classList.remove('error', 'login-error', 'login-success');
            });
        }
        
        if (freshPasswordInput) {
            freshPasswordInput.addEventListener('focus', () => {
                freshPasswordInput.classList.remove('error', 'login-error', 'login-success');
            });
        }
        
        freshLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🔐 LOGIN FORM SUBMITTED! - DIRECT CONSOLE LOG');
            window.debugLog?.info('authManager', '🔐 Login form submitted');
            
            // Get fresh input references after form replacement
            const freshUsernameInput = document.getElementById('login-username');
            const freshPasswordInput = document.getElementById('login-password');
            
            const username = freshUsernameInput ? freshUsernameInput.value : '';
            const password = freshPasswordInput ? freshPasswordInput.value : '';
            
            this.log('📝 Login credentials:', { username: username ? '✓' : '✗', password: password ? '✓' : '✗' });
            
            // Clear any existing error styling
            if (freshUsernameInput) freshUsernameInput.classList.remove('error', 'login-error', 'login-success');
            if (freshPasswordInput) freshPasswordInput.classList.remove('error', 'login-error', 'login-success');
            
            // Validate password length before attempting login
            if (password && password.length < 6) {
                this.app.showToast('Password must be at least 6 characters long', 'error');
                if (freshPasswordInput) freshPasswordInput.classList.add('login-error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = freshLoginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Signing In...';
                submitBtn.disabled = true;
                
                await this.login(username, password);
                
                // Add green success state to inputs on successful login
                if (freshUsernameInput) freshUsernameInput.classList.add('login-success');
                if (freshPasswordInput) freshPasswordInput.classList.add('login-success');
                
                // Remove success state after a delay
                setTimeout(() => {
                    if (freshUsernameInput) freshUsernameInput.classList.remove('login-success');
                    if (freshPasswordInput) freshPasswordInput.classList.remove('login-success');
                }, 2000);
                
                // Reset button state on success
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            } catch (error) {
                window.debugLog?.error('authManager', '❌ Login error:', error);
                
                // Reset button state
                const submitBtn = freshLoginForm.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Sign In';
                submitBtn.disabled = false;
                
                // Show user-friendly error messages
                const friendlyMessage = this.getUserFriendlyErrorMessage(error);
                this.app.showToast(friendlyMessage, 'error');
                
                // Add visual feedback to form fields
                this.highlightErrorFields(error, 'login');
                
                // Add red glowing border effect to login inputs
                if (freshUsernameInput) freshUsernameInput.classList.add('login-error');
                if (freshPasswordInput) freshPasswordInput.classList.add('login-error');
            }
        });
    }
    
    /**
     * Set up registration form event listeners
     */
    setupRegisterForm() {
        const registerForm = document.getElementById('register-form');
        if (!registerForm) return;
        
        // Avatar selection
        const avatarGrid = document.getElementById('avatar-selection');
        if (avatarGrid) {
            this.setupAvatarSelection(avatarGrid);
        }
        
        // Setup password toggle functionality for register form
        this.setupPasswordToggle('register-password');
        this.setupPasswordToggle('register-confirm-password');
        
        // Remove existing form submit listener to prevent duplicates
        if (registerForm._authManagerSubmitListener) {
            registerForm.removeEventListener('submit', registerForm._authManagerSubmitListener);
        }
        
        // Create new submit listener function
        const submitListener = async (e) => {
            e.preventDefault();
            
            this.log('📝 Registration form submitted');
            
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            this.log('📋 Registration data:', { 
                username: username ? '✓' : '✗', 
                password: password ? '✓' : '✗',
                confirmPassword: confirmPassword ? '✓' : '✗',
                passwordsMatch: password === confirmPassword ? '✓' : '✗'
            });
            
            // Validate password confirmation
            if (password !== confirmPassword) {
                window.debugLog?.error('authManager', '❌ Password confirmation failed');
                this.app.showToast('Passwords do not match', 'error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Creating Account...';
                submitBtn.disabled = true;
                
                await this.register(username, password);
                
                // Reset button state on success
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            } catch (error) {
                window.debugLog?.error('authManager', '❌ Registration error:', error);
                
                // Reset button state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Create Account';
                submitBtn.disabled = false;
                
                // Show user-friendly error messages
                const friendlyMessage = this.getUserFriendlyErrorMessage(error);
                this.app.showToast(friendlyMessage, 'error');
                
                // Add visual feedback to form fields
                this.highlightErrorFields(error, 'register');
            }
        };
        
        // Store reference and add listener
        registerForm._authManagerSubmitListener = submitListener;
        registerForm.addEventListener('submit', submitListener);
    }
    

     
     /**
      * Generate avatars (reusing UserManager's avatar system)
      */
    generateAvatars() {
        // Colors aligned with webapp's design system
        const colors = [
            '#6366f1', // Primary color
            '#8b5cf6', // Secondary color
            '#10b981', // Success color
            '#3b82f6', // Info color
            '#f59e0b', // Warning color
            '#ef4444', // Error color
            '#5856eb', // Primary dark
            '#06b6d4', // Cyan
            '#8b5a2b', // Brown
            '#7c3aed', // Violet
            '#059669', // Emerald
            '#dc2626', // Red
            '#2563eb', // Blue
            '#7c2d12', // Orange dark
            '#4338ca'  // Indigo
        ];
        
        // Light backgrounds that complement the colors
        const backgrounds = [
            '#eef2ff', // Primary light
            '#f3e8ff', // Secondary light
            '#d1fae5', // Success light
            '#dbeafe', // Info light
            '#fef3c7', // Warning light
            '#fee2e2', // Error light
            '#e0e7ff', // Primary dark light
            '#cffafe', // Cyan light
            '#fef7ed', // Brown light
            '#ede9fe', // Violet light
            '#ecfdf5', // Emerald light
            '#fef2f2', // Red light
            '#eff6ff', // Blue light
            '#fff7ed', // Orange light
            '#eef2ff'  // Indigo light
        ];

        const icons = [
            'fa-user', 'fa-user-astronaut', 'fa-user-ninja', 'fa-user-graduate',
            'fa-user-tie', 'fa-user-secret', 'fa-robot', 'fa-cat',
            'fa-dog', 'fa-dragon', 'fa-fish', 'fa-frog', 'fa-hippo',
            'fa-horse', 'fa-kiwi-bird'
        ];

        return Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            icon: icons[i % icons.length],
            color: colors[i % colors.length],
            background: backgrounds[i % backgrounds.length]
        }));
    }
    
    /**
     * Set up profile form event listeners
     */
    setupProfileForm() {
        const profileForm = document.getElementById('profile-form');
        if (!profileForm) return;
        
        // Avatar selection in profile
        const profileAvatarGrid = document.getElementById('profile-avatar-selection');
        if (profileAvatarGrid) {
            this.setupAvatarSelection(profileAvatarGrid);
        }
        
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('profile-username').value;
            
            try {
                await this.updateProfile(username);
            } catch (error) {
                window.debugLog?.error('authManager', 'Profile update error:', error);
                this.app.showToast(error.message, 'error');
            }
        });
    }
    
    /**
     * Set up avatar selection grid
     * @param {HTMLElement} avatarGrid - The avatar grid element
     */
    setupAvatarSelection(avatarGrid) {
        if (!avatarGrid) return;
        
        // Clear existing content
        avatarGrid.innerHTML = '';
        
        // Populate with avatars using consistent avatar-option class
        this.avatars.forEach(avatar => {
            const avatarOption = document.createElement('div');
            avatarOption.className = `avatar-option ${avatar.id === this.selectedAvatarId ? 'selected' : ''}`;
            avatarOption.dataset.avatarId = avatar.id;
            avatarOption.style.backgroundColor = avatar.background;
            
            const icon = document.createElement('i');
            icon.className = `fas ${avatar.icon}`;
            icon.style.color = avatar.color;
            icon.style.fontSize = '1rem';
            
            avatarOption.appendChild(icon);
            avatarGrid.appendChild(avatarOption);
            
            // Add click listener
            avatarOption.addEventListener('click', () => {
                console.log('🎭 Avatar clicked:', avatar.id, avatar);
                
                // Remove selected class from all options
                avatarGrid.querySelectorAll('.avatar-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                avatarOption.classList.add('selected');
                
                // Update selected avatar
                this.selectedAvatarId = avatar.id;
                this.selectedAvatar = avatar;
                
                console.log('🎭 Avatar selection updated:', {
                    selectedAvatarId: this.selectedAvatarId,
                    selectedAvatar: this.selectedAvatar
                });
                
                this.log('🎨 Avatar selected:', { id: avatar.id, icon: avatar.icon });
            });
        });

    }
    
    /**
     * Set up logout button event listener
     */
    setupLogoutButton() {
        const logoutButtons = document.querySelectorAll('.logout-button');
        
        logoutButtons.forEach(button => {
            button.addEventListener('click', async () => {
                try {
                    await this.logout();
                } catch (error) {
                    window.debugLog?.error('authManager', 'Logout error:', error);
                    this.app.showToast(error.message, 'error');
                }
            });
        });
    }
    
    /**
     * Setup user dropdown functionality
     */
    setupUserDropdown() {
        // Add retry mechanism for DOM elements that might not be ready
        const maxRetries = 5;
        let retryCount = 0;
        
        const initDropdown = () => {
            const dropdownToggle = document.getElementById('user-dropdown-toggle');
            const dropdown = document.querySelector('.user-dropdown');
            const dropdownContent = document.getElementById('userDropdown');
            const profileButton = document.getElementById('profile-button');
            const settingsButton = document.getElementById('gotoSettings');
            const logoutButton = document.getElementById('btnLogout');
            
            console.log('🔧 Setting up user dropdown, attempt:', retryCount + 1);
            console.log('🔧 Elements found:', {
                dropdownToggle: !!dropdownToggle,
                dropdown: !!dropdown,
                dropdownContent: !!dropdownContent,
                profileButton: !!profileButton,
                settingsButton: !!settingsButton,
                logoutButton: !!logoutButton
            });
            
            if (!dropdownToggle || !dropdown) {
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log('🔧 Dropdown elements not ready, retrying in 100ms...');
                    setTimeout(initDropdown, 100);
                    return;
                } else {
                    console.error('🔧 Failed to find dropdown elements after', maxRetries, 'attempts');
                    return;
                }
            }
            
            // Remove any existing event listeners to prevent duplicates
            const newToggle = dropdownToggle.cloneNode(true);
            dropdownToggle.parentNode.replaceChild(newToggle, dropdownToggle);
            
            // Toggle dropdown on click with improved handling
            newToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 Dropdown toggle clicked');
                
                const isActive = dropdown.classList.contains('active');
                dropdown.classList.toggle('active');
                
                console.log('🔧 Dropdown state changed:', !isActive ? 'opened' : 'closed');
            });
            
            // Close dropdown when clicking outside with improved detection
            const outsideClickHandler = (e) => {
                if (!dropdown.contains(e.target) && !newToggle.contains(e.target)) {
                    if (dropdown.classList.contains('active')) {
                        dropdown.classList.remove('active');
                        console.log('🔧 Dropdown closed by outside click');
                    }
                }
            };
            
            // Remove existing outside click listeners
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = outsideClickHandler;
            document.addEventListener('click', this._outsideClickHandler);
            
            // Profile button handler - show user stats modal
            if (profileButton) {
                profileButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown?.classList.remove('active');
                    this.showUserStatsModal();
                });
            }
            
            // Settings button handler - redirect to settings page
            if (settingsButton) {
                settingsButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown?.classList.remove('active');
                    
                    // Determine the correct path to settings based on current location
                    const currentPath = window.location.pathname;
                    let settingsPath;
                    
                    if (currentPath.includes('/pages/')) {
                        // We're in a pages subdirectory, go up one level
                        settingsPath = './settings.html';
                    } else {
                        // We're in the root directory
                        settingsPath = './pages/settings.html';
                    }
                    
                    window.location.href = settingsPath;
                });
            }
            
            // Logout button handler
            if (logoutButton) {
                logoutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    dropdown?.classList.remove('active');
                    await this.logout();
                });
            }
            
            console.log('🔧 User dropdown setup completed successfully');
        };
        
        // Start initialization
        initDropdown();
    }
    
    /**
     * Update user avatar in the UI
     */
    updateUserAvatar() {
        console.log('🎭 updateUserAvatar() called');
        const userAvatars = document.querySelectorAll('.user-avatar');
        console.log('🎭 Found user avatar elements:', userAvatars.length);
        
        // Get avatar from user profile or use default
        let avatarPath;
        if (this.currentUser && this.currentUser.photoURL) {
            avatarPath = this.currentUser.photoURL;
            console.log('🎭 Using user photoURL:', avatarPath);
        } else {
            // Get avatar ID from user profile data (unified data manager)
            let avatarId = 1; // Default avatar ID
            
            if (this.app.dataManager && this.app.dataManager.currentUser && this.app.dataManager.currentUser.avatar) {
                const userAvatar = this.app.dataManager.currentUser.avatar;
                console.log('🎭 Raw avatar from user profile:', userAvatar);
                
                // Extract avatar ID from user profile
                if (userAvatar.id) {
                    avatarId = userAvatar.id;
                    console.log('🎭 Using avatar ID from user profile:', avatarId);
                } else {
                    console.log('🎭 Avatar from profile has no ID, using fallback');
                    avatarId = this.selectedAvatarId || 1;
                }
            } else {
                // Fallback to selected avatar or default
                avatarId = this.selectedAvatarId || 1;
                console.log('🎭 Using fallback avatar ID (no profile avatar):', avatarId);
            }
            
            // Use actual avatar image files from assets/avatars/ (absolute path from root)
            avatarPath = `/assets/avatars/avatar-${avatarId}.svg`;
            console.log('🎭 Final avatar path:', avatarPath);
        }
        
        userAvatars.forEach((el, index) => {
            console.log(`🎭 Updating avatar element ${index}:`, el);
            console.log(`🎭 Current src before update:`, el.src);
            
            // Use absolute URL to avoid any path resolution issues
            const absoluteAvatarPath = `${window.location.origin}${avatarPath}`;
            console.log(`🎭 Setting absolute avatar path:`, absoluteAvatarPath);
            
            el.src = absoluteAvatarPath;
            el.alt = this.currentUser?.displayName || 'User Avatar';
            
            // Add success handler
            el.onload = () => {
                console.log('✅ Avatar image loaded successfully:', absoluteAvatarPath);
            };
            
            // Add error handling for missing avatar files
            el.onerror = () => {
                console.warn('🎭 Avatar image failed to load, using fallback:', absoluteAvatarPath);
                const fallbackPath = `${window.location.origin}/assets/avatars/avatar-1.svg`;
                console.log('🎭 Trying fallback path:', fallbackPath);
                el.src = fallbackPath;
            };
            
            // Force reflow to ensure visual update
            el.style.display = 'none';
            el.offsetHeight; // Trigger reflow
            el.style.display = '';
            
            console.log(`🎭 Avatar element ${index} updated, new src:`, el.src);
        });
        
        console.log('🎭 updateUserAvatar() completed');
    }
    
    /**
     * Generate SVG avatar from avatar object
     */
    generateAvatarSVG(avatar) {
        // Map Font Awesome class names to Unicode characters
        const iconMap = {
            'fa-user': '\uf007',
            'fa-user-astronaut': '\uf4fb',
            'fa-user-ninja': '\uf504',
            'fa-user-graduate': '\uf501',
            'fa-user-tie': '\uf508',
            'fa-user-secret': '\uf21b',
            'fa-robot': '\uf544',
            'fa-cat': '\uf6be',
            'fa-dog': '\uf6d3',
            'fa-dragon': '\uf6d5',
            'fa-fish': '\uf578',
            'fa-frog': '\uf52e',
            'fa-hippo': '\uf6ed',
            'fa-horse': '\uf6f0',
            'fa-kiwi-bird': '\uf535'
        };
        
        const iconUnicode = iconMap[avatar.icon] || iconMap['fa-user'];
        
        return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="${avatar.background}"/>
            <text x="16" y="20" text-anchor="middle" fill="${avatar.color}" font-family="Font Awesome 6 Free" font-size="14" font-weight="900">${iconUnicode}</text>
        </svg>`;
    }
    
    /**
     * Show account settings modal
     */
    showAccountSettingsModal() {
        const modal = document.getElementById('account-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Setup password toggle functionality for account settings
            this.setupPasswordToggle('current-password');
            this.setupPasswordToggle('new-password');
            this.setupPasswordToggle('confirm-new-password');
        }
    }
    
    /**
     * Post-registration event handler
     */
    onPostRegistration() {
        window.debugLog?.info('authManager', 'Post-registration: User successfully registered');
        
        // Initialize user data in Supabase
        if (this.app.dataManager) {
            this.app.dataManager.initializeUserData();
        }
        
        // Track registration event
        this.trackUserEvent('user_registered', {
            timestamp: new Date().toISOString(),
            username: this.currentUser?.displayName
        });
    }
    
    /**
     * Post-login event handler
     */
    onPostLogin() {
        window.debugLog?.info('authManager', 'Post-login: User successfully logged in');
        
        // Update last login timestamp
        if (this.currentUser) {
            this.updateLastLogin();
        }
        
        // Load user data from Supabase
        if (this.app.dataManager) {
            this.app.dataManager.loadData();
        }
        
        // Track login event
        this.trackUserEvent('user_logged_in', {
            timestamp: new Date().toISOString(),
            username: this.currentUser?.displayName
        });
    }
    
    /**
     * Clear user cache and temporary data
     */
    clearUserCache() {
        // Clear any temporary user data
        this.selectedAvatarId = 1;
        this.userProfileData = null;
        
        // Clear minimal localStorage cache if used
        try {
            localStorage.removeItem('quizwhiz_user_cache');
            localStorage.removeItem('quizwhiz_last_login');
        } catch (error) {
            window.debugLog?.warn('authManager', 'Error clearing user cache:', error);
        }
    }
    
    /**
     * Update last login timestamp
     */
    async updateLastLogin() {
        if (!this.currentUser) return;
        
        try {
            await this.saveUserProfile(this.currentUser.uid, {
                lastLogin: new Date().toISOString()
            });
            
            // Cache login timestamp for offline use
            localStorage.setItem('quizwhiz_last_login', new Date().toISOString());
        } catch (error) {
            window.debugLog?.error('authManager', 'Error updating last login:', error);
        }
    }
    
    /**
     * Track user events for analytics
     */
    trackUserEvent(eventName, eventData) {
        try {
            // Log event for debugging
            window.debugLog?.info('authManager', `User Event: ${eventName}`, eventData);
            
            // Here you could integrate with analytics services
            // For now, we'll just store in Supabase
            if (this.currentUser && this.app.dataManager) {
                this.app.dataManager.saveUserEvent(this.currentUser.uid, eventName, eventData);
            }
        } catch (error) {
            window.debugLog?.warn('authManager', 'Error tracking user event:', error);
        }
    }
    
    /**
     * Set up auth button event listeners (login/register buttons in navbar)
     */
    setupAuthButtons(retryCount = 0) {
        // Get auth buttons
        const loginButton = document.getElementById('btnLogin');
        const registerButton = document.getElementById('btnRegister');
        
        // Force console log to ensure we can see this is being called
        console.log('🔧 AuthManager: setupAuthButtons() called - DIRECT CONSOLE LOG (retry:', retryCount, ')');
        console.log('🔧 AuthManager: Login button found:', !!loginButton, loginButton);
        console.log('🔧 AuthManager: Register button found:', !!registerButton, registerButton);
        
        // If buttons don't exist, retry after a short delay (max 10 retries)
        if ((!loginButton || !registerButton) && retryCount < 10) {
            console.log('🔧 AuthManager: Buttons not found, retrying in 100ms... (attempt', retryCount + 1, '/10)');
            setTimeout(() => this.setupAuthButtons(retryCount + 1), 100);
            return;
        } else if (!loginButton || !registerButton) {
            console.log('🔧 AuthManager: Max retries reached, buttons still not found');
            return;
        }
        
        if (this.debugMode) {
            window.debugLog?.info('authManager', '🔧 AuthManager: setupAuthButtons() called');
            window.debugLog?.info('authManager', '🔧 AuthManager: Setting up auth buttons');
            window.debugLog?.info('authManager', '🔧 AuthManager: Login button found:', !!loginButton);
            window.debugLog?.info('authManager', '🔧 AuthManager: Register button found:', !!registerButton);
        }
        
        if (loginButton) {
            // Remove existing listeners to prevent duplicates
            if (loginButton._authManagerListener) {
                loginButton.removeEventListener('click', loginButton._authManagerListener);
            }
            
            // Create new listener function
            const loginListener = async (e) => {
                e.preventDefault();
                console.log('🖱️ LOGIN BUTTON CLICKED! - DIRECT CONSOLE LOG');
                console.log('🔧 AuthManager available:', !!this);
                console.log('🔧 App available:', !!this.app);
                console.log('🔧 UIManager available:', !!(this.app && this.app.uiManager));
                if (this.debugMode) {
                    window.debugLog?.info('authManager', '🖱️ LOGIN BUTTON CLICKED!');
                    window.debugLog?.info('authManager', '🔧 AuthManager: Calling showLoginModal()');
                }
                this.debugModalState('before-show-login');
                try {
                    console.log('🔧 About to call showLoginModal()...');
                    await this.showLoginModal();
                    console.log('🔧 showLoginModal() call completed successfully');
                } catch (error) {
                    console.error('❌ Error calling showLoginModal():', error);
                    console.error('❌ Error stack:', error.stack);
                }
                // Check modal state after a brief delay
                setTimeout(() => {
                    this.debugModalState('after-show-login');
                }, 100);
            };
            
            // Store reference and add listener
            loginButton._authManagerListener = loginListener;
            loginButton.addEventListener('click', loginListener);
            
            if (this.debugMode) window.debugLog?.info('authManager', '🔧 AuthManager: Login button listener attached');
        } else {
            window.debugLog?.warn('authManager', '⚠️ AuthManager: Login button not found in DOM');
        }
        
        if (registerButton) {
            // Remove existing listeners to prevent duplicates
            if (registerButton._authManagerListener) {
                registerButton.removeEventListener('click', registerButton._authManagerListener);
            }
            
            // Create new listener function
            const registerListener = (e) => {
                e.preventDefault();
                console.log('🖱️ REGISTER BUTTON CLICKED! - DIRECT CONSOLE LOG');
                if (this.debugMode) {
                    window.debugLog?.info('authManager', '🖱️ REGISTER BUTTON CLICKED!');
                    window.debugLog?.info('authManager', '🔧 AuthManager: Calling showRegisterModal()');
                }
                this.debugModalState('before-show-register');
                this.showRegisterModal();
                // Check modal state after a brief delay
                setTimeout(() => {
                    this.debugModalState('after-show-register');
                }, 100);
            };
            
            // Store reference and add listener
            registerButton._authManagerListener = registerListener;
            registerButton.addEventListener('click', registerListener);
            
            if (this.debugMode) window.debugLog?.info('authManager', '🔧 AuthManager: Register button listener attached');
        } else {
            window.debugLog?.warn('authManager', '⚠️ AuthManager: Register button not found in DOM');
        }
        
        // If buttons not found, try again after a delay with multiple retries
        if (!loginButton || !registerButton) {
            window.debugLog?.info('authManager', '⏰ AuthManager: Auth buttons not found, retrying in 2 seconds...');
            setTimeout(() => {
                window.debugLog?.info('authManager', '🔄 AuthManager: Retrying setupAuthButtons...');
                this.setupAuthButtons();
            }, 2000);
        } else {
            this.log('✅ AuthManager: Both auth buttons found and event listeners attached');
        }
        
        // Also set up modal switching links
        const showRegisterLink = document.getElementById('show-register-link');
        const showLoginLink = document.getElementById('show-login-link');
        
        if (showRegisterLink) {
            if (this.debugMode) window.debugLog?.info('authManager', '🔧 AuthManager: Adding click listener to show-register-link');
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.debugMode) window.debugLog?.info('authManager', '🖱️ Show register link clicked');
                this.showRegisterModal();
            });
        }
        
        if (showLoginLink) {
            if (this.debugMode) window.debugLog?.info('authManager', '🔧 AuthManager: Adding click listener to show-login-link');
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.debugMode) window.debugLog?.info('authManager', '🖱️ Show login link clicked');
                this.showLoginModal();
            });
        }
    }
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(username, password) {
        try {
            window.debugLog?.info('authManager', '🔑 Starting login process for username:', username);
            
            // Validate inputs
            if (!username || !password) {
                window.debugLog?.error('authManager', '❌ Missing credentials');
                throw new Error('Username and password are required');
            }
            
            // Validate username format
            if (!this.validateUsername(username)) {
                window.debugLog?.error('authManager', '❌ Invalid username format');
                throw new Error('Invalid username format');
            }
            
            // Validate password format
            if (!this.validatePassword(password)) {
                window.debugLog?.error('authManager', '❌ Invalid password format');
                throw new Error('Password must be at least 6 characters');
            }
            
            this.log('✅ Credentials validated, attempting Supabase login');
            
            // Use Supabase Auth service for login
            if (this.supabaseAuth && this.supabaseAuth.signIn) {
                this.log('🔥 Using SupabaseAuthService.signIn');
                const result = await this.supabaseAuth.signIn(username, password);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } else {
                this.log('🔥 Using direct Supabase auth fallback');
                // Convert username to email format for Supabase
                const email = `${username}@quizwhiz.local`;
                // Use global supabase client
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                if (error) throw error;
            }
            
            this.log('✅ Supabase login successful');
            
            // Get current user and call handleAuthStateChange immediately
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                this.log('🔄 Calling handleAuthStateChange immediately after login');
                this.handleAuthStateChange(user);
            }
            
            // Close modal
            this.closeAuthModals();
            
            // Show success message with username
            const displayName = this.currentUser?.displayName || username;
            this.app.showToast(`Welcome back, ${displayName}!`, 'success');
            
            // Force UI update in case auth state change doesn't trigger immediately
            setTimeout(() => {
                this.log('🔄 Force updating auth UI after login');
                this.updateAuthUI();
            }, 100);
            
            // Additional fallback with longer delay
            setTimeout(() => {
                this.log('🔄 Secondary force update auth UI after login');
                this.forceUpdateAuthUI();
            }, 500);
            
            this.log('🎉 Login process completed successfully');
        } catch (error) {
            window.debugLog?.error('authManager', '❌ Login failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Register new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} username - User display name
     */
    async register(username, password) {
        try {
            this.log('📝 Starting registration process for username:', username);
            
            // Validate inputs
            if (!username || !password) {
                window.debugLog?.error('authManager', '❌ Missing registration fields');
                throw new Error('Username and password are required');
            }
            
            if (!this.validateUsername(username)) {
                window.debugLog?.error('authManager', '❌ Invalid username format');
                throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
            }
            
            if (!this.validatePassword(password)) {
                window.debugLog?.error('authManager', '❌ Invalid password format');
                throw new Error('Password must be at least 6 characters');
            }
            
            this.log('✅ Registration data validated');
            
            // Get selected avatar data
            const selectedAvatar = this.avatars.find(a => a.id === this.selectedAvatarId) || this.avatars[0];
            console.log('🎭 Registration - Selected Avatar:', {
                selectedAvatarId: this.selectedAvatarId,
                selectedAvatar: selectedAvatar
            });
            
            // Use Supabase Auth service for registration
            if (this.supabaseAuth && this.supabaseAuth.signUp) {
                this.log('🔥 Using SupabaseAuthService.signUp');
                const result = await this.supabaseAuth.signUp(username, password, selectedAvatar);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } else {
                this.log('🔥 Using direct Supabase auth fallback');
                // Convert username to email format for Supabase
                const email = `${username}@quizwhiz.local`;
                
                // Use global supabase client
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            username: username,
                            display_name: username
                        }
                    }
                });
                
                if (error) throw error;
                const user = data.user;
                
                this.log('✅ Supabase user created, creating user profile');
                
                // Create user profile with selected avatar
                if (this.supabaseAuth && this.supabaseAuth.createUserProfile) {
                    await this.supabaseAuth.createUserProfile(user, username, selectedAvatar);
                } else {
                    // Fallback: Save additional user data to Supabase
                    await this.saveUserProfile(user.id, {
                        username: username,
                        email: email,
                        avatarId: this.selectedAvatarId,
                        avatar: selectedAvatar,
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    });
                }
                
                this.log('✅ User profile saved to Supabase');
            }
            
            this.log('✅ Supabase registration successful');
            
            // Automatically sign in the user after successful registration
            this.log('🔑 Automatically signing in user after registration');
            const signInResult = await this.supabaseAuth.signIn(username, password);
            if (!signInResult.success) {
                this.log('⚠️ Auto sign-in failed, but registration was successful:', signInResult.error);
                // Still proceed with registration success, user can manually sign in
            } else {
                this.log('✅ Auto sign-in successful after registration');
                // Get current user and call handleAuthStateChange
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    this.log('🔄 Calling handleAuthStateChange after auto sign-in');
                    this.handleAuthStateChange(user);
                    
                    // Load user profile data to populate userProfileData
                    this.log('🔄 Loading user profile after registration');
                    await this.getUserProfile();
                    
                    // Ensure UI is updated after profile data is loaded
                    this.log('🔄 Updating auth UI after profile data loaded');
                    this.updateAuthUI();
                }
            }
            
            // Close modal
            this.closeAuthModals();
            
            // Show success message
            this.app.showToast('Registration successful! Welcome to QuizWhiz!', 'success');
            
            // Force UI update in case auth state change doesn't trigger immediately
            // Only do this if we didn't already update UI above
            if (!user) {
                setTimeout(() => {
                    this.log('🔄 Force updating auth UI after registration (fallback)');
                    this.updateAuthUI();
                }, 100);
                
                // Additional fallback with longer delay
                setTimeout(() => {
                    this.log('🔄 Secondary force update auth UI after registration (fallback)');
                    this.forceUpdateAuthUI();
                }, 500);
            }
            
            this.log('🎉 Registration process completed successfully');
        } catch (error) {
            window.debugLog?.error('authManager', '❌ Registration failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Update user profile
     * @param {string} username - New username
     */
    async updateProfile(username) {
        try {
            if (!this.currentUser) {
                throw new Error('No user is currently logged in');
            }
            
            // Validate username
            if (!this.validateUsername(username)) {
                throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
            }
            
            // Update Supabase Auth profile metadata
            const { error } = await window.supabaseClient.auth.updateUser({
                data: {
                    username: username,
                    display_name: username
                }
            });
            
            if (error) throw error;
            
            // Update Supabase profile
            await this.saveUserProfile(this.currentUser.id, {
                username: username,
                avatar: this.selectedAvatar,
                updatedAt: new Date().toISOString()
            });
            
            // Close modal
            this.closeAuthModals();
            
            // Update UI
            this.updateAuthUI();
            
            // Show success message
            this.app.showToast('Profile updated successfully', 'success');
        } catch (error) {
            window.debugLog?.error('authManager', 'Profile update error:', error);
            throw error;
        }
    }
    
    /**
     * Logout current user
     */
    async logout() {
        await window.supabaseClient.auth.signOut();
        this.handleAuthStateChange(null);
    }
    
    /**
     * Save user profile data to Supabase
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile data to save
     */
    async saveUserProfile(userId, profileData) {
        try {
            if (!userId) {
                throw new Error('No user ID provided');
            }
            
            if (!profileData) {
                throw new Error('No profile data provided');
            }
            
            // Use Supabase Auth service if available
            if (this.supabaseAuth && this.supabaseAuth.saveUserProfile) {
                await this.supabaseAuth.saveUserProfile(profileData);
                window.debugLog?.info('authManager', 'User profile saved via Supabase Auth service');
                return;
            }
            
            // Fallback to direct Supabase access
            const supabase = window.supabaseClient;
            
            // Sanitize data with null checks
            const sanitizedData = {};
            for (const key in profileData) {
                if (profileData[key] !== null && profileData[key] !== undefined) {
                    if (typeof profileData[key] === 'string') {
                        sanitizedData[key] = this.sanitizeHTML(profileData[key]);
                    } else {
                        sanitizedData[key] = profileData[key];
                    }
                }
            }
            
            // Ensure username has a default value with multiple fallbacks
            if (!sanitizedData.username || sanitizedData.username.trim() === '') {
                sanitizedData.username = profileData.displayName || 
                                        profileData.user_metadata?.display_name || 
                                        profileData.user_metadata?.username || 
                                        'User';
            }
            
            this.log('🔧 Saving user profile with sanitized data:', sanitizedData);
            
            // Add timestamp
            sanitizedData.updated_at = new Date().toISOString();
            sanitizedData.user_id = userId;
            
            // Upsert user profile data
            const { error } = await supabase
                .from('users')
                .update(sanitizedData)
                .eq('id', userId);
            
            if (error) throw error;
            
            // Cache the saved profile data
            this.userProfileData = sanitizedData;
            this.log('✅ User profile saved successfully and cached');
            window.debugLog?.info('authManager', 'User profile saved successfully');
        } catch (error) {
            window.debugLog?.error('authManager', 'Error saving user profile:', error);
            throw error;
        }
    }
    
    /**
     * Get user profile data from Supabase
     */
    async getUserProfile() {
        if (!this.currentUser) {
            window.debugLog?.warn('authManager', 'No current user to get profile for');
            return null;
        }
        
        try {
            // Use Supabase Auth service if available
            if (this.supabaseAuth && this.supabaseAuth.getUserProfile) {
                const userData = await this.supabaseAuth.getUserProfile(this.currentUser.id);
                if (userData) {
                    // Update local user data
                if (userData.avatarId) {
                    this.selectedAvatarId = userData.avatarId;
                }
                if (userData.avatar) {
                    this.selectedAvatar = userData.avatar;
                }
                // Cache the profile data
                this.userProfileData = userData;
                return userData;
                }
            }
            
            // Fallback to direct Supabase access
            const supabase = window.supabaseClient;
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
                throw error;
            }
            
            if (userData) {
                window.debugLog?.info('authManager', 'User profile loaded:', userData);
                
                // Update local user data
                if (userData.avatarId) {
                    this.selectedAvatarId = userData.avatarId;
                }
                if (userData.avatar) {
                    this.selectedAvatar = userData.avatar;
                }
                // Cache the profile data
                this.userProfileData = userData;
                
                return userData;
            } else {
                window.debugLog?.info('authManager', 'No user profile found, creating default profile');
                // Create default profile
                const selectedAvatar = this.avatars.find(a => a.id === this.selectedAvatarId) || this.avatars[0];
                const defaultProfile = {
                    username: this.currentUser.user_metadata?.display_name || this.currentUser.user_metadata?.username || 'User',
                    email: this.currentUser.email,
                    avatarId: this.selectedAvatarId,
                    avatar: selectedAvatar,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                await this.saveUserProfile(this.currentUser.id, defaultProfile);
                // Cache the profile data
                this.userProfileData = defaultProfile;
                return defaultProfile;
            }
        } catch (error) {
            window.debugLog?.error('authManager', 'Error getting user profile:', error);
            return null;
        }
    }
    
    /**
     * Close all auth modals
     */
    closeAuthModals() {
        if (this.debugMode) window.debugLog?.info('authManager', '🔒 closeAuthModals() called');
        
        // Check if UIManager is available
        if (this.app && this.app.uiManager) {
            if (this.debugMode) window.debugLog?.info('authManager', '🔒 Using UIManager.closeModal() for auth modals');
            this.app.uiManager.closeModal('login-modal');
            this.app.uiManager.closeModal('register-modal');
        } else {
            if (this.debugMode) window.debugLog?.info('authManager', '🔒 Falling back to direct modal manipulation');
            const loginModal = document.getElementById('login-modal');
            const registerModal = document.getElementById('register-modal');
            
            if (loginModal) {
                loginModal.classList.remove('show');
            }
            if (registerModal) {
                registerModal.classList.remove('show');
            }
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
        }
    }
    
    /**
     * Debug modal state for troubleshooting
     */
    debugModalState(context) {
        if (!this.debugMode) return;
        
        window.debugLog?.info('authManager', `🔍 DEBUG MODAL STATE [${context}]:`);
        
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        
        window.debugLog?.info('authManager', '🔍 Login modal element:', loginModal);
        window.debugLog?.info('authManager', '🔍 Register modal element:', registerModal);
        
        if (loginModal) {
            window.debugLog?.info('authManager', '🔍 Login modal classes:', loginModal.className);
            window.debugLog?.info('authManager', '🔍 Login modal display:', getComputedStyle(loginModal).display);
            window.debugLog?.info('authManager', '🔍 Login modal visibility:', getComputedStyle(loginModal).visibility);
            window.debugLog?.info('authManager', '🔍 Login modal has show class:', loginModal.classList.contains('show'));
        } else {
            window.debugLog?.error('authManager', '❌ Login modal not found in DOM!');
        }
        
        if (registerModal) {
            window.debugLog?.info('authManager', '🔍 Register modal classes:', registerModal.className);
            window.debugLog?.info('authManager', '🔍 Register modal display:', getComputedStyle(registerModal).display);
            window.debugLog?.info('authManager', '🔍 Register modal visibility:', getComputedStyle(registerModal).visibility);
            window.debugLog?.info('authManager', '🔍 Register modal has show class:', registerModal.classList.contains('show'));
        } else {
            window.debugLog?.error('authManager', '❌ Register modal not found in DOM!');
        }
        
        // Check all modals in DOM
        const allModals = document.querySelectorAll('[id*="modal"]');
        window.debugLog?.info('authManager', '🔍 All modal elements in DOM:', allModals.length);
        allModals.forEach((modal, index) => {
            window.debugLog?.info('authManager', `🔍 Modal ${index + 1}: ID=${modal.id}, classes=${modal.className}`);
        });
    }
    
    /**
     * Set up close modal event listeners (following the same pattern as other modals)
     */
    setupCloseModalEvents() {
        if (this.debugMode) window.debugLog?.info('authManager', '🔧 AuthManager: Setting up close modal events');
        
        // Set up close button event listeners for auth modals
        const closeButtons = document.querySelectorAll('.close-modal[data-modal="login-modal"], .close-modal[data-modal="register-modal"]');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = button.getAttribute('data-modal');
                if (this.debugMode) window.debugLog?.info('authManager', `🔒 Close button clicked for: ${modalId}`);
                
                if (this.app && this.app.uiManager) {
                    this.app.uiManager.closeModal(modalId);
                } else {
                    // Fallback
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.classList.remove('show');
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        });
        
        window.debugLog?.info('authManager', `🔧 AuthManager: Set up ${closeButtons.length} close button listeners`);
    }
    
    /**
     * Show login modal (following UserManager pattern)
     */
    async showLoginModal() {
        console.log('🔧 showLoginModal() called - DIRECT CONSOLE LOG');
        if (this.debugMode) window.debugLog?.info('authManager', '📱 showLoginModal() called');
        
        // Only load modals if they don't exist
        if (!document.getElementById('login-modal')) {
            console.log('🔧 Loading auth modals...');
            await this.loadAuthModals();
        }
        console.log('🔧 Auth modals loaded, checking for login-modal in DOM...');
        
        const loginModal = document.getElementById('login-modal');
        console.log('🔧 Login modal found in DOM:', !!loginModal);
        if (loginModal) {
            console.log('🔧 Login modal classes before opening:', loginModal.className);
        }
        
        // Use UIManager to open modal (consistent with other components)
        if (this.app && this.app.uiManager) {
            console.log('🔧 UIManager available, calling openModal...');
            if (this.debugMode) window.debugLog?.info('authManager', '📱 Using UIManager.openModal() for login modal');
            this.app.uiManager.openModal('login-modal');
            
            // Verify modal opened
            setTimeout(() => {
                const loginModal = document.getElementById('login-modal');
                console.log('🔧 After openModal - Login modal found:', !!loginModal);
                if (loginModal) {
                    console.log('🔧 Login modal classes after opening:', loginModal.className);
                    console.log('🔧 Login modal has show class:', loginModal.classList.contains('show'));
                    console.log('🔧 Login modal computed display:', getComputedStyle(loginModal).display);
                }
                if (loginModal && loginModal.classList.contains('show')) {
                    console.log('✅ LOGIN MODAL OPENED SUCCESSFULLY via UIManager!');
                    this.log('✅ LOGIN MODAL OPENED SUCCESSFULLY via UIManager!');
                } else {
                    console.log('❌ LOGIN MODAL FAILED TO OPEN via UIManager');
                    window.debugLog?.error('authManager', '❌ LOGIN MODAL FAILED TO OPEN via UIManager');
                }
            }, 100);
        } else {
            console.log('❌ UIManager not available - cannot open login modal');
            window.debugLog?.error('authManager', '❌ UIManager not available - cannot open login modal');
        }
    }
    
    /**
     * Show registration modal (following UserManager pattern)
     */
    async showRegisterModal() {
        if (this.debugMode) window.debugLog?.info('authManager', '📱 showRegisterModal() called');
        
        // Only load modals if they don't exist
        if (!document.getElementById('register-modal')) {
            await this.loadAuthModals();
        }
        
        // Use UIManager to open modal (consistent with other components)
        if (this.app && this.app.uiManager) {
            if (this.debugMode) window.debugLog?.info('authManager', '📱 Using UIManager.openModal() for register modal');
            this.app.uiManager.openModal('register-modal');
            
            // Verify modal opened
            setTimeout(() => {
                const registerModal = document.getElementById('register-modal');
                if (registerModal && registerModal.classList.contains('show')) {
                    this.log('✅ REGISTER MODAL OPENED SUCCESSFULLY via UIManager!');
                } else {
                    window.debugLog?.error('authManager', '❌ REGISTER MODAL FAILED TO OPEN via UIManager');
                }
            }, 100);
        } else {
            window.debugLog?.error('authManager', '❌ UIManager not available - cannot open register modal');
        }
    }
    
    /**
     * Show profile modal
     */
    showProfileModal() {
        this.closeAuthModals();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            // Fill in current values
            const usernameInput = document.getElementById('profile-username');
            if (usernameInput && this.currentUser) {
                usernameInput.value = this.currentUser.displayName || '';
            }
            
            // Update avatar selection
            const profileAvatarGrid = document.getElementById('profile-avatar-selection');
            if (profileAvatarGrid) {
                const avatarItems = profileAvatarGrid.querySelectorAll('.avatar-item');
                avatarItems.forEach(item => {
                    item.classList.remove('selected');
                    if (item.dataset.avatar === this.selectedAvatar) {
                        item.classList.add('selected');
                    }
                });
            }
            
            profileModal.classList.add('show');
        }
    }

    /**
     * Show user stats modal with profile summary
     */
    async showUserStatsModal() {
        // Prevent multiple simultaneous calls
        if (this.isLoadingStatsModal) {
            console.log('🎭 Stats modal already loading, skipping duplicate call');
            return;
        }
        
        this.isLoadingStatsModal = true;
        
        try {
            this.closeAuthModals();
            
            // Only load modals if they don't exist
            if (!document.getElementById('user-stats-modal')) {
                await this.loadAuthModals();
            }
            
            const userStatsModal = document.getElementById('user-stats-modal');
        if (userStatsModal) {
            // Update user info
            const userAvatar = document.getElementById('stats-user-avatar');
            const userName = document.getElementById('stats-user-name');
            const userEmail = document.getElementById('stats-user-email');
            const joinDate = document.getElementById('stats-join-date');
            
            if (this.currentUser) {
                // Set avatar - clear any existing content first
                if (userAvatar) {
                    console.log('🎭 Setting avatar in stats modal');
                    
                    // Clear any existing content to prevent conflicts
                    userAvatar.innerHTML = '';
                    
                    const avatarPath = this.getUserAvatar();
                    console.log('🎭 Avatar path for stats modal:', avatarPath);
                    
                    // Always use img tag for avatar files
                    if (typeof avatarPath === 'string' && avatarPath.length > 0) {
                        const imgElement = document.createElement('img');
                        imgElement.src = avatarPath;
                        imgElement.alt = 'User Avatar';
                        imgElement.className = 'avatar-img';
                        
                        // Add error handling
                        imgElement.onerror = () => {
                            console.warn('🎭 Avatar image failed to load, using placeholder');
                            userAvatar.innerHTML = '<div class="placeholder-avatar">👤</div>';
                        };
                        
                        imgElement.onload = () => {
                            console.log('✅ Avatar image loaded successfully in stats modal');
                        };
                        
                        userAvatar.appendChild(imgElement);
                    } else {
                        // Fallback for any other case
                        console.log('🎭 Using placeholder avatar in stats modal');
                        userAvatar.innerHTML = '<div class="placeholder-avatar">👤</div>';
                    }
                }
                
                // Set user details
                if (userName) userName.textContent = this.getDisplayName();
                if (userEmail) userEmail.textContent = this.currentUser.email || 'No email';
                if (joinDate && this.currentUser.created_at) {
                    const date = new Date(this.currentUser.created_at);
                    joinDate.textContent = date.toLocaleDateString();
                }
                
                // Get user profile data for stats
                try {
                    const userProfile = await this.getUserProfile();
                    if (userProfile) {
                        const totalQuizzes = document.getElementById('stats-total-quizzes');
                        const averageScore = document.getElementById('stats-average-score');
                        const bestScore = document.getElementById('stats-best-score');
                        const lastActivity = document.getElementById('stats-last-activity');
                        
                        if (totalQuizzes) totalQuizzes.textContent = userProfile.totalQuizzes || '0';
                        if (averageScore) averageScore.textContent = userProfile.averageScore ? `${userProfile.averageScore}%` : 'N/A';
                        if (bestScore) bestScore.textContent = userProfile.bestScore ? `${userProfile.bestScore}%` : 'N/A';
                        if (lastActivity && userProfile.lastActivity) {
                            const date = new Date(userProfile.lastActivity.toDate());
                            lastActivity.textContent = date.toLocaleDateString();
                        }
                    }
                } catch (error) {
                    console.log('Could not load user stats:', error);
                }
            } else {
                // User not logged in - show placeholder content
                if (userAvatar) userAvatar.innerHTML = '<div class="placeholder-avatar">👤</div>';
                if (userName) userName.textContent = 'Not logged in';
                if (userEmail) userEmail.textContent = 'Please log in to view your profile';
                if (joinDate) joinDate.textContent = 'N/A';
                
                // Clear stats
                const totalQuizzes = document.getElementById('stats-total-quizzes');
                const averageScore = document.getElementById('stats-average-score');
                const bestScore = document.getElementById('stats-best-score');
                const lastActivity = document.getElementById('stats-last-activity');
                
                if (totalQuizzes) totalQuizzes.textContent = '0';
                if (averageScore) averageScore.textContent = 'N/A';
                if (bestScore) bestScore.textContent = 'N/A';
                if (lastActivity) lastActivity.textContent = 'N/A';
            }
            
            userStatsModal.classList.add('show');
        }
        } catch (error) {
            console.error('🎭 Error loading stats modal:', error);
            this.app.uiManager.showToast('Error loading user stats', 'error');
        } finally {
            // Always reset the loading flag
            this.isLoadingStatsModal = false;
        }
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - True if authenticated, false otherwise
     */
    isUserAuthenticated() {
        return this.isAuthenticated && this.currentUser !== null;
    }
    
    /**
     * Get current user ID
     * @returns {string|null} - User ID or null if not authenticated
     */
    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
    
    /**
     * Get current user display name
     * @returns {string} - User display name or 'Guest' if not authenticated
     */
    getDisplayName() {
        // First try Supabase Auth user_metadata displayName
        if (this.currentUser && this.currentUser.user_metadata && this.currentUser.user_metadata.displayName) {
            return this.currentUser.user_metadata.displayName;
        }
        // Then try cached profile data username
        if (this.userProfileData && this.userProfileData.username) {
            return this.userProfileData.username;
        }
        // Default fallback
        return 'Guest';
    }
    
    /**
     * Get current user email
     * @returns {string|null} - User email or null if not authenticated
     */
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }
    
    /**
     * Get current user avatar
     * @returns {string} - Avatar file path
     */
    getUserAvatar() {
        // Get avatar ID from user profile data (unified data manager)
        let avatarId = 1; // Default avatar ID
        
        if (this.app.dataManager && this.app.dataManager.currentUser && this.app.dataManager.currentUser.avatar) {
            const userAvatar = this.app.dataManager.currentUser.avatar;
            
            // Extract avatar ID from user profile
            if (userAvatar.id) {
                avatarId = userAvatar.id;
            } else {
                avatarId = this.selectedAvatarId || 1;
            }
        } else {
            // Fallback to selected avatar or default
            avatarId = this.selectedAvatarId || 1;
        }
        
        // Return actual avatar image file path from assets/avatars/ (absolute path)
        return `/assets/avatars/avatar-${avatarId}.svg`;
    }

    /**
     * Show confirmation dialog for account deletion
     */
    confirmDeleteAccount() {
        console.log('confirmDeleteAccount method called');
        this.log('🗑️ Showing delete account confirmation dialog');
        
        // Show the delete account modal using UIManager for proper centering
        const modal = document.getElementById('delete-account-modal');
        console.log('Delete account modal found:', !!modal);
        if (modal) {
            // Use UIManager to properly center the modal
            if (this.app && this.app.uiManager) {
                this.app.uiManager.openModal('delete-account-modal');
            } else {
                // Fallback: add show class manually
                modal.classList.add('show');
                document.body.classList.add('modal-open');
            }
            
            // Reset modal to initial state
            this.resetDeleteAccountModal();
            
            // Setup event listeners for this modal session
            this.setupDeleteAccountModalEvents();
        } else {
            this.log('❌ Delete account modal not found');
            this.app.uiManager.showToast('Error: Delete account dialog not available', 'error');
        }
    }

    /**
     * Reset delete account modal to initial state
     */
    resetDeleteAccountModal() {
        // Clear input
        const confirmInput = document.getElementById('delete-confirmation-input');
        if (confirmInput) {
            confirmInput.value = '';
        }
        
        // Show initial warning section
        const warningSection = document.getElementById('delete-warning-section');
        if (warningSection) {
            warningSection.style.display = 'block';
        }
        
        // Show the bottom modal actions
        const modalActions = document.querySelector('#delete-account-modal .modal-body > .modal-actions');
        if (modalActions) {
            modalActions.style.display = 'flex';
        }
        
        // Hide final confirmation section
        const finalConfirmSection = document.getElementById('final-confirmation-section');
        if (finalConfirmSection) {
            finalConfirmSection.style.display = 'none';
        }
        
        // Reset button state
        const deleteBtn = document.getElementById('confirm-delete-account-btn');
        const btnText = document.getElementById('delete-btn-text');
        if (deleteBtn && btnText) {
            deleteBtn.disabled = true;
            btnText.textContent = 'Delete My Account';
            deleteBtn.onclick = () => this.showFinalConfirmation();
        }
    }

    /**
     * Setup event listeners for delete account modal
     */
    setupDeleteAccountModalEvents() {
        // Cancel button
        const cancelBtn = document.getElementById('cancel-delete-account');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.closeDeleteAccountModal();
            };
        }

        // Close button (X)
        const closeBtn = document.querySelector('#delete-account-modal .close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.closeDeleteAccountModal();
            };
        }

        // Confirmation input for typing "delete"
        const confirmInput = document.getElementById('delete-confirmation-input');
        if (confirmInput) {
            confirmInput.oninput = () => {
                this.handleDeleteConfirmInput();
            };
        }

        // Main confirm delete button
        const confirmBtn = document.getElementById('confirm-delete-account-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.showFinalConfirmation();
            };
        }

        // Final Yes/No buttons
        const yesBtn = document.getElementById('final-delete-yes');
        const noBtn = document.getElementById('final-delete-no');
        
        if (yesBtn) {
            yesBtn.onclick = () => {
                this.deleteUserAccount();
            };
        }
        
        if (noBtn) {
            noBtn.onclick = () => {
                // Go back to initial state instead of closing
                this.resetDeleteAccountModal();
            };
        }
    }

    /**
     * Handle input in delete confirmation field
     */
    handleDeleteConfirmInput() {
        const confirmInput = document.getElementById('delete-confirmation-input');
        const confirmBtn = document.getElementById('confirm-delete-account-btn');
        
        if (confirmInput && confirmBtn) {
            const inputValue = confirmInput.value.toLowerCase().trim();
            confirmBtn.disabled = inputValue !== 'delete';
            
            // Update button text based on input
            const btnText = document.getElementById('delete-btn-text');
            if (btnText) {
                if (inputValue === 'delete') {
                    btnText.textContent = 'Delete My Account';
                } else {
                    btnText.textContent = 'Type "delete" to continue';
                }
            }
        }
    }

    /**
     * Show final yes/no confirmation
     */
    showFinalConfirmation() {
        console.log('showFinalConfirmation called');
        
        // Hide the warning section
        const warningSection = document.getElementById('delete-warning-section');
        if (warningSection) {
            warningSection.style.display = 'none';
        }
        
        // Hide the bottom modal actions to prevent button conflicts
        const modalActions = document.querySelector('#delete-account-modal .modal-body > .modal-actions');
        if (modalActions) {
            modalActions.style.display = 'none';
        }
        
        // Show the final confirmation section
        const finalConfirmSection = document.getElementById('final-confirmation-section');
        if (finalConfirmSection) {
            finalConfirmSection.style.display = 'block';
            console.log('Final confirmation section shown');
        } else {
            console.error('Final confirmation section not found');
        }
    }

    /**
     * Close delete account modal
     */
    closeDeleteAccountModal() {
        // Use UIManager to properly close the modal
        if (this.app && this.app.uiManager) {
            this.app.uiManager.closeModal('delete-account-modal');
        } else {
            // Fallback: remove show class manually
            const modal = document.getElementById('delete-account-modal');
            if (modal) {
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        }
    }

    /**
     * Delete user account from Supabase
     */
    async deleteUserAccount() {
        this.log('🗑️ Starting account deletion process');
        
        try {
            // Show loading state
            this.app.uiManager.showToast('Deleting account...', 'info');
            
            // First, delete all user data from the database
            if (this.app.dataManager && this.app.dataManager.supabaseData) {
                await this.app.dataManager.supabaseData.deleteAllUserData();
                this.log('✅ User data deleted from database');
            }
            
            // Delete user account from Supabase Auth using RPC function
            const { error } = await window.supabaseClient.rpc('delete_user');
            
            if (error) {
                throw error;
            }
            
            this.log('✅ Account deleted successfully');
            
            // Close modal
            this.closeDeleteAccountModal();
            
            // Show success message
            this.app.uiManager.showToast('Account deleted successfully. You will be redirected to the home page.', 'success');
            
            // Clear local data
            if (this.app.dataManager) {
                this.app.dataManager.clearAllData(false); // Don't show confirmation
            }
            
            // Sign out
            await this.logout();
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = window.location.origin;
            }, 3000);
            
        } catch (error) {
            this.log('❌ Error deleting account:', error);
            
            // Close modal
            this.closeDeleteAccountModal();
            
            // Show error message with more specific information
            let errorMessage = 'Failed to delete account. ';
            
            if (error.message) {
                if (error.message.includes('JWT')) {
                    errorMessage += 'Please try logging out and back in, then try again.';
                } else if (error.message.includes('network')) {
                    errorMessage += 'Please check your internet connection and try again.';
                } else {
                    errorMessage += error.message;
                }
            } else {
                errorMessage += 'Please try again later or contact support if the problem persists.';
            }
            
            this.app.uiManager.showToast(errorMessage, 'error');
        }
    }
    
    /**
     * Validate username format
     * @param {string} username - The username to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    validateUsername(username) {
        // Username must be 3-20 characters and contain only letters, numbers, and underscores
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }
    
    /**
     * Validate password format
     * @param {string} password - The password to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    validatePassword(password) {
        // Password must be at least 6 characters
        return password && password.length >= 6;
    }
    
    /**
     * Sanitize HTML to prevent XSS attacks
     */
    sanitizeHTML(text) {
        const element = document.createElement('div');
        element.textContent = text;
        return element.innerHTML;
    }
    
    /**
     * Get the auth ready promise
     */
    static getAuthReady() {
        return authReady;
    }
    
    /**
     * Setup password toggle functionality for a password input field
     * @param {string} passwordInputId - The ID of the password input field
     */
    setupPasswordToggle(passwordInputId) {
        console.log(`🔧 Setting up password toggle for: ${passwordInputId}`);
        
        const passwordInput = document.getElementById(passwordInputId);
        if (!passwordInput) {
            console.log(`❌ Password input with ID '${passwordInputId}' not found`);
            console.log('Available password inputs:', document.querySelectorAll('input[type="password"]'));
            return;
        }
        console.log(`✅ Found password input: ${passwordInputId}`);
        
        // Find the toggle button for this password input
        const toggleButton = document.querySelector(`[data-target="${passwordInputId}"]`);
        if (!toggleButton) {
            console.log(`❌ Toggle button for password input '${passwordInputId}' not found`);
            console.log('Available toggle buttons:', document.querySelectorAll('.toggle-password'));
            return;
        }
        console.log(`✅ Found toggle button for: ${passwordInputId}`);
        
        // Remove any existing event listeners to prevent duplicates
        const newToggleButton = toggleButton.cloneNode(true);
        toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
        
        // Add click event listener to toggle button
        newToggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`🔧 Password toggle clicked for: ${passwordInputId}`);
            
            // Toggle input type between password and text
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            console.log(`🔧 Changed input type to: ${passwordInput.type}`);
            
            // Update eye icon
            const eyeIcon = newToggleButton.querySelector('i');
            if (eyeIcon) {
                if (isPassword) {
                    // Show password - change to eye-slash
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                    console.log('🔧 Changed icon to eye-slash (password visible)');
                } else {
                    // Hide password - change to eye
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                    console.log('🔧 Changed icon to eye (password hidden)');
                }
            } else {
                console.log('❌ Eye icon not found in toggle button');
            }
        });
        
        console.log(`✅ Password toggle setup completed for '${passwordInputId}'`);
    }
    
    // Test function to manually trigger login form submission
    testLoginFormSubmission() {
        console.log('🧪 Testing login form submission...');
        const loginForm = document.getElementById('login-form');
        console.log('🧪 Login form found:', !!loginForm);
        if (loginForm) {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            console.log('🧪 Dispatching submit event...');
            loginForm.dispatchEvent(event);
        }
    }
    
    // Test function to manually test password toggle functionality
    testPasswordToggle() {
        console.log('🧪 Testing password toggle functionality...');
        
        // Test all password fields
        const passwordFields = ['login-password', 'register-password', 'register-confirm-password'];
        
        passwordFields.forEach(fieldId => {
            console.log(`🧪 Testing ${fieldId}:`);
            const passwordInput = document.getElementById(fieldId);
            const toggleButton = document.querySelector(`[data-target="${fieldId}"]`);
            
            console.log(`  - Password input found: ${!!passwordInput}`);
            console.log(`  - Toggle button found: ${!!toggleButton}`);
            
            if (passwordInput && toggleButton) {
                console.log(`  - Current input type: ${passwordInput.type}`);
                const eyeIcon = toggleButton.querySelector('i');
                if (eyeIcon) {
                    console.log(`  - Eye icon classes: ${eyeIcon.className}`);
                } else {
                    console.log('  - Eye icon not found');
                }
            }
        });
    }
}

// Make AuthManager globally available
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
    
    // Global test function for debugging
    window.testLoginForm = function() {
        console.log('🧪 Global test function called');
        if (window.app && window.app.authManager) {
            window.app.authManager.testLoginFormSubmission();
        } else {
            console.log('❌ AuthManager not found on window.app');
        }
    };
    
    // Global test function for password toggle
    window.testPasswordToggle = function() {
        console.log('🧪 Global password toggle test function called');
        if (window.app && window.app.authManager) {
            window.app.authManager.testPasswordToggle();
        } else {
            console.log('❌ AuthManager not found on window.app');
        }
    };
    
    // Global function to manually trigger password toggle setup
    window.setupPasswordToggles = function() {
        console.log('🧪 Manually setting up password toggles...');
        if (window.app && window.app.authManager) {
            const passwordFields = ['login-password', 'register-password', 'register-confirm-password'];
            passwordFields.forEach(fieldId => {
                window.app.authManager.setupPasswordToggle(fieldId);
            });
        } else {
            console.log('❌ AuthManager not found on window.app');
        }
    };
}

// No module exports, only use window object