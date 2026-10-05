const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Banking FinCrime & Fraud Detection Suite', () => {
  const diagramPath = 'src/components/BankingFinCrimeFraudDiagram.tsx';
  const fraudDocPath = 'docs/technical-knowledge/banking/fraud.md';

  it('BankingFinCrimeFraudDiagram.tsx should exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);
    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled diagram code must not be empty');
  });

  it('BankingFinCrimeFraudDiagram.tsx should have 0 undeclared runtime identifiers', () => {
    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Diagram has undeclared identifiers: ${undeclared.join(', ')}`
    );
  });

  it('BankingFinCrimeFraudDiagram.tsx should have valid JSX character escaping', () => {
    const unescaped = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(
      unescaped,
      [],
      `Diagram contains unescaped JSX text: ${JSON.stringify(unescaped)}`
    );
  });

  it('fraud.md must cover all critical FinCrime and Fraud detection topics', () => {
    assert.ok(fs.existsSync(fraudDocPath), 'fraud.md must exist');
    const content = fs.readFileSync(fraudDocPath, 'utf8');

    const expectedKeywords = [
      'BankingFinCrimeFraudDiagram',
      'Authorised Push Payment',
      'Account Takeover',
      'Money Mule',
      'Rapid Dissipation',
      'Synthetic Identity',
      'Behavioral Biometrics',
      'CAMARA',
      'SIM Swap',
      'Active Call',
      'Streaming Feature Store',
      'Redis',
      'Flink',
      'LightGBM',
      'Graph',
      'UK Payment Systems Regulator',
      'Scam-Safe Accord',
      'Suspicious Matter Report',
      'AUSTRAC',
      'FinCEN'
    ];

    for (const kw of expectedKeywords) {
      assert.ok(
        content.includes(kw),
        `fraud.md is missing expected concept: "${kw}"`
      );
    }
  });

  it('fraud.md must compile with 0 undeclared runtime identifiers in MDX (prevents k is not defined)', async () => {
    const mdx = require('@mdx-js/mdx');
    const remarkMath = (await import('remark-math')).default;
    const rehypeKatex = (await import('rehype-katex')).default;
    const babel = require('@babel/core');
    const traverse = require('@babel/traverse').default;

    const raw = fs.readFileSync(fraudDocPath, 'utf8');
    const withoutFm = raw.replace(/^---[\s\S]*?---/, '');
    const res = await mdx.compile(withoutFm, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }]]
    });

    const ast = babel.parseSync(String(res.value), {
      filename: 'doc.jsx',
      presets: ['@babel/preset-react']
    });

    const undeclared = [];
    traverse(ast, {
      Identifier(p) {
        if (
          p.isReferencedIdentifier() &&
          !p.scope.hasBinding(p.node.name) &&
          ![
            'React',
            '_jsx',
            '_jsxs',
            '_Fragment',
            '_components',
            'BankingFinCrimeFraudDiagram',
            'BankingFraudExceptionsDiagram'
          ].includes(p.node.name) &&
          !globalThis[p.node.name]
        ) {
          undeclared.push(p.node.name);
        }
      }
    });

    assert.deepStrictEqual(
      undeclared,
      [],
      `Document ${fraudDocPath} has undeclared runtime identifiers: ${undeclared.join(', ')}`
    );
  });
});
