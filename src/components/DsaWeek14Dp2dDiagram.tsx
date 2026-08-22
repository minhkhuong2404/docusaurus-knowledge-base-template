import React, { useState } from 'react';

export default function DsaWeek14Dp2dDiagram(): React.JSX.Element {
  const [activeCell, setActiveCell] = useState<{ r: number; c: number }>({ r: 2, c: 2 });

  // Grid for LCS ("ABC", "AC")
  const s1 = " ABC";
  const s2 = " AC";

  const matrix = [
    [0, 0, 0],
    [0, 1, 1],
    [0, 1, 1],
    [0, 1, 2],
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          2D DP Matrix Grid Transition (LCS: "ABC" vs "AC")
        </span>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 450 170" style={{ width: '100%', minWidth: '380px', height: 'auto' }}>
          {/* Header columns */}
          {s2.split('').map((ch, cIdx) => (
            <text key={`col-${cIdx}`} x={120 + cIdx * 70} y="25" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">
              {ch === ' ' ? '∅' : ch}
            </text>
          ))}

          {/* Matrix rows */}
          {matrix.map((row, rIdx) => (
            <g key={`row-${rIdx}`} transform={`translate(50, ${40 + rIdx * 30})`}>
              <text x="20" y="20" fill="#38bdf8" fontSize="12" fontWeight="700">{s1[rIdx] === ' ' ? '∅' : s1[rIdx]}</text>
              {row.map((val, cIdx) => {
                const isSelected = activeCell.r === rIdx && activeCell.c === cIdx;
                return (
                  <g key={`cell-${rIdx}-${cIdx}`} transform={`translate(${50 + cIdx * 70}, 0)`} onClick={() => setActiveCell({ r: rIdx, c: cIdx })} style={{ cursor: 'pointer' }}>
                    <rect width="50" height="24" rx="4" fill={isSelected ? 'rgba(45,212,191,0.3)' : 'rgba(255,255,255,0.03)'} stroke={isSelected ? '#2dd4bf' : 'rgba(255,255,255,0.1)'} />
                    <text x="25" y="16" textAnchor="middle" fill={isSelected ? '#2dd4bf' : '#e2e8f0'} fontSize="11" fontWeight="700">{val}</text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-teal" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#2dd4bf', fontSize: '13px', marginBottom: '4px' }}>
          Cell [{activeCell.r}][{activeCell.c}]: Value = {matrix[activeCell.r][activeCell.c]}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          State Transition: if s1[i] == s2[j] → 1 + dp[i-1][j-1] else max(dp[i-1][j], dp[i][j-1]). O(M * N) Time & Space.
        </div>
      </div>
    </div>
  );
}
