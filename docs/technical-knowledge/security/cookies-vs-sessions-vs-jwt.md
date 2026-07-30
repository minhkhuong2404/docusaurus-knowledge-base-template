---
id: cookies-vs-sessions-vs-jwt

title: "Cookies vs Sessions vs JWT"
sidebar_label: "Cookies, Sessions & JWT"
sidebar_position: 1
description: "Deep-dive into web authentication mechanisms — Cookies, Sessions, and JWTs — for senior engineering interviews and production systems."
tags:
  - security
  - authentication
  - jwt
  - spring
  - backend
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CookieSessionStateDiagram from '@site/src/components/CookieSessionStateDiagram';
import JwtClientStateDiagram from '@site/src/components/JwtClientStateDiagram';
import JwtAnatomyDiagram from '@site/src/components/JwtAnatomyDiagram';
import RefreshTokenRotationDiagram from '@site/src/components/RefreshTokenRotationDiagram';


# Cookies vs Sessions vs JWT

Authentication answers one question: **"Who are you?"**

This guide goes beyond the basics — covering internals, attack vectors, advanced patterns, and Spring Security implementation details needed for senior-level interviews and production-grade systems.

---

## Table of contents

- [How each mechanism works](#how-each-mechanism-works)
- [JWT anatomy](#jwt-anatomy)
- [Attack vectors](#attack-vectors)
- [Advanced patterns](#advanced-patterns)
- [Spring Security implementation](#spring-security-implementation)
- [Decision matrix](#decision-matrix)
- [Senior interview Q&A](#senior-interview-qa)

---

## How each mechanism works

### Cookie + Session — server-side state

<CookieSessionStateDiagram />

:::info[Key insight]
When developers say "cookie-based auth", they almost always mean session-based auth under the hood. The cookie is just a transport for the opaque session ID — the real state lives on the server.
:::

**Advantages**
- Instant revocation: delete the session, the user is out immediately
- Sensitive data never leaves the server
- Mature browser and framework support

**Trade-offs**
- Stateful: in distributed systems, every node must reach the same session store
- The session store becomes a bottleneck and a potential single point of failure
- Works best for monoliths or load-balanced systems with sticky sessions or shared Redis

---

### JWT — client-side state, server-verified

<JwtClientStateDiagram />

:::warning[Core trade-off]
A JWT is valid until it expires, regardless of logout. You cannot "un-sign" a token without additional infrastructure (blacklist, short TTL, refresh rotation). This is the most common senior interview topic around JWTs.
:::

**Advantages**
- Stateless: any server can validate any token without shared storage
- Natural fit for microservices and horizontally scaled systems
- Self-contained: claims carry identity and authorization context
- Portable across services and third-party systems

**Trade-offs**
- Revocation requires additional infrastructure (blacklist or short TTL + refresh)
- Token size grows with claims — increases every request's payload
- Sensitive data exposure risk if stored in `localStorage`

---

## JWT anatomy

A JWT has three base64url-encoded parts separated by dots:

<JwtAnatomyDiagram />

### Header

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

### Payload (standard + custom claims)

```json
{
  "sub": "user-uuid-123",
  "iss": "https://auth.myapp.com",
  "aud": "https://api.myapp.com",
  "iat": 1716000000,
  "exp": 1716003600,
  "jti": "unique-token-id-for-blacklisting",
  "roles": ["ROLE_ADMIN"],
  "email": "alice@myapp.com"
}
```

| Claim   | Type                | Purpose                                  |
| ------- | ------------------- | ---------------------------------------- |
| `sub`   | Standard (RFC 7519) | Subject — the user identifier            |
| `iss`   | Standard            | Issuer — who generated the token         |
| `aud`   | Standard            | Audience — intended recipient service    |
| `iat`   | Standard            | Issued at (Unix timestamp)               |
| `exp`   | Standard            | Expiry (Unix timestamp)                  |
| `jti`   | Standard            | JWT ID — unique ID used for blacklisting |
| `roles` | Custom              | Authorization claims                     |

:::danger[Never put sensitive data in the payload]
JWT is **signed**, not **encrypted** (unless you're using JWE). The payload is trivially base64-decoded by anyone who has the token. Never store passwords, PII, secrets, or billing data in claims.
:::

### Signature

```
// RS256 example
RSASSA-PKCS1-v1_5-SHA256(
  base64url(header) + "." + base64url(payload),
  privateKey
)
```

### HS256 vs RS256

<Tabs>
<TabItem value="hs256" label="HS256 (symmetric)">

```java
// Single shared secret — all services use the same key
SecretKey key = Keys.hmacShaKeyFor(
    Decoders.BASE64.decode(secretBase64)
);

String token = Jwts.builder()
    .subject(userId)
    .issuedAt(new Date())
    .expiration(new Date(System.currentTimeMillis() + 900_000))
    .signWith(key)
    .compact();
```

**When to use:** Monolith or tight-trust service mesh where all services are equally trusted.

**Risk:** Any service with the secret can forge tokens. One compromised service = all tokens compromised.

</TabItem>
<TabItem value="rs256" label="RS256 (asymmetric)">

```java
// Auth server signs with private key
// All other services verify with public key only
PrivateKey privateKey = loadPrivateKey();

String token = Jwts.builder()
    .subject(userId)
    .issuedAt(new Date())
    .expiration(new Date(System.currentTimeMillis() + 900_000))
    .signWith(privateKey, Jwts.SIG.RS256)
    .compact();

// Downstream service verification — only needs public key
PublicKey publicKey = loadPublicKey(); // via JWKS endpoint
Jws<Claims> claims = Jwts.parser()
    .verifyWith(publicKey)
    .build()
    .parseSignedClaims(token);
```

**When to use:** Microservices, third-party auth, any multi-service architecture.

**Benefit:** Services verify tokens but cannot forge them. Distribute the JWKS endpoint — not the private key. Rotate the private key without coordinating with all consumers.

</TabItem>
</Tabs>

---

## Attack vectors

### Cookie / Session attacks

#### CSRF (Cross-Site Request Forgery)

**Risk level:** High

A malicious site tricks the victim's browser into sending an authenticated cookie to your API without the user's knowledge.

**Mitigations:**
- `SameSite=Strict` or `SameSite=Lax` on the session cookie (modern default)
- CSRF double-submit token (a random value in both cookie and request header)
- Custom header check (`X-Requested-With`) — browsers block cross-origin custom headers by default

#### Session fixation

**Risk level:** High

An attacker pre-plants a known session ID (e.g., via URL parameter). After the victim logs in, the attacker inherits the authenticated session.

**Mitigation:** Always regenerate the session ID on successful authentication. Spring Security does this by default via `sessionFixation().migrateSession()`.

#### Session hijacking

**Risk level:** Medium

Cookie stolen via network sniffing (non-HTTPS) or XSS.

**Mitigations:**
- Always use HTTPS (TLS everywhere)
- `HttpOnly` flag prevents JavaScript access
- `Secure` flag ensures cookie never travels over plain HTTP
- Short session TTL with re-authentication for sensitive actions

---

### JWT attacks

#### `alg:none` attack

**Risk level:** Critical

Attacker sets `"alg": "none"` in the header and strips the signature. Naive verifiers that read the algorithm from the token — rather than enforcing it server-side — skip verification entirely.

```json
// Forged header
{ "alg": "none", "typ": "JWT" }
```

**Mitigation:** Always explicitly whitelist allowed algorithms server-side. Never accept `alg:none`.

```java
// JJWT — pin algorithm, never accept token's declared alg
Jwts.parser()
    .verifyWith(publicKey)
    .require("alg", "RS256") // explicit
    .build()
    .parseSignedClaims(token);
```

#### Algorithm confusion (RS256 → HS256)

**Risk level:** Critical

If a server accepts both RS256 and HS256 on the same endpoint, an attacker sets `"alg": "HS256"` and signs the token using the RS256 public key as the HMAC secret. The server — thinking it's HS256 — successfully verifies against its own public key.

**Mitigation:** Strictly pin one algorithm per endpoint. Never accept multiple algorithms interchangeably.

#### Token theft (localStorage)

**Risk level:** High

Any XSS vulnerability exposes all tokens stored in `localStorage`. There is no browser protection.

**Mitigation:** Store JWTs in `HttpOnly` cookies. Now CSRF is the risk — combine with `SameSite=Strict` and a CSRF token if needed.

:::tip[The localStorage vs cookie debate]
There is no universally safe client-side storage for JWTs. `localStorage` = XSS risk. Cookie = CSRF risk. The practical answer: **HttpOnly cookie + SameSite=Strict** eliminates the most dangerous attack surface (XSS-based token theft is catastrophic and silent; CSRF is detectable and mitigable).
:::

#### Token replay after logout

**Risk level:** Medium

A stolen JWT remains cryptographically valid until `exp`. Logout on the client means nothing to the server.

**Mitigations (in order of preference):**
1. Short-lived access tokens (5–15 min) + refresh token rotation
2. `jti`-based blacklist in Redis (TTL = token's remaining lifetime)
3. Bloom filter over revoked `jti` values (space-efficient, probabilistic — near-zero false negatives with tuning)

#### Weak HMAC secret (HS256)

**Risk level:** Medium

Weak secrets are vulnerable to offline brute-force once an attacker captures a token.

**Mitigation:** Use a minimum 256-bit cryptographically random secret. Consider switching to RS256 for production systems.

---

## Advanced patterns

### Refresh token rotation

The industry-standard pattern for balancing statelessness with revocability.

:::tip[Deep-Dive Guide]
For a full deep-dive into long-lived refresh token security, account compromise incident response, and single-device vs multi-device password reset invalidation strategies, see the [Refresh Token Security & Multi-Device Session Invalidation](./refresh-token-security-invalidation.md) guide.
:::

<RefreshTokenRotationDiagram />

### Token family / reuse detection (RFC 6749)

```sql
-- Refresh token store schema
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL,   -- SHA-256 of the actual token
    family_id  UUID NOT NULL,          -- shared by all tokens in a rotation chain
    parent_id  UUID REFERENCES refresh_tokens(id),
    used       BOOLEAN DEFAULT FALSE,
    user_id    UUID NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reuse detected: revoke all tokens in the family
UPDATE refresh_tokens
SET used = TRUE
WHERE family_id = :compromised_family_id;
```

```java
@Service
public class RefreshTokenService {

    public TokenPair rotate(String incomingToken) {
        RefreshToken stored = repo.findByTokenHash(hash(incomingToken))
            .orElseThrow(() -> new InvalidTokenException("Unknown token"));

        if (stored.isUsed()) {
            // Reuse detected — revoke entire family
            repo.revokeFamily(stored.getFamilyId());
            throw new TokenReuseException("Refresh token reuse detected");
        }

        stored.setUsed(true);
        repo.save(stored);

        // Issue new pair under same family
        String newRefresh = generateSecureToken();
        repo.save(RefreshToken.builder()
            .tokenHash(hash(newRefresh))
            .familyId(stored.getFamilyId())
            .parentId(stored.getId())
            .userId(stored.getUserId())
            .expiresAt(Instant.now().plus(30, DAYS))
            .build());

        return new TokenPair(jwtService.generate(stored.getUserId()), newRefresh);
    }
}
```

### Bloom filter for large-scale revocation

When a full Redis blacklist creates too much latency or memory pressure, a Bloom filter stores revoked `jti` values with near-zero false negatives and minimal memory (a 1M-entry filter with 1% false positive rate uses ~1.2 MB).

```java
// Using Guava BloomFilter
BloomFilter<String> revokedTokens = BloomFilter.create(
    Funnels.stringFunnel(StandardCharsets.UTF_8),
    1_000_000,   // expected insertions
    0.001        // desired false positive probability (0.1%)
);

// On revocation
revokedTokens.put(jti);

// On request validation
if (revokedTokens.mightContain(jti)) {
    // Check Redis for confirmation (bloom filter may false-positive)
    return redisBlacklist.contains(jti);
}
```

:::note[Trade-off]
Adding a blacklist (Redis or Bloom filter) reintroduces state. Acknowledge this openly in interviews — a fully stateless JWT system cannot support immediate revocation. The design choice depends on the business requirement.
:::

### Silent refresh (SPA pattern)

```javascript
// Run in a background interval, ~1 minute before token expiry
async function silentRefresh(expiresAt) {
  const refreshAt = expiresAt - 60_000; // 60s before expiry
  const delay = refreshAt - Date.now();

  setTimeout(async () => {
    if (!userIsActive()) return; // No activity → let session expire naturally
    const { accessToken } = await api.post('/auth/refresh');
    scheduleRefresh(decodeExp(accessToken));
  }, delay);
}
```

---

## Spring Security implementation

### Session management

```java
@Configuration
@EnableWebSecurity
public class SessionSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(1)               // one active session per user
                .maxSessionsPreventsLogin(false)  // kick old session on new login
                .sessionRegistry(sessionRegistry())
            )
            .sessionFixation(fixation -> fixation
                .migrateSession() // default: regenerate ID, copy attributes
                // .newSession() — stricter: new ID, no attribute copy
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            );
        return http.build();
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }
}
```

**`SessionCreationPolicy` options:**

| Policy        | Behavior                        | Use case                 |
| ------------- | ------------------------------- | ------------------------ |
| `IF_REQUIRED` | Create session lazily (default) | Server-rendered web apps |
| `STATELESS`   | Never create or use session     | Pure JWT REST APIs       |
| `ALWAYS`      | Create eagerly                  | Avoid — wasteful         |
| `NEVER`       | Use if exists, never create     | Partial JWT migration    |

### Distributed sessions with Spring Session + Redis

```groovy
// build.gradle
implementation 'org.springframework.session:spring-session-data-redis'
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

```yaml
# application.yml
spring:
  session:
    store-type: redis
    timeout: 30m
    redis:
      namespace: "myapp:session"
  data:
    redis:
      host: redis-cluster
      port: 6379
      password: ${REDIS_PASSWORD}
```

No application code changes required — Spring Session transparently replaces the `HttpSession` implementation. All pods in the cluster share session state; sticky sessions are no longer needed.

### JWT filter chain

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtService.validateAndParse(token);

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    claims.getSubject(),
                    null,
                    extractAuthorities(claims)
                );
            auth.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (ExpiredJwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token expired");
            return;
        } catch (JwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> extractAuthorities(Claims claims) {
        List<String> roles = claims.get("roles", List.class);
        if (roles == null) return List.of();
        return roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }
}
```

```java
// Register filter in SecurityFilterChain
@Bean
public SecurityFilterChain jwtFilterChain(HttpSecurity http, JwtAuthFilter jwtFilter)
        throws Exception {
    http
        .sessionManagement(s -> s
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .csrf(AbstractHttpConfigurer::disable) // CSRF irrelevant for stateless Bearer tokens
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**").permitAll()
            .anyRequest().authenticated()
        );
    return http.build();
}
```

### JWT service with JJWT

```java
@Service
public class JwtService {

    @Value("${app.jwt.private-key}")
    private RSAPrivateKey privateKey;

    @Value("${app.jwt.public-key}")
    private RSAPublicKey publicKey;

    private static final Duration ACCESS_TTL = Duration.ofMinutes(15);

    public String generate(String userId, List<String> roles) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId)
            .issuer("https://auth.myapp.com")
            .audience().add("https://api.myapp.com").and()
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(ACCESS_TTL)))
            .id(UUID.randomUUID().toString())  // jti — unique per token
            .claim("roles", roles)
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
    }

    public Claims validateAndParse(String token) {
        // JJWT enforces algorithm from key type — alg:none rejected automatically
        return Jwts.parser()
            .verifyWith(publicKey)
            .requireIssuer("https://auth.myapp.com")
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

---

## Decision matrix

| Criterion             | Session + Cookie      | JWT (HttpOnly cookie)    | JWT (localStorage)    |
| --------------------- | --------------------- | ------------------------ | --------------------- |
| **Revocation**        | Instant               | Blacklist or short TTL   | Very hard             |
| **Scalability**       | Needs shared store    | Stateless                | Stateless             |
| **CSRF risk**         | High — must mitigate  | Medium — SameSite=Strict | None                  |
| **XSS risk**          | Low — HttpOnly        | Low — HttpOnly           | Critical              |
| **Microservices fit** | Poor — shared Redis   | Excellent                | Excellent             |
| **GDPR / purge**      | Easy — delete session | Requires token expiry    | Requires token expiry |
| **Mobile / SPA**      | Cookie sharing issues | Good                     | XSS exposure          |
| **Payload overhead**  | Tiny (ID only)        | Grows with claims        | Grows with claims     |

### When to choose what

- **Session + Cookie:** Server-rendered web app, monolith, high-security requirements with instant revocation, compliance-heavy domain (fintech, healthcare, government)
- **JWT in HttpOnly cookie:** SPA or mobile with a dedicated auth service, microservices needing cross-service identity without a shared session store
- **JWT in localStorage:** Avoid in production unless the app contains no sensitive data and no XSS surface — rarely justified
- **Hybrid (Session for web + JWT for API/mobile):** Common production pattern — one auth server, one identity, two delivery mechanisms

---

## Interview Questions

### How do you handle JWT revocation in a stateless system?

Short-lived access tokens (5–15 min) + refresh token rotation eliminates most revocation needs in practice. For use cases requiring immediate logout (security incident, role change), maintain a `jti`-keyed blacklist in Redis with TTL equal to the token's remaining lifetime. For large-scale systems, a Bloom filter reduces the per-request Redis lookup to near-zero with tunable false positive rates.

The honest senior answer acknowledges the trade-off: the moment you add a blacklist, you've reintroduced state. Whether that's acceptable depends on the business requirement for immediate revocation versus the operational cost.

---

### You're moving from a monolith to microservices. How does authentication change?

Sessions require a centralized store accessible by all services — a bottleneck and single point of failure. JWT shifts to a distributed verify-only model: each service holds the public key (RS256) or shared secret, validates tokens independently, with no inter-service network call needed.

An API Gateway pattern centralizes JWT validation: the gateway verifies the token once, then forwards a pre-verified identity header (`X-User-Id`, `X-Roles`) to downstream services. Downstream services trust the gateway and skip re-verification.

Discuss service-to-service auth separately: mTLS or short-lived service tokens issued by a service mesh (Istio, Linkerd) handle the machine-identity problem. User identity (JWT) and service identity (mTLS) are orthogonal concerns.

---

### What's the difference between authentication and authorization, and how do JWTs handle both?

Authentication = verifying identity (who are you?). Authorization = verifying permission (what can you do?). JWTs carry both: `sub` identifies the user; custom claims like `roles` or `scope` carry authorization context.

The risk: embedding roles in the JWT means a role change (demotion, suspension) doesn't propagate until the token expires. For high-security operations (admin actions, billing), re-fetch live permissions on each request even if you trust the JWT for identity. Short TTL reduces the window; a short-lived token with a 5-minute TTL means maximum 5-minute exposure after a role change.

---

### Explain the `alg:none` and algorithm confusion attacks.

**`alg:none`:** An attacker crafts a header with `"alg": "none"` and removes the signature. Verifiers that blindly trust the declared algorithm skip verification. Fix: whitelist algorithms explicitly on the server; never consult the token for which algorithm to use.

**Algorithm confusion:** If a server accepts both RS256 and HS256 on the same path, an attacker sets `"alg": "HS256"` and signs the token using the RS256 public key as the HMAC secret. The server — thinking it's HS256 — verifies against its own public key and accepts a forged token. Fix: never accept multiple algorithms interchangeably on a single endpoint; pin algorithm per key type.

---

### How does Spring Security prevent session fixation?

Spring Security calls `sessionFixation().migrateSession()` by default on successful authentication. This creates a new session, copies attributes from the old session, and invalidates the old session ID. A new `JSESSIONID` cookie is sent in the response.

`newSession()` is stricter: creates a fresh session without copying attributes. More secure but may break functionality that depends on pre-login session state. Choose `newSession()` when you control all session attribute initialization post-login.

---

### How would you design auth for a system serving both web browsers and mobile apps?

**Web browsers:** HttpOnly, `SameSite=Strict` cookies (session or JWT-in-cookie) — resist CSRF and XSS with no app-level storage concern.

**Mobile clients:** OAuth 2.0 with PKCE flow. The app receives JWT access tokens + refresh tokens stored in the device's secure enclave (iOS Keychain, Android Keystore — never in-memory or shared preferences). No client secret required (PKCE replaces it with a code challenge).

A single authorization server (Spring Authorization Server, Keycloak, Auth0) issues tokens for both client types. The resource server validates tokens identically regardless of origin. The difference is purely in how tokens are delivered and stored on the client.
