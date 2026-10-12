const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Data-Driven vs Event-Driven Architecture Test Suite', () => {
  const docPath = 'docs/technical-knowledge/system-design/data-driven-vs-event-driven.md';
  const diagramPath = 'src/components/DataDrivenVsEventDrivenDiagram.tsx';
  const sidebarsPath = 'sidebars.ts';
  const introPath = 'docs/technical-knowledge/system-design/intro.md';

  it('data-driven-vs-event-driven.md must exist and contain substantial senior-level content', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 5000, `Doc file ${docPath} must be comprehensive (found ${stats.size} bytes)`);

    const content = fs.readFileSync(docPath, 'utf8');
    const lines = content.split('\n');
    assert.ok(lines.length > 200, `Doc must have > 200 lines (found ${lines.length})`);
  });

  it('DataDrivenVsEventDrivenDiagram.tsx must exist with telemetry dark styling and required exports', () => {
    assert.ok(fs.existsSync(diagramPath), `Diagram component ${diagramPath} must exist`);
    const content = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(content.includes('export default function DataDrivenVsEventDrivenDiagram'), 'Must export default component');
    assert.ok(content.includes('interactive-diagram-container'), 'Must use interactive-diagram-container class');
    assert.ok(content.includes('#090b14'), 'Must apply cyber telemetry dark container background #090b14');
  });

  it('sidebars.ts must register data-driven-vs-event-driven under Distributed Workflows', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/system-design/data-driven-vs-event-driven'),
      'sidebars.ts must register technical-knowledge/system-design/data-driven-vs-event-driven'
    );
  });

  it('intro.md must link to data-driven-vs-event-driven', () => {
    const introContent = fs.readFileSync(introPath, 'utf8');
    assert.ok(
      introContent.includes('/technical-knowledge/system-design/data-driven-vs-event-driven'),
      'intro.md must contain link to data-driven-vs-event-driven'
    );
  });

  it('must cover critical architectural paradigms and SitePoint comparative concepts', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredConcepts = [
      'Data-Driven',
      'Event-Driven',
      'ACID',
      'Eventual Consistency',
      'Transactional Outbox',
      'Change Data Capture',
      'Debezium',
      'Dual-Write',
      'CQRS',
      'Temporal Coupling',
      'Polling',
      'Kafka',
      'Write-Ahead Log',
      'Decision Framework'
    ];

    for (const concept of requiredConcepts) {
      assert.ok(
        content.toLowerCase().includes(concept.toLowerCase()),
        `Missing critical concept: "${concept}" in ${docPath}`
      );
    }
  });

  it('diagram component must import correctly in markdown without syntax anomalies', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(
      content.includes("import DataDrivenVsEventDrivenDiagram from '@site/src/components/DataDrivenVsEventDrivenDiagram';"),
      'Must contain proper JSX component import'
    );
    assert.ok(
      content.includes('<DataDrivenVsEventDrivenDiagram'),
      'Must contain JSX component usage tag'
    );
  });
});
