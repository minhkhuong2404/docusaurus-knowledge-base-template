import React, { useState } from 'react';

type ArchitectureLayer = 'sql' | 'transaction' | 'distribution' | 'replication' | 'storage';
type TransactionFlow = 'write_intent' | 'parallel_commit' | 'read_uncertainty' | 'leaseholder_routing';

export default function CockroachDbArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'stack' | 'hlc' | 'transaction_flows' | 'failure_resilience'>('stack');
  const [selectedLayer, setSelectedLayer] = useState<ArchitectureLayer>('transaction');
  const [selectedFlow, setSelectedFlow] = useState<TransactionFlow>('write_intent');
  const [animStep, setAnimStep] = useState<number>(0);

  const layersInfo: Record<ArchitectureLayer, { title: string; color: string; subtitle: string; responsibilities: string[]; internals: string }> = {
    sql: {
      title: 'Layer 1: SQL Layer (Client Gateway & Optimization)',
      color: '#38bdf8',
      subtitle: 'PostgreSQL-wire-compatible parser, Cost-Based Optimizer (CBO), and vectorized distributed execution.',
      responsibilities: [
        'Speaks native PostgreSQL wire protocol (clients connect with standard pg drivers)',
        'Translates declarative relational SQL into low-level Key-Value span operations (Get, Put, Scan)',
        'Distributed SQL Execution Engine (DistSQL): pushes filtering & aggregations down to Range nodes',
        'Symmetric node architecture: ANY cluster node can receive incoming SQL queries as a gateway coordinator'
      ],
      internals: 'Every node in a CockroachDB cluster runs the exact same binary and contains the SQL execution engine. The SQL coordinator compiles the query into a logical plan, optimizes it using a Cost-Based Optimizer (CBO), and delegates execution to downstream KV coordinators.'
    },
    transaction: {
      title: 'Layer 2: Transaction Layer (Distributed ACID & Concurrency)',
      color: '#fbbf24',
      subtitle: 'Hybrid Logical Clocks (HLC), Write Intents, Transaction Records, and Strict Serializable Isolation.',
      responsibilities: [
        'Enforces full ACID transactions with default SERIALIZABLE isolation (strongest SQL standard)',
        'Assigns Hybrid Logical Clock (HLC) timestamps to establish strict causal ordering without atomic clocks',
        'Manages Write Intents (in-memory locks and provisional MVCC values pointing to Transaction Records)',
        'Optimizes commits using Parallel Commits (reducing 2PC multi-region roundtrips from 2 to 1)'
      ],
      internals: 'CockroachDB creates an atomic Transaction Record stored in a range. When mutating keys across multiple ranges, it writes provisional Write Intents. Concurrent readers inspect the transaction record state to evaluate intent visibility.'
    },
    distribution: {
      title: 'Layer 3: Distribution Layer (Global Monolithic Keyspace)',
      color: '#34d399',
      subtitle: 'Continuous monolithic ordered keyspace partitioned into 64 MB Ranges.',
      responsibilities: [
        'Treats the entire database as a single sorted, continuous byte array keyspace (from []byte to []byte)',
        'Partitions the keyspace into contiguous 64 MB chunks called Ranges',
        'Maintains a two-level Range Index (similar to a B-Tree) mapping user keys to range replicas',
        'Splits and merges ranges dynamically: automatically divides ranges when data grows past 64 MB'
      ],
      internals: 'Range 1 (Meta1) locates ranges in the Meta2 table. Meta2 locates user ranges. Clients and nodes cache range descriptor locations locally, achieving O(1) direct routing on amortized lookups.'
    },
    replication: {
      title: 'Layer 4: Replication Layer (Multi-Raft & Leaseholders)',
      color: '#a78bfa',
      subtitle: 'Per-Range Multi-Raft consensus groups, Leaseholders, and automated rebalancing.',
      responsibilities: [
        'Multi-Raft Consensus: Each 64 MB Range is an independent Raft consensus group (replicated 3x or 5x)',
        'Leaseholder Node: A single designated replica serving all reads and coordinating writes',
        'Zero-overhead linearizable reads: Leaseholder answers reads locally without a Raft quorum roundtrip',
        'Failure detection and healing: Replicas re-replicate automatically if a node drops offline for 5 minutes'
      ],
      internals: 'A single cluster with 100,000 ranges runs 100,000 logical Raft state machines. Multi-Raft aggregates heartbeats, network sockets, and goroutines across shared physical nodes to prevent resource exhaustion.'
    },
    storage: {
      title: 'Layer 5: Storage Layer (Pebble LSM-Tree Engine)',
      color: '#f87171',
      subtitle: 'High-performance Go-native Log-Structured Merge-tree (LSM) key-value engine.',
      responsibilities: [
        'Pebble storage engine: Pure Go rewrite of RocksDB/LevelDB specifically tuned for CockroachDB',
        'Eliminates Cgo bridge latency and C++ garbage collection impedance mismatches',
        'Appends updates sequentially to Write-Ahead Log (WAL) and in-memory MemTables before SST flush',
        'MVCC engine: Retains historical version timestamps for lock-free point-in-time reads (AS OF SYSTEM TIME)'
      ],
      internals: 'Pebble organizes physical disk writes into multi-level SSTables (SSTs) with aggressive background compaction. Keys are physically encoded as <Key, HLC_Timestamp, Value>.'
    }
  };

  const currentLayer = layersInfo[selectedLayer];

  const flowDetails: Record<TransactionFlow, { title: string; desc: string; steps: { step: number; actor: string; action: string; note: string }[] }> = {
    write_intent: {
      title: '1. Write Intents & Distributed 2PC Execution',
      desc: 'How CockroachDB writes provisional values and locks across multiple independent 64 MB ranges.',
      steps: [
        {
          step: 1,
          actor: 'SQL Coordinator',
          action: 'Create Transaction Record with status = "PENDING"',
          note: 'The coordinator chooses a home range for the transaction record and writes a PENDING state record via Raft consensus.'
        },
        {
          step: 2,
          actor: 'Leaseholders of Target Ranges',
          action: 'Write provisional "Write Intents" at HLC timestamp t_tx',
          note: 'Write intents act as both MVCC provisional data and in-line distributed row locks. Each intent contains a pointer pointing back to the transaction record.'
        },
        {
          step: 3,
          actor: 'Transaction Record Leader',
          action: 'Flip Transaction Record status = "COMMITTED"',
          note: 'The moment the transaction record commits to disk via Raft quorum, the transaction is atomically committed across the entire universe!'
        },
        {
          step: 4,
          actor: 'Asynchronous Intent Resolution',
          action: 'Resolve Write Intents into permanent MVCC records',
          note: 'Background workers convert intents into clean values and remove intent locks. If a concurrent reader encounters an un-resolved intent, it checks the transaction record directly.'
        }
      ]
    },
    parallel_commit: {
      title: '2. Parallel Commits: Multi-Region Latency Halving',
      desc: 'Reduces distributed transaction commit latency from two cross-region roundtrips down to one.',
      steps: [
        {
          step: 1,
          actor: 'SQL Coordinator',
          action: 'Pipeline write intents to Range Leaseholders across continents',
          note: 'Instead of waiting sequentially, all write intents are dispatched asynchronously in parallel.'
        },
        {
          step: 2,
          actor: 'Transaction Coordinator',
          action: 'Write Transaction Record in STAGING state simultaneously',
          note: 'The coordinator writes the transaction record as STAGING with an inlined manifest of all in-flight intent keys.'
        },
        {
          step: 3,
          actor: 'Raft Quorum Overlap',
          action: 'Wait for overlapping quorum ACKs (Single Roundtrip)',
          note: 'If both the STAGING record and the write intents achieve quorum ACKs concurrently, the transaction is implicitly committed in 1 roundtrip!'
        },
        {
          step: 4,
          actor: 'Client Acknowledgment',
          action: 'Return SUCCESS to client immediately',
          note: 'The client receives commit confirmation without waiting for an explicit second phase, dramatically speeding up multi-region clusters.'
        }
      ]
    },
    read_uncertainty: {
      title: '3. Read Uncertainty & Clock Skew Restart',
      desc: 'How CockroachDB guarantees Strict Serializability without atomic GPS clocks.',
      steps: [
        {
          step: 1,
          actor: 'Client Transaction',
          action: 'Start transaction with read timestamp t_read',
          note: 'The coordinator establishes an uncertainty interval: [t_read, t_read + max_offset] (default max_offset = 250ms or 500ms).'
        },
        {
          step: 2,
          actor: 'Reader at Remote Node',
          action: 'Encounter a record with timestamp t_val in uncertainty window',
          note: 't_read < t_val <= t_read + max_offset. The database cannot tell if t_val was written before or after t_read in physical reality.'
        },
        {
          step: 3,
          actor: 'Transaction Engine',
          action: 'Trigger Read Uncertainty Restart',
          note: 'Rather than allowing a causal violation or stale read, the transaction aborts its current read phase and bumps its read timestamp above t_val.'
        },
        {
          step: 4,
          actor: 'Automatic Transparent Retry',
          action: 'Rerun transaction statements with higher timestamp',
          note: 'CockroachDB automatically replays query statements internally or returns SQLSTATE 40001 (serialization_failure) for client-side retry.'
        }
      ]
    },
    leaseholder_routing: {
      title: '4. Leaseholder Routing & Zero-Wait Consensus Reads',
      desc: 'Why reading from CockroachDB does not incur Raft consensus network roundtrips.',
      steps: [
        {
          step: 1,
          actor: 'Client Application',
          action: 'Execute SELECT * FROM accounts WHERE id = 42',
          note: 'Client query lands on Gateway Node 1 via standard round-robin connection pool.'
        },
        {
          step: 2,
          actor: 'Gateway Node 1',
          action: 'Inspect Range Cache to find Leaseholder for Account 42',
          note: 'The key falls into Range 104. Gateway identifies that Node 3 currently holds the active Range Lease.'
        },
        {
          step: 3,
          actor: 'Node 3 (Leaseholder)',
          action: 'Serve read directly from local Pebble storage (0 Raft overhead)',
          note: 'Because the Leaseholder possesses an exclusive time-bounded lease, no other replica can serve writes. It can safely return the latest MVCC snapshot immediately!'
        },
        {
          step: 4,
          actor: 'Gateway Node 1',
          action: 'Stream result back to client in sub-millisecond timeframe',
          note: 'Achieves linearizable read consistency with the throughput and latency of a local single-node read.'
        }
      ]
    }
  };

  const currentFlow = flowDetails[selectedFlow];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .crdb-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          CockroachDB Internal Architecture: Multi-Raft, HLC & Distributed ACID Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Main Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'stack', label: '1. 5-Layer Architectural Stack', icon: '🏛️' },
            { id: 'hlc', label: '2. Hybrid Logical Clocks (HLC)', icon: '⏱️' },
            { id: 'transaction_flows', label: '3. Transaction Protocol Flows', icon: '⚡' },
            { id: 'failure_resilience', label: '4. Multi-Raft & Leaseholder Resilience', icon: '🛡️' }
          ].map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  boxShadow: isActive ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: 5-LAYER STACK */}
        {activeTab === 'stack' && (
          <div className="crdb-split" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '16px', alignItems: 'start' }}>
            {/* Left Column: Interactive Layer Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                System Architecture Layers (Click to inspect)
              </div>
              {(['sql', 'transaction', 'distribution', 'replication', 'storage'] as ArchitectureLayer[]).map(layerKey => {
                const info = layersInfo[layerKey];
                const isSelected = selectedLayer === layerKey;
                return (
                  <button
                    key={layerKey}
                    onClick={() => setSelectedLayer(layerKey)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSelected ? `${info.color}15` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSelected ? `0 0 0 1.5px ${info.color}` : '0 0 0 1px rgba(255,255,255,0.06)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{info.title.split(':')[0]}</span>
                      <span style={{ fontSize: '10px', color: info.color, fontWeight: 800 }}>{info.title.split(':')[1]}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>{info.subtitle}</div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Layer Inspector Card */}
            <div style={{ background: 'rgba(12, 14, 23, 0.9)', border: `1px solid ${currentLayer.color}40`, borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: currentLayer.color }}>{currentLayer.title}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px', lineHeight: '1.5' }}>
                {currentLayer.subtitle}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Core Responsibilities
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {currentLayer.responsibilities.map((resp, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                      <span style={{ color: currentLayer.color }}>▹</span>
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Engine Physics & Internal Mechanism
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                  {currentLayer.internals}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HYBRID LOGICAL CLOCKS (HLC) */}
        {activeTab === 'hlc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '14px', borderRadius: '8px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
              <strong style={{ color: '#38bdf8' }}>Why Google Spanner Uses TrueTime but CockroachDB Uses HLC:</strong> Google Spanner requires proprietary hardware atomic clocks and GPS receivers in every datacenter to tightly bound clock uncertainty (under 7ms). CockroachDB was engineered to run on <em>any</em> commodity cloud (AWS, Azure, bare metal) where NTP clock drift can be 100ms to 250ms. It solves this using <strong>Hybrid Logical Clocks (HLC)</strong>.
            </div>

            <div className="crdb-split" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              {/* Card 1: HLC Mathematical Structure */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '10px' }}>
                  HLC Tuple: (Physical Time <em>l</em>, Logical Counter <em>c</em>)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '12px' }}>
                  Every HLC timestamp consists of two components:
                  <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                    <li><strong>l.j (Physical Component)</strong>: The maximum physical time observed so far by node j or received from other nodes.</li>
                    <li><strong>c.j (Logical Component)</strong>: An integer counter used to order events that occur within the same physical tick.</li>
                  </ul>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#34d399', lineHeight: '1.5' }}>
                  <div>// On Message Receive (l_msg, c_msg):</div>
                  <div>l_new = Math.max(l_curr, physical_now, l_msg)</div>
                  <div>if (l_new == l_curr == l_msg) c_new = Math.max(c_curr, c_msg) + 1</div>
                  <div>else if (l_new == l_curr) c_new = c_curr + 1</div>
                  <div>else if (l_new == l_msg) c_new = c_msg + 1</div>
                  <div>else c_new = 0</div>
                </div>
              </div>

              {/* Card 2: Causality Invariant */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '10px' }}>
                  Guaranteed Causality Properties
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #34d399' }}>
                    <strong>1. Causal Ordering Preservation:</strong> If event e1 happens before e2, then HLC(e1) &lt; HLC(e2) is guaranteed.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #fbbf24' }}>
                    <strong>2. Bounded Physical Drift:</strong> Physical drift is bounded by max_offset (default 500ms).
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #f87171' }}>
                    <strong>3. Node Self-Eviction on Drift:</strong> If a node&apos;s physical clock drifts beyond <code>--max-offset</code>, the node crashes itself to protect serializability!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTION FLOWS */}
        {activeTab === 'transaction_flows' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Flow Selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'write_intent', label: '1. Write Intents & 2PC', color: '#fbbf24' },
                { id: 'parallel_commit', label: '2. Parallel Commits (1-RTT)', color: '#34d399' },
                { id: 'read_uncertainty', label: '3. Read Uncertainty Restarts', color: '#f87171' },
                { id: 'leaseholder_routing', label: '4. Leaseholder Reads', color: '#38bdf8' }
              ].map(f => {
                const isSel = selectedFlow === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlow(f.id as TransactionFlow);
                      setAnimStep(0);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isSel ? `${f.color}20` : 'rgba(255,255,255,0.03)',
                      color: isSel ? f.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: isSel ? `0 0 0 1px ${f.color}` : 'none'
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Flow Header */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>{currentFlow.title}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{currentFlow.desc}</div>
            </div>

            {/* Stepper Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {currentFlow.steps.map((st, idx) => {
                const isSel = animStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnimStep(idx)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      boxShadow: isSel ? '0 0 0 1px #38bdf8' : '0 0 0 1px rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: isSel ? '#38bdf8' : '#64748b' }}>STEP {st.step}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.actor}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Card */}
            {(() => {
              const active = currentFlow.steps[animStep];
              return (
                <div style={{ background: 'rgba(12, 14, 23, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Step {active.step}: {active.actor}</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', color: '#34d399', marginBottom: '10px' }}>
                    {active.action}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                    {active.note}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: FAILURE RESILIENCE */}
        {activeTab === 'failure_resilience' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="crdb-split" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  Automatic Self-Healing & Range Splitting
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                  <p>
                    <strong>Automatic 64 MB Range Split:</strong> When data is inserted into a range and its size surpasses 64 MB, the range executes a Raft split command. A new range is created seamlessly without blocking reads or taking locks.
                  </p>
                  <p>
                    <strong>Node Crash & Recovery:</strong> If a node fails, its Raft groups immediately detect missing heartbeats within ticks (approx 3 seconds). Surviving followers elect a new leader and leaseholder in milliseconds.
                  </p>
                  <p>
                    <strong>Permanent Node Rebalancing:</strong> If a node remains dead for longer than 5 minutes, the cluster considers it permanently lost. Other nodes allocate new replicas to restore 3x replication factor automatically.
                  </p>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                  Survivability vs Traditional Failover
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                  <p>
                    <strong>Why CockroachDB is called "Cockroach":</strong> Like a cockroach surviving disaster, you can literally run <code>kill -9</code> on nodes or sever network cables between datacenters during peak traffic.
                  </p>
                  <p>
                    <strong>Zero Downtime Upgrades:</strong> Upgrades are executed one node at a time (rolling upgrades). Because every node is identical and data is distributed across thousands of Multi-Raft groups, zero queries fail.
                  </p>
                  <p>
                    <strong>No Manual Failover Scripts:</strong> Unlike primary/replica PostgreSQL or MySQL which require Orchestrator/Patroni to promote read replicas and risk split-brain, CockroachDB failovers are purely automated Raft elections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
