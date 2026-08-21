/**
 * Service: googleSheetQuizService.ts
 * Single Source of Truth: Google Sheet
 * Spreadsheet ID: 17dxDS1dHnQ-dRe8H8N4Kztmy6pqK0KSMI6WFuN67spU
 */

export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: 'Java' | 'Spring Boot' | 'System Design';
}

export const SPREADSHEET_ID = '17dxDS1dHnQ-dRe8H8N4Kztmy6pqK0KSMI6WFuN67spU';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

export type QuizCategoryKey = 'java' | 'spring-boot' | 'system-design' | 'all';

export interface TabConfig {
  key: QuizCategoryKey;
  sheetName: string;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
}

export const QUIZ_TABS: Record<'java' | 'spring-boot' | 'system-design', TabConfig> = {
  java: {
    key: 'java',
    sheetName: 'Java',
    label: '☕ Java Quiz',
    shortLabel: 'Java',
    icon: '☕',
    color: '#f59e0b',
  },
  'spring-boot': {
    key: 'spring-boot',
    sheetName: 'Spring Boot',
    label: '🍃 Spring Boot Quiz',
    shortLabel: 'Spring Boot',
    icon: '🍃',
    color: '#4ade80',
  },
  'system-design': {
    key: 'system-design',
    sheetName: 'System Design',
    label: '🏗️ System Design Quiz',
    shortLabel: 'System Design',
    icon: '🏗️',
    color: '#a855f7',
  },
};

const CACHE_PREFIX = 'gsheet_quiz_cache_v2_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache

/**
 * Robust RFC 4180 compliant CSV parser that handles multi-line cells and quotes.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CRLF
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

function parseCorrectOption(val: string): number {
  const clean = (val || '').trim().toUpperCase();
  const mapping: Record<string, number> = {
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

function parseDifficulty(val: string): 'easy' | 'medium' | 'hard' {
  const clean = (val || '').trim().toLowerCase();
  if (clean.includes('easy')) return 'easy';
  if (clean.includes('hard')) return 'hard';
  return 'medium';
}

/**
 * Parse CSV rows into structured QuizQuestion array
 */
export function convertCsvRowsToQuestions(
  rows: string[][],
  categoryName: 'Java' | 'Spring Boot' | 'System Design'
): QuizQuestion[] {
  if (!rows || rows.length < 2) return [];

  // Find header indexes
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

  const questions: QuizQuestion[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const id = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : `${categoryName.toLowerCase()}-q-${i}`;
    const questionText = (qTextIdx !== -1 && row[qTextIdx]) ? row[qTextIdx].trim() : (row[3] ? row[3].trim() : '');
    if (!questionText) continue;

    const topic = (topicIdx !== -1 && row[topicIdx]) ? row[topicIdx].trim() : categoryName;
    const difficulty = parseDifficulty((diffIdx !== -1 && row[diffIdx]) ? row[diffIdx] : (row[2] || 'medium'));
    const codeSnippet = (codeIdx !== -1 && row[codeIdx] && row[codeIdx].trim().length > 0) ? row[codeIdx].trim() : undefined;

    const options: string[] = [
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
      codeSnippet,
      options: options.length >= 2 ? options : ['True', 'False'],
      correctOptionIndex: correctOptionIndex < options.length ? correctOptionIndex : 0,
      explanation,
      category: categoryName,
    });
  }

  return questions;
}

/**
 * Fetch a single tab's questions from Google Sheet with caching
 */
export async function fetchTabQuestions(
  tabKey: 'java' | 'spring-boot' | 'system-design',
  forceRefresh = false
): Promise<QuizQuestion[]> {
  const config = QUIZ_TABS[tabKey];
  const cacheKey = `${CACHE_PREFIX}${tabKey}`;

  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.data)) {
          return parsed.data;
        }
      }
    } catch {
      // ignore storage error
    }
  }

  const encodedSheetName = encodeURIComponent(config.sheetName);
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`;
  const webAppUrl = `https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec`;

  try {
    let rows: string[][] = [];

    try {
      const response = await fetch(sheetUrl, {
        method: 'GET',
        headers: { Accept: 'text/csv, text/plain, */*' },
      });

      if (response.ok) {
        const csvText = await response.text();
        if (csvText && !csvText.trim().startsWith('<!DOCTYPE html>')) {
          rows = parseCSV(csvText);
        }
      }
    } catch {
      // fallback to webAppUrl if gviz fails or needs auth
    }

    if (rows.length === 0) {
      try {
        const webAppResp = await fetch(webAppUrl, { method: 'GET' });
        if (webAppResp.ok) {
          const json = await webAppResp.json();
          if (json && json[config.sheetName] && Array.isArray(json[config.sheetName])) {
            rows = json[config.sheetName].map((r: any[]) => r.map((c) => String(c ?? '')));
          }
        }
      } catch {
        // ignore
      }
    }

    const questions = convertCsvRowsToQuestions(
      rows,
      config.shortLabel as 'Java' | 'Spring Boot' | 'System Design'
    );

    if (questions.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: questions,
          })
        );
      } catch {
        // ignore cache write error
      }
    }

    return questions;
  } catch (err) {
    console.error(`Error fetching quiz questions for ${tabKey}:`, err);
    // Try returning cached data even if expired on fetch failure
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
            return parsed.data;
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  }
}

/**
 * Fetch all questions across all 3 sheets
 */
export async function fetchAllTabQuestions(forceRefresh = false): Promise<{
  java: QuizQuestion[];
  'spring-boot': QuizQuestion[];
  'system-design': QuizQuestion[];
  all: QuizQuestion[];
}> {
  const [java, springBoot, systemDesign] = await Promise.all([
    fetchTabQuestions('java', forceRefresh),
    fetchTabQuestions('spring-boot', forceRefresh),
    fetchTabQuestions('system-design', forceRefresh),
  ]);

  return {
    java,
    'spring-boot': springBoot,
    'system-design': systemDesign,
    all: [...java, ...springBoot, ...systemDesign],
  };
}
