import React, { useState } from 'react';

type FlowMode = 'happy' | 'failure';

export default function SagaCoreFlowDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<FlowMode>('happy');

  const steps = [
    { id: 'T1', label: 'T1: Create Order', sub: 'order-service', color: '#38bdf8' },
    { id: 'T2', label: 'T2: Reserve Stock', sub: 'inventory-service', color: '#4ade80' },
    { id: 'T3', label: 'T3: Process Payment', sub: 'payment-service', color: '#a78bfa' },
    { id: 'T4', label: 'T4: Send Confirmation', sub: 'notification-service', color: '#fb923c' },
  ];

  const compSteps = [
    { id: 'C2', label: 'C2: Release Stock', color: '#f87171' },
    { id: 'C1', label: 'C1: Cancel Order', color: '#f87171' },
  ];

  const boxW = 130, boxH = 40, gapX = 30;
  const totalW = steps.length * boxW + (steps.length - 1) * gapX;
  const startX = (680 - totalW) / 2;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mode === 'happy' ? '#4ade80' : '#f87171'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2, verticalAlign: 'middle', transition: 'stroke 0.2s' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span style={{ color: mode === 'happy' ? '#4ade80' : '#f87171' }}>Saga Core Mechanics</span> — {mode === 'happy' ? 'Happy Path' : 'Compensation Path'}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('happy')} style={{ background: mode === 'happy' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'happy' ? '#4ade80' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: mode === 'happy' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>Happy Path ✅</button>
          <button onClick={() => setMode('failure')} style={{ background: mode === 'failure' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'failure' ? '#f87171' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: mode === 'failure' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>Failure + Compensation ❌</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="saga-arr-fwd" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
            <marker id="saga-arr-comp" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
            <marker id="saga-arr-fail" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
          </defs>

          {/* Forward steps */}
          {steps.map((step, i) => {
            const x = startX + i * (boxW + gapX);
            const isFailed = mode === 'failure' && i === 2; // T3 fails
            const isCompleted = mode === 'happy' || (mode === 'failure' && i < 2);
            return (
              <g key={step.id}>
                <rect x={x} y={20} width={boxW} height={boxH} rx={5}
                  fill={isFailed ? 'rgba(248,113,113,0.12)' : isCompleted ? `${step.color}15` : 'rgba(15,23,42,0.6)'}
                  stroke={isFailed ? '#f87171' : isCompleted ? step.color : 'rgba(255,255,255,0.07)'}
                  strokeWidth={1.5} />
                <text x={x + boxW / 2} y={36} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: isFailed ? '#f87171' : isCompleted ? step.color : '#475569', textAnchor: 'middle' }}>{step.label}</text>
                <text x={x + boxW / 2} y={50} style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#475569', textAnchor: 'middle' }}>{step.sub}</text>
                {isFailed && <text x={x + boxW / 2} y={65} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>❌ FAILS</text>}
                {mode === 'happy' && i === 3 && <text x={x + boxW / 2} y={68} style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#4ade80', textAnchor: 'middle' }}>COMPLETED ✅</text>}

                {/* Forward arrow */}
                {i < 3 && (() => {
                  const x2 = startX + (i + 1) * (boxW + gapX);
                  const pathId = `saga-fwd-${i}`;
                  const showArrow = mode === 'happy' || (mode === 'failure' && i < 2);
                  if (!showArrow) return null;
                  return (
                    <g key={pathId}>
                      <path id={pathId} d={`M ${x + boxW} 40 L ${x2} 40`} fill="none" stroke="#4ade80" strokeWidth={1.5} markerEnd="url(#saga-arr-fwd)" className="interactive-diagram-flowing-path" />
                      <circle r="2.5" fill="#4ade80" opacity="0.8"><animateMotion dur="0.8s" repeatCount="indefinite" begin={`${i * 0.2}s`}><mpath href={`#${pathId}`} /></animateMotion></circle>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Failure mode: compensation arrows (going backwards, below) */}
          {mode === 'failure' && (
            <>
              {/* Compensation boxes */}
              {compSteps.map((cs, i) => {
                const x = startX + (1 - i) * (boxW + gapX);
                return (
                  <g key={cs.id}>
                    <rect x={x} y={130} width={boxW} height={36} rx={5} fill="rgba(248,113,113,0.1)" stroke="#f87171" strokeWidth={1.5} />
                    <text x={x + boxW / 2} y={148} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#f87171', textAnchor: 'middle' }}>{cs.label}</text>
                    <text x={x + boxW / 2} y={160} style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>compensating transaction</text>
                  </g>
                );
              })}

              {/* Down arrow from T3 fail to C2 */}
              <path id="saga-down" d={`M ${startX + 2 * (boxW + gapX) + boxW / 2} 70 L ${startX + 1 * (boxW + gapX) + boxW / 2} 130`} fill="none" stroke="#f87171" strokeWidth={1.5} markerEnd="url(#saga-arr-comp)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#f87171" opacity="0.8"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#saga-down" /></animateMotion></circle>

              {/* C2 → C1 */}
              <path id="saga-comp-1" d={`M ${startX + 1 * (boxW + gapX)} 148 L ${startX + 0 * (boxW + gapX) + boxW} 148`} fill="none" stroke="#f87171" strokeWidth={1.5} markerEnd="url(#saga-arr-comp)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#f87171" opacity="0.8"><animateMotion dur="0.8s" repeatCount="indefinite" begin="0.4s"><mpath href="#saga-comp-1" /></animateMotion></circle>

              {/* Final state */}
              <text x={startX - 10} y={193} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#f87171' }}>Final: Order=CANCELLED, Stock=released, Payment=not charged ✅</text>
            </>
          )}
        </svg>
      </div>

      <p className="interactive-diagram-helper-text">💡 Switch between paths to see how compensating transactions execute in reverse when a step fails.</p>
    </div>
  );
}
