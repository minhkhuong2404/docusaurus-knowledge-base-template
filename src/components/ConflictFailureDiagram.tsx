import React, { useState, useEffect } from 'react';

type ModeId = 'conflict' | 'failure';

const FLOW_STEPS = [
  { id: 'rules', label: 'Golden Rules', color: '#f87171', desc: 'Apply the 5 rules before choosing your story.', conflict: 'Never blame the other person. Own your part. Show diplomacy and professional resolution.', failure: 'Never minimize or catastrophize. Own the failure fully. Focus on genuine learning, not clichés.' },
  { id: 'choose', label: 'Choose Story', color: '#fbbf24', desc: 'Pick a real, specific story that shows growth.', conflict: 'Pick a conflict that was genuinely challenging (not a humblebrag) and had a constructive resolution.', failure: 'Pick a real failure with stakes — not "I work too hard." It should be uncomfortable enough to feel authentic.' },
  { id: 'frame', label: 'Frame Positively', color: '#38bdf8', desc: 'Set up the context to show maturity, not victimhood.', conflict: 'Frame as "a professional disagreement I navigated" — not "someone was wrong and I fixed it."', failure: 'Frame as "a challenge that taught me something lasting" — not "a disaster that happened to me."' },
  { id: 'deliver', label: 'Deliver in STAR', color: '#34d399', desc: 'Follow the STAR structure with emphasis on Action.', conflict: 'Action (60%): Show specific de-escalation steps, data you brought, how you listened first.', failure: 'Action (60%): Show immediate ownership, specific corrective steps, and permanent process changes.' },
  { id: 'growth', label: 'End with Growth', color: '#a78bfa', desc: 'Close with a specific, lasting lesson — not a cliché.', conflict: 'Show a behavioral change: "I now do X before every Y" — concrete, repeatable, and genuine.', failure: 'Show what you built or changed permanently as a result. The lesson IS the point of the story.' },
];

const RULES = [
  { id: 'r1', title: 'Never Blame Others', bad: '"My manager made a terrible decision and it cost us 3 months."', good: '"The decision was made to proceed, and in retrospect, I wish I had pushed back more forcefully with data earlier."', color: '#f87171' },
  { id: 'r2', title: 'Own Your Part', bad: '"The team didn\'t communicate well."', good: '"I didn\'t establish clear communication norms early, which contributed to the breakdown."', color: '#f97316' },
  { id: 'r3', title: 'Show a Real Lesson', bad: '"I learned that communication is really important."', good: '"I now require written documentation of every architectural decision before implementation, with explicit sign-off."', color: '#fbbf24' },
  { id: 'r4', title: 'Don\'t Catastrophize or Minimize', bad: '"My weakness is I work too hard." (humblebrag)', good: 'Pick a genuinely challenging situation — not career-ending, but authentically difficult.', color: '#38bdf8' },
  { id: 'r5', title: 'End on Forward Momentum', bad: '"It was tough but we got through it."', good: 'Show a specific process, tool, or behavior you created that still exists and helps others.', color: '#34d399' },
];

export default function ConflictFailureDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<ModeId>('conflict');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  useEffect(() => {
    if (!playing || animStep >= FLOW_STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 1000);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };
  const selStep = activeStep !== null ? FLOW_STEPS[activeStep] : null;
  const selRule = RULES.find(r => r.id === selectedRule);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .cf-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Safe Storytelling Flow</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setMode(mode === 'conflict' ? 'failure' : 'conflict')}
            style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: mode === 'conflict' ? 'rgba(248,113,113,0.15)' : 'rgba(249,115,22,0.15)', color: mode === 'conflict' ? '#f87171' : '#f97316', boxShadow: `0 0 0 1.5px ${mode === 'conflict' ? 'rgba(248,113,113,0.4)' : 'rgba(249,115,22,0.4)'}`, transition: 'all 0.2s ease' }}>
            {mode === 'conflict' ? 'Conflict Mode' : 'Failure Mode'}
          </button>
          <button onClick={handlePlay} disabled={playing}
            style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '11px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
            {playing ? 'Playing…' : '▶ Animate'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Flow steps */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {FLOW_STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isCurrent = activeStep === i;
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', borderRadius: '8px', cursor: 'pointer', background: isCurrent ? `${step.color}18` : 'rgba(255,255,255,0.03)', boxShadow: isCurrent ? `0 0 0 1.5px ${step.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', opacity: isActive || activeStep === null ? 1 : 0.3, transition: 'all 0.4s ease' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${step.color}20`, border: `2px solid ${step.color}50`, fontSize: '12px', fontWeight: 800, color: step.color }}>{i + 1}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: step.color, textAlign: 'center' }}>{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Step detail + rules panel */}
        <div className="cf-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <div>
            {/* Step detail */}
            <div className="interactive-diagram-details-card" style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: selStep ? 'flex-start' : 'center', marginBottom: '12px' }}>
              {selStep ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: selStep.color, marginBottom: '6px' }}>Step {(activeStep || 0) + 1}: {selStep.label}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>{selStep.desc}</div>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: `${selStep.color}0a`, border: `1px solid ${selStep.color}20` }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: selStep.color, marginBottom: '3px' }}>{mode === 'conflict' ? 'Conflict Tip' : 'Failure Tip'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{mode === 'conflict' ? selStep.conflict : selStep.failure}</div>
                  </div>
                </div>
              ) : (
                <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a step or press Animate to see guidance</div>
              )}
            </div>
          </div>

          {/* Golden Rules panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '10px' }}>5 Golden Rules</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {RULES.map(rule => {
                const isActive = selectedRule === rule.id;
                return (
                  <div key={rule.id} onClick={() => setSelectedRule(isActive ? null : rule.id)}
                    style={{ padding: '8px 10px', borderRadius: '7px', cursor: 'pointer', background: isActive ? `${rule.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? `${rule.color}30` : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.2s ease' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: rule.color }}>{rule.title}</div>
                    {isActive && (
                      <div style={{ marginTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#f87171', flexShrink: 0 }}>✗</span>
                          <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>{rule.bad}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '10px', color: '#34d399', flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>{rule.good}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
