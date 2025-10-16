// Script to update all JavaScript files to remove module.exports
const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'js');

// Get all JavaScript files in the js directory
const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

// Process each file
jsFiles.forEach(file => {
  const filePath = path.join(jsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace module.exports with a comment
  const regex = /\/\/\s*Export\s+for\s+module\s+systems[\s\S]*?module\.exports\s*=\s*[^;]+;[\s\S]*?}/g;
  const newContent = content.replace(regex, '// No module exports, only use window object');
  
  // Only write if changes were made
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${file}`);
  }
});

console.log('All files processed');