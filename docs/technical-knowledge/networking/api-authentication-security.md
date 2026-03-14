---
id: api-authentication-security
title: API Authentication & Authorization
description: OAuth 2.0 flows, JWT structure and validation, API keys, mTLS, OIDC, token introspection, and Spring Security integration.
tags: [networking, authentication, oauth2, jwt, oidc, api-security, spring-security, bearer-token, mtls]
sidebar_position: 17
---

# API Authentication & Authorization

## Authentication vs Authorization

| Concept | Question | Example |
|---------|----------|---------|
| **Authentication (AuthN)** | *Who are you?* | Verifying a JWT signature proves the token is from a trusted issuer |
| **Authorization (AuthZ)** | *What can you do?* | Checking if the user has the `ROLE_ADMIN` scope to delete resources |

---

## API Key Authentication

The simplest mechanism — a secret token passed with each request.

```http
GET /api/orders HTTP/1.1
Host: api.example.com
X-API-Key: sk_live_abc123xyz789
```

```java
// Spring: API key filter
@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    private final String API_KEY_HEADER = "X-API-Key";

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain) throws IOException, ServletException {
        String key = req.getHeader(API_KEY_HEADER);
        if (!apiKeyService.isValid(key)) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API Key");
            return;
        }
        chain.doFilter(req, res);
    }
}
```

**Pros:** Simple, stateless, easy to revoke per client.
**Cons:** No user identity, no fine-grained scope, must be stored securely (treat as password).

---

## JWT — JSON Web Token

A self-contained, signed token that carries claims about the subject.

### JWT Structure

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9   ← Header (Base64url)
.
eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYW  ← Payload (Base64url)
xpY2VAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJV
U0VSIl0sImlhdCI6MTcwMDAwMDAwMCwiZXhwIj
oxNzAwMDAzNjAwfQ
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQ  ← Signature
```

### Decoded Header

```json
{
  "alg": "RS256",   // RSA with SHA-256 — asymmetric (preferred)
  "typ": "JWT"
}
```

### Decoded Payload (Claims)

```json
{
  "sub": "user_123",                     // Subject (user ID)
  "iss": "https://auth.example.com",     // Issuer
  "aud": "https://api.example.com",      // Audience
  "email": "alice@example.com",
  "roles": ["USER", "ADMIN"],
  "scope": "read:orders write:orders",
  "iat": 1700000000,                     // Issued At (Unix timestamp)
  "exp": 1700003600,                     // Expiry (1 hour)
  "jti": "unique-token-id-abc123"        // JWT ID (for revocation)
}
```

### Signing Algorithms

| Algorithm | Type | Key | Use Case |
|-----------|------|-----|---------|
| `HS256` | Symmetric | Shared secret | Single-service (auth + API = same party) |
| `RS256` | Asymmetric | RSA private/public key | Auth server signs, APIs verify with public key |
| `ES256` | Asymmetric | ECDSA | Smaller signatures, same security as RS256 |
| `RS512` | Asymmetric | RSA (stronger) | Highest security requirement |

**Best practice:** Use `RS256` or `ES256` — the auth server holds the private key, all APIs validate with the public key (no shared secret).

### JWT Validation Steps

```
1. Parse header → extract algorithm
2. Verify signature (public key / shared secret)
3. Check `exp` → not expired
4. Check `iss` → matches expected issuer
5. Check `aud` → contains this API's identifier
6. Check `nbf` → "not before" time if present
7. Check `jti` → not in revocation list (if blacklisting)
```

### Spring Security JWT Validation

```java
// application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com      # fetches JWKS automatically
          # OR: provide public key directly
          public-key-location: classpath:public.pem

// Security config
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders").hasAuthority("SCOPE_read:orders")
                .requestMatchers(HttpMethod.POST, "/api/orders").hasAuthority("SCOPE_write:orders")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter()))
            );
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("roles");
        converter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(converter);
        return jwtConverter;
    }
}

// Access claims in controller
@GetMapping("/api/profile")
public ProfileDto getProfile(@AuthenticationPrincipal Jwt jwt) {
    String userId = jwt.getSubject();
    String email = jwt.getClaimAsString("email");
    List<String> roles = jwt.getClaimAsStringList("roles");
    return new ProfileDto(userId, email, roles);
}
```

---

## OAuth 2.0

An **authorization framework** allowing a third-party application to obtain limited access to a service on behalf of a user — without sharing credentials.

### Core Roles

```
Resource Owner   = User (Alice)
Client           = Your application (mobile app, SPA)
Authorization Server = Auth service (Keycloak, Auth0, Okta)
Resource Server  = API server (your Spring Boot app)
```

### Grant Types (Flows)

#### Authorization Code Flow (Web Apps, Mobile)

The most secure flow. Used when a user logs in via browser.

```
User                Client App          Auth Server         Resource Server
 │                      │                    │                    │
 │  Click "Login"        │                    │                    │
 │ ────────────────────► │                    │                    │
 │                       │  redirect to /authorize?               │
 │                       │  client_id=X&                          │
 │                       │  redirect_uri=https://app/callback&    │
 │                       │  scope=read:orders&                    │
 │                       │  state=csrf_token&                     │
 │                       │  code_challenge=PKCE_hash              │
 │ ◄──────────────────── │ ─────────────────►│                    │
 │  Show login page       │                  │                    │
 │  Enter credentials     │                  │                    │
 │ ────────────────────────────────────────► │                    │
 │  Redirect to:          │                  │                    │
 │  app/callback?code=AUTHCODE               │                    │
 │ ◄──────────────────────────────────────── │                    │
 │                       │ POST /token       │                    │
 │                       │ code=AUTHCODE     │                    │
 │                       │ code_verifier=PKCEver                  │
 │                       │ ────────────────►│                    │
 │                       │ ◄── access_token, refresh_token        │
 │                       │                  │                    │
 │                       │ GET /orders                            │
 │                       │ Authorization: Bearer <access_token>   │
 │                       │ ─────────────────────────────────────► │
 │                       │ ◄──── orders JSON ─────────────────── │
```

#### PKCE (Proof Key for Code Exchange)

Required for public clients (SPAs, mobile apps) that can't keep a client secret:

```
1. Client generates: code_verifier = random 43-128 char string
2. Client computes: code_challenge = BASE64URL(SHA256(code_verifier))
3. Include code_challenge in /authorize request
4. Include code_verifier in /token request
5. Auth server verifies: SHA256(code_verifier) == code_challenge
```

#### Client Credentials Flow (Machine-to-Machine)

For service-to-service calls — no user involved:

```
Service A                    Auth Server              Service B
    │                             │                       │
    │  POST /token                │                       │
    │  grant_type=client_credentials                      │
    │  client_id=svc-a            │                       │
    │  client_secret=secret       │                       │
    │ ─────────────────────────► │                       │
    │ ◄── access_token ────────── │                       │
    │                             │                       │
    │  GET /api/data              │                       │
    │  Authorization: Bearer <token>                      │
    │ ──────────────────────────────────────────────────► │
    │ ◄── data ─────────────────────────────────────────  │
```

```java
// Spring Boot: client credentials with WebClient
@Configuration
public class OAuth2ClientConfig {

    @Bean
    public WebClient serviceClient(
            ReactiveOAuth2AuthorizedClientManager manager) {
        ServerOAuth2AuthorizedClientExchangeFilterFunction filter =
            new ServerOAuth2AuthorizedClientExchangeFilterFunction(manager);
        filter.setDefaultClientRegistrationId("service-b");

        return WebClient.builder()
            .filter(filter)  // auto-attaches Bearer token
            .baseUrl("https://service-b.internal")
            .build();
    }
}

# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          service-b:
            provider: keycloak
            client-id: service-a
            client-secret: ${CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: read:orders
        provider:
          keycloak:
            token-uri: https://auth.example.com/realms/myapp/protocol/openid-connect/token
```

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

## 🎯 Interview Questions

**Q1. What is the difference between OAuth 2.0 and OIDC?**
> OAuth 2.0 is an authorization framework — it grants third-party apps access to resources on behalf of a user (access tokens, scopes). It doesn't define user identity. OIDC (OpenID Connect) is an identity layer built on top of OAuth 2.0 — it adds an ID Token (a JWT with user identity claims like `sub`, `email`) and a UserInfo endpoint. Use OAuth for API authorization; use OIDC for user authentication/SSO.

**Q2. What are the JWT claims `iss`, `sub`, `aud`, `exp`, `iat`?**
> `iss` (Issuer): who created and signed the token (auth server URL). `sub` (Subject): who the token is about (user ID). `aud` (Audience): intended recipient(s) — validate that your API is in this list. `exp` (Expiration): Unix timestamp after which the token is invalid. `iat` (Issued At): when the token was created. Always validate `exp` and `aud` in addition to the signature.

**Q3. Why is RS256 preferred over HS256 for JWTs in microservices?**
> HS256 uses a shared secret — every service that validates tokens must know the same secret, which becomes a security risk as you scale. RS256 uses asymmetric RSA keys: the auth server signs with its private key; all services validate with the public key. Compromising a resource server doesn't expose the signing key. The public key can be distributed via JWKS endpoint (`/.well-known/jwks.json`).

**Q4. How do you securely handle token revocation with JWTs?**
> JWTs are stateless, so traditional revocation requires: (1) Short expiry (5–15 min) + refresh tokens. (2) A revocation blacklist in Redis keyed by `jti` claim — check on every request (adds latency). (3) Token introspection — ask the auth server on each request (most accurate, most overhead). (4) Rotating refresh tokens — detect theft when old refresh token is reused. Strategy depends on security requirements vs latency tolerance.

**Q5. What is PKCE and why is it required for public clients?**
> PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks for public clients (SPAs, mobile apps) that can't securely store a client secret. The client generates a random `code_verifier`, computes `code_challenge = SHA256(code_verifier)`, includes the challenge in the auth request, and the verifier in the token request. The auth server verifies they match — an attacker who intercepts the auth code can't exchange it without the verifier.

**Q6. What is the Client Credentials flow and when is it used?**
> Client Credentials is used for machine-to-machine (M2M) communication with no user involvement. Service A authenticates itself with `client_id` + `client_secret` directly to the auth server, receives an access token, and uses it to call Service B. Used for internal microservice-to-service calls, batch jobs, background workers. Spring Boot auto-handles token refresh with the OAuth2 client configured with `authorization-grant-type: client_credentials`.

**Q7. What is mTLS and how does it differ from regular TLS?**
> Regular TLS: only the client verifies the server's certificate (one-way authentication). mTLS (Mutual TLS): both sides present and verify certificates — the server also verifies the client's cert. This provides cryptographic proof of identity for both parties, making it ideal for zero-trust service-to-service communication. It's the strongest form of service authentication; in service meshes like Istio, mTLS is often applied automatically via sidecars.

**Q8. What is token introspection and when would you use it over local JWT validation?**
> Token introspection (RFC 7662) involves calling the auth server's `/introspect` endpoint on every request to check if a token is still valid and active. Unlike local validation (check signature + expiry), introspection can detect revoked tokens immediately. Trade-off: adds a network call to every request (~5–20ms). Use local JWT validation with short expiry for most cases; use introspection for high-security scenarios (banking, healthcare) where immediate revocation is critical.
