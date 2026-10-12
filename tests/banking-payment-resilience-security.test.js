const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Banking Payment Resilience & Security Suite', () => {
  const diagramPath = 'src/components/BankingPaymentResilienceSecurityDiagram.tsx';
  const idempotencyDocPath = 'docs/technical-knowledge/banking/idempotency.md';
  const securityDocPath = 'docs/technical-knowledge/banking/payment_security.md';
  const sidebarPath = 'sidebars.ts';

  it('BankingPaymentResilienceSecurityDiagram.tsx should exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);
    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled diagram code must not be empty');
  });

  it('BankingPaymentResilienceSecurityDiagram.tsx should have 0 undeclared runtime identifiers', () => {
    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Diagram has undeclared identifiers: ${undeclared.join(', ')}`
    );
  });

  it('BankingPaymentResilienceSecurityDiagram.tsx should have valid JSX character escaping', () => {
    const unescaped = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(
      unescaped,
      [],
      `Diagram contains unescaped JSX text: ${JSON.stringify(unescaped)}`
    );
  });

  it('idempotency.md must contain all core resilience concepts', () => {
    assert.ok(fs.existsSync(idempotencyDocPath), 'idempotency.md must exist');
    const content = fs.readFileSync(idempotencyDocPath, 'utf8');

    // Check core concepts requested by user
    assert.ok(content.includes('Idempotency'), 'Must cover idempotency');
    assert.ok(content.includes('Deduplication'), 'Must cover deduplication');
    assert.ok(content.includes('Retriable'), 'Must cover retriable classification');
    assert.ok(content.includes('Lost Payment'), 'Must cover preventing lost payment');
    assert.ok(content.includes('Transactional Outbox'), 'Must cover Transactional Outbox pattern');
    assert.ok(content.includes('Reverse Inquiry'), 'Must cover Reverse Inquiry');
    assert.ok(content.includes('Reconciliation'), 'Must cover reconciliation');
    assert.ok(content.includes('BankingPaymentResilienceSecurityDiagram'), 'Must embed interactive diagram');
  });

  it('payment_security.md must contain both client and internal security concepts', () => {
    assert.ok(fs.existsSync(securityDocPath), 'payment_security.md must exist');
    const content = fs.readFileSync(securityDocPath, 'utf8');

    // Check client-facing security
    assert.ok(content.includes('Mutual TLS') || content.includes('mTLS'), 'Must cover mTLS');
    assert.ok(content.includes('RFC 9421') || content.includes('HTTP Message Signatures'), 'Must cover HTTP signatures');
    assert.ok(content.includes('Replay'), 'Must cover anti-replay defense');
    assert.ok(content.includes('DPoP'), 'Must cover DPoP token binding');
    assert.ok(content.includes('Dynamic Linking') || content.includes('PSD2'), 'Must cover dynamic linking / SCA');

    // Check internal banking security
    assert.ok(content.includes('Zero Trust') || content.includes('SPIFFE'), 'Must cover Zero Trust / SPIFFE');
    assert.ok(content.includes('HSM') || content.includes('Hardware Security Module'), 'Must cover HSM');
    assert.ok(content.includes('Tokenization Vault') || content.includes('PCI-DSS'), 'Must cover Tokenization Vault');
    assert.ok(content.includes('Maker-Checker') || content.includes('Four-Eyes'), 'Must cover Maker-Checker dual control');
    assert.ok(content.includes('WORM') || content.includes('Audit Trail'), 'Must cover WORM / immutable audit logging');
    assert.ok(content.includes('BankingPaymentResilienceSecurityDiagram'), 'Must embed interactive diagram');
  });

  it('sidebars.ts must register all banking documents with 0 omissions', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(
      sidebarContent.includes('technical-knowledge/banking/idempotency'),
      'sidebars.ts must include idempotency doc'
    );
    assert.ok(
      sidebarContent.includes('technical-knowledge/banking/payment_security'),
      'sidebars.ts must include payment_security doc'
    );
    assert.ok(
      sidebarContent.includes('technical-knowledge/banking/payment_hub'),
      'sidebars.ts must include payment_hub doc'
    );
  });

  it('banking markdown docs must have ZERO undeclared runtime identifiers (prevents k is not defined)', async () => {
    const mdx = require('@mdx-js/mdx');
    const remarkMath = (await import('remark-math')).default;
    const rehypeKatex = (await import('rehype-katex')).default;
    const babel = require('@babel/core');
    const traverse = require('@babel/traverse').default;

    for (const docFile of [securityDocPath, idempotencyDocPath]) {
      const raw = fs.readFileSync(docFile, 'utf8');
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
            !['React', '_jsx', '_jsxs', '_Fragment', '_components'].includes(p.node.name) &&
            !globalThis[p.node.name]
          ) {
            undeclared.push(p.node.name);
          }
        }
      });

      assert.deepStrictEqual(
        undeclared,
        [],
        `Document ${docFile} has undeclared runtime identifiers: ${undeclared.join(', ')}`
      );
    }
  });
});
