const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, loadTsModule } = require('./helpers/transpileHelper');

describe('Quiz Services & Core Utilities Suite', () => {
  it('should transpile googleSheetQuizService.ts cleanly', () => {
    const jsCode = transpileCode('src/services/googleSheetQuizService.ts');
    assert.ok(jsCode && jsCode.length > 500, 'googleSheetQuizService transpiled output must be valid');
  });

  it('should have 0 undeclared runtime identifiers in googleSheetQuizService.ts', () => {
    const undeclared = getUndeclaredIdentifiers('src/services/googleSheetQuizService.ts');
    assert.deepStrictEqual(
      undeclared,
      [],
      `Undeclared identifiers found in googleSheetQuizService: ${undeclared.join(', ')}`
    );
  });

  it('arcadeAudio.ts should transpile and define audio feedback methods safely', () => {
    const jsCode = transpileCode('src/utils/arcadeAudio.ts');
    assert.ok(jsCode.includes('playCorrect'), 'Must define playCorrect');
    assert.ok(jsCode.includes('playError'), 'Must define playError');
    assert.ok(jsCode.includes('playBlip'), 'Must define playBlip');
    assert.ok(jsCode.includes('playLaser'), 'Must define playLaser');
    assert.ok(jsCode.includes('playFlip'), 'Must define playFlip');

    const undeclared = getUndeclaredIdentifiers('src/utils/arcadeAudio.ts');
    assert.deepStrictEqual(undeclared, [], 'arcadeAudio.ts should have 0 undeclared variables');
  });

  it('fireworks.ts should transpile and export triggerFireworks safely', () => {
    const jsCode = transpileCode('src/utils/fireworks.ts');
    assert.ok(jsCode.includes('triggerFireworks'), 'Must export triggerFireworks');

    const undeclared = getUndeclaredIdentifiers('src/utils/fireworks.ts');
    assert.deepStrictEqual(undeclared, [], 'fireworks.ts should have 0 undeclared variables');
  });
});
