const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('find docs/technical-knowledge/networking -name "*.md"')
  .toString()
  .trim()
  .split('\n')
  .sort();

console.log(`=== Networking Folder Audit (${files.length} markdown files) ===\n`);

files.forEach((f, idx) => {
  const content = fs.readFileSync(f, 'utf8');
  const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
  const title = titleMatch ? titleMatch[1] : f;
  
  const tags = content.match(/<[A-Z][a-zA-Z0-9]+/g) || [];
  const diagramTags = Array.from(new Set(tags)).filter(t => t.includes('Diagram'));

  console.log(`${idx + 1}. ${f}`);
  console.log(`   Title: ${title}`);
  if (diagramTags.length > 0) {
    console.log(`   Status: ✅ ${diagramTags.join(', ')}`);
  } else {
    console.log(`   Status: ⚠️ No Diagram Component`);
  }
});
