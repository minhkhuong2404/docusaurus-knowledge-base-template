const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File mapping for component injection
const mapping = [
  // OS Suite
  { file: 'docs/technical-knowledge/operating-systems/intro.md', component: 'OsOverviewDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/cpu-scheduling.md', component: 'OsCpuSchedulingDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/processes-and-threads.md', component: 'OsProcessesThreadsDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/memory-management.md', component: 'OsMemoryManagementDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/virtual-memory-deep-dive.md', component: 'OsVirtualMemoryDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/synchronization-and-deadlocks.md', component: 'OsSyncDeadlockDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/linux-internals-and-syscalls.md', component: 'OsLinuxSyscallsDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/file-systems-and-io.md', component: 'OsFileSystemsIoDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/networking-and-ipc.md', component: 'OsIpcNetworkingDiagram' },
  { file: 'docs/technical-knowledge/operating-systems/interview-questions.md', component: 'OsInterviewScenariosDiagram' },

  // Kafka Suite
  { file: 'docs/technical-knowledge/kafka/intro.md', component: 'KafkaIntroOverviewDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/kafka-overview.md', component: 'KafkaArchitectureOverviewDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/kraft-vs-zookeeper.md', component: 'KraftVsZookeeperDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/topic.md', component: 'KafkaTopicPartitionDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/partition.md', component: 'KafkaPartitionOffsetDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/scaling-partitions.md', component: 'KafkaPartitionScalingDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/broker.md', component: 'KafkaBrokerStorageDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/replication.md', component: 'KafkaReplicationIsrDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/raft-consensus.md', component: 'KafkaRaftConsensusDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/kafka-vs-rabbitmq.md', component: 'KafkaVsRabbitmqDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/kafka-partitioning-strategies.md', component: 'KafkaPartitioningStrategiesDiagram' },
  { file: 'docs/technical-knowledge/kafka/core/kafka-producers-consumers.md', component: 'KafkaProducerConsumerFlowDiagram' },
  { file: 'docs/technical-knowledge/kafka/producer/producer-overview.md', component: 'KafkaProducerInternalsDiagram' },
  { file: 'docs/technical-knowledge/kafka/producer/producer-acks.md', component: 'KafkaProducerAcksDiagram' },
  { file: 'docs/technical-knowledge/kafka/producer/producer-idempotency.md', component: 'KafkaProducerIdempotencyDiagram' },
  { file: 'docs/technical-knowledge/kafka/producer/producer-transactions.md', component: 'KafkaProducerTransactionsDiagram' },
  { file: 'docs/technical-knowledge/kafka/producer/hash-key-partitions.md', component: 'KafkaHashKeyPartitioningDiagram' },
  { file: 'docs/technical-knowledge/kafka/consumer/consumer-overview.md', component: 'KafkaConsumerOverviewDiagram' },
  { file: 'docs/technical-knowledge/kafka/consumer/consumer-group.md', component: 'KafkaConsumerGroupRebalanceDiagram' },
  { file: 'docs/technical-knowledge/kafka/consumer/consumer-lag.md', component: 'KafkaConsumerLagPoisonDiagram' },
  { file: 'docs/technical-knowledge/kafka/consumer/parallel-consumer.md', component: 'KafkaParallelConsumerDiagram' },
  { file: 'docs/technical-knowledge/kafka/advanced/kafka-log-compaction.md', component: 'KafkaLogCompactionDiagram' },
  { file: 'docs/technical-knowledge/kafka/advanced/exactly-once.md', component: 'KafkaExactlyOnceDiagram' },
  { file: 'docs/technical-knowledge/kafka/advanced/exactly-once-vs-dedup.md', component: 'KafkaDedupComparisonDiagram' },
  { file: 'docs/technical-knowledge/kafka/advanced/schema-registry.md', component: 'KafkaSchemaRegistryDiagram' },
];

mapping.forEach(({ file, component }) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Check if component import exists
  if (!content.includes(component)) {
    const importStmt = `import ${component} from '@site/src/components/${component}';`;
    const jsxTag = `<${component} />`;

    const parts = content.split('---');
    if (parts.length >= 3) {
      const frontmatter = `---${parts[1]}---\n\n${importStmt}\n\n`;
      let rest = parts.slice(2).join('---');

      const h1Match = rest.match(/#\s+[^\n]+\n/);
      if (h1Match) {
        const titleIndex = rest.indexOf(h1Match[0]) + h1Match[0].length;
        rest = rest.slice(0, titleIndex) + '\n' + jsxTag + '\n\n---\n\n' + rest.slice(titleIndex);
      } else {
        rest = jsxTag + '\n\n' + rest;
      }
      content = frontmatter + rest;
    }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Embedded ${component} into ${file}`);
});

// Now purge static ASCII art, mermaid diagrams, and format Interview Questions
const dirs = ['docs/technical-knowledge/operating-systems', 'docs/technical-knowledge/kafka'];

dirs.forEach(dir => {
  const files = execSync(`find ${dir} -name "*.md"`).toString().trim().split('\n');

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Purge mermaid code blocks
    if (content.includes('```mermaid')) {
      content = content.replace(/```mermaid[\s\S]*?```/g, '');
      modified = true;
    }

    // Purge ASCII code blocks (containing box drawing chars)
    const asciiCodeBlockRegex = /```[a-z]*\n[\s\S]*?[┌│└─├┤▲▼➔◄►┬┴┼][\s\S]*?```/g;
    if (asciiCodeBlockRegex.test(content)) {
      content = content.replace(asciiCodeBlockRegex, '');
      modified = true;
    }

    // Standardize Interview Questions headers & H3 formatting
    if (/##\s*(?:❓\s*)?Interview\s*Questions/i.test(content)) {
      if (!file.endsWith('interview-questions.md') && !file.includes('interview-')) {
        content = content.replace(/##\s*(?:❓\s*)?Interview\s*Questions.*/gi, '## Interview Questions');
        modified = true;
      }

      // Convert question headers to H3 `### Q1. ...` or `### Q: ...`
      const lines = content.split('\n');
      let inInterview = false;
      const newLines = lines.map(line => {
        if (/^##\s*Interview\s*Questions/i.test(line)) inInterview = true;
        if (inInterview) {
          if (/^\*\*(?:Q\d+\.|Q:|🔴)\s*(.*?)\*\*$/i.test(line.trim())) {
            modified = true;
            const qText = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
            return `### ${qText}`;
          }
          if (/^>\s*\*\*(?:Answer|Ans|A)?:\s*(.*?)\*\*/i.test(line)) {
            modified = true;
            return line.replace(/^>\s*\*\*(?:Answer|Ans|A)?:\s*(.*?)\*\*/i, '> $1');
          }
        }
        return line;
      });
      content = newLines.join('\n');
    }

    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/\n---\n\s*---\n/g, '\n---\n');

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Cleaned and formatted: ${file}`);
    }
  });
});
