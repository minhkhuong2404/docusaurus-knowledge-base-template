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

:::tip[Advanced Session Invalidation & Hacked Account Strategy]
For comprehensive strategies on handling account compromise, closing the access token revocation gap, and managing single-device vs multi-device session invalidation during password updates, see [Refresh Token Security & Multi-Device Session Invalidation](../security/refresh-token-security-invalidation.md).
:::

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

---

## JWT vs. Opaque Tokens: Senior Deep Dive

:::info[Chapter 11 Reference]
Building Microservices Chapter 11 dedicates substantial coverage to the debate between JWT (stateless) and opaque (server-side) token strategies, noting that neither is universally superior — the right choice depends on operational context.
:::

### Comprehensive Comparison

| Dimension | JWT (Self-Contained) | Opaque Token (Reference) |
|---|---|---|
| **Validation** | Cryptographic signature check (no network call) | Must call token introspection endpoint |
| **Revocation** | Impossible without denylist; wait for expiry | Immediate — delete from store |
| **Size** | 500–2000 bytes (claims bloat) | 32–64 bytes (random token ID) |
| **Cross-service** | Any service can validate with public key | All services must call auth server |
| **Claims freshness** | Stale for lifetime of token | Always current (introspection reads live state) |
| **Offline validation** | Yes (no network dependency) | No (requires auth server) |
| **Best for** | Internal service-to-service, stateless APIs | User sessions, admin tokens, high-revocation-needs |

### Token Lifecycle: JWT Best Practices

```
Access Token: short-lived (15 min)
Refresh Token: long-lived (7–30 days), rotated on each use

Client → POST /auth/login → access_token (15min) + refresh_token (30d)
        │
        ├─ Use access_token for API calls
        │
        └─ access_token expires →
              POST /auth/refresh { refresh_token }
              → new access_token (15min) + new refresh_token (30d)
              → old refresh_token immediately invalidated
```

```java
// Refresh Token Rotation with Redis
@Service
public class TokenService {
    private final RedisTemplate<String, String> redis;
    private final JwtUtil jwtUtil;

    // Refresh: atomic rotate
    @Transactional
    public TokenPair refresh(String oldRefreshToken) {
        // 1. Validate old refresh token exists
        String userId = redis.opsForValue().get("rt:" + oldRefreshToken);
        if (userId == null) {
            // Potential replay attack — invalidate ALL tokens for this user
            invalidateAllUserTokens(userId);
            throw new SecurityException("Invalid or replayed refresh token");
        }

        // 2. Delete old refresh token atomically (prevent concurrent replay)
        Boolean deleted = redis.delete("rt:" + oldRefreshToken);
        if (!deleted) throw new SecurityException("Concurrent refresh detected");

        // 3. Issue new pair
        String newAccessToken = jwtUtil.generateAccess(userId);
        String newRefreshToken = UUID.randomUUID().toString();
        redis.opsForValue().set("rt:" + newRefreshToken, userId,
            Duration.ofDays(30));

        return new TokenPair(newAccessToken, newRefreshToken);
    }
}
```

### JWT Algorithm Selection

| Algorithm | Type | Key Size | Security Level | Use Case |
|---|---|---|---|---|
| **HS256** | Symmetric (HMAC) | 256-bit shared secret | Low–Medium | Internal services sharing same secret |
| **HS512** | Symmetric (HMAC) | 512-bit shared secret | Medium | Internal with longer secret |
| **RS256** | Asymmetric (RSA) | 2048-bit key pair | High | Public APIs, external clients |
| **ES256** | Asymmetric (ECDSA) | 256-bit key pair | High | Mobile, constrained clients (smaller token) |
| **PS256** | Asymmetric (RSA-PSS) | 2048-bit key pair | Highest | FAPI, Open Banking compliance |

```
❌ NEVER use HS256 for external-facing APIs:
   - All services share the same secret
   - Any compromised service can forge tokens for any other service

✅ RS256/ES256 for external: sign with private key, verify with public key
   - Public key can be distributed to all services via JWKS endpoint
   - Only the auth server holds the private key
```

### JWKS (JSON Web Key Set) — Public Key Distribution

```java
// Auth server exposes public keys via JWKS endpoint
// GET /.well-known/jwks.json
// {
//   "keys": [{
//     "kty": "RSA",
//     "kid": "2024-01",
//     "use": "sig",
//     "n": "...",
//     "e": "AQAB"
//   }]
// }

// Resource server auto-fetches and caches JWKS
@Bean
public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder
        .withJwkSetUri("https://auth.example.com/.well-known/jwks.json")
        .build();
    // Spring caches the JWKS and re-fetches on key rotation
}
```

---

## mTLS (Mutual TLS): Zero-Trust Service Identity

### How mTLS Works

Standard TLS: client verifies server's certificate.  
mTLS: server AND client each verify each other's certificates.

```
Service A ──── mTLS handshake ────► Service B

1. B presents its certificate (signed by cluster CA)
2. A verifies B's cert against trusted CA
3. A presents its certificate
4. B verifies A's cert against trusted CA
5. Encrypted tunnel established with mutual identity
```

### Istio mTLS: Automatic Certificate Management

```yaml
# PeerAuthentication: enforce mTLS in namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT   # STRICT = reject all non-mTLS traffic
                   # PERMISSIVE = allow both mTLS and plain text (migration mode)
```

```yaml
# AuthorizationPolicy: fine-grained service-to-service access control
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-access
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
  - from:
    - source:
        # Only checkout-service and order-service can call payment-service
        principals:
          - cluster.local/ns/production/sa/checkout-service
          - cluster.local/ns/production/sa/order-service
    to:
    - operation:
        methods: ["POST"]
        paths: ["/api/payments/*"]
```

### mTLS vs. JWT for Internal Service Auth

| Scenario | mTLS | JWT (service credentials) |
|---|---|---|
| **Service identity** | Cryptographic certificate | Client credentials token |
| **Rotation** | Automatic (Istio rotates every 24h) | Manual or scheduled |
| **Granularity** | Service-level identity | Can embed scopes/roles |
| **Setup complexity** | High (service mesh required) | Medium |
| **East-west traffic** | Ideal | Overhead per-request |
| **North-south (external)** | Not applicable | Standard |

---

## RBAC vs. ABAC: Authorization Model Deep Dive

### RBAC (Role-Based Access Control)

```
User ──→ Role ──→ Permission

Pros: Simple to understand and audit
Cons: Role explosion (hundreds of roles), coarse-grained, can't express context
```

```java
// Spring Security RBAC
@PreAuthorize("hasRole('ORDER_MANAGER') or hasRole('ADMIN')")
public void cancelOrder(Long orderId) { ... }

// Problem: What if ORDER_MANAGER can only cancel THEIR OWN team's orders?
// RBAC can't express this without creating per-team roles (role explosion)
```

### ABAC (Attribute-Based Access Control)

```
Subject (user.department=Finance) + Action (UPDATE) + Resource (invoice.department=Finance)
   + Environment (time.hour=business_hours)
   ──────────────────────────────────────────────
              Policy Decision: ALLOW
```

```java
// Spring Security ABAC with SpEL
@PreAuthorize("@securityService.canModifyOrder(authentication, #orderId)")
public void cancelOrder(Long orderId) { ... }

@Service
public class SecurityService {
    public boolean canModifyOrder(Authentication auth, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        UserDetails user = (UserDetails) auth.getPrincipal();

        // Attribute-based: user must own the order OR be in same department
        return order.getOwnerId().equals(user.getId())
            || order.getDepartment().equals(user.getDepartment())
            || user.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }
}
```

### ReBAC (Relationship-Based Access Control)

Google Zanzibar model: permissions defined by relationships between objects.

```
tuple: document:readme#owner@user:alice
tuple: document:readme#viewer@group:engineering
tuple: group:engineering#member@user:bob

Query: Can user:bob view document:readme?
  bob ─member─► engineering ─viewer─► readme ✓ YES
```

Used by: Google Drive, GitHub, Notion, Carta.

### Authorization Model Selection Guide

| Factor | RBAC | ABAC | ReBAC |
|---|---|---|---|
| **Number of roles** | < 50 manageable | Any number | Any number |
| **Context-aware decisions** | No | Yes | No |
| **Relationship-based access** | No | Partial | Yes |
| **Audit trail simplicity** | Simple | Complex | Medium |
| **Performance** | Fast (DB lookup) | Variable (policy evaluation) | Can be expensive (graph traversal) |
| **Examples** | Simple SaaS, internal tools | Healthcare, finance, government | Google Drive, GitHub, Linear |

---

## Zero Trust Network Architecture

### The Perimeter Security Fallacy

```
Old model (Castle & Moat):
  External users ──── firewall ────► internal network
  "Anything inside is trusted"
  Problem: Lateral movement after breach, insider threats, cloud makes perimeter meaningless

Zero Trust:
  Every request verified regardless of source IP
  "Never trust, always verify, least privilege"
```

### Zero Trust Pillars (NIST SP 800-207)

| Pillar | Implementation |
|---|---|
| **Identity** | Strong MFA + continuous validation (not just at login) |
| **Device** | Certificate-based device auth, endpoint posture checks |
| **Network** | mTLS east-west, network segmentation, deny-by-default |
| **Application** | Per-request authorization, ABAC policies |
| **Data** | Encryption at rest + in transit, data classification |

### Kubernetes Network Policy: Zero Trust Baseline

```yaml
# Default deny all ingress and egress in production namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}    # Select all pods
  policyTypes:
  - Ingress
  - Egress
---
# Allow: order-service can reach payment-service on port 8080 only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-order-to-payment
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: payment-service
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: order-service
    ports:
    - protocol: TCP
      port: 8080
---
# Allow: all services can reach DNS (kube-dns)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: production
spec:
  podSelector: {}
  egress:
  - ports:
    - protocol: UDP
      port: 53
```

---

## OAuth 2.0: Advanced Flows

### PKCE (Proof Key for Code Exchange)

Prevents authorization code interception attacks in public clients (SPA, mobile apps).

```
Traditional auth code flow weakness:
  Malicious app on same device intercepts the /callback?code=AUTH_CODE redirect

PKCE solution:
  1. Client generates: code_verifier = random(128 chars)
  2. Client computes: code_challenge = base64url(SHA256(code_verifier))
  3. /authorize?code_challenge=..&code_challenge_method=S256
  4. /token: client sends code_verifier — auth server verifies SHA256 matches
  → Intercepted code is useless without code_verifier
```

### Client Credentials Flow: Service-to-Service

```java
// Service A fetches access token to call Service B
@Service
public class OAuth2TokenFetcher {
    private final OAuth2AuthorizedClientManager clientManager;

    public String getTokenForService(String serviceName) {
        OAuth2AuthorizeRequest request = OAuth2AuthorizeRequest
            .withClientRegistrationId(serviceName)
            .principal("service-a")
            .build();

        OAuth2AuthorizedClient client = clientManager.authorize(request);
        return client.getAccessToken().getTokenValue();
    }
}
```

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          payment-service:
            client-id: order-service-client
            client-secret: ${PAYMENT_SERVICE_CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: payments:write
        provider:
          payment-service:
            token-uri: https://auth.example.com/oauth/token
```

### Token Introspection: Opaque Tokens

```java
// Resource server validates opaque token by calling auth server
@Bean
public OpaqueTokenIntrospector introspector() {
    return new NimbusOpaqueTokenIntrospector(
        "https://auth.example.com/oauth/introspect",
        "resource-server-client",
        "resource-server-secret"
    );
}
// Spring auto-calls introspection endpoint on every request
// Response includes: active, scope, sub, exp, client_id
```

---

## Secrets Management: Production Patterns

### HashiCorp Vault: Dynamic Secrets

Dynamic secrets are generated on-demand with a TTL, eliminating long-lived credentials.

```
Traditional: DB_PASSWORD=static-password stored in .env (rotated manually every 90 days)

Dynamic secrets:
  Service A requests DB credentials → Vault creates: DB_USER=v-app-xyz, DB_PASS=generated-abc (TTL: 1h)
  Service A uses credentials for 1 hour
  Vault revokes: DROP USER v-app-xyz (automatic)
  Next request → new unique credentials

Benefits:
  - No long-lived passwords to steal
  - Automatic rotation
  - Per-service audit trail
  - Revocation without credential rotation ceremony
```

```java
// Spring Cloud Vault: dynamic DB credentials
@Configuration
public class VaultDatabaseConfig {
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }
}
```

```yaml
spring:
  cloud:
    vault:
      uri: https://vault.example.com:8200
      authentication: KUBERNETES          # Use K8s service account token
      kubernetes:
        role: order-service-role          # Vault role bound to K8s SA
      database:
        enabled: true
        role: order-service-db-role       # Vault DB role with limited permissions
        backend: database
```

### Secret Rotation Patterns

| Pattern | When to Use | Zero Downtime? |
|---|---|---|
| **Dual-version secrets** | DB passwords — add new user, drain to new, delete old | Yes |
| **Rolling restart** | Config-file secrets — update secret, restart pods rolling | Yes |
| **Atomic swap** | Redis/cache credentials | Near-zero |
| **Certificate rotation** | TLS certs — overlap old+new before removing old | Yes |
| **Emergency revocation** | Compromised secret — immediate effect, brief downtime acceptable | No |

---

## API Security: Defense in Depth

### Input Validation: Multiple Layers

```java
// Layer 1: Type constraints (OpenAPI spec auto-validates via Spring)
@RestController
public class UserController {

    // Layer 2: Bean Validation on DTO
    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest req) { ... }
}

@Data
public class CreateUserRequest {
    @NotBlank @Size(max = 100)
    @Pattern(regexp = "^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
    private String email;

    @NotBlank @Size(min = 8, max = 100)
    private String password;

    @Size(max = 50)
    @Pattern(regexp = "^[\\p{L}\\s'-]+$")  // Unicode letters, spaces, hyphens
    private String name;
}

// Layer 3: Domain-level validation
@Service
public class UserService {
    public User createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email already registered");
        }
        // Domain invariants enforced here
    }
}
```

### CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://app.example.com",
                "https://admin.example.com"
            )
            // ❌ Never allowedOrigins("*") for authenticated APIs
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .allowedHeaders("Authorization", "Content-Type", "X-Correlation-ID")
            .allowCredentials(true)           // Required for cookies/auth headers
            .maxAge(3600);                    // Cache preflight for 1 hour
    }
}
```

### Security Headers

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        // Prevent clickjacking
        .frameOptions(frame -> frame.deny())
        // Prevent MIME sniffing
        .contentTypeOptions(Customizer.withDefaults())
        // XSS protection (for non-API HTML responses)
        .xssProtection(Customizer.withDefaults())
        // HSTS: force HTTPS for 1 year, including subdomains
        .httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .maxAgeInSeconds(31536000)
            .preload(true)
        )
        // Content Security Policy
        .contentSecurityPolicy(csp -> csp
            .policyDirectives(
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "connect-src 'self' https://api.example.com"
            )
        )
    );
    return http.build();
}
```

---

## Audit Logging: Compliance and Security

### What Must Be Audited

```java
// AuditEvent: record sensitive operations with full context
@Service
@Slf4j
public class AuditService {
    private final AuditRepository auditRepository;

    public void audit(AuditEvent event) {
        AuditRecord record = AuditRecord.builder()
            .timestamp(Instant.now())
            .userId(SecurityContextHolder.getContext()
                .getAuthentication().getName())
            .action(event.getAction())           // CREATE_USER, DELETE_ORDER, etc.
            .resourceType(event.getResourceType())
            .resourceId(event.getResourceId())
            .result(event.getResult())           // SUCCESS | FAILURE
            .ip(event.getIp())
            .userAgent(event.getUserAgent())
            .changes(event.getChanges())         // Before/after state for mutations
            .build();

        // Write to append-only audit table (no UPDATE/DELETE permissions)
        auditRepository.save(record);

        // Also emit structured log for SIEM ingestion
        log.info("AUDIT event={} userId={} resource={}/{} result={}",
            event.getAction(), record.getUserId(),
            event.getResourceType(), event.getResourceId(),
            event.getResult());
    }
}
```

### Events That Require Audit Logging

| Category | Events |
|---|---|
| **Authentication** | Login success/failure, logout, MFA challenges |
| **Authorization** | Access denied events (403s), permission changes |
| **Data mutations** | Create/update/delete of sensitive resources |
| **Admin actions** | Role assignment, secret rotation, config changes |
| **Data exports** | Bulk data downloads, report generation |
| **Security events** | Token revocation, suspicious activity flags |

---

## Security Anti-Patterns

| Anti-Pattern | Risk Level | Fix |
|---|---|---|
| **Long-lived tokens (>24h access tokens)** | High | 15-min access + refresh rotation |
| **User ID in request body** | Critical | Extract identity from token only |
| **HS256 with weak secret** | Critical | RS256/ES256 with proper key size |
| **No token expiry** | Critical | Always set `exp` claim |
| **Logging JWT tokens** | Critical | Never log Authorization header values |
| **RBAC without BOLA check** | High | Always verify resource ownership |
| **Missing rate limit on auth** | High | Exponential backoff + lockout |
| **Plain HTTP internal traffic** | Medium-High | mTLS or at minimum TLS |
| **Secrets in environment variables** | Medium | Vault/Secrets Manager with rotation |
| **Storing raw passwords** | Critical | bcrypt/Argon2 with proper cost factor |

---

## Interview Questions

### Q: When would you choose opaque tokens over JWTs for a microservices system?

**A:** When immediate revocation is required — for example, a user logs out, an account is suspended, or a security breach is detected. JWTs cannot be revoked before expiry without a denylist that requires a network call, effectively eliminating their statelessness advantage. Opaque tokens enable instant revocation by deleting from the token store. The trade-off is that every service must call the introspection endpoint on each request, adding latency and a dependency on the auth server. A hybrid approach works well: short-lived JWTs (5–15 minutes) for normal traffic, with a Redis-backed denylist for high-priority revocations.

### Q: Explain the PKCE flow and why it is necessary for single-page applications.

**A:** SPA/mobile apps are public clients — they cannot safely store a client secret. The authorization code flow without PKCE is vulnerable to code interception: a malicious app on the same device could intercept the redirect URI containing the auth code and exchange it for tokens. PKCE adds a cryptographic proof: the client generates a random code_verifier, hashes it to code_challenge, sends the hash in the authorization request, and proves knowledge of the verifier at the token endpoint. An intercepted code is useless without the original verifier, which never leaves the legitimate client.

### Q: How does Istio implement mTLS without changing application code?

**A:** Istio injects an Envoy sidecar proxy into every pod. The sidecar intercepts all network traffic before it reaches the application container. For outbound connections, Envoy upgrades plain HTTP to mTLS using a workload certificate issued by Istiod (the control plane). For inbound connections, Envoy terminates the mTLS handshake and forwards plain HTTP to the application on localhost. The application speaks only plain HTTP — the mTLS is entirely managed by the sidecar mesh. Istiod also automatically rotates workload certificates every 24 hours using SPIFFE-compliant SVID certificates.

### Q: How do you design an authorization system for a multi-tenant SaaS where users belong to organizations?

**A:** This is a classic relationship-based access control (ReBAC) problem. Model the relationships: user → member → organization, organization → owner → resource, resource → permission → action. Use a policy engine like Zanzibar (or OSS: SpiceDB, Keto) to evaluate permission checks as graph traversals. This naturally handles: users inheriting org-level permissions, resource sharing between orgs, and inheritance hierarchies. Avoid encoding org membership in JWT claims as they become stale — instead check relationships at request time against the policy engine.

### Q: How would you implement defense-in-depth for a financial API?

**A:** Layer defenses: (1) Network — mTLS internal traffic, WAF at edge blocking OWASP Top 10. (2) Identity — short-lived RS256 JWTs (5-min access tokens) with refresh rotation and device binding. (3) Authorization — ABAC with per-request ownership checks, not just role checks. (4) Input — JSON schema validation, parameterized queries, content-length limits. (5) Rate limiting — per-IP, per-user, per-API-key token bucket. (6) Audit — every mutation logged with before/after state, user identity, IP, and user agent. (7) Anomaly detection — ML-based fraud scoring on transaction patterns. Each layer must fail independently without causing a complete outage.

