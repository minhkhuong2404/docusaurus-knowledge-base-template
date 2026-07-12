import React from 'react';

export default function JwtClientStateDiagram(): React.JSX.Element {
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔑 JWT: Client-Side State, Server-Verified
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Client side (Stateful Storage) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Client Side (Holds the Claims)</h4>
          <pre style={{ margin: '0 0 8px 0', padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8', overflowX: 'auto' }}>
{`JWT: header.payload.signature
Payload contents:
{
  "sub": "usr_77",
  "username": "bob",
  "roles": ["USER", "EDITOR"],
  "exp": 1783828840
}`}
          </pre>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            The state travels on every request inside the header. Anyone can read it (Base64url decoded), but they cannot tamper with it because of the cryptographically strong signature.
          </p>
        </div>

        {/* Server side (Stateless Verification) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#a78bfa' }}>Server Side (Stateless Verification)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 8px 0', padding: '10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
            <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace' }}>1. Decode token</div>
            <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace' }}>2. Compute Hash(Header + Payload)</div>
            <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace' }}>3. Decrypt Signature using Public Key</div>
            <div style={{ fontSize: '0.72rem', color: '#4ade80', fontFamily: 'monospace', fontWeight: 700 }}>4. Match? ✅ Allow access instantly.</div>
          </div>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            The backend does NOT query databases or call authentication servers. It verifies the signature against the local public verification key, making it extremely fast.
          </p>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong>Revocability Trade-off:</strong> Because the server doesn't query a central store, a JWT remains valid until its expiration time (e.g., 15 minutes) even if the user logs out.
        </p>
      </div>
    </div>
  );
}
