import React, { useState } from 'react';

type ReShardingApproach = 'dual_write' | 'consistent_hash' | 'range_split' | 'changefeed_cdc';

interface MigrationPhase {
  step: number;
  title: string;
  description: string;
  readTraffic: string;
  writeTraffic: string;
  statusColor: string;
}

export default function ReshardingStrategiesDiagram(): React.JSX.Element {
  const [activeApproach, setActiveApproach] = useState<ReShardingApproach>('dual_write');
  const [dualWritePhase, setDualWritePhase] = useState<number>(2);
  const [simulatedShards, setSimulatedShards] = useState<number>(4);

  const dualWritePhases: MigrationPhase[] = [
    {
      step: 1,
      title: 'Phase 1: Dual-Write & Historical Backfill',
      description: 'App writes to Old Shards (primary) and asynchronously queues/replicates writes to New Shards. Offline bulk backfill copies historical records.',
      readTraffic: '100% to Old Shards',
      writeTraffic: 'Dual-Write (Old Shards primary, New Shards shadow)',
      statusColor: '#38bdf8',
    },
    {
      step: 2,
      title: 'Phase 2: Continuous Catch-Up & Shadow Reads',
      description: 'Backfill complete. Real-time CDC or queue processes catch-up lag. Shadow reads are sent to New Shards to compare results and verify data parity.',
      readTraffic: '100% Old Shards + Shadow Verification on New',
      writeTraffic: 'Dual-Write active (lag < 10ms)',
      statusColor: '#fbbf24',
    },
    {
      step: 3,
      title: 'Phase 3: Flip Reads to New Shards',
      description: 'Parity verified at 99.999%. Read traffic flips to New Shards. Writes continue dual-writing to both to preserve instant rollback safety.',
      readTraffic: '100% to New Shards (Target)',
      writeTraffic: 'Dual-Write (Both New and Old active)',
      statusColor: '#a78bfa',
    },
    {
      step: 4,
      title: 'Phase 4: Cutoff Writes & Decommission Old Shards',
      description: 'Writes flip solely to New Shards. Old Shards are placed into read-only archive mode, snapshots taken, and legacy hardware decommissioned.',
      readTraffic: '100% to New Shards',
      writeTraffic: '100% to New Shards (Old Shards Decommissioned)',
      statusColor: '#34d399',
    },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="m14 12 3 3 5-5" />
        </svg>
        <span style={{ color: '#38bdf8', fontWeight: 700, letterSpacing: '0.02em' }}>
          Zero-Downtime Re-Sharding Engine & Approaches
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '9999px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#7dd3fc',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontWeight: 600,
          }}
        >
          Dynamic Scale Telemetry
        </span>
      </div>

      {/* Strategy Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'dual_write', label: '1. Dual-Write 4-Phase Migration' },
          { id: 'consistent_hash', label: '2. Consistent Hash Virtual Node Migration' },
          { id: 'range_split', label: '3. Range-Based Dynamic Splits (Cockroach/TiDB)' },
          { id: 'changefeed_cdc', label: '4. CDC Streaming Engine (Debezium/Kafka)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveApproach(tab.id as ReShardingApproach)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: activeApproach === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeApproach === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeApproach === tab.id ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '18px' }}>
        {/* TAB 1: DUAL WRITE 4-PHASE MIGRATION */}
        {activeApproach === 'dual_write' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '15px' }}>
                  The 4-Phase Dual-Write Re-Sharding Pattern
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Standard battle-tested pattern used by Uber, Slack, and Stripe to transition from N shards to M shards with zero read/write downtime.
                </p>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {dualWritePhases.map((phase) => (
                <button
                  key={phase.step}
                  onClick={() => setDualWritePhase(phase.step)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: dualWritePhase === phase.step ? `1px solid ${phase.statusColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: dualWritePhase === phase.step ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: phase.statusColor, fontWeight: 700, marginBottom: '2px' }}>
                    STEP {phase.step}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {phase.title.split(': ')[1]}
                  </div>
                </button>
              ))}
            </div>

            {/* Visual Flow Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ minHeight: '260px' }}>
              <svg width="100%" height="260" viewBox="0 0 740 260">
                <defs>
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
                  </marker>
                </defs>

                {/* Application Layer Node */}
                <g transform="translate(30, 95)">
                  <rect x="0" y="0" width="140" height="70" rx="8" fill="#131929" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="70" y="28" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">App Service</text>
                  <text x="70" y="46" fill="#e2e8f0" fontSize="10" textAnchor="middle">Sharding Router</text>
                  <text x="70" y="58" fill="#64748b" fontSize="9" textAnchor="middle">Feature Flag Controlled</text>
                </g>

                {/* Old Shards (Source) */}
                <g transform="translate(480, 25)">
                  <rect
                    x="0"
                    y="0"
                    width="220"
                    height="85"
                    rx="8"
                    fill="#0f172a"
                    stroke={dualWritePhase <= 2 ? '#38bdf8' : dualWritePhase === 3 ? '#fbbf24' : '#64748b'}
                    strokeWidth="1.5"
                  />
                  <text x="110" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">
                    Old Cluster (4 Shards)
                  </text>
                  <text x="110" y="44" fill={dualWritePhase === 4 ? '#ef4444' : '#38bdf8'} fontSize="11" textAnchor="middle">
                    {dualWritePhase === 4 ? 'DECOMMISSIONED / READ-ONLY' : 'Primary Source (N=4)'}
                  </text>
                  <text x="110" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Hash: hash(key) % 4
                  </text>
                </g>

                {/* New Shards (Target) */}
                <g transform="translate(480, 150)">
                  <rect
                    x="0"
                    y="0"
                    width="220"
                    height="85"
                    rx="8"
                    fill="#0f172a"
                    stroke={dualWritePhase >= 3 ? '#34d399' : '#a78bfa'}
                    strokeWidth="1.5"
                  />
                  <text x="110" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">
                    New Cluster (16 Shards)
                  </text>
                  <text x="110" y="44" fill={dualWritePhase >= 3 ? '#34d399' : '#a78bfa'} fontSize="11" textAnchor="middle">
                    {dualWritePhase >= 3 ? 'Active Primary (M=16)' : 'Shadow Target (M=16)'}
                  </text>
                  <text x="110" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Hash: hash(key) % 16
                  </text>
                </g>

                {/* Paths based on phase */}
                {/* To Old Shards */}
                <path
                  d="M 170 115 C 300 115, 330 65, 480 65"
                  fill="none"
                  stroke={dualWritePhase <= 3 ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  strokeDasharray={dualWritePhase <= 3 ? '4 4' : 'none'}
                  markerEnd="url(#arrow-blue)"
                  className={dualWritePhase <= 3 ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* To New Shards */}
                <path
                  d="M 170 145 C 300 145, 330 195, 480 195"
                  fill="none"
                  stroke={dualWritePhase >= 1 ? '#34d399' : '#64748b'}
                  strokeWidth="2"
                  strokeDasharray={dualWritePhase >= 1 ? '4 4' : 'none'}
                  markerEnd="url(#arrow-green)"
                  className={dualWritePhase >= 1 ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Backfill conduit between clusters */}
                {dualWritePhase <= 2 && (
                  <g>
                    <path
                      d="M 590 110 L 590 150"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      markerEnd="url(#arrow-yellow)"
                      className="interactive-diagram-flowing-path"
                    />
                    <rect x="525" y="118" width="130" height="22" rx="4" fill="#1e1b18" stroke="#fbbf24" strokeWidth="1" />
                    <text x="590" y="133" fill="#fbbf24" fontSize="9" fontWeight="600" textAnchor="middle">
                      Bulk Backfill + CDC Lag
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Selected Phase Detail Panel */}
            <div
              style={{
                marginTop: '14px',
                background: '#0c0e17',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '3px 8px', borderRadius: '4px', background: `${dualWritePhases[dualWritePhase - 1].statusColor}25`, color: dualWritePhases[dualWritePhase - 1].statusColor, fontSize: '11px', fontWeight: 700 }}>
                  Active Execution
                </span>
                <strong style={{ color: '#ffffff', fontSize: '14px' }}>
                  {dualWritePhases[dualWritePhase - 1].title}
                </strong>
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                {dualWritePhases[dualWritePhase - 1].description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#131929', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Read Traffic Routing:</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>{dualWritePhases[dualWritePhase - 1].readTraffic}</div>
                </div>
                <div style={{ background: '#131929', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Write Traffic Routing:</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#34d399' }}>{dualWritePhases[dualWritePhase - 1].writeTraffic}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONSISTENT HASH VIRTUAL NODE MIGRATION */}
        {activeApproach === 'consistent_hash' && (
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>
              Consistent Hashing & Virtual Nodes (Karger's Algorithm)
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              How consistent hashing limits data migration to exactly $K / N$ keys when adding an $(N+1)$-th node, avoiding the massive $100\%$ key reshuffling of naive modulo hashing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#0c0e17', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: '#ef4444', fontSize: '13px' }}>Naive Modulo Sharding: hash(key) % N</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 12px 0' }}>
                  When scaling from 3 shards to 4 shards, almost every existing key changes destination:
                </p>
                <div style={{ background: '#131929', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0', lineHeight: '1.6' }}>
                  <code>key 1: hash 10 % 3 = 1  ──▶  10 % 4 = 2 (MOVED!)</code><br />
                  <code>key 2: hash 11 % 3 = 2  ──▶  11 % 4 = 3 (MOVED!)</code><br />
                  <code>key 3: hash 12 % 3 = 0  ──▶  12 % 4 = 0 (Kept)</code><br />
                  <code>key 4: hash 13 % 3 = 1  ──▶  13 % 4 = 1 (Kept)</code><br />
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>Total Re-Shuffled Data: ~75% of entire cluster!</span>
                </div>
              </div>

              <div style={{ background: '#0c0e17', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: '#34d399', fontSize: '13px' }}>Consistent Hashing: Hash Ring with Virtual Nodes</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 12px 0' }}>
                  Nodes and keys mapped onto a continuous $[0, 2^{32}-1]$ integer ring:
                </p>
                <div style={{ background: '#131929', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0', lineHeight: '1.6' }}>
                  <code>Keys mapped clockwise to nearest node token.</code><br />
                  <code>Adding Node D only steals keys between Node C and D.</code><br />
                  <code>All other nodes (A and B) retain 100% of their keys intact!</code><br />
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Total Re-Shuffled Data: exactly 1/N = 25%!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RANGE SPLIT DYNAMIC */}
        {activeApproach === 'range_split' && (
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>
              Dynamic Autonomous Range Splits (CockroachDB & TiDB)
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              How modern distributed SQL engines eliminate manual resharding entirely by continuously dividing 64 MB / 96 MB ranges:
            </p>

            <div style={{ background: '#0c0e17', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: '#131929', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>1. Size Limit Trigger</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    Range Leaseholder monitors Pebble / RocksDB SSTable size. When range exceeds 64 MB threshold, split command is queued.
                  </p>
                </div>
                <div style={{ background: '#131929', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700 }}>2. Midpoint Key Selection</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    Engine selects median split key. Submits a Raft split proposal: <code>[A-M) and [M-Z)</code>.
                  </p>
                </div>
                <div style={{ background: '#131929', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 700 }}>3. Raft Log Update</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    Split commits via Raft quorum. Meta2 range descriptor directory updates. Second range transfers to another node asynchronously.
                  </p>
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#7dd3fc', fontSize: '12px' }}>
                💡 <strong>Architectural Advantage</strong>: Zero human intervention. No hash tables, no dual-writing, no manual data re-migration scripts. The cluster scales transparently as data grows from 10 GB to 100 TB.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CDC STREAMING */}
        {activeApproach === 'changefeed_cdc' && (
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>
              Change Data Capture (CDC) Continuous Streaming Migration
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              Using Kafka, Debezium, or database transaction logs (MySQL binlog, PostgreSQL WAL) to feed target shards asynchronously.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#0c0e17', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '13px' }}>Under-the-Hood Pipeline</strong>
                <ol style={{ paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: '8px 0 0 0' }}>
                  <li>Debezium tail-reads MySQL binlog / Postgres replication slot.</li>
                  <li>Publishes ordered mutation events (INSERT, UPDATE, DELETE) to Kafka topic partitioned by the <strong>NEW shard key</strong>.</li>
                  <li>Kafka Consumer group writes concurrently into the new shard cluster.</li>
                  <li>App monitors consumer lag metric: when <code>lag == 0</code>, flip traffic.</li>
                </ol>
              </div>

              <div style={{ background: '#0c0e17', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: '#f87171', fontSize: '13px' }}>Production Pitfalls & Mitigations</strong>
                <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: '8px 0 0 0' }}>
                  <li><strong>Out-of-Order Delivery</strong>: Partitioning Kafka topics by the target shard key ensures per-key causal order.</li>
                  <li><strong>WAL Bloat on Source</strong>: A slow CDC consumer holds the replication slot open, preventing WAL truncation and exhausting primary disk space!</li>
                  <li><strong>Schema Drift</strong>: Altering table schemas during a long CDC migration can break deserialization consumers.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
