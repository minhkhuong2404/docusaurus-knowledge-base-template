const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { loadTsModule, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

describe('Hub Code Battles: 100 Trận So Kèo Code Thực Chiến Suite', () => {
  const battlesModule = loadTsModule('src/data/hubCodeBattlesData.ts');
  const { CODE_BATTLES } = battlesModule;

  it('CODE_BATTLES must be an array of exactly 100 battles', () => {
    assert.ok(Array.isArray(CODE_BATTLES), 'CODE_BATTLES must be an array');
    assert.strictEqual(CODE_BATTLES.length, 100, `Expected exactly 100 battles, found ${CODE_BATTLES.length}`);
  });

  const EXPECTED_CATEGORIES = [
    'Clean Code',
    'Core Java',
    'Spring Boot',
    'Database / SQL',
    'Concurrency',
    'Redis & Caching',
    'Security',
    'Distributed Systems',
    'DevOps, Docker & Containerization',
    'Testing, Observability & Production SRE'
  ];

  it('Must contain exactly 10 high-value technical categories, with 10 battles each', () => {
    const categoryCounts = {};
    CODE_BATTLES.forEach((battle) => {
      categoryCounts[battle.category] = (categoryCounts[battle.category] || 0) + 1;
    });

    const categoriesFound = Object.keys(categoryCounts);
    assert.strictEqual(categoriesFound.length, 10, `Expected 10 categories, found ${categoriesFound.length}`);

    EXPECTED_CATEGORIES.forEach((expectedCat) => {
      assert.ok(categoryCounts[expectedCat] !== undefined, `Missing expected category: ${expectedCat}`);
      assert.strictEqual(
        categoryCounts[expectedCat],
        10,
        `Category "${expectedCat}" must have exactly 10 battles, found ${categoryCounts[expectedCat]}`
      );
    });
  });

  it('Every battle must have unique ID and sequential numbering (1 to 100)', () => {
    const seenIds = new Set();
    CODE_BATTLES.forEach((battle, idx) => {
      const expectedNum = idx + 1;
      assert.ok(!seenIds.has(battle.id), `Duplicate battle id: "${battle.id}" at index ${idx}`);
      seenIds.add(battle.id);

      assert.ok(
        battle.title.startsWith(`${expectedNum}.`),
        `Battle #${expectedNum} title must start with "${expectedNum}.", found: "${battle.title}"`
      );
    });
  });

  it('Every battle must have complete non-empty fields and rich explanations', () => {
    CODE_BATTLES.forEach((battle, idx) => {
      const num = idx + 1;
      assert.ok(battle.id && battle.id.trim().length > 0, `Battle #${num} missing id`);
      assert.ok(battle.title && battle.title.trim().length > 0, `Battle #${num} missing title`);
      assert.ok(battle.category && battle.category.trim().length > 0, `Battle #${num} missing category`);
      assert.ok(battle.impactBadge && battle.impactBadge.trim().length > 0, `Battle #${num} missing impactBadge`);

      assert.ok(battle.badTitle && battle.badTitle.trim().length > 0, `Battle #${num} missing badTitle`);
      assert.ok(battle.badCode && battle.badCode.trim().length > 10, `Battle #${num} badCode too short`);
      assert.ok(battle.badExplanation && battle.badExplanation.trim().length > 20, `Battle #${num} badExplanation too short`);

      assert.ok(battle.goodTitle && battle.goodTitle.trim().length > 0, `Battle #${num} missing goodTitle`);
      assert.ok(battle.goodCode && battle.goodCode.trim().length > 10, `Battle #${num} goodCode too short`);
      assert.ok(battle.goodExplanation && battle.goodExplanation.trim().length > 20, `Battle #${num} goodExplanation too short`);
    });
  });

  it('AST scope safety: src/data/hubCodeBattlesData.ts must have 0 undeclared variables', () => {
    const undeclared = getUndeclaredIdentifiers('src/data/hubCodeBattlesData.ts');
    assert.strictEqual(
      undeclared.length,
      0,
      `Found undeclared variables in hubCodeBattlesData.ts: ${undeclared.join(', ')}`
    );
  });

  it('AST scope safety: src/pages/hub/index.tsx must have 0 undeclared variables', () => {
    const undeclared = getUndeclaredIdentifiers('src/pages/hub/index.tsx');
    assert.strictEqual(
      undeclared.length,
      0,
      `Found undeclared variables in hub/index.tsx: ${undeclared.join(', ')}`
    );
  });

  it('UI verification: src/pages/hub/index.tsx references CODE_BATTLES.length and has category filter', () => {
    const pageContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/hub/index.tsx'), 'utf8');
    assert.ok(
      pageContent.includes('CODE_BATTLES'),
      'hub/index.tsx must import and use CODE_BATTLES'
    );
    assert.ok(
      pageContent.includes('battleCategoryFilter'),
      'hub/index.tsx must have category filter for battles'
    );
    assert.ok(
      pageContent.includes('battleSearchQuery'),
      'hub/index.tsx must have search query for battles'
    );
  });
});
