// supabase-data.js

/**
 * Supabase Data Service
 * Handles all database operations for flashcards, quizzes, and user data
 */
class SupabaseDataService {
  constructor() {
    this.supabase = window.supabaseClient
    if (!this.supabase) {
      console.error('Supabase client not available. Make sure supabase-config.js is loaded first.')
    }
  }

  // ==================== USER DATA OPERATIONS ====================

  /**
   * Load user data (settings, stats, streak data)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  async loadUserData(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Load user data error:', error)
      return null
    }
  }

  /**
   * Save user data (settings, stats, streak data)
   * @param {string} userId - User ID
   * @param {Object} userData - User data to save
   * @returns {Promise<Object>} Saved user data
   */
  async saveUserData(userId, userData) {
    try {
      const { data, error } = await this.supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          ...userData,
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Save user data error:', error)
      throw error
    }
  }

  // ==================== FLASHCARD OPERATIONS ====================

  /**
   * Load all flashcards for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of flashcards
   */
  async loadFlashcards(userId) {
    try {
      console.log('DEBUG: loadFlashcards - querying for user_id:', userId);
      const { data, error } = await this.supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      console.log('DEBUG: loadFlashcards - query result:', { data: data?.length || 0, error });
      if (data && data.length > 0) {
        console.log('DEBUG: loadFlashcards - first flashcard:', data[0]);
      }
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Load flashcards error:', error)
      return []
    }
  }

  /**
   * Save a flashcard (create or update)
   * @param {Object} flashcard - Flashcard data
   * @returns {Promise<Object>} Saved flashcard
   */
  async saveFlashcard(flashcard) {
    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .upsert({
          ...flashcard,
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Save flashcard error:', error)
      throw error
    }
  }

  /**
   * Delete a flashcard
   * @param {string} flashcardId - Flashcard ID
   * @returns {Promise<void>}
   */
  async deleteFlashcard(flashcardId) {
    try {
      const { error } = await this.supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)
      
      if (error) throw error
    } catch (error) {
      console.error('Delete flashcard error:', error)
      throw error
    }
  }

  /**
   * Clear all flashcards for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async clearAllFlashcards(userId) {
    try {
      const { error } = await this.supabase
        .from('flashcards')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('Clear all flashcards error:', error)
      throw error
    }
  }

  /**
   * Get flashcards by category
   * @param {string} userId - User ID
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of flashcards in category
   */
  async getFlashcardsByCategory(userId, category) {
    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get flashcards by category error:', error)
      return []
    }
  }

  // ==================== QUIZ OPERATIONS ====================

  /**
   * Load all quizzes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of quizzes
   */
  async loadQuizzes(userId) {
    try {
      console.log('DEBUG: loadQuizzes - querying for user_id:', userId);
      const { data, error } = await this.supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      console.log('DEBUG: loadQuizzes - query result:', { data: data?.length || 0, error });
      if (data && data.length > 0) {
        console.log('DEBUG: loadQuizzes - first quiz:', data[0]);
      }
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Load quizzes error:', error)
      return []
    }
  }

  /**
   * Save a quiz (create or update)
   * @param {Object} quiz - Quiz data
   * @returns {Promise<Object>} Saved quiz
   */
  async saveQuiz(quiz) {
    try {
      const { data, error } = await this.supabase
        .from('quizzes')
        .upsert({
          ...quiz,
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Save quiz error:', error)
      throw error
    }
  }

  /**
   * Clear all quizzes for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async clearAllQuizzes(userId) {
    try {
      const { error } = await this.supabase
        .from('quizzes')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('Clear all quizzes error:', error)
      throw error
    }
  }

  /**
   * Delete a quiz
   * @param {string} quizId - Quiz ID
   * @returns {Promise<void>}
   */
  async deleteQuiz(quizId) {
    try {
      const { error } = await this.supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
      
      if (error) throw error
    } catch (error) {
      console.error('Delete quiz error:', error)
      throw error
    }
  }

  /**
   * Get quizzes by category
   * @param {string} userId - User ID
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of quizzes in category
   */
  async getQuizzesByCategory(userId, category) {
    try {
      const { data, error } = await this.supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get quizzes by category error:', error)
      return []
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to flashcard changes
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   */
  subscribeToFlashcards(userId, callback) {
    return this.supabase
      .channel('flashcards')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flashcards',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  /**
   * Subscribe to quiz changes
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   */
  subscribeToQuizzes(userId, callback) {
    return this.supabase
      .channel('quizzes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quizzes',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  /**
   * Subscribe to user data changes
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   */
  subscribeToUserData(userId, callback) {
    return this.supabase
      .channel('user_data')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  /**
   * Unsubscribe from a channel
   * @param {Object} subscription - Subscription object
   * @returns {Promise<void>}
   */
  async unsubscribe(subscription) {
    try {
      await this.supabase.removeChannel(subscription)
    } catch (error) {
      console.error('Unsubscribe error:', error)
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Delete all user data (flashcards, quizzes, and user_data)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteAllUserData(userId) {
    try {
      // Delete all flashcards
      const { error: flashcardsError } = await this.supabase
        .from('flashcards')
        .delete()
        .eq('user_id', userId)
      
      if (flashcardsError) throw flashcardsError

      // Delete all quizzes
      const { error: quizzesError } = await this.supabase
        .from('quizzes')
        .delete()
        .eq('user_id', userId)
      
      if (quizzesError) throw quizzesError

      // Delete user data
      const { error: userDataError } = await this.supabase
        .from('user_data')
        .delete()
        .eq('user_id', userId)
      
      if (userDataError) throw userDataError

      console.log('All user data deleted successfully')
    } catch (error) {
      console.error('Delete all user data error:', error)
      throw error
    }
  }

  /**
   * Get all categories for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of unique categories
   */
  async getUserCategories(userId) {
    try {
      const [flashcardCategories, quizCategories] = await Promise.all([
        this.supabase
          .from('flashcards')
          .select('category')
          .eq('user_id', userId),
        this.supabase
          .from('quizzes')
          .select('category')
          .eq('user_id', userId)
      ])

      const categories = new Set()
      
      if (flashcardCategories.data) {
        flashcardCategories.data.forEach(item => categories.add(item.category))
      }
      
      if (quizCategories.data) {
        quizCategories.data.forEach(item => categories.add(item.category))
      }

      return Array.from(categories).sort()
    } catch (error) {
      console.error('Get user categories error:', error)
      return []
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userId) {
    try {
      const [flashcards, quizzes, userData] = await Promise.all([
        this.loadFlashcards(userId),
        this.loadQuizzes(userId),
        this.loadUserData(userId)
      ])

      return {
        totalFlashcards: flashcards.length,
        totalQuizzes: quizzes.length,
        categories: await this.getUserCategories(userId),
        stats: userData?.stats || {},
        streakData: userData?.streak_data || {}
      }
    } catch (error) {
      console.error('Get user stats error:', error)
      return {
        totalFlashcards: 0,
        totalQuizzes: 0,
        categories: [],
        stats: {},
        streakData: {}
      }
    }
  }

  /**
   * Convert difficulty from string to integer
   * @param {string|number} difficulty - Difficulty value
   * @returns {number} Integer difficulty (1-5)
   */
  convertDifficulty(difficulty) {
    if (typeof difficulty === 'number') {
      return Math.max(1, Math.min(5, difficulty));
    }
    
    const difficultyMap = {
      'easy': 1,
      'medium': 3,
      'hard': 5,
      'beginner': 1,
      'intermediate': 3,
      'advanced': 5
    };
    
    return difficultyMap[difficulty?.toLowerCase()] || 3;
  }

  /**
   * Bulk import data
   * @param {string} userId - User ID
   * @param {Object} data - Data to import
   * @param {string} mode - Import mode ('append' or 'replace')
   * @returns {Promise<Object>} Import result
   */
  async bulkImport(userId, data, mode = 'append') {
    try {
      console.log('Starting bulk import for user:', userId, 'mode:', mode);
      console.log('Import data structure:', {
        flashcards: data.flashcards?.length || 0,
        quizzes: data.quizzes?.length || 0,
        flashcardsType: Array.isArray(data.flashcards),
        quizzesType: Array.isArray(data.quizzes)
      });

      let results = {
        flashcards: 0,
        quizzes: 0,
        errors: []
      };

      // Handle replace mode - delete existing data first
      if (mode === 'replace') {
        const { error: deleteFlashcardsError } = await this.supabase
          .from('flashcards')
          .delete()
          .eq('user_id', userId);
        
        if (deleteFlashcardsError) {
          results.errors.push(`Error clearing flashcards: ${deleteFlashcardsError.message}`);
        }

        const { error: deleteQuizzesError } = await this.supabase
          .from('quizzes')
          .delete()
          .eq('user_id', userId);
        
        if (deleteQuizzesError) {
          results.errors.push(`Error clearing quizzes: ${deleteQuizzesError.message}`);
        }
      }

      // Import flashcards
      if (data.flashcards && Array.isArray(data.flashcards) && data.flashcards.length > 0) {
        const flashcardsToImport = data.flashcards.map(card => {
          // Transform backup format to Supabase format
          const transformed = {
            question: card.question,
            answer: card.answer,
            category: card.deck || card.category || 'General', // Map 'deck' to 'category'
            difficulty: this.convertDifficulty(card.difficulty), // Convert string to integer
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Remove any undefined fields
          Object.keys(transformed).forEach(key => {
            if (transformed[key] === undefined) {
              delete transformed[key];
            }
          });
          
          return transformed;
        });

        const { data: insertedFlashcards, error: flashcardError } = await this.supabase
          .from('flashcards')
          .insert(flashcardsToImport)
          .select();

        if (flashcardError) {
          console.error('Error importing flashcards:', flashcardError);
          results.errors.push(`Flashcard import error: ${flashcardError.message}`);
        } else {
          results.flashcards = insertedFlashcards?.length || 0;
          console.log(`Successfully imported ${results.flashcards} flashcards`);
        }
      }

      // Import quizzes
      if (data.quizzes && Array.isArray(data.quizzes) && data.quizzes.length > 0) {
        // Group individual quiz questions by deck
        const quizzesByDeck = {};
        data.quizzes.forEach(quiz => {
          const deckName = quiz.deck || 'Untitled Quiz';
          if (!quizzesByDeck[deckName]) {
            quizzesByDeck[deckName] = {
              title: deckName,
              category: quiz.category || 'General',
              questions: []
            };
          }
          quizzesByDeck[deckName].questions.push({
            question: quiz.question,
            correctAnswer: quiz.correctAnswer,
            wrongAnswers: quiz.wrongAnswers || [],
            difficulty: this.convertDifficulty(quiz.difficulty)
          });
        });
        
        // Convert grouped quizzes to Supabase format
        const quizzesToImport = Object.values(quizzesByDeck).map(quiz => ({
          title: quiz.title,
          questions: quiz.questions,
          category: quiz.category,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data: insertedQuizzes, error: quizError } = await this.supabase
          .from('quizzes')
          .insert(quizzesToImport)
          .select();

        if (quizError) {
          console.error('Error importing quizzes:', quizError);
          results.errors.push(`Quiz import error: ${quizError.message}`);
        } else {
          results.quizzes = insertedQuizzes?.length || 0;
          console.log(`Successfully imported ${results.quizzes} quizzes`);
        }
      }

      console.log('Bulk import completed:', results);
      return results;

    } catch (error) {
      console.error('Bulk import failed:', error);
      return {
        flashcards: 0,
        quizzes: 0,
        errors: [error.message]
      };
    }
  }
}

// Initialize Supabase Data Service
function initSupabaseDataService() {
  if (!window.supabaseClient) {
    console.warn('Supabase client not available yet, retrying...')
    setTimeout(initSupabaseDataService, 100)
    return
  }
  
  if (!window.supabaseDataService) {
    window.supabaseDataService = new SupabaseDataService()
    window.SupabaseDataService = SupabaseDataService
    console.log('✅ Supabase Data Service initialized')
  }
}

// Initialize when script loads
initSupabaseDataService()