import React, { useState } from 'react';

type Mode = 'tls-termination' | 'mle-enabled';

export default function MleGatewayDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('tls-termination');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔒 TLS Termination vs. Message-Level Encryption (MLE)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('tls-termination')} style={{ background: mode === 'tls-termination' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'tls-termination' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'tls-termination' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Standard TLS Termination</button>
          <button onClick={() => setMode('mle-enabled')} style={{ background: mode === 'mle-enabled' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'mle-enabled' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'mle-enabled' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>MLE Enabled ✅</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="mle-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Actor Nodes */}
          <g transform="translate(80, 90)">
            <rect x="-40" y="-25" width="80" height="50" rx="5" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#38bdf8', textAnchor: 'middle' }}>Client</text>
          </g>

          <g transform="translate(340, 90)">
            <rect x="-55" y="-25" width="110" height="50" rx="5" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="0" y="-2" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#a78bfa', textAnchor: 'middle' }}>API Gateway</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>(TLS Termination)</text>
          </g>

          <g transform="translate(600, 90)">
            <rect x="-55" y="-25" width="110" height="50" rx="5" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#4ade80', textAnchor: 'middle' }}>App Server</text>
          </g>

          {/* Links and labels */}
          {/* Client to API Gateway is ALWAYS TLS encrypted */}
          <path id="link-c-gw" d="M 120 90 L 285 90" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#mle-arr)" />
          <text x="202" y="80" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#38bdf8', textAnchor: 'middle' }}>HTTPS (Encrypted TLS)</text>
          <circle r="3" fill="#38bdf8"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#link-c-gw" /></animateMotion></circle>

          {mode === 'tls-termination' ? (
            <>
              {/* API Gateway to App Server is Plaintext! */}
              <path id="link-gw-app-plain" d="M 395 90 L 545 90" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#mle-arr)" />
              <text x="470" y="80" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#f87171', fontWeight: 700, textAnchor: 'middle' }}>PLAINTEXT ❌</text>
              <circle r="3" fill="#f87171"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#link-gw-app-plain" /></animateMotion></circle>

              <rect x="420" y="125" width="100" height="20" rx="3" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1" />
              <text x="470" y="137" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>Vulnerable to logs & sniffs</text>
            </>
          ) : (
            <>
              {/* API Gateway to App Server is STILL Encrypted via MLE */}
              <path id="link-gw-app-mle" d="M 395 90 L 545 90" fill="none" stroke="#4ade80" strokeWidth="2.5" markerEnd="url(#mle-arr)" />
              <text x="470" y="80" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#4ade80', fontWeight: 700, textAnchor: 'middle' }}>MLE Encrypted JWE ✅</text>
              <circle r="3" fill="#4ade80"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#link-gw-app-mle" /></animateMotion></circle>

              <rect x="420" y="125" width="100" height="20" rx="3" fill="rgba(74,222,128,0.12)" stroke="#4ade80" strokeWidth="1" />
              <text x="470" y="137" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#4ade80', textAnchor: 'middle' }}>Secure end-to-end</text>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {mode === 'tls-termination' ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            ⚠️ <strong>Standard TLS Termination:</strong> The load balancer or API Gateway terminates the HTTPS connection. From the gateway to internal servers (across switches, databases, and log forwarders), the payload is sent in plaintext. If the gateway logs requests or if a database leaks, sensitive user data is exposed.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            🛡️ <strong>Message-Level Encryption (MLE):</strong> The client encrypts the message payload at the application layer before transmitting it. Even if TLS is terminated at the API Gateway, the payload remains a fully encrypted JWE blob as it travels through internal routers and databases, and is only decrypted when it reaches the secure bounds of the final destination application server.
          </p>
        )}
      </div>
    </div>
  );
}
