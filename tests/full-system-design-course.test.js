const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Full System Design Master Course Test Suite', () => {
  const docPath = 'docs/technical-knowledge/system-design/full-system-design-course.md';
  const diagramPath = 'src/components/SystemDesignCourseFullDiagram.tsx';
  const sidebarsPath = 'sidebars.ts';
  const introPath = 'docs/technical-knowledge/system-design/intro.md';

  it('full-system-design-course.md must exist and contain deep production-grade course content', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 8000, `Doc file ${docPath} must be comprehensive (found ${stats.size} bytes)`);

    const content = fs.readFileSync(docPath, 'utf8');
    const lines = content.split('\n');
    assert.ok(lines.length > 250, `Course document must have > 250 lines (found ${lines.length})`);
  });

  it('SystemDesignCourseFullDiagram.tsx must exist with telemetry dark styling and required exports', () => {
    assert.ok(fs.existsSync(diagramPath), `Diagram component ${diagramPath} must exist`);
    const content = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(content.includes('export default function SystemDesignCourseFullDiagram'), 'Must export default component');
    assert.ok(content.includes('interactive-diagram-container'), 'Must use interactive-diagram-container class');
    assert.ok(content.includes('#090b14'), 'Must apply cyber telemetry dark container background #090b14');
  });

  it('sidebars.ts must register full-system-design-course under Fundamentals', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/system-design/full-system-design-course'),
      'sidebars.ts must register technical-knowledge/system-design/full-system-design-course'
    );
  });

  it('intro.md must feature a direct link to full-system-design-course', () => {
    const introContent = fs.readFileSync(introPath, 'utf8');
    assert.ok(
      introContent.includes('/technical-knowledge/system-design/full-system-design-course'),
      'intro.md must contain link to full-system-design-course'
    );
  });

  it('must cover all primary video course modules and architectural concepts', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredConcepts = [
      'Single Server',
      'RAM',
      'CPU',
      'IOPS',
      'SPOF',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'Graph',
      'Index-Free Adjacency',
      'Vertical Scaling',
      'Horizontal Scaling',
      'Layer 4',
      'Layer 7',
      'Round Robin',
      'Consistent Hashing',
      'Liveness',
      'Readiness',
      'Idempotency',
      'Cursor',
      'TCP',
      'UDP',
      '3-Way Handshake',
      'HTTP/3',
      'QUIC',
      'REST',
      'GraphQL',
      'DataLoader',
      'gRPC',
      'Authentication',
      'Authorization',
      'JWT',
      'Refresh',
      'WAF',
      'CDN',
      'Cache-Aside',
      'Cache Stampede'
    ];

    for (const concept of requiredConcepts) {
      assert.ok(
        content.toLowerCase().includes(concept.toLowerCase()),
        `Missing required course concept: "${concept}" in ${docPath}`
      );
    }
  });

  it('diagram component must import cleanly into markdown without syntax anomalies', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(
      content.includes("import SystemDesignCourseFullDiagram from '@site/src/components/SystemDesignCourseFullDiagram';"),
      'Must contain proper JSX component import'
    );
    assert.ok(
      content.includes('<SystemDesignCourseFullDiagram />'),
      'Must contain JSX component tag usage'
    );
  });
});
