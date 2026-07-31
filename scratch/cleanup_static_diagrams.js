const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/redis',
  'docs/technical-knowledge/git',
  'docs/technical-knowledge/networking'
];

let totalCleaned = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check if the file contains interactive diagram components
    const hasInteractiveDiagram = /<[A-Z][a-zA-Z0-9]*Diagram/g.test(content);

    if (hasInteractiveDiagram) {
      // 1. Remove ```mermaid ... ``` blocks if present
      if (content.includes('```mermaid')) {
        content = content.replace(/```mermaid[\s\S]*?```/g, '');
        modified = true;
      }

      // 2. Remove ASCII art blocks (code blocks containing box drawing characters ┌ │ └ ─ ├ ┤ ▲ ▼ ➔ ◄ ───►)
      const asciiCodeBlockRegex = /```[a-z]*\n[\s\S]*?[┌│└─├┤▲▼➔◄►┬┴┼][\s\S]*?```/g;
      if (asciiCodeBlockRegex.test(content)) {
        content = content.replace(asciiCodeBlockRegex, '');
        modified = true;
      }
    }

    if (modified) {
      // Clean up triple empty lines
      content = content.replace(/\n{3,}/g, '\n\n');
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Cleaned static diagrams from: ${file}`);
      totalCleaned++;
    }
  });
});

console.log(`\nCleanup complete! Cleaned static ASCII/Mermaid blocks from ${totalCleaned} files across redis, git, and networking.`);
