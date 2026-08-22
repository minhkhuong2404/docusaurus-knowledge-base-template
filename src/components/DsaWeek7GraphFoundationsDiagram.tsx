import React, { useState } from 'react';

export default function DsaWeek7GraphFoundationsDiagram(): React.JSX.Element {
  const [traversal, setTraversal] = useState<'bfs' | 'dfs'>('bfs');

  const bfsOrder = [0, 1, 2, 3, 4];
  const dfsOrder = [0, 1, 3, 4, 2];

  const order = traversal === 'bfs' ? bfsOrder : dfsOrder;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <line x1="9" y1="6" x2="15" y2="6" />
          <line x1="6" y1="9" x2="6" y2="15" />
          <line x1="18" y1="9" x2="18" y2="15" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Graph Traversal Engine (BFS Queue vs DFS Recursion)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setTraversal('bfs')} style={{ padding: '4px 10px', borderRadius: '6px', border: traversal === 'bfs' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: traversal === 'bfs' ? 'rgba(56,189,248,0.2)' : 'transparent', color: traversal === 'bfs' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            BFS (Level Queue)
          </button>
          <button onClick={() => setTraversal('dfs')} style={{ padding: '4px 10px', borderRadius: '6px', border: traversal === 'dfs' ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)', background: traversal === 'dfs' ? 'rgba(244,114,182,0.2)' : 'transparent', color: traversal === 'dfs' ? '#f472b6' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            DFS (Deep Stack)
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 180" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Edges */}
          <line x1="80" y1="90" x2="200" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="80" y1="90" x2="200" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="200" y1="40" x2="340" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="340" y1="40" x2="440" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="200" y1="140" x2="440" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

          {/* Graph Nodes with visit order badge */}
          {[
            { id: 0, x: 80, y: 90, label: 'Node 0 (Start)' },
            { id: 1, x: 200, y: 40, label: 'Node 1' },
            { id: 2, x: 200, y: 140, label: 'Node 2' },
            { id: 3, x: 340, y: 40, label: 'Node 3' },
            { id: 4, x: 440, y: 90, label: 'Node 4' },
          ].map((n) => {
            const visitRank = order.indexOf(n.id) + 1;
            return (
              <g key={`gnode-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="22" fill={traversal === 'bfs' ? 'rgba(56,189,248,0.25)' : 'rgba(244,114,182,0.25)'} stroke={traversal === 'bfs' ? '#38bdf8' : '#f472b6'} strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">{n.id}</text>
                <circle cx="16" cy="-16" r="10" fill="#fbbf24" />
                <text x="16" y="-13" textAnchor="middle" fill="#090b14" fontSize="9" fontWeight="800">#{visitRank}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: traversal === 'bfs' ? '#38bdf8' : '#f472b6', fontSize: '13px', marginBottom: '4px' }}>
          {traversal === 'bfs' ? 'BFS Visit Order: 0 → 1 → 2 → 3 → 4 (Shortest unweighted path guaranteed)' : 'DFS Visit Order: 0 → 1 → 3 → 4 → 2 (Deep exploration with backtracking)'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Time Complexity: O(V + E) | Space Complexity: O(V) for visited set and queue/recursion stack.
        </div>
      </div>
    </div>
  );
}
