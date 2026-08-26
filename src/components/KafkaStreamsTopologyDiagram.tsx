import React, { useState } from 'react';

type StreamsTab = 'DSL_DAG' | 'NAMING_TRAP' | 'SUBTOPOLOGY_STORM';

interface StreamsDetails {
  title: string;
  type: 'purple' | 'cyan' | 'red';
  overview: string;
  bullets: string[];
}

const STREAMS_DATA: Record<StreamsTab, StreamsDetails> = {
  DSL_DAG: {
    title: 'Kafka Streams Topology DAG (Directed Acyclic Graph)',
    type: 'purple',
    overview: 'Visualizes the compilation of DSL code into physical processor nodes (Source, Processor, Sink).',
    bullets: [
      'Source Processor: Subscribes to the input topic (e.g. orders) and deserializes key-value records.',
      'Filter Processor: Applies boolean predicates to stream elements, discarding records that do not match.',
      'MapValues Processor: Performs stateless transformations on record values while preserving the partition key.',
      'Sink Processor: Publishes the final transformed stream to output topics (e.g. high-value-orders).'
    ]
  },
  NAMING_TRAP: {
    title: 'The Auto-Generated Naming Shift Trap',
    type: 'cyan',
    overview: 'Explains why explicit node naming is critical for stateful production deployments.',
    bullets: [
      'Stateful operators (aggregations, joins) compile into state stores (e.g. RocksDB) backed by changelog topics.',
      'By default, Kafka Streams auto-generates names sequentially: KSTREAM-SOURCE-0000000000 -> KSTREAM-FILTER-0000000001.',
      'If you insert or reorder a simple filter node, the counter shifts downstream, corrupting local state bindings and changelog topic alignment!'
    ]
  },
  SUBTOPOLOGY_STORM: {
    title: 'Sub-Topology Reordering & Perpetual Rebalance Storm',
    type: 'red',
    overview: 'Demonstrates why changing the order of independent sub-topologies in code breaks rolling deployments and halts all processing.',
    bullets: [
      'Kafka Streams numbers sub-topologies sequentially (0, 1, 2...) based on declaration order in StreamsBuilder.',
      'Task IDs are computed as TaskId(subTopologyId, partitionId) — e.g. Task 0_0.',
      'During a rolling update, a v2 leader assigns Task 0_0 (Payments) to a v1 follower whose local topology expects Task 0_0 to process Orders.',
      'The follower throws TaskAssignmentException and rejoins the group, triggering an endless cluster-wide rebalance loop (0 msg/sec).'
    ]
  }
};

export default function KafkaStreamsTopologyDiagram({ initialTab = 'DSL_DAG' }: { initialTab?: StreamsTab }): React.JSX.Element {
  const [tab, setTab] = useState<StreamsTab>(initialTab);
  const [isShifted, setIsShifted] = useState<boolean>(false);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  const selectedData = STREAMS_DATA[tab];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-topo-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="12" r="3" />
          <line x1="8.59" y1="7.41" x2="15.42" y2="10.59" />
          <line x1="8.59" y1="16.59" x2="15.42" y2="13.41" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Streams Topology: DAG Compilation, Auto-Naming & Sub-Topology Ordering
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTab('DSL_DAG')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: tab === 'DSL_DAG' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: tab === 'DSL_DAG' ? '#c084fc' : 'var(--ifm-color-content-secondary)',
                boxShadow: tab === 'DSL_DAG' ? '0 0 0 1.5px #a855f7' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              1. Topology DAG Flow
            </button>
            <button
              onClick={() => setTab('NAMING_TRAP')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: tab === 'NAMING_TRAP' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: tab === 'NAMING_TRAP' ? '#2dd4bf' : 'var(--ifm-color-content-secondary)',
                boxShadow: tab === 'NAMING_TRAP' ? '0 0 0 1.5px #2dd4bf' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              2. Auto-Naming Shift Trap
            </button>
            <button
              onClick={() => setTab('SUBTOPOLOGY_STORM')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: tab === 'SUBTOPOLOGY_STORM' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: tab === 'SUBTOPOLOGY_STORM' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                boxShadow: tab === 'SUBTOPOLOGY_STORM' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              3. Sub-Topology Reorder Storm
            </button>
          </div>

          {tab === 'NAMING_TRAP' && (
            <button
              onClick={() => setIsShifted(!isShifted)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11.5px',
                background: isShifted ? '#f87171' : '#2dd4bf',
                color: '#090b14',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isShifted ? 'Reset to Default' : '⚡ Simulate Inserting Filter Node'}
            </button>
          )}

          {tab === 'SUBTOPOLOGY_STORM' && (
            <button
              onClick={() => setIsSwapped(!isSwapped)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11.5px',
                background: isSwapped ? '#f87171' : '#38bdf8',
                color: '#090b14',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isSwapped ? 'Reset to Original Order (v1)' : '🔄 Swap Sub-Topology Order in Code (v2)'}
            </button>
          )}
        </div>

        {/* Tab 1: DAG Visual */}
        {tab === 'DSL_DAG' && (
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
            <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
              <defs>
                <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
                </marker>
              </defs>
              <g>
                {/* Input Topic */}
                <rect x="20" y="65" width="85" height="40" rx="4" ry="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" />
                <text x="62" y="89" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>"orders" topic</text>

                {/* Source Processor */}
                <rect x="135" y="60" width="105" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="187" y="85" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Source Processor</text>
                <text x="187" y="98" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 7.5, fill: '#c084fc', textAnchor: 'middle' }}>KSTREAM-SOURCE-000</text>

                {/* Filter Processor */}
                <rect x="270" y="60" width="105" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="322" y="85" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Filter Processor</text>
                <text x="322" y="98" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>amount &gt; 100</text>

                {/* MapValues Processor */}
                <rect x="405" y="60" width="105" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="457" y="85" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>MapValues</text>
                <text x="457" y="98" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Enrich Order</text>

                {/* Sink Processor */}
                <rect x="540" y="60" width="115" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="597" y="85" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Sink Processor</text>
                <text x="597" y="98" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 7.5, fill: '#c084fc', textAnchor: 'middle' }}>"high-value-orders"</text>

                {/* Flows */}
                <path id="path-st-1" d="M 105 85 L 129 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
                <path id="path-st-2" d="M 240 85 L 264 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
                <path id="path-st-3" d="M 375 85 L 399 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
                <path id="path-st-4" d="M 510 85 L 534 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              </g>
            </svg>
          </div>
        )}

        {/* Tab 2: Naming Shift Visual */}
        {tab === 'NAMING_TRAP' && (
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
            <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
              <defs>
                <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
                </marker>
              </defs>
              <g>
                {/* Node A (Source) */}
                <g>
                  <rect x="40" y="60" width="140" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#2dd4bf" strokeWidth="1.5" />
                  <text x="110" y="82" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>KStream-Source</text>
                  <text x="110" y="95" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>...SOURCE-0000000000</text>
                </g>

                {/* Flow link */}
                <path d="M 180 85 L 224 85" fill="none" stroke="#2e354f" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />

                {/* Middle node (Aggregator / Stateful Store) */}
                <g>
                  <rect x="230" y="60" width="180" height="50" rx="4" ry="4" fill={isShifted ? 'rgba(248,113,113,0.1)' : 'rgba(45,212,191,0.08)'} stroke={isShifted ? '#f87171' : '#2dd4bf'} strokeWidth="1.5" />
                  <text x="320" y="82" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>
                    {isShifted ? 'Stateful Aggregate (Shifted)' : 'Stateful Aggregate'}
                  </text>
                  <text x="320" y="95" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 7.5, fill: isShifted ? '#f87171' : '#2dd4bf', textAnchor: 'middle' }}>
                    {isShifted ? '...AGGREGATE-0000000002 ⚠️' : '...AGGREGATE-0000000001'}
                  </text>
                </g>

                {/* Flow link */}
                <path d="M 410 85 L 454 85" fill="none" stroke="#2e354f" strokeWidth="1.5" markerEnd={isShifted ? 'url(#arrow-red)' : 'url(#arrow-cyan)'} />

                {/* State Store & Changelog */}
                <g>
                  <rect x="460" y="60" width="180" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={isShifted ? '#f87171' : 'rgba(255,255,255,0.15)'} strokeDasharray={isShifted ? '3 3' : 'none'} />
                  <text x="550" y="82" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 9, fill: isShifted ? '#f87171' : '#cbd5e1', textAnchor: 'middle' }}>
                    {isShifted ? 'Orphaned Changelog Topic!' : 'Changelog Topic'}
                  </text>
                  <text x="550" y="95" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 7, fill: isShifted ? '#f87171' : '#94a3b8', textAnchor: 'middle' }}>
                    {isShifted ? 'Looking for AGGREGATE-002 (Rebuild!)' : '...STATE-STORE-0000000001'}
                  </text>
                </g>
              </g>
            </svg>
          </div>
        )}

        {/* Tab 3: Sub-Topology Rebalance Storm Visual */}
        {tab === 'SUBTOPOLOGY_STORM' && (
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px', marginBottom: '14px' }}>
              {/* Sub-Topology 0 Box */}
              <div style={{
                background: isSwapped ? 'rgba(248,113,113,0.08)' : 'rgba(56,189,248,0.08)',
                border: isSwapped ? '1.5px solid #f87171' : '1.5px solid #38bdf8',
                borderRadius: '6px',
                padding: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: isSwapped ? '#f87171' : '#38bdf8', fontSize: '12px' }}>
                    Sub-Topology 0
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                    Task ID: 0_0, 0_1...
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#e2e8f0', fontWeight: 700 }}>
                  Pipeline: {isSwapped ? 'Payments Stream (Swapped to Index 0)' : 'Orders Stream (Original Index 0)'}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Consumes: {isSwapped ? 'topic "payments-raw"' : 'topic "orders-raw"'}
                </div>
              </div>

              {/* Sub-Topology 1 Box */}
              <div style={{
                background: isSwapped ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
                border: isSwapped ? '1.5px solid #f87171' : '1.5px solid #34d399',
                borderRadius: '6px',
                padding: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: isSwapped ? '#f87171' : '#34d399', fontSize: '12px' }}>
                    Sub-Topology 1
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                    Task ID: 1_0, 1_1...
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#e2e8f0', fontWeight: 700 }}>
                  Pipeline: {isSwapped ? 'Orders Stream (Swapped to Index 1)' : 'Payments Stream (Original Index 1)'}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Consumes: {isSwapped ? 'topic "orders-raw"' : 'topic "payments-raw"'}
                </div>
              </div>
            </div>

            {/* Rolling Deployment Collision Simulation Box */}
            <div style={{
              background: isSwapped ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)',
              border: isSwapped ? '1.5px solid #f87171' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: isSwapped ? '#f87171' : '#38bdf8', textTransform: 'uppercase' }}>
                  {isSwapped ? '🚨 ROLLING DEPLOYMENT CONFLICT: V2 LEADER VS V1 FOLLOWER' : 'HOMOGENEOUS CLUSTER STATE (NORMAL)'}
                </span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: isSwapped ? '#f8717122' : '#34d39922',
                  color: isSwapped ? '#f87171' : '#34d399'
                }}>
                  {isSwapped ? '0 MSG/SEC (REBALANCE STORM)' : 'NORMAL PROCESSING'}
                </span>
              </div>

              {isSwapped ? (
                <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  <div>1. <strong>v2 Leader</strong> generates assignment: <code>Task 0_0 ➔ payments-raw-0</code>.</div>
                  <div>2. <strong>v1 Follower</strong> receives Task 0_0, but its local topology expects <code>orders-raw-0</code>!</div>
                  <div style={{ color: '#f87171', fontWeight: 700 }}>
                    3. 💥 Collision: <code>TaskAssignmentException: Task 0_0 assigned unexpected topic-partition</code>.
                  </div>
                  <div style={{ color: '#f87171' }}>
                    4. Follower leaves & rejoins consumer group ➔ Group Coordinator halts world and restarts rebalance.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '4px', marginTop: '8px', borderLeft: '3px solid #fbbf24' }}>
                    <strong style={{ color: '#fbbf24' }}>Duration & Termination Milestone:</strong>
                    <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      • <strong>While old pods exist:</strong> Storm lasts the entire rolling update duration (scales with pod count & <code>maxUnavailable</code>).<br />
                      • <strong>When 100% v2 is reached:</strong> Rebalance storm STOPS, but stream threads enter <code>RESTORING</code> state to rebuild misaligned RocksDB state (another 5–20 minutes).
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  All pods agree on Sub-topology IDs: Task 0_0 processes <code>orders-raw-0</code> and Task 1_0 processes <code>payments-raw-0</code>. No assignment conflicts occur during group rebalances.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Card */}
        <div className={`interactive-diagram-details-card ${
          selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-orange'
        }`}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--ifm-color-content)' }}>{selectedData.title}</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
            <strong>Overview:</strong> {selectedData.overview}
          </p>
          
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
            {selectedData.bullets.map((b, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
