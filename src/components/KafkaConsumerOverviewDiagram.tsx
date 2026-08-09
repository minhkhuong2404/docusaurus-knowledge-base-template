import React, { useState } from 'react';

const NODES = [
  {
    id: 'app', label: 'Consumer App', subtitle: 'Your Application Logic', x: 30, y: 150, w: 120, h: 56, color: '#a78bfa',
    detail: { title: 'Consumer Application', body: 'Your application calls consumer.poll(Duration.ofMillis(100)). This returns a batch of ConsumerRecords. You process each record synchronously, then commit offsets. The poll() loop must be called frequently to prevent the heartbeat from timing out and triggering a rebalance.', tags: ['poll() every < max.poll.interval.ms', 'max.poll.interval.ms=300s default', 'group.id identifies the consumer group'] }
  },
  {
    id: 'poll', label: 'poll()', subtitle: 'FetchRequest to broker', x: 220, y: 70, w: 130, h: 56, color: '#38bdf8',
    detail: { title: 'poll() — FetchRequest', body: 'poll() sends a FetchRequest to the leader broker for each assigned partition. The broker waits up to fetch.max.wait.ms (500ms) for at least fetch.min.bytes (1) of data before responding. Returns up to max.poll.records (500) records.', tags: ['fetch.min.bytes=1', 'fetch.max.wait.ms=500', 'max.poll.records=500'] }
  },
  {
    id: 'broker', label: 'Broker Leader', subtitle: 'Partition Leader', x: 420, y: 70, w: 130, h: 56, color: '#34d399',
    detail: { title: 'Broker — FetchResponse', body: 'Broker responds with record batches from the partition log, starting from the last committed offset. Records up to the High Watermark are returned. Zero-copy sendfile() transfers data directly from page cache to network socket.', tags: ['Zero-copy I/O (sendfile)', 'Returns up to HW offset', 'fetch.max.bytes=52428800 (50MB)'] }
  },
  {
    id: 'process', label: 'Process Record', subtitle: 'Business logic execution', x: 220, y: 175, w: 130, h: 56, color: '#fbbf24',
    detail: { title: 'Record Processing', body: 'Your code processes each ConsumerRecord sequentially. Keep processing fast — if max.poll.interval.ms is exceeded between poll() calls, the group coordinator assumes the consumer is dead and triggers a rebalance, reassigning its partitions.', tags: ['Synchronous processing default', 'Avoid blocking > max.poll.interval.ms', 'Process → commit atomically for at-least-once'] }
  },
  {
    id: 'commit', label: 'commitSync()', subtitle: 'Offset committed to __consumer_offsets', x: 420, y: 175, w: 130, h: 56, color: '#f97316',
    detail: { title: 'Offset Commit', body: 'After processing, commit the next offset to consume (last processed + 1). commitSync() blocks until the broker confirms. commitAsync() does not block but provides no retry on failure. Offsets are stored in the internal __consumer_offsets topic.', tags: ['Committed offset = last + 1', '__consumer_offsets topic', 'enable.auto.commit=false (manual)', 'auto.commit.interval.ms=5000'] }
  },
  {
    id: 'heartbeat', label: 'Heartbeat\nThread', subtitle: 'Background thread', x: 220, y: 290, w: 130, h: 60, color: '#f472b6',
    detail: { title: 'Heartbeat Thread (Background)', body: 'A separate background thread sends heartbeats to the Group Coordinator every heartbeat.interval.ms (default 3s). If the coordinator does not receive a heartbeat within session.timeout.ms (45s), the consumer is declared dead and a rebalance is triggered. Heartbeat thread is independent of the polling thread.', tags: ['heartbeat.interval.ms=3s', 'session.timeout.ms=45s', 'Independent of poll() thread'] }
  },
];

const EDGES = [
  { from: 'app', to: 'poll', label: 'consumer.poll()', color: '#a78bfa' },
  { from: 'poll', to: 'broker', label: 'FetchRequest', color: '#38bdf8' },
  { from: 'broker', to: 'poll', label: 'ConsumerRecords', color: '#34d399', reverse: true },
  { from: 'poll', to: 'process', label: 'records', color: '#fbbf24' },
  { from: 'process', to: 'commit', label: 'commitSync()', color: '#f97316' },
  { from: 'commit', to: 'broker', label: 'OffsetCommitRequest', color: '#f97316' },
  { from: 'commit', to: 'app', label: 'loop back', color: '#a78bfa', back: true },
  { from: 'heartbeat', to: 'broker', label: 'Heartbeat RPC', color: '#f472b6' },
];

export default function KafkaConsumerOverviewDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .consumer-overview-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Consumer — Pull Loop &amp; Offset Commit</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click component to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="consumer-overview-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* SVG Canvas */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 580 380" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f97316', '#f472b6'].map(c => (
                  <marker key={c} id={`co-arr-${c.slice(1)}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill={c} />
                  </marker>
                ))}
              </defs>

              {/* Edges */}
              {/* app → poll */}
              <path d="M 150 168 Q 185 168 220 98" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#co-arr-a78bfa)" opacity="0.55" />
              {/* poll → broker */}
              <path d="M 350 98 L 420 98" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#co-arr-38bdf8)" opacity="0.55" />
              {/* broker → poll */}
              <path d="M 420 108 L 350 108" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#co-arr-34d399)" opacity="0.55" strokeDasharray="4 2" />
              {/* poll → process */}
              <path d="M 285 126 L 285 175" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#co-arr-fbbf24)" opacity="0.55" />
              {/* process → commit */}
              <path d="M 350 203 L 420 203" fill="none" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#co-arr-f97316)" opacity="0.55" />
              {/* commit → broker */}
              <path d="M 485 175 L 485 126" fill="none" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#co-arr-f97316)" opacity="0.55" strokeDasharray="4 2" />
              {/* commit → app (loop) */}
              <path d="M 420 220 Q 300 280 150 195" fill="none" stroke="#a78bfa" strokeWidth="1.2" markerEnd="url(#co-arr-a78bfa)" opacity="0.4" strokeDasharray="5 3" />
              {/* heartbeat → broker */}
              <path d="M 350 318 Q 440 318 485 230" fill="none" stroke="#f472b6" strokeWidth="1.3" markerEnd="url(#co-arr-f472b6)" opacity="0.5" strokeDasharray="4 2" />

              {/* Labels on arrows */}
              <text x="168" y="142" fill="#a78bfa" fontSize="8.5">poll()</text>
              <text x="370" y="92" fill="#38bdf8" fontSize="8.5">FetchRequest</text>
              <text x="370" y="120" fill="#34d399" fontSize="8.5">ConsumerRecords</text>
              <text x="356" y="196" fill="#f97316" fontSize="8.5">commitSync</text>
              <text x="260" y="265" fill="#a78bfa" fontSize="8.5" opacity="0.6">loop back</text>

              {/* Nodes */}
              {NODES.map(node => {
                const isActive = selected === node.id;
                return (
                  <g key={node.id} onClick={() => setSelected(selected === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
                      fill={isActive ? `${node.color}28` : `${node.color}12`}
                      stroke={node.color} strokeWidth={isActive ? 2 : 1.5}
                      opacity={selected && !isActive ? 0.3 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    {node.label.split('\n').map((line, li) => (
                      <text key={li} x={node.x + node.w / 2} y={node.y + 22 + li * 14} textAnchor="middle" fill={node.color} fontSize="11" fontWeight="700"
                        opacity={selected && !isActive ? 0.3 : 1} style={{ transition: 'opacity 0.25s ease' }}>
                        {line}
                      </text>
                    ))}
                    <text x={node.x + node.w / 2} y={node.y + node.h - 7} textAnchor="middle" fill={node.color} fontSize="8.5" opacity={(selected && !isActive) ? 0.25 : 0.6}>
                      {node.subtitle}
                    </text>
                  </g>
                );
              })}

              {/* Loop label */}
              <text x="290" y="375" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9.5">Consumer Poll Loop</text>
            </svg>
          </div>

          {/* Detail panel */}
          <div className={`interactive-diagram-details-card ${selNode ? 'details-purple' : 'details-gray'}`}
            style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color, marginBottom: '10px' }}>{selNode.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {selNode.detail.body}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                <div>Click any component to inspect the consumer pull loop</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}