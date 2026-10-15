const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Resilience Patterns for Payments & Ticketing Suite', () => {
  const docPath = 'docs/technical-knowledge/system-design/resilience-patterns-payments-ticketing.md';
  const componentPath = 'src/components/DistributedResiliencePaymentsTicketingDiagram.tsx';
  const sidebarsPath = 'sidebars.ts';

  it('Markdown documentation file should exist and have comprehensive content (>250 lines)', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const content = fs.readFileSync(docPath, 'utf8');
    const lines = content.split('\n').length;
    assert.ok(lines >= 250, `Doc file must have at least 250 lines of senior-level content, got ${lines}`);
  });

  it('Markdown documentation should cover all critical resilience patterns', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredPatterns = [
      'Idempotency',
      'Try-Confirm-Cancel',
      'Timeout Reaper',
      'Virtual Waiting Room',
      'SKIP LOCKED',
      'Bulkhead',
      'Adaptive Concurrency',
      'Transactional Outbox',
      'Debezium',
      'Saga',
      'Full Jitter',
      'Dead-Letter Queue',
      'Dual-Entry',
    ];
    for (const term of requiredPatterns) {
      assert.ok(
        content.toLowerCase().includes(term.toLowerCase()),
        `Documentation must cover pattern: "${term}"`
      );
    }
  });

  it('Markdown documentation should embed DistributedResiliencePaymentsTicketingDiagram', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(
      content.includes('<DistributedResiliencePaymentsTicketingDiagram />'),
      'Doc must embed the <DistributedResiliencePaymentsTicketingDiagram /> component'
    );
  });

  it('Sidebar configuration should register resilience-patterns-payments-ticketing', () => {
    const sidebarContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarContent.includes("'technical-knowledge/system-design/resilience-patterns-payments-ticketing'"),
      'sidebars.ts must register technical-knowledge/system-design/resilience-patterns-payments-ticketing'
    );
  });

  it('DistributedResiliencePaymentsTicketingDiagram component should exist', () => {
    assert.ok(fs.existsSync(componentPath), `Component ${componentPath} must exist`);
  });

  it('DistributedResiliencePaymentsTicketingDiagram should transpile cleanly', () => {
    const transpiled = transpileCode(componentPath);
    assert.ok(transpiled && transpiled.length > 50, 'Transpilation should succeed');
  });

  it('DistributedResiliencePaymentsTicketingDiagram should have 0 undeclared runtime identifiers', () => {
    const undeclared = getUndeclaredIdentifiers(componentPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Component must not have undeclared variables: ${undeclared.join(', ')}`
    );
  });

  it('DistributedResiliencePaymentsTicketingDiagram should have valid JSX entities with no raw unescaped angles', () => {
    const jsxErrors = validateJsxEntities(componentPath);
    assert.deepStrictEqual(
      jsxErrors,
      [],
      `Component must have no JSX entity errors: ${JSON.stringify(jsxErrors)}`
    );
  });

  it('Related doc inventory-reservation-system.md should cross-link to resilience-patterns-payments-ticketing', () => {
    const inventoryContent = fs.readFileSync('docs/technical-knowledge/system-design/inventory-reservation-system.md', 'utf8');
    assert.ok(
      inventoryContent.includes('resilience-patterns-payments-ticketing'),
      'inventory-reservation-system.md must cross-link to resilience-patterns-payments-ticketing'
    );
  });
});
