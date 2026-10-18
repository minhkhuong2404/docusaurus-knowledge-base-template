const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, loadTsModule } = require('./helpers/transpileHelper');

describe('Arcade Games Runtime Safety Suite', () => {
  const games = [
    {
      name: 'Spot The Bug Duel (SpotTheBugDuelGame.tsx)',
      path: 'src/components/gamification/games/SpotTheBugDuelGame.tsx',
    },
    {
      name: 'Outage Boss Battle (OutageBossBattleGame.tsx)',
      path: 'src/components/gamification/games/OutageBossBattleGame.tsx',
    },
    {
      name: 'Architecture Pipe Puzzle (ArchitecturePuzzleGame.tsx)',
      path: 'src/components/gamification/games/ArchitecturePuzzleGame.tsx',
    },
    {
      name: 'SQL Index & Query Crusher (SqlIndexOptimizerGame.tsx)',
      path: 'src/components/gamification/games/SqlIndexOptimizerGame.tsx',
    },
    {
      name: 'Flashcard Arena (FlashcardArenaGame.tsx)',
      path: 'src/components/gamification/games/FlashcardArenaGame.tsx',
    },
    {
      name: 'Arcade Hub Main Page (src/pages/arcade/index.tsx)',
      path: 'src/pages/arcade/index.tsx',
    },
  ];

  for (const game of games) {
    it(`should transpile ${game.name} cleanly without syntax errors`, () => {
      assert.ok(fs.existsSync(game.path), `File ${game.path} must exist`);
      const jsCode = transpileCode(game.path);
      assert.ok(jsCode && jsCode.length > 100, `Transpiled code for ${game.name} must not be empty`);
    });

    it(`should have 0 undeclared runtime identifiers in ${game.name}`, () => {
      const undeclared = getUndeclaredIdentifiers(game.path);
      assert.deepStrictEqual(
        undeclared,
        [],
        `Found undeclared runtime identifier(s) in ${game.name}: ${undeclared.join(', ')}. This will crash in production!`
      );
    });
  }

  it('SpotTheBugDuelGame.tsx must contain required handlers and state guards', () => {
    const content = fs.readFileSync('src/components/gamification/games/SpotTheBugDuelGame.tsx', 'utf8');
    assert.ok(content.includes('currentChallengeIndex'), 'Must declare currentChallengeIndex');
    assert.ok(content.includes('handleUseTimeWarp'), 'Must define handleUseTimeWarp');
    assert.ok(content.includes('handleUseAnalyzer'), 'Must define handleUseAnalyzer');
    assert.ok(content.includes('handleUseBreakpoint'), 'Must define handleUseBreakpoint');
    assert.ok(content.includes('handleNextChallenge'), 'Must define handleNextChallenge');
    assert.ok(content.includes('handleSelectOption'), 'Must define handleSelectOption');
    assert.ok(content.includes('sanitizeBugCode'), 'Must export sanitizeBugCode');
  });

  it('arcadeRandomizer must pick random non-repeating items and batches across full cycles', () => {
    const { pickRandomUnseenItem, pickRandomUnseenBatch } = loadTsModule('src/utils/arcadeRandomizer.ts');
    const pool = [
      { id: 'q1' },
      { id: 'q2' },
      { id: 'q3' },
      { id: 'q4' },
      { id: 'q5' },
    ];

    let seenIds = [];
    let currentId = undefined;
    const pickedOrder = [];

    for (let i = 0; i < pool.length; i++) {
      const res = pickRandomUnseenItem(pool, seenIds, currentId);
      assert.ok(!pickedOrder.includes(res.item.id), `Item ${res.item.id} was repeated before exhausting pool`);
      pickedOrder.push(res.item.id);
      seenIds = res.nextSeenIds;
      currentId = res.item.id;
    }

    assert.strictEqual(pickedOrder.length, pool.length, 'All items in pool must be visited once before repeating');

    // Next pick after exhausting pool must reset cycle and not repeat the immediately previous item
    const nextAfterReset = pickRandomUnseenItem(pool, seenIds, currentId);
    assert.notStrictEqual(nextAfterReset.item.id, currentId, 'Must not immediately repeat the last item when cycle resets');
    assert.strictEqual(nextAfterReset.nextSeenIds.length, 1, 'Seen list should reset to the newly picked item');

    // Batch test
    const b1 = pickRandomUnseenBatch(pool, 3, []);
    assert.strictEqual(b1.batch.length, 3);
    const b2 = pickRandomUnseenBatch(pool, 2, b1.nextSeenIds);
    assert.strictEqual(b2.batch.length, 2);
    const overlap = b2.batch.filter((x) => b1.batch.some((y) => y.id === x.id));
    assert.strictEqual(overlap.length, 0, 'Second batch must only pick remaining unseen items');
  });

  it('All 4 core Arcade games must use arcadeRandomizer for random non-repeating questions and Skip/Random actions', () => {
    const coreGameFiles = [
      'src/components/gamification/games/SpotTheBugDuelGame.tsx',
      'src/components/gamification/games/OutageBossBattleGame.tsx',
      'src/components/gamification/games/ArchitecturePuzzleGame.tsx',
      'src/components/gamification/games/SqlIndexOptimizerGame.tsx',
    ];
    for (const file of coreGameFiles) {
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(
        content.includes('arcadeRandomizer'),
        `${file} must import and use arcadeRandomizer for random non-repeating question selection`
      );
      assert.ok(
        content.includes('🎲 Random'),
        `${file} must provide a 🎲 Random button to jump to a random unseen question`
      );
    }
  });
});
