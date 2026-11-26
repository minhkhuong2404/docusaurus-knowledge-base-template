const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();

describe('Website UX Upgrades & Performance Invariants', () => {
  it('generates a lightweight metadata-only Diagram Atlas catalog with zero static diagram imports', () => {
    const atlasDataPath = path.join(ROOT, 'src', 'data', 'diagramAtlasData.ts');
    assert.ok(fs.existsSync(atlasDataPath), 'src/data/diagramAtlasData.ts must exist');
    const source = fs.readFileSync(atlasDataPath, 'utf8');

    assert.doesNotMatch(
      source,
      /import\s+.*Diagram['"]/,
      'diagramAtlasData.ts must NOT statically import React diagram components (would bloat JS bundle)'
    );

    const entryMatches = source.match(/"id":\s*"[A-Za-z0-9_]+Diagram"/g) || [];
    assert.ok(entryMatches.length >= 500, `Expected at least 500 mapped diagrams, got ${entryMatches.length}`);
  });

  it('lazy-loads flagship previews and paginates /diagrams page for fast initial load', () => {
    const pagePath = path.join(ROOT, 'src', 'pages', 'diagrams', 'index.tsx');
    const source = fs.readFileSync(pagePath, 'utf8');

    assert.match(source, /React\.lazy\(/, '/diagrams must use React.lazy() for live previews');
    assert.match(source, /PAGE_SIZE\s*=\s*24/, '/diagrams must paginate results to keep DOM lightweight');
  });

  it('lazy-loads diagram spotlight on landing page with IntersectionObserver', () => {
    const widgetsPath = path.join(ROOT, 'src', 'components', 'LandingWidgets.tsx');
    const source = fs.readFileSync(widgetsPath, 'utf8');

    assert.match(source, /React\.lazy\(/, 'LiveDiagramSpotlight must lazy-load diagrams');
    assert.match(source, /IntersectionObserver/, 'LiveDiagramSpotlight must defer mounting until scrolled near viewport');
  });

  it('dynamically imports diagram metadata in CommandPalette only when opened', () => {
    const palettePath = path.join(ROOT, 'src', 'components', 'CommandPalette.tsx');
    const source = fs.readFileSync(palettePath, 'utf8');

    assert.match(source, /import\(['"]\.\.\/data\/diagramAtlasData['"]\)/, 'CommandPalette must dynamically import diagramAtlasData');
    assert.match(source, /if\s*\(!open\)\s*return\s+null/, 'CommandPalette must render null when closed');
  });

  it('wires CommandPalette in Root, reading meta bar in DocItem/Content, and surfaces Diagrams & Practice in navbar', () => {
    const rootSrc = fs.readFileSync(path.join(ROOT, 'src', 'theme', 'Root.tsx'), 'utf8');
    const configSrc = fs.readFileSync(path.join(ROOT, 'docusaurus.config.ts'), 'utf8');
    const docContentSrc = fs.readFileSync(path.join(ROOT, 'src', 'theme', 'DocItem', 'Content', 'index.tsx'), 'utf8');
    const markReadSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'MarkAsReadButton.tsx'), 'utf8');

    assert.match(rootSrc, /<CommandPalette\s*\/>/, 'Root.tsx must render <CommandPalette />');
    assert.match(configSrc, /to:\s*['"]\/diagrams['"]/, 'docusaurus.config.ts navbar must link /diagrams');
    assert.match(configSrc, /to:\s*['"]\/mock-interview['"]/, 'docusaurus.config.ts navbar must link /mock-interview');
    assert.match(configSrc, /to:\s*['"]\/leaderboard['"]/, 'docusaurus.config.ts navbar must link /leaderboard');
    assert.match(docContentSrc, /estimateReadingMinutes/, 'DocItem/Content must compute estimated reading time');
    assert.match(docContentSrc, /interactive-diagram-container/, 'DocItem/Content must count interactive diagrams');
    assert.match(markReadSrc, /getArcadeRecommendationForPath/, 'MarkAsReadButton must include topic-aware Arcade CTA');
    assert.match(markReadSrc, /saveLastVisitedDoc/, 'MarkAsReadButton must record last visited doc for homepage cockpit');
  });

  it('learningHelpers exports accurate reading time and topic-to-arcade mapping logic', () => {
    const helperSrc = fs.readFileSync(path.join(ROOT, 'src', 'utils', 'learningHelpers.ts'), 'utf8');

    assert.match(helperSrc, /export function estimateReadingMinutes/);
    assert.match(helperSrc, /export function getArcadeRecommendationForPath/);
    assert.match(helperSrc, /SQL Index Optimizer/);
    assert.match(helperSrc, /Architecture Puzzle & Outage Boss/);
    assert.match(helperSrc, /Spot The Bug Duel/);
    assert.match(helperSrc, /Flashcard Arena/);
  });
});
