import React, { useState } from 'react';

export default function JwksRotationDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: 'Before Rotation',
      desc: 'Only one key exists in the JWKS configuration. Tokens are issued and verified using key-2024-01.',
      jwks: '["key-2024-01"]',
      signing: 'key-2024-01'
    },
    {
      title: 'Step 1: Add New Key to JWKS',
      desc: 'Generate a new key pair and publish its public key to the JWKS endpoint. Both keys are now active for verification.',
      jwks: '["key-2024-01", "key-2024-02"]',
      signing: 'key-2024-01 (Verifiers accept both)'
    },
    {
      title: 'Step 2: Switch Signing Key',
      desc: 'Configure the Authorization Server to sign all new JWTs using the new private key (key-2024-02). Old tokens remain valid.',
      jwks: '["key-2024-01", "key-2024-02"]',
      signing: 'key-2024-02'
    },
    {
      title: 'Step 3: Retire Old Key',
      desc: 'Wait for the maximum TTL of all old tokens (e.g. 15 mins) to expire. Safely remove the old public key from the JWKS list.',
      jwks: '["key-2024-02"]',
      signing: 'key-2024-02'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 Zero-Downtime Key Rotation Strategy (JWKS)
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* State visualizer */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>JWKS Public Key Set</h4>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#e2e8f0', marginBottom: '12px' }}>
            {steps[activeStep].jwks}
          </div>
          
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Active Signing Key (Auth Server)</h4>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8' }}>
            {steps[activeStep].signing}
          </div>
        </div>

        {/* Text descriptions */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{steps[activeStep].title}</h4>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {steps[activeStep].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
            <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} disabled={activeStep === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === 0 ? '#475569' : '#e2e8f0', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
            <button onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))} disabled={activeStep === steps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
