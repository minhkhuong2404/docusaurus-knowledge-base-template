import React, { useState } from 'react';

export default function SnapshotPatternDiagram(): React.JSX.Element {
  const [useSnapshot, setUseSnapshot] = useState(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Event Sourcing Snapshot Pattern Mechanics</span>
        <button
          onClick={() => setUseSnapshot(!useSnapshot)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            background: useSnapshot ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            color: useSnapshot ? '#34d399' : '#f87171',
            boxShadow: `0 0 0 1.5px ${useSnapshot ? '#34d39950' : '#f8717150'}`,
            transition: 'all 0.2s'
          }}
        >
          {useSnapshot ? 'Use Snapshot ✅' : 'Without Snapshot ❌'}
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 160" className="interactive-diagram-svg">
          <defs>
            <marker id="snap-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" /></marker>
            <marker id="snap-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" /></marker>
          </defs>

          {/* Timeline axis */}
          <line x1="30" y1="110" x2="650" y2="110" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />

          {/* Events list */}
          {/* E1 */}
          <circle cx="50" cy="110" r="12" fill={useSnapshot ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.2)'} stroke={useSnapshot ? 'rgba(255,255,255,0.2)' : '#f87171'} strokeWidth="1.5" />
          <text x="50" y="114" textAnchor="middle" fill={useSnapshot ? 'var(--ifm-color-content-secondary)' : '#f87171'} fontSize="8.5" fontWeight="bold">E1</text>
          <text x="50" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">deposit $100</text>

          {/* E2 */}
          <circle cx="120" cy="110" r="12" fill={useSnapshot ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.2)'} stroke={useSnapshot ? 'rgba(255,255,255,0.2)' : '#f87171'} strokeWidth="1.5" />
          <text x="120" y="114" textAnchor="middle" fill={useSnapshot ? 'var(--ifm-color-content-secondary)' : '#f87171'} fontSize="8.5" fontWeight="bold">E2</text>
          <text x="120" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">withdraw $20</text>

          {/* Ellipsis */}
          <text x="210" y="112" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="18" fontWeight="bold">...</text>

          {/* E1000 */}
          <circle cx="300" cy="110" r="12"
            fill={useSnapshot ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}
            stroke={useSnapshot ? '#34d399' : '#f87171'}
            strokeWidth="1.5"
          />
          <text x="300" y="114" textAnchor="middle" fill={useSnapshot ? '#34d399' : '#f87171'} fontSize="8.5" fontWeight="bold">E1000</text>
          <text x="300" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">deposit $500</text>

          {/* E1001 */}
          <circle cx="430" cy="110" r="12"
            fill={useSnapshot ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}
            stroke={useSnapshot ? '#fbbf24' : '#f87171'}
            strokeWidth="1.5"
          />
          <text x="430" y="114" textAnchor="middle" fill={useSnapshot ? '#fbbf24' : '#f87171'} fontSize="8.5" fontWeight="bold">E1001</text>
          <text x="430" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">withdraw $50</text>

          {/* E1002 */}
          <circle cx="560" cy="110" r="12"
            fill={useSnapshot ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}
            stroke={useSnapshot ? '#fbbf24' : '#f87171'}
            strokeWidth="1.5"
          />
          <text x="560" y="114" textAnchor="middle" fill={useSnapshot ? '#fbbf24' : '#f87171'} fontSize="8.5" fontWeight="bold">E1002</text>
          <text x="560" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">deposit $15</text>

          {/* Snapshot Block (y: 25) */}
          {useSnapshot && (
            <g>
              <rect x="230" y="20" width="140" height="45" rx="5" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
              <text x="300" y="38" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">Snapshot: Balance=$5480</text>
              <text x="300" y="50" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Captured at E1000</text>

              {/* Arrow down to E1000 */}
              <path d="M 300 66 L 300 92" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#snap-arr-green)" />

              {/* Scan range indicator */}
              <path d="M 315 110 L 610 110" fill="none" stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#snap-arr)" className="interactive-diagram-flowing-path" />
              <text x="460" y="98" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">Replaying only 2 events</text>
            </g>
          )}

          {!useSnapshot && (
            <g>
              {/* Massive scan path */}
              <path d="M 30 110 L 610 110" fill="none" stroke="#f87171" strokeWidth="2.5" markerEnd="url(#snap-arr)" className="interactive-diagram-flowing-path" />
              <text x="340" y="80" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold">⚠️ Replaying ALL 1,002 events sequentially (O(N) full scan)</text>
            </g>
          )}
        </svg>
      </div>

      {/* Info Card */}
      <div className="interactive-diagram-details-card" style={{ borderColor: useSnapshot ? '#34d399' : '#f87171' }}>
        {useSnapshot ? (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>⚡ Query Optimization: O(1) Snapshot Lookups</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Base State**: Instead of querying from the very beginning of time, the application loads the pre-aggregated snapshot at E1000 (`balance = $5480`).</li>
              <li>**Incremental Replay**: The engine scans only the log events with a sequence ID greater than E1000 (E1001, E1002) and computes the final balance.</li>
              <li>**Performance**: Query latency remains constant (&lt; 5ms) regardless of ledger history size.</li>
            </ul>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>❌ Performance Trap: O(N) Sequential Scanning</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Calculation overhead**: Deriving state requires processing and loading every single ledger transaction entry from database creation.</li>
              <li>**Scalability Limits**: As the ledger table grows to millions of rows, query performance degrades linearly, causing API connection timeouts.</li>
              <li>**Remediation**: Establish a scheduled worker to write snapshots to the snapshot store every 1,000 events.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
