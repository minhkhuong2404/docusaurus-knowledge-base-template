const fs = require('fs');
const { execSync } = require('child_process');

const dirs = [
  'docs/technical-knowledge/redis',
  'docs/technical-knowledge/git',
  'docs/technical-knowledge/networking'
];

let totalInterviewSections = 0;

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Search for Interview Questions headings
    const matches = content.match(/##.*Interview.*/gi) || content.match(/#.*Interview.*/gi);
    if (matches || file.includes('interview')) {
      totalInterviewSections++;
      console.log(`Found Interview Section in: ${file}`);
      
      // Extract the interview questions format
      const lines = content.split('\n');
      const interviewStart = lines.findIndex(l => /Interview/i.test(l));
      if (interviewStart !== -1) {
        const snippet = lines.slice(interviewStart, interviewStart + 15).join('\n');
        console.log('--- Snippet ---');
        console.log(snippet);
        console.log('---------------\n');
      }
    }
  });
});

console.log(`Total Interview Files/Sections found: ${totalInterviewSections}`);
