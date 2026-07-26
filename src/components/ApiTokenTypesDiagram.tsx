import React, { useState } from 'react';

interface TokenType {
  id: string;
  name: string;
  color: string;
  statefulness: string;
  revocability: string;
  sampleCode: string;
  pros: string;
  cons: string;
}

const TOKEN_TYPES: TokenType[] = [
  {
    id: 'jwt',
    name: 'JWT (Stateless Token)',
    color: '#38bdf8',
    statefulness: 'Stateless (Cryptographic Signature)',
    revocability: 'Difficult (Requires short TTL + refresh token rotation)',
    sampleCode: `Header.Payload.Signature
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjQyLCJyb2xlIjoiVVNFUiJ9.xyz

Payload:
{
  "userId": 42,
  "role": "USER",
  "exp": 1705327800   ← expiry (15min–1hr short-lived)
}`,
    pros: 'Stateless verification — server validates signature without a database or Redis lookup per request. Scales effortlessly across services.',
    cons: 'Cannot be revoked immediately before expiry without maintaining shared revocation blacklists in Redis.',
  },
  {
    id: 'session',
    name: 'Session Token (Stateful)',
    color: '#34d399',
    statefulness: 'Stateful (Shared Redis / DB Lookup)',
    revocability: 'Immediate (Delete key from Redis)',
    sampleCode: `Cookie: sessionId=4bf92f3577b34da6a3ce929d0e0e4736

Server Lookup (Redis):
GET session:4bf92f3577b34da6a3ce929d0e0e4736
→ { "userId": 42, "role": "USER", "loginIp": "192.168.1.1" }`,
    pros: 'Immediately revocable — deleting the session record in Redis instantly logs out compromised accounts or invalidates sessions.',
    cons: 'Requires a centralized Redis session store — adds network I/O latency to every API request and introduces a single point of failure.',
  },
  {
    id: 'apikey',
    name: 'API Key (Machine-to-Machine)',
    color: '#fbbf24',
    statefulness: 'Stateful / Scoped Header',
    revocability: 'Immediate (Revoke key in Gateway DB)',
    sampleCode: `X-API-Key: sk_live_4bf92f3577b34da6a3ce929d0e0e4736

Gateway Verification:
Lookup sk_live_... → Tenant: Acme Corp, RateLimit: 1000req/min, Scopes: [read:orders]`,
    pros: 'Simple M2M authentication; easy per-client rate limiting and scope control at the API gateway level.',
    cons: 'Long-lived credentials require dedicated key rotation policies and secure vault storage.',
  },
];

export default function ApiTokenTypesDiagram() {
  const [selectedToken, setSelectedToken] = useState<TokenType>(TOKEN_TYPES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Authentication Token Architecture &amp; Security Comparison</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {TOKEN_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedToken(t)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              background: selectedToken.id === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
              color: selectedToken.id === t.id ? t.color : 'var(--ifm-color-content-secondary)',
              boxShadow: selectedToken.id === t.id ? `0 0 0 1.5px ${t.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: selectedToken.color, marginBottom: '8px' }}>
          {selectedToken.name}
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: selectedToken.color, marginBottom: '12px', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.08)' }}>
          {selectedToken.sampleCode}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Statefulness</div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{selectedToken.statefulness}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Revocability</div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{selectedToken.revocability}</div>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '4px' }}>
          <strong>Pros:</strong> {selectedToken.pros}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
          <strong>Cons:</strong> {selectedToken.cons}
        </div>
      </div>
    </div>
  );
}
