import React, { useState } from 'react';

type TabMode = 'math' | 'ot-vs-crdt' | 'sequence' | 'tombstones';

export default function CrdtCollaborativeDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('math');
  const [replicaAValue, setReplicaAValue] = useState<number>(3);
  const [replicaBValue, setReplicaBValue] = useState<number>(5);

  const mergedValue = Math.max(replicaAValue, replicaBValue); // LWW / Max semilattice example

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .crdt-grid-layout {
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
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Conflict-Free Replicated Data Types (CRDT) & Collaborative Systems
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'math', label: '📐 Join-Semilattice Math', color: '#34d399' },
            { id: 'ot-vs-crdt', label: '⚖️ CRDT vs OT (Google Docs vs Figma)', color: '#38bdf8' },
            { id: 'sequence', label: '📝 Sequence CRDTs (Text Editing)', color: '#fbbf24' },
            { id: 'tombstones', label: '🗑️ Tombstones & Garbage Collection', color: '#f87171' },
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

      {/* SVG Vector Canvas with Animated Converging Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="CRDT Peer-to-Peer Convergence Flow Diagram"
        >
          <defs>
            <marker
              id="arrow-crdt-green"
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
              id="arrow-crdt-blue"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Peer A (Top Left) */}
          <g>
            <rect x="40" y="30" width="180" height="50" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="65" cy="55" r="10" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="65" y="59" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">A</text>
            <text x="130" y="53" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Replica Node A</text>
            <text x="130" y="69" textAnchor="middle" fill="#38bdf8" fontSize="10">State: S_A = {replicaAValue}</text>
          </g>

          {/* Peer B (Bottom Left) */}
          <g>
            <rect x="40" y="105" width="180" height="50" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="65" cy="130" r="10" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="65" y="134" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="800">B</text>
            <text x="130" y="128" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Replica Node B</text>
            <text x="130" y="144" textAnchor="middle" fill="#fbbf24" fontSize="10">State: S_B = {replicaBValue}</text>
          </g>

          {/* Animated Paths from A and B to Merge Gateway */}
          <path d="M 220 55 C 320 55, 330 90, 420 90" fill="none" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <path
            d="M 220 55 C 320 55, 330 90, 420 90"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-crdt-blue)"
          />

          <path d="M 220 130 C 320 130, 330 90, 420 90" fill="none" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.3" />
          <path
            d="M 220 130 C 320 130, 330 90, 420 90"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-crdt-green)"
          />

          {/* Merge Semilattice Center Node */}
          <g>
            <rect x="425" y="45" width="220" height="90" rx="12" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" strokeWidth="2" />
            <circle cx="455" cy="75" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="455" y="80" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">⊔</text>
            <text x="545" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="13" fontWeight="700">
              Join-Semilattice Merge
            </text>
            <text x="545" y="88" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="600">
              S_merged = S_A ⊔ S_B
            </text>
            <text x="545" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">
              Associative • Commutative • Idempotent
            </text>
          </g>

          {/* Conduit from Merge to Converged Clients */}
          <line x1="645" y1="90" x2="735" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="645"
            y1="90"
            x2="735"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-crdt-green)"
          />

          {/* Converged Global State Node */}
          <g>
            <rect x="740" y="45" width="170" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="765" cy="75" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="765" y="80" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">✓</text>
            <text x="830" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12.5" fontWeight="700">Guaranteed Convergence</text>
            <text x="830" y="90" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Value = {mergedValue}</text>
            <text x="830" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">No Locks • No Central Server</text>
          </g>
        </svg>
      </div>

      {/* Tab 1: Semilattice Math */}
      {activeTab === 'math' && (
        <div className="crdt-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              The Mathematical Proof: Join-Semilattice ($\sqcup$)
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              For two distributed replicas to independently merge concurrent updates without locks and arrive at identical states, the merge function <strong>$\sqcup$</strong> must satisfy three algebraic axioms:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: '#34d399' }}>Commutativity:</strong> $A \sqcup B = B \sqcup A$ (Message arrival order across network does not matter).
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Associativity:</strong> $(A \sqcup B) \sqcup C = A \sqcup (B \sqcup C)$ (Message batching or grouping does not matter).
              </li>
              <li>
                <strong style={{ color: '#fbbf24' }}>Idempotency:</strong> $A \sqcup A = A$ (Duplicate message delivery does not corrupt state).
              </li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Interactive Merge Simulator (LWW-Register)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Replica A Counter (Timestamp/Value): {replicaAValue}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={replicaAValue}
                  onChange={(e) => setReplicaAValue(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Replica B Counter (Timestamp/Value): {replicaBValue}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={replicaBValue}
                  onChange={(e) => setReplicaBValue(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <strong style={{ color: '#34d399' }}>Merged Deterministic State:</strong> <code>{mergedValue}</code> (Both nodes converge to <code>{mergedValue}</code> regardless of packet delivery sequence).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CRDT vs OT */}
      {activeTab === 'ot-vs-crdt' && (
        <div className="crdt-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '15px' }}>
              Operational Transformation (OT) — e.g. Google Docs
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              OT rewrites concurrent character operations based on previously applied operations using transform functions $T(op1, op2)$.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Centralized Authority Required:</strong> In practice, OT requires a single authoritative server to establish a canonical total order of operations.</li>
              <li><strong>Algorithmic Fragility:</strong> Proving TP2 (Transformation Property 2 for peer-to-peer OT) has historically failed; most published decentralized OT algorithms were proven flawed.</li>
              <li><strong>Memory Efficient:</strong> Low memory overhead because document characters do not need unique persistent identifier metadata.</li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
              CRDTs — e.g. Figma, Apple Notes, Yjs, Automerge
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              CRDTs assign every character an immutable, globally unique, fractional position identifier. Operations commute naturally without transformation.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>True Peer-to-Peer & Local-First:</strong> Works offline for weeks; syncs directly over WebRTC, Bluetooth, or relay servers.</li>
              <li><strong>Mathematically Verified:</strong> Proven convergence via lattice properties; zero possibility of silent divergence.</li>
              <li><strong>Metadata Trade-off:</strong> Characters carry unique Lamport IDs and client IDs, leading to historical memory bloat (mitigated by modern run-length encoding in Yjs).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Sequence CRDTs */}
      {activeTab === 'sequence' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            Sequence CRDTs: How Concurrent Text Editing Actually Works
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            In a text document, typing between character at index 1 and index 2 cannot rely on integer array indices (inserting at index 1 shifts all subsequent indices by 1, corrupting concurrent edits).
          </p>
          <div style={{ background: '#080a12', padding: '12px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)', fontFamily: 'monospace', fontSize: '11.5px', color: '#fbbf24' }}>
            <div>Node 1: 'H' @ id: [0.1]</div>
            <div>Node 2 concurrently inserts 'E' between [0.1] and [0.2] ➔ Assigned fractional position: [0.15]</div>
            <div>Node 3 concurrently inserts 'L' between [0.1] and [0.2] ➔ Assigned fractional position: [0.18]</div>
            <div style={{ color: '#34d399', marginTop: '6px' }}>
              Deterministic Lexicographical Order: 'H' [0.1] ➔ 'E' [0.15] ➔ 'L' [0.18] ➔ 'O' [0.2]
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tombstones & GC */}
      {activeTab === 'tombstones' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #f87171', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '15px' }}>
            The Tombstone Dilemma & Garbage Collection
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            In CRDTs, when a user deletes a character, it <strong>cannot simply be erased from memory</strong>. If it were erased, an out-of-order concurrent insertion referencing that character as its left sibling would be orphaned or mispositioned!
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
            <li><strong>Tombstone:</strong> The character is marked <code>deleted = true</code> and retained in memory.</li>
            <li><strong>Tombstone Bloat:</strong> Editing a 10-page document over months could accumulate 500,000 hidden tombstones, turning a 50KB text file into a 20MB object!</li>
            <li><strong>Garbage Collection (GC):</strong> Tombstones can only be purged when a state vector confirms that <em>all active peers in the cluster have acknowledged the deletion beyond the causality horizon</em>.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
