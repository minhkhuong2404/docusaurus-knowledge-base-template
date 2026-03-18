---
id: authentication-authorization
title: Authentication & Authorization
sidebar_label: AuthN & AuthZ
description: Deep dive into authentication and authorization patterns including sessions, JWT, OAuth 2.0, OIDC, RBAC, ABAC, MFA, passwordless, passkeys, and Spring Security implementation.
tags: [security, authentication, authorization, jwt, oauth2, oidc, rbac, abac, mfa, spring-security, session, passkeys]
---

# Authentication & Authorization

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

:::note The payload is NOT encrypted
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

```
Access Token:  Short-lived (5–15 min)  → sent on every API request
Refresh Token: Long-lived (7–30 days)  → sent ONLY to /auth/refresh

Flow:
  Login → { access_token (15min), refresh_token (30 days) }
  API calls use access_token
  access_token expires → POST /auth/refresh with refresh_token → new access_token
  refresh_token expires → user must log in again
```

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

```
1. App generates: code_verifier (random) + code_challenge = SHA256(code_verifier)

2. Redirect to: GET /authorize
     ?response_type=code
     &client_id=CLIENT_ID
     &redirect_uri=https://app.example.com/callback
     &scope=openid profile email
     &state=RANDOM_CSRF_TOKEN
     &code_challenge=BASE64URL(SHA256(code_verifier))
     &code_challenge_method=S256

3. User authenticates + consents at IdP

4. IdP redirects: https://app.example.com/callback?code=AUTH_CODE&state=SAME_STATE

5. App verifies state, then exchanges code:
   POST /token
     grant_type=authorization_code
     &code=AUTH_CODE
     &code_verifier=ORIGINAL_VERIFIER   ← IdP hashes and compares to challenge
     &redirect_uri=...

6. Response: { access_token, refresh_token, id_token, expires_in }
```

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

```
OAuth 2.0 = Authorization (can access resources)
OIDC      = Authentication (who the user is) — built on top of OAuth 2.0

OIDC adds id_token — a JWT with user identity claims:
{
  "sub":             "user-12345",
  "email":           "alice@example.com",
  "name":            "Alice Smith",
  "email_verified":  true,
  "iat": ..., "exp": ...
}
```

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

```
REGISTRATION:
  1. Server sends challenge
  2. Device creates public/private key pair (per origin)
  3. Private key stays in device secure enclave — NEVER leaves the device
  4. Server stores: public key + credential ID

AUTHENTICATION:
  1. Server sends challenge
  2. User authenticates via biometric/PIN (unlocks secure enclave)
  3. Device signs the challenge with private key
  4. Server verifies signature using stored public key → identity proven

Security properties:
  ✅ Phishing-resistant (keys are origin-bound)
  ✅ No password to steal or reuse
  ✅ No shared secret on server side
  ✅ Biometric stays on device
```

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

1. What is the difference between authentication and authorization? What HTTP codes represent each failure?
2. What are the pros and cons of JWT vs session-based authentication?
3. Explain the OAuth 2.0 Authorization Code flow with PKCE. What does PKCE protect against?
4. Why is `RS256` preferred over `HS256` in a microservices architecture?
5. How do you implement token revocation with stateless JWTs?
6. What is the difference between RBAC, ABAC, and ReBAC?
7. How does TOTP (Google Authenticator) work?
8. What are passkeys and how do they differ from passwords?
9. Why should passwords be hashed with BCrypt instead of SHA-256?
10. What cookie flags are required for secure session management?
11. What is session fixation and how do you prevent it?
12. How does the refresh token rotation pattern work and what attack does it detect?
13. What is the difference between OAuth 2.0 and OIDC?
14. What is the `kid` (Key ID) claim in a JWT header used for?
