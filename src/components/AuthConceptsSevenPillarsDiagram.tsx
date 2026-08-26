import React, { useState } from 'react';

type ConceptId = 'authn-authz' | 'basic-apikey' | 'session-token' | 'bearer-jwt' | 'access-refresh' | 'oauth-oidc-sso' | 'decision-matrix';

interface ConceptData {
  id: ConceptId;
  number: string;
  title: string;
  badge: string;
  badgeColor: string;
  headline: string;
  misconception: string;
  reality: string;
  codeSnippet: string;
  keyPoints: string[];
}

const CONCEPTS: ConceptData[] = [
  {
    id: 'authn-authz',
    number: '01',
    title: 'AuthN vs AuthZ',
    badge: '401 vs 403',
    badgeColor: '#38bdf8',
    headline: 'Authentication verifies IDENTITY ("Who are you?"); Authorization checks PERMISSIONS ("What can you do?").',
    misconception: '"OAuth 2.0 is an authentication protocol because Google uses it for login."',
    reality: 'OAuth 2.0 is strictly an AUTHORIZATION framework for delegated access. Authentication is handled by OpenID Connect (OIDC) built on top of OAuth 2.0.',
    codeSnippet: `// 1. Authentication Failure: Identity not established
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token"

// 2. Authorization Failure: Identity known (e.g. normal user), but insufficient role
HTTP/1.1 403 Forbidden
Content-Type: application/json
{ "error": "FORBIDDEN", "message": "Requires ROLE_ADMIN" }`,
    keyPoints: [
      'AuthN happens FIRST (validates password, biometric, or MFA token)',
      'AuthZ happens SECOND (evaluates RBAC roles, ABAC attributes, or scopes)',
      '401 Unauthorized = "Please log in / provide valid credentials"',
      '403 Forbidden = "You are logged in, but you cannot access this resource"'
    ]
  },
  {
    id: 'basic-apikey',
    number: '02',
    title: 'Basic Auth & API Keys',
    badge: 'M2M & LEGACY',
    badgeColor: '#fbbf24',
    headline: 'Basic Auth sends credentials on every request; API Keys identify machine clients or projects.',
    misconception: '"API Keys are user authentication tokens."',
    reality: 'API Keys identify the calling application/project (e.g. Stripe, AWS, OpenAI), NOT the individual end-user. They are static, long-lived, and used for rate limiting and billing.',
    codeSnippet: `// Basic Auth (RFC 7617) - Base64(username:password)
GET /api/v1/data HTTP/1.1
Authorization: Basic YWxpY2U6c2VjcmV0MTIz

// API Key in Request Header (Modern Server-to-Server)
GET /v1/charges HTTP/1.1
Authorization: Bearer sk_live_51Nz...
// OR custom header:
X-API-Key: ak_prod_9921a8f9c1`,
    keyPoints: [
      'Basic Auth is obsolete for user auth (sends plaintext credentials, cannot logout without browser restart)',
      'API Keys are ideal for CLI tools, webhooks, and public developer APIs',
      'API Keys must have rotation capabilities and scoped permissions',
      'Never expose secret API keys in client-side mobile/browser bundles'
    ]
  },
  {
    id: 'session-token',
    number: '03',
    title: 'Session vs Token Auth',
    badge: 'STATEFUL vs STATELESS',
    badgeColor: '#34d399',
    headline: 'Sessions store state on the server; Tokens (JWT) store self-contained state inside signed payloads.',
    misconception: '"JWT is always better and faster than Session-based authentication."',
    reality: 'Sessions provide instant zero-effort revocation and small payloads. JWTs avoid database lookups but suffer from difficult revocation and larger payload sizes.',
    codeSnippet: `// Session-Based Flow (Stateful):
// Client sends Cookie: SESSION_ID=abc123
// Server queries Redis/DB ➔ Loads user session object ➔ Authorizes

// Token-Based Flow (Stateless JWT):
// Client sends: Authorization: Bearer eyJhbGciOiJSUzI1Ni...
// Server verifies cryptographic signature with Public Key (0 DB queries!)`,
    keyPoints: [
      'Session Auth: State stored in Redis/DB. Revocation is instant (delete key)',
      'Token Auth: Stateless. Scales easily across microservices and mobile apps',
      'Session storage: HttpOnly, Secure, SameSite cookies protect against XSS',
      'Token revocation: Requires Redis blocklist, token_version, or short TTL'
    ]
  },
  {
    id: 'bearer-jwt',
    number: '04',
    title: 'Bearer Token vs JWT',
    badge: 'SCHEME vs FORMAT',
    badgeColor: '#a78bfa',
    headline: '"Bearer" is the HTTP transport scheme; "JWT" is the internal token encoding format.',
    misconception: '"Bearer Token and JWT are the exact same thing."',
    reality: '"Bearer" means "Whoever bears/holds this token has access". A Bearer token can be an opaque UUID, a random hex string, or a structured JWT!',
    codeSnippet: `// 1. Bearer Scheme with Opaque Token (Random UUID):
Authorization: Bearer 8f3a9b1c-4d2e-4f6a-8b1c-9d0e1f2a3b4c
// ➔ Resource server queries Redis to resolve user identity

// 2. Bearer Scheme with JWT Format (Header.Payload.Signature):
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3Jf...
// ➔ Resource server decodes payload and verifies cryptographic signature`,
    keyPoints: [
      'Bearer (RFC 6750): Authentication scheme specifying token transport in HTTP Authorization header',
      'JWT (RFC 7519): JSON Web Token format consisting of Header, Payload, and Signature',
      'Opaque Bearer Token: Zero information leakage; requires server-side lookup',
      'JWT Bearer Token: Self-contained claims; allows decentralized verification'
    ]
  },
  {
    id: 'access-refresh',
    number: '05',
    title: 'Access & Refresh Tokens',
    badge: '2-TOKEN LIFECYCLE',
    badgeColor: '#2dd4bf',
    headline: 'Short-lived Access Tokens authorize API calls; long-lived Refresh Tokens securely mint new token pairs.',
    misconception: '"Just make access tokens last 30 days so users never have to re-login."',
    reality: 'If a 30-day access token is stolen, the attacker has unrestricted access for 30 days. Short TTLs (5–15m) + Refresh Token Rotation (RTR) limit breach exposure.',
    codeSnippet: `// 1. API Call with short-lived Access Token (15m TTL):
GET /api/v1/wallet HTTP/1.1
Authorization: Bearer <access_token_15m>

// 2. When Access Token expires (HTTP 401), exchange Refresh Token:
POST /api/v1/auth/refresh HTTP/1.1
Cookie: refresh_token=rt_long_lived_30d; HttpOnly; Secure
// ➔ Auth Server rotates: Returns new Access Token + new Refresh Token`,
    keyPoints: [
      'Access Token: 5–15 min TTL, stored in JS memory, passed in Authorization header',
      'Refresh Token: 7–30 day TTL, stored in HttpOnly cookie or mobile Keychain',
      'Refresh Token Rotation (RTR): Invalidate old refresh token on every exchange',
      'Replay Detection: Reusing an old refresh token flags theft and locks the family'
    ]
  },
  {
    id: 'oauth-oidc-sso',
    number: '06',
    title: 'OAuth 2.0 vs OIDC vs SSO',
    badge: 'PROTOCOL vs IDENTITY vs UX',
    badgeColor: '#f97316',
    headline: 'OAuth2 is Authorization; OIDC is Identity/Authentication; SSO is the User Experience.',
    misconception: '"SSO is a security protocol like OAuth2 or OIDC."',
    reality: 'SSO (Single Sign-On) is an architectural User Experience where logging in once grants access to multiple applications. It is implemented USING protocols like OIDC or SAML 2.0.',
    codeSnippet: `// 1. OAuth 2.0 (Delegation / AuthZ):
// Grants App permission to access Google Drive on behalf of user
// Output: access_token (with scope: "https://www.googleapis.com/auth/drive")

// 2. OpenID Connect (Identity / AuthN):
// Grants App the user's verified identity profile
// Output: id_token (JWT containing { sub, email, name, picture })

// 3. SSO (Single Sign-On UX):
// User logs in to Okta/Google once ➔ Automatically authenticated into Slack, Jira, GitHub`,
    keyPoints: [
      'OAuth 2.0: Issues access_token for API authorization (Scopes & Permissions)',
      'OIDC: Extends OAuth 2.0 with id_token for user authentication & /userinfo',
      'SSO: UX pattern allowing 1 login for N systems (powered by OIDC or SAML)',
      'Rule of Thumb: id_token is for the Client app; access_token is for Resource APIs'
    ]
  },
  {
    id: 'decision-matrix',
    number: '07',
    title: 'Auth Decision Framework',
    badge: 'SENIOR ARCHITECTURE',
    badgeColor: '#f87171',
    headline: 'Choose the right authentication mechanism based on architecture, clients, and security requirements.',
    misconception: '"One auth system fits every type of application."',
    reality: 'Monolithic web apps thrive on Cookie Sessions; mobile & microservices require JWT / OIDC; third-party integrations demand OAuth 2.0 + API Keys.',
    codeSnippet: `// ARCHITECTURAL DECISION GUIDE:
// 1. Monolith (SSR, Rails, Django, Thymeleaf) ➔ Session + HttpOnly Cookie
// 2. SPA + Microservices (React, Vue, Node, Spring) ➔ Access (JWT) + Refresh (Cookie)
// 3. Native Mobile (iOS / Android) ➔ Access (JWT) + Refresh (OS Keychain)
// 4. Developer / Public APIs ➔ Scoped API Keys (Header: X-API-Key)
// 5. Enterprise / B2B SaaS ➔ OIDC / SAML 2.0 Single Sign-On (SSO)`,
    keyPoints: [
      'Monolithic SSR: Cookie + Session (simplest, most secure against XSS)',
      'Microservices / SPA: Short-lived JWT + Refresh Token Rotation in HttpOnly cookie',
      'Mobile Apps: OAuth 2.0 PKCE + Passkeys / Biometrics + Hardware Keychain',
      'B2B SaaS: SAML / OIDC federated SSO with centralized IdP (Okta, Azure AD)'
    ]
  }
];

export default function AuthConceptsSevenPillarsDiagram(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<ConceptId>('authn-authz');

  const current = CONCEPTS.find((c) => c.id === selectedId) ?? CONCEPTS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .auth-concepts-grid {
          display: grid;
          grid-template-columns: 38% 62%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .auth-concepts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          7 Core Authentication Concepts Every Developer Should Know
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
          Interactive Master Guide
        </span>
      </div>

      {/* Main Grid */}
      <div style={{ padding: '16px' }}>
        <div className="auth-concepts-grid">
          {/* Left Column: Concept List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${selectedId === c.id ? c.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
                  background: selectedId === c.id ? `${c.badgeColor}15` : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', color: c.badgeColor }}>
                  {c.number}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: selectedId === c.id ? c.badgeColor : 'var(--ifm-color-content)' }}>
                    {c.title}
                  </div>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', background: `${c.badgeColor}20`, color: c.badgeColor }}>
                  {c.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Right Column: Deep-Dive Panel */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor }}>
                CONCEPT {current.number}
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', color: current.badgeColor }}>
                {current.title}
              </h4>
            </div>

            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.headline}
            </p>

            {/* Misconception vs Reality Callout */}
            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '4px solid #f87171', fontSize: '11px' }}>
              <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '2px' }}>❌ Common Misconception:</div>
              <div style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '6px' }}>{current.misconception}</div>
              <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '2px' }}>✅ Architectural Reality:</div>
              <div style={{ color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{current.reality}</div>
            </div>

            {/* Code / Protocol Payload */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              HTTP Protocol & Code Pattern:
            </div>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', border: '1px solid var(--ifm-color-emphasis-300)', marginBottom: '12px' }}>
              <code>{current.codeSnippet}</code>
            </pre>

            {/* Key Takeaways */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              Pillars & Key Invariants:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {current.keyPoints.map((pt, i) => (
                <div key={i} style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: current.badgeColor }}>•</span> <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
