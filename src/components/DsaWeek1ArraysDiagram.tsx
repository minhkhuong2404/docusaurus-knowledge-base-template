import React, { useState, useEffect } from 'react';

export default function DsaWeek1ArraysDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'build' | 'query'>('build');

  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  const prefix = [3, 4, 8, 9, 14, 23, 25, 31];

  const buildSteps = [
    { idx: 0, formula: 'Prefix[0] = nums[0] = 3', val: 3, desc: 'Base step: First element equals nums[0].' },
    { idx: 1, formula: 'Prefix[1] = Prefix[0] + nums[1] = 3 + 1 = 4', val: 4, desc: 'Accumulate sum of first 2 elements.' },
    { idx: 2, formula: 'Prefix[2] = Prefix[1] + nums[2] = 4 + 4 = 8', val: 8, desc: 'Accumulate sum of first 3 elements.' },
    { idx: 3, formula: 'Prefix[3] = Prefix[2] + nums[3] = 8 + 1 = 9', val: 9, desc: 'Accumulate sum of first 4 elements.' },
    { idx: 4, formula: 'Prefix[4] = Prefix[3] + nums[4] = 9 + 5 = 14', val: 14, desc: 'Accumulate sum of first 5 elements.' },
    { idx: 5, formula: 'Prefix[5] = Prefix[4] + nums[5] = 14 + 9 = 23', val: 23, desc: 'Accumulate sum of first 6 elements.' },
    { idx: 6, formula: 'Prefix[6] = Prefix[5] + nums[6] = 23 + 2 = 25', val: 25, desc: 'Accumulate sum of first 7 elements.' },
    { idx: 7, formula: 'Prefix[7] = Prefix[6] + nums[7] = 25 + 6 = 31', val: 31, desc: 'Complete Prefix Sum array: Total sum = 31.' },
  ];

  const querySteps = [
    { L: 2, R: 5, formula: 'Sum(2..5) = Prefix[5] - Prefix[1] = 23 - 4 = 19', expected: '4 + 1 + 5 + 9 = 19', desc: 'Query range [2..5] in O(1) time without looping!' },
    { L: 0, R: 4, formula: 'Sum(0..4) = Prefix[4] = 14', expected: '3 + 1 + 4 + 1 + 5 = 14', desc: 'Query starting at index 0 returns Prefix[R] directly.' },
    { L: 3, R: 7, formula: 'Sum(3..7) = Prefix[7] - Prefix[2] = 31 - 8 = 23', expected: '1 + 5 + 9 + 2 + 6 = 23', desc: 'Query suffix range [3..7] in O(1) time.' },
  ];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const maxSteps = activeMode === 'build' ? buildSteps.length - 1 : querySteps.length - 1;
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeMode]);

  const activeBuild = buildSteps[Math.min(currentStep, buildSteps.length - 1)];
  const activeQuery = querySteps[Math.min(currentStep, querySteps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Prefix Sum Array & Range Query Simulation
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setActiveMode('build'); setCurrentStep(0); setIsPlaying(false); }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: activeMode === 'build' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeMode === 'build' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeMode === 'build' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Array Construction
          </button>
          <button
            onClick={() => { setActiveMode('query'); setCurrentStep(0); setIsPlaying(false); }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: activeMode === 'query' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
              background: activeMode === 'query' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeMode === 'query' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            O(1) Range Query
          </button>
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: isPlaying ? '#f87171' : '#38bdf8', color: '#090b14', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.max(0, s - 1)); }}
            disabled={currentStep === 0}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}
          >
            ⏮ Prev
          </button>
          <button
            onClick={() => {
              const maxSteps = activeMode === 'build' ? buildSteps.length - 1 : querySteps.length - 1;
              setIsPlaying(false);
              setCurrentStep((s) => Math.min(maxSteps, s + 1));
            }}
            disabled={currentStep >= (activeMode === 'build' ? buildSteps.length - 1 : querySteps.length - 1)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}
          >
            Next ⏭
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content-secondary)', fontSize: '12px', cursor: 'pointer' }}
          >
            🔄 Reset
          </button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Step <strong>{currentStep + 1}</strong> of <strong>{activeMode === 'build' ? buildSteps.length : querySteps.length}</strong>
        </span>
      </div>

      {/* SVG Visualization Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 680 180" style={{ width: '100%', minWidth: '550px', height: 'auto' }}>
          <defs>
            <pattern id="dot-grid-w1" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.04)" />
            </pattern>
            <marker id="arrow-w1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-w1)" rx="8" />

          {/* Original Array Row */}
          <text x="20" y="38" fill="#94a3b8" fontSize="11" fontWeight="700">Original nums[ ]</text>
          {nums.map((num, i) => {
            const isHighlight = activeMode === 'build' ? i === activeBuild.idx : (i >= activeQuery.L && i <= activeQuery.R);
            return (
              <g key={`num-${i}`} transform={`translate(${120 + i * 65}, 15)`}>
                <rect width="52" height="34" rx="6" fill={isHighlight ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.03)'} stroke={isHighlight ? '#38bdf8' : 'rgba(255,255,255,0.12)'} strokeWidth={isHighlight ? 2 : 1} />
                <text x="26" y="22" textAnchor="middle" fill={isHighlight ? '#38bdf8' : '#e2e8f0'} fontSize="13" fontWeight="700">{num}</text>
                <text x="26" y="46" textAnchor="middle" fill="#64748b" fontSize="9">i={i}</text>
              </g>
            );
          })}

          {/* Animated Transition Arrow */}
          {activeMode === 'build' && (
            <path d={`M ${146 + activeBuild.idx * 65} 55 L ${146 + activeBuild.idx * 65} 95`} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-w1)" />
          )}

          {/* Prefix Sum Array Row */}
          <text x="20" y="128" fill="#34d399" fontSize="11" fontWeight="700">Prefix Sum[ ]</text>
          {prefix.map((pVal, i) => {
            const isFilled = activeMode === 'build' ? i <= activeBuild.idx : true;
            const isCurrent = activeMode === 'build' ? i === activeBuild.idx : (i === activeQuery.R || i === activeQuery.L - 1);
            return (
              <g key={`pref-${i}`} transform={`translate(${120 + i * 65}, 105)`}>
                <rect width="52" height="34" rx="6" fill={isCurrent ? 'rgba(52,211,153,0.25)' : isFilled ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)'} stroke={isCurrent ? '#34d399' : isFilled ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'} strokeWidth={isCurrent ? 2 : 1} />
                <text x="26" y="22" textAnchor="middle" fill={isFilled ? '#34d399' : '#475569'} fontSize="13" fontWeight="700">
                  {isFilled ? pVal : '-'}
                </text>
                <text x="26" y="46" textAnchor="middle" fill="#64748b" fontSize="9">P[{i}]</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info & Metrics Card */}
      <div className="interactive-diagram-details-card details-blue" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: activeMode === 'build' ? '#38bdf8' : '#34d399', fontSize: '13px' }}>
            {activeMode === 'build' ? activeBuild.formula : activeQuery.formula}
          </span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: '#fbbf24', fontWeight: 600 }}>
            Time: {activeMode === 'build' ? 'O(N) build' : 'O(1) lookup'} | Space: O(N)
          </span>
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
          {activeMode === 'build' ? activeBuild.desc : `${activeQuery.desc} Expected Sum: ${activeQuery.expected}`}
        </div>
      </div>
    </div>
  );
}
