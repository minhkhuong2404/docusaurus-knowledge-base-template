---
id: authentication-authorization
title: Authentication & Authorization
sidebar_label: AuthN & AuthZ
description: Deep dive into authentication and authorization patterns including sessions, JWT, OAuth 2.0, OIDC, RBAC, ABAC, MFA, passwordless, passkeys, and Spring Security implementation.
tags: [security, authentication, authorization, jwt, oauth2, oidc, rbac, abac, mfa, spring-security, session, passkeys]
---

# Authentication & Authorization

import OAuthPkceFlowDiagram from '@site/src/components/OAuthPkceFlowDiagram';
import PasskeysFlowDiagram from '@site/src/components/PasskeysFlowDiagram';
import AccessTokenPatternDiagram from '@site/src/components/AccessTokenPatternDiagram';
import OidcFlowDiagram from '@site/src/components/OidcFlowDiagram';



> **Authentication (AuthN):** *Who are you?*
> **Authorization (AuthZ):** *What are you allowed to do?*

These are **separate concerns**. A user can be authenticated (valid JWT) but not authorized (403 on a specific resource).

| HTTP Status | Meaning |
|---|---|
| `401 Unauthorized` | Not authenticated — identity not established |
| `403 Forbidden` | Authenticated but not authorized for this resource |

---

## Session-Based Authentication

```
1. User submits credentials → Server validates
2. Server creates session in store (Redis/DB)
3. Server sends Set-Cookie: SESSIONID=abc123 (HttpOnly, Secure, SameSite)
4. Client sends cookie on every request automatically
5. Server looks up session in store → extracts user context
```

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            .sessionFixation().changeSessionId()   // Prevent session fixation
            .maximumSessions(1)
            .maxSessionsPreventsLogin(false)        // New login kicks old session
        )
        .rememberMe(remember -> remember
            .tokenRepository(persistentTokenRepository())
            .tokenValiditySeconds(7 * 24 * 3600)   // 7 days
        )
        .build();
}
```

**Pros:** Easy to revoke (delete session). Full server control over expiry.
**Cons:** Horizontal scaling requires shared session store (Redis). Stateful.

---

## Token-Based Authentication (JWT)

```
1. User submits credentials
2. Server validates → issues JWT (signed with private key)
3. Client stores JWT (memory > httpOnly cookie > localStorage)
4. Client sends: Authorization: Bearer <jwt> on every request
5. Server validates signature — no DB lookup needed (stateless)
```

### JWT Structure

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIn0
.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyLTEyMzQ1In0
.SIGNATURE
```

Each section is `Base64Url` encoded:

```json
// HEADER
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-2024-01"    // ← Key ID used to look up public key in JWKS
}

// PAYLOAD (claims)
{
  "iss": "https://auth.example.com",   // Issuer
  "sub": "user-12345",                 // Subject
  "aud": "https://api.example.com",    // Audience
  "exp": 1700003600,                   // Expiration (Unix timestamp)
  "iat": 1700000000,                   // Issued at
  "jti": "unique-token-id",            // JWT ID (for revocation)
  "roles": ["ROLE_USER"],
  "email": "alice@example.com"
}

// SIGNATURE — computed as:
// Base64Url(RS256_sign(privateKey, Base64Url(header) + "." + Base64Url(payload)))
```

:::note[The payload is NOT encrypted]
JWT payload is only Base64Url encoded — anyone can decode it. Never put passwords, secrets, or sensitive PII in JWT payload unless using **JWE** (JSON Web Encryption).
:::

### Signing Algorithms

| Algorithm | Type | Key | Recommended Use |
|---|---|---|---|
| `HS256` | Symmetric HMAC | Shared secret | Single-service only; secret must not leak |
| `RS256` | Asymmetric RSA | Private + public key pair | **Multi-service; preferred** |
| `ES256` | Asymmetric ECDSA | Private + public key pair | Better performance than RSA, same security |

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(jwtDecoder())
                    .jwtAuthenticationConverter(jwtAuthConverter())
                )
            )
            .build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // Automatically fetches public keys from JWKS endpoint
        // Handles kid lookup and key rotation transparently
        return JwtDecoders.fromIssuerLocation("https://auth.example.com");
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("roles");
        converter.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(converter);
        return jwtConverter;
    }
}
```

### Access Token + Refresh Token Pattern

<AccessTokenPatternDiagram />

```java
@PostMapping("/auth/refresh")
public TokenResponse refresh(@RequestBody RefreshRequest req) {
    RefreshToken token = refreshTokenRepository
        .findByToken(req.getRefreshToken())
        .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

    if (token.isExpired()) {
        refreshTokenRepository.delete(token);
        throw new InvalidTokenException("Refresh token expired");
    }

    // ROTATE: issue new refresh token, invalidate old one
    // If old token is used again → theft detected → lock account
    refreshTokenRepository.delete(token);
    String newRefreshToken = UUID.randomUUID().toString();
    refreshTokenRepository.save(new RefreshToken(token.getUserId(), newRefreshToken,
        Instant.now().plus(30, ChronoUnit.DAYS)));

    return new TokenResponse(
        jwtService.generateAccessToken(token.getUserId()),
        newRefreshToken
    );
}
```

---

## OAuth 2.0 Flows

### Authorization Code Flow + PKCE (Most Secure — Web & Mobile)

<OAuthPkceFlowDiagram />

**PKCE protects against:** Authorization code interception — even if the code is stolen, attacker cannot exchange it without the `code_verifier`.

### Client Credentials Flow (Machine-to-Machine)

```java
// Service A authenticates as itself (no user involved)
POST /token
  grant_type=client_credentials
  &client_id=SERVICE_A_ID
  &client_secret=SERVICE_A_SECRET
  &scope=read:orders

// Response: { access_token, expires_in }
// Service A → GET /orders (Authorization: Bearer access_token)
```

---

## OpenID Connect (OIDC)

<OidcFlowDiagram />

**Rule:** Use `access_token` to call APIs. Use `id_token` to establish user identity in your app.

---

## Multi-Factor Authentication (MFA)

| Factor | Type | Examples |
|---|---|---|
| Something you know | Knowledge | Password, PIN |
| Something you have | Possession | TOTP app, hardware key (YubiKey), SMS OTP |
| Something you are | Inherence | Fingerprint, Face ID |

### TOTP (RFC 6238 — Google Authenticator)

```
Secret key shared during setup (shown as QR code)
OTP = HMAC-SHA1(secret, floor(Unix_timestamp / 30)) truncated to 6 digits
Valid for 30-second window (±1 window tolerance for clock skew)
```

```java
@Service
public class TotpService {
    private static final int WINDOW = 1;

    public String generateSecret() {
        byte[] buffer = new byte[20];
        new SecureRandom().nextBytes(buffer);
        return Base32.encode(buffer);
    }

    public boolean verifyCode(String secret, int userCode) {
        long currentStep = Instant.now().getEpochSecond() / 30;
        for (int i = -WINDOW; i <= WINDOW; i++) {
            if (calculateTotp(secret, currentStep + i) == userCode) return true;
        }
        return false;
    }

    private int calculateTotp(String secret, long step) {
        byte[] key = Base32.decode(secret);
        byte[] msg = ByteBuffer.allocate(8).putLong(step).array();
        byte[] hash = new HmacUtils(HmacAlgorithms.HMAC_SHA_1, key).hmac(msg);
        int offset = hash[hash.length - 1] & 0x0f;
        return ((hash[offset] & 0x7f) << 24
            | (hash[offset+1] & 0xff) << 16
            | (hash[offset+2] & 0xff) << 8
            | (hash[offset+3] & 0xff)) % 1_000_000;
    }
}
```

### Passkeys (WebAuthn / FIDO2)

The modern passwordless standard — phishing-resistant.

<PasskeysFlowDiagram />

---

## Authorization Models

### RBAC (Role-Based Access Control)

```
User → Role(s) → Permission(s)

Roles: ADMIN, MANAGER, USER, GUEST
```

```java
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long userId) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public List<Order> getAllOrders() { ... }

// Ownership check inline
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public UserProfile getProfile(Long userId) { ... }
```

### ABAC (Attribute-Based Access Control)

```
Policy: Allow if:
  user.department == resource.department
  AND user.clearanceLevel >= resource.sensitivityLevel
  AND environment.time between 09:00 and 18:00
```

```java
public class DocumentPermissionEvaluator implements PermissionEvaluator {
    @Override
    public boolean hasPermission(Authentication auth, Object target, Object permission) {
        if (target instanceof Document doc) {
            UserDetails user = (UserDetails) auth.getPrincipal();
            return switch ((String) permission) {
                case "READ" -> doc.getDepartment().equals(getUserDept(user))
                               || hasRole(user, "ADMIN");
                case "EDIT" -> doc.getOwnerId().equals(getUserId(user))
                               || hasRole(user, "ADMIN");
                case "DELETE" -> hasRole(user, "ADMIN");
                default -> false;
            };
        }
        return false;
    }
}

@PreAuthorize("hasPermission(#document, 'EDIT')")
public void updateDocument(Document document) { ... }
```

---

## Secure Cookie Flags

| Flag | Effect |
|---|---|
| `HttpOnly` | JavaScript **cannot** access cookie — XSS protection |
| `Secure` | Cookie only sent over HTTPS |
| `SameSite=Strict` | Cookie not sent on **any** cross-site request — strongest CSRF protection |
| `SameSite=Lax` | Cookie not sent on cross-site POST — sufficient for most apps |
| `SameSite=None; Secure` | Cookie sent cross-site — required for embedded/third-party apps |

---

## Password Storage

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // Cost factor 12 ≈ 300ms per hash
}
```

| Algorithm | Status | Notes |
|---|---|---|
| MD5, SHA-1 | ❌ **Broken** | Reversible via rainbow tables |
| SHA-256 (unsalted) | ❌ **Weak** | GPU-crackable |
| BCrypt | ✅ Recommended | Adaptive cost, built-in salt |
| Argon2id | ✅ **Best** | Memory-hard, GPU-resistant |
| PBKDF2 | ✅ Acceptable | NIST-approved, FIPS contexts |

---

## Interview Questions

**Q1: What is the difference between authentication and authorization? What HTTP codes represent each failure?**

> **Authentication (AuthN)** is verifying *who* a user is (identity check). Examples: entering passwords, validating TOTP codes, or scanning biometrics. If AuthN fails, the server returns `401 Unauthorized` (identity not established).
>
> **Authorization (AuthZ)** is verifying *what* the user is allowed to do (permission check). Examples: verifying if a user has `ROLE_ADMIN` or checking if they own a resource. If AuthZ fails, the server returns `403 Forbidden` (identity is proven, but access to the resource is blocked).

---

**Q2: What are the pros and cons of JWT vs session-based authentication?**

> **Session-Based Authentication (Stateful):**
> * **Pros:** Instant revocation. If a user logs out or their account is compromised, the server deletes the session in Redis/DB, instantly invalidating future requests.
> * **Cons:** Scaling bottlenecks. Requires a shared session store (like Redis) for clustered setups, introducing network latency and database lookups.
>
> **JWT-Based Authentication (Stateless):**
> * **Pros:** Decoupled scalability. Downstream resource servers verify the token signature locally using the public key (e.g. via JWKS), eliminating database lookups.
> * **Cons:** Hard to revoke. Once signed, a JWT is valid until its `exp` claim expires unless a complex JTI revocation list (like a Redis blocklist) is built, which defeats the stateless benefit.

---

**Q3: Explain the OAuth 2.0 Authorization Code flow with PKCE. What does PKCE protect against?**

> **Flow Mechanics:**
> 1. Client App generates a random `code_verifier` and hashes it to create a `code_challenge`.
> 2. Client redirects the user to `/authorize` passing the `code_challenge` and `code_challenge_method=S256`.
> 3. User authenticates on the IdP and gets redirected back with an `authorization_code`.
> 4. Client sends the `authorization_code` and the original plain `code_verifier` to `/token`.
> 5. The IdP hashes the verifier and validates it against the stored challenge before issuing tokens.
>
> **Protection:** PKCE protects against **Authorization Code Interception** attacks on public clients (SPAs, mobile apps). Without client secrets, an attacker could hijack the auth code from the redirect URL parameter. However, they cannot exchange it for tokens because they do not have the original `code_verifier` needed for validation.

---

**Q4: Why is `RS256` preferred over `HS256` in a microservices architecture?**

> **HS256 (HMAC with SHA-256)** is a symmetric signing algorithm. Both the authentication server and the resource servers must share the *same* secret key. If a single resource server is compromised, the secret leaks, allowing an attacker to sign arbitrary tokens.
>
> **RS256 (RSA Signature with SHA-256)** is asymmetric. The Auth server signs the JWT using its **private key**, while resource servers verify it using the corresponding **public key** (fetched dynamically via JWKS). The private key never leaves the Auth server, limiting the blast radius of a microservice breach.

---

**Q5: How do you implement token revocation with stateless JWTs?**

> Since JWT validation is stateless, you must choose one of these trade-offs to revoke a token:
> 1. **Short Lifetimes:** Keep access token lifetimes extremely short (e.g., 5-15 minutes) and rely on refresh token rotation to validate status.
> 2. **JTI Blocklisting (Redis):** Add a unique `jti` (JWT ID) claim to every token. On logout or suspension, write the `jti` and its remaining expiration time to a Redis cache. Resource servers check this cache during verification. This introduces a fast memory check but keeps database loads low.
> 3. **API Gateway Interceptor:** Let the API Gateway act as a centralized validator, querying a fast database/cache for active user statuses while keeping downstream microservices stateless.

---

**Q6: What is the difference between RBAC, ABAC, and ReBAC?**

> * **RBAC (Role-Based Access Control):** Permissions are assigned to roles (e.g. `ROLE_ADMIN`, `ROLE_USER`) and roles are assigned to users. Simple but lacks context (e.g., cannot check resource ownership out of the box).
> * **ABAC (Attribute-Based Access Control):** Rules evaluate attributes of the user, resource, and environment (e.g. `Allow if user.dept == document.dept AND time < 17:00`). Highly fine-grained but complex to maintain.
> * **ReBAC (Relationship-Based Access Control):** Access is determined by relationships between entities in a graph (e.g. Google Zanzibar). Useful for complex nesting (e.g. "User X can view document because User X is in Team Y, and Team Y owns Folder Z").

---

**Q7: How does TOTP (Google Authenticator) work?**

> TOTP (Time-based One-Time Password, RFC 6238) computes a temporary code using a shared secret and the current time:
> 1. The server and app share a secret key (typically scanned via QR code as Base32).
> 2. Both calculate the current time step: `step = floor(current_unix_timestamp / 30)`.
> 3. Compute the HMAC hash: `hash = HMAC-SHA1(secret, step)`.
> 4. Perform dynamic truncation: extract a 4-byte segment from the hash based on the last byte's value, and compute modulo 1,000,000 to get a 6-digit PIN.
> 5. **Skew Tolerance:** The server verifies the user input code using `step`, `step - 1`, and `step + 1` to account for clock drift.

---

**Q8: What are passkeys and how do they differ from passwords?**

> **Passkeys (FIDO2/WebAuthn)** replace traditional passwords with asymmetric public-key cryptography:
> * **No Shared Secrets:** Unlike passwords, the server never stores or knows a secret. It only stores the user's public key.
> * **Biometric Activation:** The private key is generated and stored securely in the device's hardware Secure Enclave. It can only be accessed via local biometric validation (FaceID, TouchID) or a PIN.
> * **Domain Binding:** Passkeys are cryptographically bound to the specific domain origin (e.g. `app.example.com`). This makes them completely **phishing-resistant**, as a fake website cannot request a passkey registered for the real domain.

---

**Q9: Why should passwords be hashed with BCrypt instead of SHA-256?**

> **SHA-256** is a fast, general-purpose hashing algorithm. It is designed to process data at GB/s speeds. An attacker with a commodity GPU can compute billions of SHA-256 hashes per second, making dictionary/brute-force attacks against stolen database hashes trivial.
>
> **BCrypt** is an adaptive, CPU/memory-hard hashing algorithm. It features:
> * **Built-in Salt:** Prevents rainbow table attacks and pre-computed hashes.
> * **Work Factor (Cost):** Allows adjusting the computation time (e.g., cost factor 12 takes ~300ms). This intentional delay has a negligible impact on users logging in once but makes GPU brute-forcing computationally infeasible.

---

**Q10: What cookie flags are required for secure session management?**

> * **`HttpOnly`:** Prevents client-side JavaScript from reading the cookie (`document.cookie`), mitigating Cross-Site Scripting (XSS) session theft.
> * **`Secure`:** Instructs the browser to only transmit the cookie over encrypted HTTPS connections, preventing interception.
> * **`SameSite`:** Controls cross-site cookie transmission. `SameSite=Lax` is the default (safe for standard navigations), while `SameSite=Strict` blocks the cookie from being sent on any cross-site redirect links, defending against Cross-Site Request Forgery (CSRF).

---

**Q11: What is session fixation and how do you prevent it?**

> **Attack Scenario:** An attacker creates a valid session on the server, gets the session ID, and forces a victim's browser to use it (e.g., via a link containing `?jsessionid=123`). When the victim logs in, the server elevates that same session ID to authenticated status. The attacker can now access the system using the pre-shared session ID.
>
> **Prevention:** Regenerate the session ID on every authentication transition. In Spring Security, this is configured via `.sessionFixation().changeSessionId()`, which keeps the session attributes but generates a new cryptographic ID upon successful login.

---

**Q12: How does the refresh token rotation pattern work and what attack does it detect?**

> **Flow:** Every time the client uses a `refresh_token` to get a new `access_token`, the authorization server invalidates the old `refresh_token` and returns a **new** one.
>
> **Detection:** If the authorization server receives a request with an *already invalidated/used* refresh token, it indicates a replay attack (the token was intercepted or stolen). The server immediately invalidates the entire refresh token family (invalidating the active session) and forces a complete re-login, protecting the user.

---

**Q13: What is the difference between OAuth 2.0 and OIDC?**

> **OAuth 2.0** is an authorization framework. It is designed for delegated access (delegating rights to write or read resources on behalf of a user using an `access_token`). It does not define identity verification.
>
> **OIDC (OpenID Connect)** is an identity layer built on top of OAuth 2.0. It standardizes authentication by introducing the `id_token` (a signed JWT payload detailing who the user is) and a `/userinfo` endpoint.
> * *OAuth 2.0:* Access token for APIs (AuthZ).
> * *OIDC:* ID token for user profiles (AuthN).

---

**Q14: What is the `kid` (Key ID) claim in a JWT header used for?**

> In systems where signing keys are rotated regularly, the Auth Server maintains multiple active public keys in its JWKS (JSON Web Key Set). 
> The `kid` claim in the JWT header tells the validating resource server exactly **which public key** to retrieve from the JWKS list to verify the token signature. Without this claim, the resource server would have to try every key in the set sequentially, impacting performance and authentication latency.
