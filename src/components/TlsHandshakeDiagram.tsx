import React, { useState } from 'react';

export default function TlsHandshakeDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. Client Hello (Key Share Proposal)',
      desc: 'Client initiates connection by sending cipher capabilities and its ephemeral Diffie-Hellman public key share (Client Share).',
      payload: 'ClientHello\n  - supported_groups: x25519\n  - key_share: [Client_ECDH_Public]'
    },
    {
      title: '2. Server Hello & Certificate (Server Share)',
      desc: 'Server chooses the cipher, generates its own key share, computes the shared secret, and returns its public share. Crucially, the Server Certificate and Handshake signature are sent ENCRYPTED using the new session key.',
      payload: 'ServerHello\n  - key_share: [Server_ECDH_Public]\n  - {Encrypted: Certificate, CertificateVerify, Finished}'
    },
    {
      title: '3. Derivation & Finish',
      desc: 'Client verifies the Server Certificate and signature, computes the matching shared secret, and replies with a Finished handshake confirmation.',
      payload: 'Client Finished\n  - {Encrypted Handshake verification}'
    },
    {
      title: '4. Encrypted Application Data',
      desc: 'Handshake complete! Both sides exchange application data encrypted with symmetric session keys (derived from the ECDH secret).',
      payload: '════ Encrypted Application Data ════\nPayload = AES_GCM_Encrypt(Data, SessionKey)'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔒 TLS 1.3 1-RTT Handshake Sequence
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

        {/* Payload output */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Handshake Payload</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {steps[activeStep].payload}
          </pre>
        </div>
      </div>
    </div>
  );
}
