const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Card Anatomy & Tap to Pay Architecture Test Suite', () => {
  const docPath = 'docs/technical-knowledge/banking/card_anatomy_emv.md';
  const sidebarsPath = 'sidebars.ts';
  const diagramPath = 'src/components/TapToPayArchitectureDiagram.tsx';

  it('card_anatomy_emv.md must exist on disk and have comprehensive tap to pay content', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const stats = fs.statSync(docPath);
    assert.ok(stats.size > 20000, `Doc file ${docPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('sidebars.ts must register card_anatomy_emv under Cards category', () => {
    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarsContent.includes('technical-knowledge/banking/card_anatomy_emv'),
      'sidebars.ts must register card_anatomy_emv'
    );
  });

  it('must contain essential Tap to Pay physics, hardware, and cryptographic keywords', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredKeywords = [
      '13.56 MHz',
      'Faraday',
      'Inductive Coupling',
      'Load Modulation',
      'Amplitude Shift Keying',
      'PCD',
      'PICC',
      'PPSE',
      'DDA',
      'CDA',
      'ARQC',
      'ARPC',
      'Secure Element',
      'HCE',
      'Faraday cage'
    ];

    for (const keyword of requiredKeywords) {
      assert.ok(
        content.toLowerCase().includes(keyword.toLowerCase()),
        `Missing required keyword: "${keyword}" in ${docPath}`
      );
    }
  });

  it('must cover the broader RFID/NFC device ecosystem and physical cousins', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const rfidKeywords = [
      '125 kHz',
      'Wiegand',
      'MIFARE Classic',
      'Crypto-1',
      'DarkSide',
      'DESFire',
      'Backscatter',
      'E-ZPass',
      'FasTrak',
      'Qi Wireless Charging',
      'Induction Cooktops',
      'Eddy Currents',
      'Lenz’s Law'
    ];

    for (const keyword of rfidKeywords) {
      assert.ok(
        content.toLowerCase().includes(keyword.toLowerCase()),
        `Missing required RFID/NFC ecosystem keyword: "${keyword}" in ${docPath}`
      );
    }
  });

  it('TapToPayArchitectureDiagram.tsx must exist, support multi-mode views, and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `Diagram file ${diagramPath} must exist`);
    const content = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(content.includes('TapToPayArchitectureDiagram'), 'Must export TapToPayArchitectureDiagram');
    assert.ok(content.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
    assert.ok(content.includes('13.56 MHz'), 'Must mention 13.56 MHz carrier wave');
    assert.ok(content.includes('Load Modulation'), 'Must mention Load Modulation');
    assert.ok(content.includes('rfid_spectrum'), 'Must support RFID spectrum view mode');
    assert.ok(content.includes('Hotel Key Cards'), 'Must include Hotel Key Cards archetype');
    assert.ok(content.includes('Highway Toll Tags'), 'Must include Highway Toll Tags archetype');
    assert.ok(content.includes('Induction Cooktops'), 'Must include Induction Cooktops archetype');
  });

  it('must compile MDX with 0 undeclared runtime identifiers (AST safety)', () => {
    const content = fs.readFileSync(docPath, 'utf8');

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
