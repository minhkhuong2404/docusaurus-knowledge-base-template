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

function assertCleanMdxInterpolations(docPath) {
  const content = fs.readFileSync(docPath, 'utf8');
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
    `Found potential undeclared MDX expressions in ${path.basename(docPath)}: ${
      matches ? matches.join(', ') : ''
    }`
  );
}

test('OpenSearchSplunkMigrationDiagram transpiles cleanly, has 0 undeclared identifiers, and renders all 4 telemetry modes', () => {
  const componentPath = path.join(ROOT, 'src/components/OpenSearchSplunkMigrationDiagram.tsx');
  assert.ok(fs.existsSync(componentPath), 'OpenSearchSplunkMigrationDiagram.tsx must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(componentPath),
    [],
    'OpenSearchSplunkMigrationDiagram.tsx must have 0 undeclared runtime identifiers'
  );
  assert.deepEqual(
    validateJsxEntities(componentPath),
    [],
    'OpenSearchSplunkMigrationDiagram.tsx must have 0 unescaped JSX characters'
  );

  const mod = loadTsModule(componentPath);
  const Diagram = mod.default;
  assert.equal(typeof Diagram, 'function', 'Default export must be a React component function');

  const modes = ['architecture', 'storage-engine', 'spl-to-ppl', 'tiered-ism'];
  for (const mode of modes) {
    const html = renderToStaticMarkup(React.createElement(Diagram, { initialMode: mode }));
    assert.ok(
      html.includes('interactive-diagram-container'),
      `Mode ${mode} must render inside .interactive-diagram-container`
    );
    if (mode !== 'spl-to-ppl') {
      assert.ok(
        html.includes('interactive-diagram-flowing-path'),
        `Mode ${mode} must render animated .interactive-diagram-flowing-path conduits`
      );
    } else {
      assert.ok(
        html.includes('Splunk SPL (Search Processing Language)') &&
          html.includes('OpenSearch PPL (Piped Processing Language'),
        'spl-to-ppl mode must render side-by-side Splunk SPL and OpenSearch PPL translation'
      );
    }
  }
});

test('OpenSearchBestPracticesDiagram transpiles cleanly, has 0 undeclared identifiers, and renders all 4 interactive usage modes with flowing arrows', () => {
  const componentPath = path.join(ROOT, 'src/components/OpenSearchBestPracticesDiagram.tsx');
  assert.ok(fs.existsSync(componentPath), 'OpenSearchBestPracticesDiagram.tsx must exist');

  assert.deepEqual(
    getUndeclaredIdentifiers(componentPath),
    [],
    'OpenSearchBestPracticesDiagram.tsx must have 0 undeclared runtime identifiers'
  );
  assert.deepEqual(
    validateJsxEntities(componentPath),
    [],
    'OpenSearchBestPracticesDiagram.tsx must have 0 unescaped JSX characters'
  );

  const mod = loadTsModule(componentPath);
  const Diagram = mod.default;
  assert.equal(typeof Diagram, 'function', 'Default export must be a React component function');

  const modes = ['query-execution', 'bulk-routing', 'schema-reindex', 'hybrid-knn'];
  for (const mode of modes) {
    const html = renderToStaticMarkup(React.createElement(Diagram, { initialMode: mode }));
    assert.ok(
      html.includes('interactive-diagram-container'),
      `Mode ${mode} must render inside .interactive-diagram-container`
    );
    assert.ok(
      html.includes('interactive-diagram-flowing-path'),
      `Mode ${mode} must render animated .interactive-diagram-flowing-path conduits`
    );
  }
});

test('opensearch-splunk-migration-guide.md is registered in sidebars.ts and covers Lucene internals, SPL-to-PPL, Data Prepper, ISM, and Senior Interview Playbook', () => {
  const docPath = path.join(
    ROOT,
    'docs/technical-knowledge/system-design/opensearch-splunk-migration-guide.md'
  );
  assert.ok(fs.existsSync(docPath), 'opensearch-splunk-migration-guide.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');

  const requiredTopics = [
    'Schema-on-Read',
    'Schema-on-Write',
    'Universal Forwarder',
    'OpenSearch Data Prepper',
    'Finite State Transducer',
    'DocValues',
    'BKD-Trees',
    'Segment Replication',
    'Piped Processing Language',
    'flat_object',
    'Compressed OOPs',
    'UltraWarm',
    'LogAnalyticsQueryService',
    '## 🧠 Senior/Staff Interview Playbook: How to Ace OpenSearch & Splunk Migration Interviews',
    '### 1. The Senior Framing Strategy (First 60 Seconds)',
    '### 2. Classic Interviewer Traps & Principal Rebuttals',
    '### 3. Mid-Level vs. Principal Candidate Cheat Sheet',
  ];

  for (const topic of requiredTopics) {
    assert.ok(
      content.includes(topic),
      `opensearch-splunk-migration-guide.md must include "${topic}"`
    );
  }

  assertCleanMdxInterpolations(docPath);

  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/system-design/opensearch-splunk-migration-guide'"),
    'sidebars.ts must register technical-knowledge/system-design/opensearch-splunk-migration-guide'
  );
});

test('opensearch-query-search-best-practices.md is registered in sidebars.ts and covers Filter Context, PIT + search_after, Aggregations, Hybrid k-NN Search, and Senior Interview Playbook', () => {
  const docPath = path.join(
    ROOT,
    'docs/technical-knowledge/system-design/opensearch-query-search-best-practices.md'
  );
  assert.ok(fs.existsSync(docPath), 'opensearch-query-search-best-practices.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');

  const requiredTopics = [
    'IndicesQueryCache',
    'Roaring Bitmap',
    'now-1h/m',
    'search_as_you_type',
    'Point-in-Time (PIT)',
    'search_after',
    'doc_count_error_upper_bound',
    'global_ordinals',
    'HyperLogLog++',
    'normalization-processor',
    'EffectiveOpenSearchQueryService',
    '## 🧠 Senior/Staff Interview Playbook: How to Ace OpenSearch Query & Search Optimization Interviews',
    '### 1. The Senior Framing Strategy (First 60 Seconds)',
    '### 2. Classic Interviewer Traps & Principal Rebuttals',
    '### 3. Mid-Level vs. Principal Candidate Cheat Sheet',
  ];

  for (const topic of requiredTopics) {
    assert.ok(
      content.includes(topic),
      `opensearch-query-search-best-practices.md must include "${topic}"`
    );
  }

  assertCleanMdxInterpolations(docPath);

  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/system-design/opensearch-query-search-best-practices'"),
    'sidebars.ts must register technical-knowledge/system-design/opensearch-query-search-best-practices'
  );
});

test('opensearch-indexing-schema-operations-guide.md is registered in sidebars.ts and covers Schema Design, Alias + Sliced _reindex, BulkIngester, UUIDv7, _routing, Watermarks, and Senior Interview Playbook', () => {
  const docPath = path.join(
    ROOT,
    'docs/technical-knowledge/system-design/opensearch-indexing-schema-operations-guide.md'
  );
  assert.ok(fs.existsSync(docPath), 'opensearch-indexing-schema-operations-guide.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');

  const requiredTopics = [
    'constant_keyword',
    'flat_object',
    'nested_objects.limit',
    '_reindex?slices=auto',
    'UUIDv7',
    'routing_partition_size',
    'ProductionOpenSearchBulkIndexer',
    'BulkIngester',
    '_cluster/allocation/explain',
    'read_only_allow_delete',
    '## 🧠 Senior/Staff Interview Playbook: How to Ace OpenSearch Schema, Indexing & Operations Interviews',
    '### 1. The Senior Framing Strategy (First 60 Seconds)',
    '### 2. Classic Interviewer Traps & Principal Rebuttals',
    '### 3. Mid-Level vs. Principal Candidate Cheat Sheet',
  ];

  for (const topic of requiredTopics) {
    assert.ok(
      content.includes(topic),
      `opensearch-indexing-schema-operations-guide.md must include "${topic}"`
    );
  }

  assertCleanMdxInterpolations(docPath);

  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/system-design/opensearch-indexing-schema-operations-guide'"),
    'sidebars.ts must register technical-knowledge/system-design/opensearch-indexing-schema-operations-guide'
  );
});
