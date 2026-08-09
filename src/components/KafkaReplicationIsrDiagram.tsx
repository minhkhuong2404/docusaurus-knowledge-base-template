import React, { useState } from 'react';

const BROKER_NODES = [
  {
    id: 'b1', label: 'Broker 1', subtitle: 'Leader', x: 60, y: 60, w: 130, h: 60, color: '#34d399',
    detail: { title: 'Broker 1 — Partition Leader', body: 'Leader accepts all producer writes. Appends records to the local .log segment. Tracks LEO for each partition. The High Watermark is updated once all ISR followers acknowledge the records.', tags: ['Leader: P0, P2', 'LEO: offset 1048', 'Role: Leader + Follower'] }
  },
  {
    id: 'b2', label: 'Broker 2', subtitle: 'ISR Follower', x: 280, y: 60, w: 130, h: 60, color: '#38bdf8',
    detail: { title: 'Broker 2 — ISR Follower', body: 'Active member of the In-Sync Replicas (ISR) set. Sends FetchRequests to the leader every replica.fetch.wait.max.ms. Its LEO is close to or equal to the leader\'s LEO. Eligible for leader election on leader failure.', tags: ['Follower: P0, P1', 'Fetch lag: ~0ms', 'In ISR: true'] }
  },
  {
    id: 'b3', label: 'Broker 3', subtitle: 'Lagging Replica', x: 500, y: 60, w: 130, h: 60, color: '#f97316',
    detail: { title: 'Broker 3 — Lagging Replica', body: 'Fell behind the leader beyond replica.lag.time.max.ms (default 30s). Removed from ISR set. Its LEO is below the High Watermark. Cannot be leader until it catches up. The HW will not advance past Broker 2\'s LEO while B3 is out-of-sync.', tags: ['Follower: P2, P3', 'Fetch lag: >30s', 'In ISR: false ⚠'] }
  },
  {
    id: 'hw', label: 'High\nWatermark', subtitle: 'offset 1045', x: 170, y: 200, w: 130, h: 56, color: '#fbbf24',
    detail: { title: 'High Watermark (HW)', body: 'The minimum LEO across all current ISR members. Consumers can ONLY read records up to and including the High Watermark — this prevents consumers from reading uncommitted data that could be rolled back on leader failure.', tags: ['HW = min(ISR LEOs)', 'Consumer reads ≤ HW', 'Advances on ISR ACK'] }
  },
  {
    id: 'isr', label: 'ISR Set', subtitle: '[Broker 1, Broker 2]', x: 380, y: 200, w: 130, h: 56, color: '#a78bfa',
    detail: { title: 'In-Sync Replicas (ISR)', body: 'The set of replicas that are fully caught up with the leader within replica.lag.time.max.ms. When acks=all, the leader waits for all ISR members to confirm before acknowledging the producer. A broker is evicted from ISR if it falls behind.', tags: ['ISR: [B1, B2]', 'B3 evicted', 'min.insync.replicas=2'] }
  },
];

const EDGES = [
  { from: 'b1', to: 'b2', label: 'Replicate', color: '#38bdf8' },
  { from: 'b1', to: 'b3', label: 'Replicate', color: '#f97316', dashed: true },
  { from: 'b1', to: 'hw', label: 'tracks', color: '#fbbf24', dashed: true },
  { from: 'b2', to: 'hw', label: 'ISR ACK', color: '#fbbf24' },
  { from: 'b2', to: 'isr', label: 'member', color: '#a78bfa' },
  { from: 'b1', to: 'isr', label: 'leader', color: '#a78bfa' },
];

export default function KafkaReplicationIsrDiagram(): React.JSX.Element {
  const [hovered, setHovered] = useState<string | null>(null);
  const hNode = BROKER_NODES.find(n => n.id === hovered) ?? null;

  const getEdge = (from: string, to: string) => {
    const f = BROKER_NODES.find(n => n.id === from)!;
    const t = BROKER_NODES.find(n => n.id === to)!;
    return {
      x1: f.x + f.w / 2, y1: f.y + f.h,
      x2: t.x + t.w / 2, y2: t.y,
    };
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .kafka-isr-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Replication, ISR &amp; High Watermark</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click node to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="kafka-isr-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 660 285" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f97316'].map(c => (
                  <marker key={c} id={`isr-arr-${c.slice(1)}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill={c} />
                  </marker>
                ))}
              </defs>

              {/* Zone label */}
              <text x="330" y="18" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600" opacity="0.7">BROKER CLUSTER — RF=3, ISR=[B1, B2]</text>

              {EDGES.map((e, i) => {
                const pts = getEdge(e.from, e.to);
                const isHovered = hovered === e.from || hovered === e.to;
                return (
                  <line key={i} x1={pts.x1} y1={pts.y1 + 4} x2={pts.x2} y2={pts.y2 - 4}
                    stroke={e.color} strokeWidth={isHovered ? 2 : 1.5}
                    strokeDasharray={e.dashed ? '5 3' : undefined}
                    opacity={hovered ? (isHovered ? 1 : 0.12) : 0.55}
                    markerEnd={`url(#isr-arr-${e.color.slice(1)})`}
                    style={{ transition: 'opacity 0.3s ease' }} />
                );
              })}

              {BROKER_NODES.map(node => {
                const isActive = hovered === node.id;
                return (
                  <g key={node.id} onClick={() => setHovered(hovered === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
                      fill={isActive ? `${node.color}28` : `${node.color}12`}
                      stroke={node.color} strokeWidth={isActive ? 2 : 1.5}
                      opacity={hovered && !isActive ? 0.3 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    {node.label.split('\n').map((line, li) => (
                      <text key={li} x={node.x + node.w / 2} y={node.y + 26 + li * 14}
                        textAnchor="middle" fill={node.color} fontSize="12" fontWeight="700"
                        opacity={hovered && !isActive ? 0.3 : 1} style={{ transition: 'opacity 0.25s ease' }}>
                        {line}
                      </text>
                    ))}
                    <text x={node.x + node.w / 2} y={node.y + node.h - 8}
                      textAnchor="middle" fill={node.color} fontSize="9.5" opacity={(hovered && !isActive) ? 0.3 : 0.7}>
                      {node.subtitle}
                    </text>
                  </g>
                );
              })}

              {/* B3 Lag indicator */}
              <text x="565" y="140" textAnchor="middle" fill="#f97316" fontSize="9.5" fontWeight="600">⚠ Out of ISR</text>
              <text x="565" y="152" textAnchor="middle" fill="#f97316" fontSize="9" opacity="0.7">lag &gt; 30s</text>

              {/* HW line annotation */}
              <line x1="30" y1="228" x2="630" y2="228" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
              <text x="35" y="244" fill="#fbbf24" fontSize="9.5" opacity="0.8">Consumer read boundary (HW = offset 1045)</text>
            </svg>
          </div>

          <div className={`interactive-diagram-details-card ${hNode ? 'details-green' : 'details-gray'}`}
            style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: hNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {hNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: hNode.color, marginBottom: '10px' }}>{hNode.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {hNode.detail.body}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {hNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${hNode.color}18`, color: hNode.color, border: `1px solid ${hNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <div>Click any broker node to inspect its ISR role</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}