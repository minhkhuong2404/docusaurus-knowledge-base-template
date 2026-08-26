import React, { useState } from 'react';

export default function DsaWeek20LruCacheDiagram(): React.JSX.Element {
  const [action, setAction] = useState<string>('init');

  // LRU with Capacity = 3: Head < →  [K1] < →  [K2] < →  [K3] < →  Tail
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          LRU Cache Architecture (Hash Map + Doubly Linked List)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setAction('get')} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#38bdf8', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            get(2) → Move to Head
          </button>
          <button onClick={() => setAction('evict')} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#f87171', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            put(4) → Evict LRU Tail
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 140" style={{ width: '100%', minWidth: '440px', height: 'auto' }}>
          <defs>
            <marker id="lru-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Dummy Head */}
          <g transform="translate(30, 45)">
            <rect width="60" height="35" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" />
            <text x="30" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10">HEAD</text>
          </g>

          {/* Doubly Linked Nodes */}
          {[
            { key: action === 'get' ? 2 : (action === 'evict' ? 4 : 1), val: 'V1', pos: 120, label: 'Most Recent' },
            { key: action === 'get' ? 1 : 2, val: 'V2', pos: 230, label: 'Active' },
            { key: action === 'evict' ? 2 : 3, val: 'V3', pos: 340, label: action === 'evict' ? 'New LRU' : 'Least Recent' },
          ].map((n, i) => (
            <g key={`lru-${i}`} transform={`translate(${n.pos}, 45)`}>
              <rect width="80" height="35" rx="6" fill={i === 0 ? 'rgba(52,211,153,0.25)' : 'rgba(56,189,248,0.15)'} stroke={i === 0 ? '#34d399' : '#38bdf8'} strokeWidth="1.5" />
              <text x="40" y="22" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">[{n.key}: {n.val}]</text>
              <text x="40" y="50" textAnchor="middle" fill={i === 0 ? '#34d399' : '#64748b'} fontSize="9">{n.label}</text>
            </g>
          ))}

          {/* Dummy Tail */}
          <g transform="translate(450, 45)">
            <rect width="60" height="35" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" />
            <text x="30" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10">TAIL</text>
          </g>

          {/* Connectors */}
          <line x1="90" y1="62" x2="120" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
          <line x1="200" y1="62" x2="230" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
          <line x1="310" y1="62" x2="340" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
          <line x1="420" y1="62" x2="450" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-amber" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          O(1) Get and O(1) Put Guarantees via Hash Table Lookup + Doubly Linked List Node Splice.
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          HashMap stores Key → Node reference. Dummy Head and Tail sentinels eliminate edge-case null pointer checks.
        </div>
      </div>
    </div>
  );
}
