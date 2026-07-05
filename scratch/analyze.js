const fs = require('fs');
const path = require('path');

function parseTSQuestions(filePath, varName) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/export interface QuizQuestion[\s\S]+?\n\}/, '');
  content = content.replace(/: QuizQuestion\[\]/g, '');
  content = content.replace(new RegExp(`export const ${varName}`), `module.exports.${varName}`);
  
  const tempPath = filePath.replace('.ts', '_temp.js');
  fs.writeFileSync(tempPath, content);
  let data;
  try {
    data = require(tempPath);
  } finally {
    fs.unlinkSync(tempPath);
  }
  return data[varName];
}

const javaQuestions = parseTSQuestions(path.join(__dirname, '../src/data/java-quiz-questions.ts'), 'javaQuestions');
const springQuestions = parseTSQuestions(path.join(__dirname, '../src/data/spring-boot-quiz-questions.ts'), 'springBootQuestions');

console.log('--- JAVA QUESTIONS ---');
console.log('Total:', javaQuestions.length);
const javaTopics = {};
const javaDiff = {};
javaQuestions.forEach(q => {
  javaTopics[q.topic] = (javaTopics[q.topic] || 0) + 1;
  javaDiff[q.difficulty] = (javaDiff[q.difficulty] || 0) + 1;
});
console.log('Topics:', javaTopics);
console.log('Difficulties:', javaDiff);

console.log('\n--- SPRING BOOT QUESTIONS ---');
console.log('Total:', springQuestions.length);
const springTopics = {};
const springDiff = {};
springQuestions.forEach(q => {
  springTopics[q.topic] = (springTopics[q.topic] || 0) + 1;
  springDiff[q.difficulty] = (springDiff[q.difficulty] || 0) + 1;
});
console.log('Topics:', springTopics);
console.log('Difficulties:', springDiff);

// Check for uniqueness of questionText
const javaUniqueTexts = new Set(javaQuestions.map(q => q.questionText));
const springUniqueTexts = new Set(springQuestions.map(q => q.questionText));
console.log('\nJava unique questions:', javaUniqueTexts.size, 'out of', javaQuestions.length);
console.log('Spring Boot unique questions:', springUniqueTexts.size, 'out of', springQuestions.length);

// Print first 5 and last 5 questions of each
console.log('\nSample Java Questions (first 3):');
console.log(JSON.stringify(javaQuestions.slice(0, 3), null, 2));
console.log('\nSample Java Questions (last 3):');
console.log(JSON.stringify(javaQuestions.slice(-3), null, 2));
