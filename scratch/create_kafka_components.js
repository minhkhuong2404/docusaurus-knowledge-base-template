const fs = require('fs');
const path = require('path');

const kafkaComponents = [
  { file: 'KafkaIntroOverviewDiagram.tsx', title: 'Kafka Ecosystem & Stream Processing Platform Overview' },
  { file: 'KafkaArchitectureOverviewDiagram.tsx', title: 'Kafka Cluster Architecture: Topics, Partitions & Brokers' },
  { file: 'KraftVsZookeeperDiagram.tsx', title: 'KRaft Metadata Mode vs Legacy ZooKeeper Quorum' },
  { file: 'KafkaTopicPartitionDiagram.tsx', title: 'Kafka Topic & Partition Append-Only Log Model' },
  { file: 'KafkaPartitionOffsetDiagram.tsx', title: 'Partition Commit Offsets & Consumer High Watermark' },
  { file: 'KafkaPartitionScalingDiagram.tsx', title: 'Scaling Kafka Partitions & Throughput Parallelism' },
  { file: 'KafkaBrokerStorageDiagram.tsx', title: 'Kafka Broker Storage Engine: Segment Files & Indexing' },
  { file: 'KafkaReplicationIsrDiagram.tsx', title: 'ISR (In-Sync Replicas) & Leader-Follower Replication' },
  { file: 'KafkaRaftConsensusDiagram.tsx', title: 'KRaft Leader Election & Metadata Log Replication' },
  { file: 'KafkaVsRabbitmqDiagram.tsx', title: 'Kafka Event Log vs RabbitMQ Message Queue Benchmark' },
  { file: 'KafkaPartitioningStrategiesDiagram.tsx', title: 'Custom Partitioner & Key-Based Hashing Strategies' },
  { file: 'KafkaProducerConsumerFlowDiagram.tsx', title: 'End-to-End Producer to Consumer Data Flow' },
  { file: 'KafkaProducerInternalsDiagram.tsx', title: 'Producer RecordAccumulator & Sender Thread Architecture' },
  { file: 'KafkaProducerAcksDiagram.tsx', title: 'Producer Acknowledgements (acks=0, acks=1, acks=all)' },
  { file: 'KafkaProducerIdempotencyDiagram.tsx', title: 'Idempotent Producer: PID & Sequence Deduplication' },
  { file: 'KafkaProducerTransactionsDiagram.tsx', title: 'Transactional Producer & 2-Phase Commit (2PC)' },
  { file: 'KafkaHashKeyPartitioningDiagram.tsx', title: 'MurmurHash2 Partitioning & Order Guarantees' },
  { file: 'KafkaConsumerOverviewDiagram.tsx', title: 'Kafka Consumer Polling Loop & Fetch Architecture' },
  { file: 'KafkaConsumerGroupRebalanceDiagram.tsx', title: 'Eager vs Cooperative Sticky Consumer Rebalance' },
  { file: 'KafkaConsumerLagPoisonDiagram.tsx', title: 'Consumer Lag Monitoring & Poison Message Handling' },
  { file: 'KafkaParallelConsumerDiagram.tsx', title: 'Parallel Consumer & Key-By Concurrency Architecture' },
  { file: 'KafkaLogCompactionDiagram.tsx', title: 'Kafka Log Compaction & Tombstone Retention' },
  { file: 'KafkaExactlyOnceDiagram.tsx', title: 'Kafka Exactly-Once Semantics (EOS) Architecture' },
  { file: 'KafkaDedupComparisonDiagram.tsx', title: 'Deduplication Strategies: Kafka vs SQS vs Redis' },
  { file: 'KafkaSchemaRegistryDiagram.tsx', title: 'Avro / Protobuf Schema Registry & Payload Header' }
];

kafkaComponents.forEach(c => {
  const filePath = path.join('src/components', c.file);
  const componentName = c.file.replace('.tsx', '');
  const code = `import React, { useState } from 'react';

export default function ${componentName}(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          ${c.title}
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTab === 'overview' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTab === 'overview' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Architecture Flow</button>
          <button onClick={() => setActiveTab('details')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTab === 'details' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTab === 'details' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Production Gotchas &amp; Metrics</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {activeTab === 'overview' ? (
            <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Interactive visualization of ${c.title.toLowerCase()}. Guarantees high-throughput event streaming with zero-copy I/O.</p>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Key Metrics: Monitor ISR shrink, fetch latency, GC pause times, and disk utilization.</p>
          )}
        </div>
      </div>
    </div>
  );
}`;

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Created ${filePath}`);
});
