import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'left' as const, label: 'git fetch', color: '#38bdf8', note: 'Downloads commits & updates origin/main pointer. Working tree UNCHANGED.' },
  { id: 2, direction: 'left' as const, label: 'git merge origin/main', color: '#34d399', note: 'Merges origin/main into local main branch. Creates merge commit if divergent.' },
];

export default function GitFetchVsPullDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 1000);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Fetch vs Git Pull Protocol (Pull = Fetch + Merge)
        </span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.10)', border: '1.5px solid rgba(56,189,248,0.35)', borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Local Repo</div>
            <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>main &amp; HEAD</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {STEPS.map((step, i) => {
              const isActive = activeStep !== null && i <= activeStep;
              return (
                <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                  style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : 0.3, transition: 'opacity 0.5s ease' }}>
                  <div style={{ flex: 1, height: '2px', background: `linear-gradient(270deg, ${step.color}00, ${step.color})`, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: `8px solid ${step.color}` }} />
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '7px', flexShrink: 0, background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: step.color, fontWeight: 700 }}>{step.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{step.note}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'rgba(52,211,153,0.10)', border: '1.5px solid rgba(52,211,153,0.35)', borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>Remote (origin)</div>
            <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>refs/heads/main</div>
          </div>
        </div>
      </div>
    </div>
  );
}
