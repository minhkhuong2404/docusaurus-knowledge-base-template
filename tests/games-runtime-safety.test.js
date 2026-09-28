const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

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
});
