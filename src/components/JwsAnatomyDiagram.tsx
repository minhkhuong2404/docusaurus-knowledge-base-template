import React, { useState } from 'react';

type Section = 'header' | 'payload' | 'signature';

export default function JwsAnatomyDiagram(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<Section>('header');

  const content = {
    header: {
      raw: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIn0',
      decoded: `{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-2024-01"
}`,
      desc: 'The JWS Header contains metadata describing the signature type. "alg" defines the signature algorithm (RS256 - RSA Signature with SHA-256). "typ" defines the token type, and "kid" is the key identifier helping the recipient locate the correct public verification key.'
    },
    payload: {
      raw: 'eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyLTEyMzQ1In0',
      decoded: `{
  "iss": "https://auth.example.com",
  "sub": "user-12345",
  "roles": ["ROLE_USER"],
  "exp": 1783828840
}`,
      desc: 'The JWS Payload contains the actual claims or assertions (e.g. user metadata, expiration timestamp, issuer). This payload is only Base64url-encoded, meaning anyone can read it. It is not encrypted.'
    },
    signature: {
      raw: 'SIGNATURE_BYTES_HERE',
      decoded: 'Computed as:\nBase64Url(\n  RS256_Sign(\n    PrivateKey,\n    Base64Url(Header) + "." + Base64Url(Payload)\n  )\n)',
      desc: 'The JWS Signature verifies the authenticity and integrity of the header and payload. If either the header or the payload changes, the signature becomes invalid, preventing tampering.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ✍️ Interactive JWS (JSON Web Signature) Anatomy
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Token representation */}
        <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: '1.2rem' }}>
          <span onMouseEnter={() => setActiveSection('header')} style={{ color: '#38bdf8', cursor: 'pointer', background: activeSection === 'header' ? 'rgba(56,189,248,0.15)' : 'transparent', padding: '2px 4px', borderRadius: 3, fontWeight: 700 }}>
            {content.header.raw}
          </span>
          <span style={{ color: '#94a3b8' }}>.</span>
          <span onMouseEnter={() => setActiveSection('payload')} style={{ color: '#a78bfa', cursor: 'pointer', background: activeSection === 'payload' ? 'rgba(167,139,250,0.15)' : 'transparent', padding: '2px 4px', borderRadius: 3, fontWeight: 700 }}>
            {content.payload.raw}
          </span>
          <span style={{ color: '#94a3b8' }}>.</span>
          <span onMouseEnter={() => setActiveSection('signature')} style={{ color: '#f87171', cursor: 'pointer', background: activeSection === 'signature' ? 'rgba(248,113,113,0.15)' : 'transparent', padding: '2px 4px', borderRadius: 3, fontWeight: 700 }}>
            {content.signature.raw}
          </span>
        </div>

        {/* Decoder split view */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
          {/* Explanation */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', textTransform: 'capitalize', color: activeSection === 'header' ? '#38bdf8' : activeSection === 'payload' ? '#a78bfa' : '#f87171' }}>
              JWS Part {activeSection === 'header' ? '1: Header' : activeSection === 'payload' ? '2: Payload' : '3: Signature'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              {content[activeSection].desc}
            </p>
          </div>

          {/* Value panel */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Parsed / Value</h4>
            <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {content[activeSection].decoded}
            </pre>
          </div>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Hover over the three JWS segments (Header, Payload, Signature) to decode them.</p>
    </div>
  );
}
