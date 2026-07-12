import React, { useState } from 'react';

type Mode = 'sequential' | 'parallel';

export default function ParallelSagaStepsDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('sequential');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mode === 'sequential' ? '#94a3b8' : '#4ade80'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', transition: 'stroke 0.2s' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg><span style={{ color: mode === 'sequential' ? '#94a3b8' : '#4ade80' }}>Parallel Saga Steps</span> — Reducing Saga Completion Time
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('sequential')} style={{ background: mode === 'sequential' ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'sequential' ? '#94a3b8' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: mode === 'sequential' ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>Sequential (Slow)</button>
          <button onClick={() => setMode('parallel')} style={{ background: mode === 'parallel' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'parallel' ? '#4ade80' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: mode === 'parallel' ? '#4ade80' : '#64748b', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>Parallel (Faster) ⚡</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="par-arr-g" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
            <marker id="par-arr-b" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" /></marker>
            <marker id="par-arr-p" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#a78bfa" /></marker>
          </defs>

          {mode === 'sequential' ? (
            <>
              <text x="340" y="16" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#94a3b8', textAnchor: 'middle' }}>Sequential: T1 → T2 → T3 → T4 — Time = T1 + T2 + T3 + T4</text>
              {[
                { label: 'T1: Create Order', x: 20,  color: '#38bdf8', time: '~50ms' },
                { label: 'T2: Reserve Stock', x: 180, color: '#4ade80', time: '~200ms' },
                { label: 'T3: Fraud Check', x: 340, color: '#a78bfa', time: '~300ms' },
                { label: 'T4: Payment', x: 500, color: '#fb923c', time: '~400ms' },
              ].map((s, i, arr) => (
                <g key={s.label}>
                  <rect x={s.x} y={30} width={130} height={50} rx={5} fill={`${s.color}12`} stroke={s.color} strokeWidth="1.5" />
                  <text x={s.x + 65} y={50} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: s.color, textAnchor: 'middle' }}>{s.label}</text>
                  <text x={s.x + 65} y={65} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: `${s.color}80`, textAnchor: 'middle' }}>{s.time}</text>
                  {i < arr.length - 1 && (
                    <>
                      <path id={`seq-${i}`} d={`M ${s.x + 130} 55 L ${arr[i + 1].x} 55`} fill="none" stroke={s.color} strokeWidth="1.5" markerEnd={`url(#par-arr-${['b','g','p','p'][i]})`} className="interactive-diagram-flowing-path" />
                      <circle r="2.5" fill={s.color} opacity="0.8"><animateMotion dur="0.8s" repeatCount="indefinite" begin={`${i * 0.2}s`}><mpath href={`#seq-${i}`} /></animateMotion></circle>
                    </>
                  )}
                </g>
              ))}
              <rect x="20" y="100" width="620" height="40" rx="5" fill="rgba(148,163,184,0.05)" stroke="rgba(148,163,184,0.1)" />
              <text x="340" y="118" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Total time: ~50 + ~200 + ~300 + ~400 = <tspan fill="#f87171" fontWeight="700">~950ms</tspan> (worst case — all serial)</text>
              <text x="340" y="133" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#64748b', textAnchor: 'middle' }}>T3 (fraud check) must complete before T4 (payment) can even start</text>
            </>
          ) : (
            <>
              <text x="340" y="16" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>Parallel: T1 → [T2 ∥ T3] → T4 — Time = T1 + max(T2,T3) + T4 ⚡</text>
              {/* T1 */}
              <rect x="20" y="80" width="130" height="40" rx="5" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="85" y="97" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#38bdf8', textAnchor: 'middle' }}>T1: Create Order</text>
              <text x="85" y="111" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: '#38bdf880', textAnchor: 'middle' }}>~50ms</text>

              {/* Fork arrow */}
              <path id="par-fork-top" d="M 150 92 Q 225 92 225 50" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#par-arr-b)" className="interactive-diagram-flowing-path" />
              <path id="par-fork-bot" d="M 150 100 Q 225 100 225 130" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#par-arr-b)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#38bdf8" opacity="0.8"><animateMotion dur="0.7s" repeatCount="indefinite"><mpath href="#par-fork-top" /></animateMotion></circle>
              <circle r="2.5" fill="#38bdf8" opacity="0.8"><animateMotion dur="0.7s" repeatCount="indefinite" begin="0.35s"><mpath href="#par-fork-bot" /></animateMotion></circle>

              {/* T2 Stock */}
              <rect x="225" y="30" width="145" height="40" rx="5" fill="rgba(74,222,128,0.12)" stroke="#4ade80" strokeWidth="1.5" />
              <text x="297" y="47" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>T2: Reserve Stock</text>
              <text x="297" y="61" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: '#4ade8080', textAnchor: 'middle' }}>~200ms</text>

              {/* T3 Fraud */}
              <rect x="225" y="110" width="145" height="40" rx="5" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="297" y="127" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#a78bfa', textAnchor: 'middle' }}>T3: Fraud Check</text>
              <text x="297" y="141" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: '#a78bfa80', textAnchor: 'middle' }}>~300ms (critical path)</text>

              {/* Join arrows */}
              <path id="par-join-top" d="M 370 50 Q 435 50 435 92" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#par-arr-g)" className="interactive-diagram-flowing-path" />
              <path id="par-join-bot" d="M 370 130 Q 435 130 435 100" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#par-arr-p)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" opacity="0.8"><animateMotion dur="0.7s" repeatCount="indefinite" begin="0.2s"><mpath href="#par-join-top" /></animateMotion></circle>
              <circle r="2.5" fill="#a78bfa" opacity="0.8"><animateMotion dur="0.7s" repeatCount="indefinite" begin="0.55s"><mpath href="#par-join-bot" /></animateMotion></circle>

              {/* T4 Payment */}
              <rect x="435" y="75" width="130" height="40" rx="5" fill="rgba(251,146,60,0.12)" stroke="#fb923c" strokeWidth="1.5" />
              <text x="500" y="92" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#fb923c', textAnchor: 'middle' }}>T4: Payment</text>
              <text x="500" y="106" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: '#fb923c80', textAnchor: 'middle' }}>~400ms</text>
              <path id="par-done" d="M 565 95 L 620 95" fill="none" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#par-arr-p)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#fb923c" opacity="0.8"><animateMotion dur="0.7s" repeatCount="indefinite"><mpath href="#par-done" /></animateMotion></circle>
              <text x="625" y="98" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#4ade80' }}>✅</text>

              <rect x="20" y="165" width="640" height="28" rx="5" fill="rgba(74,222,128,0.05)" stroke="rgba(74,222,128,0.1)" />
              <text x="340" y="180" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle', fontWeight: 700 }}>
                Total time: ~50 + max(200, 300) + ~400 = <tspan>~750ms</tspan> — saves ~200ms per order ⚡
              </text>
            </>
          )}
        </svg>
      </div>
      <p className="interactive-diagram-helper-text">💡 Toggle to see the time saving when independent saga steps run in parallel.</p>
    </div>
  );
}
