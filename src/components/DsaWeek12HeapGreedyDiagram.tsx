import React, { useState } from 'react';

export default function DsaWeek12HeapGreedyDiagram(): React.JSX.Element {
  const [heapType, setHeapType] = useState<'min' | 'max'>('min');

  // Min-Heap Array representation: [2, 3, 5, 8, 9]
  // Parent = (i-1)//2, Left = 2*i + 1, Right = 2*i + 2
  const minHeap = [
    { val: 2, x: 260, y: 35 },
    { val: 3, x: 160, y: 85 },
    { val: 5, x: 360, y: 85 },
    { val: 8, x: 110, y: 140 },
    { val: 9, x: 210, y: 140 },
  ];

  const maxHeap = [
    { val: 9, x: 260, y: 35 },
    { val: 8, x: 160, y: 85 },
    { val: 5, x: 360, y: 85 },
    { val: 3, x: 110, y: 140 },
    { val: 2, x: 210, y: 140 },
  ];

  const nodes = heapType === 'min' ? minHeap : maxHeap;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 22 22 22" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Binary Heap Array-Tree Structure & Sift Mechanics
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setHeapType('min')} style={{ padding: '4px 10px', borderRadius: '6px', border: heapType === 'min' ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.1)', background: heapType === 'min' ? 'rgba(249,115,22,0.2)' : 'transparent', color: heapType === 'min' ? '#f97316' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            Min-Heap (Root Min)
          </button>
          <button onClick={() => setHeapType('max')} style={{ padding: '4px 10px', borderRadius: '6px', border: heapType === 'max' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: heapType === 'max' ? 'rgba(56,189,248,0.2)' : 'transparent', color: heapType === 'max' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            Max-Heap (Root Max)
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 180" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Edges */}
          <line x1="260" y1="35" x2="160" y2="85" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="260" y1="35" x2="360" y2="85" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="160" y1="85" x2="110" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="160" y1="85" x2="210" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={`hp-${i}`} transform={`translate(${n.x}, ${n.y})`}>
              <circle r="20" fill={i === 0 ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.04)'} stroke={i === 0 ? '#f97316' : '#38bdf8'} strokeWidth="2" />
              <text textAnchor="middle" dy="5" fill="#ffffff" fontSize="13" fontWeight="700">{n.val}</text>
              <text x="0" y="32" textAnchor="middle" fill="#64748b" fontSize="9">idx={i}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-orange" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f97316', fontSize: '13px', marginBottom: '4px' }}>
          Peek: O(1) | Push (Sift-Up): O(log N) | Pop Root (Sift-Down): O(log N)
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Array Memory Layout: [ {nodes.map((n) => n.val).join(', ')} ] eliminates object pointer overhead.
        </div>
      </div>
    </div>
  );
}
