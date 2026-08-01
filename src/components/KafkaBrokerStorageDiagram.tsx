import React, { useState } from 'react';

const NODES = [
  {
    id: 'broker', label: 'Broker Node', x: 30, y: 20, w: 600, h: 360, color: '#38bdf8', isContainer: true,
    detail: null
  },
  {
    id: 'log0', label: '/data/orders-0/', x: 50, y: 60, w: 180, h: 130, color: '#34d399',
    detail: { title: 'Partition 0 Directory', body: 'Each partition lives in its own directory. The directory name is <topic>-<partition>. All segment files for this partition are stored here in append-only order.', tags: ['log.dirs=/var/lib/kafka/data', 'Active segment: 00001048.log', 'index.interval.bytes=4096'] }
  },
  {
    id: 'log1', label: '/data/orders-1/', x: 250, y: 60, w: 180, h: 130, color: '#a78bfa',
    detail: { title: 'Partition 1 Directory', body: 'Independent partition directory with its own set of .log, .index, and .timeindex segment files. The leader for this partition may be on a different broker.', tags: ['cleanup.policy=delete', 'retention.bytes=-1 (unlimited)', 'segment.bytes=1GB'] }
  },
  {
    id: 'log2', label: '/data/orders-2/', x: 450, y: 60, w: 155, h: 130, color: '#fbbf24',
    detail: { title: 'Partition 2 Directory', body: 'Third partition with its own segment lifecycle. Segments are rolled when they exceed segment.bytes (1GB) or segment.ms (7 days), creating a new active segment file.', tags: ['segment.ms=604800000 (7d)', 'log.roll.ms overrides segment.ms'] }
  },
  {
    id: 'dotlog', label: '.log\nRecordBatches', x: 60, y: 110, w: 78, h: 60, color: '#34d399',
    detail: { title: 'Segment Log File (.log)', body: 'Binary file containing raw Kafka RecordBatch structures. Each batch includes: magic byte, CRC, attributes, timestamp, producer ID (PID), sequence number, and the key+value payload. Zero-copy sendfile() transfers records directly from page cache to network socket — no userspace copy.', tags: ['Zero-copy I/O (sendfile)', 'RecordBatch: headers + payload', 'CRC32 validation on read'] }
  },
  {
    id: 'dotindex', label: '.index\nOffset→Pos', x: 145, y: 110, w: 78, h: 60, color: '#38bdf8',
    detail: { title: 'Offset Index File (.index)', body: 'Sparse index mapping logical record offsets to physical byte positions within the .log file. Kafka writes an entry every index.interval.bytes (default 4KB). On consumer seek, binary search on .index gives the nearest position, then the broker scans forward linearly in .log.', tags: ['Sparse: 1 entry / 4KB', 'Binary search for seek', 'Memory-mapped (mmap)'] }
  },
  {
    id: 'sender', label: 'Network\nSender Thread', x: 50, y: 260, w: 240, h: 70, color: '#f97316',
    detail: { title: 'Network Sender Thread', body: 'Dedicated I/O thread (separate from the produce thread) that drains the RecordAccumulator and sends batched RecordBatches to leader brokers. Uses Java NIO selectors for non-blocking async I/O across all broker connections simultaneously.', tags: ['NIO Selector (non-blocking)', 'In-flight requests per broker', 'max.in.flight.requests.per.connection=5'] }
  },
  {
    id: 'fetcher', label: 'ReplicaFetcher\nThread (per follower)', x: 350, y: 260, w: 240, h: 70, color: '#f472b6',
    detail: { title: 'ReplicaFetcher Thread', body: 'Each follower broker runs one ReplicaFetcher thread per leader broker it is replicating from. Sends FetchRequest RPCs to fetch new RecordBatches. Applies them to local partition log and advances its LEO. Multiple threads run in parallel for follower brokers with many leaders.', tags: ['1 thread per leader broker', 'replica.fetch.wait.max.ms=500', 'FetchRequest protocol'] }
  },
];

export default function KafkaBrokerStorageDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected && n.detail) ?? null;

  const clickableNodes = NODES.filter(n => n.detail !== null);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .broker-storage-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Broker — Storage Engine Internals</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click a component to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="broker-storage-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* SVG Canvas */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 660 390" style={{ width: '100%', height: 'auto' }}>
              {/* Broker container border */}
              <rect x="20" y="12" width="620" height="370" rx="10" fill="rgba(56,189,248,0.04)" stroke="rgba(56,189,248,0.25)" strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="330" y="30" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="600" opacity="0.7">KAFKA BROKER NODE — Log Storage Layer</text>

              {/* Partition directories */}
              {[
                { label: '/data/orders-0/', x: 40, y: 48, w: 185, h: 140, color: '#34d399', id: 'log0' },
                { label: '/data/orders-1/', x: 240, y: 48, w: 185, h: 140, color: '#a78bfa', id: 'log1' },
                { label: '/data/orders-2/', x: 440, y: 48, w: 170, h: 140, color: '#fbbf24', id: 'log2' },
              ].map(part => {
                const isActive = selected === part.id;
                return (
                  <g key={part.id} onClick={() => setSelected(selected === part.id ? null : part.id)} style={{ cursor: 'pointer' }}>
                    <rect x={part.x} y={part.y} width={part.w} height={part.h} rx="7"
                      fill={isActive ? `${part.color}18` : `${part.color}0a`}
                      stroke={part.color} strokeWidth={isActive ? 2 : 1.2}
                      opacity={selected && !isActive ? 0.3 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    <text x={part.x + part.w / 2} y={part.y + 16} textAnchor="middle" fill={part.color} fontSize="9.5" fontWeight="700">{part.label}</text>

                    {/* Segment files */}
                    {['00000000.log', '00000000.index', '00000000.timeindex', '00001048.log (active)'].map((seg, si) => {
                      const segColor = seg.includes('.log') ? part.color : seg.includes('.index') ? '#38bdf8' : '#fbbf24';
                      return (
                        <g key={si}>
                          <rect x={part.x + 8} y={part.y + 24 + si * 25} width={part.w - 16} height="20" rx="3"
                            fill={`${segColor}10`} stroke={`${segColor}30`} strokeWidth="1" />
                          <text x={part.x + 12} y={part.y + 38 + si * 25} fill={segColor} fontSize="8.5">{seg}</text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Segment file detail nodes */}
              {[
                { id: 'dotlog', x: 40, y: 210, w: 88, h: 60, color: '#34d399', label: '.log', sub: 'RecordBatches' },
                { id: 'dotindex', x: 138, y: 210, w: 88, h: 60, color: '#38bdf8', label: '.index', sub: 'Offset → Pos' },
                { id: 'sender', x: 40, y: 288, w: 185, h: 62, color: '#f97316', label: 'Sender Thread', sub: 'NIO non-blocking I/O' },
                { id: 'fetcher', x: 240, y: 288, w: 185, h: 62, color: '#f472b6', label: 'ReplicaFetcher Thread', sub: 'FetchRequest → follower' },
              ].map(node => {
                const isActive = selected === node.id;
                return (
                  <g key={node.id} onClick={() => setSelected(selected === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="7"
                      fill={isActive ? `${node.color}25` : `${node.color}10`}
                      stroke={node.color} strokeWidth={isActive ? 2 : 1.2}
                      opacity={selected && !isActive ? 0.25 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    <text x={node.x + node.w / 2} y={node.y + 23} textAnchor="middle" fill={node.color} fontSize="11" fontWeight="700">{node.label}</text>
                    <text x={node.x + node.w / 2} y={node.y + 39} textAnchor="middle" fill={node.color} fontSize="9" opacity="0.75">{node.sub}</text>
                  </g>
                );
              })}

              {/* Arrows from sender/fetcher to partitions */}
              <line x1="132" y1="285" x2="132" y2="195" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5" />
              <text x="145" y="248" fill="#f97316" fontSize="8.5" opacity="0.7">produce write</text>
              <line x1="332" y1="285" x2="332" y2="195" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5" />
              <text x="345" y="248" fill="#f472b6" fontSize="8.5" opacity="0.7">replica fetch</text>
            </svg>
          </div>

          {/* Detail panel */}
          <div className={`interactive-diagram-details-card ${selNode ? 'details-green' : 'details-gray'}`}
            style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color ?? '#34d399', marginBottom: '10px' }}>{selNode.detail!.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {selNode.detail!.body}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selNode.detail!.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${selNode.color}18`, color: selNode.color ?? '#34d399', border: `1px solid ${selNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                </svg>
                <div>Click a component to inspect internals</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}