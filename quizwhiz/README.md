# Quiz Whiz 🧠

A modern, feature-rich online flashcard and quiz application built with vanilla HTML, CSS, and JavaScript. Perfect for students, educators, and anyone looking to enhance their learning experience.

## ✨ Features

### 🎯 Core Functionality
- **Interactive Flashcards**: Flip cards with smooth animations
- **Multiple Choice Quizzes**: Test your knowledge with customizable quizzes
- **Deck Organization**: Organize flashcards into different decks/categories
- **Difficulty Levels**: Mark cards as Easy, Medium, or Hard
- **Progress Tracking**: Monitor your study progress and best scores

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Dark/Light Theme**: Automatic theme switching based on system preference
- **Keyboard Shortcuts**: Navigate efficiently with keyboard controls
- **Toast Notifications**: Real-time feedback for user actions

### 💾 Data Management
- **Local Storage**: All data stored securely in your browser
- **Import/Export**: Support for JSON, XML, CSV, and TXT formats
- **Drag & Drop**: Easy file uploads with drag and drop interface
- **Data Backup**: Export your entire collection for backup

### 🎮 Interactive Features
- **Card Shuffling**: Randomize your study sessions
- **Auto-flip**: Optional automatic card flipping
- **Study Statistics**: Track your learning progress
- **Quiz Customization**: Choose deck, difficulty, and question count

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required!

### Installation

1. **Clone or Download**
   ```bash
   git clone https://github.com/yourusername/quiz-whiz.git
   cd quiz-whiz
   ```

2. **Open in Browser**
   - Simply open `index.html` in your web browser
   - Or use a local server for development:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **GitHub Pages Deployment**
   - Fork this repository
   - Go to Settings > Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/" (root)
   - Your site will be available at `https://yourusername.github.io/quiz-whiz`

## 📖 Usage Guide

### Creating Flashcards

1. **Manual Entry**
   - Navigate to the "Upload" section
   - Fill in the deck name, question, and answer
   - Select difficulty level
   - Click "Add Flashcard"

2. **File Upload**
   - Drag and drop files or click to browse
   - Supported formats:
     - **JSON**: `{"flashcards": [{"question": "Q", "answer": "A", "deck": "Deck", "difficulty": "easy"}]}`
     - **CSV**: `question,answer,deck,difficulty`
     - **TXT**: `Question|Answer|Deck|Difficulty` (one per line)
     - **XML**: Structured XML with flashcard elements

### Studying with Flashcards

1. Go to the "Flashcards" section
2. Select a deck or choose "All Decks"
3. Click on cards to flip them
4. Use navigation buttons or keyboard shortcuts:
   - **Space**: Flip card
   - **Left Arrow**: Previous card
   - **Right Arrow**: Next card
   - **Ctrl/Cmd + S**: Shuffle cards
5. Mark difficulty after reviewing each card

### Taking Quizzes

1. Navigate to the "Quiz" section
2. Configure quiz settings:
   - Select deck
   - Choose number of questions (5-50)
   - Filter by difficulty
3. Click "Start Quiz"
4. Select answers and progress through questions
5. Review your results and mistakes

### Data Management

1. **Export Data**
   - Go to Settings
   - Choose export format (JSON or XML)
   - File will download automatically

2. **Import Data**
   - Click "Import Data" in Settings
   - Select your backup file
   - Data will be merged with existing content

3. **Clear Data**
   - Use "Clear All Data" for a fresh start
   - ⚠️ This action cannot be undone

## 🎨 Customization

### Themes
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes for low-light studying
- **Auto**: Follows your system preference

### Settings
- **Animations**: Toggle smooth transitions
- **Auto-flip**: Set automatic card flipping (0-30 seconds)
- **Shuffle by Default**: Always start with shuffled cards

## 📁 File Structure

```
quiz-whiz/
├── index.html          # Main HTML structure
├── css/                # Modular CSS files
│   ├── main.css        # Main CSS file (imports all modules)
│   ├── variables.css   # CSS custom properties and themes
│   ├── base.css        # Global styles and resets
│   ├── navigation.css  # Navigation and theme picker styles
│   ├── layout.css      # Layout and hero section styles
│   ├── buttons.css     # Button styles and variants
│   ├── flashcards.css  # Flashcard component styles
│   ├── quiz.css        # Quiz component styles
│   ├── forms.css       # Form and upload styles
│   ├── components.css  # Modals, toasts, and UI components
│   ├── settings.css    # Settings, data actions, and special components
│   └── utilities.css   # Mixed mode, animations, and responsive design
├── styles.css          # Original CSS file (can be removed)

└── README.md           # This file
```

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: No frameworks, pure ES6+ features
- **Local Storage API**: Client-side data persistence
- **File API**: File upload and processing
- **CSS Custom Properties**: Dynamic theming

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance Features
- Lazy loading of content
- Efficient DOM manipulation
- Optimized animations with CSS transforms
- Minimal memory footprint

## 📊 Data Formats

### JSON Export Format
```json
{
  "flashcards": [
    {
      "id": 1234567890,
      "question": "What is the capital of France?",
      "answer": "Paris",
      "deck": "Geography",
      "difficulty": "easy",
      "created": "2024-01-01T00:00:00.000Z",
      "lastReviewed": null,
      "reviewCount": 0
    }
  ],
  "settings": {
    "theme": "light",
    "animations": true,
    "autoFlip": 0,
    "shuffleDefault": false
  },
  "stats": {
    "totalFlashcards": 1,
    "bestScore": 85,
    "studyStreak": 5
  },
  "exportDate": "2024-01-01T00:00:00.000Z"
}
```

### CSV Import Format
```csv
question,answer,deck,difficulty
"What is 2+2?","4","Math","easy"
"Capital of Japan?","Tokyo","Geography","medium"
```

## 🎯 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Flip current flashcard |
| `←` | Previous flashcard |
| `→` | Next flashcard |
| `Ctrl/Cmd + S` | Shuffle cards |

## 🔒 Privacy & Security

- **No Server Required**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **Local Storage**: Data never leaves your browser
- **Offline Capable**: Works without internet connection
- **No Registration**: Start using immediately

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Test on multiple browsers
- Ensure responsive design
- Add comments for complex logic
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Font Awesome** for beautiful icons
- **Google Fonts** for the Poppins font family
- **CSS Grid** and **Flexbox** for layout capabilities
- **Local Storage API** for data persistence

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/quiz-whiz/issues) page
2. Create a new issue with detailed information
3. Include browser version and steps to reproduce

## 🗺️ Roadmap

### Planned Features
- [ ] Spaced repetition algorithm
- [ ] Study statistics dashboard
- [ ] Collaborative decks sharing
- [ ] Audio pronunciation support
- [ ] Image support in flashcards
- [ ] Study reminders
- [ ] Progress charts and analytics
- [ ] Multiple choice question generation
- [ ] Deck templates and categories
- [ ] Study session timer




## Version Information

- **Current Version:** v3.7
- **Last Updated:** 2025-08-08 19:37:55 UTC
- **Auto-generated:** This section is automatically updated by GitHub Actions

## 

QuizWhiz now features a fully automated release system! Here's what happens automatically:

### 🤖 When You Update QuizWhiz
- **Version Detection**: Automatically detects version changes
- **README Updates**: Updates this file with current version info
- **GitHub Releases**: Creates releases with changelogs and file diffs
- **Blog Posts**: Generates release announcement posts

### 📝 For Developers
To create a new release:

1. **Update version using the script:**
   ```bash
   cd quizwhiz
   node scripts/update-version.js 3.6.0
   ```

2. **Edit CHANGELOG.md** with your changes

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "chore: bump version to 3.6.0"
   git push
   ```

4. **GitHub Actions handles the rest!**
   - Creates GitHub release
   - Updates README
   - Generates blog post

See [Release Process Documentation](docs/RELEASE_PROCESS.md) for detailed instructions.

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added dark theme and keyboard shortcuts
- **v1.2.0** - Improved file import/export functionality

---

**Happy Learning! 🎓**

Made with ❤️ for learners everywhere.