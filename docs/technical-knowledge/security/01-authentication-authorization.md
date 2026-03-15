---
id: authentication-authorization
title: Authentication & Authorization
sidebar_label: AuthN & AuthZ
description: Deep dive into authentication and authorization patterns including sessions, JWT, OAuth 2.0, OIDC, RBAC, ABAC, PBAC, MFA, passwordless, and Spring Security implementation.
tags: [security, authentication, authorization, jwt, oauth2, oidc, rbac, abac, mfa, spring-security, session]
---

# Authentication & Authorization

> **Authentication (AuthN):** *Who are you?*  
> **Authorization (AuthZ):** *What are you allowed to do?*

These are separate concerns. A user can be authenticated but not authorized for a specific resource.

---

## Authentication Mechanisms

### Session-Based Authentication

```
1. User submits credentials → Server validates
2. Server creates session in store (Redis/DB)
3. Server sends Set-Cookie: SESSIONID=abc123 (HttpOnly, Secure, SameSite)
4. Client sends cookie on every request
5. Server looks up session in store → extracts user
```

```java
// Spring Security — session configuration
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            .maximumSessions(1)                        // Prevent session sharing
            .maxSessionsPreventsLogin(false)           // Newer login kicks old session
            .sessionRegistry(sessionRegistry())
        )
        .rememberMe(remember -> remember
            .tokenRepository(persistentTokenRepository()) // Persistent "remember me"
            .tokenValiditySeconds(7 * 24 * 3600)
        )
        .build();
}
```

**Pros:** Easy to revoke (delete session). Full server control.  
**Cons:** Horizontal scaling requires shared session store (Redis). Stateful.

---

### Token-Based Authentication (JWT)

```
1. User submits credentials
2. Server validates, issues JWT (signed, not encrypted by default)
3. Client stores JWT (memory > localStorage > cookie)
4. Client sends Authorization: Bearer <jwt> on every request
5. Server validates signature — no DB lookup needed
```

#### JWT Structure
```
Header.Payload.Signature
```
```json
// Header
{ "alg": "RS256", "typ": "JWT", "kid": "key-2024-01" }

// Payload — standard claims
{
  "iss": "https://auth.example.com",        // Issuer
  "sub": "user-12345",                      // Subject
  "aud": "https://api.example.com",         // Audience
  "exp": 1700003600,                        // Expiration
  "iat": 1700000000,                        // Issued at
  "jti": "unique-token-id",                 // JWT ID (for revocation)
  "roles": ["ROLE_USER"],                   // Custom claims
  "email": "alice@example.com"
}
```

#### Signing Algorithms
| Algorithm | Type | Key | Use |
|---|---|---|---|
| HS256 | Symmetric HMAC | Shared secret | Single-service; secret must not leak |
| RS256 | Asymmetric RSA | Private + public key | Multi-service; public key can be distributed |
| ES256 | Asymmetric ECDSA | Private + public key | Better performance than RSA, same security |

```java
// Spring Boot — RS256 JWT resource server
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
        // Fetch JWKS from auth server (e.g., Keycloak, Auth0)
        return JwtDecoders.fromIssuerLocation("https://auth.example.com");
        // OR from local public key:
        // return NimbusJwtDecoder.withPublicKey(loadRsaPublicKey()).build();
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

#### Access Token + Refresh Token Pattern
```
Access Token:  Short-lived (15 min) — sent on every API request
Refresh Token: Long-lived (30 days) — sent only to /auth/refresh endpoint

Flow:
  Login → {access_token (15min), refresh_token (30 days)}
  API calls use access_token
  access_token expires → POST /auth/refresh with refresh_token → new access_token
  refresh_token expires → user must log in again
```

```java
@PostMapping("/auth/refresh")
public TokenResponse refresh(@RequestBody RefreshRequest req) {
    // Validate refresh token from DB (check not revoked)
    RefreshToken token = refreshTokenRepository
        .findByToken(req.getRefreshToken())
        .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

    if (token.isExpired()) {
        refreshTokenRepository.delete(token);
        throw new InvalidTokenException("Refresh token expired");
    }

    // Rotate: issue new refresh token, invalidate old one
    refreshTokenRepository.delete(token);
    String newRefreshToken = UUID.randomUUID().toString();
    refreshTokenRepository.save(new RefreshToken(token.getUserId(), newRefreshToken));

    return new TokenResponse(
        jwtService.generateAccessToken(token.getUserId()),
        newRefreshToken
    );
}
```

---

## OAuth 2.0 Flows

### Authorization Code Flow (Web Apps — Most Secure)
```
1. App redirects to: GET /authorize
     ?response_type=code
     &client_id=CLIENT_ID
     &redirect_uri=https://app.example.com/callback
     &scope=openid profile email
     &state=RANDOM_STRING  ← CSRF protection
     &code_challenge=SHA256(code_verifier)  ← PKCE

2. User authenticates + consents

3. Auth server redirects to:
     https://app.example.com/callback?code=AUTH_CODE&state=...

4. App verifies state, then exchanges code:
   POST /token
     grant_type=authorization_code
     &code=AUTH_CODE
     &code_verifier=VERIFIER  ← PKCE
     &redirect_uri=...

5. Auth server returns:
     { access_token, refresh_token, id_token, expires_in }
```

### PKCE (Proof Key for Code Exchange)
Prevents authorization code interception attacks.
```java
// Generate PKCE pair
String codeVerifier = Base64.getUrlEncoder()
    .encodeToString(new SecureRandom().generateSeed(32));
String codeChallenge = Base64.getUrlEncoder()
    .encodeToString(MessageDigest.getInstance("SHA-256")
        .digest(codeVerifier.getBytes()));
```

### Client Credentials Flow (Machine-to-Machine)
```
Service A → POST /token
  grant_type=client_credentials
  &client_id=SERVICE_A_ID
  &client_secret=SERVICE_A_SECRET
  &scope=read:orders

← { access_token, expires_in }

Service A → GET /orders (Authorization: Bearer access_token)
```

---

## OpenID Connect (OIDC)

OAuth 2.0 + identity layer. Adds `id_token` (JWT with user claims).

```
OAuth 2.0 = Authorization (can access resources)
OIDC      = Authentication (who the user is)

id_token claims:
{
  "sub":   "user-12345",
  "email": "alice@example.com",
  "name":  "Alice Smith",
  "picture": "https://...",
  "email_verified": true,
  "iat": ..., "exp": ...
}
```

---

## Multi-Factor Authentication (MFA)

### Factors
| Factor | Type | Examples |
|---|---|---|
| Something you know | Knowledge | Password, PIN, security question |
| Something you have | Possession | TOTP app, hardware key (YubiKey), SMS OTP |
| Something you are | Inherence | Fingerprint, Face ID |

### TOTP (Time-based One-Time Password — RFC 6238)
```
Secret key shared during setup
OTP = HMAC-SHA1(secret, floor(time / 30))[:6]
Valid for 30-second window (±1 window for clock skew)
```

```java
// Spring Boot TOTP with Google Authenticator
@Service
public class TotpService {
    private static final int WINDOW = 1; // ±1 step tolerance

    public String generateSecret() {
        byte[] buffer = new byte[20];
        new SecureRandom().nextBytes(buffer);
        return Base32.encode(buffer); // Show as QR code to user
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
The modern passwordless standard.
```
Registration:
  1. Server sends challenge
  2. Device creates public/private key pair
  3. Private key stored in device secure enclave (never leaves device)
  4. Server stores public key + credential ID

Authentication:
  1. Server sends challenge
  2. User authenticates via biometric/PIN (unlocks private key)
  3. Device signs challenge with private key
  4. Server verifies signature with stored public key
```

---

## Authorization Models

### RBAC (Role-Based Access Control)
```
User → Role → Permission

Roles: ADMIN, MANAGER, USER, GUEST
Permissions: READ_ALL, WRITE_OWN, DELETE_ALL, MANAGE_USERS
```

```java
// Spring Security method-level RBAC
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long userId) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public List<Order> getAllOrders() { ... }

// Secure based on ownership
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public UserProfile getProfile(Long userId) { ... }
```

### ABAC (Attribute-Based Access Control)
More granular — decisions based on user, resource, environment attributes.

```
POLICY: Allow if:
  user.department == resource.department
  AND user.clearanceLevel >= resource.sensitivityLevel
  AND environment.time between 09:00 and 18:00
```

```java
// Spring Security with custom PermissionEvaluator
@Bean
public PermissionEvaluator permissionEvaluator() {
    return new DocumentPermissionEvaluator();
}

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

// Usage
@PreAuthorize("hasPermission(#document, 'EDIT')")
public void updateDocument(Document document) { ... }
```

### ReBAC (Relationship-Based Access Control)
Used by Google Zanzibar. Access based on object relationships.
```
Can Alice view document D?
  → Is Alice a viewer of D?      → YES → ALLOW
  → Is Alice a viewer of folder containing D?  → Check recursively
  → Is Alice an editor of D?     → YES → ALLOW (editor implies viewer)
```

---

## Session Security

```java
@Configuration
public class SessionSecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.sessionManagement(session -> session
            // Prevent session fixation: create new session after login
            .sessionFixation().changeSessionId()
            // Force HTTPS for session cookie
        );
        http.headers(headers -> headers
            // Prevent clickjacking
            .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
            // XSS protection header
            .xssProtection(Customizer.withDefaults())
            // HSTS — HTTPS only
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31_536_000)
            )
        );
        return http.build();
    }
}
```

### Secure Cookie Flags
| Flag | Effect |
|---|---|
| `HttpOnly` | JavaScript cannot access cookie (XSS protection) |
| `Secure` | Cookie only sent over HTTPS |
| `SameSite=Strict` | Cookie not sent on cross-site requests (CSRF protection) |
| `SameSite=Lax` | Cookie sent on top-level navigation GET only |
| `SameSite=None; Secure` | Cookie sent cross-site (for embedded apps) |

---

## Password Storage

```java
// Spring Security — BCrypt (recommended)
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // Cost factor 12 (~300ms)
}

// Registration
public void register(RegisterRequest req) {
    String hashed = passwordEncoder().encode(req.getPassword());
    userRepository.save(new User(req.getEmail(), hashed));
}

// Login
public boolean authenticate(String email, String rawPassword) {
    User user = userRepository.findByEmail(email).orElseThrow();
    return passwordEncoder().matches(rawPassword, user.getPasswordHash());
    // BCrypt.matches is constant-time — no timing attacks
}
```

### Password Hashing Algorithms
| Algorithm | Status | Notes |
|---|---|---|
| MD5, SHA-1 | **Broken** — never use | Reversible via rainbow tables |
| SHA-256 (unsalted) | **Weak** | Rainbow table vulnerable |
| BCrypt | ✅ Recommended | Adaptive cost factor, built-in salt |
| Argon2id | ✅ Best current | Memory-hard, resistant to GPU cracking |
| PBKDF2 | ✅ Acceptable | NIST approved, used in FIPS contexts |

---

## Interview Questions

1. What is the difference between authentication and authorization?
2. What are the pros and cons of JWT vs session-based authentication?
3. Explain the OAuth 2.0 Authorization Code flow with PKCE.
4. Why is `RS256` preferred over `HS256` in a microservices architecture?
5. How do you implement token revocation with JWTs?
6. What is PKCE and what attack does it prevent?
7. What is the difference between RBAC, ABAC, and ReBAC?
8. How does TOTP (Google Authenticator) work?
9. What are passkeys and how do they differ from passwords?
10. Why should passwords be hashed with BCrypt instead of SHA-256?
11. What cookie flags are required for secure session management?
12. What is session fixation and how do you prevent it?
13. How does the refresh token rotation pattern work?
14. What is the difference between OAuth 2.0 and OIDC?
