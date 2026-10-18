const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const {
  loadTsModule,
  getUndeclaredIdentifiers,
  validateJsxEntities,
} = require('./helpers/transpileHelper');

const ROOT = path.resolve(__dirname, '..');

test('ConcurrencySixteenConceptsDiagram transpiles cleanly, has 0 undeclared identifiers, and renders all 4 telemetry modes', () => {
  const componentPath = path.join(ROOT, 'src/components/ConcurrencySixteenConceptsDiagram.tsx');
  assert.ok(fs.existsSync(componentPath), 'ConcurrencySixteenConceptsDiagram.tsx must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(componentPath),
    [],
    'ConcurrencySixteenConceptsDiagram.tsx must have 0 undeclared runtime identifiers'
  );
  assert.deepEqual(
    validateJsxEntities(componentPath),
    [],
    'ConcurrencySixteenConceptsDiagram.tsx must have 0 unescaped JSX characters'
  );

  const mod = loadTsModule(componentPath);
  const Diagram = mod.default;
  assert.equal(typeof Diagram, 'function', 'Default export must be a React component function');

  const modes = ['hierarchy', 'race-condition', 'deadlock', 'fencing-tokens'];
  for (const mode of modes) {
    const html = renderToStaticMarkup(React.createElement(Diagram, { initialMode: mode }));
    assert.ok(
      html.includes('interactive-diagram-container'),
      `Mode ${mode} must render inside .interactive-diagram-container`
    );
    if (mode !== 'hierarchy') {
      assert.ok(
        html.includes('interactive-diagram-flowing-path'),
        `Mode ${mode} must render animated .interactive-diagram-flowing-path conduits`
      );
    }
  }
});

test('16-concurrency-concepts-master-guide.md is registered in sidebars.ts, has clean MDX, and covers all 16 concepts plus Senior Playbook', () => {
  const docPath = path.join(
    ROOT,
    'docs/technical-knowledge/system-design/16-concurrency-concepts-master-guide.md'
  );
  assert.ok(fs.existsSync(docPath), '16-concurrency-concepts-master-guide.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');

  // Verify substantial depth
  assert.ok(content.length > 10000, 'Guide must be thorough and comprehensive (>10,000 characters)');

  // Verify all 16 concepts are covered
  const requiredConcepts = [
    'Processes vs. Threads',
    'Concurrency vs. Parallelism',
    'Race Conditions',
    'Critical Sections',
    'Locks / Mutexes',
    'Deadlocks',
    'Coffman',
    'Semaphores',
    'Compare-And-Swap',
    'Thread Pools',
    'Little\'s Law',
    'Event Loops',
    'Database Locking',
    'Pessimistic Locking',
    'Optimistic Locking',
    'Distributed Locks',
    'Fencing Tokens',
    'Martin Kleppmann',
    'Idempotency',
    'Kitchen Analogy',
    'Four Physical Costs',
    'HikariCP',
    'parallelStream',
    'ForkJoinPool.commonPool',
    'pidstat -w',
  ];

  for (const concept of requiredConcepts) {
    assert.ok(
      content.includes(concept),
      `16-concurrency-concepts-master-guide.md must include concept/keyword: "${concept}"`
    );
  }

  // Verify Senior Playbook structure
  const requiredPlaybookSections = [
    '## 🧠 Senior/Staff Interview Playbook: How to Ace Concurrency & Locking Interviews',
    '### 1. The Senior Framing Strategy (First 60 Seconds)',
    '### 2. Classic Interviewer Traps & Principal Rebuttals',
    '### 3. Mid-Level vs. Principal Candidate Cheat Sheet',
  ];

  for (const section of requiredPlaybookSections) {
    assert.ok(
      content.includes(section),
      `16-concurrency-concepts-master-guide.md must include playbook section: "${section}"`
    );
  }

  // Verify clean MDX (no accidental JSX interpolations outside of code/math)
  let cleaned = content.replace(/^---[\s\S]*?---/, '');
  cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, 'code');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '');
  cleaned = cleaned.replace(/\$[^$]+\$/g, '');

  const matches = cleaned.match(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g);
  assert.strictEqual(
    matches,
    null,
    `Found potential undeclared MDX expressions: ${matches ? matches.join(', ') : ''}`
  );

  // Verify sidebar registration
  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/system-design/16-concurrency-concepts-master-guide'"),
    'sidebars.ts must register technical-knowledge/system-design/16-concurrency-concepts-master-guide'
  );
});

test('concurrency-async-threading-models.md is registered in sidebars.ts, has clean MDX, and covers the 4 dimensions, 4 thread costs, case studies and Senior Playbook', () => {
  const docPath = path.join(
    ROOT,
    'docs/technical-knowledge/system-design/concurrency-async-threading-models.md'
  );
  assert.ok(fs.existsSync(docPath), 'concurrency-async-threading-models.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');

  // Verify substantial depth
  assert.ok(content.length > 10000, 'Document must be comprehensive (>10,000 characters)');

  // Verify core concepts from the Substack post & concurrency fundamentals
  const requiredKeywords = [
    'Sync vs Async',
    'Blocking vs Non-blocking',
    'Concurrency vs Parallelism',
    'Async vs Multi-threading',
    'Một Đầu Bếp Đảo 5 Nồi',
    'Bốn Chi Phí Vật Lý Của Một Platform Thread',
    '-Xss1m',
    'clone()',
    'pidstat -w',
    'top -H',
    'jcmd',
    'HikariCP',
    'parallelStream()',
    'ForkJoinPool.commonPool()',
    'Virtual Threads',
  ];

  for (const kw of requiredKeywords) {
    assert.ok(
      content.includes(kw),
      `concurrency-async-threading-models.md must include keyword: "${kw}"`
    );
  }

  // Verify Senior Playbook structure
  const requiredPlaybookSections = [
    '## 🧠 Senior/Staff Interview Playbook: How to Ace Concurrency & Threading Model Interviews',
    '### 1. The Senior Framing Strategy (First 60 Seconds)',
    '### 2. Classic Interviewer Traps & Principal Rebuttals',
    '### 3. Mid-Level vs. Principal Candidate Cheat Sheet',
  ];

  for (const section of requiredPlaybookSections) {
    assert.ok(
      content.includes(section),
      `concurrency-async-threading-models.md must include playbook section: "${section}"`
    );
  }

  // Verify clean MDX (no accidental JSX interpolations outside of code/math)
  let cleaned = content.replace(/^---[\s\S]*?---/, '');
  cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, 'code');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '');
  cleaned = cleaned.replace(/\$[^$]+\$/g, '');

  const matches = cleaned.match(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g);
  assert.strictEqual(
    matches,
    null,
    `Found potential undeclared MDX expressions: ${matches ? matches.join(', ') : ''}`
  );

  // Verify sidebar registration
  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/system-design/concurrency-async-threading-models'"),
    'sidebars.ts must register technical-knowledge/system-design/concurrency-async-threading-models'
  );
});

