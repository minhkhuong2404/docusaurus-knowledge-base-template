import React from 'react';

export default function PublicKeyKeyPairDiagram(): React.JSX.Element {
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔑 Asymmetric Cryptography: Public & Private Keys
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Public Key */}
        <div style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>🔓 Public Key (Shared Freely)</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Distributed to anyone who wants to verify your messages or encrypt data for you.
          </p>
          <div style={{ padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.7rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
            Usage: Encrypt data / Verify signatures
          </div>
        </div>

        {/* Private Key */}
        <div style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>🔒 Private Key (Kept Secret)</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Must remain safely locked in a secure key store (Vault/HSM). Never transmitted over networks.
          </p>
          <div style={{ padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.7rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
            Usage: Decrypt data / Generate signatures
          </div>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong>Core Rule:</strong> Data encrypted with the Public Key can <strong>only</strong> be decrypted with the Private Key. Conversely, signatures generated with the Private Key can be verified by <strong>anyone</strong> who holds the corresponding Public Key.
        </p>
      </div>
    </div>
  );
}
