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

    // Split lines and check if inside Interview Questions section
    const lines = content.split('\n');
    let inInterviewSection = false;

    const newLines = lines.map(line => {
      if (/^##\s*Interview\s*Questions/i.test(line) || file.includes('interview-questions.md')) {
        inInterviewSection = true;
      }

      if (inInterviewSection) {
        // Convert bold Q lines like `**Q1. Question**` or `**Q: Question**` into H3 headers `### Q1. Question` or `### Q: Question`
        // H3 headers automatically receive primary theme accent color styling in Docusaurus!
        if (/^\*\*(?:Q\d+\.|Q:|🔴)\s*(.*?)\*\*$/i.test(line.trim())) {
          modified = true;
          const qText = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
          return `### ${qText}`;
        }
      }

      return line;
    });

    if (modified) {
      fs.writeFileSync(file, newLines.join('\n'), 'utf8');
      console.log(`Updated Question headers to primary theme color (H3) in: ${file}`);
      totalFilesUpdated++;
    }
  });
});

console.log(`\nSuccessfully applied primary theme color (H3 headers) to questions across ${totalFilesUpdated} files.`);
