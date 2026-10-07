const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Kafka Streams Conduktor Production & Deep-Dive Suite', () => {
  const masterPath = 'docs/technical-knowledge/kafka/advanced/kafka-streams-deep-dive.md';
  const modularFiles = [
    {
      path: 'docs/technical-knowledge/kafka/streams/overview.md',
      minBytes: 8000,
      mustContain: ['KafkaStreamsAbstractionsDiagram', 'Stream-Table Duality', 'KStream vs KTable vs GlobalKTable', 'Stateless Stream Operations']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/topology-architecture.md',
      minBytes: 15000,
      mustContain: ['KafkaStreamsTopologyDiagram', 'KafkaStreamBrancher', 'onTopOf', 'Cooperative Sticky Assignor', 'Sub-Topology Reordering']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/state-stores-rocksdb.md',
      minBytes: 14000,
      mustContain: ['RocksDBConfigSetter', 'WriteBufferManager', 'OOMKilled', '.checkpoint', 'StateRestoreListener', 'Standby Replicas']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/windowing-joins.md',
      minBytes: 10000,
      mustContain: ['suppress-not-emitting', 'untilWindowCloses', 'Co-Partitioning Tri-Contract', 'KafkaStreamsWindowJoinDiagram']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/processor-api-dlq.md',
      minBytes: 10000,
      mustContain: ['ContextualProcessor', 'WALL_CLOCK_TIME', 'STREAM_TIME', 'EventDeduplicationProcessor', 'ProductionDlqDeserializationHandler']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/spring-boot.md',
      minBytes: 10000,
      mustContain: ['@EnableKafkaStreams', 'StreamsBuilderFactoryBean', 'KafkaStreamBrancher.onTopOf', 'spring-cloud-stream-binder-kafka-streams', 'Function<KStream']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/production-runbook.md',
      minBytes: 12000,
      mustContain: ['TopologyTestDriver', 'TestInputTopic', 'TestOutputTopic', 'Anti-Patterns', 'Apache Flink', 'KafkaStreamsExactlyOnceDiagram']
    },
    {
      path: 'docs/technical-knowledge/kafka/streams/interview-questions.md',
      minBytes: 12000,
      mustContain: ['suppress(untilWindowCloses)', 'OOMKilled', 'Cooperative Sticky Assignor', 'EXACTLY_ONCE_V2', 'The Four Golden Rules']
    }
  ];

  it('master kafka-streams-deep-dive.md must exist on disk and have principal-level depth', () => {
    assert.ok(fs.existsSync(masterPath), `Doc file ${masterPath} must exist`);
    const stats = fs.statSync(masterPath);
    assert.ok(stats.size > 80000, `Doc file ${masterPath} must be substantial (found ${stats.size} bytes)`);
  });

  it('must contain all Conduktor Kafka Streams production concepts and patterns in master doc', () => {
    const content = fs.readFileSync(masterPath, 'utf8');
    const requiredConcepts = [
      'KafkaStreamBrancher',
      'onTopOf',
      '@EnableKafkaStreams',
      'StreamsBuilderFactoryBean',
      'Function<KStream',
      'spring-cloud-stream-binder-kafka-streams',
      'The `suppress()` Stalled Stream-Time Trap',
      'suppress-not-emitting',
      'untilWindowCloses',
      'WALL_CLOCK_TIME',
      'STREAM_TIME',
      'RocksDBConfigSetter',
      'WriteBufferManager',
      'OOMKilled',
      'EXACTLY_ONCE_V2',
      'read_committed',
      'EOS Duplicates Trap',
      'DeserializationExceptionHandler',
      'dead-letter',
      'EventDeduplicationProcessor',
      'Cooperative Sticky Assignor',
      'probing.rebalance.interval.ms',
      'StateRestoreListener',
      '.checkpoint',
      'TopologyTestDriver',
      'TestInputTopic',
      'TestOutputTopic',
      'Named.as',
      'Materialized.as',
      'Apache Flink',
      'Apache Spark',
      'ksqlDB',
      'Parallel Consumer'
    ];

    for (const concept of requiredConcepts) {
      assert.ok(
        content.includes(concept),
        `Missing required Conduktor concept or pattern: "${concept}" in ${masterPath}`
      );
    }
  });

  it('all 8 modular Kafka Streams pages must exist on disk and meet depth standards', () => {
    for (const mod of modularFiles) {
      assert.ok(fs.existsSync(mod.path), `Modular page ${mod.path} must exist`);
      const stats = fs.statSync(mod.path);
      assert.ok(
        stats.size >= mod.minBytes,
        `Modular page ${mod.path} must be at least ${mod.minBytes} bytes (found ${stats.size})`
      );

      const content = fs.readFileSync(mod.path, 'utf8');
      for (const mustHave of mod.mustContain) {
        assert.ok(
          content.includes(mustHave),
          `Modular page ${mod.path} must contain "${mustHave}"`
        );
      }
    }
  });

  it('all Kafka Streams docs must compile MDX with 0 undeclared runtime identifiers (AST safety)', () => {
    const allPaths = [masterPath, ...modularFiles.map(m => m.path)];

    for (const docPath of allPaths) {
      const content = fs.readFileSync(docPath, 'utf8');

      // Strip frontmatter
      let cleaned = content.replace(/^---[\s\S]*?---/, '');
      // Strip imports
      cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, '');
      // Strip fenced code blocks
      cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
      // Strip inline code
      cleaned = cleaned.replace(/`[^`]+`/g, 'code');
      // Strip markdown links [text](url) -> text
      cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Strip LaTeX math blocks
      cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '');
      cleaned = cleaned.replace(/\$[^$]+\$/g, '');

      // Check for unescaped MDX JSX interpolation {var}
      const matches = cleaned.match(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g);
      assert.strictEqual(
        matches,
        null,
        `Found potential undeclared MDX expressions in ${docPath}: ${matches ? matches.join(', ') : ''}`
      );
    }
  });

  it('sidebars.ts must register 🌊 Kafka Streams category with priority and all 8 modular pages', () => {
    const sidebarContent = fs.readFileSync('sidebars.ts', 'utf8');
    assert.ok(sidebarContent.includes("'🌊 Kafka Streams'"), "sidebars.ts must contain '🌊 Kafka Streams' category");

    const expectedSidebarItems = [
      'technical-knowledge/kafka/streams/overview',
      'technical-knowledge/kafka/streams/topology-architecture',
      'technical-knowledge/kafka/streams/state-stores-rocksdb',
      'technical-knowledge/kafka/streams/windowing-joins',
      'technical-knowledge/kafka/streams/processor-api-dlq',
      'technical-knowledge/kafka/streams/spring-boot',
      'technical-knowledge/kafka/streams/production-runbook',
      'technical-knowledge/kafka/streams/interview-questions',
      'technical-knowledge/kafka/advanced/kafka-streams-deep-dive'
    ];

    for (const item of expectedSidebarItems) {
      assert.ok(
        sidebarContent.includes(`'${item}'`),
        `sidebars.ts must register item '${item}'`
      );
    }

    // Verify priority: 🌊 Kafka Streams appears before 🏗️ Core Concepts in 📨 Kafka
    const streamsIndex = sidebarContent.indexOf("'🌊 Kafka Streams'");
    const coreConceptsIndex = sidebarContent.indexOf("'🏗️ Core Concepts'");
    assert.ok(
      streamsIndex !== -1 && coreConceptsIndex !== -1 && streamsIndex < coreConceptsIndex,
      "🌊 Kafka Streams must be placed with priority before 🏗️ Core Concepts in 📨 Kafka"
    );
  });
});

