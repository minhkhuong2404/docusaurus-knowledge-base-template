const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('CockroachDB Architecture & Distributed Consensus Test Suite', () => {
  const docPath = 'docs/technical-knowledge/system-design/cockroachdb-architecture.md';
  const sidebarsPath = 'sidebars.ts';

  it('cockroachdb-architecture.md must exist on disk and have comprehensive content', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 3000, `Doc file ${docPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('sidebars.ts must register cockroachdb-architecture under Distributed Workflows', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/system-design/cockroachdb-architecture'),
      'sidebars.ts must register technical-knowledge/system-design/cockroachdb-architecture'
    );
  });

  it('must contain essential CockroachDB architectural concepts and keywords', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredKeywords = [
      'Multi-Raft',
      'Hybrid Logical Clock',
      'Leaseholder',
      'Write Intent',
      'Parallel Commit',
      'Read Uncertainty',
      'Pebble',
      'MaxOffset',
      'Range',
      'Serializable',
      'Meta1',
      'Meta2',
      'Regional',
      'Changefeed',
      '40001'
    ];

    for (const keyword of requiredKeywords) {
      assert.ok(
        content.toLowerCase().includes(keyword.toLowerCase()),
        `Missing required keyword: "${keyword}" in ${docPath}`
      );
    }
  });

  it('must compile MDX with 0 undeclared runtime identifiers (AST safety)', () => {
    const content = fs.readFileSync(docPath, 'utf8');

    // Strip frontmatter
    let cleaned = content.replace(/^---[\s\S]*?---/, '');
    // Strip imports
    cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, '');
    // Strip fenced code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    // Strip inline code
    cleaned = cleaned.replace(/`[^`]+`/g, 'code');
    // Strip markdown links [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Strip LaTeX math blocks
    cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '');
    cleaned = cleaned.replace(/\$[^$]+\$/g, '');

    // Check for unescaped MDX JSX interpolation {var}
    const matches = cleaned.match(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g);
    assert.strictEqual(
      matches,
      null,
      `Found potential undeclared MDX expressions: ${matches ? matches.join(', ') : ''}`
    );
  });
});
