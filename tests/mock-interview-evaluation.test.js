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

  describe('Masked Big Tech Companies & Realistic Interview Simulation Suite', () => {
    const companiesModule = loadTsModule('src/data/mockInterviewCompaniesData.ts');
    const { MASKED_COMPANIES, ENTRY_LEVEL_PROFILES, MOCK_INTERVIEW_DISCLAIMER, getCompanyById, getRandomCompany } = companiesModule;

    it('MASKED_COMPANIES must include all major big tech companies with masked names (G***, A***, N***, M***, S***, T***, V***, F***, O***, U***, L***, Z***)', () => {
      assert.ok(Array.isArray(MASKED_COMPANIES), 'MASKED_COMPANIES must be an array');
      assert.ok(MASKED_COMPANIES.length >= 14, `Expected >= 14 companies, found ${MASKED_COMPANIES.length}`);

      const maskedNames = MASKED_COMPANIES.map((c) => c.maskedName);
      const expectedMasked = ['G***', 'A***', 'N***', 'M***', 'S***', 'T***', 'V***', 'F***', 'O***', 'U***', 'L***', 'Z***'];

      expectedMasked.forEach((expected) => {
        assert.ok(
          maskedNames.includes(expected),
          `Expected company with masked name '${expected}' in MASKED_COMPANIES`
        );
      });
    });

    it('MOCK_INTERVIEW_DISCLAIMER must define clear educational disclaimer text', () => {
      assert.ok(MOCK_INTERVIEW_DISCLAIMER, 'MOCK_INTERVIEW_DISCLAIMER must be defined');
      assert.ok(typeof MOCK_INTERVIEW_DISCLAIMER.shortText === 'string');
      assert.ok(MOCK_INTERVIEW_DISCLAIMER.shortText.includes('Miễn trừ trách nhiệm'));
      assert.ok(MOCK_INTERVIEW_DISCLAIMER.shortText.includes('mang tính chất học tập & tham khảo'));
      assert.ok(typeof MOCK_INTERVIEW_DISCLAIMER.fullText === 'string');
      assert.ok(MOCK_INTERVIEW_DISCLAIMER.fullText.includes('Educational Disclaimer'));
      assert.ok(MOCK_INTERVIEW_DISCLAIMER.fullText.includes('không đồng nghĩa, đại diện hay cam kết tương đồng'));
    });

    it('All masked companies must have valid IDs, badge styling, preferred topics, and valid masked name pattern', () => {
      const maskedPattern = /^[A-Z]\*+$/;
      const seenIds = new Set();

      MASKED_COMPANIES.forEach((company) => {
        assert.ok(company.id && typeof company.id === 'string', `Invalid company id: ${company.id}`);
        assert.ok(!seenIds.has(company.id), `Duplicate company id: ${company.id}`);
        seenIds.add(company.id);

        assert.match(
          company.maskedName,
          maskedPattern,
          `Company masked name '${company.maskedName}' must match pattern like G***, A***, N***`
        );

        assert.ok(company.realWorldHint && company.realWorldHint.length > 5, `Invalid realWorldHint: ${company.id}`);
        assert.ok(company.badgeColor && (company.badgeColor.startsWith('#') || company.badgeColor.startsWith('rgb')), `Invalid badgeColor: ${company.badgeColor}`);
        assert.ok(company.tagline && company.tagline.length > 5, `Empty tagline: ${company.id}`);
        assert.ok(company.description && company.description.length > 10, `Empty description: ${company.id}`);
        assert.ok(company.cultureAndBarRaiserTip && company.cultureAndBarRaiserTip.length > 10, `Empty culture tip: ${company.id}`);
        assert.ok(Array.isArray(company.preferredTopics) && company.preferredTopics.length >= 1, `Empty preferredTopics: ${company.id}`);

        // Interviewer personas
        assert.ok(Array.isArray(company.interviewers) && company.interviewers.length >= 1, `Must have >= 1 interviewer: ${company.id}`);
        company.interviewers.forEach((interviewer) => {
          assert.ok(interviewer.id, `Interviewer missing id: ${company.id}`);
          assert.ok(interviewer.name && interviewer.name.length > 2, `Invalid interviewer name: ${interviewer.name}`);
          assert.ok(interviewer.role && interviewer.role.includes(company.maskedName), `Interviewer role should mention company: ${interviewer.role}`);
          assert.ok(interviewer.avatarIcon, `Interviewer missing avatarIcon: ${interviewer.id}`);
          assert.ok(interviewer.welcomeGreeting && interviewer.welcomeGreeting.length > 15, `Empty welcome greeting: ${interviewer.id}`);
          assert.ok(interviewer.gender === 'male' || interviewer.gender === 'female', `Interviewer gender must be male or female: ${interviewer.id}`);
          assert.ok(interviewer.positiveReaction && interviewer.positiveReaction.length > 10, `Empty positive reaction: ${interviewer.id}`);
          assert.ok(interviewer.neutralReaction && interviewer.neutralReaction.length > 10, `Empty neutral reaction: ${interviewer.id}`);
          assert.ok(interviewer.constructiveReaction && interviewer.constructiveReaction.length > 10, `Empty constructive reaction: ${interviewer.id}`);
          assert.ok(interviewer.hintPrefix && interviewer.hintPrefix.length > 5, `Empty hintPrefix: ${interviewer.id}`);
        });

        // Candidate Q&A
        assert.ok(Array.isArray(company.candidateQA) && company.candidateQA.length >= 1, `Must have >= 1 candidateQA: ${company.id}`);
        company.candidateQA.forEach((qa) => {
          assert.ok(qa.id, `QA missing id: ${company.id}`);
          assert.ok(qa.question && qa.question.length > 5, `QA question empty: ${company.id}`);
          assert.ok(qa.interviewerAnswer && qa.interviewerAnswer.length > 15, `QA interviewer answer empty: ${company.id}`);
        });
      });
    });

    it('ENTRY_LEVEL_PROFILES must define complete guidelines for Intern, Fresher, and Junior', () => {
      const levels = ['Intern', 'Fresher', 'Junior'];

      levels.forEach((lvl) => {
        const profile = ENTRY_LEVEL_PROFILES[lvl];
        assert.ok(profile, `Profile for level ${lvl} must exist`);
        assert.strictEqual(profile.level, lvl);
        assert.ok(profile.title && profile.title.length > 3);
        assert.ok(profile.targetAudience && profile.targetAudience.length > 10);
        assert.ok(typeof profile.defaultQuestionCount === 'number' && profile.defaultQuestionCount >= 3);
        assert.ok(typeof profile.expectedDurationMinutes === 'number' && profile.expectedDurationMinutes >= 15);
        assert.ok(Array.isArray(profile.coreExpectations) && profile.coreExpectations.length >= 3);
        assert.ok(typeof profile.passThresholdScore === 'number' && profile.passThresholdScore >= 50);
        assert.ok(typeof profile.strongHireThresholdScore === 'number' && profile.strongHireThresholdScore > profile.passThresholdScore);
      });
    });

    it('Helper functions getCompanyById and getRandomCompany must resolve valid masked companies', () => {
      const gCompany = getCompanyById('company-g');
      assert.strictEqual(gCompany.maskedName, 'G***');

      const nonExistent = getCompanyById('unknown-id');
      assert.ok(nonExistent && nonExistent.maskedName, 'Fallback to first company for unknown ID');

      const randomComp = getRandomCompany();
      assert.ok(randomComp && randomComp.maskedName.includes('***'), 'getRandomCompany must return a masked company');
    });
  });
});


