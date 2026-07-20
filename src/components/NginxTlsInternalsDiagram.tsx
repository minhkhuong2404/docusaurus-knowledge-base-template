import React, { useState } from 'react';

export default function NginxTlsInternalsDiagram() {
  const [feature, setFeature] = useState<'resumption' | 'ocsp' | 'mtls'>('ocsp');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>SSL/TLS Termination & Optimization</span>

        {/* Feature selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setFeature('ocsp')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: feature === 'ocsp' ? '#34d39920' : 'rgba(255,255,255,0.04)',
            color: feature === 'ocsp' ? '#34d399' : '#94a3b8'
          }}>
            OCSP Stapling
          </button>
          <button onClick={() => setFeature('resumption')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: feature === 'resumption' ? '#38bdf820' : 'rgba(255,255,255,0.04)',
            color: feature === 'resumption' ? '#38bdf8' : '#94a3b8'
          }}>
            Session Resumption (0-RTT)
          </button>
          <button onClick={() => setFeature('mtls')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: feature === 'mtls' ? '#a78bfa20' : 'rgba(255,255,255,0.04)',
            color: feature === 'mtls' ? '#a78bfa' : '#94a3b8'
          }}>
            mTLS (Client Certs)
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
        <h3 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '14px' }}>
          {feature === 'ocsp' && 'OCSP Stapling (Eliminates Revocation Check Latency)'}
          {feature === 'resumption' && 'TLS Session Resumption & 0-RTT'}
          {feature === 'mtls' && 'mTLS Client Certificate Verification'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {feature === 'ocsp' && 'Nginx fetches the signed OCSP revocation response from the CA in the background and includes ("staples") it directly in the TLS handshake, saving 50–300ms client RTT!'}
          {feature === 'resumption' && 'Shared ssl_session_cache across workers allows returning clients to resume TLS sessions instantly without a full 1 RTT handshake.'}
          {feature === 'mtls' && 'Nginx validates the client\'s x509 certificate against a trusted CA (ssl_client_certificate) and forwards verified client Subject DN headers to upstream microservices.'}
        </p>
      </div>
    </div>
  );
}
