import React, { useState } from 'react';

interface PkceStep {
  title: string;
  from: 'app' | 'idp' | 'user';
  to: 'app' | 'idp' | 'user' | 'self';
  detail: string;
  payload?: string;
  color: string;
}

const STEPS: PkceStep[] = [
  {
    title: '1. Generate Verifier & Challenge',
    from: 'app',
    to: 'self',
    detail: 'Client App generates a random high-entropy string (code_verifier). It computes code_challenge = Base64Url(SHA-256(code_verifier)). Plaintext verifier stays safe in App memory.',
    payload: 'code_verifier: "xyz123random..."\ncode_challenge: "SHA256_hash_abc..."',
    color: '#38bdf8'
  },
  {
    title: '2. Redirect user to IdP /authorize',
    from: 'app',
    to: 'idp',
    detail: 'App redirects browser to IdP /authorize endpoint, transmitting client_id, redirect_uri, scope, and the code_challenge + code_challenge_method=S256.',
    payload: 'GET /authorize?response_type=code&client_id=123\n&code_challenge=SHA256_hash_abc&code_challenge_method=S256',
    color: '#fb923c'
  },
  {
    title: '3. User authenticates & consents',
    from: 'user',
    to: 'idp',
    detail: 'User completes login at IdP page, unlocks credentials, and reviews OAuth scopes. Session is created between User and IdP.',
    payload: 'User Inputs: credentials, MFA validation\nGrant Consent: "App can read profile & email"',
    color: '#4ade80'
  },
  {
    title: '4. Redirect callback with Auth Code',
    from: 'idp',
    to: 'app',
    detail: 'IdP redirects user back to App redirect_uri, appending a temporary authorization code (auth_code) to URL params.',
    payload: 'HTTP 302 Redirect to redirect_uri\n?code=AUTH_CODE_xyz789&state=random_state_token',
    color: '#a78bfa'
  },
  {
    title: '5. Exchange code + verifier at /token',
    from: 'app',
    to: 'idp',
    detail: 'App backend (or SPA securely) posts the AUTH_CODE alongside the ORIGINAL plaintext code_verifier directly to IdP /token endpoint.',
    payload: 'POST /token\ngrant_type=authorization_code&code=AUTH_CODE_xyz789\n&code_verifier="xyz123random..."',
    color: '#38bdf8'
  },
  {
    title: '6. Verification & Token response',
    from: 'idp',
    to: 'app',
    detail: 'IdP hashes the received code_verifier and matches it against the stored challenge from Step 2. If valid, IdP issues tokens (access_token, refresh_token, id_token).',
    payload: 'IdP action: SHA256("xyz123random...") == stored challenge?\nResponse: { access_token: "jwt...", id_token: "jwt..." }',
    color: '#4ade80'
  }
];

const POSITIONS = {
  app: { x: 70, label: 'Client App 📱', color: '#38bdf8' },
  user: { x: 340, label: 'User Browser 👤', color: '#a78bfa' },
  idp: { x: 610, label: 'Identity Server (IdP) 🏛️', color: '#4ade80' }
};

export default function OAuthPkceFlowDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const activeStep = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔑 OAuth 2.0 Authorization Code Flow + PKCE
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg" style={{ minWidth: 600 }}>
          <defs>
            <marker id="pkce-arr-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="pkce-arr-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fb923c" />
            </marker>
            <marker id="pkce-arr-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker id="pkce-arr-arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
            </marker>
          </defs>

          {/* Lifelines */}
          {Object.entries(POSITIONS).map(([key, value]) => (
            <g key={key}>
              <line x1={value.x} y1={40} x2={value.x} y2={210} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
              <rect x={value.x - 60} y={10} width={120} height={25} rx={4} fill="rgba(15,23,42,0.8)" stroke={value.color} strokeWidth="1" />
              <text x={value.x} y={26} style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: 700, fill: value.color, textAnchor: 'middle' }}>{value.label}</text>
            </g>
          ))}

          {/* Dynamic Step Line flows */}
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            const y = 60 + idx * 24;

            const fromX = POSITIONS[step.from].x;
            const isSelf = step.to === 'self';
            const toX = isSelf ? fromX : POSITIONS[step.to].x;
            
            const color = isActive ? step.color : isCompleted ? '#475569' : 'rgba(255,255,255,0.03)';
            const pathId = `pkce-path-${idx}`;
            const markerType = step.color === '#fb923c' ? 'orange' : step.color === '#4ade80' ? 'green' : step.color === '#a78bfa' ? 'purple' : 'arrow';

            if (isSelf) {
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <path id={pathId}
                    d={`M ${fromX} ${y} Q ${fromX + 25} ${y + 5} ${fromX} ${y + 10}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.2}
                    markerEnd={`url(#pkce-arr-${markerType})`}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {isActive && (
                    <circle r="2.2" fill={color}>
                      <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  )}
                  <text x={fromX + 32} y={y + 7} style={{ fontFamily: 'Inter', fontSize: 7, fontWeight: isActive ? 700 : 500, fill: color, alignmentBaseline: 'middle' }}>
                    {step.title}
                  </text>
                </g>
              );
            } else {
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <path id={pathId}
                    d={`M ${fromX} ${y} L ${toX} ${y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.2}
                    markerEnd={`url(#pkce-arr-${markerType})`}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {isActive && (
                    <circle r="2.2" fill={color}>
                      <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  )}
                  <text x={(fromX + toX) / 2} y={y - 4} style={{ fontFamily: 'Inter', fontSize: 7, fontWeight: isActive ? 700 : 500, fill: color, textAnchor: 'middle' }}>
                    {step.title}
                  </text>
                </g>
              );
            }
          })}
        </svg>
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleBack} disabled={currentStep === 0} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === 0 ? '#475569' : '#e2e8f0', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          ◀ Back
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
          Step {currentStep + 1} of {STEPS.length}
        </span>
        <button onClick={handleNext} disabled={currentStep === STEPS.length - 1} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === STEPS.length - 1 ? '#475569' : '#e2e8f0', cursor: currentStep === STEPS.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Next Step ▶
        </button>
      </div>

      {/* Details Box */}
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px', borderLeftColor: activeStep.color }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{activeStep.title}</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {activeStep.detail}
        </p>
        {activeStep.payload && (
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {activeStep.payload}
          </pre>
        )}
      </div>
      <p className="interactive-diagram-helper-text">💡 Step through the guide to learn how PKCE blocks auth code interception attacks on public clients (SPA / Mobile).</p>
    </div>
  );
}
