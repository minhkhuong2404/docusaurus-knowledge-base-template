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

**Q1: What is SQL injection and how do you prevent it in Spring Boot?**

> **SQL Injection (SQLi)** occurs when untrusted user input is directly concatenated into a SQL statement, allowing the database query execution planner to interpret the input as executable SQL code.
>
> **Prevention in Spring Boot:**
> 1. **Use Parameterized Queries (Prepared Statements):** Spring Data JPA (Hibernate) and JDBC Template use prepared statements automatically when using standard repository query methods or binding variables using `@Param` in custom `@Query` annotations. Parameters are treated strictly as literals, never executable code.
> 2. **Avoid Native Query Concatenation:** Never build queries using raw string concatenation like `"SELECT * FROM users WHERE username = '" + userInput + "'"`. If you must write native queries, bind parameters via `:paramName`.
> 3. **Input Sanitization/Validation:** Use validation rules (e.g. `@Pattern` regex validations) to restrict allowed characters.

---

**Q2: What is the difference between Stored XSS, Reflected XSS, and DOM-based XSS?**

> * **Stored XSS (Persistent):** The malicious script is permanently stored in the database (e.g., in a comment field or profile description). The server returns the payload to any user visiting the page, executing the script in their browser.
> * **Reflected XSS (Non-persistent):** The script is part of a request parameter (e.g., search terms or error messages in URL parameters). The server immediately reflects this script back to the browser in the HTTP response without storing it. Attackers trick victims into clicking a crafted link.
> * **DOM-based XSS:** The vulnerability exists entirely on the client-side JavaScript layer. The client script reads input from the DOM (e.g., `window.location.hash`) and unsafely updates the page (e.g. using `document.write()` or `.innerHTML = input`) without any server involvement.

---

**Q3: What is CSRF? When does it NOT apply (JWT + stateless API)?**

> **CSRF (Cross-Site Request Forgery)** is an attack where a malicious third-party site tricks a victim's browser into executing an unauthorized action on a target site where the victim is currently authenticated. Browsers automatically attach cookies (including session cookies) to all requests matching the target domain, so the server processes the forged request as authenticated.
>
> **When it does NOT apply:** If the API uses stateless JWTs sent inside the HTTP `Authorization: Bearer <token>` header, CSRF is impossible. Browsers only auto-send cookies, not custom headers. Since the third-party site cannot read the token from client storage due to browser sandbox limits, it cannot attach the required bearer token header.

---

**Q4: What is SSRF? Give a cloud metadata attack example.**

> **SSRF (Server-Side Request Forgery)** occurs when an attacker forces a server-side application to make HTTP requests to arbitrary domains (often internal resources that are not accessible from the public internet).
>
> **Cloud Metadata Attack Example:** Cloud instances (AWS, GCP) expose a local metadata endpoint (e.g. `http://169.254.169.254/`). If an application accepts a URL from a user (e.g., for fetching a profile image) and requests it without validation, the attacker can supply the metadata URL. The server fetches and returns internal AWS IAM credentials, giving the attacker control over the cloud environment.

---

**Q5: What is an IDOR vulnerability? Give a real-world example.**

> **IDOR (Insecure Direct Object Reference)** occurs when an application exposes reference IDs to internal database records in URL routes or request bodies without verifying if the requesting user has permission to access that specific resource.
>
> **Real-World Example:** An endpoint `/api/invoices/1001` fetches user 1001's invoice. An attacker changes the ID to `/api/invoices/1002`. If the backend only verifies that the user is logged in (authenticated) but doesn't check if invoice 1002 actually belongs to the logged-in user, the attacker accesses another customer's invoice data.

---

**Q6: What HTTP security headers should every web application include?**

> Every application should include these headers to enhance client-side defenses:
> * **`Content-Security-Policy (CSP)`:** Restricts allowed resource origins (JS, CSS, images) to block XSS and clickjacking.
> * **`Strict-Transport-Security (HSTS)`:** Forces browsers to communicate only over secure HTTPS, preventing SSL stripping.
> * **`X-Content-Type-Options: nosniff`:** Prevents MIME-sniffing attacks where browsers try to execute non-executable files (like images) as script.
> * **`X-Frame-Options: DENY` or `SAMEORIGIN`:** Prevents the page from being embedded inside an iframe on other domains, defending against clickjacking.
> * **`Referrer-Policy: no-referrer-when-downgrade`:** Controls referrer information sent on outgoing link clicks.

---

**Q7: Why is Java object deserialization dangerous?**

> Java serialization allows converting a live object graph into a binary stream. If an application deserializes untrusted streams (`ObjectInputStream.readObject()`), the JVM instantiates objects and calls lifecycle hooks (like `readObject()`, `finalize()`, or hashcode computations) before any validation. If the classpath contains "gadget classes" (classes that perform file, command, or network actions during initialization), an attacker can craft a payload triggering **Remote Code Execution (RCE)**.
>
> **Mitigation:** Avoid Java serialization for network protocols. Use JSON/Protocol Buffers. If Java serialization is mandatory, configure custom object input filters (`ObjectInputFilter`) to block blacklisted classes.

---

**Q8: What is the purpose of Content Security Policy (CSP)?**

> **CSP** is an HTTP response header that lets server administrators restrict which dynamic resources are allowed to load and execute in the user's browser. It is a powerful defense-in-depth tool against XSS:
> * It blocks inline scripts (e.g., `<script>alert(1)</script>` or `onclick="..."`) unless signed with a matching cryptographically secure nonce or hash.
> * It blocks the execution of `eval()` or string-to-code conversions.
> * It restricts connection endpoints (`connect-src`) to prevent scripts from exfiltrating stolen cookies/tokens to attacker-controlled servers.

---

**Q9: How does clickjacking work and what prevents it?**

> **Clickjacking (User Interface redress attack)** is an attack where a malicious site embeds the target site inside an invisible iframe overlaying a deceptive UI. When the user clicks on a decoy button (e.g., "Win a free phone"), they are actually clicking on a hidden, high-privilege action on the embedded target site (e.g., "Delete Account" or "Send Transfer").
>
> **Prevention:**
> 1. Use the `X-Frame-Options: DENY` or `SAMEORIGIN` header to block embedding.
> 2. Use the CSP `frame-ancestors 'none'` or `'self'` directive (the modern standard replacing X-Frame-Options).

---

**Q10: What should and should not be included in error messages returned to clients?**

> * **Should Include:** A generic user-friendly description, a correlation ID (for tracing logs), an API error sub-code, and a timestamp.
> * **Should NOT Include:** Stack traces, internal server class names, database connection string variables, SQL query snippets, or runtime exception details. Exposing stack traces gives attackers a blueprint of your technology stack, database configuration, and library dependencies, significantly simplifying exploit discovery.

---

**Q11: How do you detect and defend against credential stuffing attacks?**

> Credential stuffing is an automated attack where bots test millions of compromised username/password pairs stolen from other breaches against your login endpoint.
>
> **Defense Strategy:**
> 1. **Rate Limiting:** Throttle requests on login endpoints based on IP address and targeted usernames.
> 2. **CAPTCHA:** Enforce interactive challenges (reCAPTCHA v3) if unusual request spikes or failure rates are detected.
> 3. **Device Fingerprinting:** Flag logins from new locations, user agents, or devices.
> 4. **Leaked Credential Checks:** Intercept login requests and compare hashes against databases of known leaked credentials (e.g. HaveIBeenPwned API) to force reset password.

---

**Q12: What is the difference between `403` and `404` when returning an unauthorized resource access response — and why might you prefer `404`?**

> * **`403 Forbidden`** indicates that the resource exists, the user is authenticated, but they lack permission. This confirms the resource's existence to an attacker (e.g., `/api/documents/sensitive-confidential-report` returns 403, indicating the report exists).
> * **`404 Not Found`** indicates the resource does not exist (or the server is pretending it doesn't).
>
> **Why prefer 404:** To prevent **information disclosure** (enumeration attacks). If an unauthorized user queries a resource ID they do not own, returning 404 hides the existence of that resource entirely, reducing the attack surface. Many security standards recommend returning 404 instead of 403 for object-level unauthorized requests.
