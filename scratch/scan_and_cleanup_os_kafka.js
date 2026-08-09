const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/operating-systems',
  'docs/technical-knowledge/kafka'
];

let totalFilesCleaned = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // 1. Remove empty diagram headings like `## Architecture Diagram` or `### Visual Diagram` followed immediately by another heading or `---`
    const emptyDiagramHeadingRegex = /#{1,4}\s*(?:Visual\s*Diagram|Architecture\s*Diagram|Flowchart|Diagram|Visual Overview)\s*\n+(?=#{1,4}|\n*---|(?:\s*<[A-Z]))/gi;
    if (emptyDiagramHeadingRegex.test(content)) {
      content = content.replace(emptyDiagramHeadingRegex, '');
      modified = true;
    }

    // 2. Remove residual text references pointing to old ASCII diagrams
    const oldDiagramRefRegex = /(?:\(see diagram below\)|\[see flowchart above\]|\[refer to diagram below\]|\(refer to diagram above\))/gi;
    if (oldDiagramRefRegex.test(content)) {
      content = content.replace(oldDiagramRefRegex, '');
      modified = true;
    }

    // 3. Remove consecutive duplicate horizontal dividers (`---\n\n---`)
    if (/\n---\n\s*---\n/.test(content)) {
      content = content.replace(/\n---\n\s*---\n/g, '\n---\n');
      modified = true;
    }

    // 4. Clean up excess whitespace (3+ consecutive blank lines)
    if (/\n{3,}/.test(content)) {
      content = content.replace(/\n{3,}/g, '\n\n');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Cleaned up empty headings & references in: ${file}`);
      totalFilesCleaned++;
    }
  });
});

console.log(`\nScan complete! Cleaned up unnecessary headings and references in ${totalFilesCleaned} files.`);
