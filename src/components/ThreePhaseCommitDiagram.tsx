import React, { useState, useEffect } from 'react';

interface SeqStep {
  id: number;
  phase: 'CAN_COMMIT' | 'PRE_COMMIT' | 'DO_COMMIT';
  label: string;
  source: 'COORDINATOR' | 'PARTICIPANT_A' | 'PARTICIPANT_B';
  target: 'COORDINATOR' | 'PARTICIPANT_A' | 'PARTICIPANT_B';
  color: string;
  detail: string;
  coordState: string;
  pAState: string;
  pBState: string;
}

const STEPS: SeqStep[] = [
  {
    id: 1,
    phase: 'CAN_COMMIT',
    label: '1. CanCommit? (Query)',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_A',
    color: '#38bdf8',
    detail: 'Coordinator broadcasts CanCommit? query to Participant A.',
    coordState: 'State: CAN_COMMIT_SENT',
    pAState: 'Locks: None | State: Idle',
    pBState: 'Locks: None | State: Idle',
  },
  {
    id: 2,
    phase: 'CAN_COMMIT',
    label: '2. CanCommit? (Query)',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_B',
    color: '#38bdf8',
    detail: 'Coordinator broadcasts CanCommit? query to Participant B.',
    coordState: 'State: CAN_COMMIT_SENT',
    pAState: 'Locks: None | State: Checked (OK)',
    pBState: 'Locks: None | State: Idle',
  },
  {
    id: 3,
    phase: 'CAN_COMMIT',
    label: '3. Vote YES',
    source: 'PARTICIPANT_A',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant A confirms resource availability and votes YES.',
    coordState: 'State: CAN_COMMIT (A: YES)',
    pAState: 'Locks: None | State: Voted YES (No logs written)',
    pBState: 'Locks: None | State: Checked (OK)',
  },
  {
    id: 4,
    phase: 'CAN_COMMIT',
    label: '4. Vote YES',
    source: 'PARTICIPANT_B',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant B confirms resource availability and votes YES.',
    coordState: 'State: CAN_COMMIT (A: YES, B: YES)',
    pAState: 'Locks: None | State: Voted YES',
    pBState: 'Locks: None | State: Voted YES',
  },
  {
    id: 5,
    phase: 'PRE_COMMIT',
    label: '5. PreCommit (Prepare & Lock)',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_A',
    color: '#fbbf24',
    detail: 'Coordinator enters PreCommit state and broadcasts PreCommit task (reserve locks + flush WAL).',
    coordState: 'State: PRE_COMMIT',
    pAState: 'Locks: Reserving | State: Preparing',
    pBState: 'Locks: None | State: Voted YES',
  },
  {
    id: 6,
    phase: 'PRE_COMMIT',
    label: '6. PreCommit (Prepare & Lock)',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_B',
    color: '#fbbf24',
    detail: 'Coordinator broadcasts PreCommit task to Participant B.',
    coordState: 'State: PRE_COMMIT',
    pAState: 'Locks: Acquired | State: Prepared (Ready)',
    pBState: 'Locks: Reserving | State: Preparing',
  },
  {
    id: 7,
    phase: 'PRE_COMMIT',
    label: '7. Ready ACK',
    source: 'PARTICIPANT_A',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant A confirms WAL is flushed, locks held, and responds with READY.',
    coordState: 'State: PRE_COMMIT (A: READY)',
    pAState: 'Locks: Acquired | State: Prepared (Ready)',
    pBState: 'Locks: Acquired | State: Prepared (Ready)',
  },
  {
    id: 8,
    phase: 'PRE_COMMIT',
    label: '8. Ready ACK',
    source: 'PARTICIPANT_B',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant B confirms WAL is flushed, locks held, and responds with READY.',
    coordState: 'State: PRE_COMMIT (A: READY, B: READY)',
    pAState: 'Locks: Acquired | State: Prepared (Ready)',
    pBState: 'Locks: Acquired | State: Prepared (Ready)',
  },
  {
    id: 9,
    phase: 'DO_COMMIT',
    label: '9. DoCommit (Broadcast)',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_A',
    color: '#a78bfa',
    detail: 'All nodes responded ready. Coordinator triggers DoCommit broadcast.',
    coordState: 'State: DO_COMMIT_SENT',
    pAState: 'Locks: Acquired | State: Committing',
    pBState: 'Locks: Acquired | State: Prepared (Ready)',
  },
  {
    id: 10,
    phase: 'DO_COMMIT',
    label: '10. DoCommit (Broadcast)',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_B',
    color: '#a78bfa',
    detail: 'Coordinator broadcasts DoCommit to Participant B.',
    coordState: 'State: DO_COMMIT_SENT',
    pAState: 'Locks: Acquired | State: Committing',
    pBState: 'Locks: Acquired | State: Committing',
  },
  {
    id: 11,
    phase: 'DO_COMMIT',
    label: '11. ACK',
    source: 'PARTICIPANT_A',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant A applies commits, releases locks, and sends completion ACK.',
    coordState: 'State: DO_COMMIT (A: ACK)',
    pAState: 'Locks: Released | State: Committed ✅',
    pBState: 'Locks: Acquired | State: Committing',
  },
  {
    id: 12,
    phase: 'DO_COMMIT',
    label: '12. ACK',
    source: 'PARTICIPANT_B',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant B applies commits, releases locks, and sends completion ACK.',
    coordState: 'State: FINISHED ✅',
    pAState: 'Locks: Released | State: Committed ✅',
    pBState: 'Locks: Released | State: Committed ✅',
  },
];

export default function ThreePhaseCommitDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(7); // start at pre-commit completion visually
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!playing) return;
    if (activeStep >= STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(prev => prev + 1);
    }, 1600);
    return () => clearTimeout(t);
  }, [playing, activeStep]);

  const handlePlay = () => {
    setActiveStep(0);
    setPlaying(true);
  };

  const current = STEPS[activeStep];

  const getActorX = (actor: string) => {
    switch (actor) {
      case 'COORDINATOR': return 50;
      case 'PARTICIPANT_A': return 190;
      case 'PARTICIPANT_B': return 330;
      default: return 50;
    }
  };

  const getMarkerId = (stepColor: string, isSelected: boolean) => {
    if (!isSelected) return 'url(#three-pc-arr-default)';
    switch (stepColor) {
      case '#38bdf8': return 'url(#three-pc-arr-cyan)';
      case '#34d399': return 'url(#three-pc-arr-green)';
      case '#fbbf24': return 'url(#three-pc-arr-yellow)';
      case '#a78bfa': return 'url(#three-pc-arr-purple)';
      default: return 'url(#three-pc-arr-default)';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5"/>
          <polyline points="12 17 18 11 12 5"/>
        </svg>
        <span style={{ color: '#34d399' }}>Three-Phase Commit (3PC) Sequence Flow</span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {playing ? 'Animating…' : 'Animate Flow'}
        </button>
      </div>

      <style>{`
        .threepc-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .threepc-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="threepc-grid">
        
        {/* SVG Sequence */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 380 410" className="interactive-diagram-svg">
            <defs>
              <marker id="three-pc-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="three-pc-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="three-pc-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="three-pc-arr-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="three-pc-arr-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Vertical Lifelines */}
            <line x1="50" y1="40" x2="50" y2="390" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="190" y1="40" x2="190" y2="390" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="330" y1="40" x2="330" y2="390" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

            {/* Actor Boxes */}
            <g>
              <rect x="15" y="10" width="70" height="25" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="50" y="26" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">Coordinator</text>
            </g>
            <g>
              <rect x="150" y="10" width="80" height="25" rx="4" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.2" />
              <text x="190" y="26" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">Participant A</text>
            </g>
            <g>
              <rect x="290" y="10" width="80" height="25" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="330" y="26" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">Participant B</text>
            </g>

            {/* Step lines */}
            {STEPS.map((step, idx) => {
              const isSelected = activeStep === idx;
              const yVal = 55 + idx * 27;
              const xStart = getActorX(step.source);
              const xEnd = getActorX(step.target);

              // 6px offset at start, 12px offset at end lifeline (for arrowhead spacing)
              const startOffset = xEnd > xStart ? 6 : (xEnd < xStart ? -6 : 0);
              const endOffset = xEnd > xStart ? -12 : (xEnd < xStart ? 12 : 0);
              const xStartAdjusted = xStart + startOffset;
              const xEndAdjusted = xEnd + endOffset;

              const activeMarker = getMarkerId(step.color, isSelected);

              return (
                <g key={step.id} onClick={() => { if (!playing) setActiveStep(idx); }} style={{ cursor: playing ? 'default' : 'pointer' }}>
                  <path
                    id={`threepc-arr-${step.id}`}
                    d={`M ${xStartAdjusted} ${yVal} L ${xEndAdjusted} ${yVal}`}
                    fill="none"
                    stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    markerEnd={activeMarker}
                    style={{ transition: 'stroke 0.2s' }}
                    className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                  />

                  {/* Flowing particle */}
                  {isSelected && (
                    <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1s" repeatCount="indefinite">
                        <mpath href={`#threepc-arr-${step.id}`} />
                      </animateMotion>
                    </circle>
                  )}

                  <text
                    x={(xStart + xEnd) / 2}
                    y={yVal - 5}
                    textAnchor="middle"
                    fill={isSelected ? step.color : 'rgba(255,255,255,0.2)'}
                    fontSize="7"
                    fontWeight={isSelected ? '800' : 'normal'}
                    style={{ transition: 'fill 0.2s' }}
                  >
                    {step.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Phase identifier */}
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '9px',
            fontWeight: 'bold',
            background: current.phase === 'CAN_COMMIT' ? 'rgba(56,189,248,0.1)' : current.phase === 'PRE_COMMIT' ? 'rgba(251,191,36,0.1)' : 'rgba(167,135,250,0.1)',
            color: current.phase === 'CAN_COMMIT' ? '#38bdf8' : current.phase === 'PRE_COMMIT' ? '#fbbf24' : '#a78bfa',
            border: `1px solid ${current.phase === 'CAN_COMMIT' ? '#38bdf830' : current.phase === 'PRE_COMMIT' ? '#fbbf2430' : '#a78bfa30'}`,
            alignSelf: 'start',
          }}>
            PHASE: {current.phase}
          </div>

          {/* Node monitor */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Coordinator State Log
            </div>
            <code>{current.coordState}</code>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Participants Monitors
            </div>
            <code style={{ display: 'block', marginBottom: '4px' }}>A: {current.pAState}</code>
            <code>B: {current.pBState}</code>
          </div>

          {/* Step detail card */}
          <div style={{ borderLeft: `3px solid ${current.color}`, paddingLeft: '10px', minHeight: '90px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Step Details
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {current.detail}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
