const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const {
  loadTsModule,
  transpileCode,
  getUndeclaredIdentifiers,
  validateJsxEntities,
} = require('./helpers/transpileHelper');

const ROOT = path.resolve(__dirname, '..');

test('TechGlossaryFlashcards.tsx transpiles cleanly, has 0 undeclared identifiers, and renders correctly', () => {
  const componentPath = path.join(ROOT, 'src/components/TechGlossaryFlashcards.tsx');
  assert.ok(fs.existsSync(componentPath), 'TechGlossaryFlashcards.tsx must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(componentPath),
    [],
    'TechGlossaryFlashcards.tsx must have 0 undeclared runtime identifiers'
  );
  assert.deepEqual(
    validateJsxEntities(componentPath),
    [],
    'TechGlossaryFlashcards.tsx must have 0 unescaped JSX characters'
  );

  const mod = loadTsModule(componentPath);
  const Component = mod.default;
  assert.equal(typeof Component, 'function', 'Default export must be a React component function');

  const html = renderToStaticMarkup(React.createElement(Component));
  assert.ok(
    html.includes('interactive-diagram-container'),
    'Must render inside .interactive-diagram-container for dark telemetry styling'
  );
  assert.ok(
    html.includes('Technical English &amp; Flashcard Arena') || html.includes('Technical English & Flashcard Arena'),
    'Must render header title'
  );
  assert.ok(
    html.includes('tgf-card-scene'),
    'Must render 3D flashcard scene container'
  );
  assert.ok(
    html.includes('Listen Pronunciation'),
    'Must include pronunciation audio button'
  );
});



test('Tech English dedicated tab page exists, transpiles cleanly, and is registered in docusaurus.config.ts navbar', () => {
  // Verify docusaurus.config.ts navbar tab
  const configPath = path.join(ROOT, 'docusaurus.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  assert.ok(
    configContent.includes("to: '/tech-english'") && configContent.includes("label: 'Tech English'"),
    "docusaurus.config.ts navbar must include Tech English tab item with to: '/tech-english'"
  );

  // Verify page existence and AST scope safety
  const pagePath = path.join(ROOT, 'src/pages/tech-english/index.tsx');
  assert.ok(fs.existsSync(pagePath), 'src/pages/tech-english/index.tsx must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(pagePath),
    [],
    'src/pages/tech-english/index.tsx must have 0 undeclared runtime identifiers'
  );
  assert.deepEqual(
    validateJsxEntities(pagePath),
    [],
    'src/pages/tech-english/index.tsx must have 0 unescaped JSX characters'
  );

  // Transpile cleanly
  assert.doesNotThrow(() => {
    transpileCode(pagePath);
  }, 'src/pages/tech-english/index.tsx must transpile cleanly without syntax errors');

  // Verify page structure and content
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  assert.ok(
    pageContent.includes('tech-english-page-container'),
    'Must render container with .tech-english-page-container class'
  );
  assert.ok(
    pageContent.includes('Tech English Hub & Flashcard Arena'),
    'Must render hero title'
  );
  assert.ok(
    pageContent.includes('🎴 Luyện Từ Vựng & Quiz') && pageContent.includes('🔤 Từ Viết Tắt & Acronyms'),
    'Must render streamlined main navigation tabs without redundant duplicate bars'
  );
  assert.ok(
    pageContent.includes('PRONUNCIATION_TRAPS') && pageContent.includes('CONFUSION_PAIRS'),
    'Must include pronunciation traps and confusion pairs datasets'
  );

  // Verify light and dark theme gradient rules in custom.css for both hub headings
  const customCss = fs.readFileSync(path.join(ROOT, 'src/css/custom.css'), 'utf8');
  assert.ok(
    customCss.includes('[data-theme="light"] .tech-english-page-container'),
    'custom.css must include light theme overrides for tech-english-page-container'
  );
  assert.ok(
    customCss.includes('[data-theme="dark"] .teh-hero-title') &&
      customCss.includes('[data-theme="light"] .teh-hero-title'),
    'custom.css must include gradient rules for .teh-hero-title in both dark and light themes'
  );
  assert.ok(
    customCss.includes('[data-theme="dark"] .hub-hero-title') &&
      customCss.includes('[data-theme="light"] .hub-hero-title'),
    'custom.css must include gradient rules for .hub-hero-title in both dark and light themes'
  );

  const hubPageContent = fs.readFileSync(path.join(ROOT, 'src/pages/hub/index.tsx'), 'utf8');
  const arcadePageContent = fs.readFileSync(path.join(ROOT, 'src/pages/arcade/index.tsx'), 'utf8');
  assert.ok(
    hubPageContent.includes('hub-hero-title') &&
      hubPageContent.includes("WebkitBackgroundClip: 'text'") &&
      pageContent.includes("WebkitBackgroundClip: 'text'") &&
      arcadePageContent.includes('arcade-hero-badge') &&
      arcadePageContent.includes('arcade-hero-title') &&
      customCss.includes('[data-theme="light"] .arcade-hero-badge'),
    'Hub, Tech English, and Arcade hero headers must include badges and gradient background-clip text styling'
  );
  assert.ok(
    customCss.includes('[data-theme="light"] .tech-english-page-container .tgf-dict-table') &&
      customCss.includes('[data-theme="light"] .tech-english-page-container .teh-traps-table') &&
      customCss.includes('[data-theme="light"] .tech-english-page-container .teh-playbook-table') &&
      customCss.includes('[data-theme="light"] .tech-english-page-container .tgf-arena-container'),
    'custom.css must include anti-glare light theme overrides for all tables and arena cards in Tech English page'
  );
});

test('techEnglishVocabularyData.ts has comprehensive dataset with 500+ terms across all 7 domains', () => {
  const dataFilePath = path.join(ROOT, 'src/data/techEnglishVocabularyData.ts');
  assert.ok(fs.existsSync(dataFilePath), 'src/data/techEnglishVocabularyData.ts must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(dataFilePath),
    [],
    'src/data/techEnglishVocabularyData.ts must have 0 undeclared runtime identifiers'
  );

  const mod = loadTsModule(dataFilePath);
  const data = mod.TECH_VOCABULARY_DATA;
  assert.ok(Array.isArray(data), 'TECH_VOCABULARY_DATA must be an array');
  assert.ok(data.length >= 500, `Expected at least 500 terms, found ${data.length}`);

  const requiredCategories = [
    'system-design',
    'database',
    'os-concurrency',
    'networking',
    'java-jvm',
    'security',
    'devops',
  ];

  const categoriesFound = new Set();
  const ids = new Set();

  data.forEach((term, idx) => {
    assert.ok(term.id && typeof term.id === 'string', `Term at index ${idx} must have string id`);
    assert.ok(!ids.has(term.id), `Duplicate term ID found: ${term.id}`);
    ids.add(term.id);

    assert.ok(term.term && typeof term.term === 'string', `Term ${term.id} must have title string`);
    assert.ok(term.phonetic && term.phonetic.startsWith('/'), `Term ${term.id} must have valid IPA phonetic`);
    assert.ok(term.pos, `Term ${term.id} must have part of speech`);
    assert.ok(requiredCategories.includes(term.category), `Term ${term.id} must have valid category`);
    categoriesFound.add(term.category);

    assert.ok(term.vnMeaning && term.vnMeaning.length > 5, `Term ${term.id} must have Vietnamese meaning`);
    assert.ok(term.vnDefinition && term.vnDefinition.length > 20, `Term ${term.id} must have detailed Vietnamese definition`);
    assert.ok(term.analogy && term.analogy.length > 10, `Term ${term.id} must have intuitive analogy`);
    assert.ok(Array.isArray(term.collocations) && term.collocations.length > 0, `Term ${term.id} must have collocations array`);
    assert.ok(term.interviewTip && term.interviewTip.length > 15, `Term ${term.id} must have senior interview tip`);
  });

  requiredCategories.forEach((cat) => {
    assert.ok(categoriesFound.has(cat), `Category '${cat}' must be represented in the dataset`);
  });
});

test('techAcronymsData.ts has comprehensive dataset with 120+ technical acronyms', () => {
  const acronymsFilePath = path.join(ROOT, 'src/data/techAcronymsData.ts');
  assert.ok(fs.existsSync(acronymsFilePath), 'src/data/techAcronymsData.ts must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(acronymsFilePath),
    [],
    'src/data/techAcronymsData.ts must have 0 undeclared runtime identifiers'
  );

  const mod = loadTsModule(acronymsFilePath);
  const data = mod.TECH_ACRONYMS_DATA;
  assert.ok(Array.isArray(data), 'TECH_ACRONYMS_DATA must be an array');
  assert.ok(data.length >= 120, `Expected at least 120 acronyms, found ${data.length}`);

  const requiredCategories = [
    'system-design',
    'database',
    'os-concurrency',
    'networking',
    'java-jvm',
    'security',
    'devops',
  ];

  const categoriesFound = new Set();
  const ids = new Set();

  data.forEach((item, idx) => {
    assert.ok(item.id && typeof item.id === 'string', `Acronym at index ${idx} must have string id`);
    assert.ok(!ids.has(item.id), `Duplicate acronym ID found: ${item.id}`);
    ids.add(item.id);

    assert.ok(item.acronym && typeof item.acronym === 'string', `Acronym ${item.id} must have acronym text`);
    assert.ok(item.fullForm && typeof item.fullForm === 'string', `Acronym ${item.id} must have fullForm`);
    assert.ok(item.pronunciation && typeof item.pronunciation === 'string', `Acronym ${item.id} must have pronunciation`);
    assert.ok(requiredCategories.includes(item.category), `Acronym ${item.id} must have valid category`);
    categoriesFound.add(item.category);

    assert.ok(item.meaning && item.meaning.length > 15, `Acronym ${item.id} must have detailed Vietnamese meaning`);
    assert.ok(item.productionTip && item.productionTip.length > 15, `Acronym ${item.id} must have production tip`);
  });

  requiredCategories.forEach((cat) => {
    assert.ok(categoriesFound.has(cat), `Category '${cat}' must be represented in the acronyms dataset`);
  });
});


