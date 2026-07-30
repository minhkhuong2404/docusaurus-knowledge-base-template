import React, { useState, useEffect } from 'react';

interface OutboxStep {
  id: number;
  label: string;
  source: 'APP' | 'DB' | 'RELAY' | 'KAFKA';
  target: 'APP' | 'DB' | 'RELAY' | 'KAFKA';
  color: string;
  dbState: string;
  kafkaState: string;
  detail: string;
}

const STEPS: OutboxStep[] = [
  {
    id: 1,
    label: '1. BEGIN TRANSACTION',
    source: 'APP',
    target: 'DB',
    color: '#38bdf8',
    dbState: 'Orders: [] | Outbox: []',
    kafkaState: 'Topic: [empty]',
    detail: 'Application Service initiates a local database transaction. Autocommit is disabled, holding changes in a buffer.',
  },
  {
    id: 2,
    label: '2. INSERT INTO orders',
    source: 'APP',
    target: 'DB',
    color: '#38bdf8',
    dbState: 'Orders: [id=101, status=PENDING] (Uncommitted)',
    kafkaState: 'Topic: [empty]',
    detail: 'Application inserts the business domain record into the orders table. This record is visible only to this transaction.',
  },
  {
    id: 3,
    label: '3. INSERT INTO outbox_events',
    source: 'APP',
    target: 'DB',
    color: '#38bdf8',
    dbState: 'Orders: [...] | Outbox: [id=1, event=OrderPlaced] (Uncommitted)',
    kafkaState: 'Topic: [empty]',
    detail: 'Application writes the event payload (JSON) into the outbox_events table within the same transaction. This guarantees atomicity.',
  },
  {
    id: 4,
    label: '4. COMMIT TRANSACTION',
    source: 'APP',
    target: 'DB',
    color: '#34d399',
    dbState: 'Orders: [id=101] (Committed) | Outbox: [id=1] (Committed)',
    kafkaState: 'Topic: [empty]',
    detail: 'Transaction commits. Both the order and the outbox event are made durable on disk simultaneously. If commit fails, both roll back.',
  },
  {
    id: 5,
    label: '5. SELECT unprocessed events',
    source: 'RELAY',
    target: 'DB',
    color: '#fbbf24',
    dbState: 'Orders: [id=101] | Outbox: [id=1] (Read by Relay)',
    kafkaState: 'Topic: [empty]',
    detail: 'Asynchronous Relay (CDC engine like Debezium or polling job) queries/reads un-emitted events from the outbox_events table.',
  },
  {
    id: 6,
    label: '6. Publish Event to Broker',
    source: 'RELAY',
    target: 'KAFKA',
    color: '#a78bfa',
    dbState: 'Orders: [id=101] | Outbox: [id=1]',
    kafkaState: 'Topic: [OrderPlaced-101]',
    detail: 'Relay publishes the event payload to the target message broker/Kafka topic. Event is now visible downstream.',
  },
  {
    id: 7,
    label: '7. DELETE / Mark as Published',
    source: 'RELAY',
    target: 'DB',
    color: '#34d399',
    dbState: 'Orders: [id=101] | Outbox: [] (Cleaned/Marked)',
    kafkaState: 'Topic: [OrderPlaced-101]',
    detail: 'Upon successful delivery confirmation, Relay deletes the outbox record or flags it as published to prevent redundant transmissions.',
  },
];

export default function TransactionalOutboxDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(3); // start at commit txn step visually
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

  // Helper coordinate functions for sequence diagram lines
  const getActorX = (actor: string) => {
    switch (actor) {
      case 'APP': return 50;
      case 'DB': return 160;
      case 'RELAY': return 270;
      case 'KAFKA': return 380;
      default: return 50;
    }
  };

  // Helper to get color-matching marker ID
  const getMarkerId = (stepColor: string, isSelected: boolean) => {
    if (!isSelected) return 'url(#outbox-arr-default)';
    switch (stepColor) {
      case '#38bdf8': return 'url(#outbox-arr-cyan)';
      case '#34d399': return 'url(#outbox-arr-green)';
      case '#fbbf24': return 'url(#outbox-arr-yellow)';
      case '#a78bfa': return 'url(#outbox-arr-purple)';
      default: return 'url(#outbox-arr-default)';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span>Transactional Outbox Orchestration Flow</span>
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
          {playing ? 'Animating…' : 'Animate Seq'}
        </button>
      </div>

      <style>{`
        .outbox-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .outbox-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="outbox-grid">
        
        {/* SVG Flow canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 430 320" className="interactive-diagram-svg">
            <defs>
              <marker id="outbox-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="outbox-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="outbox-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="outbox-arr-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="outbox-arr-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Vertical Lifelines */}
            <line x1="50" y1="40" x2="50" y2="290" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="160" y1="40" x2="160" y2="290" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="270" y1="40" x2="270" y2="290" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="380" y1="40" x2="380" y2="290" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

            {/* Actor Boxes */}
            <g>
              <rect x="15" y="10" width="70" height="25" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="50" y="26" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold">Application</text>
            </g>
            <g>
              <rect x="125" y="10" width="70" height="25" rx="4" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.2" />
              <text x="160" y="26" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="bold">Database</text>
            </g>
            <g>
              <rect x="235" y="10" width="70" height="25" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="270" y="26" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold">Relay (CDC)</text>
            </g>
            <g>
              <rect x="345" y="10" width="70" height="25" rx="4" fill="rgba(167,135,250,0.1)" stroke="#a78bfa" strokeWidth="1.2" />
              <text x="380" y="26" textAnchor="middle" fill="#a78bfa" fontSize="8.5" fontWeight="bold">Broker</text>
            </g>

            {/* Steps Timeline Arrows */}
            {STEPS.map((step, idx) => {
              const isSelected = activeStep === idx;
              const yVal = 60 + idx * 30;
              const xStart = getActorX(step.source);
              const xEnd = getActorX(step.target);

              // 6px offset at start lifeline, 12px offset at end lifeline (so 6px arrowhead tip does not touch the target lifeline)
              const startOffset = xEnd > xStart ? 6 : (xEnd < xStart ? -6 : 0);
              const endOffset = xEnd > xStart ? -12 : (xEnd < xStart ? 12 : 0);
              const xStartAdjusted = xStart + startOffset;
              const xEndAdjusted = xEnd + endOffset;

              const activeMarker = getMarkerId(step.color, isSelected);

              return (
                <g key={step.id} onClick={() => { if (!playing) setActiveStep(idx); }} style={{ cursor: playing ? 'default' : 'pointer' }}>
                  {/* Arrow path */}
                  {xStart !== xEnd ? (
                    <path
                      id={`arrow-${step.id}`}
                      d={`M ${xStartAdjusted} ${yVal} L ${xEndAdjusted} ${yVal}`}
                      fill="none"
                      stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                      strokeWidth={isSelected ? '2' : '1.2'}
                      markerEnd={activeMarker}
                      style={{ transition: 'stroke 0.2s' }}
                      className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                    />
                  ) : (
                    // Self looping action
                    <path
                      id={`arrow-${step.id}`}
                      d={`M ${xStart} ${yVal - 5} C ${xStart + 20} ${yVal - 10}, ${xStart + 20} ${yVal + 10}, ${xStart} ${yVal + 5}`}
                      fill="none"
                      stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                      strokeWidth={isSelected ? '2' : '1.2'}
                      markerEnd={activeMarker}
                      style={{ transition: 'stroke 0.2s' }}
                      className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                    />
                  )}

                  {/* Flowing animated dot */}
                  {isSelected && xStart !== xEnd && (
                    <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1s" repeatCount="indefinite">
                        <mpath href={`#arrow-${step.id}`} />
                      </animateMotion>
                    </circle>
                  )}

                  {/* Step Label Text */}
                  <text
                    x={xStart === xEnd ? xStart + 24 : (xStart + xEnd) / 2}
                    y={yVal - 5}
                    textAnchor={xStart === xEnd ? 'start' : 'middle'}
                    fill={isSelected ? step.color : 'rgba(255,255,255,0.2)'}
                    fontSize="7.5"
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

        {/* State Monitor & Inspector details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* DB State Monitor */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Database Monitor (Local Transaction State)
            </div>
            <code style={{ fontSize: '11px', display: 'block', color: '#e2e8f0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {current.dbState}
            </code>
          </div>

          {/* Broker State Monitor */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Message Broker / Kafka topic State
            </div>
            <code style={{ fontSize: '11px', display: 'block', color: '#a78bfa', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {current.kafkaState}
            </code>
          </div>

          {/* Inspector Detail */}
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
