import React, { useState } from 'react';

const PARTITIONS = [
  {
    id: 'p0', label: 'Partition 0', color: '#38bdf8', leader: 'Broker 1', followers: ['Broker 2', 'Broker 3'],
    offsets: [0, 1, 2, 3, 4, 5], hw: 4, leo: 5,
    detail: { title: 'Partition 0 — Leader: Broker 1', body: 'All producer writes and consumer reads for this partition go through Broker 1. Followers on Broker 2 and Broker 3 replicate asynchronously. The High Watermark (HW=4) is the highest offset safely replicated to all ISR members.', tags: ['Leader: Broker 1', 'ISR: [1, 2, 3]', 'HW: offset 4', 'LEO: offset 5'] }
  },
  {
    id: 'p1', label: 'Partition 1', color: '#34d399', leader: 'Broker 2', followers: ['Broker 1', 'Broker 3'],
    offsets: [0, 1, 2, 3], hw: 3, leo: 3,
    detail: { title: 'Partition 1 — Leader: Broker 2', body: 'Leader is on Broker 2. Partition leadership is distributed across brokers by the Controller for load balancing. Each partition independently handles its own log segment files and ISR tracking.', tags: ['Leader: Broker 2', 'ISR: [1, 2, 3]', 'HW: offset 3', 'LEO: offset 3'] }
  },
  {
    id: 'p2', label: 'Partition 2', color: '#a78bfa', leader: 'Broker 3', followers: ['Broker 1', 'Broker 2'],
    offsets: [0, 1, 2, 3, 4, 5, 6, 7], hw: 6, leo: 7,
    detail: { title: 'Partition 2 — Leader: Broker 3', body: 'This partition has accumulated more messages (offset 7). Messages are never deleted until the retention policy triggers (time-based or size-based). Consumers can seek to any offset within the retention window.', tags: ['Leader: Broker 3', 'retention.ms: 7 days', 'cleanup.policy: delete', 'LEO: offset 7'] }
  },
];

const TOPIC_PROPS = [
  { key: 'Topic Name', val: 'orders.order.created' },
  { key: 'Partitions', val: '3' },
  { key: 'Replication Factor', val: '3 (RF=3)' },
  { key: 'Retention', val: '7 days / unlimited size' },
  { key: 'Cleanup Policy', val: 'delete' },
  { key: 'min.insync.replicas', val: '2' },
];

export default function KafkaTopicPartitionDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedP = PARTITIONS.find(p => p.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kafka-topic-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Topics — Partitioned Append-Only Logs</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Topic header */}
        <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginRight: '8px' }}>Topic:</span>
          {TOPIC_PROPS.map(p => (
            <span key={p.key} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '2px 8px', color: 'var(--ifm-color-content-secondary)' }}>
              <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>{p.key}:</span> {p.val}
            </span>
          ))}
        </div>

        <div className="kafka-topic-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Partitions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PARTITIONS.map(p => {
              const isSelected = selected === p.id;
              return (
                <div key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                  style={{ background: isSelected ? `${p.color}10` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isSelected ? p.color : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '12px', cursor: 'pointer', transition: 'all 0.22s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: p.color }}>{p.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '1px 6px' }}>Leader: {p.leader}</span>
                  </div>

                  {/* Offset log strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto' }}>
                    {p.offsets.map(off => {
                      const isHW = off === p.hw;
                      const isLEO = off === p.leo;
                      return (
                        <div key={off} style={{ minWidth: '38px', height: '36px', border: `1px solid ${p.color}50`, borderRadius: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isHW ? `${p.color}25` : `${p.color}0a`, flexShrink: 0, position: 'relative' }}>
                          <span style={{ fontSize: '10px', color: p.color, fontWeight: 700 }}>#{off}</span>
                          {isHW && <span style={{ fontSize: '7.5px', color: p.color, fontWeight: 600, position: 'absolute', bottom: '-13px', whiteSpace: 'nowrap' }}>HW</span>}
                        </div>
                      );
                    })}
                    {/* Append arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '4px', color: p.color, opacity: 0.6, flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {p.followers.map(f => (
                      <span key={f} style={{ fontSize: '10px', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '4px', padding: '1px 6px' }}>Replica: {f}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className={`interactive-diagram-details-card ${selectedP ? 'details-cyan' : 'details-gray'}`}
            style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: selectedP ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {selectedP ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selectedP.color, marginBottom: '10px' }}>{selectedP.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {selectedP.detail.body}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedP.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${selectedP.color}18`, color: selectedP.color, border: `1px solid ${selectedP.color}40`, borderRadius: '5px', padding: '2px 7px' }}>
                      {t}
                    </code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                </svg>
                <div>Click a partition to inspect its details</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}