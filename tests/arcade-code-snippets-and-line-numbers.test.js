const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities, loadTsModule } = require('./helpers/transpileHelper');
const { parseSnippetLines } = loadTsModule('./src/utils/codeSnippetHelper.ts');

describe('Arcade & Quiz Code Snippet Line Numbers Integrity Suite', () => {
  const outageBossPath = 'src/components/gamification/games/OutageBossBattleGame.tsx';
  const dailyQuizPath = 'src/components/DailyQuizGallery/index.tsx';
  const quizzesJsonPath = 'static/data/quizzes.json';

  it('parseSnippetLines should accurately parse and number lines for both prefixed and unnumbered snippets', () => {
    // 1. Snippet with embedded line prefixes (e.g., "1: ...")
    const prefixed = '1: public class Test {\n2:   int x = 10;\n3: }';
    const parsed1 = parseSnippetLines(prefixed);
    assert.strictEqual(parsed1.length, 3);
    assert.strictEqual(parsed1[0].lineNum, 1);
    assert.strictEqual(parsed1[0].text, 'public class Test {');
    assert.strictEqual(parsed1[1].lineNum, 2);
    assert.strictEqual(parsed1[1].text, '  int x = 10;');
    assert.strictEqual(parsed1[2].lineNum, 3);
    assert.strictEqual(parsed1[2].text, '}');

    // 2. Unprefixed plain code snippet
    const unnumbered = 'public class Egret {\n  private String color;\n}';
    const parsed2 = parseSnippetLines(unnumbered);
    assert.strictEqual(parsed2.length, 3);
    assert.strictEqual(parsed2[0].lineNum, 1);
    assert.strictEqual(parsed2[0].text, 'public class Egret {');
    assert.strictEqual(parsed2[1].lineNum, 2);
    assert.strictEqual(parsed2[1].text, '  private String color;');
    assert.strictEqual(parsed2[2].lineNum, 3);
    assert.strictEqual(parsed2[2].text, '}');

    // 3. Null / empty snippet returns empty array
    assert.deepStrictEqual(parseSnippetLines(null), []);
    assert.deepStrictEqual(parseSnippetLines(''), []);
  });

  it('OutageBossBattleGame.tsx should render codeSnippet with line numbers and include post-mortem report', () => {
    assert.ok(fs.existsSync(outageBossPath), `${outageBossPath} must exist`);
    const content = fs.readFileSync(outageBossPath, 'utf8');

    // Asserts code snippet gutter rendering
    assert.ok(content.includes('parsedSnippetLines'), 'Must compute parsedSnippetLines');
    assert.ok(content.includes('INCIDENT SOURCE CODE'), 'Must render incident source code header');
    assert.ok(content.includes('parseSnippetLines'), 'Must import and use parseSnippetLines');

    // Asserts post-mortem retrospective rendering
    assert.ok(content.includes('Incident Retrospective & Root Cause Analysis'), 'Must render post-mortem retrospective');
    assert.ok(content.includes('logSnippetLines'), 'Must render code snippets in post-mortem retrospective');

    // Asserts emergency fallbacks include code snippets with line numbers
    assert.ok(content.includes('EMERGENCY_FALLBACK_QUESTIONS'), 'Must have emergency fallback questions');
    assert.ok(content.includes('codeSnippet: `1:'), 'Fallback questions must include code snippets with line numbers');

    // AST scope safety
    const undeclared = getUndeclaredIdentifiers(outageBossPath);
    assert.deepStrictEqual(undeclared, [], `OutageBossBattleGame has undeclared variables: ${undeclared.join(', ')}`);

    const invalidEntities = validateJsxEntities(outageBossPath);
    assert.deepStrictEqual(invalidEntities, [], `OutageBossBattleGame has invalid entities: ${invalidEntities.map(e => e.text).join(', ')}`);
  });

  it('DailyQuizGallery/index.tsx should render code snippets with line numbers and fixSnippet', () => {
    assert.ok(fs.existsSync(dailyQuizPath), `${dailyQuizPath} must exist`);
    const content = fs.readFileSync(dailyQuizPath, 'utf8');

    assert.ok(content.includes('parseSnippetLines'), 'Must use parseSnippetLines');
    assert.ok(content.includes('fixSnippet'), 'Must support fixSnippet rendering');

    const undeclared = getUndeclaredIdentifiers(dailyQuizPath);
    assert.deepStrictEqual(undeclared, [], `DailyQuizGallery has undeclared variables: ${undeclared.join(', ')}`);

    const invalidEntities = validateJsxEntities(dailyQuizPath);
    assert.deepStrictEqual(invalidEntities, [], `DailyQuizGallery has invalid entities: ${invalidEntities.map(e => e.text).join(', ')}`);
  });

  it('All questions with line number references in static/data/quizzes.json must have non-empty code snippets and valid line bounds', () => {
    assert.ok(fs.existsSync(quizzesJsonPath), `${quizzesJsonPath} must exist`);
    const raw = JSON.parse(fs.readFileSync(quizzesJsonPath, 'utf8'));
    const data = raw.data || raw;

    let lineRefQuestionsCount = 0;

    for (const [tab, questions] of Object.entries(data)) {
      if (!Array.isArray(questions)) continue;
      questions.forEach((q) => {
        const text = (q.questionText || '') + ' ' + (q.options || []).join(' ');
        const matches = text.match(/\bline\s*(\d+)\b/gi);
        if (!matches) return;

        lineRefQuestionsCount++;
        assert.ok(
          q.codeSnippet && q.codeSnippet.trim().length > 0,
          `Question ${q.id} in tab "${tab}" references line numbers but has no codeSnippet!`
        );

        const lines = q.codeSnippet.split('\n');
        const numLines = lines.length;
        matches.forEach((m) => {
          const refNum = parseInt(m.match(/\d+/)[0], 10);
          const hasInlineTag =
            q.codeSnippet.includes(`line ${refNum}`) ||
            q.codeSnippet.includes(`LINE ${refNum}`) ||
            q.codeSnippet.includes(`${refNum}:`);
          assert.ok(
            refNum <= numLines || hasInlineTag,
            `Question ${q.id} in tab "${tab}" references line ${refNum}, but snippet only has ${numLines} lines and lacks inline tag!`
          );
        });
      });
    }

    assert.ok(lineRefQuestionsCount >= 40, `Expected at least 40 questions with line references, found: ${lineRefQuestionsCount}`);
  });
});
