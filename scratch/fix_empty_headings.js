const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/operating-systems',
  'docs/technical-knowledge/kafka'
];

let fixedCount = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('###') || trimmed.startsWith('####')) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') {
          j++;
        }
        // If the heading is followed immediately by a horizontal rule `---` with no content, skip it
        if (j < lines.length && lines[j].trim() === '---') {
          console.log(`Removing empty sub-heading in ${file} at line ${i + 1}: "${trimmed}"`);
          modified = true;
          i = j; // skip heading and rule
          continue;
        }
      }
      newLines.push(line);
    }

    if (modified) {
      fs.writeFileSync(file, newLines.join('\n'), 'utf8');
      fixedCount++;
    }
  });
});

console.log(`\nRemoved empty sub-headings from ${fixedCount} files.`);
