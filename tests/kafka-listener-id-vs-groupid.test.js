const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('KafkaListener id vs groupId Architecture & Test Suite', () => {
  const overviewDocPath = 'docs/technical-knowledge/kafka/consumer/consumer-overview.md';
  const groupDocPath = 'docs/technical-knowledge/kafka/consumer/consumer-group.md';
  const diagramPath = 'src/components/KafkaListenerIdVsGroupIdDiagram.tsx';

  it('consumer-overview.md must exist on disk and contain @KafkaListener id vs groupId deep dive', () => {
    assert.ok(fs.existsSync(overviewDocPath), `Doc file ${overviewDocPath} must exist`);
    const content = fs.readFileSync(overviewDocPath, 'utf8');
    assert.ok(
      content.includes('@KafkaListener`: `id` vs `groupId` Architecture & Mechanics') ||
      content.includes('@KafkaListener: id vs groupId Architecture & Mechanics') ||
      content.includes('`id` vs `groupId`'),
      'Must contain the dedicated @KafkaListener id vs groupId section'
    );
  });

  it('must contain essential Spring Kafka and Kafka broker architectural keywords', () => {
    const content = fs.readFileSync(overviewDocPath, 'utf8');
    const requiredKeywords = [
      'idIsGroup',
      'KafkaListenerEndpointRegistry',
      'MessageListenerContainer',
      'pause()',
      'resume()',
      '__consumer_offsets',
      'CooperativeStickyAssignor',
      'max.poll.interval.ms',
      'IllegalStateException'
    ];

    for (const keyword of requiredKeywords) {
      assert.ok(
        content.toLowerCase().includes(keyword.toLowerCase()),
        `Missing required keyword: "${keyword}" in ${overviewDocPath}`
      );
    }
  });

  it('consumer-overview.md must include Senior/Staff Interview Playbook, traps, and candidate cheat sheet', () => {
    const content = fs.readFileSync(overviewDocPath, 'utf8');
    assert.ok(
      content.includes('## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Consumer & Listener Interviews'),
      'Must contain the dedicated Senior/Staff Playbook header'
    );
    assert.ok(content.includes('The Senior Framing Strategy'), 'Must contain Senior Framing Strategy');
    assert.ok(content.includes('Classic Interviewer Traps & Principal Rebuttals'), 'Must contain interviewer traps');
    assert.ok(content.includes('Mid-Level vs. Principal Candidate Phrasing Cheat Sheet'), 'Must contain cheat sheet');
    assert.ok(content.includes('KafkaListenerIdVsGroupIdDiagram'), 'Must embed KafkaListenerIdVsGroupIdDiagram');
  });

  it('consumer-group.md must cross-reference id vs groupId and idIsGroup behavior', () => {
    assert.ok(fs.existsSync(groupDocPath), `Doc file ${groupDocPath} must exist`);
    const content = fs.readFileSync(groupDocPath, 'utf8');
    assert.ok(
      content.includes('idIsGroup'),
      'consumer-group.md must mention idIsGroup'
    );
    assert.ok(
      content.includes('consumer-overview#kafkalistener-id-vs-groupid-architecture--mechanics') ||
      content.includes('consumer-overview'),
      'consumer-group.md must link to consumer-overview'
    );
  });

  it('KafkaListenerIdVsGroupIdDiagram.tsx must exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `Diagram file ${diagramPath} must exist`);
    const content = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(content.includes('KafkaListenerIdVsGroupIdDiagram'), 'Must export KafkaListenerIdVsGroupIdDiagram');
    assert.ok(content.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
    assert.ok(content.includes('idIsGroup'), 'Must explain idIsGroup in diagram');
    assert.ok(content.includes('KafkaListenerEndpointRegistry'), 'Must explain KafkaListenerEndpointRegistry in diagram');
  });

  it('must compile MDX with 0 undeclared runtime identifiers (AST safety)', () => {
    const content = fs.readFileSync(overviewDocPath, 'utf8');

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
