import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'git bisect start', color: '#38bdf8', note: 'Initializes binary search state. Mark current bad commit (git bisect bad) and last known good commit (git bisect good v1.0.0).' },
  { id: 2, label: 'Git checks out midpoint commit (O(log N))', color: '#fbbf24', note: 'Git automatically checks out the middle commit between good and bad bounds.' },
  { id: 3, label: 'Test & Mark (git bisect good / bad)', color: '#34d399', note: 'Run tests. If passes → git bisect good. If fails → git bisect bad. Search range is halved.' },
  { id: 4, label: 'Culprit commit identified!', color: '#f87171', note: 'Git pinpointed exact bad commit SHA-1: a9f8e7d. Run git bisect reset to return to original HEAD.' },
];

export default function GitBisectDiagram(): React.JSX.Element {
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
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Bisect Binary Search Bug Detector (`git bisect`)
        </span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
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
