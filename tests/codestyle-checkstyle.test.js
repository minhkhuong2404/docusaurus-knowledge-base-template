const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');

describe('JavaScript & TypeScript Checkstyle Suite', () => {
  it('scripts/checkstyle.js should evaluate with 0 errors across the codebase', () => {
    const output = execSync('node scripts/checkstyle.js --quiet', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    assert.ok(
      output.includes('Checkstyle passed!') || output.includes('0 errors'),
      `Checkstyle failed:\n${output}`
    );
  });

  it('scripts/checkstyle.js --xml should generate valid XML checkstyle report', () => {
    const output = execSync('node scripts/checkstyle.js --xml --quiet src/components/gamification/games/SpotTheBugDuelGame.tsx', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    assert.ok(output.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Must include XML declaration');
    assert.ok(output.includes('<checkstyle version="8.0">'), 'Must include checkstyle root tag');
    assert.ok(output.includes('</checkstyle>'), 'Must close checkstyle root tag');
  });

  it('scripts/checkstyle.js --format=json should generate parseable JSON report', () => {
    const output = execSync('node scripts/checkstyle.js --format=json src/components/gamification/games/SpotTheBugDuelGame.tsx', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.totalErrors, 0, 'Must have 0 errors for SpotTheBugDuelGame');
    assert.ok(Array.isArray(parsed.results), 'results must be an array');
  });
});
