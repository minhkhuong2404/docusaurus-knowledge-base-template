---
id: api-security
title: API Security
sidebar_label: API Security
description: Security patterns specific to REST and GraphQL APIs — API keys, rate limiting, input validation, schema validation, mass assignment, sensitive data exposure, API versioning security, and API gateway hardening.
tags: [api-security, api-keys, rate-limiting, input-validation, mass-assignment, graphql-security, owasp-api, spring-validation]
---

# API Security

> APIs are the #1 attack surface for modern applications. They expose business logic and data directly.

---

## OWASP API Security Top 10 (2023)

| # | Risk | Description |
|---|---|---|
| API1 | Broken Object Level Authorization | Access other users' resources via ID manipulation |
| API2 | Broken Authentication | Weak or missing auth tokens |
| API3 | Broken Object Property Level Auth | Can read/write fields you shouldn't have access to |
| API4 | Unrestricted Resource Consumption | No rate limiting, memory/CPU exhaustion |
| API5 | Broken Function Level Authorization | Regular user calls admin endpoints |
| API6 | Unrestricted Access to Sensitive Business Flows | Bots abuse legitimate flows (e.g., bulk buying) |
| API7 | Server-Side Request Forgery | API fetches attacker-controlled URL |
| API8 | Security Misconfiguration | Defaults, verbose errors, no HTTPS |
| API9 | Improper Inventory Management | Forgotten, undocumented APIs with no auth |
| API10 | Unsafe Consumption of APIs | Trusting third-party API data without validation |

---

## Input Validation

Every byte entering your API is untrusted. Validate at the boundary.

```java
// ✅ Use Bean Validation (JSR-380) on all DTOs
@Data
public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Name contains invalid characters")
    private String name;

    @NotBlank
    @Email(message = "Valid email required")
    @Size(max = 254)  // RFC 5321 max
    private String email;

    @NotBlank
    @Size(min = 12, max = 128, message = "Password must be 12-128 characters")
    private String password;

    @Min(0) @Max(150)
    private Integer age;

    @NotNull
    @Pattern(regexp = "^\\+?[1-9]\\d{7,14}$", message = "Invalid phone number")
    private String phoneNumber;
}

// ✅ Apply validation in controller
@PostMapping("/users")
public ResponseEntity<UserResponse> createUser(
        @Valid @RequestBody CreateUserRequest req) {
    // If validation fails, Spring returns 400 with field-level errors
    return ResponseEntity.status(201).body(userService.create(req));
}

// ✅ Consistent validation error response
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidationErrors(
        MethodArgumentNotValidException ex) {
    List<FieldError> errors = ex.getBindingResult().getFieldErrors()
        .stream()
        .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
        .collect(toList());
    return ResponseEntity.badRequest()
        .body(new ErrorResponse("Validation failed", errors));
}
```

### File Upload Validation
```java
@PostMapping("/upload")
public ResponseEntity<String> uploadFile(@RequestParam MultipartFile file) {
    // ✅ Check file size
    if (file.getSize() > 10 * 1024 * 1024) { // 10 MB
        throw new BadRequestException("File too large");
    }

    // ✅ Validate content type (MIME sniff, not just extension)
    String detectedType = tika.detect(file.getInputStream());
    if (!ALLOWED_TYPES.contains(detectedType)) {
        throw new BadRequestException("File type not allowed: " + detectedType);
    }

    // ✅ Rename file — never trust original filename (path traversal)
    String safeFilename = UUID.randomUUID() + getExtension(detectedType);

    // ✅ Store outside web root
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

Attacker injects extra fields (e.g., `role`, `admin`) into request body.

```java
// ❌ Vulnerable — maps entire request body to entity
@PutMapping("/users/{id}")
public User update(@PathVariable Long id, @RequestBody User user) {
    // Attacker sends: { "name": "Alice", "role": "ADMIN", "creditBalance": 99999 }
    return userRepository.save(user); // OVERWRITES role and creditBalance!
}

// ✅ Use explicit DTOs — only include fields that should be updatable
@Data
public class UpdateProfileRequest {
    @Size(max = 100) private String name;
    @Size(max = 500) private String bio;
    // NO role, NO creditBalance, NO admin, etc.
}

@PutMapping("/users/{id}")
public UserResponse update(@PathVariable Long id,
        @Valid @RequestBody UpdateProfileRequest req,
        @AuthenticationPrincipal UserDetails principal) {
    // Only update whitelisted fields
    User user = userRepository.findById(id).orElseThrow();
    verifyOwnership(user, principal);

    user.setName(req.getName());
    user.setBio(req.getBio());
    // Role NOT updated — not in DTO
    return mapper.toResponse(userRepository.save(user));
}
```

---

## API Keys

For programmatic access. Different from user auth — identify the calling application.

```java
// API key generation
@Service
public class ApiKeyService {
    public ApiKey generate(Long userId, String description) {
        // Generate cryptographically secure key
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        String rawKey = "sk_live_" + Base64.getUrlEncoder()
            .withoutPadding().encodeToString(keyBytes);

        // Store hashed (never store raw key)
        String keyHash = DigestUtils.sha256Hex(rawKey);
        apiKeyRepository.save(new ApiKey(userId, keyHash, description));

        // Show raw key to user ONCE — never retrievable again
        return new ApiKey(rawKey); // Return raw only on creation
    }

    public Optional<Long> authenticate(String rawKey) {
        String hash = DigestUtils.sha256Hex(rawKey);
        return apiKeyRepository.findByKeyHash(hash)
            .filter(k -> !k.isRevoked())
            .map(ApiKey::getUserId);
    }
}

// API key filter
@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, ...) {
        String apiKey = req.getHeader("X-API-Key");
        if (apiKey != null) {
            apiKeyService.authenticate(apiKey).ifPresent(userId -> {
                // Set security context
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userId, null,
                        List.of(new SimpleGrantedAuthority("ROLE_API")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(req, response);
    }
}
```

---

## Rate Limiting (Advanced Patterns)

```java
// Multi-tier rate limiting
@Component
public class MultiTierRateLimiter {
    // Tier 1: Global — protect infrastructure
    private final RateLimiter globalLimiter = RateLimiter.of("global",
        RateLimiterConfig.custom()
            .limitForPeriod(100_000)
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .build());

    // Tier 2: Per-IP — protect against scraping
    public boolean checkIpLimit(String ip) {
        Bucket bucket = getOrCreate("ip:" + ip,
            Bandwidth.classic(1000, Refill.greedy(1000, Duration.ofHours(1))));
        return bucket.tryConsume(1);
    }

    // Tier 3: Per-User (authenticated)
    public boolean checkUserLimit(Long userId, ApiTier tier) {
        int limit = switch (tier) {
            case FREE    -> 100;
            case BASIC   -> 1_000;
            case PRO     -> 10_000;
            case ENTERPRISE -> 100_000;
        };
        Bucket bucket = getOrCreate("user:" + userId,
            Bandwidth.classic(limit, Refill.greedy(limit, Duration.ofHours(1))));
        return bucket.tryConsume(1);
    }

    // Tier 4: Per-Endpoint — expensive endpoints get stricter limits
    public boolean checkEndpointLimit(String userId, String endpoint) {
        Map<String, Integer> endpointLimits = Map.of(
            "/api/export", 10,      // Expensive operation: 10/hour
            "/api/search", 500,     // Search: 500/hour
            "/api/report", 5        // Reports: 5/hour
        );
        int limit = endpointLimits.getOrDefault(endpoint, 1000);
        return getOrCreate("endpoint:" + userId + ":" + endpoint,
            Bandwidth.classic(limit, Refill.greedy(limit, Duration.ofHours(1))))
            .tryConsume(1);
    }
}
```

---

## GraphQL Security

GraphQL has unique security considerations compared to REST.

### Introspection (Disable in Production)
```java
@Bean
public GraphQlSource graphQlSource() {
    return GraphQlSource.schemaResourceBuilder()
        .schemaResources(new ClassPathResource("schema.graphqls"))
        .configureRuntimeWiring(wiring -> wiring
            // Disable introspection in production
            .fieldVisibility(isProduction ?
                NoIntrospectionGraphqlFieldVisibility.NO_INTROSPECTION_FIELD_VISIBILITY :
                DEFAULT_FIELD_VISIBILITY)
        )
        .build();
}
```

### Query Depth & Complexity Limiting
```java
// Prevent deeply nested queries (DoS via query complexity)
// { user { friends { friends { friends { ... }}}}}
@Bean
public Instrumentation queryDepthInstrumentation() {
    return new MaxQueryDepthInstrumentation(10); // Max 10 levels deep
}

@Bean
public Instrumentation queryComplexityInstrumentation() {
    return new MaxQueryComplexityInstrumentation(200); // Max complexity score
}
```

### Field-Level Authorization
```java
@Component
public class UserDataFetcher implements DataFetcher<UserDTO> {
    @Override
    public UserDTO get(DataFetchingEnvironment env) {
        Long requestedUserId = env.getArgument("id");
        Authentication auth = getAuthentication(env);

        UserDTO user = userService.findById(requestedUserId);

        // Field-level masking based on authorization
        if (!isAdmin(auth) && !isOwner(auth, requestedUserId)) {
            user.setEmail(maskEmail(user.getEmail())); // Mask sensitive fields
            user.setSsn(null);                          // Remove restricted field
        }
        return user;
    }
}
```

### Batching Attack Prevention (N+1 / DoS)
```java
// Use DataLoader to batch DB queries — prevents N+1 AND DoS via batching limits
@Bean
public DataLoader<Long, User> userDataLoader() {
    BatchLoaderWithContext<Long, User> batchLoader = (ids, env) -> {
        // One DB call for all IDs — no N+1
        return CompletableFuture.supplyAsync(() ->
            userRepository.findAllById(ids));
    };
    return DataLoaderFactory.newDataLoader(batchLoader,
        DataLoaderOptions.newOptions().setMaxBatchSize(100)); // Limit batch size
}
```

---

## Sensitive Data in API Responses

```java
// ❌ Never return more than needed
public User getUser(Long id) {
    return userRepository.findById(id); // Returns passwordHash, SSN, etc.!
}

// ✅ Use response DTOs — project only safe fields
@Data
public class UserPublicResponse {
    private Long id;
    private String name;
    private String avatarUrl;
    // NO email (unless requested and authorized)
    // NO passwordHash
    // NO SSN
    // NO internalFlags
}

// ✅ Annotate sensitive fields to exclude from serialization
@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
private String password; // Accepted on input, never included in output

@JsonIgnore
private String internalApiKey;
```

---

## Request Signing

For high-security APIs (financial, internal service auth).

```java
// HMAC-based request signing (like AWS Signature v4)
public class RequestSigner {
    public void signRequest(HttpRequest request, String apiKey, String secretKey) {
        String timestamp = Instant.now().toString();
        String nonce = UUID.randomUUID().toString();

        String canonicalRequest = request.getMethod() + "\n"
            + request.getUri().getPath() + "\n"
            + timestamp + "\n"
            + nonce + "\n"
            + hashBody(request);

        String signature = hmacSha256(secretKey, canonicalRequest);

        request.addHeader("X-Api-Key", apiKey);
        request.addHeader("X-Timestamp", timestamp);
        request.addHeader("X-Nonce", nonce);
        request.addHeader("X-Signature", "v1=" + signature);
    }
}

// Server-side verification
public void verifySignature(HttpRequest req) {
    String timestamp = req.getHeader("X-Timestamp");
    // Reject requests older than 5 minutes (replay attack prevention)
    if (Instant.parse(timestamp).isBefore(Instant.now().minus(5, MINUTES))) {
        throw new SecurityException("Request timestamp too old");
    }
    // Verify HMAC...
}
```

---

## Interview Questions

1. What is the OWASP API Security Top 10? Name 3 items.
2. What is mass assignment and how do you prevent it in Spring Boot?
3. How do you validate file uploads securely?
4. Why should API keys be stored hashed, not in plaintext?
5. What are the unique security concerns of GraphQL APIs compared to REST?
6. How do you implement multi-tier rate limiting?
7. How do you prevent over-fetching of sensitive data in API responses?
8. What is request signing and when is it needed?
9. What is the difference between BOLA (API1) and BFLA (API5)?
10. How do you protect an API against credential stuffing via the login endpoint?
