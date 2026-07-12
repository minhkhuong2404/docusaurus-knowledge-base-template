---
id: spring-aop
title: "Spring AOP (Aspect-Oriented Programming)"
sidebar_label: Spring AOP
description: Comprehensive guide on Spring AOP — covering core concepts, proxy mechanics, pointcut expressions, advice types, alternatives comparison, and production deep dives for senior engineers.
tags: [spring, aop, aspect-oriented-programming, java, cross-cutting-concerns, proxy, cglib]
---
import SpringAopCoreConceptsDiagram from '@site/src/components/SpringAopCoreConceptsDiagram';
import SpringAopProxyStrategiesDiagram from '@site/src/components/SpringAopProxyStrategiesDiagram';


# Spring AOP (Aspect-Oriented Programming)

> **Aspect-Oriented Programming (AOP)** is a programming paradigm that separates **cross-cutting concerns** — logic that spans multiple layers of an application (logging, security, transactions, caching, metrics) — from the core business logic. In Spring, AOP is implemented via **proxies**: Spring wraps your beans in a proxy object that intercepts method calls and applies the cross-cutting behavior before, after, or around the actual method execution.

AOP does not replace Object-Oriented Programming. It complements it by handling the concerns that OOP cannot cleanly modularize — the things that tend to "scatter" across every class in the codebase.

---

## 👶 Beginner View: What is AOP?

Imagine you are building a restaurant ordering system. Every time a waiter takes an order, you need to:
1. **Log** the start and end of the action.
2. **Check** that the waiter is authenticated.
3. **Measure** how long the operation took.

**Without AOP:** You add logging, auth checks, and timing code inside every single service method. If you have 50 methods, you repeat this boilerplate 50 times. If the log format changes, you update 50 places.

```java
// ❌ Cross-cutting concerns scattered everywhere
public Order createOrder(CreateOrderCommand cmd) {
    log.info("START createOrder: {}", cmd);           // logging
    authService.assertAuthenticated();                // security
    long start = System.currentTimeMillis();          // metrics

    Order order = new Order(cmd); // ← actual business logic (1 line)
    orderRepository.save(order);

    long duration = System.currentTimeMillis() - start;
    metricsService.record("createOrder", duration);  // metrics
    log.info("END createOrder: {}ms", duration);     // logging
    return order;
}
```

**With AOP:** You write the logging, auth, and timing logic *once* in a dedicated **Aspect** class. Spring automatically applies it to every method you specify — without touching the methods themselves.

```java
// ✅ Business logic is clean
public Order createOrder(CreateOrderCommand cmd) {
    Order order = new Order(cmd);
    orderRepository.save(order);
    return order;
}

// Cross-cutting logic lives here — applied automatically
@Aspect
@Component
public class LoggingAspect {
    @Around("execution(* com.example.service.*.*(..))")
    public Object logExecutionTime(ProceedingJoinPoint pjp) throws Throwable {
        log.info("START {}", pjp.getSignature().getName());
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        log.info("END {} in {}ms", pjp.getSignature().getName(),
                System.currentTimeMillis() - start);
        return result;
    }
}
```

---

## 🧩 Core Concepts

Before writing any AOP code, you must understand the five building blocks. Every other concept flows from these.

| Concept | Definition | Analogy |
|---|---|---|
| **Aspect** | A class containing cross-cutting logic | The security guard at the door |
| **Advice** | The action the Aspect takes (`@Before`, `@After`, `@Around`) | What the guard actually does (checks ID, logs entry) |
| **Pointcut** | An expression that matches which method(s) to intercept | The rule "check everyone entering the VIP lounge" |
| **Join Point** | A specific method execution that matched the Pointcut | The moment Alice walks through the door |
| **Weaving** | The process of applying the Aspect to the target object | Installing the guard at the door |

<SpringAopCoreConceptsDiagram />

---

## ⚙️ How Spring AOP Works: The Proxy Mechanism

Spring AOP does **not** modify your class's bytecode directly. Instead, it wraps every bean that has a matching Aspect in a **proxy object**. Callers interact with the proxy, not your actual class.

Spring uses two proxying strategies:

<SpringAopProxyStrategiesDiagram />

```java
// spring.aop.proxy-target-class=true forces CGLIB even when interfaces exist
// @EnableAspectJAutoProxy(proxyTargetClass = true) does the same per-config
```

**Since Spring Boot 2.0**, CGLIB is the default for all beans, even those with interfaces. This prevents class-cast exceptions that occurred when code tried to cast a JDK proxy to the concrete type.

### The Self-Invocation Trap

Because AOP works via a proxy, a method calling *another method on the same class* bypasses the proxy entirely — the second method call goes directly to `this`, skipping all Advice.

```java
@Service
public class OrderService {

    @Transactional
    public void processOrderBatch(List<UUID> orderIds) {
        for (UUID id : orderIds) {
            processOrder(id); // ❌ Calls this.processOrder() — bypasses the proxy!
                              // The @Transactional on processOrder is IGNORED
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOrder(UUID orderId) {
        // ... business logic
    }
}
```

**Solutions:**

```java
// Option A — Inject the proxy into itself via @Lazy
@Service
public class OrderService {

    @Autowired @Lazy
    private OrderService self; // Spring injects the PROXY, not 'this'

    public void processOrderBatch(List<UUID> orderIds) {
        orderIds.forEach(id -> self.processOrder(id)); // ✅ Goes through the proxy
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOrder(UUID orderId) { /* ... */ }
}

// Option B — Extract the method into a separate Spring-managed bean
@Service
public class OrderProcessor {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOrder(UUID orderId) { /* ... */ }
}
```

---

## ⚖️ Alternatives & When to Choose What

Spring AOP is one of several mechanisms for applying cross-cutting behavior. Knowing the alternatives prevents over-engineering.

### Comparison Matrix

| Criterion | Servlet Filter | Spring Interceptor | Spring AOP | Manual Decorator |
|---|---|---|---|---|
| **Scope** | HTTP request/response only | Spring MVC layer only | Any Spring bean method | Any code |
| **Granularity** | URL pattern | Controller method | Any method (any bean) | Explicit per-class |
| **Access to method args** | ❌ No | ✅ Yes | ✅ Yes (via JoinPoint) | ✅ Yes |
| **Works on non-web beans** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Access to Spring context** | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Yes |
| **Overhead** | Very low | Low | Low (proxy call) | Zero |
| **Implicit / Explicit** | Implicit (filter chain) | Implicit (interceptor chain) | Implicit (proxy) | Explicit |
| **Debugging ease** | Easy | Easy | Hard (proxy stack) | Easy |
| **Supports @annotation targeting** | ❌ No | ❌ No | ✅ Yes | ❌ No |

---

### 1. Servlet Filter (`javax.servlet.Filter`)

Intercepts raw HTTP requests and responses before they reach the Spring MVC dispatcher. Operates at the servlet container level.

```java
@Component
@Order(1)
public class RequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        log.info("Incoming: {} {}", req.getMethod(), req.getRequestURI());
        long start = System.currentTimeMillis();
        chain.doFilter(request, response);
        log.info("Completed in {}ms", System.currentTimeMillis() - start);
    }
}
```

**Choose Filters when:** you need to intercept at the HTTP level — rate limiting, CORS headers, request body compression, authentication token extraction, access logging. Filters cannot see Spring beans or method signatures.

---

### 2. Spring MVC `HandlerInterceptor`

Intercepts requests after the DispatcherServlet routes them but before the controller method executes. Has pre/post/afterCompletion hooks and access to the `HandlerMethod`.

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        if (handler instanceof HandlerMethod hm) {
            if (hm.hasMethodAnnotation(RequiresRole.class)) {
                RequiresRole ann = hm.getMethodAnnotation(RequiresRole.class);
                if (!securityContext.hasRole(ann.value())) {
                    response.setStatus(403);
                    return false; // Abort request
                }
            }
        }
        return true;
    }
}
```

**Choose Interceptors when:** the concern is specifically about controller-layer HTTP handling — authentication, model enrichment before rendering, request-level audit logging. Interceptors cannot intercept service or repository layer calls.

---

### 3. Manual Decorator Pattern

Explicitly wrap a service implementation in a decorator class that adds cross-cutting behavior. No framework magic — pure Java.

```java
// Explicit logging decorator
public class LoggingOrderService implements IOrderService {

    private final IOrderService delegate;

    public LoggingOrderService(IOrderService delegate) {
        this.delegate = delegate;
    }

    @Override
    public Order createOrder(CreateOrderCommand cmd) {
        log.info("START createOrder");
        Order result = delegate.createOrder(cmd);
        log.info("END createOrder");
        return result;
    }
}

// Config
@Bean
public IOrderService orderService(OrderServiceImpl impl) {
    return new LoggingOrderService(impl);
}
```

**Strengths:** Zero framework dependency, trivially testable, no proxy stack frames, fully explicit behavior.

**Weaknesses:** Must be repeated for every method in the interface. Does not scale to 50+ service methods.

**Choose Decorator when:** you need to add behavior to a single specific class and want explicit, debuggable code. AOP would be over-engineering here.

---

### 4. Spring AOP

**Choose AOP when:**
- The behavior must apply across many unrelated classes (e.g., log *every* service method).
- You want to target methods by annotation (e.g., `@Retryable`, `@Cacheable`).
- The cross-cutting concern must reach beyond the controller layer into services and repositories.
- You want to enforce a concern without modifying any existing class.

---

## 🛠️ Advice Types In Depth

Spring AOP provides five advice types. Choosing the right one matters for both correctness and performance.

```java
@Aspect
@Component
public class ExampleAspect {

    // Runs BEFORE the method. Cannot prevent execution or change args (use @Around for that).
    @Before("execution(* com.example.service.*.*(..))")
    public void before(JoinPoint jp) {
        log.info("About to call: {}", jp.getSignature().getName());
    }

    // Runs AFTER the method returns normally. Does NOT run on exception.
    @AfterReturning(pointcut = "execution(* com.example.service.*.*(..))",
                    returning = "result")
    public void afterReturning(JoinPoint jp, Object result) {
        log.info("Returned: {}", result);
    }

    // Runs AFTER the method throws an exception. Does NOT run on normal return.
    @AfterThrowing(pointcut = "execution(* com.example.service.*.*(..))",
                   throwing = "ex")
    public void afterThrowing(JoinPoint jp, Exception ex) {
        log.error("Exception in {}: {}", jp.getSignature().getName(), ex.getMessage());
    }

    // Runs AFTER the method regardless of outcome (normal return OR exception).
    // Equivalent to a finally block.
    @After("execution(* com.example.service.*.*(..))")
    public void after(JoinPoint jp) {
        // Cleanup, MDC clearing, etc.
    }

    // Most powerful: wraps the entire method. You control if/when/how it executes.
    // Must call pjp.proceed() to invoke the real method (or skip it entirely).
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        log.info("Before");
        try {
            Object result = pjp.proceed(); // Call the actual method
            log.info("After returning");
            return result;
        } catch (Exception ex) {
            log.error("After throwing");
            throw ex;
        } finally {
            log.info("After (finally)");
        }
    }
}
```

**Execution order when multiple advice types match the same method:**

```
@Around (before proceed)
  → @Before
    → Target Method Executes
  → @AfterReturning / @AfterThrowing
@After
@Around (after proceed)
```

---

## 📐 Pointcut Expressions In Depth

The pointcut expression is the most expressive and most misused part of Spring AOP.

### `execution` — Method Signature Matching

The most common and powerful designator.

```
execution([visibility] return-type [declaring-type] method-name(params) [throws])
```

```java
// Every public method in any class
execution(public * *(..))

// Every method in the com.example.service package (not subpackages)
execution(* com.example.service.*.*(..))

// Every method in the com.example.service package AND all subpackages
execution(* com.example.service..*.*(..))

// Methods named "create" with any return type and any args
execution(* create(..))

// Methods that take exactly one String argument
execution(* *(String))

// Methods returning an Order object
execution(Order com.example.service.*.*(..))

// Methods on the OrderService class specifically
execution(* com.example.service.OrderService.*(..))
```

### `@annotation` — Custom Annotation Targeting

The most maintainable approach for production systems. You control which methods are intercepted by adding/removing an annotation — no changes to the Aspect needed.

```java
// Define the marker annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    String action() default "";
}

// Apply it selectively
@Service
public class OrderService {

    @Audited(action = "CREATE_ORDER")
    public Order createOrder(CreateOrderCommand cmd) { /* ... */ }

    public Order findOrder(UUID id) { /* not audited */ }
}

// Aspect targets only annotated methods
@Aspect
@Component
public class AuditAspect {

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        auditLog.record(audited.action(), user, pjp.getArgs());
        return pjp.proceed();
    }
}
```

### `@within` — Annotation on the Class

Matches all methods in a class annotated with the given annotation — without annotating each method individually.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Monitored {}

@Monitored
@Service
public class PaymentService {
    public void processPayment(...) { /* all methods intercepted */ }
    public void refund(...) { /* all methods intercepted */ }
}

@Aspect
@Component
public class MonitoringAspect {
    @Around("@within(com.example.annotation.Monitored)")
    public Object monitor(ProceedingJoinPoint pjp) throws Throwable { /* ... */ }
}
```

### Combining Pointcuts with Logical Operators

```java
@Aspect
@Component
public class SecurityAspect {

    // Reusable named pointcuts
    @Pointcut("execution(* com.example.service.*.*(..))")
    private void serviceLayer() {}

    @Pointcut("execution(* com.example.repository.*.*(..))")
    private void repositoryLayer() {}

    @Pointcut("@annotation(com.example.annotation.RequiresAuth)")
    private void requiresAuth() {}

    // Combine: service OR repository layer AND annotated with @RequiresAuth
    @Before("(serviceLayer() || repositoryLayer()) && requiresAuth()")
    public void checkAuth(JoinPoint jp) {
        if (!securityContext.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required");
        }
    }
}
```

---

## 🧠 Senior Deep Dive

### 1. Spring AOP vs. AspectJ: The Real Difference

Spring AOP is **not** a full AspectJ implementation. This distinction matters significantly in production.

| Dimension | Spring AOP | AspectJ (full) |
|---|---|---|
| **Weaving mechanism** | Runtime proxy (JDK / CGLIB) | Compile-time, post-compile, or load-time bytecode weaving |
| **Join point types** | Method execution only | Method, constructor, field access, static initializer |
| **Proxy limitation** | Only Spring-managed beans | Any Java object (new, static, non-Spring) |
| **Self-invocation** | ❌ Not intercepted | ✅ Intercepted (bytecode level) |
| **Performance** | Proxy overhead per call | Minimal (woven at compile/load time) |
| **Setup complexity** | Zero (auto-configured in Spring Boot) | Requires AspectJ compiler or agent |
| **Use case** | ~95% of enterprise use cases | Fields, constructors, non-Spring objects, performance-critical paths |

**When to use full AspectJ:**
- You need to intercept field access or constructors.
- You need to apply aspects to objects not managed by Spring (created with `new`).
- The performance of CGLIB proxy overhead is measurable and unacceptable on a hot path.
- You need to intercept `private` methods (Spring AOP cannot — proxy only overrides `public`/`protected`).

To enable Load-Time Weaving in Spring:

```java
@EnableLoadTimeWeaving
@Configuration
public class AspectJConfig { }
```

```xml
<!-- pom.xml — AspectJ agent for LTW -->
<dependency>
    <groupId>org.aspectj</groupId>
    <artifactId>aspectjweaver</artifactId>
</dependency>
```

```bash
# JVM argument to attach the AspectJ weaving agent
-javaagent:aspectjweaver-1.9.x.jar
```

---

### 2. Advice Ordering with `@Order`

When multiple aspects apply to the same method, their execution order is undefined unless you explicitly set it. `@Order` controls priority: **lower number = outer wrapper** (runs first before, runs last after).

```java
@Aspect @Component @Order(1) // outermost — first in, last out
public class TransactionAspect { /* @Around */ }

@Aspect @Component @Order(2)
public class SecurityAspect { /* @Before */ }

@Aspect @Component @Order(3) // innermost — last in, first out
public class LoggingAspect { /* @Around */ }
```

```
Execution order:
  TransactionAspect.before (begin TX)
    SecurityAspect.before (auth check)
      LoggingAspect.before (log start)
        → Target Method
      LoggingAspect.after (log end)
    SecurityAspect.after
  TransactionAspect.after (commit/rollback TX)
```

This ordering rule is critical: **Transaction must be the outermost wrapper** so that any exception thrown by security or logging still triggers a rollback.

---

### 3. Production-Grade AOP Use Cases

#### Use Case 1: Structured Logging with MDC

```java
@Aspect
@Component
@Order(1) // Outermost — sets context for all other aspects and the method
public class MdcLoggingAspect {

    @Around("execution(* com.example.service.*.*(..))")
    public Object withMdc(ProceedingJoinPoint pjp) throws Throwable {
        String correlationId = UUID.randomUUID().toString();
        String methodName = pjp.getSignature().toShortString();

        MDC.put("correlationId", correlationId);
        MDC.put("method", methodName);

        try {
            log.info("Entering {}", methodName);
            Object result = pjp.proceed();
            log.info("Exiting {} normally", methodName);
            return result;
        } catch (Exception ex) {
            log.error("Exception in {}: {}", methodName, ex.getMessage());
            throw ex;
        } finally {
            MDC.clear(); // MUST clear to prevent leaking into next request on thread pool
        }
    }
}
```

#### Use Case 2: Retry with Exponential Backoff

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Retryable {
    int maxAttempts() default 3;
    long initialDelayMs() default 100;
    double multiplier() default 2.0;
    Class<? extends Exception>[] retryOn() default { Exception.class };
}
```

```java
@Aspect
@Component
public class RetryAspect {

    @Around("@annotation(retryable)")
    public Object retry(ProceedingJoinPoint pjp, Retryable retryable) throws Throwable {
        int attempts = 0;
        long delay = retryable.initialDelayMs();

        while (true) {
            try {
                return pjp.proceed();
            } catch (Exception ex) {
                attempts++;
                boolean shouldRetry = Arrays.stream(retryable.retryOn())
                        .anyMatch(type -> type.isInstance(ex));

                if (!shouldRetry || attempts >= retryable.maxAttempts()) {
                    log.error("All {} retry attempts exhausted for {}",
                            retryable.maxAttempts(), pjp.getSignature().getName());
                    throw ex;
                }

                log.warn("Attempt {}/{} failed for {}. Retrying in {}ms",
                        attempts, retryable.maxAttempts(),
                        pjp.getSignature().getName(), delay);
                Thread.sleep(delay);
                delay = (long) (delay * retryable.multiplier());
            }
        }
    }
}

// Usage
@Service
public class ExternalPaymentService {

    @Retryable(maxAttempts = 3, initialDelayMs = 200, retryOn = { HttpClientErrorException.class })
    public PaymentResult charge(PaymentRequest request) {
        return paymentGateway.charge(request);
    }
}
```

:::tip
Spring's own `spring-retry` module provides `@Retryable` with more features (stateful retry, `@Recover` fallback). Implement your own only if you need behavior not covered by the library.
:::

#### Use Case 3: Method-Level Performance Metrics

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Timed {
    String metricName() default "";
    String[] tags() default {};
}
```

```java
@Aspect
@Component
@RequiredArgsConstructor
public class TimingAspect {

    private final MeterRegistry meterRegistry;

    @Around("@annotation(timed)")
    public Object time(ProceedingJoinPoint pjp, Timed timed) throws Throwable {
        String metricName = timed.metricName().isEmpty()
                ? "method." + pjp.getSignature().getName()
                : timed.metricName();

        Timer.Sample sample = Timer.start(meterRegistry);
        String outcome = "success";
        try {
            return pjp.proceed();
        } catch (Exception ex) {
            outcome = "error";
            throw ex;
        } finally {
            sample.stop(Timer.builder(metricName)
                    .tag("outcome", outcome)
                    .tag("class", pjp.getTarget().getClass().getSimpleName())
                    .register(meterRegistry));
        }
    }
}

// Usage
@Service
public class OrderService {

    @Timed(metricName = "order.creation", tags = { "version", "v2" })
    public Order createOrder(CreateOrderCommand cmd) { /* ... */ }
}
```

#### Use Case 4: Idempotency Enforcement

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {
    String keyExpression(); // SpEL expression to derive the idempotency key
    long ttlSeconds() default 3600;
}
```

```java
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotencyAspect {

    private final RedisTemplate<String, Object> redis;
    private final SpelExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(idempotent)")
    public Object enforce(ProceedingJoinPoint pjp, Idempotent idempotent) throws Throwable {
        String key = resolveKey(pjp, idempotent.keyExpression());
        String redisKey = "idempotent:" + key;

        // Check if already processed
        Object cached = redis.opsForValue().get(redisKey);
        if (cached != null) {
            log.info("Returning cached result for idempotency key: {}", key);
            return cached;
        }

        Object result = pjp.proceed();

        // Cache the result with TTL
        redis.opsForValue().set(redisKey, result, idempotent.ttlSeconds(), TimeUnit.SECONDS);
        return result;
    }

    private String resolveKey(ProceedingJoinPoint pjp, String expression) {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        StandardEvaluationContext ctx = new StandardEvaluationContext();

        String[] paramNames = sig.getParameterNames();
        Object[] args = pjp.getArgs();
        for (int i = 0; i < paramNames.length; i++) {
            ctx.setVariable(paramNames[i], args[i]);
        }

        return parser.parseExpression(expression).getValue(ctx, String.class);
    }
}

// Usage
@Idempotent(keyExpression = "#cmd.idempotencyKey", ttlSeconds = 3600)
public PaymentResult processPayment(PaymentCommand cmd) { /* ... */ }
```

#### Use Case 5: Audit Trail

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    String action();
    AuditLevel level() default AuditLevel.INFO;
}

public enum AuditLevel { INFO, WARN, CRITICAL }
```

```java
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditRepository auditRepository;

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        String user = getCurrentUser();
        String method = pjp.getSignature().toShortString();
        Object[] args = pjp.getArgs();
        Instant startTime = Instant.now();

        try {
            Object result = pjp.proceed();
            saveAuditRecord(audited, user, method, args, result, null, startTime);
            return result;
        } catch (Exception ex) {
            saveAuditRecord(audited, user, method, args, null, ex, startTime);
            throw ex;
        }
    }

    private void saveAuditRecord(Audited audited, String user, String method,
                                  Object[] args, Object result, Exception ex,
                                  Instant startTime) {
        AuditRecord record = AuditRecord.builder()
                .action(audited.action())
                .level(audited.level())
                .user(user)
                .method(method)
                .arguments(sanitize(args)) // Remove sensitive fields like passwords
                .outcome(ex == null ? "SUCCESS" : "FAILURE")
                .errorMessage(ex != null ? ex.getMessage() : null)
                .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                .timestamp(startTime)
                .build();

        auditRepository.save(record); // Write to a separate audit DB/table
    }
}

// Usage
@Audited(action = "TRANSFER_FUNDS", level = AuditLevel.CRITICAL)
public Transfer transferFunds(TransferCommand cmd) { /* ... */ }
```

---

### 4. Accessing Method Arguments and Annotations Safely

```java
@Aspect
@Component
public class AdvancedAspect {

    @Around("@annotation(com.example.annotation.Audited)")
    public Object example(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Method method = signature.getMethod();

        // Access the annotation
        Audited audited = method.getAnnotation(Audited.class);

        // Access parameter names and values
        String[] paramNames = signature.getParameterNames();
        Object[] paramValues = pjp.getArgs();

        // Access parameter annotations (e.g., find @RequestBody parameter)
        Annotation[][] paramAnnotations = method.getParameterAnnotations();

        for (int i = 0; i < paramNames.length; i++) {
            log.debug("Param[{}]: {} = {}", i, paramNames[i], paramValues[i]);
        }

        // Modify arguments before proceeding (use with extreme care)
        // Object[] newArgs = Arrays.copyOf(paramValues, paramValues.length);
        // newArgs[0] = transformedValue;
        // return pjp.proceed(newArgs);

        return pjp.proceed();
    }
}
```

---

### 5. Testing Aspects in Isolation

AOP is notoriously hard to test because the proxy is invisible in unit tests. Two approaches:

**Approach A — Test the Aspect class directly (unit test):**

```java
@ExtendWith(MockitoExtension.class)
class RetryAspectTest {

    @InjectMocks
    private RetryAspect aspect;

    @Mock
    private ProceedingJoinPoint pjp;

    @Test
    void shouldRetryOnException() throws Throwable {
        Retryable retryable = createRetryableAnnotation(3, 10, Exception.class);

        when(pjp.proceed())
                .thenThrow(new RuntimeException("transient"))
                .thenThrow(new RuntimeException("transient"))
                .thenReturn("success");

        Object result = aspect.retry(pjp, retryable);

        assertThat(result).isEqualTo("success");
        verify(pjp, times(3)).proceed();
    }

    @Test
    void shouldThrowAfterMaxAttempts() throws Throwable {
        Retryable retryable = createRetryableAnnotation(2, 10, Exception.class);
        when(pjp.proceed()).thenThrow(new RuntimeException("always fails"));

        assertThatThrownBy(() -> aspect.retry(pjp, retryable))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("always fails");

        verify(pjp, times(2)).proceed();
    }
}
```

**Approach B — Test via Spring context (integration test):**

```java
@SpringBootTest
class RetryAspectIntegrationTest {

    @Autowired
    private ExternalPaymentService paymentService; // Gets the proxy with aspect applied

    @MockBean
    private PaymentGateway paymentGateway;

    @Test
    void shouldRetryOnHttpClientError() {
        when(paymentGateway.charge(any()))
                .thenThrow(new HttpClientErrorException(HttpStatus.SERVICE_UNAVAILABLE))
                .thenThrow(new HttpClientErrorException(HttpStatus.SERVICE_UNAVAILABLE))
                .thenReturn(new PaymentResult("ok"));

        PaymentResult result = paymentService.charge(new PaymentRequest());

        assertThat(result.getStatus()).isEqualTo("ok");
        verify(paymentGateway, times(3)).charge(any());
    }
}
```

---

### 6. Performance Considerations

Spring AOP adds proxy overhead per intercepted call. In most enterprise applications, this is negligible — typically microseconds per call. However, on **hot paths** (tight loops, high-frequency in-memory operations), it becomes measurable.

**Rules for performance-conscious AOP:**

- **Prefer `@annotation` over broad `execution(* *..*.*(..))` pointcuts.** A broad execution pointcut causes Spring to evaluate every bean method call through the proxy chain, even for methods without any matching advice. This adds overhead proportional to the number of proxied beans.
- **Keep `@Around` advice lean.** The advice code runs synchronously in the call stack. Heavy logic (DB queries, HTTP calls) inside advice adds directly to every intercepted method's latency.
- **Avoid advice on repository layer methods in a hot loop.** If a method calls `repository.findById()` 10,000 times in a batch job, and that method is intercepted by 3 aspects, you are paying 30,000 proxy invocations per batch.
- **Profile before removing AOP.** Use JFR (Java Flight Recorder) or async-profiler to confirm AOP is the actual bottleneck before removing it.

```java
// ❌ BAD: matches everything — pointcut evaluation overhead on every proxied method call
@Around("execution(* *..*.*(..))") // Too broad

// ✅ GOOD: only matches exactly the classes you care about
@Around("execution(* com.example.service..*(..))")

// ✅ BETTER: only matches explicitly annotated methods — zero overhead on non-annotated methods
@Around("@annotation(com.example.annotation.Timed)")
```

---

### 7. Common Pitfalls Reference

| Pitfall | Symptom | Fix |
|---|---|---|
| **Self-invocation** | Aspect not triggered on internal method calls | Inject self via `@Autowired @Lazy`, or extract to a separate bean |
| **`final` class / method** | CGLIB cannot subclass; advice silently not applied | Remove `final`, or use AspectJ LTW |
| **`private` method** | Spring AOP only proxies `public`/`protected` | Use AspectJ, or make method non-private |
| **Wrong pointcut expression** | Advice never fires | Use `@EnableAspectJAutoProxy` + add a `@Before("...")` with a debug log to confirm matching |
| **Aspect not a Spring bean** | `@Aspect` class not detected | Add `@Component` (or `@Bean` in config) to the Aspect class |
| **`@EnableAspectJAutoProxy` missing** | All aspects ignored | Add to `@Configuration` class; Spring Boot auto-configures this if `spring-boot-starter-aop` is on the classpath |
| **Incorrect `@Order` — logging wraps transaction** | Exceptions inside logging don't trigger rollback | Set `@Order` so `@Transactional` aspect is outermost (lowest order number) |
| **Modifying `pjp.getArgs()` array directly** | Arguments not changed | Create a new array and pass to `pjp.proceed(newArgs)` |

---

## 🎯 Interview Decision Matrix

| Scenario | Recommended Approach | Why |
|---|---|---|
| HTTP request logging / rate limiting | Servlet Filter | Operates at HTTP level before Spring even sees the request |
| Controller-level auth check | HandlerInterceptor or Spring Security | Has access to `HandlerMethod`; security frameworks already handle this |
| Audit logging on specific service methods | Spring AOP + `@Audited` annotation | Selective, non-invasive, captures method args and return values |
| Retry on external HTTP calls | Spring AOP + `@Retryable` (or spring-retry) | Centralized retry policy without polluting call sites |
| Transaction management | Spring's built-in `@Transactional` | Already implemented as AOP — do not re-implement |
| Performance metrics on service methods | Spring AOP + `@Timed` + Micrometer | Consistent, non-invasive metric collection across all services |
| Intercepting field access | AspectJ (full) with LTW | Spring AOP cannot intercept field access — proxy only covers methods |
| Intercepting `private` methods | AspectJ (full) with LTW | Spring AOP proxies cannot override private methods |
| Adding behaviour to one specific class | Manual Decorator | AOP is over-engineering for a single-class concern |
| Idempotency on API endpoints | Spring AOP + Redis + `@Idempotent` | Annotation-driven, transparent to callers, Redis provides distributed state |

:::tip[Interview Phrasing — When to Use AOP]
*"Spring AOP is the right tool when a cross-cutting concern applies across many unrelated classes and you want to avoid scattering boilerplate. I would model it as a custom annotation — `@Audited`, `@Retryable`, `@Timed` — and an aspect that targets that annotation. This approach is explicit (the developer sees the annotation on the method), testable in isolation, and non-invasive to business logic. I would NOT use AOP for concerns that only affect one class — a Decorator is simpler and more debuggable there. I would also NOT use Spring AOP if I need to intercept private methods or constructors — that requires full AspectJ with load-time weaving."*
:::

:::tip[Interview Phrasing — Proxy Mechanics]
*"Spring AOP works via proxies, not bytecode modification. When a bean has a matching aspect, Spring wraps it in either a JDK dynamic proxy (if the bean implements an interface) or a CGLIB subclass (for concrete classes — the default since Spring Boot 2). This means aspects only fire when the call comes through the proxy — which is always the case for `@Autowired` dependencies. The critical pitfall is self-invocation: if a method calls another method on `this`, it bypasses the proxy and the aspect is not triggered. The fix is to inject the proxy into the class itself via `@Autowired @Lazy`, or to refactor the internal call into a separate Spring-managed bean."*
:::

---

## 📚 Further Reading

- [Spring Framework Reference — Aspect Oriented Programming](https://docs.spring.io/spring-framework/reference/core/aop.html) — The canonical Spring AOP reference; covers proxy mechanics, pointcut language, and advice types exhaustively.
- [AspectJ Programming Guide](https://www.eclipse.org/aspectj/doc/released/progguide/index.html) — Full AspectJ documentation; essential if you need field interception, constructor advice, or LTW.
- [spring-retry](https://github.com/spring-projects/spring-retry) — Spring's official retry abstraction; provides `@Retryable`, `@Recover`, and `RetryTemplate`. Prefer this over a custom retry aspect.
- [Micrometer Documentation](https://micrometer.io/docs) — The metrics library underpinning `@Timed` and custom `Timer` instrumentation in Spring Boot.
- [AspectJ in Action — Ramnivas Laddad](https://www.manning.com/books/aspectj-in-action-second-edition) — The definitive book on AOP; covers both Spring AOP and full AspectJ in depth.
- [Baeldung — Introduction to Spring AOP](https://www.baeldung.com/spring-aop) — Practical examples covering all advice types and pointcut expressions with runnable code.