import React, { useState } from 'react';

type Choice = 'confidentiality' | 'integrity' | 'both';

export default function EncryptVsSignChart(): React.JSX.Element {
  const [choice, setChoice] = useState<Choice>('confidentiality');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🧭 Encryption vs. Signing: Decision Chart
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setChoice('confidentiality')} style={{ background: choice === 'confidentiality' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${choice === 'confidentiality' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: choice === 'confidentiality' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Confidentiality</button>
          <button onClick={() => choice === 'integrity' ? null : setChoice('integrity')} style={{ background: choice === 'integrity' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${choice === 'integrity' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: choice === 'integrity' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Integrity / Auth</button>
          <button onClick={() => setChoice('both')} style={{ background: choice === 'both' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${choice === 'both' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: choice === 'both' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Both</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {choice === 'confidentiality' && (
          <div style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>🔐 Goal: Hide content (Confidentiality)</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              If you only need to ensure that unauthorized third parties cannot read the data, use <strong>Encryption</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', color: '#e2e8f0' }}>
              <div>• <strong>Symmetric:</strong> Use for bulk data or database storage (e.g. <code>AES-256-GCM</code>). Faster.</div>
              <div>• <strong>Asymmetric:</strong> Use for secure initial key sharing (e.g. <code>RSA-OAEP</code>). Slow.</div>
              <div>• <strong>Hybrid:</strong> Encrypt data with AES; encrypt the AES key with RSA (standard pattern).</div>
            </div>
          </div>
        )}

        {choice === 'integrity' && (
          <div style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>✍️ Goal: Prove source & detect modification (Integrity / Auth)</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              If you need to verify who created the message and ensure it hasn't been altered, use <strong>Signing</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', color: '#e2e8f0' }}>
              <div>• <strong>Shared Secret:</strong> Use <code>HMAC-SHA256</code> (e.g., webhook validations, API keys). Fast.</div>
              <div>• <strong>No Shared Secret:</strong> Use public/private asymmetric keys (e.g. <code>RSA</code> or <code>ECDSA</code>) for JWTs.</div>
            </div>
          </div>
        )}

        {choice === 'both' && (
          <div style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>🛡️ Goal: Confidentiality + Authenticity + Integrity</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              If you need complete protection covering both encryption and verification:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', color: '#e2e8f0' }}>
              <div>• <strong>Authenticated Encryption (AEAD):</strong> Use <code>AES-GCM</code> directly, which automatically generates a MAC tag for integrity.</div>
              <div>• <strong>Combined JWE + JWS:</strong> Sign the payload first with JWS, then encrypt the resulting JWS inside a JWE wrapper.</div>
              <div>• <strong>Transport Layer Security (TLS):</strong> Offload both checks to the network protocol layer.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
