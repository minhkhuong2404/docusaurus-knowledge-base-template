import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    id: 1,
    from: 'Client',
    to: 'Router',
    label: '1. Query key "usr_101"',
    desc: 'Client issues query for a specific row key to the router gateway.',
    color: '#38bdf8',
    y: 70,
    dir: 'right'
  },
  {
    id: 2,
    from: 'Router',
    to: 'Shard Map DB',
    label: '2. Directory Lookup',
    desc: 'Router queries the central Shard Map Directory DB to look up the shard host for "usr_101".',
    color: '#fbbf24',
    y: 95,
    dir: 'right'
  },
  {
    id: 3,
    from: 'Shard Map DB',
    to: 'Router',
    label: '3. Return Host Info',
    desc: 'Shard Map lookup returns "usr_101 is located on Shard 2 (Port 5433)".',
    color: '#34d399',
    y: 120,
    dir: 'left'
  },
  {
    id: 4,
    from: 'Router',
    to: 'Shard 2',
    label: '4. Direct Routing',
    desc: 'Router forwards the client write/read transaction directly to Shard 2 database.',
    color: '#2dd4bf',
    y: 145,
    dir: 'right'
  },
  {
    id: 5,
    from: 'Shard 2',
    to: 'Router',
    label: '5. Return Data',
    desc: 'Shard 2 processes transaction and returns result to Router, which responds to Client.',
    color: '#34d399',
    y: 170,
    dir: 'left'
  }
];

const ACTORS = [
  { name: 'Client', x: 50, color: '#38bdf8' },
  { name: 'Router', x: 190, color: '#38bdf8' },
  { name: 'Shard Map DB', x: 350, color: '#fbbf24' },
  { name: 'Shard 1', x: 500, color: '#cbd5e1' },
  { name: 'Shard 2', x: 630, color: '#34d399' }
];

export default function DirectoryLookupServiceDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (playing) {
      if (playIndex < STEPS.length) {
        t = setTimeout(() => {
          setActiveStep(playIndex);
          setPlayIndex(p => p + 1);
        }, 1100);
      } else {
        setPlaying(false);
        setPlayIndex(0);
      }
    }
    return () => clearTimeout(t);
  }, [playing, playIndex]);

  const handlePlay = () => {
    setActiveStep(null);
    setPlayIndex(0);
    setPlaying(true);
  };

  const selected = activeStep !== null ? STEPS[activeStep] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Directory / Lookup Service Router Flow</span>
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
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(251, 191, 36, 0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#fbbf24',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(251, 191, 36, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {playing ? 'Playing...' : 'Animate Flow'}
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 215" className="interactive-diagram-svg">
          <defs>
            {STEPS.map(s => (
              <marker
                key={`arr-lookup-${s.id}`}
                id={`arr-lookup-marker-${s.id}`}
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={s.color} />
              </marker>
            ))}
          </defs>

          {/* Actor Lifelines */}
          {ACTORS.map(actor => (
            <g key={actor.name}>
              <line
                x1={actor.x}
                y1={45}
                x2={actor.x}
                y2={200}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <rect
                x={actor.x - 45}
                y={15}
                width={90}
                height={26}
                rx="5"
                fill="rgba(13, 15, 30, 0.9)"
                stroke={actor.color}
                strokeWidth="1.5"
              />
              <text
                x={actor.x}
                y={31}
                textAnchor="middle"
                fill={actor.color}
                fontSize="9"
                fontWeight="800"
              >
                {actor.name}
              </text>
            </g>
          ))}

          {/* Sequence Steps */}
          {STEPS.map((step, idx) => {
            const isSelected = activeStep === idx;
            const fromX = ACTORS.find(a => a.name === step.from)?.x || 0;
            const toX = ACTORS.find(a => a.name === step.to)?.x || 0;

            // Offsets to avoid overlapping lifelines (Rule 10)
            const padding = step.dir === 'right' ? 8 : -8;
            const startX = fromX + padding;
            const targetX = toX - padding;

            const pathId = `lookup-path-${step.id}`;
            const pathD = `M ${startX} ${step.y} L ${targetX} ${step.y}`;

            const isShown = activeStep === null || idx <= activeStep;

            return (
              <g
                key={step.id}
                style={{ cursor: 'pointer', opacity: isShown ? 1 : 0.25, transition: 'opacity 0.3s' }}
                onClick={() => {
                  setPlaying(false);
                  setActiveStep(activeStep === idx ? null : idx);
                }}
              >
                {/* Horizontal flow line */}
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke={step.color}
                  strokeWidth={isSelected ? 2 : 1.2}
                  markerEnd={`url(#arr-lookup-marker-${step.id})`}
                  className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Particle */}
                {isSelected && (
                  <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.9s" repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}

                {/* Step Label */}
                <text
                  x={(fromX + toX) / 2}
                  y={step.y - 4}
                  textAnchor="middle"
                  fill={isSelected ? step.color : 'var(--ifm-color-content-secondary)'}
                  fontSize="8.5"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {step.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Details Card */}
      {selected ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: selected.color }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: selected.color }}>
              {selected.label} — {selected.from} to {selected.to}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>
            {selected.desc}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '14px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
          Click an arrow or click "Animate Flow" to trace step lookups in a directory service routing topology.
        </div>
      )}
    </div>
  );
}
