import React, { useState, useEffect } from 'react';

const MODES = [
  { id: 'ff', label: 'Fast-Forward Merge', color: '#38bdf8', steps: [
    { label: 'Check linear history', note: 'Git checks if target branch pointer is a direct ancestor of source branch.' },
    { label: 'Advance branch pointer', note: 'No new commit created. Branch pointer simply moves forward to source tip SHA-1.' },
  ]},
  { id: 'three-way', label: '3-Way Merge (--no-ff)', color: '#34d399', steps: [
    { label: 'Find common ancestor (Base)', note: 'Git finds the merge base commit where branches split.' },
    { label: '3-Way diff (Base vs Main vs Feature)', note: 'Diffs base against main tip and feature tip.' },
    { label: 'Create 3-Way Merge Commit', note: 'Generates a new merge commit object with 2 parent commit hashes.' },
  ]},
];

export default function GitMergeMechanicsDiagram(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<string>('ff');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  const mode = MODES.find(m => m.id === activeMode)!;

  useEffect(() => {
    if (!playing || animStep >= mode.steps.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 1000);
    return () => clearTimeout(t);
  }, [playing, animStep, mode.steps.length]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
          <path d="M6 9v6"/><path d="M9 6h9a3 3 0 0 1 3 3v6"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Merge Mechanics (Fast-Forward vs 3-Way Merge)
        </span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : `${mode.color}25`, color: playing ? 'var(--ifm-color-content-secondary)' : mode.color, boxShadow: playing ? 'none' : `0 0 0 1.5px ${mode.color}50`, transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setActiveMode(m.id); setActiveStep(null); setPlaying(false); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: activeMode === m.id ? `${m.color}18` : 'rgba(255,255,255,0.04)', color: activeMode === m.id ? m.color : 'var(--ifm-color-content-secondary)', boxShadow: activeMode === m.id ? `0 0 0 1.5px ${m.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode.steps.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            return (
              <div key={i} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: isActive ? `${mode.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? mode.color + '40' : 'rgba(255,255,255,0.07)'}`, opacity: isActive ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: mode.color, background: `${mode.color}18`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
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
