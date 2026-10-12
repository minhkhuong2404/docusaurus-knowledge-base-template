const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = 'docs/technical-knowledge/api-design';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

describe('API Design & OpenAPI Knowledge Base Integrity', () => {
  const files = walk(ROOT).filter((f) => f.endsWith('.md'));
  const sidebar = fs.readFileSync('sidebars.ts', 'utf-8');

  it('should contain the expected set of topic pages', () => {
    assert.ok(files.length >= 11, `Expected >= 11 api-design pages, found ${files.length}`);
  });

  for (const file of files) {
    const rel = file.replace(/^docs\//, '').replace(/\.md$/, '');

    it(`${rel} should have valid frontmatter and be registered in sidebars.ts`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      assert.ok(content.startsWith('---\n'), 'must start with frontmatter');
      assert.ok(/\nid: [a-z0-9-]+\n/.test(content), 'must define id');
      assert.ok(/\ntitle: .+\n/.test(content), 'must define title');
      assert.ok(sidebar.includes(`'${rel}'`), `${rel} must be registered in sidebars.ts`);
    });

    it(`${rel} should resolve all relative .md links and component imports`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const linkRe = /\]\((\.{1,2}\/[^)#]+)\)/g;
      let m;
      while ((m = linkRe.exec(content)) !== null) {
        assert.ok(m[1].endsWith('.md'), `relative link must end with .md: ${m[1]}`);
        assert.ok(fs.existsSync(path.resolve(path.dirname(file), m[1])), `broken link: ${m[1]}`);
      }
      const impRe = /from '@site\/src\/components\/([A-Za-z0-9]+)'/g;
      while ((m = impRe.exec(content)) !== null) {
        assert.ok(fs.existsSync(`src/components/${m[1]}.tsx`), `missing component ${m[1]}`);
      }
    });

    it(`${rel} should not have unbalanced code fences`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const fences = (content.match(/^```/gm) || []).length;
      assert.strictEqual(fences % 2, 0, 'code fences must be balanced');
    });
  }
});
