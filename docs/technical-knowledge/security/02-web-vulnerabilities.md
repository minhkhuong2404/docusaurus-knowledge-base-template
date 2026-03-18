---
id: web-vulnerabilities
title: Web Vulnerabilities & Defenses
sidebar_label: Web Vulnerabilities
description: Comprehensive guide to OWASP Top 10 — SQL injection, XSS, CSRF, SSRF, XXE, IDOR, insecure deserialization, and their mitigations in Spring Boot applications.
tags: [security, owasp, sql-injection, xss, csrf, ssrf, xxe, idor, insecure-deserialization, spring-security]
---

# Web Vulnerabilities & Defenses

> Based on [OWASP Top 10](https://owasp.org/Top10/) — the most critical web application security risks.

---

## A01 — Broken Access Control

The #1 risk. Restrictions on what users can do are not properly enforced server-side.

### Attack Examples

```
# IDOR — Insecure Direct Object Reference
GET /api/orders/1234   ← User A's order
GET /api/orders/1235   ← User B's order (attacker increments ID)

# Privilege escalation via mass assignment
PUT /api/users/42 { "role": "ADMIN" }   ← Regular user sets own role

# Forced browsing
GET /admin/dashboard   ← No role check on backend
```

### Defenses

```java
@GetMapping("/api/orders/{orderId}")
public Order getOrder(@PathVariable Long orderId,
                      @AuthenticationPrincipal UserDetails user) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

    // ALWAYS verify ownership server-side — never trust client-provided user ID
    if (!order.getUserId().equals(((AppUser) user).getId())
            && !user.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
        // Return 404 (not 403) to avoid confirming the resource exists
        throw new ResourceNotFoundException("Order not found");
    }
    return order;
}

// Deny by default
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/public/**").permitAll()
    .anyRequest().authenticated()   // Default: require auth
);

// Use UUIDs in public-facing IDs instead of sequential integers
@Entity
public class Order {
    @Id Long internalId;
    String publicId = UUID.randomUUID().toString(); // Exposed in API
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
// Encrypt PII at rest using JPA converter
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
    private String ssn;

    @Convert(converter = EncryptedStringConverter.class)
    private String phoneNumber;
}
```

---

## A03 — SQL Injection

```java
// ❌ VULNERABLE — string concatenation
String query = "SELECT * FROM users WHERE email = '" + email + "'";
// Attacker input: ' OR '1'='1  → Returns ALL users

// ✅ SAFE — parameterized queries via Spring Data JPA
Optional<User> findByEmail(String email); // Auto-parameterized

// ✅ SAFE — JPQL with named parameters
@Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
Optional<User> findActiveByEmail(@Param("email") String email);

// ✅ SAFE — JdbcTemplate
jdbcTemplate.queryForObject(
    "SELECT * FROM users WHERE email = ?",
    userRowMapper, email
);

// ✅ Dynamic ORDER BY — whitelist approach (column names can't be parameterized)
private static final Set<String> ALLOWED_SORT = Set.of("name", "email", "created_at");

public List<User> findUsers(String sortBy) {
    if (!ALLOWED_SORT.contains(sortBy)) {
        throw new IllegalArgumentException("Invalid sort column");
    }
    return jdbcTemplate.query("SELECT * FROM users ORDER BY " + sortBy, userRowMapper);
}
```

**Defense in depth:** DB user should have only SELECT/INSERT/UPDATE permissions — never DROP.

---

## A04 — Insecure Design

Security not considered in the design phase.

### Examples
- No rate limiting on login → brute force possible
- Password reset link valid forever
- Security questions as MFA factor
- No fraud detection on financial transactions

### Defense
- Threat modeling before building (STRIDE framework)
- Security requirements in every user story
- Defense-in-depth: multiple controls, not just one

---

## A05 — Security Misconfiguration

```java
// ❌ Spring Boot Actuator exposed without auth
// GET /actuator/env → leaks ALL environment variables including secrets
// GET /actuator/heapdump → dumps full JVM heap → secrets extractable

// ✅ Restrict actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized
  server:
    port: 8081  # Separate internal port

// ✅ Generic error responses — never leak internals
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex); // Full details in server logs only
        return ResponseEntity.status(500)
            .body(new ErrorResponse("An unexpected error occurred")); // Generic to client
    }
}
```

---

## A07 — Authentication Failures

```java
// Account lockout after N failed attempts
@Service
public class LoginAttemptService {
    private final int MAX_ATTEMPTS = 5;
    private final Duration LOCKOUT = Duration.ofMinutes(15);

    public void recordFailure(String username) {
        String key = "login_fail:" + username;
        Long count = redis.opsForValue().increment(key);
        if (count == 1) redis.expire(key, LOCKOUT);
        if (count >= MAX_ATTEMPTS) {
            redis.opsForValue().set("locked:" + username, "1", LOCKOUT);
        }
    }

    public boolean isLocked(String username) {
        return Boolean.TRUE.equals(redis.hasKey("locked:" + username));
    }
}
```

---

## A10 — SSRF (Server-Side Request Forgery)

```
# Feature: import image from URL
POST /api/import { "imageUrl": "http://169.254.169.254/latest/meta-data/iam/credentials" }
# Server fetches AWS EC2 metadata → leaks IAM credentials!
```

```java
@Service
public class SafeHttpClient {
    private static final Set<String> BLOCKED_HOSTS = Set.of(
        "169.254.169.254", "metadata.google.internal",
        "localhost", "127.0.0.1", "::1", "0.0.0.0"
    );

    public byte[] fetchExternalResource(String urlString) throws Exception {
        URL url = new URL(urlString);

        if (!Set.of("https").contains(url.getProtocol())) {
            throw new SecurityException("Only HTTPS URLs allowed");
        }

        InetAddress address = InetAddress.getByName(url.getHost());
        if (BLOCKED_HOSTS.contains(url.getHost())
                || isPrivateAddress(address)) {
            throw new SecurityException("Access to internal resources denied");
        }

        return restTemplate.getForObject(urlString, byte[].class);
    }

    private boolean isPrivateAddress(InetAddress addr) {
        return addr.isLoopbackAddress() || addr.isLinkLocalAddress()
            || addr.isSiteLocalAddress() || addr.isAnyLocalAddress();
    }
}
```

---

## XSS — Cross-Site Scripting

| Type | Persistence | Source |
|---|---|---|
| **Stored** | DB | Comment, profile bio — highest impact |
| **Reflected** | URL parameter | Search query reflected in response |
| **DOM-based** | Client-side only | JS reads URL, writes to DOM |

```java
// ✅ Thymeleaf auto-escapes — use th:text, not th:utext
// <p th:text="${userComment}">...</p>

// ✅ Content Security Policy
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; " +
        "script-src 'self'; " +
        "object-src 'none'; " +
        "frame-ancestors 'none'"
    ))
);

// ✅ Sanitize user-provided HTML (rich text editor)
PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);
String safeHtml = policy.sanitize(userProvidedHtml);
```

---

## CSRF — Cross-Site Request Forgery

```html
<!-- On attacker's site — victim's browser auto-sends session cookie -->
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="amount" value="10000">
  <input type="hidden" name="to" value="attacker">
</form>
<script>document.forms[0].submit();</script>
```

```java
// ✅ SameSite=Lax or Strict cookie → browser won't send cross-site
// ✅ For traditional web apps — synchronizer CSRF token
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
);
// SPA reads XSRF-TOKEN cookie, sends as X-XSRF-TOKEN header

// ✅ For stateless JWT APIs — CSRF is NOT needed
// JWT is sent via Authorization header (not a cookie), browser won't auto-send it
http.csrf(AbstractHttpConfigurer::disable); // OK for JWT-only APIs
```

---

## Interview Questions

1. What is SQL injection and how do you prevent it in Spring Boot?
2. What is the difference between Stored XSS, Reflected XSS, and DOM-based XSS?
3. What is CSRF? When does it NOT apply (JWT + stateless API)?
4. What is SSRF? Give a cloud metadata attack example.
5. What is an IDOR vulnerability? Give a real-world example.
6. What HTTP security headers should every web application include?
7. Why is Java object deserialization dangerous?
8. What is the purpose of Content Security Policy (CSP)?
9. How does clickjacking work and what prevents it?
10. What should and should not be included in error messages returned to clients?
11. How do you detect and defend against credential stuffing attacks?
12. What is the difference between `403` and `404` when returning an unauthorized resource access response — and why might you prefer `404`?
