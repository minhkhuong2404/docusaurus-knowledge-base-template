import React, { useState, useEffect } from 'react';

const STAR_STEPS = [
  { id: 'situation', letter: 'S', label: 'Situation', pct: '15%', color: '#38bdf8', time: '20–30 sec', desc: 'Set the scene. Be specific but concise — 1–2 sentences max.', powerWords: ['"We were under pressure to…"', '"The context was critical because…"', '"This was particularly challenging due to…"'], include: ['Company/team context (briefly)', 'The time frame', 'What made it challenging or significant'] },
  { id: 'task', letter: 'T', label: 'Task', pct: '10%', color: '#a78bfa', time: '10–15 sec', desc: 'Clarify YOUR specific responsibility. This differentiates you from the team.', powerWords: ['"I was specifically responsible for…"', '"My accountability was to…"', '"I had to personally ensure…"'], include: ['Your specific role', 'What you were accountable for', 'The constraint or challenge you personally faced'] },
  { id: 'action', letter: 'A', label: 'Action', pct: '60%', color: '#34d399', time: '60–90 sec', desc: 'This is where you shine. Be specific about what YOU did, step by step.', powerWords: ['"I initiated / proposed / designed / led…"', '"I escalated / negotiated / realigned…"', '"I decided to prioritize X over Y because…"'], include: ['Use "I" not "we"', 'List 3–5 concrete steps in chronological order', 'Show judgment: why did you make those choices?', 'Highlight skills: communication, technical, leadership'] },
  { id: 'result', letter: 'R', label: 'Result', pct: '15%', color: '#fbbf24', time: '20–30 sec', desc: 'Quantify whenever possible. Also mention what you learned.', powerWords: ['"As a direct result of my actions…"', '"This led to a X% improvement in…"', '"Beyond the numbers, this also improved…"'], include: ['Use numbers (%, $, time saved, users impacted)', 'Mention secondary impact (team morale, process improvements)', 'Optional: add what you\'d do differently or what you learned'] },
];

const LEARNING_STEP = { id: 'learning', letter: 'L', label: 'Learning', pct: '10%', color: '#f472b6', time: '10–15 sec', desc: 'What changed in how you think or work. Used for STAR-L variant at Google & Meta.', powerWords: ['"The lasting lesson for me was…"', '"I now treat every X as requiring Y because…"', '"This has become a personal rule I apply regardless of…"'], include: ['A genuine behavioral change', 'Not a cliché ("I learned communication is important")', 'A repeatable principle you extracted'] };

export default function StarMethodDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showLearning, setShowLearning] = useState(false);

  const steps = showLearning ? [...STAR_STEPS, LEARNING_STEP] : STAR_STEPS;

  useEffect(() => {
    if (!playing || animStep >= steps.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep, steps.length]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  const selStep = activeStep !== null ? steps[activeStep] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .star-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          {showLearning ? 'STAR-L Method Flow' : 'STAR Method Flow'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowLearning(!showLearning)}
            style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: showLearning ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.06)', color: showLearning ? '#f472b6' : 'var(--ifm-color-content-secondary)', boxShadow: showLearning ? '0 0 0 1.5px rgba(244,114,182,0.4)' : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
            {showLearning ? 'STAR-L' : 'STAR'}
          </button>
          <button onClick={handlePlay} disabled={playing}
            style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '11px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
            {playing ? 'Playing…' : '▶ Animate'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Flow timeline */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', alignItems: 'stretch' }}>
          {steps.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isCurrent = activeStep === i;
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ flex: step.id === 'action' ? 3 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '10px', cursor: 'pointer', background: isCurrent ? `${step.color}18` : isActive ? `${step.color}0a` : 'rgba(255,255,255,0.03)', boxShadow: isCurrent ? `0 0 0 1.5px ${step.color}50` : '0 0 0 1px rgba(255,255,255,0.07)', opacity: isActive || activeStep === null ? 1 : 0.35, transition: 'all 0.4s ease' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${step.color}20`, border: `2px solid ${step.color}60`, transition: 'all 0.3s ease' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: step.color }}>{step.letter}</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: step.color, textAlign: 'center' }}>{step.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>{step.pct}</div>
                <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: `${step.color}15`, overflow: 'hidden', marginTop: 'auto' }}>
                  <div style={{ height: '100%', width: isActive ? '100%' : '0%', background: step.color, transition: 'width 0.6s ease', borderRadius: '2px' }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Directional arrows between steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0', marginBottom: '16px' }}>
          {steps.slice(0, -1).map((step, i) => {
            const next = steps[i + 1];
            const isActive = activeStep !== null && i < activeStep;
            return (
              <div key={step.id + '-arrow'} style={{ display: 'flex', alignItems: 'center', flex: step.id === 'action' ? 3 : 1 }}>
                <div style={{ flex: 1, height: '2px', background: isActive ? `linear-gradient(90deg, ${step.color}, ${next.color})` : 'rgba(255,255,255,0.08)', transition: 'all 0.5s ease', position: 'relative' }}>
                  {isActive && (
                    <div style={{ position: 'absolute', right: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${next.color}` }}/>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="star-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-details-card" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: selStep ? 'flex-start' : 'center' }}>
            {selStep ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: selStep.color }}>{selStep.letter}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: selStep.color }}>{selStep.label}</span>
                  <code style={{ fontSize: '10px', background: `${selStep.color}18`, color: selStep.color, border: `1px solid ${selStep.color}30`, borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>{selStep.time}</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{selStep.desc}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>What to Include</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selStep.include.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: selStep.color, fontSize: '10px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                      <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a step above or press Animate to see details</div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              {selStep ? `${selStep.label} — Power Words` : 'Power Words'}
            </div>
            {selStep ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selStep.powerWords.map((pw, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: '7px', background: `${selStep.color}0a`, border: `1px solid ${selStep.color}20`, fontSize: '11.5px', color: selStep.color, fontStyle: 'italic', lineHeight: 1.5 }}>
                    {pw}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center', padding: '20px 0' }}>Select a step to see suggested power words</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
