import React, { useState } from 'react';

type TabType = 'INDEX_SHIFT' | 'SUBTOPOLOGY_CLASH' | 'DAG_CYCLES' | 'SAFE_PATTERNS';

export default function KafkaStreamsInvalidTopologyDiagram({
  initialTab = 'INDEX_SHIFT'
}: {
  initialTab?: TabType;
}): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [shiftSimulated, setShiftSimulated] = useState<boolean>(false);
  const [deploySimulated, setDeploySimulated] = useState<boolean>(false);
  const [cycleSimulated, setCycleSimulated] = useState<boolean>(false);
  const [safePatternView, setSafePatternView] = useState<'NAMED' | 'BLUE_GREEN'>('NAMED');

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        margin: '1.5rem 0',
        background: '#090b14',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '1.25rem',
        color: '#e2e8f0'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .kstreams-invalid-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #1e293b',
          marginBottom: '1rem'
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.02em' }}>
          Kafka Streams Topology Mutation & Invalid Order Telemetry
        </span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { id: 'INDEX_SHIFT', label: '1. Auto-Index Shift Trap', color: '#f87171' },
          { id: 'SUBTOPOLOGY_CLASH', label: '2. Sub-Topology Reorder Storm', color: '#fbbf24' },
          { id: 'DAG_CYCLES', label: '3. DAG Loops & TopologyException', color: '#a78bfa' },
          { id: 'SAFE_PATTERNS', label: '4. Zero-Downtime Safe Patterns', color: '#34d399' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isActive ? `${tab.color}22` : '#0f172a',
                border: `1px solid ${isActive ? tab.color : '#334155'}`,
                color: isActive ? tab.color : '#94a3b8'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Split Pane Container */}
      <div
        className="kstreams-invalid-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '56% 44%',
          gap: '1.25rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Visual Canvas */}
        <div
          style={{
            background: '#0d0f1e',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* TAB 1: Auto-Index Shift */}
          {activeTab === 'INDEX_SHIFT' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Anonymous Operator Auto-Increment Simulator
                </span>
                <button
                  onClick={() => setShiftSimulated(!shiftSimulated)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: shiftSimulated ? '#ef4444' : '#0284c7',
                    border: 'none',
                    color: '#ffffff'
                  }}
                >
                  {shiftSimulated ? '↺ Revert to Original Code' : '⚡ Simulate: Insert mapValues() Upstream'}
                </button>
              </div>

              <svg viewBox="0 0 460 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-sky" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-red" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                  </marker>
                  <marker id="arrow-green" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#34d399" />
                  </marker>
                </defs>

                {/* Source Node */}
                <rect x="15" y="25" width="120" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="75" y="44" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">KSTREAM-SOURCE</text>
                <text x="75" y="58" fill="#94a3b8" fontSize="9" textAnchor="middle">Index: 0000000000</text>

                {/* Path from Source to Node 1 */}
                <path d="M 135 46 L 165 46" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />

                {/* Node 1: Filter */}
                <rect x="175" y="25" width="125" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="237" y="44" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">KSTREAM-FILTER</text>
                <text x="237" y="58" fill="#94a3b8" fontSize="9" textAnchor="middle">Index: 0000000001</text>

                {!shiftSimulated ? (
                  <>
                    {/* Path from Filter to Aggregate */}
                    <path d="M 300 46 L 330 46" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />

                    {/* Node 2: Aggregate */}
                    <rect x="335" y="25" width="115" height="42" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="392" y="44" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">KSTREAM-AGGREGATE</text>
                    <text x="392" y="58" fill="#94a3b8" fontSize="9" textAnchor="middle">Index: 0000000002</text>

                    {/* Arrow down to changelog */}
                    <path d="M 392 67 L 392 120" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />

                    {/* Changelog topic on Broker */}
                    <rect x="230" y="130" width="220" height="48" rx="6" fill="#0b291b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="340" y="150" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">app-KSTREAM-AGGREGATE-</text>
                    <text x="340" y="165" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">STATE-STORE-0000000002-changelog</text>

                    {/* RocksDB local state store */}
                    <rect x="230" y="200" width="220" height="45" rx="6" fill="#1e1e2f" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x="340" y="218" fill="#38bdf8" fontSize="9.5" fontWeight="bold" textAnchor="middle">Local RocksDB Store / 0_0</text>
                    <text x="340" y="233" fill="#94a3b8" fontSize="9" textAnchor="middle">Mapped to Store 0000000002 [VALID]</text>
                  </>
                ) : (
                  <>
                    {/* Shifted State: MapValues inserted */}
                    <path d="M 237 67 L 237 98" stroke="#ef4444" strokeWidth="1.8" markerEnd="url(#arrow-red)" />

                    {/* Node 2 Inserted: MapValues */}
                    <rect x="175" y="105" width="125" height="42" rx="6" fill="#3b1115" stroke="#ef4444" strokeWidth="1.8" />
                    <text x="237" y="122" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">+ KSTREAM-MAP</text>
                    <text x="237" y="136" fill="#fca5a5" fontSize="9" textAnchor="middle">Stole Index: 0000000002!</text>

                    {/* Shifted Aggregate is now 0000000003 */}
                    <path d="M 300 126 L 330 126" stroke="#ef4444" strokeWidth="1.8" markerEnd="url(#arrow-red)" />
                    <rect x="335" y="105" width="115" height="42" rx="6" fill="#2d1215" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="392" y="122" fill="#ef4444" fontSize="9.5" fontWeight="bold" textAnchor="middle">KSTREAM-AGGREGATE</text>
                    <text x="392" y="136" fill="#fca5a5" fontSize="9" textAnchor="middle">Shifted to: 0000000003!</text>

                    {/* Broker changelog topic mismatch */}
                    <rect x="20" y="180" width="200" height="48" rx="6" fill="#2d1518" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="120" y="198" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle">Broker Existing Changelog:</text>
                    <text x="120" y="213" fill="#ef4444" fontSize="9.5" fontWeight="bold" textAnchor="middle">...-0000000002-changelog</text>

                    {/* Local RocksDB disaster */}
                    <rect x="240" y="180" width="210" height="65" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="345" y="200" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle">❌ FATAL DESERIALIZATION ERROR</text>
                    <text x="345" y="217" fill="#ffffff" fontSize="8.5" textAnchor="middle">RocksDB looks for 0000000003</text>
                    <text x="345" y="233" fill="#fca5a5" fontSize="8" textAnchor="middle">Topic empty or holds raw Map bytes!</text>
                  </>
                )}
              </svg>
            </div>
          )}

          {/* TAB 2: Sub-Topology Reorder Storm */}
          {activeTab === 'SUBTOPOLOGY_CLASH' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rolling Upgrade Sub-Topology Clash
                </span>
                <button
                  onClick={() => setDeploySimulated(!deploySimulated)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: deploySimulated ? '#ef4444' : '#eab308',
                    border: 'none',
                    color: '#000000'
                  }}
                >
                  {deploySimulated ? '↺ Revert to Single Version' : '⚡ Simulate: Rolling Upgrade (v1 + v2)'}
                </button>
              </div>

              <svg viewBox="0 0 460 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Pod 1 (v1) */}
                <rect x="15" y="20" width="200" height="105" rx="6" fill="#131826" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="115" y="38" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">POD 1 (Running v1)</text>
                <text x="25" y="58" fill="#94a3b8" fontSize="9">Code Order:</text>
                <text x="25" y="74" fill="#34d399" fontSize="9.5" fontWeight="bold">Sub-topology 0 = Orders</text>
                <text x="25" y="90" fill="#a78bfa" fontSize="9.5" fontWeight="bold">Sub-topology 1 = Payments</text>
                <text x="25" y="110" fill="#38bdf8" fontSize="9">Assignor Task 0_0: Orders</text>

                {/* Pod 2 (v2) */}
                <rect
                  x="245"
                  y="20"
                  width="200"
                  height="105"
                  rx="6"
                  fill={deploySimulated ? '#331015' : '#131826'}
                  stroke={deploySimulated ? '#ef4444' : '#38bdf8'}
                  strokeWidth="1.5"
                />
                <text
                  x="345"
                  y="38"
                  fill={deploySimulated ? '#ef4444' : '#38bdf8'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {deploySimulated ? 'POD 2 (Deployed v2)' : 'POD 2 (Running v1)'}
                </text>
                <text x="255" y="58" fill="#94a3b8" fontSize="9">Code Order:</text>
                <text
                  x="255"
                  y="74"
                  fill={deploySimulated ? '#a78bfa' : '#34d399'}
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {deploySimulated ? 'Sub-topology 0 = Payments (SWAPPED!)' : 'Sub-topology 0 = Orders'}
                </text>
                <text
                  x="255"
                  y="90"
                  fill={deploySimulated ? '#34d399' : '#a78bfa'}
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {deploySimulated ? 'Sub-topology 1 = Orders' : 'Sub-topology 1 = Payments'}
                </text>
                <text
                  x="255"
                  y="110"
                  fill={deploySimulated ? '#fca5a5' : '#38bdf8'}
                  fontSize="9"
                >
                  {deploySimulated ? 'Assignor Task 0_0: Payments' : 'Assignor Task 0_0: Orders'}
                </text>

                {/* Middle Rebalance / Assignor Box */}
                {!deploySimulated ? (
                  <g>
                    <rect x="70" y="145" width="320" height="95" rx="8" fill="#0b291b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="230" y="170" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">
                      STABLE GROUP STATE (CooperativeStickyAssignor)
                    </text>
                    <text x="230" y="190" fill="#e2e8f0" fontSize="9.5" textAnchor="middle">
                      All group members agree on Sub-topology numbering (0=Orders, 1=Payments)
                    </text>
                    <text x="230" y="210" fill="#94a3b8" fontSize="9" textAnchor="middle">
                      Tasks 0_0 .. 0_N map cleanly to orders-raw topic partitions
                    </text>
                    <text x="230" y="228" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">
                      ✅ Continuous Processing • 0 Rebalance Interruptions
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x="50" y="140" width="360" height="110" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                    <text x="230" y="165" fill="#fca5a5" fontSize="11" fontWeight="bold" textAnchor="middle">
                      ⚡ PERPETUAL REBALANCE STORM DETECTED
                    </text>
                    <text x="230" y="185" fill="#ffffff" fontSize="9.5" textAnchor="middle">
                      Group Leader assigns Task 0_0 (Payments) ➔ Pod 1 rejects (Expects Orders!)
                    </text>
                    <text x="230" y="203" fill="#fca5a5" fontSize="9" textAnchor="middle">
                      Throws TaskAssignmentException ➔ Pod 1 rejoins ➔ Triggers rebalance
                    </text>
                    <text x="230" y="221" fill="#fca5a5" fontSize="9" textAnchor="middle">
                      Pod 2 (v2) receives Task 0_0 ➔ mounts Orders changelog with Payment Serde!
                    </text>
                    <text x="230" y="238" fill="#ef4444" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      ❌ Throughput: 0 msg/sec • CPU 100% in Rebalance Loop
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )}

          {/* TAB 3: DAG Cycles */}
          {activeTab === 'DAG_CYCLES' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  StreamsBuilder Build Validation
                </span>
                <button
                  onClick={() => setCycleSimulated(!cycleSimulated)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: cycleSimulated ? '#a855f7' : '#ef4444',
                    border: 'none',
                    color: '#ffffff'
                  }}
                >
                  {cycleSimulated ? '↺ Revert to Acyclic DAG' : '⚡ Simulate: Add Downstream Cyclic Edge'}
                </button>
              </div>

              <svg viewBox="0 0 460 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Node A: Source */}
                <rect x="25" y="40" width="110" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="80" y="60" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">SourceNode</text>
                <text x="80" y="74" fill="#94a3b8" fontSize="8.5" textAnchor="middle">"input-events"</text>

                {/* Path A -> B */}
                <path d="M 135 61 L 175 61" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />

                {/* Node B: Processor 1 */}
                <rect x="180" y="40" width="110" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="235" y="60" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">ProcessorAlpha</text>
                <text x="235" y="74" fill="#94a3b8" fontSize="8.5" textAnchor="middle">validation-step</text>

                {/* Path B -> C */}
                <path d="M 290 61 L 330 61" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />

                {/* Node C: Processor 2 */}
                <rect x="335" y="40" width="105" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="387" y="60" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">ProcessorBeta</text>
                <text x="387" y="74" fill="#94a3b8" fontSize="8.5" textAnchor="middle">enrichment-step</text>

                {!cycleSimulated ? (
                  <>
                    {/* Path C -> Sink */}
                    <path d="M 387 82 L 387 130" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
                    <rect x="325" y="140" width="125" height="42" rx="6" fill="#0b291b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="387" y="160" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">SinkNode</text>
                    <text x="387" y="174" fill="#94a3b8" fontSize="8.5" textAnchor="middle">"output-events"</text>

                    {/* Valid Status Card */}
                    <rect x="35" y="140" width="250" height="95" rx="6" fill="#131826" stroke="#34d399" strokeWidth="1.2" />
                    <text x="160" y="165" fill="#34d399" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                      STRICT DIRECTED ACYCLIC GRAPH (DAG)
                    </text>
                    <text x="160" y="185" fill="#e2e8f0" fontSize="9" textAnchor="middle">
                      Topological Sort succeeds: Source ➔ Alpha ➔ Beta ➔ Sink
                    </text>
                    <text x="160" y="202" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                      Zero cyclic feedback in memory. builder.build() completes in ~4ms.
                    </text>
                    <text x="160" y="220" fill="#34d399" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      ✅ StreamsBuilder.build() PASSED
                    </text>
                  </>
                ) : (
                  <>
                    {/* Cyclic edge from Beta back to Alpha */}
                    <path
                      d="M 387 82 C 387 140, 235 140, 235 90"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow-red)"
                    />
                    <text x="310" y="132" fill="#ef4444" fontSize="9" fontWeight="bold">Illegal Cycle Edge</text>

                    {/* TopologyException Card */}
                    <rect x="25" y="150" width="415" height="100" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="1.8" />
                    <text x="232" y="172" fill="#fca5a5" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                      💥 ORG.APACHE.KAFKA.STREAMS.ERRORS.TOPOLOGYEXCEPTION
                    </text>
                    <text x="232" y="192" fill="#ffffff" fontSize="9" textAnchor="middle">
                      "Invalid topology: Loop detected in topology: SourceNode ➔ Alpha ➔ Beta ➔ Alpha"
                    </text>
                    <text x="232" y="210" fill="#fca5a5" fontSize="8.5" textAnchor="middle">
                      In-memory recursion is forbidden. Must emit to intermediate Kafka topic!
                    </text>
                    <text x="232" y="230" fill="#ef4444" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      ❌ Application Fails to Start (Fatal JVM Crash at Boot)
                    </text>
                  </>
                )}
              </svg>
            </div>
          )}

          {/* TAB 4: Safe Patterns */}
          {activeTab === 'SAFE_PATTERNS' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Principal Production Safe Strategies
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setSafePatternView('NAMED')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: safePatternView === 'NAMED' ? '#34d399' : '#1e293b',
                      border: 'none',
                      color: safePatternView === 'NAMED' ? '#000000' : '#94a3b8'
                    }}
                  >
                    Named.as()
                  </button>
                  <button
                    onClick={() => setSafePatternView('BLUE_GREEN')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: safePatternView === 'BLUE_GREEN' ? '#34d399' : '#1e293b',
                      border: 'none',
                      color: safePatternView === 'BLUE_GREEN' ? '#000000' : '#94a3b8'
                    }}
                  >
                    Blue-Green Cutover
                  </button>
                </div>
              </div>

              <svg viewBox="0 0 460 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {safePatternView === 'NAMED' ? (
                  <>
                    {/* Explicit Named Nodes */}
                    <rect x="20" y="25" width="125" height="45" rx="6" fill="#131826" stroke="#34d399" strokeWidth="1.5" />
                    <text x="82" y="44" fill="#34d399" fontSize="9.5" fontWeight="bold" textAnchor="middle">Named.as("filter-orders")</text>
                    <text x="82" y="58" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Explicit Node Name</text>

                    <path d="M 145 47 L 175 47" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-green)" />

                    <rect x="180" y="25" width="130" height="45" rx="6" fill="#131826" stroke="#34d399" strokeWidth="1.5" />
                    <text x="245" y="44" fill="#34d399" fontSize="9.5" fontWeight="bold" textAnchor="middle">Named.as("enrich-vip")</text>
                    <text x="245" y="58" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Added in middle!</text>

                    <path d="M 310 47 L 340 47" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-green)" />

                    <rect x="345" y="25" width="105" height="45" rx="6" fill="#131826" stroke="#34d399" strokeWidth="1.5" />
                    <text x="397" y="44" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">Materialized.as(</text>
                    <text x="397" y="58" fill="#34d399" fontSize="8.5" fontWeight="bold" textAnchor="middle">"order-count-store")</text>

                    {/* Changelog topic pinned */}
                    <path d="M 397 70 L 397 110" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
                    <rect x="190" y="115" width="260" height="48" rx="6" fill="#0b291b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="320" y="135" fill="#34d399" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      app-order-count-store-changelog
                    </text>
                    <text x="320" y="152" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                      Topic name PINNED by explicit store name! No index shift!
                    </text>

                    {/* CI Golden File Check */}
                    <rect x="20" y="180" width="430" height="75" rx="6" fill="#131826" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x="235" y="202" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                      🛡️ CI/CD AUTOMATED TOPOLOGY SNAPSHOT TEST
                    </text>
                    <text x="235" y="220" fill="#e2e8f0" fontSize="9" textAnchor="middle">
                      Topology.describe() compared against golden-topology.dump in PR pipeline.
                    </text>
                    <text x="235" y="238" fill="#34d399" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      Prevents unintentional operator reordering before reaching production.
                    </text>
                  </>
                ) : (
                  <>
                    {/* Blue Green Visual */}
                    <rect x="20" y="20" width="200" height="100" rx="6" fill="#131826" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="120" y="38" fill="#38bdf8" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                      BLUE CLUSTER (Active v1)
                    </text>
                    <text x="30" y="58" fill="#94a3b8" fontSize="9">application.id: "order-service-v1"</text>
                    <text x="30" y="76" fill="#94a3b8" fontSize="9">State Store: order-v1-changelog</text>
                    <text x="30" y="96" fill="#34d399" fontSize="9" fontWeight="bold">Active Consumers Reading v1 Out</text>

                    <rect x="240" y="20" width="200" height="100" rx="6" fill="#0b291b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="340" y="38" fill="#34d399" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                      GREEN CLUSTER (Shadow v2)
                    </text>
                    <text x="250" y="58" fill="#94a3b8" fontSize="9">application.id: "order-service-v2"</text>
                    <text x="250" y="76" fill="#94a3b8" fontSize="9">State Store: order-v2-changelog</text>
                    <text x="250" y="96" fill="#fbbf24" fontSize="9" fontWeight="bold">Warm Rebuild (0 prod traffic impact)</text>

                    {/* Cutover indicator */}
                    <rect x="50" y="145" width="360" height="105" rx="6" fill="#131826" stroke="#34d399" strokeWidth="1.5" />
                    <text x="230" y="170" fill="#34d399" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                      100% ISOLATED CONSUMER GROUP MIGRATION
                    </text>
                    <text x="230" y="190" fill="#e2e8f0" fontSize="9" textAnchor="middle">
                      1. Green boots independently with new topology DAG structure.
                    </text>
                    <text x="230" y="208" fill="#e2e8f0" fontSize="9" textAnchor="middle">
                      2. RocksDB caught up from source topics without touching Blue.
                    </text>
                    <text x="230" y="226" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">
                      3. Instant consumer cutover ➔ Decommission Blue ➔ ZERO DOWNTIME.
                    </text>
                  </>
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Right Column: Architectural Telemetry & Details Card */}
        <div
          style={{
            background: '#0c0e17',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '1.1rem',
            fontSize: '0.88rem'
          }}
        >
          {activeTab === 'INDEX_SHIFT' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: shiftSimulated ? '#ef4444' : '#38bdf8'
                  }}
                />
                <h4 style={{ margin: 0, color: shiftSimulated ? '#ef4444' : '#38bdf8', fontSize: '0.95rem' }}>
                  {shiftSimulated ? 'CRITICAL: Topology Index Shift Active' : 'Normal Anonymous Topologies'}
                </h4>
              </div>

              <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                Kafka Streams assigns operator names sequentially using an internal counter:{' '}
                <code style={{ background: '#1e293b', padding: '1px 4px', color: '#38bdf8' }}>KSTREAM-*-000000000X</code>.
              </p>

              <div style={{ background: '#090b14', padding: '0.65rem', borderRadius: '5px', border: '1px solid #1e293b', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#f87171', display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                  Under-the-Hood Crash Dynamics:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <li>Broker retains old topic: <code style={{ color: '#94a3b8' }}>...-0000000002-changelog</code></li>
                  <li>New code shifted aggregate store to: <code style={{ color: '#f87171' }}>...-0000000003-changelog</code></li>
                  <li><strong>Result:</strong> State store starts with 0 records or reads incompatible SerDe bytes!</li>
                </ul>
              </div>

              <div style={{ borderLeft: '3px solid #34d399', paddingLeft: '0.65rem' }}>
                <strong style={{ color: '#34d399', fontSize: '0.82rem' }}>Principal Remedy:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  Never use anonymous operators. Always pass <code style={{ color: '#34d399' }}>Named.as(...)</code> and{' '}
                  <code style={{ color: '#34d399' }}>Materialized.as(...)</code> to pin node names to semantic IDs.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'SUBTOPOLOGY_CLASH' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: deploySimulated ? '#ef4444' : '#fbbf24'
                  }}
                />
                <h4 style={{ margin: 0, color: deploySimulated ? '#ef4444' : '#fbbf24', fontSize: '0.95rem' }}>
                  {deploySimulated ? 'REBALANCE STORM ACTIVE (0 msg/sec)' : 'Sub-Topology Task Assignment'}
                </h4>
              </div>

              <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                Each independent source branch forms a <strong>Sub-Topology (0, 1, 2...)</strong>. Tasks are identified as{' '}
                <code style={{ background: '#1e293b', padding: '1px 4px', color: '#fbbf24' }}>TaskId(subTopologyId, partition)</code>.
              </p>

              <div style={{ background: '#090b14', padding: '0.65rem', borderRadius: '5px', border: '1px solid #1e293b', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                  Why Rolling Deploys Fail:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <li>Pod 1 (v1) assigns Task 0_0 to Orders topic partition 0.</li>
                  <li>Pod 2 (v2) has Payments first, so Task 0_0 points to Payments!</li>
                  <li>Leader assignor metadata conflicts trigger continuous Group Rebalance.</li>
                </ul>
              </div>

              <div style={{ borderLeft: '3px solid #34d399', paddingLeft: '0.65rem' }}>
                <strong style={{ color: '#34d399', fontSize: '0.82rem' }}>Principal Remedy:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  Never reorder sub-topologies in code during rolling updates. Use Blue-Green deployments or separate sub-topologies into independent microservices.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'DAG_CYCLES' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cycleSimulated ? '#ef4444' : '#a78bfa'
                  }}
                />
                <h4 style={{ margin: 0, color: cycleSimulated ? '#ef4444' : '#a78bfa', fontSize: '0.95rem' }}>
                  {cycleSimulated ? 'Build Validation Crash (TopologyException)' : 'Topological Invariant: Strict DAG'}
                </h4>
              </div>

              <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                Kafka Streams validates the graph at <code style={{ background: '#1e293b', padding: '1px 4px', color: '#a78bfa' }}>builder.build()</code>.
                Any cycle or duplicate name throws a fatal build-time exception.
              </p>

              <div style={{ background: '#090b14', padding: '0.65rem', borderRadius: '5px', border: '1px solid #1e293b', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#a78bfa', display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                  Topological Validation Rules:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <li><strong>No Direct Loops:</strong> Downstream nodes cannot route back to upstream processors in-memory.</li>
                  <li><strong>Unique Identifiers:</strong> Processor & State Store names must be globally unique across the DAG.</li>
                  <li><strong>Co-Partitioning:</strong> Joins enforce matching partition counts on input streams.</li>
                </ul>
              </div>

              <div style={{ borderLeft: '3px solid #34d399', paddingLeft: '0.65rem' }}>
                <strong style={{ color: '#34d399', fontSize: '0.82rem' }}>Feedback Loop Solution:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  To feed processed data back into an upstream pipeline, sink events to an intermediate Kafka topic and read them with a separate source node.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'SAFE_PATTERNS' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                <h4 style={{ margin: 0, color: '#34d399', fontSize: '0.95rem' }}>
                  Production Safe Evolution Playbook
                </h4>
              </div>

              <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                By applying explicit names and CI golden topology snapshots, you decouple logical updates from physical Kafka topic coordinates.
              </p>

              <div style={{ background: '#090b14', padding: '0.65rem', borderRadius: '5px', border: '1px solid #1e293b', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#34d399', display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                  The 4 Golden Engineering Invariants:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <li><strong>Explicit Naming:</strong> Always supply Named.as & Materialized.as.</li>
                  <li><strong>Append-Only:</strong> Never reorder or delete existing sub-topologies.</li>
                  <li><strong>Blue-Green Versioning:</strong> Bump application.id for structural DAG rewrites.</li>
                  <li><strong>CI Snapshot Gate:</strong> Diff Topology.describe() in pull request tests.</li>
                </ul>
              </div>

              <div style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '0.65rem' }}>
                <strong style={{ color: '#38bdf8', fontSize: '0.82rem' }}>Zero-Downtime Guarantee:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  Blue-Green deployment ensures the new topology rebuilds local RocksDB state in shadow without causing rebalances or corrupting active v1 pods.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

