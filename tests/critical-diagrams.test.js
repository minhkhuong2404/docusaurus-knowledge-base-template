const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Critical Interactive Architecture Diagrams Suite', () => {
  const criticalDiagrams = [
    'CircuitBreakerDiagram.tsx',
    'AQSArchitectureDiagram.tsx',
    'CollectionsHierarchyDiagram.tsx',
    'KafkaArchitectureOverviewDiagram.tsx',
    'KafkaZeroCopyDiagram.tsx',
    'NetworkPacketEncapsulationDiagram.tsx',
    'OsOverviewDiagram.tsx',
    'BankingPaymentLifecycleDiagram.tsx',
    'VmDockerK8sComparisonDiagram.tsx',
    'FunctionalInterfacesFactoryDiagram.tsx',
  ];

  for (const filename of criticalDiagrams) {
    const filePath = `src/components/${filename}`;
    if (!fs.existsSync(filePath)) continue;

    it(`Diagram ${filename} should transpile cleanly`, () => {
      const code = transpileCode(filePath);
      assert.ok(code && code.length > 50, `Transpiled code for ${filename} must not be empty`);
    });

    it(`Diagram ${filename} should have 0 undeclared runtime identifiers`, () => {
      const undeclared = getUndeclaredIdentifiers(filePath);
      assert.deepStrictEqual(
        undeclared,
        [],
        `Diagram ${filename} has undeclared runtime identifiers: ${undeclared.join(', ')}`
      );
    });

    it(`Diagram ${filename} should have valid JSX character escaping (no raw > or })`, () => {
      const unescaped = validateJsxEntities(filePath);
      assert.deepStrictEqual(
        unescaped,
        [],
        `Diagram ${filename} contains raw unescaped JSX text which crashes SWC/Rspack: ${JSON.stringify(unescaped)}`
      );
    });

    it(`Diagram ${filename} must follow architectural layout guidelines`, () => {
      const source = fs.readFileSync(filePath, 'utf8');
      assert.ok(
        source.includes('interactive-diagram-container') || source.includes('className='),
        `${filename} must use proper interactive container styling`
      );
    });
  }
});
