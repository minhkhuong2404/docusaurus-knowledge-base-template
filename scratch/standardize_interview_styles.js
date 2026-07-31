const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/redis',
  'docs/technical-knowledge/git',
  'docs/technical-knowledge/networking'
];

let updatedCount = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Standardize "Interview Questions" section headers
    if (/##\s*(?:❓\s*)?Interview\s*Questions/i.test(content)) {
      let modified = false;

      // Ensure header is consistent "## Interview Questions" (or title header if it is the dedicated interview file)
      if (!file.includes('interview-questions.md')) {
        content = content.replace(/##\s*(?:❓\s*)?Interview\s*Questions.*/gi, '## Interview Questions');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Standardized interview header in: ${file}`);
        updatedCount++;
      }
    }
  });
});

console.log(`Updated ${updatedCount} interview sections across redis, git, and networking.`);
