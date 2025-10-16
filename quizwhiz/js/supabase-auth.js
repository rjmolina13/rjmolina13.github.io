// Supabase Authentication Service
// This service handles all authentication operations for QuizWhiz

class SupabaseAuthService {
  constructor() {
    // Wait for supabase client to be available
    if (typeof window.supabaseClient === 'undefined') {
      throw new Error('Supabase client not initialized')
    }
    
    this.supabase = window.supabaseClient
    this.currentUser = null
    this.authStateListeners = []
    
    // Initialize auth state listener
    this.initAuthStateListener()
    
    // Restore session on page load
    this.restoreSession()
  }

  /**
   * Initialize authentication state listener
   */
  initAuthStateListener() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      
      if (session?.user) {
        this.currentUser = session.user
      } else {
        this.currentUser = null
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(callback => {
        callback(event, session)
      })
    })
  }

  /**
   * Restore session on page load
   * This ensures login persistence across page refreshes
   */
  async restoreSession() {
    try {
      console.log('Restoring session on page load...')
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Error restoring session:', error)
        return
      }
      
      if (session?.user) {
        console.log('Session restored successfully:', session.user.id)
        this.currentUser = session.user
        
        // Manually trigger auth state change for session restoration
        // This ensures all listeners are notified of the restored session
        this.authStateListeners.forEach(callback => {
          callback('SIGNED_IN', session)
        })
      } else {
        console.log('No existing session found')
        this.currentUser = null
      }
    } catch (error) {
      console.error('Failed to restore session:', error)
      this.currentUser = null
    }
  }

  /**
   * Sign up new user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @param {Object} avatarData - Optional avatar data
   * @returns {Promise<Object>} Authentication result
   */
  async signUp(username, password, avatarData = null) {
    try {
      // Create email from username for Supabase compatibility
      const email = `${username}@quizwhiz.local`
      
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username
          }
        }
      })

      if (error) {
        throw new Error(this.formatAuthError(error))
      }

      // Create user profile in database
      if (data.user) {
        await this.createUserProfile(data.user, username, avatarData)
      }
      
      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'Account created successfully'
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Sign in existing user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Authentication result
   */
  async signIn(username, password) {
    try {
      // Convert username to email format
      const email = `${username}@quizwhiz.local`
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(this.formatAuthError(error))
      }
      
      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'Signed in successfully'
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} Sign out result
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        throw new Error(this.formatAuthError(error))
      }
      
      this.currentUser = null
      
      return {
        success: true,
        message: 'Signed out successfully'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Get current session
   * @returns {Promise<Object>} Current session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        throw new Error(this.formatAuthError(error))
      }
      
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return this.currentUser !== null
  }

  /**
   * Add authentication state change listener
   * @param {Function} callback - Callback function to execute on auth state change
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * Create user profile in database
   * @param {Object} user - Supabase user object
   * @param {string} username - User's username
   * @param {Object} avatarData - Optional avatar data
   */
  async createUserProfile(user, username, avatarData = null) {
    try {
      // Use provided avatar data or default
      const defaultAvatar = {
        id: 1,
        icon: 'fa-user',
        color: '#FF6B6B',
        background: '#FFE5E5'
      };
      
      const avatar = avatarData || defaultAvatar;
      
      // Insert user profile
      const { data, error: profileError } = await this.supabase
        .from('users')
        .insert([
          {
            id: user.id,
            username: username,
            email: user.email,
            avatar: avatar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw profileError
      }

      // Create initial user data
      const { error: dataError } = await this.supabase
        .from('user_data')
        .insert({
          user_id: user.id,
          settings: {},
          stats: {},
          streak_data: {}
        })
      
      if (dataError) {
        console.error('User data creation error:', dataError)
        throw dataError
      }
      
      console.log('✅ User profile created successfully:', data)
      return data[0];
    } catch (error) {
      console.error('❌ Failed to create user profile:', error)
      throw error
    }
  }

  /**
   * Get user profile data from database
   * @param {string} userId - User ID to get profile for (optional, defaults to current user)
   * @returns {Promise<Object|null>} User profile data or null
   */
  async getUserProfile(userId = null) {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const targetUserId = userId || this.currentUser?.id
        
        if (!targetUserId) {
          console.error('getUserProfile: No user ID provided', { userId, currentUser: this.currentUser })
          throw new Error('No user ID provided')
        }

        // Check if Supabase client is ready
        if (!this.supabase) {
          console.error('getUserProfile: Supabase client not initialized')
          throw new Error('Supabase client not initialized')
        }

        // Check session state before making API call
        const session = await this.supabase.auth.getSession()
        console.log('getUserProfile: Current session state', { 
          hasSession: !!session?.data?.session,
          userId: session?.data?.session?.user?.id,
          targetUserId 
        })
        
        // If no session and trying to access current user profile, return null
        if (!session?.data?.session && !userId) {
          console.warn('getUserProfile: No active session for current user profile request')
          return null
        }

        const { data, error } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', targetUserId)
          .single()
        
        if (error) {
          console.error('getUserProfile: Supabase query error', { 
            error, 
            code: error.code, 
            message: error.message,
            targetUserId,
            retryCount 
          })
          
          if (error.code === 'PGRST116') {
            // No rows returned - user profile doesn't exist
            console.log('getUserProfile: User profile not found in database')
            return null
          }
          
          // Check for authentication errors
          if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('authentication')) {
            console.error('getUserProfile: Authentication error detected', error.message)
            // Clear current user on auth error
            this.currentUser = null
            return null
          }
          
          // Check for network errors that might be retryable
          if (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'NETWORK_ERROR' || error.name === 'TypeError') {
            retryCount++;
            if (retryCount < maxRetries) {
              console.warn(`getUserProfile: Network error, retrying (${retryCount}/${maxRetries}):`, error.message);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
          }
          
          throw error
        }
        
        return {
          id: data.id,
          username: data.username || 'User',
          email: data.email,
          avatarId: data.avatar?.id,
          avatar: data.avatar || {
            id: 1,
            icon: 'fa-user',
            color: '#FF6B6B',
            background: '#FFE5E5'
          },
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      } catch (error) {
        console.error('getUserProfile: Unexpected error caught', { 
          error, 
          name: error.name,
          message: error.message,
          stack: error.stack,
          targetUserId,
          retryCount 
        })
        
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('getUserProfile: Max retries exceeded, giving up', { error, retryCount })
          return null
        }
        
        // Only retry on network-related errors
        if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
          console.warn(`getUserProfile: Retrying due to network error (${retryCount}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          // Don't retry on other types of errors
          console.error('getUserProfile: Non-retryable error, giving up', error.message)
          return null
        }
      }
    }
    
    return null;
  }

  /**
   * Format authentication errors for user-friendly display
   * @param {Object} error - Supabase error object
   * @returns {string} Formatted error message
   */
  formatAuthError(error) {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid username or password. Please try again.'
      case 'User already registered':
        return 'This username is already taken. Please choose a different one.'
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.'
      case 'Signup requires a valid password':
        return 'Please enter a valid password.'
      default:
        return error.message || 'An authentication error occurred. Please try again.'
    }
  }

  /**
   * Save user profile data
   * @param {Object} userData - User profile data to save
   * @returns {Promise<Object>} Save result
   */
  async saveUserProfile(userData) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user')
      }

      if (!userData) {
        throw new Error('No user data provided')
      }

      // Prepare profile data for database
      const profileData = {
        username: userData.username || 'User',
        avatar: userData.avatar || {
          id: 1,
          icon: 'fa-user',
          color: '#FF6B6B',
          background: '#FFE5E5'
        },
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('users')
        .update(profileData)
        .eq('id', this.currentUser.id)
      
      if (error) {
        throw error
      }
      
      return {
        success: true,
        message: 'Profile saved successfully'
      }
    } catch (error) {
      console.error('Profile save error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user')
      }

      const { error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)
      
      if (error) {
        throw error
      }
      
      return {
        success: true,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Wait for Supabase client to be ready before creating service
const initSupabaseAuthService = () => {
  if (typeof window.supabaseClient !== 'undefined') {
    try {
      // Create singleton instance
      const authService = new SupabaseAuthService()
      
      // Make available globally for non-module scripts
      if (typeof window !== 'undefined') {
        window.supabaseAuthService = authService
      }
      
      console.log('Supabase Auth Service initialized')
    } catch (error) {
      console.error('Error initializing Supabase Auth Service:', error)
    }
  } else {
    // Retry after a short delay
    setTimeout(initSupabaseAuthService, 50);
  }
};

// Start initialization
initSupabaseAuthService();