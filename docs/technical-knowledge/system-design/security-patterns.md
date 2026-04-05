---
id: security-patterns
title: Security Patterns
sidebar_label: Security Patterns
description: Security design patterns for distributed systems including authentication, authorization, JWT, OAuth 2.0, rate limiting, zero trust, secrets management, and OWASP top threats.
tags: [security, authentication, authorization, jwt, oauth2, rate-limiting, zero-trust, secrets, owasp]
---

# Security Patterns

---

## Authentication vs Authorization

| | Authentication (AuthN) | Authorization (AuthZ) |
|---|---|---|
| Question | Who are you? | What can you do? |
| Mechanism | JWT, sessions, API keys | RBAC, ABAC, ACL |
| Failure code | 401 Unauthorized | 403 Forbidden |

---

## JWT (JSON Web Token)

```
Header.Payload.Signature
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature
```

### Structure
```json
// Header
{ "alg": "RS256", "typ": "JWT" }

// Payload (claims)
{
  "sub": "user-123",
  "email": "alice@example.com",
  "roles": ["ROLE_USER", "ROLE_ADMIN"],
  "iat": 1700000000,
  "exp": 1700003600
}
```

### Spring Security JWT
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withPublicKey(rsaPublicKey()).build();
    }
}
```

### JWT Trade-offs
| Advantage | Disadvantage |
|---|---|
| Stateless (no DB lookup per request) | Cannot be revoked before expiry |
| Self-contained claims | Token size larger than session ID |
| Cross-service verification | Must use short expiry + refresh tokens |

### Token Revocation
```java
// Blocklist with Redis (for logout/revocation)
public void revokeToken(String jti, Instant expiry) {
    Duration ttl = Duration.between(Instant.now(), expiry);
    redis.opsForValue().set("revoked:" + jti, "1", ttl);
}

// In JWT filter
public boolean isRevoked(String jti) {
    return redis.hasKey("revoked:" + jti);
}
```

---

## OAuth 2.0 / OIDC

### Authorization Code Flow (Web Apps)
```
1. User clicks "Login with Google"
2. Redirect to Google /authorize?client_id=...&scope=openid email
3. User authenticates with Google
4. Google redirects back: /callback?code=AUTH_CODE
5. Your server exchanges code → access_token + id_token
6. Your server validates id_token → extracts user info
```

### Client Credentials Flow (Service-to-Service)
```
Service A → POST /oauth/token (client_id, client_secret, grant_type=client_credentials)
         ← access_token
Service A → GET /api/resource (Authorization: Bearer access_token)
```

---

## RBAC (Role-Based Access Control)

```
User → Role → Permission

Alice → [ADMIN, USER] → [READ_ALL, WRITE_ALL, DELETE_ALL]
Bob   → [USER]        → [READ_OWN, WRITE_OWN]
```

```java
// Method-level security
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public void deleteUser(Long userId) { ... }

@PostAuthorize("returnObject.userId == authentication.principal.id")
public Order getOrder(Long orderId) { ... }

// Custom permission evaluator
@PreAuthorize("hasPermission(#orderId, 'ORDER', 'READ')")
public Order getOrder(Long orderId) { ... }
```

---

## Secrets Management

### Never
- Hardcode secrets in source code
- Store secrets in application.properties committed to git
- Log secrets

### Always
```java
// Use environment variables
@Value("${DB_PASSWORD}")
private String dbPassword;

// Or Spring Cloud Vault / AWS Secrets Manager
@Bean
public VaultTemplate vaultTemplate() {
    // Auto-injects secrets from HashiCorp Vault
}
```

```yaml
# Spring Cloud Vault
spring:
  cloud:
    vault:
      uri: https://vault.example.com
      authentication: AWS_IAM
      aws-iam:
        role: my-service-role
```

### Secret Rotation
- Secrets should have TTL (short-lived)
- Rotate database passwords without downtime (dual-password period)
- Use dynamic secrets (Vault generates one-time DB credentials per request)

---

## Rate Limiting (Security Aspect)

```java
// Per-IP rate limiting for auth endpoints
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {
    private static final String PREFIX = "login_attempts:";

    protected void doFilterInternal(HttpServletRequest req, ...) {
        if (req.getRequestURI().equals("/api/auth/login")) {
            String ip = req.getRemoteAddr();
            String key = PREFIX + ip;
            Long attempts = redis.opsForValue().increment(key);
            if (attempts == 1) redis.expire(key, Duration.ofMinutes(15));

            if (attempts > 10) {
                response.setStatus(429);
                response.getWriter().write("{\"error\": \"Too many login attempts\"}");
                return;
            }
        }
        chain.doFilter(req, response);
    }
}
```

---

## Zero Trust Architecture

> "Never trust, always verify." No implicit trust based on network location.

**Principles:**
1. Verify explicitly (every request, every time)
2. Least privilege access
3. Assume breach — limit blast radius

```
Traditional: Inside network = trusted
Zero Trust:  Every service call must authenticate, even internal

Implementation:
- mTLS between all services (mutual authentication)
- Service accounts with minimal permissions
- Network policies (only allow necessary traffic)
- No "bastion" or implicit trust for internal IPs
```

---

## OWASP Top 10 for APIs

| Vulnerability | Example | Fix |
|---|---|---|
| **Broken Object Level Auth** | GET /orders/123 (not your order) | Always verify ownership |
| **Broken Auth** | Weak JWT secret, no token expiry | RS256, short expiry, rotation |
| **Excessive Data Exposure** | Return full user object including password hash | Use DTOs, project only needed fields |
| **Rate Limiting Missing** | Brute force login | Rate limit auth endpoints |
| **Broken Function Level Auth** | Regular user calls /admin endpoint | @PreAuthorize on every endpoint |
| **Mass Assignment** | `PATCH /users/{id}` with `{"role":"ADMIN"}` | Whitelist updatable fields |
| **Security Misconfiguration** | Default creds, verbose error messages | Audit configs, generic error messages |
| **Injection** | SQL injection via string concatenation | Parameterized queries, JPA |
| **Improper Assets Management** | Old v1 API with no auth still running | API versioning, retire old versions |
| **Insufficient Logging** | No audit log for sensitive operations | Log all auth events |

---

## SQL Injection Prevention
```java
// BAD
String query = "SELECT * FROM users WHERE email = '" + email + "'";
// Attacker: email = "' OR '1'='1"

// GOOD — JPA (parameterized)
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// GOOD — JDBC template
jdbcTemplate.queryForObject(
    "SELECT * FROM users WHERE email = ?",
    userRowMapper, email  // Parameterized — safe
);
```

---

## HTTPS / TLS Best Practices

```yaml
# Spring Boot — enforce HTTPS
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-type: PKCS12
  http2:
    enabled: true

# Redirect HTTP to HTTPS
```

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.requiresChannel(channel -> channel
        .anyRequest().requiresSecure()
    );
    http.headers(headers -> headers
        .httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .maxAgeInSeconds(31536000)
        )
    );
    return http.build();
}
```

---

## Interview Questions

### Q: What is the difference between authentication and authorization?

**A:** Authentication verifies who the user/service is; authorization decides what that identity can access. Always authenticate first, then enforce resource-level permissions.

### Q: How does JWT work? What are its advantages and disadvantages over session tokens?

**A:** JWT is a signed token containing claims validated without server-side session lookup. It scales well statelessly but revocation and claim bloat are harder than opaque session IDs.

### Q: What is the OAuth 2.0 Authorization Code flow?

**A:** User authenticates at the authorization server, client gets an auth code, then exchanges it (with client auth/PKCE) for tokens. It keeps access tokens off the browser redirect channel.

### Q: How do you revoke a JWT before it expires?

**A:** Use short-lived access tokens plus refresh-token rotation and server-side denylist/jti checks for high-risk revocations. Token introspection is another option for opaque tokens.

### Q: What is Zero Trust architecture?

**A:** Zero Trust assumes no implicit network trust and verifies every request continuously. It enforces strong identity, least privilege, and device/context-aware policy.

### Q: How do you prevent SQL injection in a Spring Boot application?

**A:** Use parameterized queries/JPA bindings, never string-concatenate SQL, and validate input at boundaries. Apply least-privilege DB accounts and query allowlists where possible.

### Q: What is RBAC and how do you implement it with Spring Security?

**A:** RBAC grants permissions by role rather than per-user hardcoding. In Spring Security, map roles/authorities from identity provider claims and enforce with method or URL policies.

### Q: How should secrets (API keys, DB passwords) be managed in a microservices system?

**A:** Store secrets in a dedicated manager (Vault/AWS Secrets Manager), inject at runtime, and rotate automatically. Never commit secrets to code or logs.

### Q: What is OWASP Broken Object Level Authorization? Give an example.

**A:** BOLA occurs when APIs expose object IDs but do not enforce ownership checks. Example: changing `/orders/123` to `/orders/124` returns another user's order.

### Q: How do you rate limit authentication endpoints to prevent brute force?

**A:** Apply per-IP and per-account limits with exponential backoff and temporary lockouts. Combine with bot detection, MFA prompts, and suspicious activity monitoring.

