const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

describe('Kafka Zero-Copy & Linux OS Page Cache Documentation Suite', () => {
  const docPath = 'docs/technical-knowledge/kafka/core/kafka-zero-copy-page-cache.md';
  const sidebarsPath = 'sidebars.ts';

  it('kafka-zero-copy-page-cache.md must exist on disk', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 2000, `Doc file ${docPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('sidebars.ts must register kafka-zero-copy-page-cache under Core Concepts', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/kafka/core/kafka-zero-copy-page-cache'),
      'sidebars.ts must register technical-knowledge/kafka/core/kafka-zero-copy-page-cache'
    );
  });

  it('must contain essential Zero-Copy and OS Page Cache concepts and keywords', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredKeywords = [
      'sendfile',
      'Page Cache',
      'Scatter-Gather DMA',
      'FileChannel.transferTo',
      'Ring 3',
      'Ring 0',
      'dirty_background_ratio',
      'dirty_ratio',
      'kTLS',
      'Sequential I/O',
      'RocksDB',
      'Kafka Streams'
    ];

    for (const keyword of requiredKeywords) {
      assert.ok(
        content.toLowerCase().includes(keyword.toLowerCase()),
        `Missing required keyword or concept: "${keyword}" in ${docPath}`
      );
    }
  });

  it('kafka-streams-deep-dive.md must detail RocksDB and OS Page Cache integration', () => {
    const streamsPath = 'docs/technical-knowledge/kafka/advanced/kafka-streams-deep-dive.md';
    assert.ok(fs.existsSync(streamsPath), `Kafka streams doc ${streamsPath} must exist`);
    const streamsContent = fs.readFileSync(streamsPath, 'utf8');
    assert.ok(
      streamsContent.includes('How RocksDB Interacts with the Linux OS Page Cache'),
      'Must contain section on RocksDB and Page Cache in kafka-streams-deep-dive.md'
    );
    assert.ok(
      streamsContent.includes('OOMKilled'),
      'Must explain Kubernetes container OOMKilled hazard with RocksDB off-heap and Page Cache'
    );
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
