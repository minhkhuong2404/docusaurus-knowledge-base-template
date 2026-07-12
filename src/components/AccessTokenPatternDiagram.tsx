import React, { useState } from 'react';

type Step = 'api-success' | 'api-expired' | 'token-refresh';

export default function AccessTokenPatternDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<Step>('api-success');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 Access Token + Refresh Token Pattern
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveStep('api-success')} style={{ background: activeStep === 'api-success' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'api-success' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'api-success' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1. Success</button>
          <button onClick={() => setActiveStep('api-expired')} style={{ background: activeStep === 'api-expired' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'api-expired' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'api-expired' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>2. Expired</button>
          <button onClick={() => setActiveStep('token-refresh')} style={{ background: activeStep === 'token-refresh' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'token-refresh' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'token-refresh' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>3. Refresh</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="ac-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Actor Nodes */}
          <g transform="translate(60, 90)">
            <rect x="-40" y="-30" width="80" height="60" rx="6" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#38bdf8', textAnchor: 'middle' }}>Client App</text>
          </g>

          <g transform="translate(340, 90)">
            <rect x="-55" y="-30" width="110" height="60" rx="6" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#a78bfa', textAnchor: 'middle' }}>Resource API</text>
          </g>

          <g transform="translate(600, 90)">
            <rect x="-55" y="-30" width="110" height="60" rx="6" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#4ade80', textAnchor: 'middle' }}>Auth Server</text>
          </g>

          {/* Dynamic Flows depending on selected scenario */}
          {activeStep === 'api-success' && (
            <>
              {/* Call with active token */}
              <path id="flow-success-req" d="M 100 80 L 285 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ac-arr)" />
              <text x="192" y="70" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#38bdf8', textAnchor: 'middle' }}>GET /orders (Bearer AccessToken)</text>
              <circle r="3" fill="#38bdf8">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#flow-success-req" /></animateMotion>
              </circle>

              <path d="M 285 100 L 100 100" fill="none" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ac-arr)" />
              <text x="192" y="117" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#94a3b8', textAnchor: 'middle' }}>200 OK (Orders list)</text>
            </>
          )}

          {activeStep === 'api-expired' && (
            <>
              {/* Call with expired token */}
              <path id="flow-expired-req" d="M 100 80 L 285 80" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#ac-arr)" />
              <text x="192" y="70" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#38bdf8', textAnchor: 'middle' }}>GET /orders (Bearer ExpiredToken)</text>

              <path id="flow-expired-res" d="M 285 100 L 100 100" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#ac-arr)" />
              <text x="192" y="117" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>401 Unauthorized (Expired)</text>
              <circle r="3" fill="#f87171">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#flow-expired-res" /></animateMotion>
              </circle>
            </>
          )}

          {activeStep === 'token-refresh' && (
            <>
              {/* Refresh Call directly to Auth Server */}
              <path id="flow-refresh-req" d="M 100 110 C 160 160, 480 160, 545 110" fill="none" stroke="#fb923c" strokeWidth="2" markerEnd="url(#ac-arr)" />
              <text x="320" y="157" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#fb923c', textAnchor: 'middle' }}>POST /auth/refresh (send RefreshToken)</text>
              <circle r="3" fill="#fb923c">
                <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#flow-refresh-req" /></animateMotion>
              </circle>

              <path id="flow-refresh-res" d="M 545 70 C 480 20, 160 20, 100 70" fill="none" stroke="#4ade80" strokeWidth="2" markerEnd="url(#ac-arr)" />
              <text x="320" y="32" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>Return NEW AccessToken + ROTATED RefreshToken</text>
              <circle r="3" fill="#4ade80">
                <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#flow-refresh-res" /></animateMotion>
              </circle>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {activeStep === 'api-success' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Step 1: Normal API Access</strong> — Access Token (typically 5-15 min lifespan) is transmitted with every API request inside the Authorization header. Because the token is valid, the Resource API serves the request immediately without doing DB or authentication calls.
          </p>
        )}
        {activeStep === 'api-expired' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Step 2: Access Token Expiry</strong> — The token naturally reaches its expiration time. The Resource API rejects the token locally, returning a <code>401 Unauthorized</code> response indicating the credential expired.
          </p>
        )}
        {activeStep === 'token-refresh' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Step 3: Refresh Flow</strong> — The client intercepts the 401 error and posts the long-lived <code>refresh_token</code> (stored safely in an HttpOnly cookie) to the Auth Server. The Auth Server validates it, invalidates the old refresh token, and returns a new Access Token and a rotated Refresh Token.
          </p>
        )}
      </div>
    </div>
  );
}
