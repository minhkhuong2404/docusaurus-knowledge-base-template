/**
 * Script: scripts/sync_quiz_snapshot.js
 * Downloads live questions from Google Sheet and saves a pre-bundled snapshot to static/data/quizzes.json
 * This guarantees 0ms load times for all visitors on their very first visit without network delays.
 */

const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '17dxDS1dHnQ-dRe8H8N4Kztmy6pqK0KSMI6WFuN67spU';

const TABS = [
  { key: 'java', sheetName: 'Java', label: 'Java' },
  { key: 'spring-boot', sheetName: 'Spring Boot', label: 'Spring Boot' },
  { key: 'system-design', sheetName: 'System Design', label: 'System Design' },
];

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal);
      if (currentRow.some((c) => c.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal);
    if (currentRow.some((c) => c.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseCorrectOption(val) {
  const clean = (val || '').trim().toUpperCase();
  const mapping = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    OPTIONA: 0,
    OPTIONB: 1,
    OPTIONC: 2,
    OPTIOND: 3,
  };
  if (clean in mapping) return mapping[clean];
  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 4) return num - 1;
    if (num >= 0 && num <= 3) return num;
  }
  return 0;
}

function parseDifficulty(val) {
  const clean = (val || '').trim().toLowerCase();
  if (clean.includes('easy')) return 'easy';
  if (clean.includes('hard')) return 'hard';
  return 'medium';
}

function convertCsvRowsToQuestions(rows, categoryName) {
  if (!rows || rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
  const idIdx = header.indexOf('id');
  const topicIdx = header.indexOf('topic');
  const diffIdx = header.indexOf('difficulty');
  const qTextIdx = header.indexOf('questiontext') !== -1 ? header.indexOf('questiontext') : header.indexOf('question');
  const codeIdx = header.indexOf('codesnippet') !== -1 ? header.indexOf('codesnippet') : header.indexOf('code');
  const optAIdx = header.indexOf('optiona') !== -1 ? header.indexOf('optiona') : 5;
  const optBIdx = header.indexOf('optionb') !== -1 ? header.indexOf('optionb') : 6;
  const optCIdx = header.indexOf('optionc') !== -1 ? header.indexOf('optionc') : 7;
  const optDIdx = header.indexOf('optiond') !== -1 ? header.indexOf('optiond') : 8;
  const correctIdx = header.indexOf('correctoption') !== -1 ? header.indexOf('correctoption') : 9;
  const explIdx = header.indexOf('explanation') !== -1 ? header.indexOf('explanation') : 10;

  const questions = [];
  const seenTexts = new Set();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const id = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : `${categoryName.toLowerCase()}-q-${i}`;
    const questionText = (qTextIdx !== -1 && row[qTextIdx]) ? row[qTextIdx].trim() : (row[3] ? row[3].trim() : '');
    if (!questionText) continue;

    const normText = questionText.toLowerCase().replace(/\s+/g, ' ');
    if (seenTexts.has(normText)) continue;
    seenTexts.add(normText);

    const topic = (topicIdx !== -1 && row[topicIdx]) ? row[topicIdx].trim() : categoryName;
    const difficulty = parseDifficulty((diffIdx !== -1 && row[diffIdx]) ? row[diffIdx] : (row[2] || 'medium'));
    const codeSnippet = (codeIdx !== -1 && row[codeIdx] && row[codeIdx].trim().length > 0) ? row[codeIdx].trim() : undefined;

    const options = [
      (optAIdx !== -1 && row[optAIdx]) ? row[optAIdx].trim() : '',
      (optBIdx !== -1 && row[optBIdx]) ? row[optBIdx].trim() : '',
      (optCIdx !== -1 && row[optCIdx]) ? row[optCIdx].trim() : '',
      (optDIdx !== -1 && row[optDIdx]) ? row[optDIdx].trim() : '',
    ].filter(Boolean);

    const correctOptionIndex = parseCorrectOption((correctIdx !== -1 && row[correctIdx]) ? row[correctIdx] : '0');
    const explanation = (explIdx !== -1 && row[explIdx]) ? row[explIdx].trim() : 'No explanation provided.';

    questions.push({
      id,
      topic,
      difficulty,
      questionText,
      ...(codeSnippet ? { codeSnippet } : {}),
      options: options.length >= 2 ? options : ['True', 'False'],
      correctOptionIndex: correctOptionIndex < options.length ? correctOptionIndex : 0,
      explanation,
      category: categoryName,
    });
  }

  return questions;
}

async function fetchTab(tab) {
  const encoded = encodeURIComponent(tab.sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
  console.log(`⏳ Fetching tab "${tab.sheetName}" from Google Sheet...`);

  const resp = await fetch(url, { headers: { Accept: 'text/csv, text/plain, */*' } });
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${tab.sheetName}: HTTP ${resp.status}`);
  }

  const csvText = await resp.text();
  const rows = parseCSV(csvText);
  const questions = convertCsvRowsToQuestions(rows, tab.label);
  console.log(`✅ Parsed ${questions.length} questions for "${tab.sheetName}".`);
  return questions;
}

async function run() {
  console.log('🚀 Starting Google Sheet Quiz Snapshot Export...');
  const result = {
    timestamp: Date.now(),
    counts: {},
    data: {},
  };

  let totalQuestions = 0;

  for (const tab of TABS) {
    try {
      const qs = await fetchTab(tab);
      result.data[tab.key] = qs;
      result.counts[tab.key] = qs.length;
      totalQuestions += qs.length;
    } catch (err) {
      console.error(`❌ Error fetching ${tab.key}:`, err.message);
      result.data[tab.key] = [];
      result.counts[tab.key] = 0;
    }
  }

  result.counts.all = totalQuestions;

  const outputDir = path.join(__dirname, '..', 'static', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'quizzes.json');
  fs.writeFileSync(outputPath, JSON.stringify(result), 'utf-8');

  const stats = fs.statSync(outputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 Quiz snapshot successfully generated at ${outputPath}`);
  console.log(`📦 File Size: ${sizeMb} MB | Total Questions: ${totalQuestions.toLocaleString()}`);
  console.log(`   - Java: ${result.counts.java?.toLocaleString() || 0}`);
  console.log(`   - Spring Boot: ${result.counts['spring-boot']?.toLocaleString() || 0}`);
  console.log(`   - System Design: ${result.counts['system-design']?.toLocaleString() || 0}`);
}

run().catch((e) => {
  console.error('Fatal error during snapshot generation:', e);
  process.exit(1);
});
