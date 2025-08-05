# Changelog

All notable changes to QuizWhiz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-01-05

### Fixed
- **Quiz Management**: Fixed "Add Quiz Question" button becoming unresponsive after form submission
  - Corrected button ID mismatch between HTML (`open-add-quiz-modal`) and JavaScript (`add-quiz-btn`)
  - Removed duplicate event listeners that were causing conflicts
  - Ensured consistent modal state management through UI manager
- **Search Functionality**: Fixed live search not working for quiz and flashcard content
  - Corrected element ID mismatches in content-manager.js:
    - Quiz search: `quiz-content-search` → `manage-quiz-search`
    - Quiz deck filter: `quiz-content-deck-filter` → `manage-quiz-deck-filter`
    - Quiz difficulty filter: `quiz-content-difficulty-filter` → `manage-quiz-difficulty-filter`
    - Flashcard search: `flashcard-search` → `manage-search`
    - Flashcard deck filter: `flashcard-deck-filter` → `manage-deck-filter`
    - Flashcard difficulty filter: `flashcard-difficulty-filter` → `manage-difficulty-filter`
  - Updated event handlers in event-handler.js to use correct element IDs
  - Fixed search to properly filter through questions, answers, and content

### Enhanced
- **Quiz Search**: Improved quiz search to include wrong answers in addition to questions and correct answers
- **Content Display**: Enhanced flashcard and quiz filtering logic for better user experience
- **Code Quality**: Added `truncateText` utility method for better display formatting
- **Modal Management**: Improved modal closing consistency using UI manager methods

### Technical
- Updated multiple JavaScript files to ensure proper element ID references
- Streamlined event handler management to prevent conflicts
- Improved search debouncing for better performance

## [3.5.0] - 2024-12-19

### Added
- Automated release workflow with GitHub Actions
- Version management script for easy updates
- Automatic README generation with version information
- Blog post generation for new releases
- Comprehensive changelog tracking

### Changed
- Improved project structure with package.json
- Enhanced documentation with version information

### Technical
- Added GitHub Actions workflow for automatic releases
- Created version update script for streamlined releases
- Implemented automatic README updates
- Added blog post generation for releases

## [Previous Versions]

### Features Implemented
- Interactive flashcards with flip animations
- Multiple choice quiz system
- Deck organization and management
- Difficulty level tracking (Easy, Medium, Hard)
- Progress tracking and statistics
- Responsive design for all devices
- Dark/Light theme support
- Local storage for data persistence
- Import/Export functionality (JSON, XML, CSV, TXT)
- Drag and drop file uploads
- Keyboard shortcuts for navigation
- Toast notifications for user feedback
- Card shuffling and auto-flip features
- Study session customization
- Modern UI with smooth animations

---

**Note:** This changelog was created as part of the automated release system. Previous version history may be incomplete but all major features are documented above.