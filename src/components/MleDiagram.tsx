import React, { useState } from 'react';

export default function MleDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. Generate Session Key (CEK)',
      desc: 'Client generates a single-use random symmetric AES-256 key (Content Encryption Key — CEK).',
      payload: 'CEK = AES_Key_Gen()'
    },
    {
      title: '2. Encrypt Payload with AES-GCM',
      desc: 'Client encrypts the plaintext payload using the CEK, producing ciphertext, an initialization vector (IV), and an authentication tag.',
      payload: 'Ciphertext = AES_GCM_Encrypt(Plaintext, CEK)\nReturns: { ciphertext, IV, auth_tag }'
    },
    {
      title: '3. Encrypt CEK with RSA Public Key',
      desc: 'Client encrypts the random CEK using the Server\'s public RSA key (fetched from JWKS). Only the server\'s private key can decrypt this.',
      payload: 'Encrypted_CEK = RSA_Encrypt(CEK, Server_Public_Key)'
    },
    {
      title: '4. Package and Transmit JWE',
      desc: 'Client packages all parts into a five-part JWE token (separated by dots) and sends it over the wire.',
      payload: 'JWE = Base64(Header) . Base64(Encrypted_CEK) . Base64(IV) . Base64(Ciphertext) . Base64(Tag)'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📦 Message-Level Encryption (MLE) Packaging
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

        {/* Cryptographic outputs */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Cryptographic Output</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {steps[activeStep].payload}
          </pre>
        </div>
      </div>
    </div>
  );
}
