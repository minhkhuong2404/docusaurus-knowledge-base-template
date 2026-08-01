import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'Select commit hash on Branch B', color: '#38bdf8', note: 'git cherry-pick c3b4a2 — identifies target commit object patch on branch B.' },
  { id: 2, label: 'Extract commit diff', color: '#fbbf24', note: 'Git calculates the diff between c3b4a2 and its parent commit on branch B.' },
  { id: 3, label: 'Apply diff & create new commit on current branch', color: '#34d399', note: 'Applies diff to HEAD (main branch) and generates brand-new commit object c9f1e8 with new SHA-1.' },
];

export default function GitCherryPickDiagram(): React.JSX.Element {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Cherry-Pick Patch Copy Protocol (`git cherry-pick <sha>`)
        </span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(244,114,182,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#f472b6', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(244,114,182,0.4)', transition: 'all 0.2s ease' }}>
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
