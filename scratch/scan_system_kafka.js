const fs = require('fs');
const { execSync } = require('child_process');

const scanFolder = (dir) => {
  const files = execSync(`find ${dir} -name "*.md"`)
    .toString()
    .trim()
    .split('\n')
    .sort();

  console.log(`=== Audit for ${dir} (${files.length} markdown files) ===\n`);

  files.forEach((f, idx) => {
    const content = fs.readFileSync(f, 'utf8');
    const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
    const title = titleMatch ? titleMatch[1] : f;
    
    const asciiArt = content.includes('┌') || content.includes('+---+') || content.includes('|');
    const mermaid = content.includes('```mermaid');
    const tags = content.match(/<[A-Z][a-zA-Z0-9]+/g) || [];
    const diagramTags = Array.from(new Set(tags)).filter(t => t.includes('Diagram'));

    console.log(`${idx + 1}. ${f}`);
    console.log(`   Title: ${title}`);
    console.log(`   Diagram Components: ${diagramTags.length > 0 ? '✅ ' + diagramTags.join(', ') : '⚠️ None'}`);
    console.log(`   Has ASCII/Mermaid: ASCII: ${asciiArt}, Mermaid: ${mermaid}`);
  });
};

scanFolder('docs/technical-knowledge/system-design');
console.log('\n----------------------------------------\n');
scanFolder('docs/technical-knowledge/kafka');
