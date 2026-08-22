import React, { useState } from 'react';

export default function DsaWeek6BinaryTreeDiagram(): React.JSX.Element {
  const [searchVal, setSearchVal] = useState<number>(7);
  const [traversal, setTraversal] = useState<'bst' | 'bfs'>('bst');

  // BST layout
  const nodes = [
    { id: 4, val: 4, x: 260, y: 35, left: 2, right: 7 },
    { id: 2, val: 2, x: 140, y: 90, left: 1, right: 3 },
    { id: 7, val: 7, x: 380, y: 90, left: 6, right: 9 },
    { id: 1, val: 1, x: 80, y: 150 },
    { id: 3, val: 3, x: 200, y: 150 },
    { id: 6, val: 6, x: 320, y: 150 },
    { id: 9, val: 9, x: 440, y: 150 },
  ];

  const searchPath = searchVal === 7 ? [4, 7] : searchVal === 3 ? [4, 2, 3] : searchVal === 6 ? [4, 7, 6] : [4, 2, 1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <circle cx="6" cy="19" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M12 8v4M8 17l4-5 4 5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Binary Search Tree (BST) Search & BFS Wavefront
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[1, 3, 6, 7].map((v) => (
            <button
              key={v}
              onClick={() => setSearchVal(v)}
              style={{
                padding: '3px 8px',
                borderRadius: '5px',
                border: searchVal === v ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                background: searchVal === v ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
                color: searchVal === v ? '#34d399' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Find {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 190" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Edges */}
          <line x1="260" y1="35" x2="140" y2="90" stroke={searchPath.includes(2) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(2) ? 3 : 1.5} />
          <line x1="260" y1="35" x2="380" y2="90" stroke={searchPath.includes(7) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(7) ? 3 : 1.5} />

          <line x1="140" y1="90" x2="80" y2="150" stroke={searchPath.includes(1) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(1) ? 3 : 1.5} />
          <line x1="140" y1="90" x2="200" y2="150" stroke={searchPath.includes(3) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(3) ? 3 : 1.5} />

          <line x1="380" y1="90" x2="320" y2="150" stroke={searchPath.includes(6) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(6) ? 3 : 1.5} />
          <line x1="380" y1="90" x2="440" y2="150" stroke={searchPath.includes(9) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(9) ? 3 : 1.5} />

          {/* Tree Nodes */}
          {nodes.map((n) => {
            const inPath = searchPath.includes(n.val);
            const isTarget = n.val === searchVal;
            return (
              <g key={`bst-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="18" fill={isTarget ? 'rgba(52,211,153,0.35)' : inPath ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.04)'} stroke={isTarget ? '#34d399' : inPath ? '#38bdf8' : 'rgba(255,255,255,0.2)'} strokeWidth={isTarget ? 3 : inPath ? 2 : 1} />
                <text textAnchor="middle" dy="5" fill={isTarget ? '#34d399' : '#ffffff'} fontSize="13" fontWeight="700">{n.val}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-green" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', marginBottom: '4px' }}>
          Search Path for {searchVal}: {searchPath.join(' → ')} (Height Steps = {searchPath.length})
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          BST search eliminates half of remaining subtrees at each node → O(log N) Time on balanced trees.
        </div>
      </div>
    </div>
  );
}
