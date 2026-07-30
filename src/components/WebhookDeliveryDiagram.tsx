import React, { useState, useEffect } from 'react';

interface WebhookStep {
  id: number;
  label: string;
  source: 'CLIENT' | 'API' | 'WORKER' | 'CALLBACK';
  target: 'CLIENT' | 'API' | 'WORKER' | 'CALLBACK';
  direction: 'right' | 'left' | 'none';
  color: string;
  detail: string;
}

const STEPS: WebhookStep[] = [
  {
    id: 1,
    label: '1. POST /reports { webhook_url }',
    source: 'CLIENT',
    target: 'API',
    direction: 'right',
    color: '#38bdf8',
    detail: 'Client submits request along with their public webhook callback URL: https://client.com/webhook.',
  },
  {
    id: 2,
    label: '2. 202 Accepted { job_id }',
    source: 'API',
    target: 'CLIENT',
    direction: 'left',
    color: '#34d399',
    detail: 'API persists request and returns 202 Accepted immediately, releasing the client socket.',
  },
  {
    id: 3,
    label: '3. Execute background task',
    source: 'WORKER',
    target: 'WORKER',
    direction: 'none',
    color: '#a78bfa',
    detail: 'Worker consumes job and runs processing logic asynchronously in background worker threads.',
  },
  {
    id: 4,
    label: '4. POST https://client.com/webhook',
    source: 'API',
    target: 'CALLBACK',
    direction: 'right',
    color: '#fbbf24',
    detail: 'Upon worker completion, API dispatches an asynchronous HTTP POST request carrying event payload { status: COMPLETED, result_url: ... }.',
  },
  {
    id: 5,
    label: '5. 200 OK (Acknowledge)',
    source: 'CALLBACK',
    target: 'API',
    direction: 'left',
    color: '#34d399',
    detail: 'Client callback server responds with HTTP 200 OK to acknowledge receipt. Transaction is finalized.',
  },
];

export default function WebhookDeliveryDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(3);
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
      case 'CLIENT': return 50;
      case 'API': return 150;
      case 'WORKER': return 250;
      case 'CALLBACK': return 350;
      default: return 50;
    }
  };

  // Helper to get color-matching marker ID
  const getMarkerId = (stepColor: string, isSelected: boolean) => {
    if (!isSelected) return 'url(#webhook-arr-default)';
    switch (stepColor) {
      case '#38bdf8': return 'url(#webhook-arr-cyan)';
      case '#34d399': return 'url(#webhook-arr-green)';
      case '#fbbf24': return 'url(#webhook-arr-yellow)';
      case '#a78bfa': return 'url(#webhook-arr-purple)';
      default: return 'url(#webhook-arr-default)';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span>Webhook Callback Flow Sequence</span>
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
        .webhook-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .webhook-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="webhook-grid">
        
        {/* SVG Sequence */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 400 230" className="interactive-diagram-svg">
            <defs>
              <marker id="webhook-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="webhook-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="webhook-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="webhook-arr-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="webhook-arr-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Vertical Lifelines */}
            <line x1="50" y1="40" x2="50" y2="200" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="150" y1="40" x2="150" y2="200" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="250" y1="40" x2="250" y2="200" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="350" y1="40" x2="350" y2="200" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

            {/* Actor Boxes */}
            <g>
              <rect x="15" y="10" width="70" height="25" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="50" y="26" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">Client</text>
            </g>
            <g>
              <rect x="115" y="10" width="70" height="25" rx="4" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.2" />
              <text x="150" y="26" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">API Server</text>
            </g>
            <g>
              <rect x="215" y="10" width="70" height="25" rx="4" fill="rgba(167,135,250,0.1)" stroke="#a78bfa" strokeWidth="1.2" />
              <text x="250" y="26" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="bold">Worker</text>
            </g>
            <g>
              <rect x="315" y="10" width="70" height="25" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="350" y="26" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">Callback Url</text>
            </g>

            {/* Steps Timeline Arrows */}
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
                      id={`wh-arr-${step.id}`}
                      d={`M ${xStartAdjusted} ${yVal} L ${xEndAdjusted} ${yVal}`}
                      fill="none"
                      stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                      strokeWidth={isSelected ? '2' : '1.2'}
                      markerEnd={activeMarker}
                      style={{ transition: 'stroke 0.2s' }}
                      className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                    />
                  ) : (
                    <path
                      id={`wh-arr-${step.id}`}
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
                        <mpath href={`#wh-arr-${step.id}`} />
                      </animateMotion>
                    </circle>
                  )}

                  {/* Step Label */}
                  <text
                    x={xStart === xEnd ? xStart + 22 : (xStart + xEnd) / 2}
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

        {/* Details card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: current.color }}>Step Details</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.45 }}>
            {current.detail}
          </p>
        </div>

      </div>
    </div>
  );
}
