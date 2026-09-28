import React, { useState } from 'react';

type IlmPhase = 'hot' | 'warm' | 'cold' | 'delete';

interface PhaseDetail {
  title: string;
  badge: string;
  badgeColor: string;
  hardware: string;
  actions: string[];
  retention: string;
}

const PHASES: Record<IlmPhase, PhaseDetail> = {
  hot: {
    title: '🔥 Hot Phase (Active Ingest & Search)',
    badge: 'Read / Write',
    badgeColor: '#f87171',
    hardware: 'High-performance NVMe SSDs, High CPU, 50% RAM dedicated to OS page cache',
    actions: [
      'Index actively receives new streaming documents from Logstash / Kafka',
      'High shard replication factor (e.g. 1 primary, 1+ replicas)',
      'Rollover condition: Triggers when index reaches 50GB or 7 days old'
    ],
    retention: 'Day 0 to Day 7'
  },
  warm: {
    title: '☀️ Warm Phase (Read-Only & Shard Shrinking)',
    badge: 'Query Only',
    badgeColor: '#fbbf24',
    hardware: 'Balanced SATA SSDs / dense HDDs, moderate CPU',
    actions: [
      'Index transitions to read-only mode (no new writes)',
      '_shrink API: Consolidates multiple primary shards down to 1 primary shard',
      '_forcemerge API: Merges fragmented Lucene segments into 1 single segment to maximize search cache locality'
    ],
    retention: 'Day 7 to Day 30'
  },
  cold: {
    title: '❄️ Cold Phase (Searchable Snapshots & Archive)',
    badge: 'Infrequent Search',
    badgeColor: '#38bdf8',
    hardware: 'Low-cost object storage (Amazon S3 / Google Cloud Storage) with local NVMe caching',
    actions: [
      'Index converted to Searchable Snapshot mounted directly from S3',
      'Zero replica shards required on cluster disks (S3 provides 11 9s durability)',
      'Storage cost reduced by 50%–75% compared to Hot tier'
    ],
    retention: 'Day 30 to Day 90'
  },
  delete: {
    title: '🗑️ Delete Phase (Automated Purge & Cleanup)',
    badge: 'Purged',
    badgeColor: '#94a3b8',
    hardware: 'Storage reclaimed completely across cluster & object store',
    actions: [
      'Automated index deletion once retention SLA expires',
      'Frees up cluster metadata and master node memory overhead',
      'Audit log and snapshot deletion verified'
    ],
    retention: 'Day 90+'
  }
};

export default function ElasticsearchIlmPipelineDiagram(): React.JSX.Element {
  const [selectedPhase, setSelectedPhase] = useState<IlmPhase>('hot');
  const active = PHASES[selectedPhase];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Elasticsearch Index Lifecycle Management (ILM) Multi-Tier Pipeline
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {(['hot', 'warm', 'cold', 'delete'] as IlmPhase[]).map((p) => {
            const isSelected = selectedPhase === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPhase(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? PHASES[p].badgeColor : 'rgba(255,255,255,0.1)'}`,
                  background: isSelected ? `${PHASES[p].badgeColor}22` : 'rgba(255,255,255,0.04)',
                  color: isSelected ? PHASES[p].badgeColor : 'var(--ifm-color-content-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Horizontal Pipeline Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
          {(['hot', 'warm', 'cold', 'delete'] as IlmPhase[]).map((p) => {
            const isSelected = selectedPhase === p;
            const item = PHASES[p];
            return (
              <div
                key={p}
                onClick={() => setSelectedPhase(p)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isSelected ? item.badgeColor : 'rgba(255,255,255,0.08)'}`,
                  background: isSelected ? `${item.badgeColor}15` : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, color: item.badgeColor, textTransform: 'uppercase' }}>
                  {p} Phase
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  {item.badge}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  {item.retention}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div style={{
          padding: '14px',
          borderRadius: '8px',
          border: `1px solid ${active.badgeColor}40`,
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: active.badgeColor, fontSize: '13px', fontWeight: 700 }}>
              {active.title}
            </h4>
            <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              Target SLA: {active.retention}
            </span>
          </div>

          <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
            <strong>🖥️ Hardware Tier:</strong> {active.hardware}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong>⚙️ Automated ILM Actions:</strong>
            <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
              {active.actions.map((act, idx) => (
                <li key={idx} style={{ marginBottom: '3px' }}>{act}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
