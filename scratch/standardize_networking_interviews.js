const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('find docs/technical-knowledge/networking -name "*.md"')
  .toString()
  .trim()
  .split('\n')
  .sort();

console.log(`=== Formatting Interview Questions for ${files.length} Networking Files ===\n`);

let formattedFilesCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Locate ## Interview Questions section if present
  if (/##\s*(?:❓\s*)?Interview\s*Questions/i.test(content)) {
    let modified = false;

    // 1. Ensure clean header
    if (!file.endsWith('networking-interview-questions.md')) {
      content = content.replace(/##\s*(?:❓\s*)?Interview\s*Questions.*/gi, '## Interview Questions');
      modified = true;
    }

    // 2. Format Q1. Q2. Q3. into bold or H3 questions with blockquotes
    // Replace **Q1. Question** > Answer pattern to ensure clean spacing
    content = content.replace(/\n\*\*Q(\d+)\.\s*([^*]+)\*\*\n>\s*/g, (match, num, qText) => {
      modified = true;
      return `\n**Q${num}. ${qText.trim()}**\n> `;
    });

    // Replace **Q: Question** > Answer pattern
    content = content.replace(/\n\*\*Q:\s*([^*]+)\*\*\n>\s*/g, (match, qText) => {
      modified = true;
      return `\n**Q: ${qText.trim()}**\n> `;
    });

    // 3. Remove duplicate empty lines and double dividers
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/\n---\n\s*---\n/g, '\n---\n');

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Formatted Interview Section in: ${file}`);
      formattedFilesCount++;
    }
  }
});

console.log(`\nSuccessfully standardized interview questions in ${formattedFilesCount} files.`);
