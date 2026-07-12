import React, { useState } from 'react';

type Mode = 'no-pfs' | 'pfs-ecdhe';

export default function PfsDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('no-pfs');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ Perfect Forward Secrecy (PFS) comparison
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('no-pfs')} style={{ background: mode === 'no-pfs' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'no-pfs' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'no-pfs' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>RSA Key Exchange (No PFS)</button>
          <button onClick={() => setMode('pfs-ecdhe')} style={{ background: mode === 'pfs-ecdhe' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'pfs-ecdhe' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'pfs-ecdhe' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>ECDHE Key Exchange (PFS) ✅</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Scenario flow descriptions */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          {mode === 'no-pfs' ? (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f87171' }}>Plain RSA (Old TLS)</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                The client generates a session key, encrypts it with the server's long-term public key, and sends it.
                If an attacker records the encrypted handshake traffic and compromises the server's private key years later, they can decrypt the session key and decode all past logs.
              </p>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>ECDHE (Diffie-Hellman Exchange)</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Both client and server compute ephemeral Diffie-Hellman parameters, exchange public parts, compute the session key, and discard the private parts immediately.
                Leaking the server's long-term private key does not compromise past traffic because it was only used to sign the handshake, not encrypt session keys.
              </p>
            </>
          )}
        </div>

        {/* Cryptographic properties */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Cryptographic properties</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: mode === 'no-pfs' ? '#f87171' : '#4ade80', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {mode === 'no-pfs' ? (
`Symmetric Session Key = Client_Generated_Secret

If server_private_key leaks:
  All past traffic decrypted! ❌`
            ) : (
`Symmetric Session Key = ECDH(Ephemeral_A, Ephemeral_B)

If server_private_key leaks:
  Past traffic remains secure! ✅`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
