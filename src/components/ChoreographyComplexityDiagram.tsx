import React, { useState } from 'react';

export default function ChoreographyComplexityDiagram(): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg><span style={{ color: '#fb923c' }}>When Choreography Becomes Unmanageable</span>
          </h3>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: expanded ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${expanded ? '#fb923c' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: expanded ? '#fb923c' : '#94a3b8', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
          {expanded ? 'Show Simple (OK) ✅' : 'Show Complex (Broken) ❌'}
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          <defs>
            <marker id="chor-arr-g" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
            <marker id="chor-arr-o" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#fb923c" /></marker>
            <marker id="chor-arr-r" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
          </defs>

          {!expanded ? (
            // Simple flow: OK
            <>
              <text x="340" y="18" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>Simple (2 services) — Choreography is fine ✅</text>
              {[
                { x: 60, label: 'OrderService', color: '#38bdf8' },
                { x: 270, label: 'PaymentService', color: '#a78bfa' },
                { x: 480, label: '✅ DONE', color: '#4ade80' },
              ].map(n => (
                <g key={n.label}>
                  <rect x={n.x} y={30} width={130} height={34} rx={5} fill={`${n.color}12`} stroke={n.color} strokeWidth={1.5} />
                  <text x={n.x + 65} y={51} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: n.color, textAnchor: 'middle' }}>{n.label}</text>
                </g>
              ))}
              {[[60 + 130, 270], [270 + 130, 480]].map(([x1, x2], i) => {
                const id = `simple-${i}`;
                return (
                  <g key={id}>
                    <path id={id} d={`M ${x1} 47 L ${x2} 47`} fill="none" stroke="#4ade80" strokeWidth={1.5} markerEnd="url(#chor-arr-g)" className="interactive-diagram-flowing-path" />
                    <circle r="2.5" fill="#4ade80" opacity="0.8"><animateMotion dur="0.9s" repeatCount="indefinite" begin={`${i * 0.45}s`}><mpath href={`#${id}`} /></animateMotion></circle>
                  </g>
                );
              })}
              <text x="340" y="90" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>OrderCreated → PaymentProcessed → Done. Simple, traceable, manageable.</text>
              <rect x="80" y="110" width="520" height="105" rx="6" fill="rgba(74,222,128,0.04)" stroke="rgba(74,222,128,0.1)" />
              <text x="100" y="128" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80' }}>✅ Why choreography works here:</text>
              {['• Only 2 services — easy to trace the event flow in logs',
                '• No conditional branches — one happy path only',
                '• Small team owns both services — event schema changes are visible',
                '• Debugging: check 2 service logs max'].map((t, i) => (
                <text key={i} x="100" y={145 + i * 16} style={{ fontFamily: 'Inter', fontSize: 8, fill: '#94a3b8' }}>{t}</text>
              ))}
            </>
          ) : (
            // Complex — broken
            <>
              <text x="340" y="14" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>Complex (6+ services, conditional) — Choreography degrades ❌</text>
              {/* Nodes */}
              {[
                { x: 10,  y: 25,  w: 90,  label: 'OrderCreated', color: '#38bdf8' },
                { x: 120, y: 25,  w: 100, label: 'StockReserved', color: '#4ade80' },
                { x: 240, y: 10,  w: 120, label: 'FraudCheckPassed', color: '#4ade80' },
                { x: 240, y: 50,  w: 115, label: 'FraudCheckFailed', color: '#f87171' },
                { x: 380, y: 10,  w: 130, label: 'PaymentProcessed', color: '#a78bfa' },
                { x: 380, y: 50,  w: 120, label: 'PaymentFailed', color: '#f87171' },
                { x: 530, y: 10,  w: 120, label: '✅ COMPLETED', color: '#4ade80' },
                { x: 530, y: 50,  w: 120, label: 'StockReleased', color: '#fb923c' },
                { x: 540, y: 90,  w: 130, label: '??? Release Failed', color: '#f87171' },
                { x: 380, y: 90,  w: 140, label: 'OrderFlagged → Review', color: '#facc15' },
                { x: 240, y: 130, w: 120, label: 'ManualApproved?', color: '#a78bfa' },
                { x: 380, y: 130, w: 120, label: 'OrderCancelled', color: '#f87171' },
              ].map(n => (
                <g key={n.label}>
                  <rect x={n.x} y={n.y} width={n.w} height={20} rx={3} fill={`${n.color}10`} stroke={n.color} strokeWidth={1} />
                  <text x={n.x + n.w / 2} y={n.y + 13} style={{ fontFamily: 'Inter', fontSize: 6.5, fontWeight: 700, fill: n.color, textAnchor: 'middle' }}>{n.label}</text>
                </g>
              ))}
              {/* Spaghetti arrows */}
              {[
                [100, 35, 120, 35],
                [220, 35, 240, 20],
                [220, 35, 240, 60],
                [360, 20, 380, 20],
                [360, 60, 380, 60],
                [510, 20, 530, 20],
                [510, 60, 530, 60],
                [510, 60, 540, 100],
                [360, 60, 380, 100],
                [360, 100, 380, 140],
                [360, 140, 240, 140],
              ].map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(251,146,60,0.5)" strokeWidth={1} markerEnd="url(#chor-arr-o)" />
              ))}
              <rect x="10" y="165" width="660" height="55" rx="5" fill="rgba(248,113,113,0.05)" stroke="rgba(248,113,113,0.1)" />
              <text x="25" y="181" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#f87171' }}>❌ Problems at this scale:</text>
              {[
                '• Workflow is invisible — no single place shows the full flow',
                '• Debugging requires tracing events across 6+ services simultaneously at 2 AM',
                '• Adding a new conditional branch requires modifying multiple services',
              ].map((t, i) => (
                <text key={i} x="25" y={196 + i * 13} style={{ fontFamily: 'Inter', fontSize: 8, fill: '#94a3b8' }}>{t}</text>
              ))}
            </>
          )}
        </svg>
      </div>
      <p className="interactive-diagram-helper-text">💡 Toggle to see how choreography degrades from simple linear flows to complex conditional branching.</p>
    </div>
  );
}
