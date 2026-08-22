import React, { useState } from 'react';

export default function DsaWeek18DsuDiagram(): React.JSX.Element {
  const [hasCompressed, setHasCompressed] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Disjoint Set Union (DSU) Path Compression Tree Flattening
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setHasCompressed(!hasCompressed)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#a78bfa', color: '#090b14', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer' }}>
            {hasCompressed ? 'Reset Chain' : 'Apply Path Compression ✨'}
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 500 160" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
          {/* Root node 0 */}
          <g transform="translate(250, 35)">
            <circle r="20" fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="12" fontWeight="700">Root 0</text>
          </g>

          {!hasCompressed ? (
            /* Linear chain 3 → 2 → 1 → 0 */
            <>
              <line x1="250" y1="55" x2="250" y2="75" stroke="#a78bfa" strokeWidth="2" />
              <g transform="translate(250, 85)"><circle r="15" fill="rgba(255,255,255,0.05)" stroke="#a78bfa" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">1</text></g>

              <line x1="250" y1="100" x2="250" y2="120" stroke="#a78bfa" strokeWidth="2" />
              <g transform="translate(250, 135)"><circle r="15" fill="rgba(255,255,255,0.05)" stroke="#a78bfa" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">2</text></g>
            </>
          ) : (
            /* Flattened star graph directly pointing to Root 0 */
            <>
              <line x1="235" y1="45" x2="160" y2="105" stroke="#34d399" strokeWidth="2" />
              <g transform="translate(160, 115)"><circle r="16" fill="rgba(52,211,153,0.2)" stroke="#34d399" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">1</text></g>

              <line x1="265" y1="45" x2="340" y2="105" stroke="#34d399" strokeWidth="2" />
              <g transform="translate(340, 115)"><circle r="16" fill="rgba(52,211,153,0.2)" stroke="#34d399" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">2</text></g>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-purple" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
          {hasCompressed ? 'Flattened Tree: All nodes point directly to Root 0! Height = 1.' : 'Uncompressed Deep Chain: Traversing requires O(N) hops.'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          With Path Compression + Union by Rank, DSU achieves nearly O(1) amortized inverse Ackermann α(N) time!
        </div>
      </div>
    </div>
  );
}
