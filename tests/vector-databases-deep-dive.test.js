const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Vector Databases & Comparative Deep Dive Test Suite', () => {
  const docPath = 'docs/technical-knowledge/database/vector-databases-deep-dive.md';
  const sidebarsPath = 'sidebars.ts';
  const indexDocPath = 'docs/technical-knowledge/database/index.md';
  const diagram1Path = 'src/components/VectorVsDatabasesDiagram.tsx';
  const diagram2Path = 'src/components/VectorHnswVsIvfDiagram.tsx';
  const diagram3Path = 'src/components/SweToAiEngineerEvolutionDiagram.tsx';
  const diagram4Path = 'src/components/VectorSystemDesignDiagram.tsx';

  it('vector-databases-deep-dive.md must exist on disk and have senior principal depth', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 8000, `Doc file ${docPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('sidebars.ts must register vector-databases-deep-dive under database Specialized category', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/database/vector-databases-deep-dive'),
      'sidebars.ts must register technical-knowledge/database/vector-databases-deep-dive'
    );
  });

  it('database/index.md must link to vector-databases-deep-dive', () => {
    const indexContent = fs.readFileSync(indexDocPath, 'utf8');
    assert.ok(
      indexContent.includes('vector-databases-deep-dive'),
      'database/index.md must link to vector-databases-deep-dive'
    );
  });

  it('must contain essential vector and comparative database keywords', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredKeywords = [
      'HNSW',
      'IVF-PQ',
      'Approximate Nearest Neighbor',
      'Curse of Dimensionality',
      'Cosine',
      'pgvector',
      'Relational',
      'Document',
      'Key-Value',
      'Graph',
      'AVX-512',
      'Product Quantization',
      'Pre-filtering',
      'OOM',
      'Software Engineer to AI Engineer',
      'Long-Term External Memory',
      'Reciprocal Rank Fusion'
    ];

    for (const keyword of requiredKeywords) {
      assert.ok(
        content.toLowerCase().includes(keyword.toLowerCase()),
        `Missing required keyword: "${keyword}" in ${docPath}`
      );
    }
  });

  it('interactive diagrams must exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagram1Path), `Diagram file ${diagram1Path} must exist`);
    assert.ok(fs.existsSync(diagram2Path), `Diagram file ${diagram2Path} must exist`);
    assert.ok(fs.existsSync(diagram3Path), `Diagram file ${diagram3Path} must exist`);
    assert.ok(fs.existsSync(diagram4Path), `Diagram file ${diagram4Path} must exist`);
    
    const content1 = fs.readFileSync(diagram1Path, 'utf8');
    const content2 = fs.readFileSync(diagram2Path, 'utf8');
    const content3 = fs.readFileSync(diagram3Path, 'utf8');
    const content4 = fs.readFileSync(diagram4Path, 'utf8');
    
    assert.ok(content1.includes('VectorVsDatabasesDiagram'), 'Must export VectorVsDatabasesDiagram');
    assert.ok(content2.includes('VectorHnswVsIvfDiagram'), 'Must export VectorHnswVsIvfDiagram');
    assert.ok(content3.includes('SweToAiEngineerEvolutionDiagram'), 'Must export SweToAiEngineerEvolutionDiagram');
    assert.ok(content4.includes('VectorSystemDesignDiagram'), 'Must export VectorSystemDesignDiagram');
    assert.ok(content1.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
    assert.ok(content2.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
    assert.ok(content3.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
    assert.ok(content4.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
  });

  it('must contain Senior/Staff Interview Playbook, classic traps, and candidate cheat sheet', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(
      content.includes('## 🧠 Senior/Staff Interview Playbook: How to Ace Vector Database & ANN System Design Interviews'),
      'Must contain the dedicated Senior/Staff Playbook header'
    );
    assert.ok(
      content.includes('VectorSystemDesignDiagram'),
      'Must embed VectorSystemDesignDiagram in document'
    );
    assert.ok(content.includes('The Senior Framing Strategy'), 'Must contain Senior Framing Strategy');
    assert.ok(content.includes('Classic Interviewer Traps & Principal Rebuttals'), 'Must contain interviewer traps');
    assert.ok(content.includes('Mid-Level vs. Principal Candidate Phrasing Cheat Sheet'), 'Must contain cheat sheet');
    assert.ok(content.includes('Roaring Bitsets') || content.includes('Bitset-Masked Single-Stage Traversal'), 'Must detail bitset traversal');
    assert.ok(content.includes('LSM-Tree Multi-Segment Architecture') || content.includes('MemTable'), 'Must detail LSM write path');
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
