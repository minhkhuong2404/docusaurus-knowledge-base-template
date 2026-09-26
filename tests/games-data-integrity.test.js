const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadTsModule } = require('./helpers/transpileHelper');

describe('Arcade Games Data Integrity Suite', () => {
  describe('Spot The Bug Challenges Data Integrity', () => {
    const spotTheBugData = loadTsModule('src/data/spotTheBugData.ts');
    const { BUG_CHALLENGES } = spotTheBugData;

    it('BUG_CHALLENGES should be a non-empty array', () => {
      assert.ok(Array.isArray(BUG_CHALLENGES), 'BUG_CHALLENGES must be an array');
      assert.ok(BUG_CHALLENGES.length > 0, 'BUG_CHALLENGES must contain at least 1 challenge');
    });

    const validCategories = new Set([
      'concurrency', 'spring', 'kafka', 'devops', 'system-design',
      'database', 'security', 'memory', 'async'
    ]);
    const validDifficulties = new Set(['Junior', 'Mid', 'Senior', 'Staff']);

    it('All Spot The Bug challenges must adhere to strict schema and line numbering invariants', () => {
      BUG_CHALLENGES.forEach((challenge, idx) => {
        assert.ok(challenge.id && typeof challenge.id === 'string', `Challenge #${idx} must have string id`);
        assert.ok(challenge.title && typeof challenge.title === 'string', `[${challenge.id}] must have string title`);
        assert.ok(validCategories.has(challenge.category), `[${challenge.id}] category '${challenge.category}' is invalid`);
        assert.ok(validDifficulties.has(challenge.difficulty), `[${challenge.id}] difficulty '${challenge.difficulty}' is invalid`);
        assert.ok(challenge.scenario && challenge.scenario.trim().length > 0, `[${challenge.id}] missing scenario text`);
        assert.ok(challenge.code && challenge.code.trim().length > 0, `[${challenge.id}] missing code snippet`);
        assert.ok(challenge.rootCause && challenge.rootCause.trim().length > 0, `[${challenge.id}] missing rootCause text`);

        // Check line numbering bounds
        assert.strictEqual(typeof challenge.buggyLineNumber, 'number', `[${challenge.id}] buggyLineNumber must be number`);
        assert.ok(challenge.buggyLineNumber >= 1, `[${challenge.id}] buggyLineNumber must be >= 1`);
        const totalLines = challenge.code.split('\n').length;
        assert.ok(
          challenge.buggyLineNumber <= totalLines,
          `[${challenge.id}] buggyLineNumber ${challenge.buggyLineNumber} exceeds code snippet line count (${totalLines})`
        );

        // Check options
        assert.ok(Array.isArray(challenge.options), `[${challenge.id}] options must be an array`);
        assert.ok(challenge.options.length >= 2, `[${challenge.id}] options must have >= 2 choices`);

        const correctOptions = challenge.options.filter((opt) => opt.isCorrect);
        assert.strictEqual(
          correctOptions.length,
          1,
          `[${challenge.id}] must have exactly 1 correct option, but found ${correctOptions.length}`
        );

        challenge.options.forEach((opt, optIdx) => {
          assert.ok(opt.id, `[${challenge.id}] option #${optIdx} missing id`);
          assert.ok(opt.text && opt.text.trim().length > 0, `[${challenge.id}] option #${optIdx} has empty text`);
          assert.ok(opt.explanation && opt.explanation.trim().length > 0, `[${challenge.id}] option #${optIdx} has empty explanation`);
        });
      });
    });
  });

  describe('SpotTheBug Code Sanitizer Functionality', () => {
    const { sanitizeBugCode } = loadTsModule('src/utils/sanitizeBugCode.ts');

    it('sanitizeBugCode should safely handle empty strings, null, and undefined', () => {
      assert.strictEqual(sanitizeBugCode(''), '');
      assert.strictEqual(sanitizeBugCode(null), '');
      assert.strictEqual(sanitizeBugCode(undefined), '');
    });

    it('sanitizeBugCode should preserve line counts by replacing standalone spoiler comments with empty lines', () => {
      const codeWithComments = [
        'public class Counter {',
        '    // Line 2: race condition bug',
        '    private int count = 0;',
        '}',
      ].join('\n');

      const cleaned = sanitizeBugCode(codeWithComments);
      const cleanedLines = cleaned.split('\n');
      assert.strictEqual(cleanedLines.length, 4, 'Must preserve line count so line numbers remain identical');
      assert.strictEqual(cleanedLines[1].trim(), '', 'Spoiler comment line must be blanked');
      assert.strictEqual(cleanedLines[0], 'public class Counter {');
      assert.strictEqual(cleanedLines[2], '    private int count = 0;');
    });

    it('sanitizeBugCode should strip trailing inline spoiler comments', () => {
      const code = 'int val = 0; // memory leak defect';
      const cleaned = sanitizeBugCode(code);
      assert.strictEqual(cleaned, 'int val = 0;');
    });

    it('sanitizeBugCode should not strip URLs or normal strings with slashes', () => {
      const code = 'String url = "https://api.example.com//users";';
      const cleaned = sanitizeBugCode(code);
      assert.strictEqual(cleaned, code, 'Double slashes inside string literals should not be stripped as comments');
    });
  });

  describe('System Design Puzzles Data Integrity', () => {
    const sysDesignModule = loadTsModule('src/data/systemDesignPuzzlesData.ts');
    const { SYSTEM_DESIGN_PUZZLES } = sysDesignModule;

    it('SYSTEM_DESIGN_PUZZLES should be a valid array with scenarios', () => {
      assert.ok(Array.isArray(SYSTEM_DESIGN_PUZZLES), 'SYSTEM_DESIGN_PUZZLES must be an array');
      assert.ok(SYSTEM_DESIGN_PUZZLES.length >= 10, `Expected at least 10 puzzles, found ${SYSTEM_DESIGN_PUZZLES.length}`);
    });

    it('All System Design puzzles must have valid goal, nodes, and solution sequences', () => {
      SYSTEM_DESIGN_PUZZLES.forEach((puzzle, idx) => {
        assert.ok(puzzle.id, `Puzzle #${idx} must have id`);
        assert.ok(puzzle.title, `[${puzzle.id}] must have title`);
        assert.ok(puzzle.goal, `[${puzzle.id}] must have goal`);
        assert.ok(Array.isArray(puzzle.availableNodes), `[${puzzle.id}] availableNodes must be array`);
        assert.ok(puzzle.availableNodes.length > 0, `[${puzzle.id}] must have available nodes`);
        assert.ok(Array.isArray(puzzle.correctSequence), `[${puzzle.id}] correctSequence must be array`);
        assert.ok(puzzle.correctSequence.length > 0, `[${puzzle.id}] must have correctSequence`);
      });
    });
  });

  describe('SQL Optimizer Scenarios Data Integrity', () => {
    const sqlModule = loadTsModule('src/data/sqlOptimizerScenariosData.ts');
    const { SQL_OPTIMIZER_SCENARIOS } = sqlModule;

    it('SQL_OPTIMIZER_SCENARIOS should be a valid array with scenarios', () => {
      assert.ok(Array.isArray(SQL_OPTIMIZER_SCENARIOS), 'SQL_OPTIMIZER_SCENARIOS must be an array');
      assert.ok(SQL_OPTIMIZER_SCENARIOS.length >= 10, `Expected at least 10 SQL scenarios, found ${SQL_OPTIMIZER_SCENARIOS.length}`);
    });

    it('All SQL scenarios must have valid slowQuery, businessContext, initialCost, and strategies', () => {
      SQL_OPTIMIZER_SCENARIOS.forEach((scenario, idx) => {
        assert.ok(scenario.id, `Scenario #${idx} must have id`);
        assert.ok(scenario.title, `[${scenario.id}] must have title`);
        assert.ok(scenario.slowQuery, `[${scenario.id}] must have slowQuery`);
        assert.ok(scenario.businessContext, `[${scenario.id}] must have businessContext`);
        assert.ok(typeof scenario.initialCost === 'number', `[${scenario.id}] initialCost must be number`);
        assert.ok(Array.isArray(scenario.strategies), `[${scenario.id}] strategies must be array`);
        assert.ok(scenario.strategies.length >= 2, `[${scenario.id}] strategies must have >= 2 items`);
      });
    });
  });
});
