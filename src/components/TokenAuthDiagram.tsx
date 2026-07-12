import React, { useState } from 'react';

export default function TokenAuthDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. POST /login',
      desc: 'User logs in by submitting credentials.',
      detail: 'Client App → POST /login'
    },
    {
      title: '2. Issue Signed JWT',
      desc: 'Server verifies credentials, serializes user data (claims) into a JSON payload, signs it using its Private Key, and returns it to the client.',
      detail: 'Server response body:\n{ "access_token": "eyJhbGciOiJSUzI1NiIsIn..." }'
    },
    {
      title: '3. API request with Bearer token',
      desc: 'Client App attaches token in Authorization header. The browser does NOT auto-attach it (preventing CSRF).',
      detail: 'HTTP request headers:\nAuthorization: Bearer eyJhbGciOiJSUzI1NiIsIn...'
    },
    {
      title: '4. Cryptographic Validation',
      desc: 'Server verifies the token signature locally using the public key. No DB check or Redis session lookup is needed!',
      detail: 'Signature check: RSA_Verify(TokenHeader + Payload, Signature, PublicKey) == Valid?'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔑 Token-Based Authentication (Stateless JWT)
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="tok-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Nodes */}
          <g transform="translate(150, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Browser Client</text>
          </g>

          <g transform="translate(530, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a78bfa', textAnchor: 'middle' }}>Auth/API Server</text>
          </g>

          {/* Dynamic flow overlays */}
          {activeStep === 0 && (
            <path d="M 210 80 L 470 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#tok-arr)" />
          )}
          {activeStep === 1 && (
            <path d="M 470 100 L 210 100" fill="none" stroke="#4ade80" strokeWidth="2.5" markerEnd="url(#tok-arr)" />
          )}
          {activeStep === 2 && (
            <path d="M 210 80 L 470 80" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#tok-arr)" />
          )}
          {activeStep === 3 && (
            <>
              {/* Highlight verification action on API server */}
              <circle cx="530" cy="90" r="45" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3,3">
                <animateTransform attributeName="transform" type="rotate" from="0 530 90" to="360 530 90" dur="8s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} disabled={activeStep === 0} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === 0 ? '#475569' : '#e2e8f0', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          ◀ Back
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
          Step {activeStep + 1} of {steps.length}
        </span>
        <button onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))} disabled={activeStep === steps.length - 1} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Next Step ▶
        </button>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px', borderLeftColor: '#a78bfa' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{steps[activeStep].title}</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {steps[activeStep].desc}
        </p>
        <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {steps[activeStep].detail}
        </pre>
      </div>
    </div>
  );
}
