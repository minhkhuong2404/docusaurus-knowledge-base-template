import React, { useState } from 'react';

export default function DsaWeek8TopologicalSortDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const steps = [
    { inDegree: [0, 1, 1, 2], queue: [0], processed: [], desc: 'Calculate In-Degrees: [0:0, 1:1, 2:1, 3:2]. Node 0 has in-degree 0 → Enqueue [0].' },
    { inDegree: [0, 0, 0, 2], queue: [1, 2], processed: [0], desc: 'Pop Node 0 → Decrement neighbors Node 1 & Node 2 in-degrees to 0. Enqueue [1, 2].' },
    { inDegree: [0, 0, 0, 1], queue: [2], processed: [0, 1], desc: 'Pop Node 1 → Decrement neighbor Node 3 in-degree to 1. Queue: [2].' },
    { inDegree: [0, 0, 0, 0], queue: [3], processed: [0, 1, 2], desc: 'Pop Node 2 → Decrement Node 3 in-degree to 0. Enqueue [3].' },
    { inDegree: [0, 0, 0, 0], queue: [], processed: [0, 1, 2, 3], desc: 'Pop Node 3 → Valid Topological Ordering: [0, 1, 2, 3]! DAG verified (no cycle).' },
  ];

  const active = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Kahn's Topological Sort (In-Degree Reduction Engine)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#2dd4bf', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            Next ⏭
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 160" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          <defs>
            <marker id="topo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2dd4bf" />
            </marker>
          </defs>

          {/* Directed Edges */}
          <line x1="100" y1="80" x2="200" y2="40" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />
          <line x1="100" y1="80" x2="200" y2="120" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />
          <line x1="240" y1="40" x2="340" y2="80" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />
          <line x1="240" y1="120" x2="340" y2="80" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />

          {/* DAG Nodes with In-Degrees */}
          {[
            { id: 0, x: 80, y: 80 },
            { id: 1, x: 220, y: 40 },
            { id: 2, x: 220, y: 120 },
            { id: 3, x: 360, y: 80 },
          ].map((n) => {
            const isDone = active.processed.includes(n.id);
            const inDeg = active.inDegree[n.id];
            return (
              <g key={`topo-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="22" fill={isDone ? 'rgba(52,211,153,0.3)' : inDeg === 0 ? 'rgba(45,212,191,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isDone ? '#34d399' : inDeg === 0 ? '#2dd4bf' : 'rgba(255,255,255,0.15)'} strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="13" fontWeight="700">N{n.id}</text>
                <text x="0" y="36" textAnchor="middle" fill="#94a3b8" fontSize="10">in-deg: {inDeg}</text>
              </g>
            );
          })}

          {/* Queue box */}
          <g transform="translate(420, 40)">
            <text x="40" y="-10" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="700">In-Degree 0 Queue</text>
            <rect width="80" height="70" rx="6" fill="rgba(45,212,191,0.05)" stroke="#2dd4bf" strokeDasharray="3 3" />
            <text x="40" y="40" textAnchor="middle" fill="#2dd4bf" fontSize="14" fontWeight="700">
              {active.queue.length > 0 ? `[ ${active.queue.join(', ')} ]` : 'Empty'}
            </text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-teal" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#2dd4bf', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Processed Order: [ {active.processed.join(', ')} ] | If processed count is less than V, a cycle exists.
        </div>
      </div>
    </div>
  );
}
