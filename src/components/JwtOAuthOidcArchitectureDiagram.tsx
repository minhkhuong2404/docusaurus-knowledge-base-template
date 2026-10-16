import React, { useState } from 'react';

export type AuthDiagramMode = 'oauth-oidc' | 'phantom-token' | 'dpop-mtls' | 'jwt-attacks';

interface Props {
  initialMode?: AuthDiagramMode;
}

interface ModeMetadata {
  id: AuthDiagramMode;
  label: string;
  accent: string;
  subtitle: string;
}

const MODES: ModeMetadata[] = [
  {
    id: 'oauth-oidc',
    label: 'OAuth 2.1 + OIDC PKCE Flow',
    accent: '#38bdf8',
    subtitle: 'Unified Authorization Code + PKCE (S256) with OIDC ID Token & Access Token separation',
  },
  {
    id: 'phantom-token',
    label: 'Phantom Token Pattern',
    accent: '#34d399',
    subtitle: 'Opaque reference token at Internet Edge exchanged for signed internal JWS at API Gateway',
  },
  {
    id: 'dpop-mtls',
    label: 'Sender-Constrained (DPoP & mTLS)',
    accent: '#a78bfa',
    subtitle: 'Cryptographic Proof-of-Possession (RFC 9449 DPoP & RFC 8705 mTLS) neutralizing stolen Bearer tokens',
  },
  {
    id: 'jwt-attacks',
    label: 'JWT Cryptographic Attacks & Defenses',
    accent: '#f87171',
    subtitle: 'RS256-to-HS256 Key Confusion, jku/x5u SSRF, kid Path Traversal & RFC 9068 Strict Validation',
  },
];

interface AttackScenario {
  id: string;
  name: string;
  severity: string;
  color: string;
  forgedHeader: string;
  exploitMechanism: string;
  principalDefense: string;
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'key-confusion',
    name: 'RS256 → HS256 Key Confusion',
    severity: 'CRITICAL (CVSS 9.8)',
    color: '#f87171',
    forgedHeader: '{"alg": "HS256", "typ": "JWT", "kid": "prod-rsa-2026"}',
    exploitMechanism:
      'Attacker fetches the server\'s public RSA key from /.well-known/jwks.json, switches header alg from RS256 to HS256, and signs the forged token using the raw PEM public key bytes as an HMAC symmetric secret. Naive verifiers pass the public key object into verify(token, key) without pinning the algorithm.',
    principalDefense:
      'Explicitly pin the allowed cryptographic algorithm (RS256 or ES256) in the JWT verifier configuration and enforce key-type matching (RSAPublicKey cannot be used with Mac instances).',
  },
  {
    id: 'jku-ssrf',
    name: 'jku / x5u SSRF & Embedded jwk Injection',
    severity: 'CRITICAL (CVSS 9.6)',
    color: '#fb923c',
    forgedHeader: '{"alg": "RS256", "jku": "https://attacker.tld/jwks.json", "kid": "rogue-1"}',
    exploitMechanism:
      'Attacker generates their own RSA key pair, hosts the public JWK on an attacker-controlled URL, and sets the JWT header jku (JWK Set URL) or embeds the public key directly inside header.jwk. If the verifier dynamically resolves jku from the unverified header, it verifies the attacker\'s signature.',
    principalDefense:
      'Never trust jku, x5u, or embedded jwk headers from incoming tokens. Hardcode or configure the trusted jwks_uri via static OIDC Discovery metadata from an allowlisted Issuer URL.',
  },
  {
    id: 'kid-injection',
    name: 'kid Path Traversal & SQL Injection',
    severity: 'HIGH (CVSS 8.8)',
    color: '#fbbf24',
    forgedHeader: '{"alg": "HS256", "kid": "../../../../dev/null"}',
    exploitMechanism:
      'Because kid (Key ID) is parsed BEFORE signature verification to locate the verification key, unsanitized kid lookups against the filesystem allow pointing to /dev/null (an empty byte stream). The attacker then signs the token with an empty string "" HMAC key.',
    principalDefense:
      'Treat kid as untrusted user input prior to signature verification. Restrict kid to a strict alphanumeric regex ^[a-zA-Z0-9_-]{1,64}$ and look up keys exclusively from an in-memory Map<String, JWK>.',
  },
  {
    id: 'aud-confused-deputy',
    name: 'Cross-Service Audience & ID Token Replay',
    severity: 'HIGH (CVSS 8.4)',
    color: '#a78bfa',
    forgedHeader: '{"alg": "RS256", "typ": "JWT"} // Payload: {"aud": "analytics-svc", "sub": "admin"}',
    exploitMechanism:
      'A compromised low-tier service (analytics-svc) takes a valid JWT issued for itself and forwards it as a Bearer token to payment-service, or a client sends an OIDC id_token to an API endpoint. If payment-service only verifies the IdP signature and exp without checking aud and typ, it accepts the token.',
    principalDefense:
      'Enforce RFC 9068 Access Token profile: require header typ="at+jwt" (rejecting id_token) and strictly validate that the aud (Audience) claim contains the specific microservice identifier.',
  },
];

export default function JwtOAuthOidcArchitectureDiagram({
  initialMode = 'oauth-oidc',
}: Props): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<AuthDiagramMode>(initialMode);
  const [selectedAttack, setSelectedAttack] = useState<string>('key-confusion');

  const currentModeMeta = MODES.find((m) => m.id === activeMode) || MODES[0];
  const currentAttack =
    ATTACK_SCENARIOS.find((a) => a.id === selectedAttack) || ATTACK_SCENARIOS[0];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.75rem 0' }}>
      <style>{`
        .auth-arch-split-grid {
          display: grid;
          grid-template-columns: 56% 44%;
          gap: 14px;
          align-items: start;
          padding: 14px;
        }
        .auth-arch-cards-grid {
          display: grid;
          grid-template-columns: 33% 33% 33%;
          gap: 10px;
          padding: 0 14px 14px 14px;
        }
        @media (max-width: 768px) {
          .auth-arch-split-grid,
          .auth-arch-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(13, 15, 30, 0.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={currentModeMeta.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
              JWT, OAuth 2.1 &amp; OpenID Connect Telemetry Explorer
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
              {currentModeMeta.subtitle}
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {MODES.map((m) => {
            const isSelected = m.id === activeMode;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMode(m.id)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSelected ? m.accent : 'rgba(255, 255, 255, 0.1)'}`,
                  color: isSelected ? m.accent : '#cbd5e1',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: OAuth 2.1 + OIDC PKCE Flow */}
      {activeMode === 'oauth-oidc' && (
        <div>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
            <svg viewBox="0 0 780 285" className="interactive-diagram-svg" style={{ width: '100%', minWidth: '640px' }}>
              <defs>
                <marker id="oa-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#38bdf8' }} />
                </marker>
                <marker id="oa-arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#fbbf24' }} />
                </marker>
                <marker id="oa-arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#34d399' }} />
                </marker>
                <marker id="oa-arrow-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#a78bfa' }} />
                </marker>
              </defs>

              {/* Node 1: Client / BFF */}
              <rect x="20" y="16" width="160" height="44" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.6" />
              <text x="100" y="35" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                SPA / Mobile / BFF
              </text>
              <text x="100" y="50" textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                PKCE Verifier + State + Nonce
              </text>
              <line x1="100" y1="60" x2="100" y2="270" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="4,4" />

              {/* Node 2: Authorization Server / OIDC Provider */}
              <rect x="305" y="16" width="170" height="44" rx="8" fill="#0d0f1e" stroke="#fbbf24" strokeWidth="1.6" />
              <text x="390" y="35" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">
                OIDC Auth Server (IdP)
              </text>
              <text x="390" y="50" textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                /authorize • /token • /jwks.json
              </text>
              <line x1="390" y1="60" x2="390" y2="270" stroke="rgba(251, 191, 36, 0.25)" strokeDasharray="4,4" />

              {/* Node 3: Resource Server API */}
              <rect x="595" y="16" width="165" height="44" rx="8" fill="#0d0f1e" stroke="#34d399" strokeWidth="1.6" />
              <text x="677" y="35" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
                Resource Server (API)
              </text>
              <text x="677" y="50" textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                Verifies Access Token (at+jwt)
              </text>
              <line x1="677" y1="60" x2="677" y2="270" stroke="rgba(52, 211, 153, 0.25)" strokeDasharray="4,4" />

              {/* Step 1: /authorize with PKCE S256 + state + nonce */}
              <path d="M 108 86 L 378 86" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="2" fill="none" />
              <path
                d="M 108 86 L 378 86"
                className="interactive-diagram-flowing-path"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#oa-arrow-cyan)"
              />
              <text x="243" y="79" textAnchor="middle" fill="#e2e8f0" fontSize="8.8" fontWeight="600">
                1. GET /authorize (scope=openid, code_challenge=S256(v), state, nonce)
              </text>

              {/* Step 2: Callback with code + state + iss */}
              <path d="M 378 126 L 108 126" stroke="rgba(251, 191, 36, 0.25)" strokeWidth="2" fill="none" />
              <path
                d="M 378 126 L 108 126"
                className="interactive-diagram-flowing-path"
                stroke="#fbbf24"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#oa-arrow-amber)"
              />
              <text x="243" y="119" textAnchor="middle" fill="#fbbf24" fontSize="8.8" fontWeight="600">
                2. 302 Redirect ?code=AUTH_CODE &amp; state=xyz &amp; iss=https://idp (RFC 9207)
              </text>

              {/* Step 3: POST /token with code + code_verifier */}
              <path d="M 108 166 L 378 166" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="2" fill="none" />
              <path
                d="M 108 166 L 378 166"
                className="interactive-diagram-flowing-path"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#oa-arrow-cyan)"
              />
              <text x="243" y="159" textAnchor="middle" fill="#e2e8f0" fontSize="8.8" fontWeight="600">
                3. POST /token (code + plaintext code_verifier) — Back-Channel
              </text>

              {/* Step 4: Return id_token + access_token + refresh_token */}
              <path d="M 378 206 L 108 206" stroke="rgba(167, 139, 250, 0.25)" strokeWidth="2" fill="none" />
              <path
                d="M 378 206 L 108 206"
                className="interactive-diagram-flowing-path"
                stroke="#a78bfa"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#oa-arrow-purple)"
              />
              <text x="243" y="199" textAnchor="middle" fill="#a78bfa" fontSize="8.8" fontWeight="600">
                4. Issues id_token (aud=client_id, nonce, at_hash) + access_token (typ=at+jwt)
              </text>

              {/* Step 5: Call API with access_token & JWKS verification */}
              <path d="M 108 246 L 665 246" stroke="rgba(52, 211, 153, 0.25)" strokeWidth="2" fill="none" />
              <path
                d="M 108 246 L 665 246"
                className="interactive-diagram-flowing-path"
                stroke="#34d399"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#oa-arrow-emerald)"
              />
              <text x="386" y="239" textAnchor="middle" fill="#34d399" fontSize="8.8" fontWeight="600">
                5. Authorization: Bearer access_token (API verifies RS256/ES256 via cached JWKS kid)
              </text>
            </svg>
          </div>

          <div className="auth-arch-cards-grid">
            <div style={{ background: '#0c0e17', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                state vs PKCE vs nonce
              </div>
              <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                <code>state</code> prevents cross-site login CSRF on the callback URI. <code>PKCE</code> binds the authorization code to the initiating client via <code>SHA-256(code_verifier)</code>. <code>nonce</code> binds the OIDC <code>id_token</code> to prevent token replay.
              </div>
            </div>
            <div style={{ background: '#0c0e17', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
                ID Token vs Access Token
              </div>
              <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                The <code>id_token</code> is consumed <strong>exclusively by the Client</strong> (<code>aud = client_id</code>) to read user authentication context. It must <strong>never</strong> be sent to Resource APIs as a Bearer token.
              </div>
            </div>
            <div style={{ background: '#0c0e17', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                OAuth 2.1 Hardening
              </div>
              <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                OAuth 2.1 completely eliminates the Implicit Grant (<code>response_type=token</code>) and Password Grant (ROPC), mandates PKCE for all clients (even confidential), and requires exact <code>redirect_uri</code> matching.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Phantom Token Pattern */}
      {activeMode === 'phantom-token' && (
        <div>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
            <svg viewBox="0 0 780 230" className="interactive-diagram-svg" style={{ width: '100%', minWidth: '640px' }}>
              <defs>
                <marker id="pt-arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#fbbf24' }} />
                </marker>
                <marker id="pt-arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#34d399' }} />
                </marker>
                <marker id="pt-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#38bdf8' }} />
                </marker>
              </defs>

              {/* Public Client */}
              <rect x="20" y="75" width="145" height="75" rx="8" fill="#0d0f1e" stroke="#fbbf24" strokeWidth="1.6" />
              <text x="92" y="102" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">
                External Client
              </text>
              <text x="92" y="119" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                Holds Opaque Token
              </text>
              <text x="92" y="134" textAnchor="middle" fill="#94a3b8" fontSize="8">
                Zero PII / Claims Exposed
              </text>

              {/* API Gateway */}
              <rect x="275" y="65" width="185" height="95" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.8" />
              <text x="367" y="92" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                API Gateway (Envoy / Kong)
              </text>
              <text x="367" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                1. Introspects Opaque Token
              </text>
              <text x="367" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                2. Caches JWS in Redis (TTL)
              </text>
              <text x="367" y="140" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="600">
                3. Swaps Header to Bearer JWS
              </text>

              {/* Auth Server / Redis Introspection */}
              <rect x="285" y="180" width="165" height="40" rx="6" fill="#0d0f1e" stroke="#a78bfa" strokeWidth="1.4" />
              <text x="367" y="198" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="700">
                IdP /introspect + Redis Cache
              </text>
              <text x="367" y="212" textAnchor="middle" fill="#94a3b8" fontSize="8">
                Mints internal RS256/ES256 JWT
              </text>

              {/* Downstream Microservices */}
              <rect x="575" y="75" width="180" height="75" rx="8" fill="#0d0f1e" stroke="#34d399" strokeWidth="1.6" />
              <text x="665" y="102" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
                Internal Microservices
              </text>
              <text x="665" y="119" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                Stateless JWS Verification
              </text>
              <text x="665" y="134" textAnchor="middle" fill="#94a3b8" fontSize="8">
                Rich Claims (sub, roles, tenant)
              </text>

              {/* Edge 1: Opaque Token */}
              <path d="M 171 112 L 265 112" stroke="rgba(251, 191, 36, 0.25)" strokeWidth="2.2" fill="none" />
              <path
                d="M 171 112 L 265 112"
                className="interactive-diagram-flowing-path"
                stroke="#fbbf24"
                strokeWidth="2.2"
                fill="none"
                markerEnd="url(#pt-arrow-amber)"
              />
              <text x="218" y="98" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="700">
                Opaque Reference
              </text>
              <text x="218" y="128" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Bearer 8f9d2a1b...
              </text>

              {/* Edge 2: Gateway <-> IdP */}
              <path
                d="M 367 162 L 367 176"
                className="interactive-diagram-flowing-path"
                stroke="#38bdf8"
                strokeWidth="1.8"
                fill="none"
                markerEnd="url(#pt-arrow-cyan)"
              />

              {/* Edge 3: Signed JWT to Internal Services */}
              <path d="M 466 112 L 565 112" stroke="rgba(52, 211, 153, 0.25)" strokeWidth="2.2" fill="none" />
              <path
                d="M 466 112 L 565 112"
                className="interactive-diagram-flowing-path"
                stroke="#34d399"
                strokeWidth="2.2"
                fill="none"
                markerEnd="url(#pt-arrow-emerald)"
              />
              <text x="515" y="98" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="700">
                Signed JWT (JWS)
              </text>
              <text x="515" y="128" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                eyJhbGciOiJFUzI1Ni...
              </text>
            </svg>
          </div>
          <div className="interactive-diagram-details-card" style={{ margin: '0 14px 14px 14px', borderLeftColor: '#34d399' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
              Why Principal Architects Use the Phantom Token Pattern
            </div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              1. <strong>Zero External Information Leakage:</strong> Public clients only ever see a random 256-bit opaque string, preventing competitors or attackers from decoding internal roles, tenant IDs, or feature flags.<br />
              2. <strong>Instant Edge Revocation + Internal Statelessness:</strong> Revoking the opaque token at the IdP/API Gateway blocks external traffic immediately, while internal microservices still enjoy 0-DB-lookup stateless JWT verification.
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Sender-Constrained Tokens (DPoP & mTLS) */}
      {activeMode === 'dpop-mtls' && (
        <div>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
            <svg viewBox="0 0 780 235" className="interactive-diagram-svg" style={{ width: '100%', minWidth: '640px' }}>
              <defs>
                <marker id="dp-arrow-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#a78bfa' }} />
                </marker>
                <marker id="dp-arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#34d399' }} />
                </marker>
              </defs>

              {/* Client Key Pair */}
              <rect x="20" y="55" width="195" height="115" rx="8" fill="#0d0f1e" stroke="#a78bfa" strokeWidth="1.6" />
              <text x="117" y="80" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">
                Client (WebCrypto / Enclave)
              </text>
              <text x="117" y="98" textAnchor="middle" fill="#e2e8f0" fontSize="8.5">
                Non-Exportable Private Key (K_priv)
              </text>
              <text x="117" y="114" textAnchor="middle" fill="#94a3b8" fontSize="8">
                Generates DPoP Proof per HTTP Call:
              </text>
              <text x="117" y="129" textAnchor="middle" fill="#38bdf8" fontSize="8">
                htm: &quot;POST&quot;, htu: &quot;https://api/pay&quot;
              </text>
              <text x="117" y="144" textAnchor="middle" fill="#38bdf8" fontSize="8">
                ath: SHA256(access_token), jti, iat
              </text>

              {/* Access Token Binding Box */}
              <rect x="295" y="65" width="195" height="95" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.6" />
              <text x="392" y="90" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">
                Sender-Constrained Token
              </text>
              <text x="392" y="108" textAnchor="middle" fill="#34d399" fontSize="8.5">
                &quot;cnf&quot;: &#123; &quot;jkt&quot;: &quot;SHA256(K_pub)&quot; &#125;
              </text>
              <text x="392" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                or mTLS Cert Thumbprint:
              </text>
              <text x="392" y="140" textAnchor="middle" fill="#fbbf24" fontSize="8">
                &quot;cnf&quot;: &#123; &quot;x5t#S256&quot;: &quot;CertHash&quot; &#125;
              </text>

              {/* Resource Server Verifier */}
              <rect x="565" y="55" width="195" height="115" rx="8" fill="#0d0f1e" stroke="#34d399" strokeWidth="1.6" />
              <text x="662" y="80" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">
                Resource Server Verification
              </text>
              <text x="662" y="98" textAnchor="middle" fill="#cbd5e1" fontSize="8.3">
                1. Verify Access Token Signature
              </text>
              <text x="662" y="114" textAnchor="middle" fill="#cbd5e1" fontSize="8.3">
                2. Verify DPoP Proof Signature
              </text>
              <text x="662" y="130" textAnchor="middle" fill="#cbd5e1" fontSize="8.3">
                3. Check JWK Thumbprint == cnf.jkt
              </text>
              <text x="662" y="146" textAnchor="middle" fill="#34d399" fontSize="8.3" fontWeight="700">
                4. Match htm, htu &amp; ath Hash
              </text>

              {/* Conduits */}
              <path d="M 221 112 L 285 112" stroke="rgba(167, 139, 250, 0.25)" strokeWidth="2.2" fill="none" />
              <path
                d="M 221 112 L 285 112"
                className="interactive-diagram-flowing-path"
                stroke="#a78bfa"
                strokeWidth="2.2"
                fill="none"
                markerEnd="url(#dp-arrow-purple)"
              />
              <path d="M 496 112 L 555 112" stroke="rgba(52, 211, 153, 0.25)" strokeWidth="2.2" fill="none" />
              <path
                d="M 496 112 L 555 112"
                className="interactive-diagram-flowing-path"
                stroke="#34d399"
                strokeWidth="2.2"
                fill="none"
                markerEnd="url(#dp-arrow-emerald)"
              />
            </svg>
          </div>
          <div className="interactive-diagram-details-card" style={{ margin: '0 14px 14px 14px', borderLeftColor: '#a78bfa' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
              Bearer Tokens vs. Proof-of-Possession (DPoP RFC 9449 &amp; mTLS RFC 8705)
            </div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              A standard <code>Bearer</code> token is like cash: any attacker who exfiltrates it from logs, proxy dumps, or XSS can replay it from any machine. With <strong>DPoP</strong> or <strong>mTLS</strong>, the token embeds a cryptographic confirmation claim (<code>cnf</code>) containing the SHA-256 thumbprint of the client&apos;s public key. Stolen tokens are useless without the non-exportable private key.
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: JWT Cryptographic Attacks & Defenses */}
      {activeMode === 'jwt-attacks' && (
        <div className="auth-arch-split-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ATTACK_SCENARIOS.map((item) => {
              const active = item.id === currentAttack.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAttack(item.id)}
                  style={{
                    background: active ? 'rgba(248, 113, 113, 0.1)' : '#0c0e17',
                    border: `1px solid ${active ? item.color : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? item.color : '#ffffff' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(248, 113, 113, 0.16)',
                        color: item.color,
                      }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <code style={{ fontSize: '0.71rem', color: '#38bdf8', display: 'block', wordBreak: 'break-all' }}>
                    {item.forgedHeader}
                  </code>
                </div>
              );
            })}
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${currentAttack.color}`,
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: currentAttack.color, marginBottom: '8px' }}>
              {currentAttack.name}
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
              Under-the-Hood Exploit Mechanics:
            </div>
            <p style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 12px 0' }}>
              {currentAttack.exploitMechanism}
            </p>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
              Principal Engineering Defense:
            </div>
            <p style={{ fontSize: '0.76rem', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
              {currentAttack.principalDefense}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
