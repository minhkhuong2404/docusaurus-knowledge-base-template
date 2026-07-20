import React, { useState } from 'react';

export default function GatewayCircuitBreakerDiagram() {
  const [state, setState] = useState<'closed' | 'open' | 'halfopen'>('closed');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Gateway Circuit Breaker State Machine</span>

        {/* State selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setState('closed')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: state === 'closed' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: state === 'closed' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: state === 'closed' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            CLOSED (Normal 🟢)
          </button>

          <button onClick={() => setState('open')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: state === 'open' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: state === 'open' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: state === 'open' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            OPEN (Fast Fail 🚨)
          </button>

          <button onClick={() => setState('halfopen')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: state === 'halfopen' ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: state === 'halfopen' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: state === 'halfopen' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            HALF-OPEN (Probing 🟡)
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{
        borderColor: state === 'closed' ? '#34d39940' : state === 'open' ? '#f8717140' : '#fbbf2440'
      }}>
        <div className="interactive-diagram-card-header">
          <h3 style={{
            color: state === 'closed' ? '#34d399' : state === 'open' ? '#f87171' : '#fbbf24'
          }}>
            {state === 'closed' ? 'CLOSED State (Normal Operation)' : state === 'open' ? 'OPEN State (Failing Fast with Fallback)' : 'HALF-OPEN State (Probing Recovery)'}
          </h3>
        </div>

        <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
          {state === 'closed' && 'Requests pass through to downstream microservices normally. Gateway monitors failure rate across a rolling 10-second window.'}
          {state === 'open' && 'Downstream service has >50% failure rate. Gateway short-circuits all calls in 0ms, returning HTTP 503 fallback without placing load on downstream.'}
          {state === 'halfopen' && 'After wait duration (30s), gateway allows a small trial % of traffic through to probe downstream recovery. If successful -> returns to CLOSED.'}
        </p>

        <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px', marginTop: '8px' }}>
          <strong>Gateway Response Behavior:</strong>
          <div style={{
            color: state === 'closed' ? '#34d399' : state === 'open' ? '#f87171' : '#fbbf24',
            fontWeight: 'bold', marginTop: '2px'
          }}>
            {state === 'closed' && '➡️ Normal microservice response returned'}
            {state === 'open' && '⚡ Immediate 0ms Fallback Response: HTTP 503 {"error": "Payment service temporarily unavailable"}'}
            {state === 'halfopen' && '🔍 Probing backend: 10% test traffic allowed'}
          </div>
        </div>
      </div>
    </div>
  );
}
