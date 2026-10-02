const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { loadTsModule, transpileCode, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

describe('Mock Interview Studio & Evaluation Engine Suite', () => {
  const questionsModule = loadTsModule('src/data/mockInterviewQuestionsData.ts');
  const { MOCK_INTERVIEW_QUESTIONS } = questionsModule;

  const evaluatorModule = loadTsModule('src/utils/mockInterviewEvaluator.ts');
  const { evaluateMockAnswer, normalizeText } = evaluatorModule;

  describe('Mock Interview Questions Data Integrity', () => {
    it('MOCK_INTERVIEW_QUESTIONS must have at least 80 curated questions', () => {
      assert.ok(Array.isArray(MOCK_INTERVIEW_QUESTIONS), 'Questions must be an array');
      assert.ok(
        MOCK_INTERVIEW_QUESTIONS.length >= 80,
        `Expected >= 80 questions, found ${MOCK_INTERVIEW_QUESTIONS.length}`
      );
    });

    const validTopics = new Set(['Java Backend', 'Spring Boot', 'Database', 'Network']);
    const validLevels = new Set(['Intern', 'Fresher', 'Junior']);

    it('All questions must have unique IDs, valid topics, levels, and core key points', () => {
      const seenIds = new Set();
      const topicCounts = {};

      MOCK_INTERVIEW_QUESTIONS.forEach((q) => {
        assert.ok(q.id && typeof q.id === 'string', `Question must have string id: ${q.id}`);
        assert.ok(!seenIds.has(q.id), `Duplicate question id: ${q.id}`);
        seenIds.add(q.id);

        assert.ok(validTopics.has(q.topic), `[${q.id}] invalid topic: ${q.topic}`);
        assert.ok(validLevels.has(q.level), `[${q.id}] invalid level: ${q.level}`);
        assert.ok(q.question && q.question.trim().length > 0, `[${q.id}] empty question text`);
        assert.ok(q.contextPrompt && q.contextPrompt.trim().length > 0, `[${q.id}] empty contextPrompt`);
        assert.ok(q.idealAnswer && q.idealAnswer.trim().length > 0, `[${q.id}] empty idealAnswer`);
        assert.ok(q.trapWarning && q.trapWarning.trim().length > 0, `[${q.id}] empty trapWarning`);
        assert.ok(q.scoringCriteria && q.scoringCriteria.trim().length > 0, `[${q.id}] empty scoringCriteria`);

        assert.ok(Array.isArray(q.coreKeyPoints) && q.coreKeyPoints.length >= 2, `[${q.id}] must have >= 2 core points`);
        q.coreKeyPoints.forEach((pt, pIdx) => {
          assert.ok(pt.id, `[${q.id}] point #${pIdx} missing id`);
          assert.ok(pt.pointText && pt.pointText.trim().length > 0, `[${q.id}] point #${pIdx} empty text`);
          assert.ok(Array.isArray(pt.keywords) && pt.keywords.length > 0, `[${q.id}] point #${pIdx} missing keywords`);
          assert.ok(typeof pt.weight === 'number' && pt.weight > 0, `[${q.id}] point #${pIdx} invalid weight`);
        });

        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      });

      // Ensure balanced coverage across all 4 domains (>= 20 questions each)
      validTopics.forEach((topic) => {
        assert.ok(
          (topicCounts[topic] || 0) >= 20,
          `Topic '${topic}' must have at least 20 questions, found ${topicCounts[topic] || 0}`
        );
      });
    });
  });

  describe('Mock Interview Evaluator Correctness', () => {
    const sampleQuestion = MOCK_INTERVIEW_QUESTIONS.find((q) => q.id === 'java-pass-by-value');

    it('normalizeText should lowercase, trim and strip punctuation cleanly', () => {
      const input = '  Java là Pass-by-value! Đúng 100%???  ';
      const output = normalizeText(input);
      assert.strictEqual(output, 'java là pass by value đúng 100');
    });

    it('should assign low score to empty, blank or trivial answers', () => {
      const emptyResult = evaluateMockAnswer('', sampleQuestion);
      assert.strictEqual(emptyResult.score, 0);
      assert.strictEqual(emptyResult.grade, 'NEEDS_IMPROVEMENT');
      assert.strictEqual(emptyResult.matchedPoints.length, 0);

      const trivialResult = evaluateMockAnswer('em không biết câu này ạ', sampleQuestion);
      assert.ok(trivialResult.score <= 10);
      assert.strictEqual(trivialResult.grade, 'NEEDS_IMPROVEMENT');
    });

    it('should correctly match core points and assign high score to a comprehensive answer', () => {
      const goodAnswer = `
        Dạ thưa anh, Java LUÔN LUÔN là Pass-by-value (truyền tham trị) 100% trong mọi trường hợp.
        Khi chúng ta truyền một Object vào method, Java sẽ copy giá trị của địa chỉ tham chiếu (reference pointer)
        chứ không truyền bản thân con trỏ gốc. Do đó ta có thể gọi hàm setter để thay đổi thuộc tính bên trong đối tượng,
        nhưng nếu ta gán biến đó sang một new Object() mới thì biến gốc của người gọi bên ngoài không hề bị thay đổi.
      `;

      const result = evaluateMockAnswer(goodAnswer, sampleQuestion);
      assert.ok(result.score >= 85, `Expected score >= 85, got ${result.score}`);
      assert.strictEqual(result.grade, 'EXCELLENT');
      assert.strictEqual(result.matchedPoints.length, 3);
      assert.strictEqual(result.missingPoints.length, 0);
      assert.ok(result.feedbackSummary.includes('Tuyệt vời'));
    });

    it('should identify missing points for a partial answer', () => {
      const partialAnswer = 'Java là pass-by-value truyền tham trị nha anh.';
      const result = evaluateMockAnswer(partialAnswer, sampleQuestion);

      assert.ok(result.score >= 30 && result.score <= 60, `Score out of expected range: ${result.score}`);
      assert.ok(result.matchedPoints.length >= 1, 'Should match at least point 1');
      assert.ok(result.missingPoints.length >= 1, 'Should have missing points');
    });
  });

  describe('Mock Interview Page & Studio AST Scope Safety', () => {
    const pagePath = path.resolve(__dirname, '../src/pages/mock-interview/index.tsx');
    const studioPath = path.resolve(__dirname, '../src/components/mock-interview/MockInterviewStudio.tsx');
    const hubPath = path.resolve(__dirname, '../src/pages/hub/index.tsx');

    it('should transpile mock-interview/index.tsx cleanly without syntax errors', () => {
      assert.doesNotThrow(() => {
        transpileCode(pagePath);
      });
    });

    it('should have 0 undeclared runtime identifiers in mock-interview/index.tsx', () => {
      const undeclared = getUndeclaredIdentifiers(pagePath);
      assert.deepStrictEqual(
        Array.from(undeclared),
        [],
        `Found undeclared runtime identifiers: ${Array.from(undeclared).join(', ')}`
      );
    });

    it('should transpile MockInterviewStudio.tsx cleanly without syntax errors', () => {
      assert.doesNotThrow(() => {
        transpileCode(studioPath);
      });
    });

    it('should have 0 undeclared runtime identifiers in MockInterviewStudio.tsx', () => {
      const undeclared = getUndeclaredIdentifiers(studioPath);
      assert.deepStrictEqual(
        Array.from(undeclared),
        [],
        `Found undeclared runtime identifiers: ${Array.from(undeclared).join(', ')}`
      );
    });

    it('Career Hub (hub/index.tsx) must embed MockInterviewStudio and support mock-interview tab', () => {
      const hubContent = fs.readFileSync(hubPath, 'utf-8');
      assert.ok(hubContent.includes('MockInterviewStudio'), 'hub/index.tsx must import MockInterviewStudio');
      assert.ok(hubContent.includes('mock-interview'), 'hub/index.tsx must support mock-interview tab');
      assert.ok(hubContent.includes('AI Evaluator'), 'hub/index.tsx must show AI Evaluator in tab label');
    });
  });
});
