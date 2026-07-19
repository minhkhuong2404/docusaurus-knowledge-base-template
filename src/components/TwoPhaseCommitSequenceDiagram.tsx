import React, { useState, useEffect } from 'react';

interface SeqStep {
  id: number;
  phase: 'PREPARE' | 'COMMIT';
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
    phase: 'PREPARE',
    label: '1. PREPARE Transaction T1',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_A',
    color: '#38bdf8',
    detail: 'Coordinator broadcasts PREPARE message to Participant A (Payment DB).',
    coordState: 'State: PREPARING',
    pAState: 'Locks: None | State: Idle',
    pBState: 'Locks: None | State: Idle',
  },
  {
    id: 2,
    phase: 'PREPARE',
    label: '2. PREPARE Transaction T1',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_B',
    color: '#38bdf8',
    detail: 'Coordinator broadcasts PREPARE message to Participant B (Inventory DB).',
    coordState: 'State: PREPARING',
    pAState: 'Locks: None | State: Preparing',
    pBState: 'Locks: None | State: Idle',
  },
  {
    id: 3,
    phase: 'PREPARE',
    label: '3. VOTE YES',
    source: 'PARTICIPANT_A',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant A writes undo/redo logs, acquires row locks, flushes WAL, and votes YES.',
    coordState: 'State: PREPARING (A: YES)',
    pAState: 'Locks: Acquired | State: In-Doubt (Voted YES)',
    pBState: 'Locks: None | State: Preparing',
  },
  {
    id: 4,
    phase: 'PREPARE',
    label: '4. VOTE YES',
    source: 'PARTICIPANT_B',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant B writes logs, acquires row locks, flushes WAL, and votes YES.',
    coordState: 'State: PREPARING (A: YES, B: YES)',
    pAState: 'Locks: Acquired | State: In-Doubt (Voted YES)',
    pBState: 'Locks: Acquired | State: In-Doubt (Voted YES)',
  },
  {
    id: 5,
    phase: 'COMMIT',
    label: '5. Write COMMIT to coordinator log',
    source: 'COORDINATOR',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Coordinator writes the durable DECISION: COMMIT record to its WAL (the point of no return).',
    coordState: 'State: COMMITTED (Durable)',
    pAState: 'Locks: Acquired | State: In-Doubt',
    pBState: 'Locks: Acquired | State: In-Doubt',
  },
  {
    id: 6,
    phase: 'COMMIT',
    label: '6. COMMIT',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_A',
    color: '#a78bfa',
    detail: 'Coordinator sends COMMIT broadcast to Participant A.',
    coordState: 'State: COMMITTING',
    pAState: 'Locks: Acquired | State: Committing',
    pBState: 'Locks: Acquired | State: In-Doubt',
  },
  {
    id: 7,
    phase: 'COMMIT',
    label: '7. COMMIT',
    source: 'COORDINATOR',
    target: 'PARTICIPANT_B',
    color: '#a78bfa',
    detail: 'Coordinator sends COMMIT broadcast to Participant B.',
    coordState: 'State: COMMITTING',
    pAState: 'Locks: Acquired | State: Committing',
    pBState: 'Locks: Acquired | State: Committing',
  },
  {
    id: 8,
    phase: 'COMMIT',
    label: '8. ACK',
    source: 'PARTICIPANT_A',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant A applies changes, releases row locks, writes commit log record, and sends ACK.',
    coordState: 'State: COMMITTING (A: ACK)',
    pAState: 'Locks: Released | State: Committed ✅',
    pBState: 'Locks: Acquired | State: Committing',
  },
  {
    id: 9,
    phase: 'COMMIT',
    label: '9. ACK',
    source: 'PARTICIPANT_B',
    target: 'COORDINATOR',
    color: '#34d399',
    detail: 'Participant B applies changes, releases row locks, writes commit log record, and sends ACK.',
    coordState: 'State: FINISHED ✅',
    pAState: 'Locks: Released | State: Committed ✅',
    pBState: 'Locks: Released | State: Committed ✅',
  },
];

export default function TwoPhaseCommitSequenceDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(4); // default at point of decision
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
    if (!isSelected) return 'url(#twopc-seq-arr-default)';
    switch (stepColor) {
      case '#38bdf8': return 'url(#twopc-seq-arr-cyan)';
      case '#34d399': return 'url(#twopc-seq-arr-green)';
      case '#a78bfa': return 'url(#twopc-seq-arr-purple)';
      default: return 'url(#twopc-seq-arr-default)';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: '#34d399' }}>Two-Phase Commit (2PC) Sequence Flow</span>
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
        .twopc-seq-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .twopc-seq-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="twopc-seq-grid">
        
        {/* SVG Sequence */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 380 340" className="interactive-diagram-svg">
            <defs>
              <marker id="twopc-seq-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="twopc-seq-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="twopc-seq-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="twopc-seq-arr-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Vertical Lifelines */}
            <line x1="50" y1="40" x2="50" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="190" y1="40" x2="190" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="330" y1="40" x2="330" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

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
              const yVal = 55 + idx * 28;
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
                  {xStart !== xEnd ? (
                    <path
                      id={`twopc-seq-arr-${step.id}`}
                      d={`M ${xStartAdjusted} ${yVal} L ${xEndAdjusted} ${yVal}`}
                      fill="none"
                      stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                      strokeWidth={isSelected ? '2' : '1.2'}
                      markerEnd={activeMarker}
                      style={{ transition: 'stroke 0.2s' }}
                      className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                    />
                  ) : (
                    // Point of decision loop on coordinator log
                    <path
                      id={`twopc-seq-arr-${step.id}`}
                      d={`M ${xStart} ${yVal - 5} C ${xStart + 22} ${yVal - 10}, ${xStart + 22} ${yVal + 10}, ${xStart} ${yVal + 5}`}
                      fill="none"
                      stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                      strokeWidth={isSelected ? '2' : '1.2'}
                      markerEnd={activeMarker}
                      style={{ transition: 'stroke 0.2s' }}
                      className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                    />
                  )}

                  {/* Flowing particle */}
                  {isSelected && xStart !== xEnd && (
                    <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1s" repeatCount="indefinite">
                        <mpath href={`#twopc-seq-arr-${step.id}`} />
                      </animateMotion>
                    </circle>
                  )}

                  <text
                    x={xStart === xEnd ? xStart + 25 : (xStart + xEnd) / 2}
                    y={yVal - 5}
                    textAnchor={xStart === xEnd ? 'start' : 'middle'}
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
            background: current.phase === 'PREPARE' ? 'rgba(56,189,248,0.1)' : 'rgba(167,135,250,0.1)',
            color: current.phase === 'PREPARE' ? '#38bdf8' : '#a78bfa',
            border: `1px solid ${current.phase === 'PREPARE' ? '#38bdf830' : '#a78bfa30'}`,
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
