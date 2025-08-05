# QuizWhiz Release Process

This document explains how the automated release system works for QuizWhiz and how to create new releases.

## 🤖 Automated Release System

The QuizWhiz project now includes a fully automated release system that:

- **Monitors Changes**: Automatically detects changes to the `quizwhiz/` directory
- **Updates README**: Automatically updates the README with version information
- **Creates Releases**: Creates GitHub releases when version numbers change
- **Generates Blog Posts**: Creates blog posts for new releases
- **Tracks Changes**: Generates changelogs and file diff summaries

## 🚀 How to Create a New Release

### Method 1: Using the Version Update Script (Recommended)

1. **Update the version using the script:**
   ```bash
   cd quizwhiz
   node scripts/update-version.js 3.6.0
   ```

2. **Edit the CHANGELOG.md:**
   - The script will add a template entry
   - Fill in the actual changes you made

3. **Test your changes:**
   - Open `index.html` in your browser
   - Verify everything works correctly

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "chore: bump version to 3.6.0"
   git push
   ```

5. **Automatic magic happens:**
   - GitHub Actions detects the version change
   - Creates a new release with changelog
   - Updates README with version info
   - Generates a blog post

### Method 2: Manual Version Update

1. **Update version in these files:**
   - `js/main.js`: Change `this.version = "3.5"`
   - `components/footer.html`: Update the version span
   - `package.json`: Update the version field

2. **Update CHANGELOG.md** with your changes

3. **Commit and push** your changes

## 📋 What Gets Generated Automatically

### GitHub Release
- **Tag**: `quizwhiz-v{version}`
- **Title**: `QuizWhiz v{version}`
- **Body**: Includes changelog, file diffs, and links

### Blog Post
- **Location**: `blog/_posts/{date}-quizwhiz-v{version}-release.md`
- **Content**: Release announcement with features and links
- **Format**: Jekyll-compatible markdown

### README Updates
- **Version Information Section**: Auto-updated with current version
- **Timestamp**: When the update was made
- **Auto-generated Notice**: Indicates automated updates

## 🔧 Workflow Configuration

The workflow is defined in `.github/workflows/quizwhiz-auto-release.yml` and triggers on:

- **Push to main branch** with changes in `quizwhiz/` directory
- **Manual trigger** via GitHub Actions UI

### Key Features:

1. **Version Detection**: Extracts version from `js/main.js`
2. **Change Detection**: Compares with previous commit
3. **Changelog Generation**: Creates changelog from git commits
4. **File Diff Summary**: Lists changed files with statistics
5. **Conditional Release**: Only creates releases when version changes

## 📝 Best Practices

### Commit Messages
Use conventional commit format for better changelog generation:
- `feat: add new quiz feature`
- `fix: resolve flashcard flip issue`
- `docs: update README`
- `chore: bump version to 3.6.0`

### Version Numbering
Follow semantic versioning:
- **Major** (4.0.0): Breaking changes
- **Minor** (3.6.0): New features, backwards compatible
- **Patch** (3.5.1): Bug fixes, backwards compatible

### Testing Before Release
Always test your changes:
1. Open the application locally
2. Test new features
3. Verify existing functionality
4. Check responsive design

## 🛠️ Troubleshooting

### Release Not Created
- Check if version number actually changed
- Verify the workflow ran successfully in GitHub Actions
- Ensure you have proper permissions

### README Not Updated
- Check if the workflow completed successfully
- Verify the README format matches expected structure

### Blog Post Not Created
- Ensure the `blog/_posts/` directory exists
- Check workflow logs for errors

## 📞 Support

If you encounter issues with the release process:

1. Check the GitHub Actions logs
2. Verify file permissions and structure
3. Create an issue in the repository

---

**Happy releasing! 🎉**