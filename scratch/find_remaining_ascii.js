const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/redis',
  'docs/technical-knowledge/git',
  'docs/technical-knowledge/networking'
];

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/```[\s\S]*?```/g) || [];
    
    matches.forEach(block => {
      // Check if codeblock is ASCII diagram (contains +---+ or ---> or ==> or |   |)
      if (block.includes('+---+') || block.includes('--->') || block.includes('===>') || block.includes('|  ') || block.includes('..>')) {
        console.log(`Found static ASCII diagram block in: ${file}`);
      }
    });
  });
});
