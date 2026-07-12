import React, { useState } from 'react';

export default function KeyStoreTrustStoreDiagram(): React.JSX.Element {
  const [activeSide, setActiveSide] = useState<'keystore' | 'truststore'>('keystore');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ☕ Java KeyStore vs. TrustStore
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveSide('keystore')} style={{ background: activeSide === 'keystore' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeSide === 'keystore' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeSide === 'keystore' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>KeyStore</button>
          <button onClick={() => setActiveSide('truststore')} style={{ background: activeSide === 'truststore' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeSide === 'truststore' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeSide === 'truststore' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>TrustStore</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Left Side: Detail view */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          {activeSide === 'keystore' ? (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>🔑 KeyStore ("Who you are")</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Contains your application's <strong>private keys</strong> and public certificates. Used by a TLS server to prove its identity to visiting clients, or by a client during mutual authentication (mTLS).
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                <li>Holds private keys (highly sensitive).</li>
                <li>Used for Server TLS configuration.</li>
                <li>Analogous to your physical Passport/ID card.</li>
              </ul>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>🛡️ TrustStore ("Who you trust")</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Contains public certificates of <strong>trusted entities and root CAs</strong> (e.g. Let's Encrypt, Symantec). Used by clients to verify if the server's certificate was signed by a trusted authority.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                <li>Holds only public certificates.</li>
                <li>Used to verify foreign connections.</li>
                <li>Analogous to an official list of approved foreign governments.</li>
              </ul>
            </>
          )}
        </div>

        {/* Right Side: JVM parameters config block */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>JVM System Properties</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: activeSide === 'keystore' ? '#38bdf8' : '#a78bfa', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {activeSide === 'keystore' ? (
`-Djavax.net.ssl.keyStore=/certs/keystore.p12
-Djavax.net.ssl.keyStorePassword=changeit`
            ) : (
`-Djavax.net.ssl.trustStore=/certs/truststore.p12
-Djavax.net.ssl.trustStorePassword=changeit`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
