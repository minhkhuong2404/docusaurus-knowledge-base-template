---
id: api-authentication-security
title: API Authentication & Authorization
description: OAuth 2.0 flows, JWT structure and validation, API keys, mTLS, OIDC, token introspection, and Spring Security integration.
tags: [networking, authentication, oauth2, jwt, oidc, api-security, spring-security, bearer-token, mtls]
sidebar_position: 17
---

import ApiAuthSecurityDiagram from '@site/src/components/ApiAuthSecurityDiagram';
import CorsProtocolDiagram from '@site/src/components/CorsProtocolDiagram';

# API Authentication & Authorization

<ApiAuthSecurityDiagram />

<CorsProtocolDiagram />

---

## Authentication vs Authorization

| Concept | Question | Example |
|---------|----------|---------|
| **Authentication (AuthN)** | *Who are you?* | Verifying a JWT signature proves the token is from a trusted issuer |
| **Authorization (AuthZ)** | *What can you do?* | Checking if the user has the `ROLE_ADMIN` scope to delete resources |

---

## API Key Authentication & Timing Attacks

API keys provide simple machine identification for developer APIs and public SDKs:

### 1. Security Invariants for API Keys
- **Header Transmission Only**: Always require API keys in custom headers (`X-API-Key: <key>` or `Authorization: ApiKey <key>`). **Never accept API keys in URL query parameters** (`/api/v1/data?api_key=...`), which are leaked into Nginx access logs, browser history, forward proxy logs, and `Referer` headers.
- **One-Way Cryptographic Hashing**: Treat API keys like passwords. Never store raw API keys in your database. Store `SHA-256(raw_key)` so an SQL injection or backup leak does not compromise customer keys.
- **Constant-Time Verification**: Standard string comparison (`key.equals(storedKey)`) terminates early on the first mismatched byte, allowing attackers to measure microscopic timing variations ($\sim 10\text{–}50\text{ ns}$) and guess the secret key byte-by-byte (Timing Side-Channel Attack). Always use `MessageDigest.isEqual()`:

```java
// Java: Constant-time API Key verification preventing timing attacks
public boolean verifyApiKey(String providedKey, String expectedHash) {
    byte[] providedHash = MessageDigest.getInstance("SHA-256")
        .digest(providedKey.getBytes(StandardCharsets.UTF_8));
    byte[] expectedBytes = HexFormat.of().parseHex(expectedHash);
    
    // Constant-time byte array comparison (does not short-circuit on mismatch)
    return MessageDigest.isEqual(providedHash, expectedBytes);
}
```

---

## OAuth 2.0 Authorization Framework

OAuth 2.0 (RFC 6749) decouples resource owners, client applications, and resource servers using scoped access tokens.

### 1. Authorization Code Flow with PKCE (RFC 7636)

PKCE (Proof Key for Code Exchange) is **mandatory for all public clients** (Single Page Apps, iOS/Android mobile apps) that cannot securely embed a client secret:

```
[ User Browser / Mobile App ]        [ Authorization Server ]        [ Backend API ]
              │                                  │                          │
  1. Generate code_verifier                      │                          │
     challenge = S256(verifier)                  │                          │
              │                                  │                          │
  2. GET /authorize?response_type=code           │                          │
     &code_challenge=...&method=S256 ───────────►│                          │
              │                                  │                          │
  3. User Authenticates & Consents               │                          │
     Redirect with auth_code ◄───────────────────┘                          │
              │                                  │                          │
  4. POST /token                                 │                          │
     grant_type=authorization_code               │                          │
     &code=auth_code&code_verifier=... ─────────►│                          │
              │                                  │                          │
  5. Auth Server verifies:                       │                          │
     S256(code_verifier) == code_challenge       │                          │
     Returns access_token + refresh_token ◄──────┘                          │
              │                                                             │
  6. GET /api/resource (Authorization: Bearer <token>) ────────────────────►│
```

### 2. Client Credentials Flow (M2M Service-to-Service)

Used for daemon processes, cron jobs, and internal backend microservices communicating without a user context:

```java
// Spring Boot: configure reactive OAuth2 Client Credentials with WebClient
@Configuration
public class OAuth2ClientConfig {

    @Bean
    public WebClient serviceClient(ReactiveOAuth2AuthorizedClientManager manager) {
        ServerOAuth2AuthorizedClientExchangeFilterFunction filter =
            new ServerOAuth2AuthorizedClientExchangeFilterFunction(manager);
        filter.setDefaultClientRegistrationId("inventory-service");

        return WebClient.builder()
            .filter(filter)  // automatically fetches, caches, and attaches Bearer token
            .baseUrl("https://inventory.internal")
            .build();
    }
}
```

```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          inventory-service:
            provider: keycloak
            client-id: order-service
            client-secret: ${CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: inventory:read,inventory:write
        provider:
          keycloak:
            token-uri: https://auth.internal/realms/production/protocol/openid-connect/token
```

### 3. Demonstrating Proof-of-Possession (DPoP - RFC 9449)

Standard Bearer tokens behave like cash: whoever steals the token from a compromised browser `localStorage` or memory dump can impersonate the victim from any IP on the globe.

**DPoP (RFC 9449)** binds tokens to an asymmetric key pair generated in the client:
1. The client generates an in-memory asymmetric key pair (e.g. Ed25519 or ES256).
2. When requesting a token from `/token`, the client includes a signed **DPoP Proof JWT** in the `DPoP` header containing the public key (`jwk`).
3. The Auth Server issues a DPoP-bound access token (`token_type: DPoP`) containing the thumbprint of the client's public key (`jkt` claim).
4. Every subsequent request to resource servers must include a fresh DPoP proof header signed by the client's private key, bound to the specific HTTP method and URI (`htu` and `htm` claims) with a timestamp.
5. Even if an attacker intercepts the access token, it is completely useless without the private key!

---

## Zero-Trust Workload Identity: SPIFFE & SPIRE

In cloud-native Kubernetes environments, hardcoding client secrets or managing long-lived static certificates creates severe attack surfaces.

**SPIFFE (Secure Production Identity Framework for Everyone)** standardizes machine identity:
- **SPIFFE ID**: A URI identifying the service: `spiffe://prod.internal/ns/default/sa/payment-service`.
- **SVID (SPIFFE Verifiable Identity Document)**: An X.509 certificate carrying the SPIFFE ID in the `Subject Alternative Name (SAN: URI:...)`.
- **SPIRE (SPIFFE Runtime Engine)**: Node agents attest the workload's cryptographic integrity (Kubernetes namespace, service account, cgroup) and automatically inject short-lived X.509 certificates (rotated every 60 minutes) directly into the pod via a local Unix domain socket.
- When Service A opens an mTLS connection to Service B, both sides validate each other's SPIFFE IDs inside the TLS handshake, establishing continuous zero-trust identity with zero static secrets.

---

#### Device Code Flow

For devices with limited input (smart TVs, IoT):
```
Device → /device_authorization → gets device_code + user_code + verification_uri
Device shows: "Go to example.com/activate and enter: XKCD-1234"
Device polls /token with device_code until user completes login on another device
```

### Refresh Token Flow

```java
// Access tokens are short-lived (1h); refresh tokens are long-lived (days/weeks)
// Spring handles refresh automatically when using OAuth2 client
POST /token
  grant_type=refresh_token
  refresh_token=<refresh_token>
  client_id=<client_id>

// Response: new access_token (+ optionally new refresh_token)
```

---

## OIDC — OpenID Connect

An **identity layer** on top of OAuth 2.0 that adds:
- **ID Token**: JWT containing user identity (sub, email, name)
- **UserInfo endpoint**: fetch additional user claims
- **Standard scopes**: `openid`, `profile`, `email`, `address`, `phone`

```java
// Spring Boot OIDC login (Full SSO setup)
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid,profile,email
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            jwk-set-uri: https://www.googleapis.com/oauth2/v3/certs
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
```

---

## Token Revocation & Introspection

### The JWT Revocation Problem

JWTs are **stateless** — once issued, the server can't invalidate them before expiry. Solutions:

| Strategy | Description | Trade-off |
|----------|-------------|-----------|
| **Short expiry** | 5–15 min access tokens | Frequent refresh needed |
| **Blacklist** | Store revoked `jti` in Redis | Adds latency; stateful |
| **Token introspection** | Ask auth server if token is still valid | Extra network call |
| **Rotating refresh tokens** | Old refresh token invalidated on use | Detects token theft |

```java
// Redis-based token blacklist
@Service
public class TokenBlacklistService {
    @Autowired RedisTemplate<String, String> redis;

    public void revoke(String jti, long expiresInSeconds) {
        redis.opsForValue().set("revoked:" + jti, "true",
            Duration.ofSeconds(expiresInSeconds));
    }

    public boolean isRevoked(String jti) {
        return Boolean.TRUE.equals(redis.hasKey("revoked:" + jti));
    }
}

// Custom JWT decoder that checks blacklist
@Bean
public JwtDecoder jwtDecoder() {
    NimbusJwtDecoder decoder = NimbusJwtDecoder
        .withJwkSetUri("https://auth.example.com/.well-known/jwks.json")
        .build();

    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefault(),
        token -> {
            String jti = token.getId();
            if (blacklist.isRevoked(jti))
                return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("revoked_token"));
            return OAuth2TokenValidatorResult.success();
        }
    ));
    return decoder;
}
```

---

## mTLS — Mutual TLS

Both client and server present certificates. Used for service-to-service (zero trust).

```
Regular TLS:  Client verifies server's certificate
mTLS:         Server also verifies client's certificate → bidirectional trust
```

```java
// Spring Boot: configure mTLS on server
# application.yml
server:
  ssl:
    key-store: classpath:server-keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    trust-store: classpath:client-truststore.p12
    trust-store-password: ${TRUSTSTORE_PASSWORD}
    client-auth: need  # require client cert

// Spring Boot: WebClient with client certificate
@Bean
public WebClient mtlsWebClient() throws Exception {
    SslContext sslContext = SslContextBuilder.forClient()
        .keyManager(clientCertFile, clientKeyFile)
        .trustManager(caCertFile)
        .build();

    HttpClient httpClient = HttpClient.create()
        .secure(spec -> spec.sslContext(sslContext));

    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .build();
}
```

---

## Security Headers

```java
// Spring Security: add security headers
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        .contentSecurityPolicy(csp ->
            csp.policyDirectives("default-src 'self'; script-src 'self'"))
        .frameOptions(frame -> frame.deny())
        .httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .maxAgeInSeconds(31536000))  // 1 year
        .xssProtection(xss -> xss.disable())  // use CSP instead
        .referrerPolicy(ref ->
            ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN))
    );
    return http.build();
}
```

---

## Rate Limiting

```java
// Bucket4j: token bucket rate limiter
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
        .expireAfterAccess(1, TimeUnit.HOURS)
        .build();

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain) throws IOException, ServletException {

        String clientId = extractClientId(req); // API key or IP
        Bucket bucket = buckets.get(clientId, k ->
            Bucket.builder()
                .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
                .build());

        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429); // Too Many Requests
            res.setHeader("Retry-After", "60");
            res.setHeader("X-RateLimit-Limit", "100");
            res.setHeader("X-RateLimit-Remaining", "0");
            res.getWriter().write("{\"error\":\"rate_limit_exceeded\"}");
        }
    }
}
```

---

## Interview Questions

### Q1. What is the difference between OAuth 2.0 and OIDC?
> OAuth 2.0 is an authorization framework — it grants third-party apps access to resources on behalf of a user (access tokens, scopes). It doesn't define user identity. OIDC (OpenID Connect) is an identity layer built on top of OAuth 2.0 — it adds an ID Token (a JWT with user identity claims like `sub`, `email`) and a UserInfo endpoint. Use OAuth for API authorization; use OIDC for user authentication/SSO.

### Q2. What are the JWT claims `iss`, `sub`, `aud`, `exp`, `iat`?
> `iss` (Issuer): who created and signed the token (auth server URL). `sub` (Subject): who the token is about (user ID). `aud` (Audience): intended recipient(s) — validate that your API is in this list. `exp` (Expiration): Unix timestamp after which the token is invalid. `iat` (Issued At): when the token was created. Always validate `exp` and `aud` in addition to the signature.

### Q3. Why is RS256 preferred over HS256 for JWTs in microservices?
> HS256 uses a shared secret — every service that validates tokens must know the same secret, which becomes a security risk as you scale. RS256 uses asymmetric RSA keys: the auth server signs with its private key; all services validate with the public key. Compromising a resource server doesn't expose the signing key. The public key can be distributed via JWKS endpoint (`/.well-known/jwks.json`).

### Q4. How do you securely handle token revocation with JWTs?
> JWTs are stateless, so traditional revocation requires: (1) Short expiry (5–15 min) + refresh tokens. (2) A revocation blacklist in Redis keyed by `jti` claim — check on every request (adds latency). (3) Token introspection — ask the auth server on each request (most accurate, most overhead). (4) Rotating refresh tokens — detect theft when old refresh token is reused. Strategy depends on security requirements vs latency tolerance.

### Q5. What is PKCE and why is it required for public clients?
> PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks for public clients (SPAs, mobile apps) that can't securely store a client secret. The client generates a random `code_verifier`, computes `code_challenge = SHA256(code_verifier)`, includes the challenge in the auth request, and the verifier in the token request. The auth server verifies they match — an attacker who intercepts the auth code can't exchange it without the verifier.

### Q6. What is the Client Credentials flow and when is it used?
> Client Credentials is used for machine-to-machine (M2M) communication with no user involvement. Service A authenticates itself with `client_id` + `client_secret` directly to the auth server, receives an access token, and uses it to call Service B. Used for internal microservice-to-service calls, batch jobs, background workers. Spring Boot auto-handles token refresh with the OAuth2 client configured with `authorization-grant-type: client_credentials`.

### Q7. What is mTLS and how does it differ from regular TLS?
> Regular TLS: only the client verifies the server's certificate (one-way authentication). mTLS (Mutual TLS): both sides present and verify certificates — the server also verifies the client's cert. This provides cryptographic proof of identity for both parties, making it ideal for zero-trust service-to-service communication. It's the strongest form of service authentication; in service meshes like Istio, mTLS is often applied automatically via sidecars.

### Q8. What is token introspection and when would you use it over local JWT validation?
> Token introspection (RFC 7662) involves calling the auth server's `/introspect` endpoint on every request to check if a token is still valid and active. Unlike local validation (check signature + expiry), introspection can detect revoked tokens immediately. Trade-off: adds a network call to every request (~5–20ms). Use local JWT validation with short expiry for most cases; use introspection for high-security scenarios (banking, healthcare) where immediate revocation is critical.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace API Authentication, OAuth 2.0 & Zero-Trust Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When designing API authentication across external clients and internal microservices, frame your architecture around **Three Trust Perimeters**:
1. **North-South Edge Perimeter (External Client $\to$ API Gateway)**:
   - Human users authenticate via **OIDC + OAuth 2.1 Authorization Code + PKCE (`S256`)**; external B2B integrations use **mTLS (RFC 8705)** or **Prefix-Tagged Hashed API Keys** (`sk_live_<random>`, verified via constant-time `MessageDigest.isEqual(SHA256(key), expected)`).
   - Use the **Phantom Token Pattern** at the API Gateway: external clients present an opaque token (zero internal claim leakage, instant revocation), and the Gateway exchanges it (with Redis caching) for a signed internal JWT (`JWS`).
2. **East-West Internal Mesh Perimeter (Service A $\to$ Service B)**:
   - Separate **Workload Identity** from **User Identity**. Every pod proves its machine identity via **mTLS with SPIFFE/SPIRE X.509 SVIDs** rotated hourly, while propagating user context via **OAuth 2.0 Token Exchange (RFC 8693)** with narrow `aud` and `act` (Actor) claims.
3. **Cryptographic Sender Constraint**:
   - Upgrade high-value tokens from bearer semantics (`Authorization: Bearer`) to proof-of-possession (**DPoP RFC 9449** `Authorization: DPoP <token>` + `DPoP: <proof_jwt>`) so exfiltrated tokens cannot be replayed.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "For internal service-to-service communication in Kubernetes, we just configure OAuth 2.0 Client Credentials with a `CLIENT_SECRET` environment variable in each Deployment YAML. What's the problem with that?"
* **Junior/Mid Answer:** "Environment variables are fine as long as you put them in Kubernetes Secrets instead of ConfigMaps."
* **Principal Rebuttal:** "Static shared `CLIENT_SECRET` strings in environment variables violate Zero-Trust workload identity in three ways:
  1. **Secret Sprawl & Exfiltration**: Any heap dump, `/proc/self/environ` read, or misconfigured logging agent leaks a long-lived credential that works from outside the cluster if the IdP is reachable.
  2. **Rotation Downtime**: Rotating static secrets across 200 microservices requires coordinated config rollouts.
  3. **Bearer Replay**: The resulting Client Credentials access token is still a Bearer token.
  - **The Principal Fix**: Eliminate static client secrets entirely using **SPIFFE/SPIRE mTLS X.509 SVIDs** or **Kubernetes Projected ServiceAccount Token Volume Mounts** (`private_key_jwt` / OIDC Workload Identity Federation) with 1-hour auto-rotating lifetimes bound to the pod's cryptographic identity."

#### Trap 2: "We use Token Introspection (RFC 7662) on every microservice request so we get instant token revocation. At 25,000 RPS, our Auth Server became a single point of failure and crashed. How do you fix this without losing revocation?"
* **Junior/Mid Answer:** "Scale up the Auth Server database or switch to stateless JWTs with 15-minute expiration."
* **Principal Rebuttal:** "Calling `/oauth/introspect` synchronously from every downstream microservice creates an **$O(N \times M)$ Synchronous Fan-Out Amplification Storm**: 1 external user request that fans out across 6 internal microservices triggers **6 synchronous HTTP calls** to the Auth Server ($25{,}000\text{ RPS} \times 6 = 150{,}000\text{ introspection RPS}$)!
  - **The Principal Fix (Phantom Token + Edge Introspection Cache)**:
    1. Perform Token Introspection **exactly once** at the Edge API Gateway—never inside internal microservices.
    2. Cache the introspection response (the signed internal JWS) at the API Gateway for a short TTL (e.g., 60 seconds) and invalidate via an event-driven Redis Pub/Sub revocation stream when a token is revoked.
    3. Forward the signed JWS to the 6 internal microservices, which verify the signature locally in $\sim 30\ \mu\text{s}$ with **zero calls** to the Auth Server."

#### Trap 3: "How do you design API keys like Stripe (`sk_live_...`) or GitHub (`ghp_...`) so that leaked keys in public GitHub repos can be detected and revoked automatically in seconds, while keeping DB verification under 1ms?"
* **Junior/Mid Answer:** "Add a `sk_live_` prefix to a UUID and hash it with BCrypt in the database."
* **Principal Rebuttal:** "If you hash a random API key with salted `BCrypt` and store only the hash, **how do you query the database on an incoming request?** You can't run `WHERE api_key_bcrypt = ...` because BCrypt uses a random salt per hash—you would have to scan and run `BCrypt.checkpw()` against every row in the table!
  - **The Principal API Key Format**: `<prefix>_<key_id>_<random_secret>_<crc32_checksum>` (e.g., `sk_live_01HQ8X9_7f9a8b2c..._a1b2c3d4`):
    1. **Prefix + CRC32 Checksum**: Secret scanners (GitHub Secret Scanning / Gitleaks) verify the 8-char CRC32 checksum offline in microseconds to eliminate regex false positives and call your revocation webhook automatically.
    2. **Split Lookup vs. High-Entropy Secret**: Because the secret has 256 bits of cryptographic entropy (immune to brute-force dictionary attacks, unlike human passwords), compute a fast **`HMAC-SHA256(server_pepper, full_key)`** for an indexed $O(1)$ B-Tree lookup, and verify the digest in constant time using `MessageDigest.isEqual()`."

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **API Key Verification** | "Compare `providedKey.equals(dbKey)` or use BCrypt." | "Use structured keys (`prefix_id_secret_crc32`), store `HMAC-SHA256(pepper, key)` in DB, and compare digests with constant-time `MessageDigest.isEqual()` to prevent timing side-channels." |
| **Token Introspection vs. JWT** | "Introspection is stateful; JWT is stateless." | "Combine both via the **Phantom Token Pattern**: Edge API Gateway introspects/caches opaque tokens and translates them into audience-scoped `ES256` JWS tokens for internal microservices." |
| **Bearer Token Theft** | "Use HTTPS so tokens aren't sniffed on the wire." | "HTTPS only protects data in transit, not token theft from endpoints/logs. Enforce **DPoP (RFC 9449)** or **mTLS (RFC 8705)** sender-constrained tokens with `cnf` thumbprint binding." |
| **Microservice M2M Auth** | "Share an API key or `client_secret` between services." | "Deploy **SPIFFE/SPIRE** to issue short-lived X.509 SVIDs over a local Unix domain socket for automatic mTLS, combined with **RFC 8693 Token Exchange** for user delegation." |

### Related Deep-Dive Guides
- [JWT, OAuth 2.1 & OpenID Connect (OIDC) — Principal Architecture Deep Dive](../security/jwt-oauth2-oidc-deep-dive.md)
- [Authentication & Authorization](../security/01-authentication-authorization.md)
- [JWT Multi-Device Session Management & Invalidation](../security/refresh-token-security-invalidation.md)

