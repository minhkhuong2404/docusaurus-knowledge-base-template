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
    it('MOCK_INTERVIEW_QUESTIONS must have at least 90 curated questions', () => {
      assert.ok(Array.isArray(MOCK_INTERVIEW_QUESTIONS), 'Questions must be an array');
      assert.ok(
        MOCK_INTERVIEW_QUESTIONS.length >= 90,
        `Expected >= 90 questions, found ${MOCK_INTERVIEW_QUESTIONS.length}`
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

  describe('AI JD Analyzer, Live Bug Hunting & Answer Frameworks Suite', () => {
    const scenariosModule = loadTsModule('src/data/mockInterviewScenariosData.ts');
    const {
      ANSWER_FRAMEWORK_TEMPLATES,
      LIVE_BUG_SCENARIOS,
      SAMPLE_JD_PRESETS,
      analyzeJobDescription,
      generateInterviewerProbes
    } = scenariosModule;

    it('ANSWER_FRAMEWORK_TEMPLATES must provide structured Senior answer templates', () => {
      assert.ok(Array.isArray(ANSWER_FRAMEWORK_TEMPLATES) && ANSWER_FRAMEWORK_TEMPLATES.length >= 3);
      ANSWER_FRAMEWORK_TEMPLATES.forEach((tpl) => {
        assert.ok(tpl.id && tpl.name && tpl.templateText.length > 20);
      });
    });

    it('LIVE_BUG_SCENARIOS must have at least 6 production bug challenges with exactly 1 correct option each', () => {
      assert.ok(Array.isArray(LIVE_BUG_SCENARIOS) && LIVE_BUG_SCENARIOS.length >= 6);
      LIVE_BUG_SCENARIOS.forEach((bug) => {
        assert.ok(bug.id && bug.title && bug.codeSnippet.length > 20);
        assert.ok(Array.isArray(bug.options) && bug.options.length === 3);
        const correctOpts = bug.options.filter((o) => o.isCorrect);
        assert.strictEqual(correctOpts.length, 1, `Bug ${bug.id} must have exactly 1 correct option`);
        assert.ok(bug.seniorTakeaway && bug.seniorTakeaway.length > 15);
      });
    });

    it('SAMPLE_JD_PRESETS and analyzeJobDescription must accurately parse JD keywords and recommend level', () => {
      assert.ok(Array.isArray(SAMPLE_JD_PRESETS) && SAMPLE_JD_PRESETS.length >= 3);

      const internAnalysis = analyzeJobDescription(SAMPLE_JD_PRESETS[0].jdContent);
      assert.strictEqual(internAnalysis.recommendedLevel, 'Intern');
      assert.ok(internAnalysis.detectedTopics.includes('Java Backend'));

      const juniorAnalysis = analyzeJobDescription(SAMPLE_JD_PRESETS[2].jdContent);
      assert.strictEqual(juniorAnalysis.recommendedLevel, 'Junior');
      assert.ok(juniorAnalysis.detectedTopics.length >= 3);
      assert.ok(juniorAnalysis.readinessChecklist.length >= 3);
    });

    it('generateInterviewerProbes must generate contextual follow-up probes based on missing points and score', () => {
      const probesWithMissing = generateInterviewerProbes(
        'Spring Boot',
        ['Cơ chế Spring AOP Proxy'],
        'Cẩn thận lỗi Self-Invocation',
        65
      );
      assert.ok(probesWithMissing.length >= 2);
      assert.ok(probesWithMissing[0].includes('Spring AOP Proxy'));

      const probesHighScore = generateInterviewerProbes('Database', [], 'Tránh dùng EAGER', 90);
      assert.ok(probesHighScore.length >= 3);
    });
  });

  describe('Behavioral STAR Coach, Rapid-Fire Round & Practice History Suite', () => {
    const practiceModule = loadTsModule('src/data/mockInterviewPracticeData.ts');
    const {
      BEHAVIORAL_QUESTIONS,
      evaluateStarAnswer,
      RAPID_FIRE_STATEMENTS,
      pickRapidFireRound,
      appendPracticeHistory,
      summarizePracticeHistory
    } = practiceModule;

    it('BEHAVIORAL_QUESTIONS must provide complete STAR stories and evaluateStarAnswer must detect S-T-A-R cues', () => {
      assert.ok(Array.isArray(BEHAVIORAL_QUESTIONS) && BEHAVIORAL_QUESTIONS.length >= 5);
      BEHAVIORAL_QUESTIONS.forEach((bq) => {
        assert.ok(bq.id && bq.question && bq.sampleStarAnswer.situation && bq.sampleStarAnswer.result);
      });

      const fullStar = evaluateStarAnswer(
        'Khi làm đồ án tốt nghiệp, nhiệm vụ của em là tối ưu API tìm kiếm. Em đã phân tích EXPLAIN và thêm B-Tree Index kết hợp JOIN FETCH. Kết quả là thời gian phản hồi giảm 85% từ 3 giây xuống 180ms cho 100 người dùng.'
      );
      assert.strictEqual(fullStar.detected.situation, true);
      assert.strictEqual(fullStar.detected.task, true);
      assert.strictEqual(fullStar.detected.action, true);
      assert.strictEqual(fullStar.detected.result, true);
      assert.strictEqual(fullStar.hasMetrics, true);
      assert.ok(fullStar.score >= 85, `Expected STAR score >= 85, got ${fullStar.score}`);
    });

    it('RAPID_FIRE_STATEMENTS and pickRapidFireRound must return non-mutating random subsets', () => {
      assert.ok(Array.isArray(RAPID_FIRE_STATEMENTS) && RAPID_FIRE_STATEMENTS.length >= 18);
      const round = pickRapidFireRound(10);
      assert.strictEqual(round.length, 10);
      round.forEach((item) => {
        assert.strictEqual(typeof item.isTrue, 'boolean');
        assert.ok(item.statement && item.explanation);
      });
    });

    it('appendPracticeHistory and summarizePracticeHistory must track score trends accurately', () => {
      let hist = [];
      hist = appendPracticeHistory(hist, {
        timestamp: 1,
        companyMaskedName: 'G***',
        level: 'Fresher',
        avgScore: 70,
        decision: 'HIRE',
        questionCount: 5
      });
      hist = appendPracticeHistory(hist, {
        timestamp: 2,
        companyMaskedName: 'A***',
        level: 'Fresher',
        avgScore: 86,
        decision: 'STRONG_HIRE',
        questionCount: 5
      });

      const summary = summarizePracticeHistory(hist);
      assert.strictEqual(summary.totalSessions, 2);
      assert.strictEqual(summary.bestScore, 86);
      assert.strictEqual(summary.averageScore, 78);
      assert.strictEqual(summary.trend, 16);
    });

    it('GitHub Actions deploy.yml must only run test and build on pull_request (skip Pages setup, artifact upload, and deploy)', () => {
      const workflowPath = path.resolve(__dirname, '../.github/workflows/deploy.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      const prGuardMatches = workflowContent.match(/if:\s*github\.event_name\s*!=\s*'pull_request'\s*&&\s*github\.ref\s*==\s*'refs\/heads\/master'/g);
      assert.ok(
        prGuardMatches && prGuardMatches.length >= 3,
        'Expected Setup Pages, Upload artifact, and Deploy job to all be guarded against pull_request events'
      );
    });
  });
});





