import React, { useState } from 'react';

const PROTOCOLS = [
  { id: 'tls', label: 'TLS 1.3', color: '#34d399', badge: 'Mandatory for HTTPS', layers: ['Provides: Encryption, Integrity, Authentication', 'Handshake: 1 RTT (0-RTT for resumption)', 'Cipher suites: ECDHE + AES-256-GCM', 'Certificate: X.509 (RSA-2048 or ECDSA P-256)', 'Mutual TLS (mTLS): both client + server certs'],
    detail: 'TLS 1.3 removed all weak ciphers from 1.2 (RC4, DES, MD5, SHA-1, RSA key exchange). Forward secrecy is mandatory — ephemeral ECDHE keys mean past sessions stay safe even if the private key is later compromised. Java: configure via SSLContext or Spring\'s server.ssl.* properties.' },
  { id: 'mtls', label: 'mTLS', color: '#a78bfa', badge: 'Service mesh standard', layers: ['Both client AND server present X.509 certs', 'Mutual authentication at transport layer', 'No username/password required — cert = identity', 'Used by: Istio, Envoy, Kubernetes, gRPC', 'Java: SSLContext with KeyManager + TrustManager'],
    detail: 'Mutual TLS is the standard for service-to-service authentication in microservices. Each service presents a certificate signed by a shared CA. Eliminates credential stuffing, replay attacks, and man-in-the-middle risks between services. Istio auto-rotates certs via Citadel every 24h.' },
  { id: 'oauth', label: 'OAuth 2.0 / JWT', color: '#38bdf8', badge: 'API authorization standard', layers: ['Bearer token in Authorization header', 'JWT: Header.Payload.Signature (Base64+HMAC/RSA)', 'Access token: short-lived (5–60 min)', 'Refresh token: long-lived (days), stored HttpOnly cookie', 'PKCE: prevents auth code interception (public clients)'],
    detail: 'OAuth 2.0 delegates authorization to an Authorization Server (Keycloak, Okta, Cognito). The JWT access token is self-contained — the resource server validates the signature locally without calling the auth server. Critical: validate iss, aud, exp claims. Never validate with alg:none.' },
  { id: 'firewall', label: 'Firewall / WAF', color: '#f97316', badge: 'Perimeter + application defense', layers: ['L3/L4 Stateful: IP + port filtering', 'L7 WAF: HTTP request inspection', 'OWASP Top 10: SQLi, XSS, SSRF, Path Traversal', 'Rate limiting: 100 req/s per IP', 'DDoS: BGP blackholing, Anycast scrubbing'],
    detail: 'Stateful firewalls track TCP connection state — they allow established/related responses without explicit rules. WAFs inspect the HTTP payload: they detect SQLi patterns, base64-encoded payloads, abnormal User-Agent strings, and path traversal (%2F%2F). Fail-open vs fail-closed is a critical architectural decision.' },
];

export default function NetworkSecurityProtocolsDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('tls');
  const proto = PROTOCOLS.find(p => p.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .netsec-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Network Security Protocols &amp; Layers</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {PROTOCOLS.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: active === p.id ? `${p.color}18` : 'rgba(255,255,255,0.04)', color: active === p.id ? p.color : 'var(--ifm-color-content-secondary)', boxShadow: active === p.id ? `0 0 0 1.5px ${p.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${proto.color}15`, border: `1px solid ${proto.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: proto.color, display: 'inline-block', fontWeight: 600 }}>
          {proto.badge}
        </div>

        <div className="netsec-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Key Properties</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {proto.layers.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: `${proto.color}08`, border: `1px solid ${proto.color}25`, borderRadius: '7px', padding: '8px 10px' }}>
                  <span style={{ color: proto.color, flexShrink: 0, fontSize: '11px', marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '12.5px', color: proto.color, marginBottom: '10px' }}>Technical Deep-Dive</div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.7 }}>{proto.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
