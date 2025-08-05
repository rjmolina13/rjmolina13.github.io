#!/usr/bin/env node

/**
 * QuizWhiz Version Update Script
 * 
 * This script helps update the version number across all QuizWhiz files
 * and can be used to trigger the auto-release workflow.
 * 
 * Usage:
 *   node scripts/update-version.js <new-version>
 *   
 * Example:
 *   node scripts/update-version.js 3.6
 */

const fs = require('fs');
const path = require('path');

// Get the new version from command line arguments
const newVersion = process.argv[2];

if (!newVersion) {
    console.error('❌ Error: Please provide a version number');
    console.log('Usage: node scripts/update-version.js <version>');
    console.log('Example: node scripts/update-version.js 3.6');
    process.exit(1);
}

// Validate version format (basic semver check)
if (!/^\d+\.\d+(\.\d+)?$/.test(newVersion)) {
    console.error('❌ Error: Invalid version format. Use format like 3.6 or 3.6.0');
    process.exit(1);
}

console.log(`🚀 Updating QuizWhiz to version ${newVersion}...`);

// Files to update
const filesToUpdate = [
    {
        path: 'js/main.js',
        pattern: /this\.version = "[^"]*"/,
        replacement: `this.version = "${newVersion}"`
    },
    {
        path: 'components/footer.html',
        pattern: /<span id="app-version">[^<]*<\/span>/,
        replacement: `<span id="app-version">${newVersion}</span>`
    }
];

let updatedFiles = 0;

// Update each file
filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, '..', file.path);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  Warning: File not found: ${file.path}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        content = content.replace(file.pattern, file.replacement);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${file.path}`);
            updatedFiles++;
        } else {
            console.log(`ℹ️  No changes needed: ${file.path}`);
        }
        
    } catch (error) {
        console.error(`❌ Error updating ${file.path}:`, error.message);
    }
});

// Update package.json if it exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
        console.log('✅ Updated: package.json');
        updatedFiles++;
    } catch (error) {
        console.error('❌ Error updating package.json:', error.message);
    }
}

// Generate changelog entry template
const changelogTemplate = `
## Version ${newVersion} - ${new Date().toISOString().split('T')[0]}

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

`;

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
    try {
        const changelog = fs.readFileSync(changelogPath, 'utf8');
        const updatedChangelog = changelog.replace(
            /^(# Changelog\s*\n)/m,
            `$1${changelogTemplate}`
        );
        fs.writeFileSync(changelogPath, updatedChangelog, 'utf8');
        console.log('✅ Updated: CHANGELOG.md (template added)');
    } catch (error) {
        console.error('❌ Error updating CHANGELOG.md:', error.message);
    }
} else {
    // Create new changelog
    try {
        const newChangelog = `# Changelog\n\nAll notable changes to QuizWhiz will be documented in this file.\n${changelogTemplate}`;
        fs.writeFileSync(changelogPath, newChangelog, 'utf8');
        console.log('✅ Created: CHANGELOG.md');
    } catch (error) {
        console.error('❌ Error creating CHANGELOG.md:', error.message);
    }
}

console.log(`\n🎉 Version update complete!`);
console.log(`📊 Files updated: ${updatedFiles}`);
console.log(`📝 Version: ${newVersion}`);
console.log(`\n📋 Next steps:`);
console.log(`1. Review and edit CHANGELOG.md with your changes`);
console.log(`2. Test the application`);
console.log(`3. Commit and push changes to trigger auto-release:`);
console.log(`   git add .`);
console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
console.log(`   git push`);
console.log(`\n🚀 The GitHub Actions workflow will automatically create a release!`);