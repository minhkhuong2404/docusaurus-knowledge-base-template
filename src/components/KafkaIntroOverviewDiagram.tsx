import React, { useState } from 'react';

const ECOSYSTEM_NODES = [
  { id: 'producer', label: 'Producers', sub: 'Java, Go, Python, Node.js', color: '#38bdf8', desc: 'Event sources emitting records (e.g. order events, user clicks, sensor telemetry) to Kafka topics.' },
  { id: 'cluster', label: 'Kafka Cluster (Brokers)', sub: 'Partition Log Storage', color: '#34d399', desc: 'Distributed brokers storing immutable append-only commit logs across multi-broker partitions.' },
  { id: 'consumer', label: 'Consumer Groups', sub: 'Parallel Pull Consumers', color: '#a78bfa', desc: 'Scalable worker pools pulling events asynchronously from assigned topic partitions.' },
  { id: 'connect', label: 'Kafka Connect', sub: 'Source & Sink Connectors', color: '#fbbf24', desc: 'Out-of-the-box framework for streaming data between Kafka and databases (Postgres, S3, Elasticsearch).' },
  { id: 'streams', label: 'Kafka Streams / Flink', sub: 'Stream Processing Engines', color: '#f87171', desc: 'Stateful stream processing engines performing real-time windowing, joins, aggregations, and transformations.' }
];

export default function KafkaIntroOverviewDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'gotchas'>('architecture');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cluster');

  const currNode = ECOSYSTEM_NODES.find(n => n.id === selectedNodeId)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .intro-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Apache Kafka Event Streaming Ecosystem & Architecture Overview
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '🌐 Interactive Ecosystem Node Explorer', color: '#38bdf8' },
            { id: 'gotchas', label: '⚡ Core Metrics & Production Gotchas', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Architecture Node Explorer */}
        {activeTab === 'architecture' && (
          <div className="intro-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                CLICK AN ECOSYSTEM COMPONENT:
              </div>

              {ECOSYSTEM_NODES.map(n => {
                const isSel = n.id === selectedNodeId;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? `${n.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? n.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: isSel ? n.color : 'var(--ifm-color-content)' }}>
                      {n.label}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      {n.sub}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: currNode.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                COMPONENT SPECIFICATION
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                {currNode.label}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Role: {currNode.sub}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                {currNode.desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Gotchas & Metrics */}
        {activeTab === 'gotchas' && (
          <div className="intro-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>1. Zero-Copy I/O</div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                Uses Linux OS page cache and <code>sendfile()</code> syscall to stream bytes directly from kernel disk cache to network socket without JVM memory copying.
              </p>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>2. Partition Scaling</div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                Partitions are the unit of parallelism. Maximum active consumers in a consumer group equals the total partition count.
              </p>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>3. ISR Shrink Alerts</div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                Monitor <code>IsrShrinksPerSec</code> and <code>UnderReplicatedPartitions</code>. Shrunken ISR indicates disk I/O congestion or network partition between brokers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}