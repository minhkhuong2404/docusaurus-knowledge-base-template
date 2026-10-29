const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const DOC = 'docs/technical-knowledge/kafka/streams/redis-external-state-offset-fencing.md';

describe('Kafka Streams + Redis Offset Fencing Documentation', () => {
  const content = fs.readFileSync(DOC, 'utf-8');

  it('must have frontmatter and be registered in sidebars.ts', () => {
    assert.ok(/\nid: redis-external-state-offset-fencing\n/.test(content));
    const sidebar = fs.readFileSync('sidebars.ts', 'utf-8');
    assert.ok(sidebar.includes("'technical-knowledge/kafka/streams/redis-external-state-offset-fencing'"));
  });

  it('must cover offset, partition, epoch fencing and lost-output re-emit', () => {
    for (const kw of ['murmur2', 'REEMIT', 'EVALSHA', 'epoch', 'RocksDB', 'Little', 'CROSSSLOT', 'noeviction']) {
      assert.ok(content.includes(kw), `missing keyword ${kw}`);
    }
  });

  it('must include the senior interview playbook with at least 3 traps', () => {
    assert.ok(content.includes('## 🧠 Senior/Staff Interview Playbook'));
    assert.ok((content.match(/#### Trap \d/g) || []).length >= 3);
    assert.ok(content.includes('| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |'));
  });

  it('must import an existing diagram component and have balanced fences', () => {
    const m = /from '@site\/src\/components\/([A-Za-z0-9]+)'/.exec(content);
    assert.ok(m && fs.existsSync(`src/components/${m[1]}.tsx`));
    assert.strictEqual((content.match(/^```/gm) || []).length % 2, 0);
  });
});
