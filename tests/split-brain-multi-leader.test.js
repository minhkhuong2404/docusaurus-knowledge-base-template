const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Split-Brain & Multi-Leader Divergence Documentation & Diagram Test Suite', () => {
  const docPath = 'docs/technical-knowledge/system-design/split-brain-multi-leader-divergence.md';
  const sidebarsPath = 'sidebars.ts';
  const diagramPath = 'src/components/SplitBrainMultiLeaderDiagram.tsx';

  it('split-brain-multi-leader-divergence.md must exist on disk and have comprehensive content', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 3000, `Doc file ${docPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('sidebars.ts must register split-brain-multi-leader-divergence under Distributed Workflows', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/system-design/split-brain-multi-leader-divergence'),
      'sidebars.ts must register technical-knowledge/system-design/split-brain-multi-leader-divergence'
    );
  });

  it('must contain essential Split-Brain, Dual Primary, and Divergence keywords', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredKeywords = [
      'Split-Brain',
      'Dual Primary',
      'Multi-Leader',
      'Quorum',
      'Fencing Token',
      'STONITH',
      'Last-Write-Wins',
      'CRDT',
      'Version Vectors'
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

  it('SplitBrainMultiLeaderDiagram.tsx must exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `Diagram file ${diagramPath} must exist`);
    const code = fs.readFileSync(diagramPath, 'utf8');
    const babel = require('@babel/core');
    const transformed = babel.transformSync(code, {
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ],
      filename: 'SplitBrainMultiLeaderDiagram.tsx'
    });
    assert.ok(transformed.code.length > 500, 'Transpiled code must not be empty');
  });
});
