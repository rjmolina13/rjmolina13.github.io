# Changelog

All notable changes to QuizWhiz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.8.2] - 2025-08-09

### Fixed
- **Deck Rename Modal**: Fixed modal centering issue in Content Management page
  - Updated JavaScript to use class-based modal display (`classList.add('show')`) instead of direct style manipulation
  - Fixed modal not being properly centered horizontally and vertically
  - Updated all modal close handlers to use consistent class-based approach
  - Ensured proper CSS flexbox centering is applied when modal is shown
- **UI Alignment**: Fixed alignment issues in Manage Quizzes and Manage Flashcards sections
  - Removed unnecessary margin from deck-filter-container causing misalignment
  - Updated rename button styling to match other form elements (padding, border-radius, font-size)
  - Ensured consistent alignment of search bar, dropdowns, and buttons in the same row

### Enhanced
- **Deck Management**: Improved visual consistency of deck rename functionality
  - Rename buttons now properly align with select dropdowns and other controls
  - Enhanced button styling for better integration with existing UI components

## [3.8.1] - 2025-08-09

### Enhanced
- **Clear All Data**: Improved toast notification to show specific counts of cleared items
  - Updated Clear All Data functionality to display exact number of flashcards and quizzes cleared
  - Changed from generic "X items removed" to "Successfully cleared X flashcard(s) and Y quiz(zes)"
  - Added proper pluralization for both flashcards and quizzes
  - Maintained fallback message for cases with no data to clear

## [3.8.0] - 2025-08-09

### Fixed
- **Data Import**: Fixed JSON import merge behavior to properly append individual items instead of replacing entire arrays
  - Modified `importAllLocalStorageData` method to merge flashcards and quizzes with existing data
  - Import now appends new items to existing `quizwhiz_quizzes` and `quizwhiz_flashcards` arrays
  - Updated success message to indicate "appended to existing data" for clarity
  - Non-array data (settings, stats) continues to be replaced as expected
- **Mobile Navigation**: Implemented responsive hamburger menu for mobile devices
  - Added hamburger menu button with animated lines
  - Created collapsible navigation menu for screens ≤768px
  - Implemented smooth slideDown animation for mobile dropdowns
  - Added proper ARIA attributes for accessibility
  - Enhanced mobile menu behavior with outside click and resize event handling
- **Footer Version Display**: Fixed version not displaying in footer on about.html page
  - Resolved duplicate ID conflict between about page content and footer elements
  - Changed about page version element ID from `app-version` to `about-app-version`
  - Enhanced footer-loader.js with robust retry mechanism for version updates
  - Added proper version population for both footer and about page version information
  - Ensured consistent "v3.8" display across all pages including about.html

### Enhanced
- **User Feedback**: Added comprehensive toast notifications for all quiz and flashcard operations
  - Added success toast for flashcard updates: "Flashcard updated successfully!"
  - Added success toast for quiz updates: "Quiz updated successfully!"
  - Added success toast for quiz deletion: "Quiz deleted successfully!"
  - Enhanced bulk delete operations with proper count tracking and success/error messages
  - Added error handling toasts for failed delete operations
- **Mobile UX**: Improved mobile navigation experience with intuitive hamburger menu
- **Responsive Design**: Enhanced mobile layout with proper navigation collapse and expansion

## [3.7.0] - 2025-08-09

### Fixed
- **Data Import**: Fixed JSON import merge behavior to properly append individual items instead of replacing entire arrays
  - Modified `importAllLocalStorageData` method to merge flashcards and quizzes with existing data
  - Import now appends new items to existing `quizwhiz_quizzes` and `quizwhiz_flashcards` arrays
  - Updated success message to indicate "appended to existing data" for clarity
  - Non-array data (settings, stats) continues to be replaced as expected
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
- **User Feedback**: Added comprehensive toast notifications for all quiz and flashcard operations
  - Added success toast for flashcard updates: "Flashcard updated successfully!"
  - Added success toast for quiz updates: "Quiz updated successfully!"
  - Added success toast for quiz deletion: "Quiz deleted successfully!"
  - Enhanced bulk delete operations with proper count tracking and success/error messages
  - Added error handling toasts for failed delete operations

### Technical
- Updated multiple JavaScript files to ensure proper element ID references
- Streamlined event handler management to prevent conflicts
- Improved search debouncing for better performance

## [3.5.0] - 2025-08-05

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