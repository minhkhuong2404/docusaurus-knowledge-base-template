---
id: redis-session-management
title: "Session Management"
slug: redis-session-management
description: "Managing distributed sessions with Redis and Spring Session, including security best practices and programmatic control."
tags: [redis, session-management, pattern, spring-boot, backend]
---

# Session Management with Redis

Redis is the most popular choice for distributed session storage in horizontally-scaled web applications. Spring Session provides first-class integration.

## The Problem with Sticky Sessions

```
Without Redis sessions (local session):
  User → Load Balancer → Instance A (session stored locally)
  Next request → Instance B (no session → forced login!)

With Redis sessions:
  User → Load Balancer → Instance A → reads/writes from Redis
  Next request → Instance B → reads/writes from same Redis → seamless!
```

---

## Spring Session with Redis

### Dependency

```xml
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### Configuration

```java
@Configuration
@EnableRedisHttpSession(
    maxInactiveIntervalInSeconds = 3600  // 1 hour idle timeout
)
public class SessionConfig {

    // Spring Session auto-configures with your RedisConnectionFactory bean
}
```

Or via `application.yml`:

```yaml
spring:
  session:
    store-type: redis
    redis:
      namespace: "spring:session"        # key prefix in Redis
      flush-mode: on-save                # or immediate
    timeout: 3600s                       # session TTL
  data:
    redis:
      host: localhost
      port: 6379
```

That's it — all `HttpSession` operations now use Redis automatically.

---

## Custom Session Operations

```java
@RestController
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req,
                                    HttpSession session) {
        User user = authService.authenticate(req.username(), req.password());

        session.setAttribute("userId", user.getId());
        session.setAttribute("roles", user.getRoles());
        session.setAttribute("loginTime", Instant.now().toString());

        return ResponseEntity.ok(Map.of("sessionId", session.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.findById(userId));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();   // removes from Redis
        return ResponseEntity.ok().build();
    }
}
```

---

## Programmatic Session Management

Manage sessions directly via Spring Session's `FindByIndexNameSessionRepository`:

```java
@Service
public class SessionManagementService {

    @Autowired
    private FindByIndexNameSessionRepository<? extends Session> sessionRepository;

    // Find all sessions for a user (requires principal name indexing)
    public Map<String, ? extends Session> getUserSessions(String username) {
        return sessionRepository
            .findByPrincipalName(username);
    }

    // Force logout a user from all devices
    public void invalidateAllSessions(String username) {
        sessionRepository.findByPrincipalName(username)
            .keySet()
            .forEach(sessionRepository::deleteById);
    }

    // Force logout from a specific session
    public void invalidateSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
    }
}
```

### Enable Principal Name Indexing

```java
@Configuration
@EnableRedisIndexedHttpSession
public class SessionConfig {
    // Enables findByPrincipalName queries
}
```

---

## Session Security

### Prevent Session Fixation

```java
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session
                .sessionFixation().migrateSession()   // new ID after login
                .maximumSessions(3)                   // max 3 concurrent sessions
                .sessionRegistry(sessionRegistry())
                .expiredSessionStrategy(event ->
                    event.getResponse()
                        .sendError(HttpStatus.UNAUTHORIZED.value(),
                                   "Session expired"))
            );
        return http.build();
    }

    @Bean
    public SpringSessionBackedSessionRegistry<?> sessionRegistry() {
        return new SpringSessionBackedSessionRegistry<>(sessionRepository);
    }
}
```

### Session Cookie Configuration

```yaml
server:
  servlet:
    session:
      cookie:
        http-only: true
        secure: true          # HTTPS only
        same-site: strict
        max-age: 3600
        name: SESSION
```

---

## Viewing Sessions in Redis

```bash
# List all session keys
redis-cli KEYS "spring:session:*"

# Get session data
redis-cli HGETALL "spring:session:sessions:abc123def456"

# Check TTL
redis-cli TTL "spring:session:sessions:abc123def456"

# Delete a specific session
redis-cli DEL "spring:session:sessions:abc123def456"
```

---

## Session Metrics

```java
@Component
@Slf4j
public class SessionMetrics {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Scheduled(fixedDelay = 60_000)
    public void reportActiveSessions() {
        Set<String> sessionKeys = redisTemplate.keys("spring:session:sessions:*");
        long activeCount = sessionKeys != null ? sessionKeys.size() : 0;

        log.info("Active sessions: {}", activeCount);
        // Report to Prometheus / CloudWatch / etc.
    }
}
```

---

## Comparison: Session Storage Options

| Storage | Scalability | Persistence | Speed | Setup |
|---|---|---|---|---|
| In-memory (local) | ❌ (sticky sessions) | ❌ | ✅ Fast | None |
| Redis | ✅ | ✅ Optional | ✅ Fast | Easy |
| Database (SQL) | ✅ | ✅ | ⚠️ Slower | Medium |
| Cookie (JWT) | ✅ | N/A (stateless) | ✅ Fast | Medium |

> **Best practice:** Use Redis sessions for stateful workloads. Use JWT for stateless APIs. Combine both — JWT for auth, Redis for rich session data.

---

## Interview Questions

### Q: When should a team choose Redis sessions over stateless JWT-only auth?
**A:** When server-side session invalidation, concurrent session control, or rich mutable session state is required.

### Q: What is the biggest operational risk in distributed session storage?
**A:** Redis unavailability can impact authentication flow, so HA design and fallback behavior are critical.

### Q: How do you implement secure global logout across devices?
**A:** Index sessions by principal and invalidate all associated session IDs atomically.

### Q: Why is session fixation protection mandatory after login?
**A:** It prevents attackers from reusing a pre-established session identifier.

### Q: How do you balance session TTL and user experience?
**A:** Use idle timeout with optional sliding renewal, constrained by security and compliance policy.

### Q: What monitoring should exist for session infrastructure?
**A:** Active session count, expiration rate, auth failure spikes, and Redis latency/error trends.
