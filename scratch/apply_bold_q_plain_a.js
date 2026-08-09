const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/redis',
  'docs/technical-knowledge/git',
  'docs/technical-knowledge/networking'
];

let totalFilesUpdated = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Process Q&A lines in Interview Questions section
    const lines = content.split('\n');
    let inInterviewSection = false;

    const newLines = lines.map(line => {
      if (/^##\s*Interview\s*Questions/i.test(line) || file.includes('interview-questions.md')) {
        inInterviewSection = true;
      }

      if (inInterviewSection) {
        // Match unbolded Q1. or Q: lines and turn them into **Q1. ...** or **Q: ...**
        if (/^(?:Q\d+\.|Q:)\s+/i.test(line) && !line.startsWith('**')) {
          modified = true;
          return `**${line.trim()}**`;
        }

        // Match answer lines starting with blockquote `> **...**` and unbold the answer text
        if (/^>\s*\*\*(?:Answer|Ans|A)?:\s*(.*?)\*\*/i.test(line)) {
          modified = true;
          const plainText = line.replace(/^>\s*\*\*(?:Answer|Ans|A)?:\s*(.*?)\*\*/i, '> $1');
          return plainText;
        }
      }

      return line;
    });

    if (modified) {
      fs.writeFileSync(file, newLines.join('\n'), 'utf8');
      console.log(`Updated Q&A bold styling in: ${file}`);
      totalFilesUpdated++;
    }
  });
});

console.log(`\nSuccessfully applied bold Q and plain non-bold A formatting across ${totalFilesUpdated} files.`);
