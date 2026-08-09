const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/operating-systems',
  'docs/technical-knowledge/kafka'
];

let emptyHeadingCount = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#')) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') {
          j++;
        }
        if (j < lines.length && (lines[j].trim().startsWith('#') || lines[j].trim() === '---')) {
          // Exception for H1 title followed by component or divider
          if (!line.startsWith('# ')) {
            console.log(`Potential empty heading in ${file} at line ${i + 1}: "${line}" followed by "${lines[j].trim()}"`);
            emptyHeadingCount++;
          }
        }
      }
    }
  });
});

console.log(`\nFound ${emptyHeadingCount} potential empty headings.`);
