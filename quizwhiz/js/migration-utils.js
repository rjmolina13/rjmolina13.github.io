// migration-utils.js

/**
 * Migration utilities for Firebase to Supabase data migration
 * Handles data transformation, validation, and migration processes
 */
class MigrationUtils {
  constructor() {
    this.authService = window.supabaseAuthService
    this.dataService = window.supabaseDataService
  }

  /**
   * Migrate data from Firebase to Supabase
   * @param {Object} firebaseData - Exported Firebase data
   * @param {string} userId - Target Supabase user ID
   * @returns {Promise<Object>} Migration result
   */
  static async migrateFromFirebase(firebaseData, userId) {
    try {
      const results = {
        success: false,
        userProfile: false,
        flashcards: 0,
        quizzes: 0,
        userData: false,
        errors: []
      }

      console.log('Starting Firebase to Supabase migration...')

      // Migrate user profile if exists
      if (firebaseData.userProfile) {
        try {
          await window.supabaseAuthService.updateUserProfile(userId, {
            username: firebaseData.userProfile.username,
            avatar: firebaseData.userProfile.avatar || {
              id: 1,
              icon: 'fa-user',
              color: '#FF6B6B',
              background: '#FFE5E5'
            }
          })
          results.userProfile = true
          console.log('✓ User profile migrated successfully')
        } catch (error) {
          results.errors.push(`User profile migration error: ${error.message}`)
          console.error('✗ User profile migration failed:', error)
        }
      }

      // Migrate flashcards
      if (firebaseData.flashcards && Array.isArray(firebaseData.flashcards)) {
        console.log(`Migrating ${firebaseData.flashcards.length} flashcards...`)
        
        for (const flashcard of firebaseData.flashcards) {
          try {
            const transformedFlashcard = this.transformFirebaseFlashcard(flashcard, userId)
            await window.supabaseDataService.saveFlashcard(transformedFlashcard)
            results.flashcards++
          } catch (error) {
            results.errors.push(`Flashcard migration error: ${error.message}`)
            console.error('✗ Flashcard migration failed:', error)
          }
        }
        console.log(`✓ ${results.flashcards} flashcards migrated successfully`)
      }

      // Migrate quizzes
      if (firebaseData.quizzes && Array.isArray(firebaseData.quizzes)) {
        console.log(`Migrating ${firebaseData.quizzes.length} quizzes...`)
        
        for (const quiz of firebaseData.quizzes) {
          try {
            const transformedQuiz = this.transformFirebaseQuiz(quiz, userId)
            await window.supabaseDataService.saveQuiz(transformedQuiz)
            results.quizzes++
          } catch (error) {
            results.errors.push(`Quiz migration error: ${error.message}`)
            console.error('✗ Quiz migration failed:', error)
          }
        }
        console.log(`✓ ${results.quizzes} quizzes migrated successfully`)
      }

      // Migrate user data (settings, stats, streak data)
      if (firebaseData.userData) {
        try {
          const transformedUserData = this.transformFirebaseUserData(firebaseData.userData)
          await window.supabaseDataService.saveUserData(userId, transformedUserData)
          results.userData = true
          console.log('✓ User data migrated successfully')
        } catch (error) {
          results.errors.push(`User data migration error: ${error.message}`)
          console.error('✗ User data migration failed:', error)
        }
      }

      // Determine overall success
      results.success = results.errors.length === 0
      
      console.log('Migration completed:', results)
      return results
    } catch (error) {
      console.error('Migration failed:', error)
      return {
        success: false,
        error: error.message,
        userProfile: false,
        flashcards: 0,
        quizzes: 0,
        userData: false,
        errors: [error.message]
      }
    }
  }

  /**
   * Transform Firebase flashcard to Supabase format
   * @param {Object} firebaseFlashcard - Firebase flashcard data
   * @param {string} userId - User ID
   * @returns {Object} Transformed flashcard
   */
  static transformFirebaseFlashcard(firebaseFlashcard, userId) {
    return {
      id: firebaseFlashcard.id || this.generateUUID(),
      user_id: userId,
      question: firebaseFlashcard.question || '',
      answer: firebaseFlashcard.answer || '',
      category: firebaseFlashcard.category || 'General',
      difficulty: firebaseFlashcard.difficulty || 1,
      created_at: firebaseFlashcard.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Transform Firebase quiz to Supabase format
   * @param {Object} firebaseQuiz - Firebase quiz data
   * @param {string} userId - User ID
   * @returns {Object} Transformed quiz
   */
  static transformFirebaseQuiz(firebaseQuiz, userId) {
    return {
      id: firebaseQuiz.id || this.generateUUID(),
      user_id: userId,
      title: firebaseQuiz.title || 'Untitled Quiz',
      questions: firebaseQuiz.questions || [],
      category: firebaseQuiz.category || 'General',
      created_at: firebaseQuiz.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Transform Firebase user data to Supabase format
   * @param {Object} firebaseUserData - Firebase user data
   * @returns {Object} Transformed user data
   */
  static transformFirebaseUserData(firebaseUserData) {
    return {
      settings: firebaseUserData.settings || {},
      stats: firebaseUserData.stats || {},
      streak_data: firebaseUserData.streakData || firebaseUserData.streak_data || {}
    }
  }

  /**
   * Validate migrated data against original Firebase data
   * @param {Object} originalData - Original Firebase data
   * @param {Object} migratedData - Migrated Supabase data
   * @returns {Object} Validation result
   */
  static validateMigratedData(originalData, migratedData) {
    const validation = {
      flashcards: {
        expected: originalData.flashcards?.length || 0,
        actual: migratedData.flashcards?.length || 0,
        valid: false
      },
      quizzes: {
        expected: originalData.quizzes?.length || 0,
        actual: migratedData.quizzes?.length || 0,
        valid: false
      },
      userProfile: {
        expected: !!originalData.userProfile,
        actual: !!migratedData.userProfile,
        valid: false
      },
      userData: {
        expected: !!originalData.userData,
        actual: !!migratedData.userData,
        valid: false
      }
    }

    // Validate counts and existence
    validation.flashcards.valid = validation.flashcards.expected === validation.flashcards.actual
    validation.quizzes.valid = validation.quizzes.expected === validation.quizzes.actual
    validation.userProfile.valid = validation.userProfile.expected === validation.userProfile.actual
    validation.userData.valid = validation.userData.expected === validation.userData.actual

    const isValid = Object.values(validation).every(v => v.valid)

    return {
      isValid,
      details: validation,
      summary: {
        totalExpected: validation.flashcards.expected + validation.quizzes.expected,
        totalMigrated: validation.flashcards.actual + validation.quizzes.actual,
        successRate: isValid ? 100 : 0
      }
    }
  }

  /**
   * Export current Supabase data to Firebase-compatible format
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Exported data
   */
  static async exportToFirebaseFormat(userId) {
    try {
      const [userProfile, flashcards, quizzes, userData] = await Promise.all([
        authService.getUserProfile(userId),
        dataService.loadFlashcards(userId),
        dataService.loadQuizzes(userId),
        dataService.loadUserData(userId)
      ])

      return {
        userProfile: userProfile ? {
          uid: userProfile.id,
          username: userProfile.username,
          avatar: userProfile.avatar
        } : null,
        flashcards: flashcards.map(fc => ({
          id: fc.id,
          question: fc.question,
          answer: fc.answer,
          category: fc.category,
          difficulty: fc.difficulty,
          createdAt: fc.created_at
        })),
        quizzes: quizzes.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          questions: quiz.questions,
          category: quiz.category,
          createdAt: quiz.created_at
        })),
        userData: userData ? {
          settings: userData.settings,
          stats: userData.stats,
          streakData: userData.streak_data
        } : null
      }
    } catch (error) {
      console.error('Export to Firebase format error:', error)
      throw error
    }
  }

  /**
   * Create a backup of current data before migration
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Backup data
   */
  static async createBackup(userId) {
    try {
      const backup = await this.exportToFirebaseFormat(userId)
      const timestamp = new Date().toISOString()
      
      // Store backup in localStorage as fallback
      const backupKey = `quizwhiz_backup_${userId}_${timestamp}`
      localStorage.setItem(backupKey, JSON.stringify(backup))
      
      console.log(`Backup created: ${backupKey}`)
      return {
        success: true,
        backupKey,
        timestamp,
        data: backup
      }
    } catch (error) {
      console.error('Create backup error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Restore data from backup
   * @param {string} backupKey - Backup key
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Restore result
   */
  static async restoreFromBackup(backupKey, userId) {
    try {
      const backupData = localStorage.getItem(backupKey)
      if (!backupData) {
        throw new Error('Backup not found')
      }

      const parsedData = JSON.parse(backupData)
      return await this.migrateFromFirebase(parsedData, userId)
    } catch (error) {
      console.error('Restore from backup error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate a UUID for new records
   * @returns {string} UUID
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Get migration progress
   * @param {Object} results - Migration results
   * @returns {Object} Progress information
   */
  static getMigrationProgress(results) {
    const total = (results.flashcards || 0) + (results.quizzes || 0) + 
                  (results.userProfile ? 1 : 0) + (results.userData ? 1 : 0)
    const errors = results.errors?.length || 0
    const success = total - errors
    
    return {
      total,
      success,
      errors,
      percentage: total > 0 ? Math.round((success / total) * 100) : 0,
      isComplete: errors === 0 && total > 0
    }
  }
}

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.MigrationUtils = MigrationUtils
}

export default MigrationUtils