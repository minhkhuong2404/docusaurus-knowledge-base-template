import React, { useState, useEffect } from 'react';

interface StarStep {
  id: number;
  letter: string;
  word: string;
  color: string;
  tagline: string;
  description: string;
  prompts: string[];
  example: string;
}

const STEPS: StarStep[] = [
  {
    id: 0,
    letter: 'S',
    word: 'Situation',
    color: '#38bdf8',
    tagline: 'Set the context',
    description: 'Establish the setting so the interviewer can follow your story. Keep it concise — 1-2 sentences about the company, team, project, and timeline.',
    prompts: [
      'What company / team were you in?',
      'What was the project or product?',
      'When did this take place?',
      'What was the broader business context?',
    ],
    example: '"At my previous company, we were a 6-person backend team responsible for a payment processing service handling $2M/day in transactions. In Q3 2023, we were facing a critical deadline to launch a new settlement feature."',
  },
  {
    id: 1,
    letter: 'T',
    word: 'Task',
    color: '#f97316',
    tagline: 'Define your challenge',
    description: 'Describe the specific challenge, responsibility, or goal that was yours to solve. Highlight why it was non-trivial — technical complexity, time pressure, or ambiguity.',
    prompts: [
      'What was your specific responsibility?',
      'Why was this problem hard or ambiguous?',
      'What were the constraints (time, resources)?',
      'What was at stake if you failed?',
    ],
    example: '"I was tasked with redesigning our idempotency layer to prevent double-charges, but the deadline was 3 weeks and the system processed live transactions 24/7 — so we could not take any downtime."',
  },
  {
    id: 2,
    letter: 'A',
    word: 'Action',
    color: '#34d399',
    tagline: 'What YOU did',
    description: 'This is the most important part. Focus on what you personally did, the decisions you made, and why. Use "I" not "we". Show technical depth and ownership.',
    prompts: [
      'What specific decisions did you make?',
      'What alternatives did you consider and reject?',
      'How did you influence others?',
      'What technical approach did you take and why?',
    ],
    example: '"I designed a Redis-backed idempotency key store with a 24h TTL and implemented a double-write pattern using optimistic locking. I also introduced a shadow-mode deployment to run the new logic in parallel before cutover."',
  },
  {
    id: 3,
    letter: 'R',
    word: 'Result',
    color: '#fbbf24',
    tagline: 'Measurable outcomes',
    description: 'End with concrete, metrics-driven outcomes. If you cannot provide exact numbers, give a directional estimate. Mention what you learned if relevant.',
    prompts: [
      'What was the quantified business impact?',
      'Did you hit the deadline?',
      'What happened after — was it sustained?',
      'What did you learn from this experience?',
    ],
    example: '"We launched on time with zero production incidents. Duplicate charge rate dropped from 0.4% to effectively zero over the following 30 days, saving an estimated $8K/month in refund processing costs."',
  },
];

export default function StarMethodDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep]     = useState(0);
  const [playing, setPlaying]       = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) {
      if (animStep >= STEPS.length) setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(animStep);
      setAnimStep(s => s + 1);
    }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => {
    setActiveStep(null);
    setAnimStep(0);
    setPlaying(true);
  };

  const selectedStep = activeStep !== null ? STEPS[activeStep] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .star-body-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span style={{ color: '#34d399' }}>The STAR Method</span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
            border: 'none', cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(251,191,36,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#fbbf24',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(251,191,36,0.4)',
            transition: 'all 0.2s ease',
          }}>
          {playing ? 'Playing…' : 'Animate'}
        </button>
      </div>

      {/* Step cards */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '4px 0 8px' }}>
        {STEPS.map((step, i) => {
          const isActive = activeStep !== null && i <= activeStep;
          const isCurrent = activeStep === i;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(activeStep === i ? null : i)}
              style={{
                flex: '1 1 140px',
                padding: '14px 12px',
                borderRadius: '12px',
                border: `2px solid ${isCurrent ? step.color : isActive ? `${step.color}60` : 'rgba(255,255,255,0.08)'}`,
                background: isActive ? `${step.color}12` : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                textAlign: 'left',
                opacity: (!isActive && activeStep !== null) ? 0.45 : 1,
                transform: isCurrent ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.4s ease',
              }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: step.color, lineHeight: 1, marginBottom: '4px' }}>
                {step.letter}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '2px' }}>
                {step.word}
              </div>
              <div style={{ fontSize: '11px', color: step.color, opacity: 0.8 }}>
                {step.tagline}
              </div>
            </button>
          );
        })}
      </div>

      {/* Connector arrows between steps */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 8px', gap: '0' }}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '10px',
                          color: step.color, fontWeight: 700, opacity: activeStep !== null && i <= activeStep ? 1 : 0.3 }}>
              {step.word}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)', flexShrink: 0, margin: '0 2px' }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Detail panel */}
      {selectedStep ? (
        <div className="interactive-diagram-details-card" style={{ marginTop: '4px', padding: '18px 20px' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: `${selectedStep.color}20`, border: `2px solid ${selectedStep.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 900, color: selectedStep.color,
            }}>
              {selectedStep.letter}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: selectedStep.color }}>
                {selectedStep.word}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                {selectedStep.tagline}
              </div>
            </div>
            <button onClick={() => setActiveStep(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                             color: 'var(--ifm-color-content-secondary)', fontSize: '16px', lineHeight: 1 }}>
              ✕
            </button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--ifm-color-content)', margin: '0 0 14px', lineHeight: 1.6 }}>
            {selectedStep.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}
               className="star-body-grid">
            {/* Prompts */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: selectedStep.color,
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Key Questions to Answer
              </div>
              {selectedStep.prompts.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px',
                                      fontSize: '12.5px', color: 'var(--ifm-color-content)',
                                      marginBottom: '6px', lineHeight: 1.5 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', marginTop: '5px',
                                background: selectedStep.color, flexShrink: 0 }} />
                  {p}
                </div>
              ))}
            </div>

            {/* Example */}
            <div style={{ background: `${selectedStep.color}0e`, border: `1px solid ${selectedStep.color}30`,
                          borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: selectedStep.color,
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Example Response
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)',
                          fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                {selectedStep.example}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="interactive-diagram-helper-text" style={{ textAlign: 'center', padding: '4px 0 0' }}>
          Click a letter card or press Animate to walk through the STAR framework
        </p>
      )}
    </div>
  );
}
