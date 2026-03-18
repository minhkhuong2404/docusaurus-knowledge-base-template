---
id: api-security
title: API Security
sidebar_label: API Security
description: Security patterns for REST and GraphQL APIs — input validation, mass assignment prevention, API keys, rate limiting, MLE for APIs, request signing, GraphQL security, and OWASP API Top 10.
tags: [api-security, api-keys, rate-limiting, input-validation, mass-assignment, graphql, owasp-api, spring-validation, mle, request-signing]
---

# API Security

> APIs are the #1 attack surface for modern applications. They expose business logic and data directly.

---

## OWASP API Security Top 10 (2023)

| # | Risk | Description |
|---|---|---|
| API1 | Broken Object Level Authorization | Access other users' resources via ID manipulation (IDOR) |
| API2 | Broken Authentication | Weak or missing auth tokens |
| API3 | Broken Object Property Level Auth | Read/write fields you shouldn't have access to |
| API4 | Unrestricted Resource Consumption | No rate limiting → memory/CPU exhaustion |
| API5 | Broken Function Level Authorization | Regular user calls admin endpoints |
| API6 | Unrestricted Access to Sensitive Flows | Bots abuse legitimate flows (bulk buying) |
| API7 | Server-Side Request Forgery | API fetches attacker-controlled URL |
| API8 | Security Misconfiguration | Defaults, verbose errors, no HTTPS |
| API9 | Improper Inventory Management | Forgotten, undocumented APIs with no auth |
| API10 | Unsafe Consumption of APIs | Trusting third-party API data without validation |

**BOLA (API1) vs BFLA (API5):**
- **BOLA** — you can access a resource you shouldn't (another user's order)
- **BFLA** — you can call a function you shouldn't (admin endpoint as regular user)

---

## Input Validation

```java
@Data
public class CreateUserRequest {
    @NotBlank
    @Size(min = 2, max = 100)
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Name contains invalid characters")
    private String name;

    @NotBlank
    @Email
    @Size(max = 254)  // RFC 5321 max
    private String email;

    @NotBlank
    @Size(min = 12, max = 128)
    private String password;

    @Min(0) @Max(150)
    private Integer age;
}

@PostMapping("/users")
public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest req) {
    return ResponseEntity.status(201).body(userService.create(req));
}

@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
    List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
        .collect(toList());
    return ResponseEntity.badRequest().body(new ErrorResponse("Validation failed", errors));
}
```

### File Upload Validation

```java
@PostMapping("/upload")
public ResponseEntity<String> uploadFile(@RequestParam MultipartFile file) {
    if (file.getSize() > 10 * 1024 * 1024) {  // 10 MB
        throw new BadRequestException("File too large");
    }

    // Validate content type via MIME sniffing (not just extension)
    String detectedType = tika.detect(file.getInputStream());
    if (!Set.of("image/jpeg", "image/png", "application/pdf").contains(detectedType)) {
        throw new BadRequestException("File type not allowed");
    }

    // Rename file — NEVER trust original filename (path traversal risk)
    String safeFilename = UUID.randomUUID() + getExtension(detectedType);

    // Store OUTSIDE web root
    Path destination = storageRoot.resolve(safeFilename).normalize();
    if (!destination.startsWith(storageRoot)) {
        throw new SecurityException("Path traversal detected");
    }
    Files.copy(file.getInputStream(), destination);
    return ResponseEntity.ok(safeFilename);
}
```

---

## Mass Assignment Prevention

```java
// ❌ Vulnerable — attacker sends: { "role": "ADMIN", "creditBalance": 99999 }
@PutMapping("/users/{id}")
public User update(@PathVariable Long id, @RequestBody User user) {
    return userRepository.save(user); // Overwrites ALL fields including role!
}

// ✅ Explicit DTOs — only include fields that should be updatable
@Data
public class UpdateProfileRequest {
    @Size(max = 100) private String name;
    @Size(max = 500) private String bio;
    // NO role, NO creditBalance, NO admin flag
}

@PutMapping("/users/{id}")
public UserResponse update(@PathVariable Long id,
        @Valid @RequestBody UpdateProfileRequest req,
        @AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findById(id).orElseThrow();
    verifyOwnership(user, principal);
    user.setName(req.getName());
    user.setBio(req.getBio());
    // Role is NOT updated — it's not in the DTO
    return mapper.toResponse(userRepository.save(user));
}
```

---

## Sensitive Data in API Responses

```java
// ❌ Returns passwordHash, SSN, internalFlags, etc.
public User getUser(Long id) {
    return userRepository.findById(id);
}

// ✅ Explicit response DTO — only safe fields
@Data
public class UserPublicResponse {
    private Long id;
    private String name;
    private String avatarUrl;
    // NO email (unless authorized), NO password hash, NO SSN
}

// ✅ Jackson annotations to never serialize sensitive fields
@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
private String password;  // Accepted in requests, never in responses

@JsonIgnore
private String internalApiKey;
```

---

## API Keys

```java
@Service
public class ApiKeyService {

    public ApiKey generate(Long userId) {
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        String rawKey = "sk_live_" + Base64.getUrlEncoder()
            .withoutPadding().encodeToString(keyBytes);

        // Store HASHED — never store raw key in DB
        String keyHash = DigestUtils.sha256Hex(rawKey);
        apiKeyRepository.save(new ApiKey(userId, keyHash));

        // Return raw key to user ONCE — cannot be retrieved again
        return new ApiKeyCreationResponse(rawKey);
    }

    public Optional<Long> authenticate(String rawKey) {
        String hash = DigestUtils.sha256Hex(rawKey);
        return apiKeyRepository.findByKeyHash(hash)
            .filter(k -> !k.isRevoked())
            .map(ApiKey::getUserId);
    }
}
```

---

## Rate Limiting

```java
@Component
public class MultiTierRateLimiter {

    // Tier 1: Per-IP — anti-scraping
    public boolean checkIpLimit(String ip) {
        Bucket bucket = getOrCreate("ip:" + ip,
            Bandwidth.classic(1000, Refill.greedy(1000, Duration.ofHours(1))));
        return bucket.tryConsume(1);
    }

    // Tier 2: Per-User by subscription tier
    public boolean checkUserLimit(Long userId, ApiTier tier) {
        int limit = switch (tier) {
            case FREE    -> 100;
            case BASIC   -> 1_000;
            case PRO     -> 10_000;
            case ENTERPRISE -> 100_000;
        };
        return getOrCreate("user:" + userId,
            Bandwidth.classic(limit, Refill.greedy(limit, Duration.ofHours(1))))
            .tryConsume(1);
    }

    // Tier 3: Per-Endpoint — expensive operations get stricter limits
    public boolean checkEndpointLimit(String userId, String endpoint) {
        Map<String, Integer> endpointLimits = Map.of(
            "/api/export", 10,
            "/api/report", 5
        );
        int limit = endpointLimits.getOrDefault(endpoint, 1000);
        return getOrCreate("endpoint:" + userId + ":" + endpoint,
            Bandwidth.classic(limit, Refill.greedy(limit, Duration.ofHours(1))))
            .tryConsume(1);
    }
}
```

---

## Request Signing (High-Security APIs)

Used when you need proof that a specific client sent a specific request at a specific time. Prevents replay attacks and tampering.

```java
// HMAC-based request signing (similar to AWS Signature v4)
public class RequestSigner {
    public void signRequest(HttpRequest request, String apiKey, String secretKey) {
        String timestamp = Instant.now().toString();
        String nonce     = UUID.randomUUID().toString();

        String canonicalRequest = request.getMethod()    + "\n"
            + request.getUri().getPath()                 + "\n"
            + timestamp                                  + "\n"
            + nonce                                      + "\n"
            + sha256Hex(readBody(request));

        String signature = hmacSha256(secretKey, canonicalRequest);

        request.addHeader("X-Api-Key",   apiKey);
        request.addHeader("X-Timestamp", timestamp);
        request.addHeader("X-Nonce",     nonce);
        request.addHeader("X-Signature", "v1=" + signature);
    }
}

// Server-side verification
public void verifySignature(HttpRequest req) {
    String timestamp = req.getHeader("X-Timestamp");

    // Reject requests older than 5 minutes — replay protection
    if (Instant.parse(timestamp).isBefore(Instant.now().minus(5, MINUTES))) {
        throw new SecurityException("Request expired");
    }

    // Check nonce hasn't been used before (store in Redis with TTL)
    String nonce = req.getHeader("X-Nonce");
    if (Boolean.TRUE.equals(redis.hasKey("used_nonce:" + nonce))) {
        throw new SecurityException("Nonce already used — replay detected");
    }
    redis.opsForValue().set("used_nonce:" + nonce, "1", Duration.ofMinutes(10));

    // Verify HMAC ...
}
```

---

## GraphQL Security

### Introspection (Disable in Production)

```java
@Bean
public GraphQlSource graphQlSource() {
    return GraphQlSource.schemaResourceBuilder()
        .configureRuntimeWiring(wiring -> wiring
            .fieldVisibility(isProduction
                ? NoIntrospectionGraphqlFieldVisibility.NO_INTROSPECTION_FIELD_VISIBILITY
                : DEFAULT_FIELD_VISIBILITY)
        )
        .build();
}
```

### Query Depth & Complexity Limiting

```java
// Prevent deeply nested queries: { user { friends { friends { friends { ... }}}}}
@Bean
public Instrumentation queryDepthInstrumentation() {
    return new MaxQueryDepthInstrumentation(10);
}

@Bean
public Instrumentation queryComplexityInstrumentation() {
    return new MaxQueryComplexityInstrumentation(200);
}
```

---

## Interview Questions

1. What is the OWASP API Security Top 10? Describe API1, API4, and API5.
2. What is mass assignment and how do you prevent it in Spring Boot?
3. How do you validate file uploads securely? What is path traversal?
4. Why should API keys be stored hashed, not in plaintext?
5. What are the unique security concerns of GraphQL APIs compared to REST?
6. How do you implement multi-tier rate limiting?
7. How do you prevent over-fetching of sensitive data in API responses?
8. What is request signing and when is it needed?
9. What is the difference between BOLA (API1) and BFLA (API5)?
10. How does nonce-based replay protection work in request signing?
