import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    id: 1,
    direction: 'right' as const,
    method: 'GET',
    path: '/products',
    version: 'HTTP/1.1',
    color: '#38bdf8',
    label: '"Give me the products page"',
    response: null,
  },
  {
    id: 2,
    direction: 'left' as const,
    method: null,
    path: null,
    version: null,
    color: '#34d399',
    label: '"Here it is"',
    response: { code: '200', name: 'OK', body: 'HTML' },
  },
  {
    id: 3,
    direction: 'right' as const,
    method: 'POST',
    path: '/cart',
    version: 'HTTP/1.1',
    color: '#a78bfa',
    label: '"Add item to my cart"',
    extra: 'Cookie: session=abc123',
    response: null,
  },
  {
    id: 4,
    direction: 'left' as const,
    method: null,
    path: null,
    version: null,
    color: '#34d399',
    label: '"Done, item added"',
    response: { code: '201', name: 'Created', body: null },
  },
];

const CONCEPTS = [
  {
    id: 'stateless',
    label: 'Stateless',
    color: '#f87171',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 9a3 3 0 1 1 6 0c0 2-3 3-3 3" /><circle cx="12" cy="19" r="1" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    desc: 'Every request is completely independent. The server remembers nothing between requests. Each request must carry all context it needs (tokens, cookies, session IDs).',
  },
  {
    id: 'request-response',
    label: 'Request-Response',
    color: '#38bdf8',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    desc: 'Client always initiates. Server always responds. This is a pull model — the server cannot push data unless you use WebSockets, SSE, or HTTP/2 server push.',
  },
  {
    id: 'tcp',
    label: 'TCP / QUIC Transport',
    color: '#fbbf24',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    desc: 'HTTP/1.x and HTTP/2 run over TCP. HTTP/3 runs over QUIC (UDP-based). TCP provides the reliable, ordered delivery that HTTP relies on for byte-perfect page transfer.',
  },
  {
    id: 'cookie',
    label: 'Cookie Workaround',
    color: '#a78bfa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" />
        <circle cx="8.5" cy="9" r="1.5" fill="currentColor" /><circle cx="14" cy="15" r="1.5" fill="currentColor" />
        <path d="M15.5 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      </svg>
    ),
    desc: 'Since HTTP is stateless, cookies carry a session ID with every request. The server looks up the session in its database to know who you are — statefulness lives in the app, not HTTP.',
  },
];

export default function HttpWhatIsDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (animStep >= STEPS.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStep(animStep);
      setAnimStep(s => s + 1);
    }, 900);
    return () => clearTimeout(timer);
  }, [playing, animStep]);

  const handlePlay = () => {
    setActiveStep(null);
    setAnimStep(0);
    setPlaying(true);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>What Is HTTP? — Request-Response Flow</span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {playing ? 'Playing…' : 'Animate'}
        </button>
      </div>

      {/* Flow diagram */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
        {/* Browser box */}
        <div style={{
          background: 'rgba(56,189,248,0.10)', border: '1.5px solid rgba(56,189,248,0.35)',
          borderRadius: '12px', padding: '14px 10px', textAlign: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Browser</div>
          <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '3px' }}>You (Client)</div>
        </div>

        {/* Steps column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isRequest = step.direction === 'right';
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  display: 'flex',
                  flexDirection: isRequest ? 'row' : 'row-reverse',
                  alignItems: 'center', gap: '8px',
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.3,
                  transition: 'opacity 0.5s ease, transform 0.3s ease',
                  transform: isActive ? 'translateY(0)' : 'translateY(4px)',
                }}
              >
                {/* Arrow */}
                <div style={{
                  flex: 1, height: '2px',
                  background: `linear-gradient(${isRequest ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    [isRequest ? 'right' : 'left']: '-1px',
                    top: '-4px',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    [isRequest ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}`,
                  }} />
                </div>

                {/* Label bubble */}
                <div style={{
                  padding: '5px 10px', borderRadius: '7px',
                  background: `${step.color}18`,
                  border: `1px solid ${step.color}40`,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {step.response ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: step.color, fontWeight: 700 }}>
                      {step.response.code} {step.response.name}
                      {step.response.body ? ` + ${step.response.body}` : ''}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: step.color, fontWeight: 700 }}>
                      {step.method} {step.path}
                    </span>
                  )}
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '1px' }}>
                    {step.label}
                  </div>
                  {step.extra && (
                    <div style={{ fontSize: '10px', color: '#a78bfa', fontFamily: 'monospace', marginTop: '2px' }}>
                      {step.extra}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Server box */}
        <div style={{
          background: 'rgba(52,211,153,0.10)', border: '1.5px solid rgba(52,211,153,0.35)',
          borderRadius: '12px', padding: '14px 10px', textAlign: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
            <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>Server</div>
          <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '3px' }}>api.example.com</div>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center', marginBottom: '20px', fontStyle: 'italic' }}>
        Click any arrow to highlight it · Hit Animate to replay the flow
      </div>

      {/* Core concepts */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Core Properties of HTTP
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {CONCEPTS.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveConcept(activeConcept === c.id ? null : c.id)}
              style={{
                padding: '11px 14px', borderRadius: '10px', cursor: 'pointer',
                background: activeConcept === c.id ? `${c.color}12` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${activeConcept === c.id ? c.color + '50' : 'rgba(255,255,255,0.07)'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: activeConcept === c.id ? '8px' : '0' }}>
                <span style={{ color: c.color }}>{c.icon}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: activeConcept === c.id ? c.color : 'var(--ifm-color-content)' }}>
                  {c.label}
                </span>
              </div>
              {activeConcept === c.id && (
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  {c.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
