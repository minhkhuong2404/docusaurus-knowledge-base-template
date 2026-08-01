import React, { useState } from 'react';

const NODES = [
  { id: 'producer1', label: 'Producer\nApp A', x: 30, y: 80, w: 90, h: 52, color: '#38bdf8', role: 'producer', detail: { title: 'Producer Application', body: 'Serializes records, assigns partition via partitioner (key-hash / sticky), batches into RecordAccumulator, and sends via Sender thread. Configures acks, retries, compression, and linger.ms.', tags: ['acks=all', 'batch.size=16KB', 'linger.ms=5'] } },
  { id: 'producer2', label: 'Producer\nApp B', x: 30, y: 160, w: 90, h: 52, color: '#38bdf8', role: 'producer', detail: { title: 'Producer Application', body: 'Multiple independent producers can write to the same topic concurrently. Each producer maintains its own RecordAccumulator and network client connection pool.', tags: ['idempotent=true', 'compression=snappy'] } },
  { id: 'b1', label: 'Broker 1\n(Leader)', x: 220, y: 60, w: 110, h: 60, color: '#34d399', role: 'broker', detail: { title: 'Kafka Broker 1 — Leader', body: 'Partition leader handles all producer writes and consumer reads. Appends records to .log segment files. Notifies ISR followers to replicate.', tags: ['Leader: p0, p2', 'ISR: [1, 2, 3]', 'LEO: offset 1048'] } },
  { id: 'b2', label: 'Broker 2\n(Follower)', x: 220, y: 150, w: 110, h: 60, color: '#fbbf24', role: 'broker', detail: { title: 'Kafka Broker 2 — Follower', body: 'Follower replica fetches batches from the leader via FetchRequest. Maintains its own copy of the segment log. Eligible for leader election on broker failure.', tags: ['Follower: p0, p1', 'Fetch lag: 0ms', 'In ISR: true'] } },
  { id: 'b3', label: 'Broker 3\n(Follower)', x: 220, y: 240, w: 110, h: 60, color: '#fbbf24', role: 'broker', detail: { title: 'Kafka Broker 3 — Follower', body: 'Second follower replica. Provides RF=3 fault tolerance. If Broker 3 falls behind beyond replica.lag.time.max.ms, it is removed from the ISR set.', tags: ['Follower: p2, p3', 'replica.lag.time.max.ms=30s', 'In ISR: true'] } },
  { id: 'consumer1', label: 'Consumer\nGroup A', x: 430, y: 80, w: 100, h: 52, color: '#a78bfa', role: 'consumer', detail: { title: 'Consumer Group A', body: 'Each partition is assigned to exactly one consumer instance within a group. Consumers poll() messages, process them, then commit offsets to __consumer_offsets. Scale by adding consumers up to the partition count.', tags: ['auto.offset.reset=earliest', 'enable.auto.commit=false'] } },
  { id: 'consumer2', label: 'Consumer\nGroup B', x: 430, y: 160, w: 100, h: 52, color: '#a78bfa', role: 'consumer', detail: { title: 'Consumer Group B', body: 'Independent consumer group reading the same topic — each group maintains its own committed offset. Enables fan-out: analytics, auditing, and event-sourcing from the same topic.', tags: ['group.id=analytics', 'fetch.min.bytes=1KB'] } },
  { id: 'kraft', label: 'KRaft\nController', x: 220, y: 330, w: 110, h: 52, color: '#f97316', role: 'controller', detail: { title: 'KRaft Controller Quorum', body: 'Replaces ZooKeeper. Stores cluster metadata (broker registrations, topic configs, partition assignments) in __cluster_metadata topic replicated via the Raft consensus protocol. Sub-second leader failover.', tags: ['Kafka 3.3+ stable', 'Removed ZooKeeper in 4.0', 'Sub-second failover'] } },
];

const EDGES = [
  { from: 'producer1', to: 'b1', color: '#38bdf8' },
  { from: 'producer1', to: 'b2', color: '#38bdf8' },
  { from: 'producer2', to: 'b2', color: '#38bdf8' },
  { from: 'producer2', to: 'b3', color: '#38bdf8' },
  { from: 'b1', to: 'b2', color: '#34d399', dashed: true },
  { from: 'b1', to: 'b3', color: '#34d399', dashed: true },
  { from: 'b1', to: 'consumer1', color: '#a78bfa' },
  { from: 'b2', to: 'consumer1', color: '#a78bfa' },
  { from: 'b2', to: 'consumer2', color: '#a78bfa' },
  { from: 'b3', to: 'consumer2', color: '#a78bfa' },
  { from: 'b1', to: 'kraft', color: '#f97316', dashed: true },
  { from: 'b2', to: 'kraft', color: '#f97316', dashed: true },
  { from: 'b3', to: 'kraft', color: '#f97316', dashed: true },
];

function nodeCenterX(n: typeof NODES[0]) { return n.x + n.w / 2; }
function nodeCenterY(n: typeof NODES[0]) { return n.y + n.h / 2; }

export default function KafkaArchitectureOverviewDiagram(): React.JSX.Element {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredNode = NODES.find(n => n.id === hovered) ?? null;

  const getEdgePoints = (e: typeof EDGES[0]) => {
    const from = NODES.find(n => n.id === e.from)!;
    const to = NODES.find(n => n.id === e.to)!;
    const x1 = from.x + from.w + 4;
    const y1 = nodeCenterY(from);
    const x2 = to.x - 4;
    const y2 = nodeCenterY(to);
    return { x1, y1, x2, y2 };
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kafka-arch-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Cluster Architecture</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click any node to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="kafka-arch-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* SVG Canvas */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 560 400" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f97316'].map(color => (
                  <marker key={color} id={`arr-${color.slice(1)}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill={color} />
                  </marker>
                ))}
              </defs>

              {/* Zone labels */}
              <text x="75" y="30" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="600" opacity="0.7">PRODUCERS</text>
              <text x="275" y="30" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600" opacity="0.7">BROKER CLUSTER</text>
              <text x="480" y="30" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="600" opacity="0.7">CONSUMERS</text>

              {/* Edges */}
              {EDGES.map((e, i) => {
                const { x1, y1, x2, y2 } = getEdgePoints(e);
                const isHovered = hovered === e.from || hovered === e.to;
                const markerId = `arr-${e.color.slice(1)}`;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={e.color} strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={e.dashed ? '5 3' : undefined}
                    opacity={hovered ? (isHovered ? 1 : 0.15) : 0.55}
                    markerEnd={`url(#${markerId})`}
                    style={{ transition: 'opacity 0.3s ease, stroke-width 0.2s ease' }} />
                );
              })}

              {/* Nodes */}
              {NODES.map(node => {
                const isActive = hovered === node.id;
                return (
                  <g key={node.id} onClick={() => setHovered(hovered === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
                      fill={isActive ? `${node.color}30` : `${node.color}15`}
                      stroke={node.color}
                      strokeWidth={isActive ? 2 : 1.5}
                      opacity={hovered && !isActive ? 0.35 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    {node.label.split('\n').map((line, li) => (
                      <text key={li} x={node.x + node.w / 2} y={node.y + node.h / 2 + (li - 0.3) * 14}
                        textAnchor="middle" fill={node.color} fontSize="11.5" fontWeight="700"
                        opacity={hovered && !isActive ? 0.35 : 1}
                        style={{ transition: 'opacity 0.25s ease' }}>
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}

              {/* Legend */}
              <line x1="30" y1="380" x2="55" y2="380" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="60" y="384" fill="#38bdf8" fontSize="9.5">Produce</text>
              <line x1="105" y1="380" x2="130" y2="380" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="135" y="384" fill="#34d399" fontSize="9.5">Replicate</text>
              <line x1="188" y1="380" x2="213" y2="380" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="218" y="384" fill="#a78bfa" fontSize="9.5">Consume</text>
              <line x1="265" y1="380" x2="290" y2="380" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="295" y="384" fill="#f97316" fontSize="9.5">Metadata</text>
            </svg>
          </div>

          {/* Detail panel */}
          <div className={`interactive-diagram-details-card ${hoveredNode?.role === 'producer' ? 'details-cyan' : hoveredNode?.role === 'broker' ? 'details-green' : hoveredNode?.role === 'consumer' ? 'details-purple' : 'details-gray'}`}
            style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: hoveredNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {hoveredNode ? (
              <div>
                <div className="interactive-diagram-card-header" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: hoveredNode.color }}>{hoveredNode.detail.title}</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {hoveredNode.detail.body}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {hoveredNode.detail.tags.map(tag => (
                    <code key={tag} style={{ fontSize: '10.5px', background: `${hoveredNode.color}18`, color: hoveredNode.color, border: `1px solid ${hoveredNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>
                      {tag}
                    </code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
                <div>Click any node to inspect its role</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}