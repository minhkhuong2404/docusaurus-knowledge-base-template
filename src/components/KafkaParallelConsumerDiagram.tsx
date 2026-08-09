import React, { useState } from 'react';

const TABS = [
  {
    id: 'standard',
    label: 'Standard Consumer',
    color: '#38bdf8',
    badge: 'Sequential processing — one record at a time per partition',
    overview: 'The standard Kafka consumer processes records from each assigned partition sequentially. Within a consumer group, each partition is assigned to exactly one consumer instance. This guarantees ordering but limits throughput to processing speed × partition count.',
    diagram: {
      consumer: 'Consumer Instance',
      threads: [
        { label: 'Poll Thread', sub: 'poll() → process → commit', color: '#38bdf8', records: ['Record 0', 'Record 1', 'Record 2', '...'] },
      ],
      note: 'Single thread handles polling, processing, AND offset commit. Processing is synchronous — record N+1 starts only after N is done.',
    },
    gotchas: [
      { icon: '✗', text: 'Processing bottleneck: throughput = 1/record_processing_time × partitions', color: '#f87171' },
      { icon: '✗', text: 'Slow records block the entire poll() loop — risks max.poll.interval.ms timeout', color: '#f87171' },
      { icon: '✓', text: 'Strict per-partition ordering guaranteed', color: '#34d399' },
      { icon: '✓', text: 'Offset commit is simple: process then commit sequentially', color: '#34d399' },
    ],
  },
  {
    id: 'parallel',
    label: 'Parallel Consumer',
    color: '#a78bfa',
    badge: 'Concurrent processing within a partition — without sacrificing ordering',
    overview: 'The Parallel Consumer (open-source library: com.amadeus.kafka:parallel-consumer-core) decouples polling from processing. It maintains an internal work queue and dispatches records to a thread pool for concurrent processing, then manages offset commit tracking automatically — even out-of-order completions.',
    diagram: {
      consumer: 'Parallel Consumer Instance',
      threads: [
        { label: 'Poll Thread', sub: 'Drains broker records to WorkQueue', color: '#a78bfa', records: [] },
        { label: 'Worker Thread 1', sub: 'processingRecord(offset=5)', color: '#34d399', records: ['Record 5'] },
        { label: 'Worker Thread 2', sub: 'processingRecord(offset=6)', color: '#34d399', records: ['Record 6'] },
        { label: 'Worker Thread 3', sub: 'processingRecord(offset=7)', color: '#34d399', records: ['Record 7'] },
        { label: 'Offset Manager', sub: 'Tracks in-flight → commits safe HW', color: '#fbbf24', records: ['Committed: 4'] },
      ],
      note: 'Worker threads process records concurrently. Offset Manager tracks which offsets have completed and commits the highest contiguous completed offset.',
    },
    gotchas: [
      { icon: '✓', text: 'N× throughput increase (N = worker thread count)', color: '#34d399' },
      { icon: '✓', text: 'Poll thread stays fast — processing is offloaded to workers', color: '#34d399' },
      { icon: '✓', text: 'Ordering can be preserved per-key (key-based ordering mode)', color: '#34d399' },
      { icon: '⚠', text: 'Offset commit is complex — tracks per-offset completion bitmap', color: '#fbbf24' },
      { icon: '⚠', text: 'Out-of-order completion: commit blocked until earlier offsets complete', color: '#fbbf24' },
      { icon: '~', text: 'Best for: external API calls, DB writes, or CPU-intensive processing', color: '#38bdf8' },
    ],
  },
];

export default function KafkaParallelConsumerDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'standard' | 'parallel'>('standard');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .parallel-consumer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Standard vs Parallel Consumer — Threading Models</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'standard' | 'parallel')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${tab.color}15`, border: `1px solid ${tab.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: tab.color, display: 'inline-block', fontWeight: 600 }}>
          {tab.badge}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>{tab.overview}</p>

        <div className="parallel-consumer-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Thread diagram */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Thread Architecture</div>
            <div style={{ background: `${tab.color}08`, border: `1px solid ${tab.color}25`, borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: tab.color, marginBottom: '10px' }}>{tab.diagram.consumer}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {tab.diagram.threads.map((thread, i) => (
                  <div key={i} style={{ background: `${thread.color}10`, border: `1px solid ${thread.color}30`, borderRadius: '7px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: thread.color }}>{thread.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{thread.sub}</div>
                    </div>
                    {thread.records.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {thread.records.map(r => (
                          <span key={r} style={{ fontSize: '9.5px', background: `${thread.color}18`, color: thread.color, border: `1px solid ${thread.color}35`, borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', lineHeight: 1.5 }}>
                {tab.diagram.note}
              </div>
            </div>
          </div>

          {/* Gotchas */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Tradeoffs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tab.gotchas.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '12px', color: g.color, flexShrink: 0 }}>{g.icon}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}