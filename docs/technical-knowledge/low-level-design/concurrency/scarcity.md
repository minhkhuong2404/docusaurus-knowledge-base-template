---
id: scarcity
title: "Concurrency: Scarcity"
sidebar_label: Scarcity
---

# Concurrency: Scarcity

> Scarcity is about managing **limited resources** — thread pools, connections, memory, rate limits — under concurrent demand. This is where senior-level thinking really shows.

---

## Thread Pools

**Never create threads directly in production code.** Creating a thread is expensive (~1MB stack, OS-level resource). Thread pools reuse a fixed set of worker threads.

```java
// ❌ Creates a new thread for every request — will OOM under load
public class RequestHandler {
    public void handle(HttpRequest request) {
        new Thread(() -> processRequest(request)).start();  // 10k requests = 10k threads!
    }
}

// ✅ Use ExecutorService with bounded thread pool
public class RequestHandler {
    // Fixed thread pool: predictable resource usage
    private final ExecutorService executor =
        Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() * 2);

    public void handle(HttpRequest request) {
        executor.submit(() -> processRequest(request));
    }

    public void shutdown() {
        executor.shutdown();  // Graceful: waits for in-flight tasks
        try {
            if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
                executor.shutdownNow(); // Force if taking too long
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
```

### Thread Pool Sizing

```java
// For CPU-bound tasks (no I/O waiting)
int cpuCores = Runtime.getRuntime().availableProcessors();
ExecutorService cpuBound = Executors.newFixedThreadPool(cpuCores);

// For I/O-bound tasks (threads spend time waiting)
// Rough formula: N_threads = N_cpu * (1 + Wait_time / Service_time)
// If 50% wait time: N_threads = cpuCores * 2
ExecutorService ioBound = Executors.newFixedThreadPool(cpuCores * 2);

// Custom ThreadPoolExecutor for fine-grained control
ExecutorService custom = new ThreadPoolExecutor(
    4,                              // corePoolSize
    16,                             // maximumPoolSize
    60L, TimeUnit.SECONDS,          // keepAlive for idle threads above core
    new LinkedBlockingQueue<>(1000), // bounded work queue — rejects at 1000
    new ThreadFactory() {
        private final AtomicInteger counter = new AtomicInteger(0);
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r);
            t.setName("order-processor-" + counter.incrementAndGet());
            t.setDaemon(true);  // won't prevent JVM shutdown
            return t;
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy()  // Backpressure: caller does the work
);
```

:::tip Interview Tip 🎯
Mention thread pool sizing when designing any service. The **CallerRunsPolicy** rejection handler is a great talking point: *"If the queue is full, instead of throwing an exception, the thread that submitted the task will run it itself — this naturally slows down the producer and acts as backpressure."*
:::

---

## Rate Limiting

Rate limiting protects resources from being overwhelmed. It's a classic LLD interview problem and a critical production concern.

### Token Bucket Algorithm

```java
public class TokenBucketRateLimiter {
    private final long capacity;           // Max tokens
    private final double refillRate;       // Tokens per second
    private double currentTokens;
    private long lastRefillTimestamp;

    public TokenBucketRateLimiter(long capacity, double refillRate) {
        this.capacity             = capacity;
        this.refillRate           = refillRate;
        this.currentTokens        = capacity;  // Start full
        this.lastRefillTimestamp  = System.nanoTime();
    }

    public synchronized boolean tryConsume(int tokens) {
        refill();
        if (currentTokens >= tokens) {
            currentTokens -= tokens;
            return true;
        }
        return false;
    }

    private void refill() {
        long now     = System.nanoTime();
        double elapsed = (now - lastRefillTimestamp) / 1e9; // seconds
        double newTokens = elapsed * refillRate;
        currentTokens = Math.min(capacity, currentTokens + newTokens);
        lastRefillTimestamp = now;
    }
}
```

### Sliding Window Log Algorithm

```java
public class SlidingWindowLogRateLimiter {
    private final int maxRequests;
    private final long windowMs;
    private final Deque<Long> requestTimestamps = new ArrayDeque<>();

    public SlidingWindowLogRateLimiter(int maxRequests, long windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs    = windowMs;
    }

    public synchronized boolean isAllowed() {
        long now = System.currentTimeMillis();
        long windowStart = now - windowMs;

        // Remove timestamps outside the window
        while (!requestTimestamps.isEmpty() && requestTimestamps.peekFirst() < windowStart) {
            requestTimestamps.pollFirst();
        }

        if (requestTimestamps.size() < maxRequests) {
            requestTimestamps.addLast(now);
            return true;
        }
        return false;
    }
}
```

### Per-Client Rate Limiter

```java
// Rate limiter per API key / client ID
public class DistributedRateLimiter {
    private final int requestsPerMinute;
    private final ConcurrentHashMap<String, TokenBucketRateLimiter> limiters
        = new ConcurrentHashMap<>();

    public DistributedRateLimiter(int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    public boolean isAllowed(String clientId) {
        // computeIfAbsent is atomic — no duplicate limiter creation
        TokenBucketRateLimiter limiter = limiters.computeIfAbsent(
            clientId,
            id -> new TokenBucketRateLimiter(requestsPerMinute, requestsPerMinute / 60.0)
        );
        return limiter.tryConsume(1);
    }

    // Clean up old clients periodically to prevent memory leak
    public void evictStaleClients() {
        // In production: use a scheduled job or Caffeine cache with expiry
        limiters.entrySet().removeIf(e -> e.getValue().isIdle());
    }
}
```

---

## Object Pooling

For objects that are expensive to create (database connections, large buffers), use a pool.

```java
public class ObjectPool<T> {
    private final BlockingQueue<T> pool;
    private final Supplier<T> factory;
    private final Consumer<T> resetAction;

    public ObjectPool(int size, Supplier<T> factory, Consumer<T> resetAction) {
        this.factory     = factory;
        this.resetAction = resetAction;
        this.pool        = new LinkedBlockingQueue<>(size);
        for (int i = 0; i < size; i++) {
            pool.offer(factory.get());
        }
    }

    public T acquire() throws InterruptedException {
        return pool.take(); // blocks if pool is empty
    }

    public T tryAcquire(long timeout, TimeUnit unit) throws InterruptedException {
        return pool.poll(timeout, unit); // returns null if timeout
    }

    public void release(T obj) {
        resetAction.accept(obj); // reset state before returning
        pool.offer(obj);
    }
}

// Usage: Buffer pool for I/O operations
ObjectPool<byte[]> bufferPool = new ObjectPool<>(
    20,
    () -> new byte[8192],   // allocate 8KB buffers
    buf -> Arrays.fill(buf, (byte) 0)  // zero-fill on return
);

byte[] buffer = bufferPool.acquire();
try {
    int bytesRead = inputStream.read(buffer);
    processData(buffer, bytesRead);
} finally {
    bufferPool.release(buffer);  // always return to pool
}
```

---

## Backpressure

Backpressure is the mechanism by which a fast producer is slowed down when a slow consumer can't keep up.

```java
// Backpressure via bounded queue — producer blocks when full
public class Pipeline<T> {
    private final BlockingQueue<T> queue;
    private final Consumer<T> processor;

    public Pipeline(int capacity, Consumer<T> processor) {
        this.queue     = new LinkedBlockingQueue<>(capacity);
        this.processor = processor;
    }

    // Producer: blocks if queue is full — natural backpressure
    public void submit(T item) throws InterruptedException {
        queue.put(item);  // Blocks if capacity reached!
    }

    // Overload detection
    public boolean submitOrReject(T item) {
        return queue.offer(item);  // Returns false if full — caller decides what to do
    }

    // Consumer thread
    public void start() {
        Thread consumer = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    T item = queue.poll(1, TimeUnit.SECONDS);
                    if (item != null) processor.accept(item);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        consumer.start();
    }
}
```

---

## Circuit Breaker Pattern

Prevent cascade failures by "opening" the circuit when a downstream service is failing.

```java
public class CircuitBreaker {
    public enum State { CLOSED, OPEN, HALF_OPEN }

    private volatile State state = State.CLOSED;
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile long openTime;

    private final int failureThreshold = 5;
    private final long recoveryTimeMs  = 30_000;

    public <T> T call(Supplier<T> operation) {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - openTime > recoveryTimeMs) {
                state = State.HALF_OPEN;  // Try again
            } else {
                throw new CircuitOpenException("Circuit breaker is open");
            }
        }

        try {
            T result = operation.get();
            onSuccess();
            return result;
        } catch (Exception e) {
            onFailure();
            throw e;
        }
    }

    private void onSuccess() {
        failureCount.set(0);
        state = State.CLOSED;
    }

    private void onFailure() {
        if (failureCount.incrementAndGet() >= failureThreshold) {
            state    = State.OPEN;
            openTime = System.currentTimeMillis();
        }
    }
}

// Usage
CircuitBreaker cb = new CircuitBreaker();
try {
    PaymentResult result = cb.call(() -> paymentService.charge(request));
} catch (CircuitOpenException e) {
    return PaymentResult.serviceUnavailable(); // Fail fast
}
```

---

## Scarcity Summary

| Resource | Tool | Pattern |
|----------|------|---------|
| CPU threads | `ThreadPoolExecutor` | Fixed/cached pool with bounded queue |
| DB connections | `ConnectionPool` + `Semaphore` | Pool with acquire/release |
| API calls | `RateLimiter` | Token bucket or sliding window |
| Memory buffers | `ObjectPool` | Preallocated pool |
| Downstream services | `CircuitBreaker` | Open/half-open/closed state machine |
| Work queue capacity | `BlockingQueue` + CallerRunsPolicy | Backpressure on producer |

:::note Senior Deep Dive 🔴
The most impressive thing you can say about resource management in an interview: *"I'd make the queue bounded — an unbounded queue just delays the OOM instead of applying backpressure. With a bounded queue and CallerRunsPolicy, the system degrades gracefully under load rather than crashing."*
:::

**Next →** [Problem: Connect Four](../problems/connect-four)
