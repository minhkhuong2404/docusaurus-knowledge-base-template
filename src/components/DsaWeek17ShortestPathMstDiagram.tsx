import React, { useState } from 'react';

export default function DsaWeek17ShortestPathMstDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const steps = [
    { dist: [0, '∞', '∞', '∞'], relaxed: 'Init: Dist[0]=0, all other nodes = ∞.', desc: 'Start at Node 0. Push (0, Node 0) to Min-Priority Queue.' },
    { dist: [0, 4, 2, '∞'], relaxed: 'Relax edges from Node 0: Dist[1]=4, Dist[2]=2.', desc: 'Node 2 has smaller distance (2 &lt; 4) → Pop Node 2 next.' },
    { dist: [0, 3, 2, 7], relaxed: 'Relax edges from Node 2: Dist[1] updated to 2 + 1 = 3 (3 &lt; 4)! Dist[3] = 7.', desc: 'Greedy distance relaxation updates optimal shortest path.' },
    { dist: [0, 3, 2, 5], relaxed: 'Relax edges from Node 1: Dist[3] updated to 3 + 2 = 5 (5 &lt; 7)! Complete.', desc: 'All shortest distances finalized in O((V + E) log V).' },
  ];

  const active = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Dijkstra's Shortest Path Distance Relaxation
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#34d399', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            Next ⏭
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 160" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
          {/* Weighted Edges */}
          <line x1="80" y1="80" x2="220" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="140" y="50" fill="#fbbf24" fontSize="11" fontWeight="700">w=4</text>

          <line x1="80" y1="80" x2="220" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="140" y="115" fill="#fbbf24" fontSize="11" fontWeight="700">w=2</text>

          <line x1="220" y1="120" x2="220" y2="40" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" />
          <text x="235" y="85" fill="#34d399" fontSize="11" fontWeight="700">w=1</text>

          <line x1="220" y1="40" x2="380" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="310" y="55" fill="#fbbf24" fontSize="11" fontWeight="700">w=2</text>

          {/* Nodes with current dist */}
          {[
            { id: 0, x: 80, y: 80 },
            { id: 1, x: 220, y: 40 },
            { id: 2, x: 220, y: 120 },
            { id: 3, x: 380, y: 80 },
          ].map((n) => (
            <g key={`dijk-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
              <circle r="22" fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">N{n.id}</text>
              <text x="0" y="36" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">dist: {active.dist[n.id]}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-green" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', marginBottom: '4px' }}>
          {active.relaxed}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {active.desc}
        </div>
      </div>
    </div>
  );
}
