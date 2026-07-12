import React, { useState } from 'react';

export default function CertChainDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. Inspect Server Certificate',
      desc: 'Browser queries domain "*.example.com". Inspects the server\'s leaf certificate to check expiration date, target hostname, and verify the issuer.',
      subject: 'Subject: *.example.com\nIssuer: Let\'s Encrypt Intermediate CA'
    },
    {
      title: '2. Verify Intermediate Signature',
      desc: 'Browser reads the intermediate certificate returned by the server, using its public key to verify the signature on the server certificate.',
      subject: 'Subject: Let\'s Encrypt Intermediate CA\nIssuer: DST Root CA X3'
    },
    {
      title: '3. Match Against Trusted Root Store',
      desc: 'Browser traverses to the Root Certificate Authority (CA) cert. It compares this certificate with pre-installed, trusted root certs inside the operating system or browser trust store. If a match is found, the connection is trusted.',
      subject: 'Subject: DST Root CA X3 (Self-Signed)\nStatus: MATCHED in local Root Store ✅'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ⛓️ X.509 Certificate Chain of Trust Verifier
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step details */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{steps[activeStep].title}</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {steps[activeStep].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
            <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} disabled={activeStep === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === 0 ? '#475569' : '#e2e8f0', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
            <button onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))} disabled={activeStep === steps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
          </div>
        </div>

        {/* Certificate Metadata */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Certificate Attributes</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {steps[activeStep].subject}
          </pre>
        </div>
      </div>
    </div>
  );
}
