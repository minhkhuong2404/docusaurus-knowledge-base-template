import React, { useState } from 'react';

export type Slf4jDiagramTab =
  | 'slf4j_facade'
  | 'log_levels'
  | 'stacktrace_anatomy'
  | 'mdc_concurrency';

interface Props {
  initialTab?: Slf4jDiagramTab;
}

interface FacadeNode {
  id: string;
  title: string;
  subtitle: string;
  layer: 'Application' | 'Bridge' | 'Facade' | 'Binding' | 'Appender';
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mechanics: string;
  productionGotcha: string;
  codeSnippet: string;
}

const FACADE_NODES: FacadeNode[] = [
  {
    id: 'app_code',
    title: 'Application Code (@Slf4j)',
    subtitle: 'org.slf4j.Logger API Calls',
    layer: 'Application',
    color: '#38bdf8',
    x: 24,
    y: 35,
    width: 195,
    height: 68,
    mechanics:
      'Application classes depend exclusively on org.slf4j:slf4j-api. Lombok @Slf4j generates: private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ClassName.class); at AST compile time.',
    productionGotcha:
      'NEVER import ch.qos.logback.* or org.apache.logging.log4j.* directly in business classes. Doing so locks your codebase to a concrete engine and breaks library consumers.',
    codeSnippet:
      'log.error("Payment failed for orderId={}", orderId, ex); // Exception is LAST arg without {}!',
  },
  {
    id: 'legacy_bridges',
    title: 'Legacy Logging Bridges',
    subtitle: 'jul-to-slf4j / log4j-over-slf4j',
    layer: 'Bridge',
    color: '#fbbf24',
    x: 24,
    y: 145,
    width: 195,
    height: 68,
    mechanics:
      'Third-party libraries (Hibernate, Kafka, Tomcat, Netty) may log via JUL (java.util.logging), JCL (commons-logging), or Log4j 1.x. Bridge JARs shadow those classes and redirect all calls into SLF4J.',
    productionGotcha:
      'INFINITE LOOP HAZARD: Having both log4j-over-slf4j.jar AND slf4j-log4j12.jar on the classpath causes SLF4J -> Log4j -> SLF4J recursion, crashing the JVM with StackOverflowError! Also: jul-to-slf4j requires SLF4JBridgeHandler.install() and LevelChangePropagator for performance.',
    codeSnippet:
      '<contextListener class="ch.qos.logback.classic.jul.LevelChangePropagator">\n  <resetJUL>true</resetJUL>\n</contextListener>',
  },
  {
    id: 'slf4j_api',
    title: 'SLF4J 2.x Facade Router',
    subtitle: 'ServiceLoader<SLF4JServiceProvider>',
    layer: 'Facade',
    color: '#34d399',
    x: 270,
    y: 90,
    width: 205,
    height: 74,
    mechanics:
      'SLF4J 1.7 used static bytecode binding (org.slf4j.impl.StaticLoggerBinder). SLF4J 2.0+ (Spring Boot 3+) uses standard Java SPI ServiceLoader to discover META-INF/services/org.slf4j.spi.SLF4JServiceProvider at startup.',
    productionGotcha:
      'If 0 providers are on the classpath, SLF4J prints "SLF4J: No SLF4J providers were found" to stderr and falls back to a silent NOP (No-Operation) logger—dropping all production logs!',
    codeSnippet:
      '// SLF4J 2.0 Fluent API with lazy Supplier & structured key-values\nlog.atError().setCause(ex).addKeyValue("orderId", id).log("Checkout failed");',
  },
  {
    id: 'concrete_engine',
    title: 'Logback / Log4j2 Core',
    subtitle: 'TurboFilter -> Level Gate -> Encoder',
    layer: 'Binding',
    color: '#a78bfa',
    x: 525,
    y: 35,
    width: 215,
    height: 68,
    mechanics:
      'Evaluates TurboFilters (e.g. MDC threshold overrides), checks effective logger level (Logger.effectiveLevelInt <= Event.levelInt), formats message placeholders via MessageFormatter, and extracts ThrowableProxy.',
    productionGotcha:
      'Synchronous file/console logging acquires an OutputStream lock in Logback. Under 10,000 RPS or Virtual Threads, synchronous I/O pins carrier threads and degrades p99 latency.',
    codeSnippet:
      '// Effective Level check takes ~1.5 nanoseconds when disabled\nif (effectiveLevelInt > Level.DEBUG_INT) return;',
  },
  {
    id: 'async_appender',
    title: 'AsyncAppender / Disruptor',
    subtitle: 'ArrayBlockingQueue / RingBuffer',
    layer: 'Appender',
    color: '#f472b6',
    x: 525,
    y: 145,
    width: 215,
    height: 68,
    mechanics:
      'Decouples application threads from disk/network I/O. Logback AsyncAppender pushes ILoggingEvent into an ArrayBlockingQueue (default size 256); Log4j2 AsyncLogger uses LMAX Disruptor lock-free ring buffer.',
    productionGotcha:
      'DISCARDING THRESHOLD: When Logback AsyncAppender queue reaches 80% full (remaining < 20%), it automatically DROPS TRACE, DEBUG, and INFO logs to prevent application thread stalls unless discardingThreshold=0! Also set neverBlock=true to protect latency.',
    codeSnippet:
      '<appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">\n  <queueSize>2048</queueSize>\n  <discardingThreshold>0</discardingThreshold>\n  <neverBlock>true</neverBlock>\n</appender>',
  },
];

interface LogLevelSpec {
  level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  weight: number;
  color: string;
  purpose: string;
  prodPolicy: string;
  stacktracePolicy: string;
  exampleCall: string;
  antiPattern: string;
}

const LOG_LEVELS: LogLevelSpec[] = [
  {
    level: 'TRACE',
    weight: 0,
    color: '#94a3b8',
    purpose: 'Byte-level wire payloads, loop-step state, inner algorithm steps, or JDBC parameter bindings.',
    prodPolicy: 'DISABLED in production & staging. Only enabled ephemerally via Actuator for seconds.',
    stacktracePolicy: 'Never used for business exceptions.',
    exampleCall: 'log.trace("Parsed TCP frame header: magic={}, len={}", magicHex, frameLen);',
    antiPattern: 'Enabling TRACE globally in production—can generate 50GB/min of I/O and saturate disk.',
  },
  {
    level: 'DEBUG',
    weight: 10,
    color: '#38bdf8',
    purpose: 'Diagnostic flow context for developers: cache hit/miss, branch decisions, intermediate DTO state.',
    prodPolicy: 'DISABLED by default in prod; enabled per-package dynamically via /actuator/loggers or MDC TurboFilter for VIP debug users.',
    stacktracePolicy: 'Optional for handled low-level retryable exceptions (e.g. first retry of transient socket timeout).',
    exampleCall: 'log.debug("Cache miss for userKey={}, querying replica DB", userKey);',
    antiPattern: 'Eager string concatenation: log.debug("Payload: " + mapper.writeValueAsString(dto)) runs serialization even when DEBUG is OFF!',
  },
  {
    level: 'INFO',
    weight: 20,
    color: '#34d399',
    purpose: 'State-changing business milestones & lifecycle transitions (OrderPlaced, PaymentCaptured, ServiceStarted).',
    prodPolicy: 'ENABLED in production. Retained 14–30 days in Elasticsearch / Loki.',
    stacktracePolicy: 'NO stacktraces at INFO. If an error needs a stacktrace, it is WARN or ERROR.',
    exampleCall: 'log.info("Order checkout completed: orderId={}, amount={}, latencyMs={}", id, amt, ms);',
    antiPattern: 'Logging inside tight loops or every HTTP 200 healthcheck/read query at INFO.',
  },
  {
    level: 'WARN',
    weight: 30,
    color: '#fbbf24',
    purpose: 'Degraded or unexpected condition that the system recovered from automatically, or 4xx client errors.',
    prodPolicy: 'ENABLED in production. Retained 30–90 days. Monitored via anomaly rate alerts (e.g. >50/min).',
    stacktracePolicy: 'NO stacktrace for expected 4xx validation/business errors; YES stacktrace for unexpected fallback/retry exhaustion.',
    exampleCall: 'log.warn("Primary payment gateway timed out after {}ms; failing over to backup", timeoutMs);',
    antiPattern: 'Logging full 80-line stacktraces on every HTTP 400 Bad Request or 404 Not Found—pollutes logs and hides real bugs.',
  },
  {
    level: 'ERROR',
    weight: 40,
    color: '#f87171',
    purpose: 'Unrecoverable operation failure requiring human investigation (5xx unhandled failure, DB down, data corruption, DLQ).',
    prodPolicy: 'ENABLED 100% in production. Retained 90+ days. Triggers PagerDuty / Slack on-call alert.',
    stacktracePolicy: 'MANDATORY full exception object as the LAST argument so root cause & chain are captured.',
    exampleCall: 'log.error("Failed to persist payment settlement for orderId={}", orderId, ex);',
    antiPattern: 'Swallowing the stacktrace via log.error("Error: " + ex.getMessage()) or log-and-throw duplication across 4 layers!',
  },
];

interface StacktraceSection {
  id: string;
  label: string;
  tag: string;
  color: string;
  rawLines: string[];
  meaning: string;
  howToRead: string;
  jvmInternals: string;
}

const STACKTRACE_SECTIONS: StacktraceSection[] = [
  {
    id: 'wrapper_head',
    label: '1. Top-Level Wrapper Exception (Symptom)',
    tag: 'OUTERMOST LAYER',
    color: '#f97316',
    rawLines: [
      'com.acme.payment.OrderCheckoutException: Checkout failed for orderId=ord_88412 [errorCode=PAYMENT_SETTLEMENT_ERROR]',
      '\tat com.acme.payment.CheckoutFacade.completeCheckout(CheckoutFacade.java:94) ~[payment-service-2.4.0.jar:2.4.0]',
      '\tat com.acme.payment.CheckoutController.postCheckout(CheckoutController.java:52) ~[payment-service-2.4.0.jar:2.4.0]',
      '\tat java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103) ~[na:na]',
    ],
    meaning:
      'The outermost exception caught by @RestControllerAdvice or the uncaught handler. It tells you WHICH high-level business workflow failed, NOT the underlying technical cause.',
    howToRead:
      'Read the business context (orderId=ord_88412), then immediately scroll DOWN to the last "Caused by:" block to find what actually broke.',
    jvmInternals:
      'Logback appends packaging data ~[payment-service-2.4.0.jar:2.4.0] by inspecting the ClassLoader CodeSource of each StackTraceElement class.',
  },
  {
    id: 'suppressed_block',
    label: '2. Suppressed Exceptions (try-with-resources)',
    tag: 'SUPPRESSED CHAIN',
    color: '#fbbf24',
    rawLines: [
      '\tSuppressed: java.sql.SQLException: Connection is already closed during rollback cleanup',
      '\t\tat com.zaxxer.hikari.pool.ProxyConnection.checkClosed(ProxyConnection.java:145) ~[HikariCP-5.1.0.jar:na]',
      '\t\tat com.zaxxer.hikari.pool.ProxyConnection.close(ProxyConnection.java:251) ~[HikariCP-5.1.0.jar:na]',
      '\t\tat com.acme.payment.CheckoutFacade.completeCheckout(CheckoutFacade.java:91) ~[payment-service-2.4.0.jar:2.4.0]',
    ],
    meaning:
      'Exceptions thrown inside an implicit finally block when closing AutoCloseable resources after a primary exception was already thrown inside the try {} body.',
    howToRead:
      'Indented with tab + "Suppressed: ". Do not confuse this with the primary cause—this is a secondary failure that occurred during cleanup/close().',
    jvmInternals:
      'Stored in Throwable.suppressedExceptions (List<Throwable>). Populated automatically by javac bytecode generation via primaryEx.addSuppressed(closeEx).',
  },
  {
    id: 'intermediate_cause',
    label: '3. Intermediate Cause & Omitted Common Frames',
    tag: 'MIDDLE TRANSLATION',
    color: '#a78bfa',
    rawLines: [
      'Caused by: org.springframework.dao.CannotAcquireLockException: JDBC commit failed; SQL [UPDATE ledger SET balance=...]',
      '\tat org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:276)',
      '\tat org.springframework.orm.jpa.JpaTransactionManager.doCommit(JpaTransactionManager.java:566)',
      '\tat com.acme.payment.LedgerService.debitAccount(LedgerService.java:118) ~[payment-service-2.4.0.jar:2.4.0]',
      '\t... 42 common frames omitted',
    ],
    meaning:
      'Spring PersistenceExceptionTranslationPostProcessor caught a vendor JPA/JDBC exception and translated it into Spring DataAccessException hierarchy.',
    howToRead:
      'Notice "... 42 common frames omitted". Those 42 frames are identical to the bottom 42 frames of the parent wrapper stack trace above it!',
    jvmInternals:
      'Throwable.printEnclosedStackTrace() compares the child trace[] array and parent enclosingTrace[] array backwards from the bottom, replacing matching tail frames with "... N common frames omitted" to save 70% log volume.',
  },
  {
    id: 'root_cause',
    label: '4. Deepest "Caused by:" (The True Root Cause)',
    tag: 'ROOT CAUSE 🎯',
    color: '#34d399',
    rawLines: [
      'Caused by: org.postgresql.util.PSQLException: ERROR: deadlock detected',
      '  Detail: Process 29104 waits for ShareLock on transaction 884910; blocked by process 29188.',
      '\tat org.postgresql.core.v3.QueryExecutorImpl.receiveErrorResponse(QueryExecutorImpl.java:2725) ~[postgresql-42.7.2.jar:42.7.2]',
      '\tat org.postgresql.jdbc.PgPreparedStatement.executeWithFlags(PgPreparedStatement.java:192) ~[postgresql-42.7.2.jar:42.7.2]',
      '\tat com.acme.payment.LedgerRepository.LockAndDebit(LedgerRepository.java:67) ~[payment-service-2.4.0.jar:2.4.0]',
      '\t... 45 common frames omitted',
    ],
    meaning:
      'THE ACTUAL FAILURE! Everything above this block is just exception wrapping as the error bubbled up the call stack.',
    howToRead:
      '1) Read the exception message ("ERROR: deadlock detected"). 2) Scan down its "at ..." lines until you hit the FIRST frame in your own package (com.acme.payment.LedgerRepository.java:67). Line 67 is where your bug happened!',
    jvmInternals:
      'Pro Tip: Configure Logback ShortenedThrowableConverter with <rootCauseFirst>true</rootCauseFirst> to invert the output and print this root cause at the VERY TOP ("Wrapped by:" instead of "Caused by:").',
  },
];

export default function Slf4jStacktraceArchitectureDiagram({
  initialTab = 'slf4j_facade',
}: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Slf4jDiagramTab>(initialTab);
  const [selectedFacadeNodeId, setSelectedFacadeNodeId] = useState<string>('slf4j_api');
  const [activeThresholdWeight, setActiveThresholdWeight] = useState<number>(20); // Default INFO (20)
  const [selectedLevel, setSelectedLevel] = useState<LogLevelSpec>(LOG_LEVELS[4]); // Default ERROR
  const [selectedStackId, setSelectedStackId] = useState<string>('root_cause');
  const [rootCauseFirstMode, setRootCauseFirstMode] = useState<boolean>(false);

  const selectedFacadeNode =
    FACADE_NODES.find((n) => n.id === selectedFacadeNodeId) || FACADE_NODES[2];
  const selectedStackSection =
    STACKTRACE_SECTIONS.find((s) => s.id === selectedStackId) || STACKTRACE_SECTIONS[3];

  const displayedStackSections = rootCauseFirstMode
    ? [...STACKTRACE_SECTIONS].reverse()
    : STACKTRACE_SECTIONS;

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        background: '#090b14',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '20px',
        color: '#f8fafc',
        margin: '24px 0',
      }}
    >
      <style>{`
        @keyframes slf4jDashFlow {
          to {
            stroke-dashoffset: -24;
          }
        }
        .slf4j-flowing-edge {
          stroke-dasharray: 6 6;
          animation: slf4jDashFlow 0.9s linear infinite;
        }
        .slf4j-split-grid {
          display: grid;
          grid-template-columns: 58% 42%;
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .slf4j-split-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '14px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#38bdf8' }}>
            SLF4J Architecture, Log Level Gate & Stacktrace Telemetry Inspector
          </span>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'slf4j_facade', label: '1. SLF4J Facade & Bridges', color: '#38bdf8' },
            { id: 'log_levels', label: '2. Log Level Severity Gate', color: '#34d399' },
            { id: 'stacktrace_anatomy', label: '3. Stacktrace Printout Anatomy', color: '#f97316' },
            { id: 'mdc_concurrency', label: '4. MDC & Virtual Thread Context', color: '#a78bfa' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Slf4jDiagramTab)}
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.14)' : '#0f172a',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: `1px solid ${isActive ? tab.color : '#334155'}`,
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SLF4J FACADE & BRIDGES */}
      {activeTab === 'slf4j_facade' && (
        <div className="slf4j-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                color: '#94a3b8',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Click any pipeline node to inspect JVM binding & production hazards</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>● Live Flowing Conduit</span>
            </div>

            <svg viewBox="0 0 765 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-amber"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#fbbf24" />
                </marker>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#34d399" />
                </marker>
                <marker
                  id="arrow-purple"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#a78bfa" />
                </marker>
              </defs>

              {/* Directed Edges with Moving Flowing Overlay */}
              {/* App Code -> SLF4J API */}
              <path
                d="M 225 69 L 264 112"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M 225 69 L 264 112"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path slf4j-flowing-edge"
                markerEnd="url(#arrow-cyan)"
              />

              {/* Legacy Bridges -> SLF4J API */}
              <path
                d="M 225 178 L 264 142"
                stroke="rgba(251, 191, 36, 0.25)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M 225 178 L 264 142"
                stroke="#fbbf24"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path slf4j-flowing-edge"
                markerEnd="url(#arrow-amber)"
              />

              {/* SLF4J API -> Concrete Engine */}
              <path
                d="M 481 115 L 519 75"
                stroke="rgba(52, 211, 153, 0.25)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M 481 115 L 519 75"
                stroke="#34d399"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path slf4j-flowing-edge"
                markerEnd="url(#arrow-emerald)"
              />

              {/* Concrete Engine -> Async Appender */}
              <path
                d="M 632 108 L 632 138"
                stroke="rgba(167, 139, 250, 0.25)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M 632 108 L 632 138"
                stroke="#a78bfa"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path slf4j-flowing-edge"
                markerEnd="url(#arrow-purple)"
              />

              {/* Render Interactive SVG Nodes */}
              {FACADE_NODES.map((node) => {
                const isSelected = node.id === selectedFacadeNodeId;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedFacadeNodeId(node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx="8"
                      fill={isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)'}
                      stroke={node.color}
                      strokeWidth={isSelected ? '2.5' : '1.4'}
                    />
                    <text
                      x={node.x + 12}
                      y={node.y + 22}
                      fill={node.color}
                      fontSize="10"
                      fontWeight="700"
                    >
                      [{node.layer.toUpperCase()}]
                    </text>
                    <text
                      x={node.x + 12}
                      y={node.y + 41}
                      fill="#ffffff"
                      fontSize="12.5"
                      fontWeight="700"
                    >
                      {node.title}
                    </text>
                    <text x={node.x + 12} y={node.y + 57} fill="#94a3b8" fontSize="10.5">
                      {node.subtitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Inspector Card */}
          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${selectedFacadeNode.color}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: selectedFacadeNode.color,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              {selectedFacadeNode.layer} Layer Diagnostics
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              {selectedFacadeNode.title}
            </div>
            <p style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '12px' }}>
              {selectedFacadeNode.mechanics}
            </p>
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                borderLeft: '3px solid #f87171',
                padding: '10px 12px',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                PRODUCTION GOTCHA
              </div>
              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedFacadeNode.productionGotcha}
              </div>
            </div>
            <pre
              style={{
                background: '#090b14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.76rem',
                color: '#38bdf8',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              <code>{selectedFacadeNode.codeSnippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: LOG LEVEL SEVERITY GATE */}
      {activeTab === 'log_levels' && (
        <div className="slf4j-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            {/* Active Logger Threshold Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                Configured Logger Threshold Gate:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {LOG_LEVELS.map((lvl) => {
                  const isThreshold = activeThresholdWeight === lvl.weight;
                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={() => setActiveThresholdWeight(lvl.weight)}
                      style={{
                        background: isThreshold ? lvl.color : '#0f172a',
                        color: isThreshold ? '#090b14' : '#e2e8f0',
                        border: `1px solid ${lvl.color}`,
                        borderRadius: '5px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {lvl.level} ({lvl.weight})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG Severity Filter Gate Visualization */}
            <svg viewBox="0 0 700 245" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker
                  id="arrow-pass"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#34d399" />
                </marker>
              </defs>

              {/* Central Filter Gate Bar */}
              <rect
                x="295"
                y="12"
                width="105"
                height="220"
                rx="8"
                fill="rgba(30, 41, 59, 0.85)"
                stroke="#38bdf8"
                strokeWidth="1.8"
              />
              <text x="347" y="34" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                LEVEL GATE
              </text>
              <text x="347" y="50" textAnchor="middle" fill="#ffffff" fontSize="10">
                Threshold &gt;= {activeThresholdWeight}
              </text>

              {/* Appender Sink Box */}
              <rect
                x="510"
                y="65"
                width="170"
                height="115"
                rx="8"
                fill="rgba(6, 78, 59, 0.45)"
                stroke="#34d399"
                strokeWidth="1.8"
              />
              <text x="595" y="102" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">
                MessageFormatter
              </text>
              <text x="595" y="122" textAnchor="middle" fill="#ffffff" fontSize="11">
                + JSON Encoder
              </text>
              <text x="595" y="142" textAnchor="middle" fill="#94a3b8" fontSize="10">
                (Emitted to Appenders)
              </text>

              {LOG_LEVELS.map((lvl, idx) => {
                const yPos = 22 + idx * 43;
                const passesGate = lvl.weight >= activeThresholdWeight;
                const isSelected = selectedLevel.level === lvl.level;

                return (
                  <g
                    key={lvl.level}
                    onClick={() => setSelectedLevel(lvl)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x="18"
                      y={yPos}
                      width="190"
                      height="34"
                      rx="6"
                      fill={isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)'}
                      stroke={lvl.color}
                      strokeWidth={isSelected ? '2.2' : '1.2'}
                    />
                    <text x="30" y={yPos + 21} fill={lvl.color} fontSize="11.5" fontWeight="700">
                      log.{lvl.level.toLowerCase()}(...)
                    </text>
                    <text x="155" y={yPos + 21} fill="#94a3b8" fontSize="10">
                      [{lvl.weight}]
                    </text>

                    {/* Path from call to gate */}
                    <path
                      d={`M 214 ${yPos + 17} L 289 ${yPos + 17}`}
                      stroke={passesGate ? lvl.color : '#475569'}
                      strokeWidth="2"
                      className={passesGate ? 'interactive-diagram-flowing-path slf4j-flowing-edge' : ''}
                    />

                    {/* Gate Status Pill */}
                    <text
                      x="347"
                      y={yPos + 21}
                      textAnchor="middle"
                      fill={passesGate ? '#34d399' : '#f87171'}
                      fontSize="10"
                      fontWeight="700"
                    >
                      {passesGate ? 'PASS ✓' : 'DROP (1.5ns)'}
                    </text>

                    {/* Path from gate to Appender if passed */}
                    {passesGate && (
                      <path
                        d={`M 405 ${yPos + 17} L 504 122`}
                        stroke="#34d399"
                        strokeWidth="1.8"
                        fill="none"
                        className="interactive-diagram-flowing-path slf4j-flowing-edge"
                        markerEnd="url(#arrow-pass)"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Level Detail Card */}
          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${selectedLevel.color}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  background: selectedLevel.color,
                  color: '#090b14',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '3px 9px',
                  borderRadius: '4px',
                }}
              >
                {selectedLevel.level} (Int Weight: {selectedLevel.weight})
              </span>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Click any row on left</span>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginBottom: '10px', lineHeight: 1.5 }}>
              <strong style={{ color: '#ffffff' }}>Architectural Purpose:</strong> {selectedLevel.purpose}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#34d399', marginBottom: '8px', lineHeight: 1.45 }}>
              <strong style={{ color: '#ffffff' }}>Production Policy:</strong> {selectedLevel.prodPolicy}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginBottom: '10px', lineHeight: 1.45 }}>
              <strong style={{ color: '#ffffff' }}>Stacktrace Rule:</strong> {selectedLevel.stacktracePolicy}
            </div>

            <pre
              style={{
                background: '#090b14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '9px',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                overflowX: 'auto',
                marginBottom: '10px',
              }}
            >
              <code>{selectedLevel.exampleCall}</code>
            </pre>

            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                borderLeft: '3px solid #f87171',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                color: '#e2e8f0',
              }}
            >
              <strong style={{ color: '#f87171' }}>Anti-Pattern to Avoid: </strong>
              {selectedLevel.antiPattern}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STACKTRACE PRINTOUT ANATOMY */}
      {activeTab === 'stacktrace_anatomy' && (
        <div className="slf4j-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Click any stacktrace block below to decode its JVM frame structure:
              </span>
              <button
                type="button"
                onClick={() => setRootCauseFirstMode(!rootCauseFirstMode)}
                style={{
                  background: rootCauseFirstMode ? 'rgba(52, 211, 153, 0.2)' : '#0f172a',
                  color: rootCauseFirstMode ? '#34d399' : '#e2e8f0',
                  border: `1px solid ${rootCauseFirstMode ? '#34d399' : '#334155'}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {rootCauseFirstMode
                  ? 'Order: rootCauseFirst=true (Wrapped by:)'
                  : 'Order: Standard JDK (Caused by:)'}
              </button>
            </div>

            {/* Interactive Stacktrace Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {displayedStackSections.map((sec) => {
                const isSelected = sec.id === selectedStackId;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedStackId(sec.id)}
                    style={{
                      background: isSelected ? 'rgba(30, 41, 59, 0.9)' : '#090b14',
                      border: `1.5px solid ${isSelected ? sec.color : '#1e293b'}`,
                      borderLeft: `4px solid ${sec.color}`,
                      borderRadius: '6px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                        {sec.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: sec.color,
                          border: `1px solid ${sec.color}`,
                          borderRadius: '4px',
                          padding: '1px 6px',
                        }}
                      >
                        {sec.tag}
                      </span>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        fontSize: '0.71rem',
                        lineHeight: 1.45,
                        color: '#cbd5e1',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'var(--ifm-font-family-monospace)',
                      }}
                    >
                      {sec.rawLines.join('\n')}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Stacktrace Decoder Panel */}
          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${selectedStackSection.color}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: selectedStackSection.color,
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              {selectedStackSection.tag}
            </div>
            <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              {selectedStackSection.label}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                WHAT THIS BLOCK MEANS
              </div>
              <div style={{ fontSize: '0.83rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {selectedStackSection.meaning}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                HOW SENIOR ENGINEERS READ IT
              </div>
              <div style={{ fontSize: '0.83rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {selectedStackSection.howToRead}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(167, 139, 250, 0.1)',
                borderLeft: '3px solid #a78bfa',
                padding: '10px 12px',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
                UNDER-THE-HOOD JVM / LOGBACK MECHANICS
              </div>
              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedStackSection.jvmInternals}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MDC & VIRTUAL THREAD CONTEXT */}
      {activeTab === 'mdc_concurrency' && (
        <div className="slf4j-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <svg viewBox="0 0 720 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker
                  id="arrow-mdc"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-danger"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#f87171" />
                </marker>
              </defs>

              {/* HTTP Filter Node */}
              <rect
                x="16"
                y="35"
                width="185"
                height="75"
                rx="8"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#38bdf8"
                strokeWidth="1.8"
              />
              <text x="28" y="58" fill="#38bdf8" fontSize="11" fontWeight="700">
                1. OncePerRequestFilter
              </text>
              <text x="28" y="76" fill="#ffffff" fontSize="11.5" fontWeight="700">
                MDC.put(&quot;traceId&quot;, id)
              </text>
              <text x="28" y="94" fill="#94a3b8" fontSize="10">
                ThreadLocal&lt;Map&gt; on Request Thread
              </text>

              {/* Flow to TaskDecorator */}
              <path
                d="M 207 72 L 262 72"
                stroke="#38bdf8"
                strokeWidth="2"
                className="interactive-diagram-flowing-path slf4j-flowing-edge"
                markerEnd="url(#arrow-mdc)"
              />

              {/* TaskDecorator Snapshot Node */}
              <rect
                x="268"
                y="35"
                width="195"
                height="75"
                rx="8"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#34d399"
                strokeWidth="1.8"
              />
              <text x="280" y="58" fill="#34d399" fontSize="11" fontWeight="700">
                2. MdcTaskDecorator
              </text>
              <text x="280" y="76" fill="#ffffff" fontSize="11.5" fontWeight="700">
                getCopyOfContextMap()
              </text>
              <text x="280" y="94" fill="#94a3b8" fontSize="10">
                Captures Map before async handoff
              </text>

              {/* Flow to Worker Thread */}
              <path
                d="M 469 72 L 518 72"
                stroke="#38bdf8"
                strokeWidth="2"
                className="interactive-diagram-flowing-path slf4j-flowing-edge"
                markerEnd="url(#arrow-mdc)"
              />

              {/* Async Worker Thread */}
              <rect
                x="524"
                y="35"
                width="180"
                height="75"
                rx="8"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#a78bfa"
                strokeWidth="1.8"
              />
              <text x="536" y="58" fill="#a78bfa" fontSize="11" fontWeight="700">
                3. Async / Virtual Thread
              </text>
              <text x="536" y="76" fill="#ffffff" fontSize="11.5" fontWeight="700">
                MDC.setContextMap(copy)
              </text>
              <text x="536" y="94" fill="#34d399" fontSize="10">
                finally &#123; MDC.clear(); &#125;
              </text>

              {/* Bottom Leak Warning Path */}
              <rect
                x="60"
                y="145"
                width="600"
                height="75"
                rx="8"
                fill="rgba(127, 29, 29, 0.22)"
                stroke="#f87171"
                strokeWidth="1.6"
              />
              <text x="78" y="170" fill="#f87171" fontSize="12" fontWeight="700">
                ⚠️ CRITICAL PRODUCTION BUG: Missing MDC.clear() in Thread Pools
              </text>
              <text x="78" y="190" fill="#e2e8f0" fontSize="10.5">
                Without try / finally &#123; MDC.clear(); &#125;, Tomcat/Async worker threads retain Request A&apos;s traceId &amp; userId
              </text>
              <text x="78" y="206" fill="#cbd5e1" fontSize="10.5">
                when recycled from the pool—corrupting audit logs for Request B with another customer&apos;s identity!
              </text>
            </svg>
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: '1px solid #a78bfa',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
              THREADLOCAL INTERNALS &amp; ASYNC PROPAGATION
            </div>
            <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Bridging MDC Across @Async &amp; Virtual Threads
            </div>
            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '10px' }}>
              SLF4J&apos;s <code>MDC</code> (Mapped Diagnostic Context) stores key-value pairs inside a{' '}
              <code>ThreadLocal&lt;Map&lt;String, String&gt;&gt;</code>. When a request spawns a{' '}
              <code>CompletableFuture</code> or <code>@Async</code> task on a worker pool, the child thread starts with an{' '}
              <strong>empty ThreadLocal map</strong>, losing <code>traceId</code>!
            </p>
            <pre
              style={{
                background: '#090b14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.73rem',
                color: '#34d399',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              <code>{`public class MdcTaskDecorator implements TaskDecorator {
  @Override
  public Runnable decorate(Runnable runnable) {
    Map<String, String> context = MDC.getCopyOfContextMap();
    return () -> {
      try {
        if (context != null) MDC.setContextMap(context);
        runnable.run();
      } finally {
        MDC.clear(); // Mandatory cleanup!
      }
    };
  }
}`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
