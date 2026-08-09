import React, { useState } from 'react';

const TABS = [
  {
    id: 'keyhash',
    label: 'Key-Hash (Default)',
    color: '#38bdf8',
    badge: 'Guarantees per-key ordering',
    overview: 'When a non-null key is provided, Kafka\'s DefaultPartitioner uses MurmurHash2 to deterministically map keys to partitions. All records with the same key always land on the same partition — guaranteeing strict ordering per key.',
    formula: 'partition = toPositive(murmur2(key)) % numPartitions',
    examples: [
      { key: '"ACC-001"', hash: '0x7A4B21C3', mod: '6 partitions', result: 'Partition 2', color: '#38bdf8' },
      { key: '"ACC-002"', hash: '0x1D8F405A', mod: '6 partitions', result: 'Partition 5', color: '#a78bfa' },
      { key: '"ACC-001"', hash: '0x7A4B21C3', mod: '6 partitions', result: 'Partition 2 ✓ same', color: '#38bdf8' },
    ],
    gotchas: [
      'Hot partition risk: if one key dominates traffic (e.g. a single user_id), one partition gets overloaded',
      'Adding partitions breaks existing key → partition mapping (rebalance required)',
      'Key null → falls back to Sticky Partitioner (since Kafka 2.4)',
      'Use custom partitioner to override: sameKey → samePartition, but control hot-spot routing',
    ],
  },
  {
    id: 'sticky',
    label: 'Sticky (No Key)',
    color: '#34d399',
    badge: 'Maximizes batch efficiency for keyless messages',
    overview: 'When no key is provided (key = null), the Sticky Partitioner (introduced in Kafka 2.4) selects a single partition and sticks to it until the batch is full (batch.size reached) or linger.ms elapses. Only then does it switch to the next partition.',
    formula: 'Stick to partition P until full batch OR linger.ms → switch',
    examples: [
      { key: 'null', hash: '→ Sticky: P3', mod: 'batch.size=16KB', result: 'Partition 3 (17 msgs)', color: '#34d399' },
      { key: 'null', hash: '→ batch full', mod: 'linger.ms=5ms', result: 'Partition 3 flushed', color: '#34d399' },
      { key: 'null', hash: '→ Rotate to P1', mod: 'next batch', result: 'Partition 1 (next batch)', color: '#34d399' },
    ],
    gotchas: [
      'Replaced round-robin (Kafka 2.4+): sticky batching gives much better compression and throughput',
      'One batch per sticky window → fewer ProduceRequests → reduces broker CPU overhead',
      'If linger.ms=0, each record is sent immediately → no batching benefit (fine for very low latency)',
      'Useful for fanout topics where key ordering is not needed (e.g. audit logs, telemetry)',
    ],
  },
  {
    id: 'custom',
    label: 'Custom Partitioner',
    color: '#a78bfa',
    badge: 'Full control over partition assignment',
    overview: 'Implement the Partitioner interface to override Kafka\'s default assignment logic. Useful for geographic routing (all EU traffic to specific partitions), priority lanes, or preventing hot-spot keys from overloading a single partition.',
    formula: 'implements Partitioner { partition(topic, key, ...) → int }',
    examples: [
      { key: '"EU_user"', hash: 'region=EU', mod: 'partitions 0–2', result: 'Partition 1 (EU lane)', color: '#a78bfa' },
      { key: '"US_user"', hash: 'region=US', mod: 'partitions 3–5', result: 'Partition 4 (US lane)', color: '#fbbf24' },
      { key: 'HIGH_PRIORITY', hash: 'priority=high', mod: 'partition 0', result: 'Partition 0 (dedicated)', color: '#f97316' },
    ],
    gotchas: [
      'Register via: props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, RegionPartitioner.class)',
      'close() method must clean up any resources (thread pools, connections)',
      'Custom partitioner bypasses DefaultPartitioner completely — you handle all key-null cases',
      'Ensure uniform distribution — skewed assignment causes ISR and consumer lag imbalances',
    ],
  },
];

export default function KafkaPartitioningStrategiesDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'keyhash' | 'sticky' | 'custom'>('keyhash');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .kafka-part-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Partitioning Strategies</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'keyhash' | 'sticky' | 'custom')}
              style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${tab.color}15`, border: `1px solid ${tab.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: tab.color, display: 'inline-block', fontWeight: 600 }}>
          {tab.badge}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{tab.overview}</p>

        {/* Formula */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${tab.color}35`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          <code style={{ fontSize: '12px', color: tab.color, fontFamily: 'monospace' }}>{tab.formula}</code>
        </div>

        <div className="kafka-part-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Examples */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Assignment Examples</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tab.examples.map((ex, i) => (
                <div key={i} style={{ background: `${ex.color}10`, border: `1px solid ${ex.color}30`, borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <code style={{ fontSize: '11px', color: ex.color, background: `${ex.color}18`, borderRadius: '4px', padding: '1px 6px' }}>key={ex.key}</code>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ex.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <code style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{ex.hash}</code>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ex.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <span style={{ fontSize: '11px', color: ex.color, fontWeight: 700 }}>{ex.result}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>{ex.mod}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gotchas */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Production Gotchas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tab.gotchas.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '8px 10px' }}>
                  <span style={{ color: tab.color, flexShrink: 0, fontSize: '11px', marginTop: '1px' }}>⚡</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}