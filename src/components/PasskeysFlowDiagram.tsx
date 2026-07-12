import React, { useState } from 'react';

type FlowMode = 'registration' | 'authentication';

interface StepInfo {
  num: string;
  label: string;
  from: 'server' | 'browser' | 'enclave';
  to: 'server' | 'browser' | 'enclave' | 'self';
  detail: string;
  payload?: string;
  color: string;
}

const REG_STEPS: StepInfo[] = [
  {
    num: '01',
    label: 'Request Registration Options',
    from: 'browser',
    to: 'server',
    detail: 'Browser requests credential creation options. Server generates a cryptographically secure random challenge and returns user configuration.',
    payload: 'Challenge: "rand_382A..."\nRpName: "Example App"\nUserId: "usr_998"',
    color: '#38bdf8'
  },
  {
    num: '02',
    label: 'Invoke WebAuthn API',
    from: 'browser',
    to: 'enclave',
    detail: 'Browser calls navigator.credentials.create() using challenge options, triggering local system authenticator (TouchID, Windows Hello, etc).',
    color: '#a78bfa'
  },
  {
    num: '03',
    label: 'Unlock Enclave & Create Key Pair',
    from: 'enclave',
    to: 'self',
    detail: 'User scans fingerprint/face. Enclave generates a unique origin-bound private/public key pair. Private key never leaves the enclave chip.',
    payload: 'Origin: "https://app.example.com"\nPrivate Key: [Locked in Secure Enclave]\nPublic Key: [Generated]',
    color: '#fb923c'
  },
  {
    num: '04',
    label: 'Send Public Key & Credential ID',
    from: 'enclave',
    to: 'browser',
    detail: 'Device returns the credential ID, the public key, and signed client data back to the browser.',
    color: '#38bdf8'
  },
  {
    num: '05',
    label: 'Verify & Persist on Server',
    from: 'browser',
    to: 'server',
    detail: 'Browser forwards the payload. Server verifies the challenge, saves the Credential ID and Public Key in user DB record. Registration done!',
    payload: 'Store: Credential ID + Public Key\nState: ACTIVE',
    color: '#4ade80'
  }
];

const AUTH_STEPS: StepInfo[] = [
  {
    num: '01',
    label: 'Request Assertion Options',
    from: 'browser',
    to: 'server',
    detail: 'Browser requests authentication challenge. Server fetches stored credential ID, generates a new random challenge, and replies.',
    payload: 'Challenge: "rand_920B..."\nAllowCredentials: ["cred_id_xyz789"]',
    color: '#38bdf8'
  },
  {
    num: '02',
    label: 'Invoke navigator.credentials.get()',
    from: 'browser',
    to: 'enclave',
    detail: 'Browser invokes WebAuthn get API with request challenge, prompting biometric verification from the user.',
    color: '#a78bfa'
  },
  {
    num: '03',
    label: 'Verify User & Sign Challenge',
    from: 'enclave',
    to: 'self',
    detail: 'Biometric validates user. Enclave looks up the private key matching the credential ID and signs the challenge.',
    payload: 'Signature = Sign(PrivateKey, clientDataHash + challenge)',
    color: '#fb923c'
  },
  {
    num: '04',
    label: 'Return Signature to Browser',
    from: 'enclave',
    to: 'browser',
    detail: 'Authenticator sends the cryptographic signature back to the browser application layer.',
    color: '#38bdf8'
  },
  {
    num: '05',
    label: 'Verify Signature on Server',
    from: 'browser',
    to: 'server',
    detail: 'Browser posts signature to server. Server retrieves user public key from database, verifies signature validity → Access Granted!',
    payload: 'Verifier check: VerifySignature(PublicKey, Challenge, Signature)\nResult: ACCESS_GRANTED ✅',
    color: '#4ade80'
  }
];

const POSITIONS = {
  browser: { x: 80, label: 'Browser Client 💻', color: '#38bdf8' },
  enclave: { x: 340, label: 'Secure Enclave / Keyring 🔑', color: '#a78bfa' },
  server: { x: 600, label: 'Auth Server 🏛️', color: '#4ade80' }
};

export default function PasskeysFlowDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<FlowMode>('registration');
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = mode === 'registration' ? REG_STEPS : AUTH_STEPS;
  const activeStep = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleModeChange = (newMode: FlowMode) => {
    setMode(newMode);
    setCurrentStep(0);
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            🔑 Passkeys Flow (WebAuthn / FIDO2)
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => handleModeChange('registration')} style={{ background: mode === 'registration' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'registration' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'registration' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            Registration Flow 📝
          </button>
          <button onClick={() => handleModeChange('authentication')} style={{ background: mode === 'authentication' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'authentication' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'authentication' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            Authentication Flow 🔐
          </button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg" style={{ minWidth: 600 }}>
          <defs>
            <marker id="pass-arr-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="pass-arr-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fb923c" />
            </marker>
            <marker id="pass-arr-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker id="pass-arr-arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
            </marker>
          </defs>

          {/* Lifelines */}
          {Object.entries(POSITIONS).map(([key, value]) => (
            <g key={key}>
              <line x1={value.x} y1={35} x2={value.x} y2={185} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
              <rect x={value.x - 65} y={10} width={130} height={22} rx={4} fill="rgba(15,23,42,0.85)" stroke={value.color} strokeWidth="1" />
              <text x={value.x} y={24} style={{ fontFamily: 'Inter', fontSize: 8, fontWeight: 700, fill: value.color, textAnchor: 'middle' }}>{value.label}</text>
            </g>
          ))}

          {/* Flow Lines */}
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            const y = 52 + idx * 24;

            const fromX = POSITIONS[step.from].x;
            const isSelf = step.to === 'self';
            const toX = isSelf ? fromX : POSITIONS[step.to].x;

            const color = isActive ? step.color : isCompleted ? '#475569' : 'rgba(255,255,255,0.03)';
            const pathId = `pass-path-${idx}`;
            const markerType = step.color === '#fb923c' ? 'orange' : step.color === '#4ade80' ? 'green' : step.color === '#a78bfa' ? 'purple' : 'arrow';

            if (isSelf) {
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <path id={pathId}
                    d={`M ${fromX} ${y} Q ${fromX + 25} ${y + 5} ${fromX} ${y + 10}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.2}
                    markerEnd={`url(#pass-arr-${markerType})`}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {isActive && (
                    <circle r="2.2" fill={color}>
                      <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  )}
                  <text x={fromX + 32} y={y + 7} style={{ fontFamily: 'Inter', fontSize: 7.2, fontWeight: isActive ? 700 : 500, fill: color, alignmentBaseline: 'middle' }}>
                    {step.label}
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
                    markerEnd={`url(#pass-arr-${markerType})`}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {isActive && (
                    <circle r="2.2" fill={color}>
                      <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  )}
                  <text x={(fromX + toX) / 2} y={y - 4} style={{ fontFamily: 'Inter', fontSize: 7.2, fontWeight: isActive ? 700 : 500, fill: color, textAnchor: 'middle' }}>
                    {step.label}
                  </text>
                </g>
              );
            }
          })}
        </svg>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleBack} disabled={currentStep === 0} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === 0 ? '#475569' : '#e2e8f0', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          ◀ Back
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
          Step {currentStep + 1} of {steps.length}
        </span>
        <button onClick={handleNext} disabled={currentStep === steps.length - 1} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: currentStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Next Step ▶
        </button>
      </div>

      {/* Details Box */}
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px', borderLeftColor: activeStep.color }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{activeStep.label}</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {activeStep.detail}
        </p>
        {activeStep.payload && (
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {activeStep.payload}
          </pre>
        )}
      </div>
      <p className="interactive-diagram-helper-text">💡 Switch between Registration and Authentication tabs to explore full FIDO2 / WebAuthn cryptographic flows.</p>
    </div>
  );
}
