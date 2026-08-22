import React, { useState, useEffect } from 'react';

export default function DsaWeek3LinkedListDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [algo, setAlgo] = useState<'cycle' | 'reverse'>('cycle');

  // Cycle Detection (Floyd's Tortoise & Hare)
  const nodesCycle = [
    { id: 0, val: 3, x: 80, y: 80 },
    { id: 1, val: 2, x: 180, y: 80 },
    { id: 2, val: 0, x: 280, y: 80 },
    { id: 3, val: -4, x: 380, y: 80 },
  ];
  // Node 3 loops back to Node 1

  const cycleSteps = [
    { slow: 0, fast: 0, desc: 'Init: Slow (Tortoise, 1x) and Fast (Hare, 2x) both start at Head (Node 3).' },
    { slow: 1, fast: 2, desc: 'Step 1: Slow advances 1 step (Node 2), Fast advances 2 steps (Node 0).' },
    { slow: 2, fast: 1, desc: 'Step 2: Slow moves to Node 0, Fast loops back to Node 2.' },
    { slow: 3, fast: 3, desc: 'Step 3: Slow moves to Node -4, Fast loops to Node -4. SLOW == FAST → CYCLE DETECTED! 🎉' },
  ];

  // In-Place Reversal: 1 → 2 → 3 → 4 → null
  const reverseSteps = [
    { prev: 'null', curr: 1, next: 2, desc: 'Init: prev = null, curr = Node(1), next = Node(2)' },
    { prev: 1, curr: 2, next: 3, desc: 'curr.next reversed to point to null. prev becomes Node(1), curr becomes Node(2).' },
    { prev: 2, curr: 3, next: 4, desc: 'curr.next reversed to point to Node(1). prev becomes Node(2), curr becomes Node(3).' },
    { prev: 3, curr: 4, next: 'null', desc: 'curr.next reversed to point to Node(2). prev becomes Node(3), curr becomes Node(4).' },
    { prev: 4, curr: 'null', next: 'null', desc: 'Finished! New Head is Node(4). Fully reversed in O(N) time and O(1) auxiliary space.' },
  ];

  const steps = algo === 'cycle' ? cycleSteps : reverseSteps;

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
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps, algo]);

  const active = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
          <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Linked List Pointer Mechanics (Cycle & In-Place Reversal)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setAlgo('cycle'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: algo === 'cycle' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', background: algo === 'cycle' ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.04)', color: algo === 'cycle' ? '#a78bfa' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Floyd's Cycle (2x Fast/Slow)
          </button>
          <button
            onClick={() => { setAlgo('reverse'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: algo === 'reverse' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: algo === 'reverse' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)', color: algo === 'reverse' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            In-Place Reversal (3 Pointers)
          </button>
        </div>
      </div>

      {/* Playback bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: isPlaying ? '#f87171' : '#a78bfa', color: '#090b14', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
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
        <svg viewBox="0 0 550 160" style={{ width: '100%', minWidth: '450px', height: 'auto' }}>
          <defs>
            <marker id="ll-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="cycle-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
            </marker>
          </defs>

          {algo === 'cycle' ? (
            <>
              {/* Directed edges */}
              <line x1="105" y1="80" x2="155" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ll-arrow)" />
              <line x1="205" y1="80" x2="255" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ll-arrow)" />
              <line x1="305" y1="80" x2="355" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ll-arrow)" />
              {/* Cycle back edge */}
              <path d="M 380 60 C 380 15, 180 15, 180 55" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#cycle-arrow)" />
              <text x="280" y="25" fill="#f87171" fontSize="10" fontWeight="700" textAnchor="middle">Cycle Back Edge</text>

              {/* Nodes */}
              {nodesCycle.map((n) => {
                const s = active as typeof cycleSteps[0];
                const isSlow = s.slow === n.id;
                const isFast = s.fast === n.id;
                const isMatch = isSlow && isFast;

                return (
                  <g key={`node-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                    <circle r="22" fill={isMatch ? 'rgba(52,211,153,0.3)' : isSlow || isFast ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)'} stroke={isMatch ? '#34d399' : isSlow || isFast ? '#a78bfa' : 'rgba(255,255,255,0.18)'} strokeWidth={isMatch ? 3 : 2} />
                    <text textAnchor="middle" dy="5" fill="#ffffff" fontSize="13" fontWeight="700">{n.val}</text>

                    {/* Pointer Indicators */}
                    {isSlow && (
                      <g transform="translate(0, 38)">
                        <rect x="-24" y="-2" width="48" height="16" rx="4" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
                        <text textAnchor="middle" dy="10" fill="#38bdf8" fontSize="9" fontWeight="700">🐢 Slow</text>
                      </g>
                    )}
                    {isFast && (
                      <g transform={`translate(0, ${isSlow ? 56 : 38})`}>
                        <rect x="-24" y="-2" width="48" height="16" rx="4" fill="rgba(248,113,113,0.2)" stroke="#f87171" />
                        <text textAnchor="middle" dy="10" fill="#f87171" fontSize="9" fontWeight="700">🐇 Fast</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            /* Reverse Linked List */
            <>
              {[1, 2, 3, 4].map((v, i) => {
                const s = active as typeof reverseSteps[0];
                const isCurr = s.curr === v;
                const isPrev = s.prev === v;
                return (
                  <g key={`rev-${v}`} transform={`translate(${80 + i * 110}, 75)`}>
                    <rect width="55" height="38" rx="8" fill={isCurr ? 'rgba(56,189,248,0.25)' : isPrev ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isCurr ? '#38bdf8' : isPrev ? '#34d399' : 'rgba(255,255,255,0.12)'} strokeWidth="2" />
                    <text x="27" y="24" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700">{v}</text>
                    {i < 3 && (
                      <line x1="60" y1="19" x2="105" y2="19" stroke={i + 1 < (typeof s.prev === 'number' ? s.prev : 0) ? '#34d399' : '#38bdf8'} strokeWidth="2" markerEnd="url(#ll-arrow)" />
                    )}
                    {isPrev && <text x="27" y="-10" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">prev ↑</text>}
                    {isCurr && <text x="27" y="-10" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">curr ↑</text>}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-purple" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Complexity: O(N) Time | O(1) Auxiliary Space.
        </div>
      </div>
    </div>
  );
}
