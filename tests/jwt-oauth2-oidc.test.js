const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadTsModule } = require('./helpers/transpileHelper');

const ROOT = path.resolve(__dirname, '..');

test('JwtOAuthOidcArchitectureDiagram transpiles cleanly and renders all 4 telemetry modes with flowing paths', () => {
  const componentPath = path.join(ROOT, 'src/components/JwtOAuthOidcArchitectureDiagram.tsx');
  assert.ok(fs.existsSync(componentPath), 'JwtOAuthOidcArchitectureDiagram.tsx must exist');

  const mod = loadTsModule(componentPath);
  const Diagram = mod.default;
  assert.equal(typeof Diagram, 'function', 'Default export must be a React component function');

  const modes = ['oauth-oidc', 'phantom-token', 'dpop-mtls', 'jwt-attacks'];
  for (const mode of modes) {
    const html = renderToStaticMarkup(React.createElement(Diagram, { initialMode: mode }));
    assert.ok(
      html.includes('interactive-diagram-container'),
      `Mode ${mode} must render inside .interactive-diagram-container`
    );
    if (mode !== 'jwt-attacks') {
      assert.ok(
        html.includes('interactive-diagram-flowing-path'),
        `Mode ${mode} must render animated .interactive-diagram-flowing-path SVG conduits`
      );
    } else {
      assert.ok(
        html.includes('RS256 → HS256 Key Confusion'),
        'jwt-attacks mode must render RS256 -> HS256 Key Confusion scenario'
      );
    }
  }
});

test('jwt-oauth2-oidc-deep-dive.md is registered in sidebars.ts and covers JOSE, OAuth 2.1, PKCE, OIDC, Phantom Token, DPoP, and Token Exchange', () => {
  const docPath = path.join(ROOT, 'docs/technical-knowledge/security/jwt-oauth2-oidc-deep-dive.md');
  assert.ok(fs.existsSync(docPath), 'jwt-oauth2-oidc-deep-dive.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');

  const requiredTopics = [
    'JWS (RFC 7515)',
    'JWE (RFC 7516)',
    'JWKS (JSON Web Key Set, RFC 7517)',
    'RS256',
    'ES256',
    'EdDSA',
    'OAuth 2.1',
    'code_verifier',
    'code_challenge',
    'id_token',
    'at+jwt',
    'at_hash',
    'Back-Channel Logout',
    'Phantom Token Pattern',
    'Token Exchange (RFC 8693)',
    'DPoP (RFC 9449',
    'HardenedResourceServerConfig',
    'OidcPkceCryptoUtils',
  ];

  for (const topic of requiredTopics) {
    assert.ok(content.includes(topic), `jwt-oauth2-oidc-deep-dive.md must cover "${topic}"`);
  }

  const sidebarsContent = fs.readFileSync(path.join(ROOT, 'sidebars.ts'), 'utf8');
  assert.ok(
    sidebarsContent.includes("'technical-knowledge/security/jwt-oauth2-oidc-deep-dive'"),
    'sidebars.ts must register technical-knowledge/security/jwt-oauth2-oidc-deep-dive'
  );

  const securityIntro = fs.readFileSync(
    path.join(ROOT, 'docs/technical-knowledge/security/00-security-intro.md'),
    'utf8'
  );
  assert.ok(
    securityIntro.includes('/technical-knowledge/security/jwt-oauth2-oidc-deep-dive'),
    '00-security-intro.md must link to /technical-knowledge/security/jwt-oauth2-oidc-deep-dive'
  );
});

test('All JWT, OAuth 2.0, OIDC, and Spring Security guides contain the Senior/Staff Interview Playbook', () => {
  const targetDocs = [
    'docs/technical-knowledge/security/jwt-oauth2-oidc-deep-dive.md',
    'docs/technical-knowledge/security/01-authentication-authorization.md',
    'docs/technical-knowledge/security/cookies-vs-sessions-vs-jwt.md',
    'docs/technical-knowledge/security/refresh-token-security-invalidation.md',
    'docs/technical-knowledge/networking/api-authentication-security.md',
    'docs/technical-knowledge/spring/spring-security.md',
  ];

  for (const relPath of targetDocs) {
    const absPath = path.join(ROOT, relPath);
    const content = fs.readFileSync(absPath, 'utf8');

    assert.ok(
      content.includes('## 🧠 Senior/Staff Interview Playbook: How to Ace '),
      `${relPath} must include the Senior/Staff Interview Playbook header`
    );
    assert.ok(
      content.includes('### 1. The Senior Framing Strategy (First 60 Seconds)'),
      `${relPath} must include Component 1: The Senior Framing Strategy`
    );
    assert.ok(
      content.includes('### 2. Classic Interviewer Traps & Principal Rebuttals'),
      `${relPath} must include Component 2: Classic Interviewer Traps & Principal Rebuttals`
    );
    assert.ok(
      content.includes('* **Junior/Mid Answer:**') && content.includes('* **Principal Rebuttal:**'),
      `${relPath} must contrast Junior/Mid Answer with Principal Rebuttal`
    );
    assert.ok(
      content.includes('### 3. Mid-Level vs. Principal Candidate Cheat Sheet'),
      `${relPath} must include Component 3: Mid-Level vs. Principal Candidate Cheat Sheet`
    );
  }
});
