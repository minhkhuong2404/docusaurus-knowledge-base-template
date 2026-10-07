const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Database Re-Sharding Strategies Documentation & Diagram Test Suite', () => {
  const docPath = 'docs/technical-knowledge/system-design/database-resharding-strategies.md';
  const shardingDocPath = 'docs/technical-knowledge/system-design/sharding-partitioning.md';
  const sidebarsPath = 'sidebars.ts';
  const diagramPath = 'src/components/ReshardingStrategiesDiagram.tsx';

  it('database-resharding-strategies.md must exist on disk and have comprehensive content', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 3000, `Doc file ${docPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('sharding-partitioning.md must link to database-resharding-strategies.md', () => {
    const shardingContent = fs.readFileSync(shardingDocPath, 'utf8');
    assert.ok(
      shardingContent.includes('database-resharding-strategies.md'),
      'sharding-partitioning.md must link to database-resharding-strategies.md'
    );
  });

  it('sidebars.ts must register database-resharding-strategies under Scalability Patterns', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/system-design/database-resharding-strategies'),
      'sidebars.ts must register technical-knowledge/system-design/database-resharding-strategies'
    );
  });

  it('must contain essential re-sharding approaches, pros and cons, and technical keywords', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredKeywords = [
      'Dual-Write',
      'Historical Backfill',
      'Change Data Capture',
      'Consistent Hashing',
      'Range Splits',
      'Pros',
      'Cons',
      'Trade-Off Matrix',
      'Debezium',
      'Virtual Node'
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

  it('ReshardingStrategiesDiagram.tsx must exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `Diagram file ${diagramPath} must exist`);
    const code = fs.readFileSync(diagramPath, 'utf8');
    const babel = require('@babel/core');
    const transformed = babel.transformSync(code, {
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ],
      filename: 'ReshardingStrategiesDiagram.tsx'
    });
    assert.ok(transformed.code.length > 500, 'Transpiled code must not be empty');
  });
});
