const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/redis',
  'docs/technical-knowledge/git',
  'docs/technical-knowledge/networking'
];

let totalFilesProcessed = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    if (/##\s*Interview\s*Questions/i.test(content) || file.includes('interview-questions.md')) {
      let modified = false;

      // Ensure question text is bold (e.g. **Q1. ...**) or (### 🔴 ...)
      // Replace any answer blockquote text `> **Answer:** text` or `> **...**` with plain non-bold blockquote `> text`
      content = content.replace(/(>\s*)\*\*(?:Answer|Ans|A):\s*\*\*([^\n]+)/gi, (match, prefix, ansText) => {
        modified = true;
        return `${prefix}${ansText.trim()}`;
      });

      // Ensure answers in blockquotes do not have whole-blockquote bolding `> **text**`
      content = content.replace(/(>\s*)\*\*([^*]+)\*\*\s*$/gm, (match, prefix, bodyText) => {
        // If it's not a question line, strip the surrounding bold
        if (!bodyText.startsWith('Q') && !bodyText.startsWith('Question')) {
          modified = true;
          return `${prefix}${bodyText.trim()}`;
        }
        return match;
      });

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Re-formatted Q&A styling in: ${file}`);
        totalFilesProcessed++;
      }
    }
  });
});

console.log(`\nSuccessfully reapplied Q&A styling to ${totalFilesProcessed} files across redis, git, and networking.`);
