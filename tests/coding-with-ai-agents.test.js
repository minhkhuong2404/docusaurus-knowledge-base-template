const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Coding with AI Agents: 5 Core Concepts Suite', () => {
  const docPath = 'docs/technical-knowledge/ai-agents/spec-driven-agentic-coding.md';
  const componentPath = 'src/components/CodingWithAiAgentsDiagram.tsx';
  const sidebarsPath = 'sidebars.ts';

  it('Markdown documentation file should exist and have comprehensive content (>250 lines)', () => {
    assert.ok(fs.existsSync(docPath), `Doc file ${docPath} must exist`);
    const content = fs.readFileSync(docPath, 'utf8');
    const lines = content.split('\n').length;
    assert.ok(lines >= 250, `Doc file must have at least 250 lines of senior-level content, got ${lines}`);
  });

  it('Markdown documentation should cover all 5 concepts from Cedric Clyburn IBM Tech video', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const requiredConcepts = [
      'Spec-Driven Development',
      'Conductor',
      'Model Context Protocol',
      'Loop Engineering',
      'Security',
      'Sandboxing',
      'Cedric Clyburn',
    ];
    for (const term of requiredConcepts) {
      assert.ok(
        content.toLowerCase().includes(term.toLowerCase()),
        `Documentation must cover concept: "${term}"`
      );
    }
  });

  it('Markdown documentation should embed CodingWithAiAgentsDiagram', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(
      content.includes('<CodingWithAiAgentsDiagram />'),
      'Doc must embed the <CodingWithAiAgentsDiagram /> component'
    );
  });

  it('Sidebar configuration should register spec-driven-agentic-coding', () => {
    const sidebarContent = fs.readFileSync(sidebarsPath, 'utf8');
    assert.ok(
      sidebarContent.includes("'technical-knowledge/ai-agents/spec-driven-agentic-coding'"),
      'sidebars.ts must register technical-knowledge/ai-agents/spec-driven-agentic-coding'
    );
  });

  it('CodingWithAiAgentsDiagram component should exist', () => {
    assert.ok(fs.existsSync(componentPath), `Component ${componentPath} must exist`);
  });

  it('CodingWithAiAgentsDiagram should transpile cleanly', () => {
    const transpiled = transpileCode(componentPath);
    assert.ok(transpiled && transpiled.length > 50, 'Transpilation should succeed');
  });

  it('CodingWithAiAgentsDiagram should have 0 undeclared runtime identifiers', () => {
    const undeclared = getUndeclaredIdentifiers(componentPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Component must not have undeclared variables: ${undeclared.join(', ')}`
    );
  });

  it('CodingWithAiAgentsDiagram should have valid JSX entities with no raw unescaped angles', () => {
    const jsxErrors = validateJsxEntities(componentPath);
    assert.deepStrictEqual(
      jsxErrors,
      [],
      `Component must have no JSX entity errors: ${JSON.stringify(jsxErrors)}`
    );
  });

  it('Related docs should cross-link to spec-driven-agentic-coding', () => {
    const overviewContent = fs.readFileSync('docs/technical-knowledge/ai-agents/overview.md', 'utf8');
    const vibeContent = fs.readFileSync('docs/technical-knowledge/ai-agents/vibe-coding.md', 'utf8');

    assert.ok(
      overviewContent.includes('spec-driven-agentic-coding'),
      'overview.md must cross-link to spec-driven-agentic-coding'
    );
    assert.ok(
      vibeContent.includes('spec-driven-agentic-coding'),
      'vibe-coding.md must cross-link to spec-driven-agentic-coding'
    );
  });
});
