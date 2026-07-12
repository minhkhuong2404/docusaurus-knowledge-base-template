import React from 'react';

export default function JwtSigningDiagram(): React.JSX.Element {
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ✍️ JWT Signature Construction
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '12px 14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: 4 }}>
              Base64Url(Header)
            </span>
            <span style={{ color: '#94a3b8' }}>+ "." +</span>
            <span style={{ color: '#a78bfa' }}>
              Base64Url(Payload)
            </span>
          </div>

          <div style={{ paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.1)', margin: '4px 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            👇 Feed input string into signing algorithm
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid #a78bfa', color: '#a78bfa', padding: '4px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700 }}>
              RS256_Sign( PrivateKey, input )
            </span>
            <span style={{ color: '#94a3b8' }}>→ yields</span>
            <span style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: 4 }}>
              Base64Url(Signature)
            </span>
          </div>

        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong>End-to-End JWT Signing:</strong> By concatenating the header and payload and signing the resulting string, the authentication server guarantees that if any claim inside the token payload (e.g. user ID or roles) is modified by the client, the signature check will fail locally on the API server.
        </p>
      </div>
    </div>
  );
}
