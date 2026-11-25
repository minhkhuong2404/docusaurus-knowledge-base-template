const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Senior/Staff Interview Playbook Test Suite (Java & Spring)', () => {
  const javaDoc = 'docs/technical-knowledge/java/java-interview-questions.md';
  const springDoc = 'docs/technical-knowledge/spring/spring-interview-questions.md';
  const springBootDoc = 'docs/technical-knowledge/spring/spring-boot-interview-questions.md';
  const jpaDoc = 'docs/technical-knowledge/spring/spring-data-jpa-interview-questions.md';

  it('Java interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(javaDoc), `${javaDoc} must exist`);
    const content = fs.readFileSync(javaDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Java Technical Interviews'));
    assert.ok(content.includes('Custom HashMap keys must be strictly IMMUTABLE'));
    assert.ok(content.includes('ZERO atomicity for compound operations'));
    assert.ok(content.includes('Carrier Thread Pinning'));
    assert.ok(content.includes('ThreadLocalMap'));
    assert.ok(content.includes('Thread.currentThread().isInterrupted()'));
  });

  it('Spring Framework interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(springDoc), `${springDoc} must exist`);
    const content = fs.readFileSync(springDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Spring Framework Interviews'));
    assert.ok(content.includes('AOP Proxy Bypass (Self-Invocation Trap)'));
    assert.ok(content.includes('BeanCurrentlyInCreationException'));
    assert.ok(content.includes('rollbackFor = Exception.class'));
    assert.ok(content.includes('ObjectProvider'));
    assert.ok(content.includes('ApplicationContext'));
  });

  it('Spring Boot interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(springBootDoc), `${springBootDoc} must exist`);
    const content = fs.readFileSync(springBootDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Spring Boot Architecture Interviews'));
    assert.ok(content.includes('HikariCP sizing formula'));
    assert.ok(content.includes('Liveness Probe'));
    assert.ok(content.includes('Readiness Probe'));
    assert.ok(content.includes('Total RSS'));
    assert.ok(content.includes('proxyBeanMethods = false'));
    assert.ok(content.includes('17-tier precedence hierarchy'));
  });

  it('Spring Data JPA interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(jpaDoc), `${jpaDoc} must exist`);
    const content = fs.readFileSync(jpaDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace JPA & Hibernate Interviews'));
    assert.ok(content.includes('JOIN FETCH'));
    assert.ok(content.includes('entityManager.clear()'));
    assert.ok(content.includes('Disables Hibernate Dirty Checking Snapshots'));
    assert.ok(content.includes('spring.jpa.open-in-view=false'));
    assert.ok(content.includes('Optimistic Locking'));
    assert.ok(content.includes('Pessimistic Locking'));
  });

  it('SOLID Principles doc must contain Senior/Staff Playbook, Liskov-Wing rules, and architectural trade-offs', () => {
    const solidDoc = 'docs/technical-knowledge/low-level-design/oop/principles.md';
    assert.ok(fs.existsSync(solidDoc), `${solidDoc} must exist`);
    const content = fs.readFileSync(solidDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace SOLID & OOP in Senior Interviews'));
    assert.ok(content.includes('Barbara Liskov & Jeannette Wing, 1994'));
    assert.ok(content.includes('Square vs. Rectangle Geometry Paradox'));
    assert.ok(content.includes('Preconditions Cannot Be Strengthened'));
    assert.ok(content.includes('Postconditions Cannot Be Weakened'));
    assert.ok(content.includes('Class Invariants Must Be Preserved'));
    assert.ok(content.includes('Collections.unmodifiableList(list).add(...)'));
    assert.ok(content.includes('When to Intentionally Violate SRP'));
    assert.ok(content.includes('Domain-Driven Design (DDD) Aggregates'));
    assert.ok(content.includes('When to Intentionally Violate OCP'));
    assert.ok(content.includes('The "Rule of Three" in Refactoring'));
    assert.ok(content.includes('The Architecture Triad: DIP vs. DI vs. IoC'));
    assert.ok(content.includes('Hollywood Principle'));
    assert.ok(content.includes('Composition over Inheritance'));
  });

  it('Design Patterns Overview doc must contain Senior/Staff Playbook, JVM runtime truth, and distributed mapping', () => {
    const patternDoc = 'docs/technical-knowledge/design-patterns/design-patterns-overview.md';
    assert.ok(fs.existsSync(patternDoc), `${patternDoc} must exist`);
    const content = fs.readFileSync(patternDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Design Pattern Interviews'));
    assert.ok(content.includes('JVM & Spring Framework Runtime Engine Truth for Core Patterns'));
    assert.ok(content.includes('Double-Checked Locking (DCL) with `volatile`'));
    assert.ok(content.includes('StoreStore'));
    assert.ok(content.includes('StoreLoad'));
    assert.ok(content.includes('Initialization-on-Demand Holder Idiom'));
    assert.ok(content.includes('Enum Singleton'));
    assert.ok(content.includes('JDK Dynamic Proxy'));
    assert.ok(content.includes('CGLIB / ByteBuddy'));
    assert.ok(content.includes('Self-Invocation Trap in Spring Proxies'));
    assert.ok(content.includes('Lapsed Listener Memory Leak'));
    assert.ok(content.includes('Rule 1: Never Start an LLD Interview by Naming a Pattern'));
    assert.ok(content.includes('Cognitive Tax of Indirection'));
    assert.ok(content.includes('Mapping GoF (In-Process) to Modern Distributed/Cloud Architecture'));
    assert.ok(content.includes('Transactional Outbox Pattern'));
    assert.ok(content.includes('Distributed Saga Orchestrator'));
  });

  it('OOP Concepts doc must contain Senior/Staff Playbook, Anemic vs Rich models, and fragile base class traps', () => {
    const doc = 'docs/technical-knowledge/low-level-design/oop/concepts.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Passing OOP in Senior Interviews'));
    assert.ok(content.includes('Modern OOP: Data-Oriented Programming (Java 17/21)'));
    assert.ok(content.includes('The Anemic Domain Model vs. Rich Domain Model Trap'));
    assert.ok(content.includes('The Fragile Base Class Problem & Defensive Copying'));
    assert.ok(content.includes('List.copyOf'));
  });

  it('LLD Patterns Overview doc must contain 5-stage protocol and premature abstraction guidance', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/overview.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Mastering Pattern Trade-offs in LLD'));
    assert.ok(content.includes('The 5-Stage Senior LLD Execution Protocol'));
    assert.ok(content.includes('The Anti-Pattern of Premature Abstraction'));
    assert.ok(content.includes('Rule of Three'));
  });

  it('LLD Creational Patterns doc must contain Senior Playbook and production gotchas', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/creational.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Creational Patterns in Production'));
    assert.ok(content.includes('The Singleton in Distributed Environments'));
    assert.ok(content.includes('The Lombok `@Builder` Collection Null-Pointer Trap'));
    assert.ok(content.includes('Static Factory Methods vs. Abstract Factory Hell'));
  });

  it('LLD Structural Patterns doc must contain Senior Playbook and disambiguation matrix', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/structural.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Structural Patterns in Production'));
    assert.ok(content.includes('The "Big 4" Confusion Disambiguation'));
    assert.ok(content.includes('The Decorator Order-of-Execution Trap'));
    assert.ok(content.includes('The Proxy Self-Invocation Bypass'));
  });

  it('LLD Behavioral Patterns doc must contain Senior Playbook and Strategy vs State comparison', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/behavioral.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Behavioral Patterns in Production'));
    assert.ok(content.includes('The Classic Showdown: Strategy vs. State'));
    assert.ok(content.includes('The Observer Synchronous Blocking Trap'));
    assert.ok(content.includes('The Chain of Responsibility "Black Hole"'));
  });

  it('senior-interview-playbook skill and reference manual must exist and enforce mandatory interview tips & traps', () => {
    const skillPath = '.agents/skills/senior-interview-playbook/SKILL.md';
    const refPath = '.agents/skills/senior-interview-playbook/references/INTERVIEW_PLAYBOOK_GUIDELINES.md';
    const agentsPath = '.agents/AGENTS.md';

    assert.ok(fs.existsSync(skillPath), `${skillPath} must exist`);
    assert.ok(fs.existsSync(refPath), `${refPath} must exist`);
    assert.ok(fs.existsSync(agentsPath), `${agentsPath} must exist`);

    const skillContent = fs.readFileSync(skillPath, 'utf8');
    assert.ok(skillContent.includes('name: senior-interview-playbook'));
    assert.ok(skillContent.includes('The Senior Framing Strategy'));
    assert.ok(skillContent.includes('Classic Interviewer Traps & Principal Rebuttals'));
    assert.ok(skillContent.includes('Mid-Level vs. Principal Candidate Cheat Sheet'));

    const refContent = fs.readFileSync(refPath, 'utf8');
    assert.ok(refContent.includes('Domain-Specific Interview Trap Catalog'));
    assert.ok(refContent.includes('Ready-to-Use Markdown Template'));

    const agentsContent = fs.readFileSync(agentsPath, 'utf8');
    assert.ok(agentsContent.includes('MANDATORY: Always Apply senior-interview-playbook Skill for Every Knowledge Added'));
  });

  it('ZemIT Substack deep-dive pages (Java Locks, JMM, Concurrency, Kafka, IDs, DB Indexing & Export) must contain Senior/Staff Playbooks and interactive diagrams', () => {
    const pages = [
      {
        path: 'docs/technical-knowledge/java/java-locks.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Java Locking Interviews',
        mustInclude: [
          'JavaReadWriteLockConvoyDiagram',
          'apparentlyFirstQueuedIsExclusive()',
          'IllegalMonitorStateException',
          'tryOptimisticRead()',
          'Deadlock Prevention: Global Lock Ordering & Single-Lock Callback Deadlocks',
        ],
      },
      {
        path: 'docs/technical-knowledge/java/java-jmm-memory-model.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace JMM, Race Conditions & Happens-Before Interviews',
        mustInclude: [
          'JmmHappensBeforeVisualizerDiagram',
          'TieredStopAtLevel=1',
          'MESI',
          'Store Buffer',
          'Transitive Piggybacking',
          'SimpleDateFormat',
        ],
      },
      {
        path: 'docs/technical-knowledge/java/concurrency-vs-parallelism.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Concurrency vs. Parallelism Interviews',
        mustInclude: [
          'ThreadPerTaskExecutor',
          'nvcswch/s',
          'cswch/s',
          'JEP 491',
          'HikariCP',
        ],
      },
      {
        path: 'docs/technical-knowledge/kafka/consumer/consumer-overview.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Kafka Consumer & Listener Interviews',
        mustInclude: [
          'What Actually Happens Inside a Single `consumer.poll()` Call?',
          'Group Coordinator vs. Group Leader',
          'librdkafka',
          'maybeAutoCommitOffsetsAsync()',
        ],
      },
      {
        path: 'docs/technical-knowledge/kafka/core/kafka-vs-rabbitmq.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Kafka vs. Work Queue (SQS / RabbitMQ) Interviews',
        mustInclude: [
          'KIP-932',
          'KafkaShareConsumer',
          'ChangeMessageVisibility',
          'Single Contiguous Offset Watermark',
        ],
      },
      {
        path: 'docs/technical-knowledge/system-design/time-and-ordering-and-unique-ids.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Distributed ID & Time Ordering Interviews',
        mustInclude: [
          'innodb_autoinc_lock_mode',
          'BINARY(16)',
          'UlidFactory.newMonotonicInstance()',
        ],
      },
      {
        path: 'docs/technical-knowledge/database/exporting-large-datasets-streaming-internals.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Large Dataset Export & Database Streaming Interviews',
        mustInclude: [
          'History List Length',
          'CompleteMultipartUpload',
          'Integer.MIN_VALUE',
        ],
      },
      {
        path: 'docs/technical-knowledge/database/mysql-indexing-beyond-equality.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Composite Index, ESR & Deferred Join Interviews',
        mustInclude: [
          'Index Condition Pushdown',
          'Deferred Join',
          'query_references_nonkey_column',
        ],
      },
      {
        path: 'docs/technical-knowledge/ai-agents/llm-training-rlhf-rlvr-jev.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace LLM Training, RLVR & Jev Decision Model Interviews',
        mustInclude: [
          'JevDecisionEngineDiagram',
          'TypeSafeClient',
          'systemone',
          'Jevons Paradox',
          'Prefill Phase',
          'Decode Phase',
          'Brier Score',
        ],
      },
      {
        path: 'docs/technical-knowledge/kafka/advanced/exactly-once-vs-dedup.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Kafka Deduplication, Worker Scaling & Exactly-Once Interviews',
        mustInclude: [
          'KafkaWorkerScalingThreeLayerDefenseDiagram',
          'EnableAutoOffsetStore = false',
          'StoreOffset',
          'DocumentKey',
          'TicketNumber',
          'DateOfIssue',
        ],
      },
      {
        path: 'docs/technical-knowledge/system-design/interview-framework.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace System Design Interviews (The Delivery Framework)',
        mustInclude: [
          'SystemDesignDeliveryFrameworkDiagram',
          'FkLAEAcQXcc',
          'The 6-Step System Design Delivery Framework',
          'In-Context BOE Rule',
          'FOR UPDATE SKIP LOCKED',
          'SeatReservationService',
          'Idempotency-Key',
          'Level Calibration Matrix: Mid-Level (L4) vs. Senior (L5) vs. Staff+ (L6)',
        ],
      },
      {
        path: 'docs/technical-knowledge/become-senior-developer/real-world-engineering-playbook.md',
        playbook: 'Senior/Staff Interview Playbook: How to Ace Real-World Scenario & Behavioral-Technical Interviews',
        mustInclude: [
          'RealWorldEngineeringSecretsDiagram',
          'TransactionTemplate',
          'Expand & Contract',
          'NOT VALID',
          'Idempotency-Key',
          'Exponential Backoff with Full Jitter',
          'Transactional Outbox Pattern',
          'ForkJoinPool.commonPool()',
        ],
      },
    ];

    for (const page of pages) {
      assert.ok(fs.existsSync(page.path), `${page.path} must exist`);
      const content = fs.readFileSync(page.path, 'utf8');
      assert.ok(
        content.includes(page.playbook),
        `${page.path} must include playbook header: ${page.playbook}`
      );
      for (const token of page.mustInclude) {
        assert.ok(
          content.includes(token),
          `${page.path} must include technical invariant: ${token}`
        );
      }
    }
  });

  it('Sujeet Pro 25 System Design & Distributed Systems articles must be integrated with Senior/Staff Playbooks', () => {
    const sujeetPages = [
      {
        path: 'docs/technical-knowledge/system-design/load-balancing-reliability.md',
        url: 'https://sujeet.pro/articles/load-balancers-architecture',
        tokens: ['Maglev', 'Power of Two', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/scaling-reads.md',
        url: 'https://sujeet.pro/articles/cdn-architecture-and-caching',
        tokens: ['Origin Shield', 'stale-while-revalidate', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/reverse-proxy-load-balancer-api-gateway.md',
        url: 'https://sujeet.pro/articles/api-gateway-patterns',
        tokens: ['JWKS', 'Phantom Token', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/service-discovery.md',
        url: 'https://sujeet.pro/articles/service-discovery-and-registry',
        tokens: ['xDS', 'healthy_panic_threshold', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/networking/dns-resolution.md',
        url: 'https://sujeet.pro/articles/dns-deep-dive',
        tokens: ['EDNS0', 'DNSSEC', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/message-queues.md',
        url: 'https://sujeet.pro/articles/queues-and-pubsub',
        tokens: ['ChangeMessageVisibility', 'Head-of-Line', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/event-driven-microservices.md',
        url: 'https://sujeet.pro/articles/event-driven-architecture',
        tokens: ['Event-Carried State Transfer', 'Schema Registry', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/api-design.md',
        url: 'https://sujeet.pro/articles/rpc-and-api-design',
        tokens: ['Varint', 'grpc-timeout', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/cap-theorem.md',
        url: 'https://sujeet.pro/articles/consistency-and-cap-theorem',
        tokens: ['Linearizability', 'Sloppy Quorum', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/distributed-systems.md',
        url: 'https://sujeet.pro/articles/distributed-consensus',
        tokens: ['ReadIndex', 'Pre-Vote', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/time-and-ordering-and-unique-ids.md',
        url: 'https://sujeet.pro/articles/time-and-ordering',
        tokens: ['https://sujeet.pro/articles/unique-id-generation', 'KSUID', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/what-breaks-at-scale.md',
        url: 'https://sujeet.pro/articles/failure-modes-and-resilience',
        tokens: ['Metastable', 'CoDel', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/rate-limiting-algorithms.md',
        url: 'https://sujeet.pro/articles/rate-limiting-strategies',
        tokens: ['Retry-After', 'X-RateLimit-Remaining', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/circuit-breaker-pattern.md',
        url: 'https://sujeet.pro/articles/circuit-breaker-patterns',
        tokens: ['Ring Bit Buffer', 'Gradient2', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/capacity-planning.md',
        url: 'https://sujeet.pro/articles/capacity-planning-and-estimation',
        tokens: ['Universal Scalability Law', 'M/M/1', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/caching-strategies.md',
        url: 'https://sujeet.pro/articles/lru-cache-design',
        tokens: ['SIEVE', 'W-TinyLFU', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/problem-breakdowns/distributed-cache.md',
        url: 'https://sujeet.pro/articles/distributed-cache-design',
        tokens: ['16,384', 'Lease', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/large-blobs.md',
        url: 'https://sujeet.pro/articles/blob-storage-design',
        tokens: ['Haystack', 'Local Reconstruction Codes', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/search-systems.md',
        url: 'https://sujeet.pro/articles/distributed-search-engine',
        tokens: ['BM25', 'Block-Max WAND', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/log-aggregation.md',
        url: 'https://sujeet.pro/articles/distributed-logging-system',
        tokens: ['Loki', 'ClickHouse', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/observability.md',
        url: 'https://sujeet.pro/articles/distributed-monitoring',
        tokens: ['Gorilla', 'DDSketch', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/problem-breakdowns/metrics-monitoring.md',
        url: 'https://sujeet.pro/articles/distributed-monitoring',
        tokens: ['DDSketch', '14.4x', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/long-running-tasks.md',
        url: 'https://sujeet.pro/articles/task-scheduler-design',
        tokens: ['Timing Wheel', 'fencing_token', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/problem-breakdowns/job-scheduler.md',
        url: 'https://sujeet.pro/articles/task-scheduler-design',
        tokens: ['SKIP LOCKED', 'fencing_token', 'Senior/Staff Interview Playbook'],
      },
      {
        path: 'docs/technical-knowledge/system-design/sharded-counters-and-leaderboards.md',
        url: 'https://sujeet.pro/articles/sharded-counters',
        tokens: ['https://sujeet.pro/articles/leaderboard-design', 'zskiplistLevel', 'Senior/Staff Interview Playbook'],
      },
    ];

    for (const item of sujeetPages) {
      assert.ok(fs.existsSync(item.path), `${item.path} must exist`);
      const content = fs.readFileSync(item.path, 'utf8');
      assert.ok(content.includes(item.url), `${item.path} must cite ${item.url}`);
      for (const tok of item.tokens) {
        assert.ok(content.includes(tok), `${item.path} must include token: ${tok}`);
      }
    }
  });

  it('verifies Tech Interview Handbook guide updates, diagrams, and Senior/Staff Interview Playbooks', () => {
    const handbookPages = [
      {
        path: 'docs/technical-knowledge/interview-questions/interview-framework.md',
        tokens: [
          'OfferNegotiationLifecycleDiagram',
          'Google XYZ Bullet Formula',
          'The 10 Rules of Software Engineering Salary Negotiation',
          '## 🧠 Senior/Staff Interview Playbook:',
        ],
      },
      {
        path: 'docs/technical-knowledge/interview-questions/resume-and-negotiation-guide.md',
        tokens: [
          'OfferNegotiationLifecycleDiagram',
          'Writing Your Software Engineer Resume',
          'Understanding Software Engineering Compensation',
          'The 10 Rules of Negotiation',
          'Choosing Between Companies',
          '## 🧠 Senior/Staff Interview Playbook:',
        ],
      },
      {
        path: 'docs/technical-knowledge/coding-interview-prep/intro.md',
        tokens: [
          'CodingInterviewRubricFlowDiagram',
          'Picking a Programming Language',
          'Study and Practice Plan',
          'The BUD Optimization Heuristic',
          'The Master Corner-Cases Cheatsheet',
          '## 🧠 Senior/Staff Interview Playbook:',
        ],
      },
      {
        path: 'docs/technical-knowledge/interview-questions/behavioral/overview.md',
        tokens: [
          'BehavioralOverviewDiagram',
          'Preparing Your Self-Introduction',
          'Behavioral Interview Rubrics',
          'Preparing for Senior & Staff+ Candidates',
          '## 🧠 Senior/Staff Interview Playbook:',
        ],
      },
      {
        path: 'docs/technical-knowledge/interview-questions/behavioral/questions-to-ask.md',
        tokens: [
          'QuestionsToAskDiagram',
          '## 🧠 Senior/Staff Interview Playbook:',
        ],
      },
    ];

    for (const page of handbookPages) {
      assert.ok(fs.existsSync(page.path), `${page.path} must exist`);
      const content = fs.readFileSync(page.path, 'utf8');
      for (const tok of page.tokens) {
        assert.ok(content.includes(tok), `${page.path} must include ${tok}`);
      }
    }

    const diagrams = [
      'src/components/CodingInterviewRubricFlowDiagram.tsx',
      'src/components/OfferNegotiationLifecycleDiagram.tsx',
    ];
    for (const diag of diagrams) {
      assert.ok(fs.existsSync(diag), `${diag} must exist`);
      const diagContent = fs.readFileSync(diag, 'utf8');
      assert.ok(
        diagContent.includes('interactive-diagram-flowing-path'),
        `${diag} must use interactive-diagram-flowing-path`
      );
    }

    const sidebars = fs.readFileSync('sidebars.ts', 'utf8');
    assert.ok(
      sidebars.includes('technical-knowledge/interview-questions/resume-and-negotiation-guide'),
      'sidebars.ts must register resume-and-negotiation-guide'
    );
  });

  it('verifies outbox-pattern.md DB retry, post-publish ACK recovery, diagram, and Senior/Staff Playbook', () => {
    const outboxPath = 'docs/technical-knowledge/system-design/outbox-pattern.md';
    const content = fs.readFileSync(outboxPath, 'utf8');
    const requiredTokens = [
      'OutboxFailureRecoveryDiagram',
      'Database Failure Retries & Post-Publish ACK Failure Recovery',
      '3-Phase Claim-Publish-Ack',
      'fencing_token',
      'lease_expires_at',
      'Pending-ACK Reconciliation Buffer',
      'Transactional Inbox',
      'Worked Case Study: Async S3 File Upload & Processing',
      'Monotonic State Machine',
      '## 🧠 Senior/Staff Interview Playbook:',
    ];
    for (const token of requiredTokens) {
      assert.ok(content.includes(token), `outbox-pattern.md must include: ${token}`);
    }

    const diagPath = 'src/components/OutboxFailureRecoveryDiagram.tsx';
    assert.ok(fs.existsSync(diagPath), 'OutboxFailureRecoveryDiagram.tsx must exist');
    const diagContent = fs.readFileSync(diagPath, 'utf8');
    assert.ok(
      diagContent.includes('interactive-diagram-flowing-path'),
      'OutboxFailureRecoveryDiagram.tsx must use interactive-diagram-flowing-path'
    );
  });

  it('verifies Kafka consumer-group.md Incremental Cooperative Rebalancing, Static Membership, simulator diagram, and Senior/Staff Playbook', () => {
    const cgPath = 'docs/technical-knowledge/kafka/consumer/consumer-group.md';
    const content = fs.readFileSync(cgPath, 'utf8');
    const requiredTokens = [
      'KafkaIncrementalCooperativeRebalanceDiagram',
      'https://www.conduktor.io/kafka/consumer-incremental-rebalance-and-static-group-membership',
      'https://www.confluent.io/blog/incremental-cooperative-rebalancing-in-kafka/',
      'CooperativeStickyAssignor',
      'group.instance.id',
      'FencedInstanceIdException',
      '## 🧠 Senior/Staff Interview Playbook:',
    ];
    for (const token of requiredTokens) {
      assert.ok(content.includes(token), `consumer-group.md must include: ${token}`);
    }

    const diagPath = 'src/components/KafkaIncrementalCooperativeRebalanceDiagram.tsx';
    assert.ok(fs.existsSync(diagPath), 'KafkaIncrementalCooperativeRebalanceDiagram.tsx must exist');
    const diagContent = fs.readFileSync(diagPath, 'utf8');
    assert.ok(
      diagContent.includes('interactive-diagram-flowing-path'),
      'KafkaIncrementalCooperativeRebalanceDiagram.tsx must use interactive-diagram-flowing-path'
    );
  });

  it('verifies real-time-updates.md Google Docs, Chat, Notifications use cases, diagram, and Senior/Staff Playbook', () => {
    const rtPath = 'docs/technical-knowledge/system-design/real-time-updates.md';
    const content = fs.readFileSync(rtPath, 'utf8');
    const requiredTokens = [
      'RealTimeUseCasesArchitectureDiagram',
      'Core Real-Time Use Cases: Google Docs, Chat Systems & Notifications',
      'DocumentOtSequencer',
      'Operational Transformation',
      'CRDT',
      'Real-Time Chat System',
      'Real-Time Notification System',
      '## 🧠 Senior/Staff Interview Playbook:',
    ];
    for (const token of requiredTokens) {
      assert.ok(content.includes(token), `real-time-updates.md must include: ${token}`);
    }

    const diagPath = 'src/components/RealTimeUseCasesArchitectureDiagram.tsx';
    assert.ok(fs.existsSync(diagPath), 'RealTimeUseCasesArchitectureDiagram.tsx must exist');
    const diagContent = fs.readFileSync(diagPath, 'utf8');
    assert.ok(
      diagContent.includes('interactive-diagram-flowing-path'),
      'RealTimeUseCasesArchitectureDiagram.tsx must use interactive-diagram-flowing-path'
    );
  });
});
