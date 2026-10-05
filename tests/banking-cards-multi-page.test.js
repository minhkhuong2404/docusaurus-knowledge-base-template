const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Banking Cards Multi-Page Architecture Suite', () => {
  const cardPages = [
    {
      path: 'docs/technical-knowledge/banking/cards.md',
      sidebarId: 'technical-knowledge/banking/cards',
      expectedKeywords: ['4-Party', '3-Party', 'BankingCardPaymentFlowDiagram', 'card_anatomy_emv', 'card_iso8583']
    },
    {
      path: 'docs/technical-knowledge/banking/card_anatomy_emv.md',
      sidebarId: 'technical-knowledge/banking/card_anatomy_emv',
      expectedKeywords: ['ISO/IEC 7812', 'Luhn', 'ARQC', 'ARPC', 'DDA', 'CDA', 'APDU']
    },
    {
      path: 'docs/technical-knowledge/banking/card_iso8583.md',
      sidebarId: 'technical-knowledge/banking/card_iso8583',
      expectedKeywords: ['ISO 8583', 'AS 2805', 'MTI', 'Bitmap', 'DE 11', 'DE 52', 'DE 55']
    },
    {
      path: 'docs/technical-knowledge/banking/card_clearing_settlement.md',
      sidebarId: 'technical-knowledge/banking/card_clearing_settlement',
      expectedKeywords: ['Single-Message', 'Dual-Message', 'BASE II', 'IPM', 'Merchant Discount Rate', 'Interchange++']
    },
    {
      path: 'docs/technical-knowledge/banking/card_tokenization_3ds.md',
      sidebarId: 'technical-knowledge/banking/card_tokenization_3ds',
      expectedKeywords: ['Network Tokenization', 'DPAN', 'Apple Pay', '3-D Secure', 'Liability Shift', 'PCI-DSS']
    },
    {
      path: 'docs/technical-knowledge/banking/card_disputes_lcr.md',
      sidebarId: 'technical-knowledge/banking/card_disputes_lcr',
      expectedKeywords: ['Chargeback', 'Arbitration', 'Compelling Evidence', 'Least-Cost Routing', 'DNDC', 'eftpos']
    }
  ];

  it('all 6 card markdown pages must exist on disk', () => {
    for (const page of cardPages) {
      assert.ok(fs.existsSync(page.path), `Card page must exist: ${page.path}`);
      const content = fs.readFileSync(page.path, 'utf8');
      assert.ok(content.length > 500, `Card page ${page.path} must contain substantive technical content`);
    }
  });

  it('each card page must contain required technical concepts and keywords', () => {
    for (const page of cardPages) {
      const content = fs.readFileSync(page.path, 'utf8');
      for (const kw of page.expectedKeywords) {
        assert.ok(
          content.includes(kw),
          `Page ${page.path} is missing expected keyword: "${kw}"`
        );
      }
    }
  });

  it('sidebars.ts must register all 6 card documents under Cards category', () => {
    const sidebarContent = fs.readFileSync('sidebars.ts', 'utf8');
    for (const page of cardPages) {
      assert.ok(
        sidebarContent.includes(page.sidebarId),
        `sidebars.ts must register document id: ${page.sidebarId}`
      );
    }
  });

  it('BankingCardPaymentFlowDiagram.tsx must transpile cleanly and have 0 undeclared runtime identifiers', () => {
    const diagramPath = 'src/components/BankingCardPaymentFlowDiagram.tsx';
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);
    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled code must not be empty');

    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Diagram has undeclared identifiers: ${undeclared.join(', ')}`
    );

    const unescaped = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(
      unescaped,
      [],
      `Diagram contains unescaped JSX text: ${JSON.stringify(unescaped)}`
    );
  });

  it('all 6 card markdown documents must compile with 0 undeclared identifiers in MDX (prevents k is not defined)', async () => {
    const mdx = require('@mdx-js/mdx');
    const remarkMath = (await import('remark-math')).default;
    const rehypeKatex = (await import('rehype-katex')).default;
    const babel = require('@babel/core');
    const traverse = require('@babel/traverse').default;

    for (const page of cardPages) {
      const raw = fs.readFileSync(page.path, 'utf8');
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
            !['React', '_jsx', '_jsxs', '_Fragment', '_components', 'BankingCardPaymentFlowDiagram'].includes(p.node.name) &&
            !globalThis[p.node.name]
          ) {
            undeclared.push(p.node.name);
          }
        }
      });

      assert.deepStrictEqual(
        undeclared,
        [],
        `Document ${page.path} has undeclared runtime identifiers: ${undeclared.join(', ')}`
      );
    }
  });
});
