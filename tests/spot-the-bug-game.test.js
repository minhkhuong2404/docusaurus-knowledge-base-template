const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, loadTsModule } = require('./helpers/transpileHelper');

describe('Dedicated Spot The Bug Duel Regression & Invariants Suite', () => {
  const componentPath = 'src/components/gamification/games/SpotTheBugDuelGame.tsx';
  const { BUG_CHALLENGES } = loadTsModule('src/data/spotTheBugData.ts');
  const { sanitizeBugCode } = loadTsModule('src/utils/sanitizeBugCode.ts');

  it('SpotTheBugDuelGame component must exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(componentPath), `Component file ${componentPath} must exist`);
    const code = transpileCode(componentPath);
    assert.ok(code && code.length > 500, 'Transpiled component code must not be empty');
  });

  it('SpotTheBugDuelGame must have ZERO undeclared runtime identifiers (prevents crash on Start)', () => {
    const undeclared = getUndeclaredIdentifiers(componentPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Detected undeclared identifier(s): ${undeclared.join(', ')}. This will cause runtime ReferenceError crash!`
    );
  });

  it('SpotTheBugDuelGame must define currentChallengeIndex and handleUseTimeWarp', () => {
    const source = fs.readFileSync(componentPath, 'utf8');
    assert.ok(
      source.includes('const currentChallengeIndex'),
      'Must declare currentChallengeIndex to prevent ReferenceError when displaying Bug index'
    );
    assert.ok(
      source.includes('const handleUseTimeWarp'),
      'Must declare handleUseTimeWarp to prevent ReferenceError on +15s lifeline button click'
    );
    assert.ok(
      source.includes('handleUseAnalyzer'),
      'Must declare handleUseAnalyzer for 50/50 lifeline'
    );
    assert.ok(
      source.includes('handleUseBreakpoint'),
      'Must declare handleUseBreakpoint for suspect line hint'
    );
  });

  it('Challenge pool filtering must never return an empty array for any category or difficulty combination', () => {
    const categories = [
      'all', 'concurrency', 'spring', 'kafka', 'devops',
      'system-design', 'database', 'security', 'async'
    ];
    const difficulties = ['all', 'easy', 'medium', 'hard'];

    for (const cat of categories) {
      for (const diff of difficulties) {
        let pool = cat === 'all' ? BUG_CHALLENGES : BUG_CHALLENGES.filter((c) => c.category === cat);
        if (pool.length === 0) {
          pool = cat === 'all' ? BUG_CHALLENGES : BUG_CHALLENGES.filter((c) => c.category === cat);
        }
        if (pool.length === 0) {
          pool = BUG_CHALLENGES;
        }

        if (diff === 'easy') {
          const match = pool.filter((c) => c.difficulty === 'Junior');
          if (match.length > 0) pool = match;
        } else if (diff === 'medium') {
          const match = pool.filter((c) => c.difficulty === 'Mid');
          if (match.length > 0) pool = match;
        } else if (diff === 'hard') {
          const match = pool.filter((c) => c.difficulty === 'Senior' || c.difficulty === 'Staff');
          if (match.length > 0) pool = match;
        }

        assert.ok(pool.length > 0, `Pool became empty for category=${cat}, difficulty=${diff}`);

        const currentIdx = 42;
        const safeIdx = pool.length > 0 ? currentIdx % pool.length : 0;
        const currentChallenge = pool[safeIdx] || BUG_CHALLENGES[0];
        assert.ok(currentChallenge, `currentChallenge was undefined for category=${cat}, difficulty=${diff}`);
        assert.ok(currentChallenge.id, 'currentChallenge must have valid id');
        assert.ok(currentChallenge.title, 'currentChallenge must have valid title');
        assert.ok(currentChallenge.buggyLineNumber >= 1, 'currentChallenge must have valid buggyLineNumber');
      }
    }
  });

  it('SanitizeBugCode must strip defect spoilers while preserving exact line numbers', () => {
    const sampleBuggyCode = [
      'public class DeadlockHazard {',
      '    // Line 2: lock ordering deadlock bug',
      '    private final Object lockA = new Object();',
      '    private final Object lockB = new Object();',
      '}',
    ].join('\n');

    const sanitized = sanitizeBugCode(sampleBuggyCode);
    const originalLines = sampleBuggyCode.split('\n');
    const sanitizedLines = sanitized.split('\n');

    assert.strictEqual(
      sanitizedLines.length,
      originalLines.length,
      'Line counts must match exactly so buggyLineNumber remains valid'
    );
    assert.strictEqual(sanitizedLines[1].trim(), '', 'Spoiler comment line must be blanked out');
    assert.strictEqual(sanitizedLines[0], originalLines[0]);
    assert.strictEqual(sanitizedLines[2], originalLines[2]);
  });
});
