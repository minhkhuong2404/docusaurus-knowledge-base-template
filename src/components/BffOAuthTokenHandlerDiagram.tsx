import React, { useState } from 'react';

export default function BffOAuthTokenHandlerDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>OAuth Token Handler Pattern — XSS Token Theft Elimination</span>
      </div>

      {/* Interactive Step Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { step: 1, label: '1. Login Request (PKCE)' },
          { step: 2, label: '2. Token Exchange & Encrypted Session' },
          { step: 3, label: '3. HttpOnly Cookie & API Proxying' },
        ].map(s => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11.5px', fontWeight: 700,
              background: activeStep === s.step ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeStep === s.step ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeStep === s.step ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Browser (React)</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Opaque Session Cookie</div>
          </div>

          <div style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Web BFF (Token Handler)</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Stores &amp; Encrypts Tokens</div>
          </div>

          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>Keycloak / Auth0</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>OAuth2 / OIDC Issuer</div>
          </div>

          <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#a78bfa' }}>Backend Microservices</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Bearer Token Target</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Security Guarantee:</strong> The browser JS holds ONLY an opaque, encrypted, <code>HttpOnly; Secure; SameSite=Strict</code> session cookie. Real OAuth access and refresh tokens are stored exclusively in the BFF server-side session, rendering XSS token theft completely impossible.
      </div>
    </div>
  );
}
