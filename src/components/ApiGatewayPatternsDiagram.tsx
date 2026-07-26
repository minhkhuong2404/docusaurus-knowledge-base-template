import React, { useState } from 'react';

export default function ApiGatewayPatternsDiagram() {
  const [selectedLayer, setSelectedLayer] = useState<'gateway' | 'service'>('gateway');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span>API Gateway Architecture &amp; Responsibilities Matrix</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setSelectedLayer('gateway')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: selectedLayer === 'gateway' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: selectedLayer === 'gateway' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedLayer === 'gateway' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🛡️ API Gateway Level (Cross-Cutting Infrastructure)
        </button>
        <button
          onClick={() => setSelectedLayer('service')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: selectedLayer === 'service' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: selectedLayer === 'service' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedLayer === 'service' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ⚙️ Microservice Level (Domain &amp; Business Logic)
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {selectedLayer === 'gateway' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>TLS Termination</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>HTTPS → HTTP Internal</div>
            </div>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>JWT Verification</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Validates Auth Tokens</div>
            </div>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Rate Limiting &amp; CORS</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Redis Quota Enforcement</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Business Invariants</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Domain Rules &amp; Authorization</div>
            </div>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Data Validation</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>DTO @Valid Constraint Checking</div>
            </div>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Database Transactions</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>PostgreSQL / Redis Access</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {selectedLayer === 'gateway' ? (
          <span><strong>API Gateway Golden Rule:</strong> The gateway must remain a dumb pipe for infrastructure concerns (Auth, Rate Limiting, SSL, Routing). Never put domain business logic inside the gateway.</span>
        ) : (
          <span><strong>Microservice Responsibility:</strong> Business logic, fine-grained domain authorization ("Can user 42 view order 99?"), input validation, and database persistence belong inside individual microservices.</span>
        )}
      </div>
    </div>
  );
}
