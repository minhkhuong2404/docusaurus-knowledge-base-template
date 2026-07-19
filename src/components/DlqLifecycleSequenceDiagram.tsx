import React, { useState, useEffect } from 'react';

interface SeqStep {
  id: number;
  label: string;
  source: 'PRODUCER' | 'MAIN_QUEUE' | 'CONSUMER' | 'DLQ' | 'ENGINEER';
  target: 'PRODUCER' | 'MAIN_QUEUE' | 'CONSUMER' | 'DLQ' | 'ENGINEER';
  color: string;
  detail: string;
  qState: string;
  cState: string;
  dlqState: string;
}

const STEPS: SeqStep[] = [
  {
    id: 1,
    label: '1. Publish message (OrderPlaced)',
    source: 'PRODUCER',
    target: 'MAIN_QUEUE',
    color: '#38bdf8',
    detail: 'Producer publishes OrderPlaced message. It enters the main queue successfully.',
    qState: 'Messages: [OrderPlaced] (Visible)',
    cState: 'State: Idle',
    dlqState: 'Messages: []',
  },
  {
    id: 2,
    label: '2. Deliver (Attempt 1)',
    source: 'MAIN_QUEUE',
    target: 'CONSUMER',
    color: '#fbbf24',
    detail: 'Broker delivers the message. Consumer attempts to process it, but throws a DB connection timeout.',
    qState: 'Messages: [OrderPlaced] (Invisible)',
    cState: 'State: Executing (Fails: DB Timeout)',
    dlqState: 'Messages: []',
  },
  {
    id: 3,
    label: '3. NACK / Backoff wait',
    source: 'CONSUMER',
    target: 'MAIN_QUEUE',
    color: '#ef4444',
    detail: 'Consumer returns a Negative ACK. Broker hides the message for a 5s backoff period.',
    qState: 'Messages: [OrderPlaced] (Invisible - Backing off)',
    cState: 'State: Backing off',
    dlqState: 'Messages: []',
  },
  {
    id: 4,
    label: '4. Deliver (Attempt 2 - Final)',
    source: 'MAIN_QUEUE',
    target: 'CONSUMER',
    color: '#fbbf24',
    detail: 'Second retry delivery. Exception persists (poison pill or ongoing outage). Attempts exhausted.',
    qState: 'Messages: [OrderPlaced] (Invisible)',
    cState: 'State: Executing (Fails: DB Timeout)',
    dlqState: 'Messages: []',
  },
  {
    id: 5,
    label: '5. Route to DLQ',
    source: 'MAIN_QUEUE',
    target: 'DLQ',
    color: '#f472b6',
    detail: 'Broker ejects message from main queue and routes it to the configured Dead Letter Queue (DLQ).',
    qState: 'Messages: []',
    cState: 'State: Idle',
    dlqState: 'Messages: [OrderPlaced] (Pending)',
  },
  {
    id: 6,
    label: '6. Trigger Pager Alerts',
    source: 'DLQ',
    target: 'ENGINEER',
    color: '#ef4444',
    detail: 'DLQ depth alarm fires. On-call engineer is paged to investigate downstream DB issues.',
    qState: 'Messages: []',
    cState: 'State: Idle',
    dlqState: 'Messages: [OrderPlaced] (Alerting)',
  },
  {
    id: 7,
    label: '7. Redrive DLQ Messages',
    source: 'ENGINEER',
    target: 'DLQ',
    color: '#34d399',
    detail: 'After recovering the database connection, the engineer issues a redrive (replays message back to main).',
    qState: 'Messages: []',
    cState: 'State: Idle',
    dlqState: 'Messages: [OrderPlaced] (Replaying)',
  },
  {
    id: 8,
    label: '8. Re-queue message',
    source: 'DLQ',
    target: 'MAIN_QUEUE',
    color: '#38bdf8',
    detail: 'Message is successfully re-queued on the main queue.',
    qState: 'Messages: [OrderPlaced] (Visible)',
    cState: 'State: Idle',
    dlqState: 'Messages: []',
  },
  {
    id: 9,
    label: '9. Process successfully',
    source: 'MAIN_QUEUE',
    target: 'CONSUMER',
    color: '#34d399',
    detail: 'Consumer receives the re-queued message and processes it successfully. Returns ACK.',
    qState: 'Messages: []',
    cState: 'State: Processed ✅',
    dlqState: 'Messages: []',
  },
];

export default function DlqLifecycleSequenceDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(4);
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
      case 'PRODUCER': return 35;
      case 'MAIN_QUEUE': return 115;
      case 'CONSUMER': return 195;
      case 'DLQ': return 275;
      case 'ENGINEER': return 345;
      default: return 35;
    }
  };

  const getMarkerId = (stepColor: string, isSelected: boolean) => {
    if (!isSelected) return 'url(#dlq-seq-arr-default)';
    switch (stepColor) {
      case '#38bdf8': return 'url(#dlq-seq-arr-cyan)';
      case '#fbbf24': return 'url(#dlq-seq-arr-yellow)';
      case '#ef4444': return 'url(#dlq-seq-arr-red)';
      case '#f472b6': return 'url(#dlq-seq-arr-pink)';
      case '#34d399': return 'url(#dlq-seq-arr-green)';
      default: return 'url(#dlq-seq-arr-default)';
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
        <span style={{ color: '#34d399' }}>Dead Letter Queue (DLQ) Lifecycle Flow</span>
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
        .dlq-seq-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dlq-seq-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dlq-seq-grid">
        
        {/* SVG Sequence */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 380 340" className="interactive-diagram-svg">
            <defs>
              <marker id="dlq-seq-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="dlq-seq-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="dlq-seq-arr-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="dlq-seq-arr-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
              <marker id="dlq-seq-arr-pink" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f472b6" />
              </marker>
              <marker id="dlq-seq-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
            </defs>

            {/* Vertical Lifelines */}
            <line x1="35" y1="40" x2="35" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="115" y1="40" x2="115" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="195" y1="40" x2="195" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="275" y1="40" x2="275" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="345" y1="40" x2="345" y2="310" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

            {/* Actor Boxes */}
            <g>
              <rect x="5" y="10" width="60" height="22" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <text x="35" y="24" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">Producer</text>
            </g>
            <g>
              <rect x="85" y="10" width="60" height="22" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1" />
              <text x="115" y="24" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">Queue</text>
            </g>
            <g>
              <rect x="165" y="10" width="60" height="22" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1" />
              <text x="195" y="24" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="bold">Consumer</text>
            </g>
            <g>
              <rect x="245" y="10" width="60" height="22" rx="4" fill="rgba(244,114,182,0.1)" stroke="#f472b6" strokeWidth="1" />
              <text x="275" y="24" textAnchor="middle" fill="#f472b6" fontSize="7" fontWeight="bold">DLQ</text>
            </g>
            <g>
              <rect x="315" y="10" width="60" height="22" rx="4" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1" />
              <text x="345" y="24" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold">Engineer</text>
            </g>

            {/* Step lines */}
            {STEPS.map((step, idx) => {
              const isSelected = activeStep === idx;
              const yVal = 52 + idx * 26;
              const xStart = getActorX(step.source);
              const xEnd = getActorX(step.target);

              // Clearances for arrowhead markers
              const startOffset = xEnd > xStart ? 6 : (xEnd < xStart ? -6 : 0);
              const endOffset = xEnd > xStart ? -12 : (xEnd < xStart ? 12 : 0);
              const xStartAdjusted = xStart + startOffset;
              const xEndAdjusted = xEnd + endOffset;

              const activeMarker = getMarkerId(step.color, isSelected);

              return (
                <g key={step.id} onClick={() => { if (!playing) setActiveStep(idx); }} style={{ cursor: playing ? 'default' : 'pointer' }}>
                  <path
                    id={`dlq-seq-arr-${step.id}`}
                    d={`M ${xStartAdjusted} ${yVal} L ${xEndAdjusted} ${yVal}`}
                    fill="none"
                    stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    markerEnd={activeMarker}
                    style={{ transition: 'stroke 0.2s' }}
                    className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                  />

                  {/* Flowing dot */}
                  {isSelected && (
                    <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1s" repeatCount="indefinite">
                        <mpath href={`#dlq-seq-arr-${step.id}`} />
                      </animateMotion>
                    </circle>
                  )}

                  <text
                    x={(xStart + xEnd) / 2}
                    y={yVal - 5}
                    textAnchor="middle"
                    fill={isSelected ? step.color : 'rgba(255,255,255,0.2)'}
                    fontSize="7.2"
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

        {/* Details Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Broker / Queue State
            </div>
            <code>{current.qState}</code>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
              Consumer Status
            </div>
            <code>{current.cState}</code>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', marginBottom: '4px' }}>
              DLQ Status
            </div>
            <code>{current.dlqState}</code>
          </div>

          <div style={{ borderLeft: `3px solid ${current.color}`, paddingLeft: '10px', minHeight: '80px' }}>
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
