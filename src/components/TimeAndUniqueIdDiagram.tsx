import React, { useState } from 'react';

type TabMode = 'clocks' | 'uuidv7' | 'btree';

interface ClockModel {
  id: string;
  name: string;
  type: string;
  skewHandling: string;
  orderingGuarantee: string;
  productionExample: string;
  color: string;
}

const CLOCK_MODELS: ClockModel[] = [
  {
    id: 'physical',
    name: 'Physical NTP / PTP Clocks',
    type: 'Wall-Clock Oscillator',
    skewHandling: 'Periodic NTP sync with leap-second smearing. Subject to millisecond-level clock drift and backward clock jumps.',
    orderingGuarantee: 'Non-monotonic: Can produce negative time jumps (t2 < t1) when NTP syncs backwards.',
    productionExample: 'Standard Linux kernel gettimeofday(), AWS Time Sync Service',
    color: '#f87171',
  },
  {
    id: 'truetime',
    name: 'Google TrueTime (Spanner)',
    type: 'Hardware GPS + Atomic Clocks',
    skewHandling: 'Bounds maximum clock uncertainty to [t.earliest, t.latest] where uncertainty ε ≈ 1-7ms. Commit waits out the uncertainty interval (2ε).',
    orderingGuarantee: 'Strict Linearizability: If Tx2 starts after Tx1 commits in absolute real time, Tx2 gets a higher timestamp.',
    productionExample: 'Google Cloud Spanner, CockroachDB (hybrid version)',
    color: '#34d399',
  },
  {
    id: 'lamport',
    name: 'Lamport Logical Timestamps',
    type: 'Pure Monotonic Scalar Counter',
    skewHandling: 'Completely ignores physical wall time. Each node increments an integer counter; message sends attach counter; receiver updates L = max(L, L_msg) + 1.',
    orderingGuarantee: 'Partial Causal Order: a → b ⇒ L(a) < L(b). Converse is NOT true (equal timestamps do not imply concurrency).',
    productionExample: 'Distributed leader election, distributed mutual exclusion algorithms',
    color: '#fbbf24',
  },
  {
    id: 'vector',
    name: 'Vector Clocks',
    type: 'N-Dimensional Vector of Counters',
    skewHandling: 'Each node maintains vector V of length N. V[i] incremented on local event. Detects true concurrency vs causal dependency.',
    orderingGuarantee: 'Full Causal Order: V(a) < V(b) iff all components ≤ and at least one <. Detects sibling conflicts (forks).',
    productionExample: 'Amazon Dynamo paper, Riak KV sibling resolution, Apache Cassandra (early versions)',
    color: '#a78bfa',
  },
  {
    id: 'hlc',
    name: 'Hybrid Logical Clocks (HLC)',
    type: 'Physical Time + Logical Counter',
    skewHandling: 'Combines physical epoch millisecond with a logical counter. Keeps timestamps close to physical time while strictly preserving causality.',
    orderingGuarantee: 'Causal & Monotonically Increasing: Captures causality without unbounded vector clock bloat ($O(1)$ size).',
    productionExample: 'CockroachDB, MongoDB sharded clusters, YugabyteDB',
    color: '#38bdf8',
  },
];

export default function TimeAndUniqueIdDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('clocks');
  const [selectedClockId, setSelectedClockId] = useState<string>('hlc');

  const selectedClock = CLOCK_MODELS.find((c) => c.id === selectedClockId) || CLOCK_MODELS[4];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .time-id-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

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
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Time, Ordering & Unique ID Generation Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'clocks', label: '⏱️ Clock Spectrum & HLC', color: '#38bdf8' },
            { id: 'uuidv7', label: '🆔 UUIDv7 vs Snowflake vs v4', color: '#34d399' },
            { id: 'btree', label: '🌲 B-Tree Index Fragmentation', color: '#fbbf24' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabMode)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="Time synchronization and distributed ID generation timeline"
        >
          <defs>
            <marker
              id="arrow-cyan-time"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-green-time"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker
              id="arrow-amber-time"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* Flow Line across nodes */}
          <line x1="200" y1="90" x2="310" y2="90" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="200"
            y1="90"
            x2="310"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-cyan-time)"
          />

          <line x1="470" y1="90" x2="570" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="470"
            y1="90"
            x2="570"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-time)"
          />

          <line x1="720" y1="90" x2="790" y2="90" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="720"
            y1="90"
            x2="790"
            y2="90"
            stroke="#fbbf24"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-amber-time)"
          />

          {/* Node 1: Physical Clock / Epoch */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('clocks')}>
            <rect x="30" y="45" width="170" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">1</text>
            <text x="120" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Physical Epoch</text>
            <text x="120" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">48-bit Unix ms</text>
            <text x="120" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">NTP / TrueTime / HLC</text>
          </g>

          {/* Node 2: Sequence & Machine ID */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('uuidv7')}>
            <rect x="310" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="335" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="335" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">2</text>
            <text x="400" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Logical Counter</text>
            <text x="400" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Sub-ms precision</text>
            <text x="400" y="112" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="600">No cross-node locks</text>
          </g>

          {/* Node 3: Time-Ordered Distributed ID */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('uuidv7')}>
            <rect x="570" y="45" width="150" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="595" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="595" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">3</text>
            <text x="655" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">UUIDv7 / Snowflake</text>
            <text x="655" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">K-sortable 128/64b</text>
            <text x="655" y="112" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="600">RFC 9562 Standard</text>
          </g>

          {/* Node 4: Append-Only B-Tree Page Storage */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('btree')}>
            <rect x="790" y="45" width="130" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#a78bfa" strokeWidth="1.5" />
            <circle cx="815" cy="72" r="14" fill="#a78bfa22" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="815" y="77" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="800">4</text>
            <text x="860" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">B-Tree Ingestion</text>
            <text x="860" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Zero Page Splits</text>
            <text x="860" y="112" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="600">Sequential Page Appends</text>
          </g>
        </svg>
      </div>

      {/* Tab 1: Clocks & HLC */}
      {activeTab === 'clocks' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {CLOCK_MODELS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClockId(c.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid ${selectedClock.id === c.id ? c.color : 'rgba(255, 255, 255, 0.1)'}`,
                  background: selectedClock.id === c.id ? `${c.color}22` : 'rgba(255, 255, 255, 0.02)',
                  color: selectedClock.id === c.id ? c.color : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="time-id-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${selectedClock.color}` }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: selectedClock.color, textTransform: 'uppercase' }}>
                {selectedClock.type}
              </span>
              <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
                {selectedClock.name}
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                {selectedClock.skewHandling}
              </p>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                <strong style={{ fontSize: '11.5px', color: selectedClock.color, display: 'block', marginBottom: '2px' }}>
                  Ordering Guarantee:
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                  {selectedClock.orderingGuarantee}
                </span>
              </div>
            </div>

            <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                PRODUCTION ARCHITECTURE
              </span>
              <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
                Why Hybrid Logical Clocks (HLC) Dominate NewSQL
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Google Spanner requires multimillion-dollar GPS/Atomic master clocks in every datacenter to bound uncertainty ($\epsilon$). <strong>CockroachDB and MongoDB cannot assume custom hardware</strong>.
              </p>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                <strong>HLC Formula:</strong> A tuple <code>(l, c)</code> where <code>l</code> is highest physical time observed, and <code>c</code> is an in-memory logical counter. If physical time advances, <code>l = max(l, pt_local)</code> and <code>c = 0</code>. If concurrent, increment <code>c</code>. Combines physical time readability with strict causality!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: UUIDv7 vs Snowflake vs UUIDv4 */}
      {activeTab === 'uuidv7' && (
        <div className="time-id-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              UUIDv7 (RFC 9562 — Standardized May 2024)
            </h4>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#080a12', padding: '10px', borderRadius: '6px', color: '#38bdf8', marginBottom: '10px' }}>
              <div>018f3a2c-49a0-7b2a-89bc-123456789abc</div>
              <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                ├── 48-bit Unix ms ──┤├── 12-bit counter ──┤└── 62-bit entropy ──┘
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: 'var(--ifm-color-content)' }}>128-bit Standard:</strong> Drop-in replacement for random UUIDv4 in all database <code>UUID</code> columns.
              </li>
              <li>
                <strong style={{ color: '#34d399' }}>Time-Sortable (K-Sorted):</strong> Chronologically ordered by millisecond timestamp.
              </li>
              <li>
                <strong style={{ color: '#fbbf24' }}>Zero Coordination:</strong> No Zookeeper, worker IDs, or central generator required.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Native in PostgreSQL 18:</strong> CockroachDB, MySQL 8, and modern ORMs provide first-class support.
              </li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Twitter Snowflake (64-Bit Integer)
            </h4>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#080a12', padding: '10px', borderRadius: '6px', color: '#fbbf24', marginBottom: '10px' }}>
              <div>1789234567890123456 (64-bit signed BIGINT)</div>
              <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                [1b sign] [41b timestamp] [10b worker ID] [12b sequence counter]
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: 'var(--ifm-color-content)' }}>Fits in BIGINT:</strong> Halves index size compared to 128-bit UUID (8 bytes vs 16 bytes).
              </li>
              <li>
                <strong style={{ color: '#f87171' }}>Worker ID Coordination Bottleneck:</strong> Requires central coordination (ZooKeeper or Consul) to assign unique 10-bit machine IDs (max 1,024 workers).
              </li>
              <li>
                <strong style={{ color: '#fbbf24' }}>Clock Skew Vulnerability:</strong> If the server physical clock moves backward by &gt; 5ms, Snowflake must pause or crash to prevent duplicate IDs.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: B-Tree Index Fragmentation */}
      {activeTab === 'btree' && (
        <div className="time-id-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #f87171' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '15px' }}>
              ❌ Random UUIDv4: The B-Tree Fragmentation Trap
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              UUIDv4 generates uniformly distributed 128-bit random numbers. Inserting random keys into a sorted B+ Tree causes catastrophic physical I/O:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Leaf Page Splits:</strong> New keys hit random pages. A full 8KB page must split into two 50% empty pages, doubling table disk storage.</li>
              <li><strong>Buffer Pool Cache Thrashing:</strong> The database must read random pages from disk into memory, evicting frequently queried hot cache lines.</li>
              <li><strong>Write Latency Degradation:</strong> Insert performance plummets by 400% once the table index exceeds available RAM.</li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
              ✅ Time-Ordered UUIDv7: Append-Only Efficiency
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Because the first 48 bits encode the current Unix millisecond timestamp, new records are strictly greater than previous records:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Right-Append Only:</strong> New rows append to the right-most leaf page, reaching ~95% B-Tree page fill factor.</li>
              <li><strong>Hot Page in RAM:</strong> Only the current active leaf page is modified in the Buffer Pool, eliminating random physical disk reads.</li>
              <li><strong>Linear Scalability:</strong> Insert throughput remains flat whether your database has 10,000 or 500,000,000 rows.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
