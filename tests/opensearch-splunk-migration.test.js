const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadTsModule } = require('./helpers/transpileHelper');

const ROOT = path.resolve(__dirname, '..');

test('OpenSearchSplunkMigrationDiagram transpiles cleanly and renders all 4 telemetry modes', () => {
  const componentPath = path.join(ROOT, 'src/components/OpenSearchSplunkMigrationDiagram.tsx');
  assert.ok(fs.existsSync(componentPath), 'OpenSearchSplunkMigrationDiagram.tsx must exist');

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

  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/system-design/opensearch-splunk-migration-guide'"),
    'sidebars.ts must register technical-knowledge/system-design/opensearch-splunk-migration-guide'
  );
});
