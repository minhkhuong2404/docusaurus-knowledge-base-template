import React, { useState } from 'react';

const TABS = [
  {
    id: 'zookeeper',
    label: 'ZooKeeper Mode',
    color: '#f97316',
    badge: 'Deprecated (removed in Kafka 4.0)',
    overview: 'Kafka relied on Apache ZooKeeper as an external distributed coordination service for over a decade. ZooKeeper stored cluster metadata in a hierarchical ZNode tree — broker IDs, topic configs, partition leaders, and ISR sets.',
    steps: [
      { icon: '1', text: 'Kafka brokers register ephemeral ZNodes at /brokers/ids/<id> on startup', color: '#f97316' },
      { icon: '2', text: 'ZooKeeper Leader (via ZAB protocol) elects the Kafka Active Controller broker', color: '#fbbf24' },
      { icon: '3', text: 'Controller reads full cluster state from ZooKeeper ZNode tree on startup', color: '#fbbf24' },
      { icon: '4', text: 'Controller propagates partition leader changes to brokers via direct RPC', color: '#38bdf8' },
      { icon: '⚠', text: 'On Controller failover, new Controller reads ALL ZNode state (O(partitions) latency)', color: '#f87171' },
    ],
    gotchas: [
      'Controller failover takes 30–60s+ (millions of partitions → slow ZNode traversal)',
      'ZooKeeper session timeouts cause false broker evictions under GC pauses',
      'Practical limit: ~200K partitions per cluster (ZooKeeper memory + session overhead)',
      'Requires separate ZooKeeper cluster (3 or 5 nodes for HA) — additional operational burden',
      'ZooKeeper 3.6+ needed for Kafka; version mismatches cause subtle bugs',
    ],
  },
  {
    id: 'kraft',
    label: 'KRaft Mode',
    color: '#34d399',
    badge: 'Production-Ready (Kafka 3.3+), Default in Kafka 4.0',
    overview: 'KRaft (Kafka Raft) eliminates ZooKeeper by embedding a Raft-based metadata quorum directly into Kafka brokers. Cluster metadata is stored in the __cluster_metadata internal topic and replicated using the Raft consensus protocol.',
    steps: [
      { icon: '1', text: 'Controller quorum (3 or 5 nodes) runs Raft protocol — one becomes Active Controller', color: '#34d399' },
      { icon: '2', text: 'All metadata changes are appended as events to __cluster_metadata Raft log', color: '#34d399' },
      { icon: '3', text: 'All Controller quorum members maintain a full in-memory metadata snapshot', color: '#38bdf8' },
      { icon: '4', text: 'On Controller failover, standby activates in <1s (already has full state)', color: '#34d399' },
      { icon: '5', text: 'Brokers fetch metadata deltas from Controller log on startup — fast incremental sync', color: '#38bdf8' },
    ],
    gotchas: [
      'Supports millions of partitions per cluster (metadata stored as a durable log, not in-memory ZNodes)',
      'Sub-second controller failover (standby controllers maintain full in-memory cache)',
      'Simplified operations: no separate ZooKeeper deployment required',
      'process.roles=broker,controller (combined) or dedicated controller nodes (isolated)',
      'Rolling migration from ZooKeeper possible with kafka-storage.sh dual-write mode',
    ],
  },
];

const COMPARISON = [
  { feature: 'Controller Failover', zk: '30–120s (cold read from ZooKeeper)', kraft: '<1s (in-memory snapshot)' },
  { feature: 'Max Partitions', zk: '~200K (ZNode memory limits)', kraft: 'Millions (log-based storage)' },
  { feature: 'External Dependency', zk: 'ZooKeeper cluster (3–5 nodes)', kraft: 'None (embedded)' },
  { feature: 'Metadata Storage', zk: 'ZNode tree (hierarchical)', kraft: '__cluster_metadata Raft log' },
  { feature: 'Consistency Protocol', zk: 'ZAB (ZooKeeper Atomic Broadcast)', kraft: 'Raft' },
  { feature: 'Kafka 4.0 Support', zk: 'Removed', kraft: 'Default mode' },
];

export default function KraftVsZookeeperDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'zookeeper' | 'kraft'>('zookeeper');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .kraft-detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>KRaft vs ZooKeeper — Kafka Metadata Architecture</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'zookeeper' | 'kraft')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Badge */}
        <div style={{ fontSize: '11px', background: `${tab.color}15`, border: `1px solid ${tab.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '14px', color: tab.color, display: 'inline-block', fontWeight: 600 }}>
          {tab.badge}
        </div>

        {/* Overview */}
        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
          {tab.overview}
        </p>

        <div className="kraft-detail-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {activeTab === 'zookeeper' ? 'How ZooKeeper Mode Works' : 'How KRaft Mode Works'}
            </div>
            {tab.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: step.color, minWidth: '18px', textAlign: 'center', flexShrink: 0, marginTop: '1px' }}>{step.icon}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{step.text}</span>
              </div>
            ))}
          </div>

          {/* Gotchas / Benefits */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {activeTab === 'zookeeper' ? 'Known Limitations' : 'Production Benefits'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tab.gotchas.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: `${tab.color}08`, border: `1px solid ${tab.color}25`, borderRadius: '7px', padding: '8px 10px' }}>
                  <span style={{ color: tab.color, flexShrink: 0, fontSize: '11px', marginTop: '1px' }}>{activeTab === 'zookeeper' ? '✗' : '✓'}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Side-by-Side Comparison</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Feature</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#f97316', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>ZooKeeper Mode</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#34d399', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>KRaft Mode</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{row.feature}</td>
                    <td style={{ padding: '8px 12px', color: '#f97316' }}>{row.zk}</td>
                    <td style={{ padding: '8px 12px', color: '#34d399' }}>{row.kraft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}