import React, { useState, useEffect } from 'react';

interface JobStep {
  id: number;
  label: string;
  source: 'CLIENT' | 'API' | 'WORKER';
  target: 'CLIENT' | 'API' | 'WORKER';
  direction: 'right' | 'left' | 'none';
  color: string;
  statusText: string;
  progress: number;
  explanation: string;
}

const STEPS: JobStep[] = [
  {
    id: 1,
    label: '1. POST /api/reports',
    source: 'CLIENT',
    target: 'API',
    direction: 'right',
    color: '#38bdf8',
    statusText: 'None',
    progress: 0,
    explanation: 'The client requests a long-running report creation by submitting configuration metadata.',
  },
  {
    id: 2,
    label: '2. 202 Accepted { job_id }',
    source: 'API',
    target: 'CLIENT',
    direction: 'left',
    color: '#34d399',
    statusText: 'ACCEPTED (job_id: 101)',
    progress: 0,
    explanation: 'The API server persists a pending job record and immediately returns a 202 Accepted status with a job_id status URL, freeing the client thread.',
  },
  {
    id: 3,
    label: '3. Delegate to Worker',
    source: 'API',
    target: 'WORKER',
    direction: 'right',
    color: '#fbbf24',
    statusText: 'QUEUED',
    progress: 0,
    explanation: 'The API server pushes the job execution task into the queue. A background worker picks up the message.',
  },
  {
    id: 4,
    label: '4. GET /api/reports/101 (Polling)',
    source: 'CLIENT',
    target: 'API',
    direction: 'right',
    color: '#a78bfa',
    statusText: 'RUNNING',
    progress: 45,
    explanation: 'The client polls the status URL. The API reads progress from Redis and returns status: RUNNING with progress: 45%.',
  },
  {
    id: 5,
    label: '5. Save Result to Store',
    source: 'WORKER',
    target: 'API',
    direction: 'left',
    color: '#34d399',
    statusText: 'COMPLETED',
    progress: 100,
    explanation: 'The worker successfully completes report creation and stores the artifact (e.g. S3 file link) in the database, changing status to COMPLETED.',
  },
  {
    id: 6,
    label: '6. GET /api/reports/101 (Completed)',
    source: 'CLIENT',
    target: 'API',
    direction: 'right',
    color: '#34d399',
    statusText: 'COMPLETED',
    progress: 100,
    explanation: 'The client polls again. The API returns status: COMPLETED along with the direct result download URL.',
  },
  {
    id: 7,
    label: '7. GET /api/reports/101/result',
    source: 'CLIENT',
    target: 'API',
    direction: 'right',
    color: '#e2e8f0',
    statusText: 'SUCCESS',
    progress: 100,
    explanation: 'Client retrieves the finalized document binary payload directly from the result store URL.',
  },
];

export default function CoreAsyncJobPatternDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(1);
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
      case 'CLIENT': return 60;
      case 'API': return 190;
      case 'WORKER': return 320;
      default: return 60;
    }
  };

  // Helper to get color-matching marker ID
  const getMarkerId = (stepColor: string, isSelected: boolean) => {
    if (!isSelected) return 'url(#async-arr-default)';
    switch (stepColor) {
      case '#38bdf8': return 'url(#async-arr-cyan)';
      case '#34d399': return 'url(#async-arr-green)';
      case '#fbbf24': return 'url(#async-arr-yellow)';
      case '#a78bfa': return 'url(#async-arr-purple)';
      case '#e2e8f0': return 'url(#async-arr-grey)';
      default: return 'url(#async-arr-default)';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Core Asynchronous Job Sequence Pattern</span>
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
        .async-job-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .async-job-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="async-job-grid">
        
        {/* SVG Flow area */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 380 290" className="interactive-diagram-svg">
            <defs>
              <marker id="async-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="async-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="async-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="async-arr-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="async-arr-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
              <marker id="async-arr-grey" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e2e8f0" />
              </marker>
            </defs>

            {/* Vertical Lifelines */}
            <line x1="60" y1="40" x2="60" y2="260" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="190" y1="40" x2="190" y2="260" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="320" y1="40" x2="320" y2="260" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

            {/* Actor Boxes */}
            <g>
              <rect x="25" y="10" width="70" height="25" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="60" y="26" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold">Client</text>
            </g>
            <g>
              <rect x="155" y="10" width="70" height="25" rx="4" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.2" />
              <text x="190" y="26" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="bold">API Gateway</text>
            </g>
            <g>
              <rect x="285" y="10" width="70" height="25" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="320" y="26" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold">Worker</text>
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
                  <path
                    id={`arr-${step.id}`}
                    d={`M ${xStartAdjusted} ${yVal} L ${xEndAdjusted} ${yVal}`}
                    fill="none"
                    stroke={isSelected ? step.color : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    markerEnd={activeMarker}
                    style={{ transition: 'stroke 0.2s' }}
                    className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                  />

                  {/* Flowing animated dot */}
                  {isSelected && (
                    <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1s" repeatCount="indefinite">
                        <mpath href={`#arr-${step.id}`} />
                      </animateMotion>
                    </circle>
                  )}

                  {/* Step Label */}
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

        {/* State monitor and detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Status block */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Job Status Monitor
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content)' }}>
                {current.statusText}
              </span>
              <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>
                Progress: {current.progress}%
              </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${current.progress}%`, background: '#34d399', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Details block */}
          <div style={{ borderLeft: `3px solid ${current.color}`, paddingLeft: '10px', minHeight: '100px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Step Details
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {current.explanation}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
