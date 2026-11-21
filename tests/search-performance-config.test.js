const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Local Search Index Performance Configuration', () => {
  const configPath = path.join(process.cwd(), 'docusaurus.config.ts');
  const configSource = fs.readFileSync(configPath, 'utf8');

  it('disables expensive per-keystroke Lunr fuzzy matching', () => {
    assert.match(
      configSource,
      /fuzzyMatchingDistance\s*:\s*0/,
      'docusaurus.config.ts must set fuzzyMatchingDistance: 0 for fast local search'
    );
  });

  it('excludes non-prose DOM bloat (diagrams, code blocks, KaTeX, Mermaid) from search indexing', () => {
    const requiredSelectors = [
      '.interactive-diagram-container',
      'pre',
      '.prism-code',
      '.katex',
      '.mermaid',
    ];
    for (const selector of requiredSelectors) {
      assert.ok(
        configSource.includes(`'${selector}'`) || configSource.includes(`"${selector}"`),
        `ignoreCssSelectors must exclude ${selector}`
      );
    }
  });

  it('excludes auto-generated leetcode-companywise CSV table pages from the global search index', () => {
    assert.ok(
      configSource.includes('leetcode-companywise'),
      'ignoreFiles must exclude technical-knowledge/dsa/leetcode-companywise/'
    );
  });
});
