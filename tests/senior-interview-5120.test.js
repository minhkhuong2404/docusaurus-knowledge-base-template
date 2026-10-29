const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getUndeclaredIdentifiers, loadTsModule } = require('./helpers/transpileHelper');

describe('128 Senior Interview Questions Bank (Curated Edition) Test Suite', () => {
  const dataFilePath = path.join(process.cwd(), 'src', 'data', 'interviewQuestions5120Data.ts');
  const componentPath = path.join(process.cwd(), 'src', 'components', 'career-hub', 'SeniorInterview5120Suite.tsx');
  const hubIndexPath = path.join(process.cwd(), 'src', 'pages', 'hub', 'index.tsx');

  test('interviewQuestions5120Data.ts must exist and compile cleanly', () => {
    assert.ok(fs.existsSync(dataFilePath), 'interviewQuestions5120Data.ts must exist on disk');
    const content = fs.readFileSync(dataFilePath, 'utf8');
    assert.ok(content.length > 50000, 'File must have rich data content');
    const undeclared = getUndeclaredIdentifiers(dataFilePath);
    assert.deepStrictEqual(undeclared, [], `interviewQuestions5120Data.ts has undeclared variables: ${undeclared.join(', ')}`);
  });

  test('Data invariants: exactly 128 curated questions, 8 domains, equal division (16 Qs each)', () => {
    const dataModule = loadTsModule(dataFilePath);
    const { getInterview5120Questions, getRandomInterview5120Questions, DOMAINS_META, ALL_INTERVIEW_QUESTIONS_128 } = dataModule;

    // 1. Domains check
    assert.strictEqual(DOMAINS_META.length, 8, 'Must have exactly 8 technical domains');
    const expectedDomainCodes = ['JAVA', 'SPRING', 'GIT', 'DOCKER', 'SQL', 'REDIS', 'KAFKA', 'SYS'];
    const actualCodes = DOMAINS_META.map((d) => d.shortCode);
    assert.deepStrictEqual(actualCodes, expectedDomainCodes, 'Domain codes must match expected set');

    // Check domain counts
    DOMAINS_META.forEach((d) => {
      assert.strictEqual(d.totalCount, 16, `Domain ${d.shortCode} must have 16 total count in metadata`);
      assert.strictEqual(d.applyingCount, 8, `Domain ${d.shortCode} must have 8 applying count`);
      assert.strictEqual(d.analyzingCount, 8, `Domain ${d.shortCode} must have 8 analyzing count`);
    });

    // 2. Questions generation check
    const allQuestions = getInterview5120Questions();
    assert.strictEqual(allQuestions.length, 128, 'getInterview5120Questions must return exactly 128 items');
    assert.strictEqual(ALL_INTERVIEW_QUESTIONS_128.length, 128, 'ALL_INTERVIEW_QUESTIONS_128 must have 128 items');

    // 3. Category division check
    const applyingQuestions = allQuestions.filter((q) => q.category === 'Thực Hành & Áp Dụng');
    const analyzingQuestions = allQuestions.filter((q) => q.category === 'Phân Tích & Điều Tra Sự Cố');
    assert.strictEqual(applyingQuestions.length, 64, 'Must have exactly 64 Thực Hành & Áp Dụng questions');
    assert.strictEqual(analyzingQuestions.length, 64, 'Must have exactly 64 Phân Tích & Điều Tra Sự Cố questions');

    // 4. Per-domain division check
    expectedDomainCodes.forEach((code) => {
      const domainQs = allQuestions.filter((q) => q.domainCode === code);
      assert.strictEqual(domainQs.length, 16, `Domain ${code} must have exactly 16 questions`);

      const domainApp = domainQs.filter((q) => q.category === 'Thực Hành & Áp Dụng');
      const domainAna = domainQs.filter((q) => q.category === 'Phân Tích & Điều Tra Sự Cố');
      assert.strictEqual(domainApp.length, 8, `Domain ${code} must have 8 applying questions`);
      assert.strictEqual(domainAna.length, 8, `Domain ${code} must have 8 analyzing questions`);
    });

    // 5. Deduplication & Unique IDs check
    const idSet = new Set();
    const questionTextSet = new Set();
    allQuestions.forEach((q) => {
      assert.ok(q.id, 'Question must have an ID');
      assert.ok(!idSet.has(q.id), `Duplicate Question ID detected: ${q.id}`);
      idSet.add(q.id);

      assert.ok(!questionTextSet.has(q.question), `Duplicate Question text detected: ${q.question}`);
      questionTextSet.add(q.question);

      // Verify non-empty required fields
      assert.ok(q.domain && q.domain.trim().length > 0, `ID ${q.id} missing domain`);
      assert.ok(q.domainCode && q.domainCode.trim().length > 0, `ID ${q.id} missing domainCode`);
      assert.ok(q.theme && q.theme.trim().length > 0, `ID ${q.id} missing theme`);
      assert.ok(q.question && q.question.trim().length > 10, `ID ${q.id} question text too short`);
      assert.ok(q.scenarioContext && q.scenarioContext.trim().length > 10, `ID ${q.id} scenarioContext too short`);
      assert.ok(q.juniorTrap && q.juniorTrap.trim().length > 10, `ID ${q.id} juniorTrap too short`);
      assert.ok(q.seniorSolution && q.seniorSolution.trim().length > 10, `ID ${q.id} seniorSolution too short`);
      assert.ok(q.practicalProof && q.practicalProof.trim().length > 5, `ID ${q.id} practicalProof too short`);
      assert.ok(Array.isArray(q.tags) && q.tags.length > 0, `ID ${q.id} must have tags`);
    });
    assert.strictEqual(idSet.size, 128, 'All 128 IDs must be strictly unique');
    assert.strictEqual(questionTextSet.size, 128, 'All 128 Question texts must be strictly unique without duplication');

    // 6. Random selection utility check
    const random5 = getRandomInterview5120Questions(5);
    assert.strictEqual(random5.length, 5, 'getRandomInterview5120Questions(5) must return 5 items');

    const randomJava = getRandomInterview5120Questions(10, 'JAVA');
    assert.strictEqual(randomJava.length, 10, 'getRandomInterview5120Questions must return 10 JAVA items');
    randomJava.forEach((q) => assert.strictEqual(q.domainCode, 'JAVA'));
  });

  test('SeniorInterview5120Suite.tsx must compile cleanly and have 0 undeclared variables (AST scope safety)', () => {
    assert.ok(fs.existsSync(componentPath), 'SeniorInterview5120Suite.tsx must exist');
    const undeclared = getUndeclaredIdentifiers(componentPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `SeniorInterview5120Suite.tsx must have 0 undeclared identifiers. Found: ${undeclared.join(', ')}`
    );
  });

  test('Career Hub page integration check', () => {
    const hubContent = fs.readFileSync(hubIndexPath, 'utf8');
    assert.ok(hubContent.includes('interview5120'), 'hub/index.tsx must contain interview5120 tab ID');
    assert.ok(hubContent.includes('SeniorInterview5120Suite'), 'hub/index.tsx must import SeniorInterview5120Suite');
    assert.ok(hubContent.includes('128 Câu Hỏi Thực Chiến'), 'hub/index.tsx must contain 128 Câu Hỏi Thực Chiến tab label');
  });

  test('No Bloom Taxonomy wording in user-facing UI labels, categories or headers', () => {
    const suiteContent = fs.readFileSync(componentPath, 'utf8');
    assert.ok(
      !suiteContent.toLowerCase().includes('bloom taxonomy'),
      'SeniorInterview5120Suite must not contain "bloom taxonomy"'
    );
    assert.ok(
      !suiteContent.toLowerCase().includes('bloom’s taxonomy'),
      'SeniorInterview5120Suite must not contain "bloom’s taxonomy"'
    );
    assert.ok(
      !suiteContent.includes('Bloom L3'),
      'SeniorInterview5120Suite must not contain "Bloom L3"'
    );
    assert.ok(
      !suiteContent.includes('Bloom L4'),
      'SeniorInterview5120Suite must not contain "Bloom L4"'
    );

    const dataContent = fs.readFileSync(dataFilePath, 'utf8');
    assert.ok(
      !dataContent.toLowerCase().includes('bloom taxonomy'),
      'interviewQuestions5120Data must not contain "bloom taxonomy"'
    );
  });

  test('No actionVerb or "Thao tác" / "Hành động" dropdowns/labels in component or data', () => {
    const suiteContent = fs.readFileSync(componentPath, 'utf8');
    assert.ok(!suiteContent.includes('Thao tác:'), 'SeniorInterview5120Suite must not contain "Thao tác:"');
    assert.ok(!suiteContent.includes('Hành động:'), 'SeniorInterview5120Suite must not contain "Hành động:"');
    assert.ok(!suiteContent.includes('actionVerb'), 'SeniorInterview5120Suite must not reference actionVerb');
    assert.ok(!suiteContent.includes('640'), 'SeniorInterview5120Suite must not contain legacy 640 câu count');

    const dataContent = fs.readFileSync(dataFilePath, 'utf8');
    assert.ok(!dataContent.includes('actionVerb'), 'interviewQuestions5120Data must not contain actionVerb');
  });
});
