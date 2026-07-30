import React, { useState } from 'react';

const BOTTLENECKS = [
  {
    id: 'disk',
    label: 'Disk I/O Bound',
    color: '#f87171',
    x: 20, y: 130, w: 110, h: 50,
    metrics: 'fsync latency > 5ms, iostat util % > 80%, WAF > 10x',
    solutions: [
      'Set synchronous_commit = off for non-financial transactions',
      'Migrate database tables/WAL storage to high-speed NVMe SSDs',
      'Change database storage engine to LSM-Tree (e.g. Cassandra, RocksDB)',
      'Tune OS filesystem flush limits and increase checkpoint timeouts'
    ]
  },
  {
    id: 'cpu',
    label: 'CPU Bound',
    color: '#a78bfa',
    x: 150, y: 130, w: 110, h: 50,
    metrics: 'High CPU core usage (100%), JVM GC pauses > 100ms, high serialization time',
    solutions: [
      'Switch message serialization from JSON to Protobuf, Avro, or Kryo',
      'Optimize JVM GC tuning (G1GC / ZGC) to minimize stop-the-world pauses',
      'Reduce object instantiation rates in write hot-paths',
      'Scale CPU horizontally by sharding writes'
    ]
  },
  {
    id: 'lock',
    label: 'Lock Contention',
    color: '#f472b6',
    x: 280, y: 130, w: 110, h: 50,
    metrics: 'pg_locks count > 1000, transaction lock wait times > 10ms',
    solutions: [
      'Implement MVCC and Optimistic Locking (@Version in JPA)',
      'Shrink transactional scopes to avoid holding locks over network I/O calls',
      'Partition hot rows to distribute updates across multiple rows',
      'Switch update-in-place operations to append-only writes (Ledger pattern)'
    ]
  },
  {
    id: 'network',
    label: 'Network Bound',
    color: '#38bdf8',
    x: 410, y: 130, w: 110, h: 50,
    metrics: 'High socket read/write times, packet drops, TCP retransmissions',
    solutions: [
      'Co-locate application instances and database clusters in the same availability zone',
      'Batch writes into single bulk INSERT / COPY streams instead of individual transactions',
      'Enable payload compression (snappy / lz4 / gzip) on drivers',
      'Ensure connection pool pre-warms socket channels'
    ]
  },
  {
    id: 'conn',
    label: 'Connection Exhaust',
    color: '#f97316',
    x: 540, y: 130, w: 110, h: 50,
    metrics: 'HikariCP pool.Wait metric > 50ms, active connections == max-pool-size',
    solutions: [
      'Tune HikariCP max-pool-size using the sizing formula',
      'Insert connection proxies (e.g. PgBouncer) in front of the database',
      'Transition web threads to asynchronous non-blocking R2DBC drivers',
      'Ensure connection leaks are diagnosed with Hikari leak-detection-threshold'
    ]
  }
];

export default function WriteBottleneckDiagram(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = BOTTLENECKS.find(b => b.id === selectedId) || null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Write Bottleneck Diagnosis</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 210" className="interactive-diagram-svg">
          <defs>
            {/* Dynamic arrow markers based on colors to prevent grey mismatch */}
            {BOTTLENECKS.map(b => (
              <marker key={`arr-${b.id}`} id={`arr-${b.id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={b.color} />
              </marker>
            ))}
          </defs>

          {/* Root Decision Node */}
          <g>
            <rect x="250" y="15" width="180" height="40" rx="8" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" strokeWidth="2" />
            <text x="340" y="39" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="800">Identify Write Bottleneck</text>
          </g>

          {/* Connectors and Bottleneck Nodes */}
          {BOTTLENECKS.map(b => {
            const pathId = `path-${b.id}`;
            const targetX = b.x + b.w / 2;
            // Pad coordinates so that line doesn't intersect block
            const pathD = `M 340 55 C 340 90, ${targetX} 90, ${targetX} 123`;
            const isActive = selectedId === b.id;

            return (
              <g key={b.id}>
                {/* Connection Path */}
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke={isActive ? b.color : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  markerEnd={`url(#arr-${b.id})`}
                  className={isActive ? 'interactive-diagram-flowing-path' : ''}
                  style={{ transition: 'stroke-width 0.2s, stroke 0.2s' }}
                />

                {/* Particle Flow when selected */}
                {isActive && (
                  <circle r="3" fill={b.color} className="interactive-diagram-flowing-dot">
                    <animateMotion dur="1s" repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}

                {/* Node Box */}
                <g onClick={() => setSelectedId(selectedId === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="6"
                    fill={isActive ? `${b.color}20` : 'rgba(255,255,255,0.03)'}
                    stroke={isActive ? b.color : 'rgba(255,255,255,0.15)'}
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.2s' }}
                  />
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2 + 4}
                    textAnchor="middle"
                    fill={isActive ? b.color : 'var(--ifm-color-content)'}
                    fontSize="10"
                    fontWeight="700"
                  >
                    {b.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Details Card */}
      {selected ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: selected.color }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>
              🔍 {selected.label} Profile
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>Diagnostic Indicators</span>
              <p style={{ margin: '2px 0 0 0', fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24' }}>
                {selected.metrics}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#34d399', fontWeight: 600 }}>Resolutions</span>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>
                {selected.solutions.map((sol, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{sol}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
          Select a bottleneck node in the tree above to diagnose metrics and resolutions
        </div>
      )}
    </div>
  );
}
