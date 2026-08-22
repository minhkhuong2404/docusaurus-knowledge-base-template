import React, { useState } from 'react';

export default function DsaWeek10BacktrackingDiagram(): React.JSX.Element {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 12l-4-4-4 4M12 16V8" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Backtracking State Tree Exploration & Pruning (Subsets of [1, 2])
        </span>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 180" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Root node */}
          <g transform="translate(260, 25)">
            <rect x="-35" y="-15" width="70" height="30" rx="6" fill="rgba(244,114,182,0.2)" stroke="#f472b6" />
            <text textAnchor="middle" dy="5" fill="#ffffff" fontSize="12" fontWeight="700">[ ]</text>
          </g>

          {/* Level 1 Edges */}
          <line x1="240" y1="40" x2="140" y2="80" stroke="#f472b6" strokeWidth="2" />
          <line x1="280" y1="40" x2="380" y2="80" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Level 1 Nodes */}
          <g transform="translate(140, 85)">
            <rect x="-40" y="-15" width="80" height="30" rx="6" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
            <text textAnchor="middle" dy="5" fill="#38bdf8" fontSize="12" fontWeight="700">Include 1: [1]</text>
          </g>
          <g transform="translate(380, 85)">
            <rect x="-40" y="-15" width="80" height="30" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" />
            <text textAnchor="middle" dy="5" fill="#94a3b8" fontSize="12">Exclude 1: [ ]</text>
          </g>

          {/* Level 2 Edges */}
          <line x1="120" y1="100" x2="80" y2="140" stroke="#34d399" strokeWidth="2" />
          <line x1="160" y1="100" x2="200" y2="140" stroke="#34d399" strokeWidth="2" />
          <line x1="360" y1="100" x2="320" y2="140" stroke="#34d399" strokeWidth="2" />
          <line x1="400" y1="100" x2="440" y2="140" stroke="#34d399" strokeWidth="2" />

          {/* Level 2 Leaf Subsets */}
          <g transform="translate(80, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[1, 2]</text>
          </g>
          <g transform="translate(200, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[1]</text>
          </g>
          <g transform="translate(320, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[2]</text>
          </g>
          <g transform="translate(440, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[ ]</text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-pink" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f472b6', fontSize: '13px', marginBottom: '4px' }}>
          Backtracking 3-Step Pattern: Choose → Explore (Recurse) → Un-choose (Backtrack state)
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Total Leaf States for N items = 2^N (Subsets) or N! (Permutations). Pruning eliminates invalid branches early.
        </div>
      </div>
    </div>
  );
}
