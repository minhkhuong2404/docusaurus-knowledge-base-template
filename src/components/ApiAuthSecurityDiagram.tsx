import React, { useState } from 'react';

export default function ApiAuthSecurityDiagram(): React.JSX.Element {
  const [auth, setAuth] = useState<'oauth' | 'jwt' | 'mtls'>('oauth');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          API Security &amp; Authentication Architecture (OAuth PKCE vs JWT vs mTLS)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setAuth('oauth')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: auth === 'oauth' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: auth === 'oauth' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            OAuth 2.0 PKCE Flow
          </button>
          <button onClick={() => setAuth('jwt')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: auth === 'jwt' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: auth === 'jwt' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Stateless JWT Bearer
          </button>
          <button onClick={() => setAuth('mtls')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: auth === 'mtls' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: auth === 'mtls' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Mutual TLS (mTLS)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {auth === 'oauth' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Authorization Code with PKCE (`code_verifier` &amp; `code_challenge`). Prevents authorization code interception on single-page &amp; mobile apps.</p>}
          {auth === 'jwt' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Cryptographically signed JSON Web Token (`Header.Payload.Signature`). Enables stateless API verification across microservice gateways without DB lookups.</p>}
          {auth === 'mtls' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Zero-Trust Service-to-Service auth. Both client and server authenticate each other's X.509 digital certificates during TLS handshake.</p>}
        </div>
      </div>
    </div>
  );
}
