const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const babel = require('@babel/core');

const DOC = 'docs/technical-knowledge/kafka/advanced/kafka-log-compaction.md';
const DIAGRAM = 'src/components/KafkaLogCompactionDiagram.tsx';

describe('Kafka Cleanup Policy & Log Compaction Documentation & Invariants', () => {
  const content = fs.readFileSync(DOC, 'utf-8');

  it('must have valid frontmatter and be registered in sidebars.ts', () => {
    assert.ok(/\nid: kafka-log-compaction\n/.test(content), 'Missing id frontmatter');
    assert.ok(/\ntitle: "?Kafka Cleanup Policy & Log Compaction/.test(content), 'Missing title frontmatter');
    const sidebar = fs.readFileSync('sidebars.ts', 'utf-8');
    assert.ok(
      sidebar.includes("'technical-knowledge/kafka/advanced/kafka-log-compaction'"),
      'Must be registered in sidebars.ts'
    );
  });

  it('must cover engine mechanics, configurations, and core invariants', () => {
    const requiredKeywords = [
      'cleanup.policy',
      'log.cleanup.policy',
      'log.cleaner.enable',
      'log.cleaner.threads',
      'log.cleaner.dedupe.buffer.size',
      'SkimpyOffsetMap',
      'min.cleanable.dirty.ratio',
      'delete.retention.ms',
      'compact,delete',
      'active segment',
      'tombstone'
    ];
    for (const kw of requiredKeywords) {
      assert.ok(
        content.toLowerCase().includes(kw.toLowerCase()),
        `Document is missing essential keyword: ${kw}`
      );
    }
  });

  it('must include the Senior/Staff Interview Playbook with at least 5 classic traps and cheat sheet', () => {
    assert.ok(
      content.includes('## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Cleanup Policy & Log Compaction Interviews'),
      'Missing Senior/Staff Interview Playbook header'
    );
    const trapMatches = content.match(/#### Trap \d/g) || [];
    assert.ok(trapMatches.length >= 5, `Expected at least 5 traps, found ${trapMatches.length}`);
    assert.ok(
      content.includes('| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |'),
      'Missing candidate comparison table'
    );
  });

  it('must import KafkaLogCompactionDiagram and have balanced code fences', () => {
    assert.ok(
      content.includes("import KafkaLogCompactionDiagram from '@site/src/components/KafkaLogCompactionDiagram';"),
      'Missing component import'
    );
    assert.ok(fs.existsSync(DIAGRAM), `Diagram component does not exist at ${DIAGRAM}`);
    const fences = content.match(/^```/gm) || [];
    assert.strictEqual(fences.length % 2, 0, `Unbalanced code fences found (${fences.length})`);
  });

  it('must transpile KafkaLogCompactionDiagram.tsx cleanly with Babel and have 0 syntax errors', () => {
    const diagramCode = fs.readFileSync(DIAGRAM, 'utf-8');
    assert.doesNotThrow(() => {
      babel.transformSync(diagramCode, {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        filename: 'KafkaLogCompactionDiagram.tsx'
      });
    }, 'Failed to transpile KafkaLogCompactionDiagram.tsx');
  });
});
