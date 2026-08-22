import React, { useState, useEffect } from 'react';

export default function DsaWeek2TwoPointersDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mode, setMode] = useState<'twoptr' | 'window'>('twoptr');

  // Mode 1: Two Sum II (Sorted Array: target = 13)
  const nums2Sum = [2, 3, 5, 8, 11, 15];
  const steps2Sum = [
    { left: 0, right: 5, sum: 17, action: 'Sum = 2 + 15 = 17 > 13. Move Right pointer Left (R--)', targetMet: false },
    { left: 0, right: 4, sum: 13, action: 'Sum = 2 + 11 = 13 == 13. TARGET FOUND! Indices [0, 4]', targetMet: true },
  ];

  // Mode 2: Dynamic Sliding Window (Max sum subarray of size <= 3 or target sum <= 8)
  const windowArray = [2, 1, 5, 2, 3, 2];
  const stepsWindow = [
    { L: 0, R: 0, win: [2], sum: 2, desc: 'Expand right pointer: Window = [2], Sum = 2' },
    { L: 0, R: 1, win: [2, 1], sum: 3, desc: 'Expand right: Window = [2, 1], Sum = 3' },
    { L: 0, R: 2, win: [2, 1, 5], sum: 8, desc: 'Expand right: Window = [2, 1, 5], Sum = 8 (Target reached!)' },
    { L: 1, R: 2, win: [1, 5], sum: 6, desc: 'Shrink left pointer: Window = [1, 5], Sum = 6' },
    { L: 1, R: 3, win: [1, 5, 2], sum: 8, desc: 'Expand right: Window = [1, 5, 2], Sum = 8' },
  ];

  const steps = mode === 'twoptr' ? steps2Sum : stepsWindow;

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= steps.length - 1) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps, mode]);

  const active = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Two Pointers & Sliding Window Simulation
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setMode('twoptr'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: mode === 'twoptr' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', background: mode === 'twoptr' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)', color: mode === 'twoptr' ? '#34d399' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Convergent Two Pointers
          </button>
          <button
            onClick={() => { setMode('window'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: mode === 'window' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', background: mode === 'window' ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)', color: mode === 'window' ? '#fbbf24' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Sliding Window
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: isPlaying ? '#f87171' : '#34d399', color: '#090b14', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.max(0, s - 1)); }} disabled={currentStep === 0} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.min(steps.length - 1, s + 1)); }} disabled={currentStep >= steps.length - 1} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}>
            Next ⏭
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content-secondary)', fontSize: '12px', cursor: 'pointer' }}>
            🔄 Reset
          </button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Step <strong>{currentStep + 1}</strong> of <strong>{steps.length}</strong>
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 650 150" style={{ width: '100%', minWidth: '500px', height: 'auto' }}>
          <defs>
            <marker id="arrow-down-w2" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 0 L 5 10 L 9 0 z" fill="#38bdf8" />
            </marker>
          </defs>

          {mode === 'twoptr' ? (
            <>
              {nums2Sum.map((val, i) => {
                const s = active as typeof steps2Sum[0];
                const isLeft = i === s.left;
                const isRight = i === s.right;
                const isTarget = s.targetMet && (isLeft || isRight);
                return (
                  <g key={`num-${i}`} transform={`translate(${100 + i * 80}, 50)`}>
                    <rect width="64" height="42" rx="8" fill={isTarget ? 'rgba(52,211,153,0.3)' : isLeft || isRight ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)'} stroke={isTarget ? '#34d399' : isLeft || isRight ? '#38bdf8' : 'rgba(255,255,255,0.12)'} strokeWidth={isTarget || isLeft || isRight ? 2 : 1} />
                    <text x="32" y="26" textAnchor="middle" fill={isTarget ? '#34d399' : isLeft || isRight ? '#38bdf8' : '#e2e8f0'} fontSize="15" fontWeight="700">{val}</text>
                    <text x="32" y="58" textAnchor="middle" fill="#64748b" fontSize="10">i={i}</text>

                    {isLeft && (
                      <g transform="translate(32, -15)">
                        <text x="0" y="-12" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">LEFT</text>
                        <path d="M 0 -8 L 0 5" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-down-w2)" />
                      </g>
                    )}
                    {isRight && (
                      <g transform="translate(32, -15)">
                        <text x="0" y="-12" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">RIGHT</text>
                        <path d="M 0 -8 L 0 5" stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow-down-w2)" />
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {windowArray.map((val, i) => {
                const s = active as typeof stepsWindow[0];
                const inWin = i >= s.L && i <= s.R;
                return (
                  <g key={`win-${i}`} transform={`translate(${100 + i * 75}, 50)`}>
                    <rect width="60" height="42" rx="8" fill={inWin ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.03)'} stroke={inWin ? '#fbbf24' : 'rgba(255,255,255,0.12)'} strokeWidth={inWin ? 2 : 1} />
                    <text x="30" y="26" textAnchor="middle" fill={inWin ? '#fbbf24' : '#e2e8f0'} fontSize="15" fontWeight="700">{val}</text>
                    <text x="30" y="58" textAnchor="middle" fill="#64748b" fontSize="10">i={i}</text>
                    {i === s.L && (
                      <text x="30" y="-10" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">L ↓</text>
                    )}
                    {i === s.R && (
                      <text x="30" y="-10" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">R ↓</text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* Action details */}
      <div className="interactive-diagram-details-card details-green" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: mode === 'twoptr' ? '#34d399' : '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          {mode === 'twoptr' ? (active as any).action : (active as any).desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {mode === 'twoptr' ? `Current Sum: ${(active as any).sum} vs Target: 13 | Single-pass O(N) convergence.` : `Window sum: ${(active as any).sum} | Expands right and contracts left in amortized O(N).`}
        </div>
      </div>
    </div>
  );
}
