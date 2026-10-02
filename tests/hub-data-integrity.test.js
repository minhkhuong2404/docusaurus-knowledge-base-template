const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { loadTsModule, transpileCode, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

describe('Java Career Hub Data Integrity & AST Safety Suite', () => {
  describe('Practical Tips (FIFTY_PRACTICAL_TIPS) Invariants', () => {
    const tipsModule = loadTsModule('src/data/hubFiftyTipsData.ts');
    const { FIFTY_PRACTICAL_TIPS } = tipsModule;

    it('FIFTY_PRACTICAL_TIPS should be an array with at least 120 tips', () => {
      assert.ok(Array.isArray(FIFTY_PRACTICAL_TIPS), 'FIFTY_PRACTICAL_TIPS must be an array');
      assert.ok(FIFTY_PRACTICAL_TIPS.length >= 120, `Expected >= 120 tips, found ${FIFTY_PRACTICAL_TIPS.length}`);
    });

    const validCategories = new Set([
      'Core Java & JVM',
      'Spring Boot & REST',
      'Database & JPA',
      'Testing & QA',
      'Clean Code & Logging',
      'Git & Tác Phong',
      'Hạ Tầng & Security',
      'Hệ Thống & Tải Cao'
    ]);

    const validPriorities = new Set(['Bắt Buộc', 'Hiệu Năng', 'Kiến Trúc', 'Tác Phong']);

    it('All tips must have unique IDs, valid categories, valid priorities and non-empty content', () => {
      const seenIds = new Set();
      FIFTY_PRACTICAL_TIPS.forEach((tip) => {
        assert.ok(typeof tip.id === 'number', `Tip ID ${tip.id} must be a number`);
        assert.ok(!seenIds.has(tip.id), `Duplicate tip id: ${tip.id}`);
        seenIds.add(tip.id);

        assert.ok(validCategories.has(tip.category), `Tip #${tip.id} has invalid category: ${tip.category}`);
        assert.ok(validPriorities.has(tip.priority), `Tip #${tip.id} has invalid priority: ${tip.priority}`);
        assert.ok(tip.title && tip.title.trim().length > 0, `Tip #${tip.id} has empty title`);
        assert.ok(tip.summary && tip.summary.trim().length > 0, `Tip #${tip.id} has empty summary`);
        assert.ok(tip.detail && tip.detail.trim().length > 0, `Tip #${tip.id} has empty detail`);
      });
    });
  });

  describe('Interview Questions (INTERVIEW_QUESTIONS) Invariants', () => {
    const questionsModule = loadTsModule('src/data/hubInterviewQuestionsData.ts');
    const { INTERVIEW_QUESTIONS } = questionsModule;

    it('INTERVIEW_QUESTIONS should be an array with at least 95 questions', () => {
      assert.ok(Array.isArray(INTERVIEW_QUESTIONS), 'INTERVIEW_QUESTIONS must be an array');
      assert.ok(INTERVIEW_QUESTIONS.length >= 95, `Expected >= 95 questions, found ${INTERVIEW_QUESTIONS.length}`);
    });

    const validCategories = new Set([
      'Core Java',
      'Spring Boot',
      'Database / JPA',
      'Concurrency & JVM',
      'Testing & QA',
      'Hạ Tầng & Security',
      'Hệ Thống & Tải Cao',
      'Kỹ Năng & Live Coding'
    ]);

    const validLevels = new Set(['Intern', 'Fresher', 'Junior']);

    it('All interview questions must have unique IDs, valid level/category, and deep answer content', () => {
      const seenIds = new Set();
      INTERVIEW_QUESTIONS.forEach((q) => {
        assert.ok(q.id && typeof q.id === 'string', `Question must have string ID: ${q.id}`);
        assert.ok(!seenIds.has(q.id), `Duplicate question id: ${q.id}`);
        seenIds.add(q.id);

        assert.ok(validCategories.has(q.category), `[${q.id}] invalid category: ${q.category}`);
        assert.ok(validLevels.has(q.level), `[${q.id}] invalid level: ${q.level}`);
        assert.ok(q.question && q.question.trim().length > 0, `[${q.id}] question text is empty`);
        assert.ok(q.shortAnswer && q.shortAnswer.trim().length > 0, `[${q.id}] shortAnswer is empty`);
        assert.ok(q.seniorDeepDive && q.seniorDeepDive.trim().length > 0, `[${q.id}] seniorDeepDive is empty`);
        assert.ok(q.trapWarning && q.trapWarning.trim().length > 0, `[${q.id}] trapWarning is empty`);
      });
    });
  });

  describe('Knowledge Modules (KNOWLEDGE_MODULES) Invariants', () => {
    const modulesData = loadTsModule('src/data/hubKnowledgeModulesData.ts');
    const { KNOWLEDGE_MODULES } = modulesData;

    it('KNOWLEDGE_MODULES should be an array with at least 14 modules', () => {
      assert.ok(Array.isArray(KNOWLEDGE_MODULES), 'KNOWLEDGE_MODULES must be an array');
      assert.ok(KNOWLEDGE_MODULES.length >= 14, `Expected >= 14 modules, found ${KNOWLEDGE_MODULES.length}`);
    });

    it('Every module and its topics must have unique IDs and comprehensive descriptions', () => {
      const seenModuleIds = new Set();
      const seenTopicIds = new Set();

      KNOWLEDGE_MODULES.forEach((mod) => {
        assert.ok(mod.id && typeof mod.id === 'string', `Module must have string id: ${mod.id}`);
        assert.ok(!seenModuleIds.has(mod.id), `Duplicate module id: ${mod.id}`);
        seenModuleIds.add(mod.id);

        assert.ok(mod.title && mod.title.trim().length > 0, `Module ${mod.id} has empty title`);
        assert.ok(mod.icon && mod.icon.trim().length > 0, `Module ${mod.id} has empty icon`);
        assert.ok(mod.accentColor && mod.accentColor.startsWith('#'), `Module ${mod.id} accentColor must be hex`);
        assert.ok(mod.tagline && mod.tagline.trim().length > 0, `Module ${mod.id} has empty tagline`);
        assert.ok(Array.isArray(mod.topics) && mod.topics.length > 0, `Module ${mod.id} has no topics`);

        mod.topics.forEach((topic) => {
          assert.ok(topic.id && typeof topic.id === 'string', `Topic must have string id: ${topic.id}`);
          assert.ok(!seenTopicIds.has(topic.id), `Duplicate topic id across modules: ${topic.id}`);
          seenTopicIds.add(topic.id);

          assert.ok(topic.title && topic.title.trim().length > 0, `Topic ${topic.id} has empty title`);
          assert.ok(topic.badge && topic.badge.trim().length > 0, `Topic ${topic.id} has empty badge`);
          assert.ok(topic.summary && topic.summary.trim().length > 0, `Topic ${topic.id} has empty summary`);
          assert.ok(topic.explanation && topic.explanation.trim().length > 0, `Topic ${topic.id} has empty explanation`);
        });
      });
    });
  });

  describe('Hub Main Page AST Scope Safety', () => {
    const hubPagePath = path.resolve(__dirname, '../src/pages/hub/index.tsx');

    it('should transpile hub/index.tsx cleanly without syntax errors', () => {
      assert.doesNotThrow(() => {
        transpileCode(hubPagePath);
      });
    });

    it('should have 0 undeclared runtime identifiers in hub/index.tsx', () => {
      const undeclared = getUndeclaredIdentifiers(hubPagePath);
      assert.deepStrictEqual(
        Array.from(undeclared),
        [],
        `Found undeclared runtime identifiers in hub/index.tsx: ${Array.from(undeclared).join(', ')}`
      );
    });

    it('custom.css must include light mode rules for career hub filters, badges, and trap boxes', () => {
      const fs = require('fs');
      const cssPath = path.resolve(__dirname, '../src/css/custom.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      assert.ok(cssContent.includes('[data-theme="light"] .hub-filter-btn'), 'Missing light theme .hub-filter-btn');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-count-badge'), 'Missing light theme .hub-count-badge');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-level-badge.level-intern'), 'Missing light theme .hub-level-badge');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-question-trap-box'), 'Missing light theme .hub-question-trap-box');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-tip-priority-badge'), 'Missing light theme .hub-tip-priority-badge');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-tip-code-bad'), 'Missing light theme .hub-tip-code-bad');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-tip-code-good'), 'Missing light theme .hub-tip-code-good');
    });

    it('custom.css must include theme synchronization rules for metrics, banners, navigation, and reader in both dark and light modes', () => {
      const fs = require('fs');
      const cssPath = path.resolve(__dirname, '../src/css/custom.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      // Dark mode synchronization
      assert.ok(cssContent.includes('[data-theme="dark"] .hub-mock-banner-title'), 'Missing dark theme .hub-mock-banner-title');
      assert.ok(cssContent.includes('[data-theme="dark"] .hub-hero-badge'), 'Missing dark theme .hub-hero-badge');
      assert.ok(cssContent.includes('[data-theme="dark"] .hub-search-input'), 'Missing dark theme .hub-search-input');
      assert.ok(cssContent.includes('[data-theme="dark"] .hub-metric-card.metric-0'), 'Missing dark theme metric-0');
      assert.ok(cssContent.includes('[data-theme="dark"] .hub-main-nav-tab.tab-lessons'), 'Missing dark theme tab-lessons');
      assert.ok(cssContent.includes('[data-theme="dark"] .hub-main-nav-tab.tab-battles'), 'Missing dark theme tab-battles');

      // Light mode synchronization
      assert.ok(cssContent.includes('[data-theme="light"] .hub-metric-card'), 'Missing light theme .hub-metric-card');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-metric-card.metric-2 .hub-metric-label'), 'Missing light theme metric-2 high contrast');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-mock-banner'), 'Missing light theme .hub-mock-banner');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-main-nav-tab.tab-lessons'), 'Missing light theme tab-lessons');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-main-nav-tab.tab-battles'), 'Missing light theme tab-battles');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-module-card'), 'Missing light theme .hub-module-card');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-topic-index-pane'), 'Missing light theme .hub-topic-index-pane');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-reader-card'), 'Missing light theme .hub-reader-card');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-search-input'), 'Missing light theme .hub-search-input');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-battle-container'), 'Missing light theme .hub-battle-container');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-cv-container'), 'Missing light theme .hub-cv-container');
      assert.ok(cssContent.includes('[data-theme="light"] .hub-probation-container'), 'Missing light theme .hub-probation-container');
    });
  });
});
