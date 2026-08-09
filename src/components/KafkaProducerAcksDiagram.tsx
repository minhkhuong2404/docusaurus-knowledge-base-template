import React, { useState } from 'react';

const TABS = [
  {
    id: 'acks0',
    label: 'acks=0',
    color: '#f87171',
    badge: 'Fire-and-forget — no guarantee',
    overview: 'The producer does NOT wait for any acknowledgement from the broker. The message is considered "sent" as soon as it leaves the producer\'s network buffer. Maximum throughput, zero durability.',
    flow: [
      { actor: 'Producer', label: 'ProduceRequest → Broker', color: '#f87171', dir: 'right' },
      { actor: 'Producer', label: '(No wait — returns immediately)', color: '#f87171', dir: 'self', note: 'Callback fires immediately. If broker crashes, message is silently lost.' },
    ],
    tradeoffs: [
      { icon: '✓', text: 'Highest throughput — no round-trip wait', good: true },
      { icon: '✗', text: 'Messages can be silently lost on broker crash', good: false },
      { icon: '✗', text: 'No delivery guarantee whatsoever', good: false },
      { icon: '~', text: 'Use for: metrics, telemetry, non-critical logging', good: null },
    ],
  },
  {
    id: 'acks1',
    label: 'acks=1',
    color: '#fbbf24',
    badge: 'Leader-only ACK — default',
    overview: 'The producer waits for the partition leader to write the message to its local log. Does NOT wait for any follower to replicate. If the leader crashes between the ACK and follower replication, the message is lost.',
    flow: [
      { actor: 'Producer', label: 'ProduceRequest → Leader', color: '#fbbf24', dir: 'right' },
      { actor: 'Leader', label: 'Appended to local .log', color: '#34d399', dir: 'self', note: 'Leader writes to its own log segment.' },
      { actor: 'Leader', label: 'ACK → Producer', color: '#fbbf24', dir: 'left', note: 'ACK sent BEFORE follower replication. If leader dies now, message is lost.' },
    ],
    tradeoffs: [
      { icon: '✓', text: 'Good balance of throughput and basic durability', good: true },
      { icon: '✗', text: 'Leader crash between ACK and replication → data loss', good: false },
      { icon: '~', text: 'Default setting for most non-financial workloads', good: null },
      { icon: '~', text: 'Acceptable for: order processing with idempotent retry', good: null },
    ],
  },
  {
    id: 'acksall',
    label: 'acks=all (−1)',
    color: '#34d399',
    badge: 'Full ISR ACK — zero data loss (with min.insync.replicas)',
    overview: 'The producer waits until ALL In-Sync Replicas (ISR) have persisted the message to their local logs. The broker returns the ACK only after the High Watermark advances. Zero data loss guarantee when combined with min.insync.replicas=2.',
    flow: [
      { actor: 'Producer', label: 'ProduceRequest → Leader', color: '#38bdf8', dir: 'right' },
      { actor: 'Leader', label: 'Append to .log + wait ISR', color: '#34d399', dir: 'self', note: 'Leader appends and blocks until all ISR members fetch and ACK.' },
      { actor: 'Leader', label: 'FetchRequest ← Follower 1 (ISR)', color: '#34d399', dir: 'left', note: 'Follower 1 replicates and sends updated LEO.' },
      { actor: 'Leader', label: 'FetchRequest ← Follower 2 (ISR)', color: '#34d399', dir: 'left', note: 'Follower 2 replicates. HW advances to match.' },
      { actor: 'Leader', label: 'ACK → Producer (offset)', color: '#34d399', dir: 'left', note: 'Both ISR members confirmed. Safe to ACK. Message will survive any single broker failure.' },
    ],
    tradeoffs: [
      { icon: '✓', text: 'Zero data loss guarantee (with min.insync.replicas=2)', good: true },
      { icon: '✓', text: 'Mandatory for financial, audit, and compliance workloads', good: true },
      { icon: '~', text: 'Latency increases by ~replica.fetch.wait.max.ms (500ms)', good: null },
      { icon: '⚡', text: 'Pair with enable.idempotence=true for exactly-once at-most-once retry', good: true },
    ],
  },
];

export default function KafkaProducerAcksDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'acks0' | 'acks1' | 'acksall'>('acks1');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Producer Acknowledgement Modes (acks)</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'acks0' | 'acks1' | 'acksall')}
              style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12.5px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${tab.color}15`, border: `1px solid ${tab.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: tab.color, display: 'inline-block', fontWeight: 600 }}>
          {tab.badge}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>{tab.overview}</p>

        {/* Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Message Flow</div>
          {tab.flow.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: f.color, minWidth: '14px', paddingTop: '3px' }}>{i + 1}</span>
              <div style={{ flex: 1, background: `${f.color}10`, border: `1px solid ${f.color}30`, borderRadius: '7px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {f.dir === 'right' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  )}
                  {f.dir === 'left' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  )}
                  <code style={{ fontSize: '11px', color: f.color, fontWeight: 700 }}>{f.label}</code>
                </div>
                {f.note && <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '3px' }}>{f.note}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Tradeoffs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Tradeoffs</div>
          {tab.tradeoffs.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '8px 12px' }}>
              <span style={{ fontSize: '12px', color: t.good === true ? '#34d399' : t.good === false ? '#f87171' : '#fbbf24', flexShrink: 0 }}>{t.icon}</span>
              <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}