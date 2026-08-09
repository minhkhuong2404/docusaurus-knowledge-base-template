import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'Start Interactive Rebase', color: '#38bdf8', note: 'git rebase -i HEAD~3 opens git-rebase-todo editor.' },
  { id: 2, label: 'Configure Commands (pick / squash / fixup)', color: '#fbbf24', note: 'Mark commit 1 as pick, commit 2 as squash (combines & edits msg), commit 3 as fixup (combines & discards msg).' },
  { id: 3, label: 'Replay & Combine Commits', color: '#34d399', note: 'Git rewrites history into a single clean combined commit SHA-1.' },
];

export default function GitSquashFixupDiagram(): React.JSX.Element {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Interactive Rebase (Squash vs Fixup)
        </span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(251,191,36,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#fbbf24', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(251,191,36,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: isActive ? `${step.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? step.color + '40' : 'rgba(255,255,255,0.07)'}`, opacity: isActive ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: step.color, background: `${step.color}18`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.id}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>{step.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{step.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
