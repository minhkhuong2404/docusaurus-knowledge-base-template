const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadTsModule } = require('./helpers/transpileHelper');

describe('Gamification Progression & Rank Invariants Suite', () => {
  const gamificationData = loadTsModule('src/data/gamificationData.ts');
  const {
    getRankForLevel,
    getExpProgressInCurrentLevel,
    getExpForLevel,
    getLevelFromExp,
    COSMIC_RANKS,
    ACHIEVEMENTS,
    DAILY_QUEST_POOL,
  } = gamificationData;

  describe('Rank Progression (getRankForLevel)', () => {
    it('should return valid rank definitions across all levels', () => {
      const testLevels = [1, 2, 5, 10, 15, 20, 30, 45, 60, 80, 100, 250, 1000];

      for (const level of testLevels) {
        const rank = getRankForLevel(level);
        assert.ok(rank, `Rank for level ${level} must exist`);
        assert.ok(typeof rank.title === 'string' && rank.title.length > 0, `Rank title at level ${level} must be non-empty`);
        assert.ok(typeof rank.color === 'string' && rank.color.startsWith('#'), `Rank color at level ${level} must be hex`);
        assert.ok(typeof rank.minLevel === 'number', `minLevel at level ${level} must be a number`);
      }
    });

    it('should assign higher ranks as level increases', () => {
      const rankLvl1 = getRankForLevel(1);
      const rankLvl20 = getRankForLevel(20);
      const rankLvl60 = getRankForLevel(60);

      assert.notStrictEqual(rankLvl1.title, rankLvl20.title);
      assert.notStrictEqual(rankLvl20.title, rankLvl60.title);
    });
  });

  describe('EXP Level Math (getExpProgressInCurrentLevel)', () => {
    it('should return level 1 for 0 EXP', () => {
      const progress = getExpProgressInCurrentLevel(0);
      assert.strictEqual(progress.currentLevel, 1);
      assert.strictEqual(progress.expInLevel, 0);
      assert.ok(progress.neededInLevel > 0, 'neededInLevel must be positive');
    });

    it('should never produce NaN, Infinity, or negative numbers', () => {
      const testExps = [0, 10, 50, 100, 250, 1000, 5000, 100000, -100];

      for (const exp of testExps) {
        const progress = getExpProgressInCurrentLevel(exp);
        assert.ok(!Number.isNaN(progress.currentLevel), `currentLevel is NaN for exp=${exp}`);
        assert.ok(!Number.isNaN(progress.expInLevel), `expInLevel is NaN for exp=${exp}`);
        assert.ok(!Number.isNaN(progress.neededInLevel), `neededInLevel is NaN for exp=${exp}`);
        assert.ok(Number.isFinite(progress.currentLevel), `currentLevel not finite for exp=${exp}`);
        assert.ok(progress.currentLevel >= 1, `currentLevel must be >= 1 for exp=${exp}`);
        assert.ok(progress.expInLevel >= 0, `expInLevel must be non-negative for exp=${exp}`);
        assert.ok(progress.neededInLevel > 0, `neededInLevel must be > 0 for exp=${exp}`);
      }
    });

    it('should monotonically increase level as total EXP increases', () => {
      let prevLevel = 1;
      for (let exp = 0; exp <= 20000; exp += 500) {
        const { currentLevel } = getExpProgressInCurrentLevel(exp);
        assert.ok(currentLevel >= prevLevel, `Level decreased at exp=${exp}`);
        prevLevel = currentLevel;
      }
    });
  });

  describe('Achievements Schema & Unique IDs', () => {
    it('ACHIEVEMENTS must have unique IDs and positive EXP rewards', () => {
      assert.ok(Array.isArray(ACHIEVEMENTS), 'ACHIEVEMENTS must be an array');
      const seenIds = new Set();

      for (const ach of ACHIEVEMENTS) {
        assert.ok(ach.id && typeof ach.id === 'string', `Achievement id must be string: ${JSON.stringify(ach)}`);
        assert.ok(!seenIds.has(ach.id), `Duplicate achievement ID detected: ${ach.id}`);
        seenIds.add(ach.id);

        assert.ok(ach.title && ach.title.trim().length > 0, `Achievement [${ach.id}] missing title`);
        assert.ok(ach.description && ach.description.trim().length > 0, `Achievement [${ach.id}] missing description`);
        assert.ok(typeof ach.expReward === 'number' && ach.expReward > 0, `Achievement [${ach.id}] expReward must be > 0`);
      }
    });
  });

  describe('Daily Quests Pool Schema', () => {
    it('DAILY_QUEST_POOL must have unique IDs and valid rewards', () => {
      assert.ok(Array.isArray(DAILY_QUEST_POOL), 'DAILY_QUEST_POOL must be an array');
      const seenIds = new Set();

      for (const quest of DAILY_QUEST_POOL) {
        assert.ok(quest.id && typeof quest.id === 'string', `Quest id must be string`);
        assert.ok(!seenIds.has(quest.id), `Duplicate quest ID: ${quest.id}`);
        seenIds.add(quest.id);

        assert.ok(quest.title && quest.title.trim().length > 0, `Quest [${quest.id}] missing title`);
        assert.ok(quest.description && quest.description.trim().length > 0, `Quest [${quest.id}] missing description`);
        assert.ok(typeof quest.target === 'number' && quest.target > 0, `Quest [${quest.id}] target must be > 0`);
        assert.ok(typeof quest.expReward === 'number' && quest.expReward > 0, `Quest [${quest.id}] expReward must be > 0`);
      }
    });
  });
});
