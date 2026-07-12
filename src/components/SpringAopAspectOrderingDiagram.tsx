import React, { useState, useEffect } from 'react';

interface AspectLayer {
  order: string;
  name: string;
  color: string;
  role: string;
  gotcha: string;
}

const LAYERS: AspectLayer[] = [
  {
    order: 'Order 1',
    name: 'Spring Security (@PreAuthorize)',
    color: '#38bdf8',
    role: 'Evaluates caller roles and security credentials before letting the request descend further.',
    gotcha: 'Must run outermost so that unauthenticated queries fail-fast immediately without allocating databases connections or executing aspects.',
  },
  {
    order: 'Order 2',
    name: 'Logging / Tracing (MDC setup)',
    color: '#a78bfa',
    role: 'Sets up correlation IDs and MDC tracing context variables in ThreadLocal.',
    gotcha: 'Placed outer to metrics and transaction aspects so that exceptions thrown inside them are logged with proper transaction IDs.',
  },
  {
    order: 'Order 3',
    name: 'Metrics Aspect (@Timed)',
    color: '#fbbf24',
    role: 'Starts a stopwatch timer to record execution duration metrics.',
    gotcha: 'Must wrap the Retryable aspect to measure retry latency, or sit inside to count raw attempts.',
  },
  {
    order: 'Order 4',
    name: 'Retry Aspect (@Retryable)',
    color: '#f472b6',
    role: 'Catches transient exceptions and triggers retry loops.',
    gotcha: 'Must sit OUTSIDE @Transactional. If retry is inside transaction, the transaction rolls back once and subsequent retries run on a poisoned transaction context!',
  },
  {
    order: 'Order 5',
    name: 'Cache Aspect (@Cacheable)',
    color: '#2dd4bf',
    role: 'Intercepts call, checks cache manager, returns cached item immediately if present.',
    gotcha: 'Must sit OUTSIDE @Transactional. Caching reads should avoid opening transaction connections to free up database resources.',
  },
  {
    order: 'Order MAX-1',
    name: 'Transaction Aspect (@Transactional)',
    color: '#34d399',
    role: 'Acquires database connection, turns off auto-commit, and starts transaction.',
    gotcha: 'All downstream SQL operations run inside this transactional context boundary.',
  },
  {
    order: 'Order MAX',
    name: 'Validation Aspect (@Validated)',
    color: '#f97316',
    role: 'Validates constraints on arguments before target method executes.',
    gotcha: 'Innermost validation step. Prevents SQL execution if parameters fail constraints.',
  },
];

export default function SpringAopAspectOrderingDiagram(): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState<number | null>(4); // Default to Cacheable
  const [isPlaying, setIsPlaying] = useState(false);
  const [animIndex, setAnimIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    if (animIndex >= LAYERS.length + 1) { // includes target method
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStage(animIndex);
      setAnimIndex(idx => idx + 1);
    }, 900);
    return () => clearTimeout(timer);
  }, [isPlaying, animIndex]);

  const setActiveStage = (idx: number) => {
    if (idx < LAYERS.length) {
      setActiveLayer(idx);
    } else {
      setActiveLayer(null); // Indicates target method is running
    }
  };

  const startAnimation = () => {
    setActiveLayer(null);
    setAnimIndex(0);
    setIsPlaying(true);
  };

  const selectedAspect = activeLayer !== null ? LAYERS[activeLayer] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>Spring AOP Aspect Ordering Proxy Chain</span>
        <button
          onClick={startAnimation}
          disabled={isPlaying}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
            border: 'none', cursor: isPlaying ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: isPlaying ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: isPlaying ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: isPlaying ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {isPlaying ? 'Tracing call...' : 'Animate Call Flow'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Stack Representation */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '4px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginBottom: '8px', fontWeight: 700 }}>
            REQUEST FLOW (Top Down) ──► RESPONSE FLOW (Bottom Up)
          </div>

          {/* Stack Layers */}
          {LAYERS.map((l, idx) => {
            const isSelected = activeLayer === idx;
            const stepColor = l.color;
            return (
              <div
                key={idx}
                onClick={() => { if (!isPlaying) setActiveLayer(isSelected ? null : idx); }}
                style={{
                  padding: '10px', borderRadius: '6px', cursor: isPlaying ? 'not-allowed' : 'pointer',
                  background: isSelected ? `${stepColor}15` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? stepColor : 'rgba(255,255,255,0.05)'}`,
                  color: isSelected ? stepColor : 'var(--ifm-color-content)',
                  fontSize: '11.5px', fontWeight: 700, transition: 'all 0.2s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{l.name}</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>{l.order}</span>
              </div>
            );
          })}

          {/* Target method block */}
          <div style={{
            padding: '12px', borderRadius: '6px', textAlign: 'center',
            background: activeLayer === null && isPlaying ? 'rgba(52,211,153,0.2)' : 'rgba(0,0,0,0.2)',
            border: `1.5px solid ${activeLayer === null && isPlaying ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
            color: '#34d399', fontWeight: 800, fontSize: '12px', marginTop: '6px',
            transition: 'all 0.2s',
          }}>
            🎯 Target Method Execution (Inner Business Logic)
          </div>
        </div>

        {/* Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedAspect ? 'flex-start' : 'center',
        }}>
          {selectedAspect ? (
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: selectedAspect.color, display: 'block', marginBottom: '2px' }}>
                {selectedAspect.name}
              </span>
              <span style={{
                fontSize: '10.5px', fontWeight: 700, color: selectedAspect.color, display: 'block', marginBottom: '12px'
              }}>
                Precedence Chain: {selectedAspect.order}
              </span>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: selectedAspect.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Execution Role
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {selectedAspect.role}
                </div>
              </div>

              <div style={{ background: `${selectedAspect.color}0e`, border: `1px solid ${selectedAspect.color}30`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: selectedAspect.color, marginBottom: '3px' }}>
                  ⚠️ Critical Order Gotcha
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {selectedAspect.gotcha}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              {activeLayer === null && isPlaying ? (
                <div>
                  <h4 style={{ color: '#34d399', margin: '0 0 8px 0' }}>Executing Target Logic</h4>
                  <p style={{ fontSize: '12px', lineHeight: 1.4 }}>Currently evaluating raw domain method logic inside transaction boundaries with validation constraints checking database updates.</p>
                </div>
              ) : (
                '💡 Click on any stack layer on the left or click Animate Call Flow to see the aspect execution order.'
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
