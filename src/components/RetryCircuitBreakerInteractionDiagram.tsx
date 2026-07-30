import React, { useState } from 'react';

export default function RetryCircuitBreakerInteractionDiagram() {
  const [scenario, setScenario] = useState<'transient' | 'sustained'>('transient');
  const [cbOpen, setCbOpen] = useState<boolean>(false);

  const toggleScenario = (mode: 'transient' | 'sustained') => {
    setScenario(mode);
    setCbOpen(mode === 'sustained');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
        </svg>
        <span>Retry & Circuit Breaker Wrapping Order</span>

        {/* Toggle Scenario */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleScenario('transient')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: scenario === 'transient' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: scenario === 'transient' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: scenario === 'transient' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Transient Failure
          </button>
          <button onClick={() => toggleScenario('sustained')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: scenario === 'sustained' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: scenario === 'sustained' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: scenario === 'sustained' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Sustained Outage (CB Open)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="cb-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .cb-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* SVG Wrapper */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 250" className="interactive-diagram">
            <defs>
              <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arr-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
              </marker>
            </defs>

            {/* Outer Box: Circuit Breaker */}
            <rect x="130" y="30" width="240" height="180" rx="12" 
                  fill={cbOpen ? '#f871710e' : 'rgba(167,139,250,0.06)'} 
                  stroke={cbOpen ? '#f87171' : '#a78bfa'} 
                  strokeWidth="1.5" strokeDasharray={cbOpen ? '4 4' : '0'} />
            <text x="145" y="52" fill={cbOpen ? '#f87171' : '#a78bfa'} fontSize="11" fontWeight="bold">
              @CircuitBreaker (Outer Layer) — {cbOpen ? 'State: OPEN' : 'State: CLOSED'}
            </text>

            {/* Inner Box: Retry */}
            <rect x="160" y="75" width="180" height="110" rx="8" fill="#34d3990e" stroke="#34d399" strokeWidth="1.5" />
            <text x="175" y="95" fill="#34d399" fontSize="10.5" fontWeight="bold">
              @Retry (Inner Layer)
            </text>
            <text x="175" y="112" fill="#94a3b8" fontSize="8.5">
              Max Attempts: 3 | Backoff: Jitter
            </text>

            {/* Client */}
            <rect x="20" y="95" width="70" height="40" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="120" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Caller</text>

            {/* Downstream Service */}
            <rect x="410" y="95" width="75" height="40" rx="6" 
                  fill={scenario === 'sustained' ? '#f8717118' : '#34d39918'} 
                  stroke={scenario === 'sustained' ? '#f87171' : '#34d399'} strokeWidth="1.5" />
            <text x="447" y="120" textAnchor="middle" fill={scenario === 'sustained' ? '#f87171' : '#34d399'} fontSize="10.5" fontWeight="bold">Service</text>

            {/* Path Client -> CB */}
            {cbOpen ? (
              <g>
                <path d="M 90 115 L 128 115" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#arr-red)" />
                <line x1="125" y1="105" x2="135" y2="125" stroke="#f87171" strokeWidth="2" />
              </g>
            ) : (
              <g>
                <path id="path-cb-flow" d="M 90 115 L 402 115" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1.2s" repeatCount="indefinite">
                    <mpath href="#path-cb-flow" />
                  </animateMotion>
                </circle>
              </g>
            )}
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: cbOpen ? '#f8717140' : '#34d39940' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: cbOpen ? '#f87171' : '#34d399' }}>
              {cbOpen ? 'Circuit Breaker Open (Protection)' : 'Transient Retry Active'}
            </h3>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
            {scenario === 'transient'
              ? 'The Retry aspect is wrapped inside the Circuit Breaker. Brief 503s or timeouts are retried up to 3 times before the Circuit Breaker counts a failure.'
              : 'When downstream is down for minutes, retries repeatedly fail. The outer Circuit Breaker trips OPEN. Future calls fail fast immediately — preventing retries from flooding the dead service.'
            }
          </p>

          <div style={{
            fontSize: '11.5px', background: 'rgba(255,255,255,0.02)',
            padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '12px'
          }}>
            <strong style={{ color: '#a78bfa' }}>Annotation Ordering Rule:</strong>
            <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0' }}>
              Place <code>@CircuitBreaker</code> outside <code>@Retry</code>. If reversed, an open circuit breaker would prevent transient retries from executing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
