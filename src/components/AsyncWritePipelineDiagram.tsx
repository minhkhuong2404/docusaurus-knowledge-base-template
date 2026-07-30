import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    id: 1,
    from: 'Client',
    to: 'API Gateway',
    label: '1. POST /orders',
    details: 'Client issues write request to the REST endpoint. API Gateway acts as a producer.',
    color: '#38bdf8',
    y: 70,
    dir: 'right'
  },
  {
    id: 2,
    from: 'API Gateway',
    to: 'Kafka Broker',
    label: '2. Publish Event',
    details: 'API Gateway publishes order event partitioned by order_id to Kafka.',
    color: '#38bdf8',
    y: 85,
    dir: 'right'
  },
  {
    id: 3,
    from: 'Kafka Broker',
    to: 'API Gateway',
    label: '3. Acknowledge (ISR)',
    details: 'Kafka confirms message replication across In-Sync Replicas (acks=all).',
    color: '#34d399',
    y: 100,
    dir: 'left'
  },
  {
    id: 4,
    from: 'API Gateway',
    to: 'Client',
    label: '4. 202 Accepted',
    details: 'API returns HTTP 202 immediately to free application thread. Client can poll state.',
    color: '#34d399',
    y: 115,
    dir: 'left'
  },
  {
    id: 5,
    from: 'Kafka Broker',
    to: 'Consumer Worker',
    label: '5. Poll Batch',
    details: 'Consumer worker polls batch (up to 500 records) from dedicated partition.',
    color: '#a78bfa',
    y: 130,
    dir: 'right'
  },
  {
    id: 6,
    from: 'Consumer Worker',
    to: 'Write DB',
    label: '6. Batch Insert',
    details: 'Consumer issues a single batched INSERT / COPY command to the Database.',
    color: '#a78bfa',
    y: 145,
    dir: 'right'
  },
  {
    id: 7,
    from: 'Write DB',
    to: 'Consumer Worker',
    label: '7. DB Commit',
    details: 'Database commits transaction, guarantees persistence, and returns success.',
    color: '#34d399',
    y: 160,
    dir: 'left'
  },
  {
    id: 8,
    from: 'Consumer Worker',
    to: 'Kafka Broker',
    label: '8. Commit Offset',
    details: 'Consumer commits offsets to Kafka, ensuring at-least-once processing semantics.',
    color: '#2dd4bf',
    y: 175,
    dir: 'left'
  }
];

const ACTORS = [
  { name: 'Client', x: 60, color: '#38bdf8' },
  { name: 'API Gateway', x: 210, color: '#38bdf8' },
  { name: 'Kafka Broker', x: 360, color: '#fbbf24' },
  { name: 'Consumer Worker', x: 510, color: '#a78bfa' },
  { name: 'Write DB', x: 640, color: '#34d399' }
];

export default function AsyncWritePipelineDiagram(): React.JSX.Element {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>Async Write Pipeline Sequence</span>
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
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(45, 212, 191, 0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#2dd4bf',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(45, 212, 191, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {playing ? 'Playing...' : 'Animate Flow'}
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 700 220" className="interactive-diagram-svg">
          <defs>
            {/* Markers for left/right directional lines */}
            {STEPS.map(s => (
              <marker
                key={`arr-${s.id}`}
                id={`seq-arr-${s.id}`}
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
              {/* Vertical line with dashed stroke */}
              <line
                x1={actor.x}
                y1={45}
                x2={actor.x}
                y2={205}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              {/* Actor box */}
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
                fontSize="9.5"
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
            
            // Add offsets so lines don't touch lifelines (Rule 10)
            const padding = step.dir === 'right' ? 8 : -8;
            const startX = fromX + padding;
            const targetX = toX - padding;
            
            const pathId = `seq-path-${step.id}`;
            const pathD = `M ${startX} ${step.y} L ${targetX} ${step.y}`;

            const isShown = activeStep === null || idx <= activeStep;

            return (
              <g
                key={step.id}
                style={{ cursor: 'pointer', opacity: isShown ? 1 : 0.2, transition: 'opacity 0.3s' }}
                onClick={() => {
                  setPlaying(false);
                  setActiveStep(activeStep === idx ? null : idx);
                }}
              >
                {/* Horizontal line */}
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke={step.color}
                  strokeWidth={isSelected ? 2 : 1.2}
                  markerEnd={`url(#seq-arr-${step.id})`}
                  className={isSelected ? 'interactive-diagram-flowing-path' : ''}
                  style={{ transition: 'stroke-width 0.2s' }}
                />

                {/* Packet flow */}
                {isSelected && (
                  <circle r="3" fill={step.color} className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.9s" repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}

                {/* Step label on arrow */}
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

      {/* Detail Card */}
      {selected ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: selected.color }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: selected.color }}>
              {selected.label} — {selected.from} to {selected.to}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>
            {selected.details}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '14px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
          Click an arrow or click "Animate Flow" to step through the sequence execution
        </div>
      )}
    </div>
  );
}
