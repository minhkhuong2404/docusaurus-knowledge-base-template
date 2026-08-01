import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'Identify common ancestor & commits', color: '#a78bfa', note: 'Git finds the merge base and saves commits F1, F2 from feature branch as temporary patch files in .git/rebase-apply/.' },
  { id: 2, label: 'Reset feature branch to target tip', color: '#38bdf8', note: 'Git resets the current feature branch pointer to match the latest commit C3 on main.' },
  { id: 3, label: 'Replay patch F1 → F1\'', color: '#fbbf24', note: 'Git applies patch F1 on top of C3. New commit object F1\' is created with new SHA-1 hash.' },
  { id: 4, label: 'Replay patch F2 → F2\'', color: '#34d399', note: 'Git applies patch F2 on top of F1\'. New commit object F2\' is created. Feature branch pointer updated to F2\'. Linear history!' },
];

export default function GitRebaseInternalsDiagram(): React.JSX.Element {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Rebase Replay Protocol (`git rebase main`)
        </span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#a78bfa', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(167,139,250,0.4)', transition: 'all 0.2s ease' }}>
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
