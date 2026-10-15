const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Senior Engineer Design Course page', () => {
  const dir = 'docs/technical-knowledge/system-design';
  const docPath = `${dir}/senior-engineer-design-course.md`;
  const componentPath = 'src/components/SeniorDesignCourseDiagram.tsx';

  it('doc and diagram component exist', () => {
    assert.ok(fs.existsSync(docPath));
    assert.ok(fs.existsSync(componentPath));
  });

  it('is registered in sidebars.ts', () => {
    const sidebars = fs.readFileSync('sidebars.ts', 'utf8');
    assert.ok(sidebars.includes('technical-knowledge/system-design/senior-engineer-design-course'));
  });

  it('covers key concepts', () => {
    const content = fs.readFileSync(docPath, 'utf8').toLowerCase();
    for (const kw of ['idempotency-key', 'double booking', 'hold', 'outbox', 'saga', 'elasticsearch', 'shard by', '5-step framework']) {
      assert.ok(content.includes(kw), `Missing keyword: ${kw}`);
    }
  });

  it('imports and uses the diagram with the container class', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(content.includes("import SeniorDesignCourseDiagram from '@site/src/components/SeniorDesignCourseDiagram'"));
    const comp = fs.readFileSync(componentPath, 'utf8');
    assert.ok(comp.includes('interactive-diagram-container'));
  });

  it('relative markdown links resolve to existing files', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const links = [...content.matchAll(/\]\((\.[^)#]+\.md)\)/g)].map((m) => m[1]);
    assert.ok(links.length > 0);
    for (const l of links) {
      assert.ok(fs.existsSync(path.join(dir, l)), `Broken link: ${l}`);
    }
  });

  it('has no unescaped MDX expressions', () => {
    let cleaned = fs.readFileSync(docPath, 'utf8').replace(/^---[\s\S]*?---/, '');
    cleaned = cleaned.replace(/^import\s+.*$/gm, '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, 'code');
    assert.strictEqual(cleaned.match(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g), null);
  });
});
