const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const {
  transpileCode,
  getUndeclaredIdentifiers,
  validateJsxEntities,
} = require('./helpers/transpileHelper');

describe('SLF4J, Log Levels & Error Stacktrace Printout Architecture Suite', () => {
  const docPath = 'docs/technical-knowledge/java/java-logging-slf4j-stacktrace.md';
  const overviewPath = 'docs/technical-knowledge/java/java-overview.md';
  const sidebarPath = 'sidebars.ts';
  const diagramPath = 'src/components/Slf4jStacktraceArchitectureDiagram.tsx';

  it('java-logging-slf4j-stacktrace.md should exist and cover SLF4J, log levels, and stacktrace internals in detail', () => {
    assert.ok(fs.existsSync(docPath), `${docPath} must exist`);
    const content = fs.readFileSync(docPath, 'utf8');

    // SLF4J Architecture & Binding
    assert.ok(content.includes('SLF4JServiceProvider'), 'Must cover SLF4J 2.x ServiceLoader SPI');
    assert.ok(content.includes('StaticLoggerBinder'), 'Must cover SLF4J 1.7 static binding');
    assert.ok(content.includes('log4j-over-slf4j'), 'Must cover legacy bridge jars');
    assert.ok(content.includes('StackOverflowError'), 'Must warn about bridge infinite loop hazard');

    // Log Levels & Parameterized Evaluation
    for (const level of ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']) {
      assert.ok(content.includes(level), `Must cover log level ${level}`);
    }
    assert.ok(content.includes('/actuator/loggers'), 'Must cover dynamic runtime log level changes');
    assert.ok(content.includes('TurboFilter'), 'Must cover per-request contextual TurboFilter');
    assert.ok(content.includes('log.atDebug()'), 'Must cover SLF4J 2.0 fluent API with lazy Supplier');

    // Error Stacktrace Printout Anatomy & JVM Internals
    assert.ok(content.includes('Caused by:'), 'Must dissect Caused by: exception chains');
    assert.ok(content.includes('Suppressed:'), 'Must dissect Suppressed: try-with-resources exceptions');
    assert.ok(content.includes('common frames omitted'), 'Must explain ... N common frames omitted algorithm');
    assert.ok(content.includes('printEnclosedStackTrace'), 'Must explain JDK printEnclosedStackTrace suffix matching');
    assert.ok(content.includes('rootCauseFirst'), 'Must cover Logback ShortenedThrowableConverter rootCauseFirst');
    assert.ok(content.includes('fillInStackTrace'), 'Must cover native JVM_FillInStackTrace cost');
    assert.ok(content.includes('OmitStackTraceInFastThrow'), 'Must explain JIT OmitStackTraceInFastThrow missing stacktrace mystery');

    // Async Logging & MDC
    assert.ok(content.includes('AsyncAppender'), 'Must cover AsyncAppender queue and discardingThreshold');
    assert.ok(content.includes('discardingThreshold'), 'Must explain discardingThreshold=0 for INFO retention');
    assert.ok(content.includes('MDC.clear()'), 'Must cover MDC ThreadLocal cleanup');
  });

  it('sidebars.ts and java-overview.md must register and link java-logging-slf4j-stacktrace', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(
      sidebarContent.includes('technical-knowledge/java/java-logging-slf4j-stacktrace'),
      'sidebars.ts must register technical-knowledge/java/java-logging-slf4j-stacktrace'
    );

    const overviewContent = fs.readFileSync(overviewPath, 'utf8');
    assert.ok(
      overviewContent.includes('java-logging-slf4j-stacktrace'),
      'java-overview.md must link to java-logging-slf4j-stacktrace'
    );
  });

  it('Slf4jStacktraceArchitectureDiagram.tsx should transpile cleanly, have 0 undeclared identifiers, and use moving arrows', () => {
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);

    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled diagram code must not be empty');

    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Diagram must have 0 undeclared identifiers, found: ${undeclared.join(', ')}`
    );

    const invalidEntities = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(
      invalidEntities,
      [],
      `Diagram has unescaped raw JSX entities: ${invalidEntities.map((e) => e.text).join(', ')}`
    );

    const raw = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(raw.includes('interactive-diagram-container'), 'Must use interactive-diagram-container');
    assert.ok(raw.includes('interactive-diagram-flowing-path'), 'Must use interactive-diagram-flowing-path moving arrows');
    assert.ok(raw.includes('slf4j_facade'), 'Must support slf4j_facade tab');
    assert.ok(raw.includes('log_levels'), 'Must support log_levels tab');
    assert.ok(raw.includes('stacktrace_anatomy'), 'Must support stacktrace_anatomy tab');
    assert.ok(raw.includes('mdc_concurrency'), 'Must support mdc_concurrency tab');
  });
});
