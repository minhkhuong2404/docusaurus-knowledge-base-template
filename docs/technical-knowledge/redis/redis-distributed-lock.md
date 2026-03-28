---
id: redis-distributed-lock
title: "Distributed Lock"
slug: redis-distributed-lock
description: "Implementation of Distributed Locks using Redis, Redisson, and the Redlock algorithm for senior engineers."
tags: [redis, distributed-lock, pattern, backend]
---

# Distributed Lock with Redis

A **distributed lock** ensures that only one process (across multiple nodes) can execute a critical section at a time. Redis is a popular choice for implementing distributed locks due to its atomic commands and TTL support.

## The Problem

```
Without lock:
  Service A reads inventory = 1
  Service B reads inventory = 1     ← race condition
  Service A decrements → 0
  Service B decrements → -1         ← oversold!

With distributed lock:
  Service A acquires lock
  Service A reads → 1, decrements → 0
  Service A releases lock
  Service B acquires lock
  Service B reads → 0, rejects purchase
  Service B releases lock
```

---

## Simple Lock: SET NX EX

```bash
# Acquire: SET key value NX EX ttl
# NX = only set if Not eXists
# EX = expire in N seconds

SET lock:order:1001 "serviceA-uuid" NX EX 30
# Returns OK if acquired, nil if already held
```

**Why include a unique value?** To prevent accidental release by another process.

```bash
# Release: only if the value matches (use Lua for atomicity)
GET lock:order:1001    # "serviceA-uuid" ← is this ours?
DEL lock:order:1001    # release
```

---

## Spring Data Redis: Distributed Lock

### Manual Implementation

```java
@Component
public class RedisDistributedLock {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String LOCK_PREFIX = "lock:";

    /**
     * Try to acquire lock. Returns lockValue if successful, null otherwise.
     */
    public String tryAcquire(String resource, Duration ttl) {
        String lockKey = LOCK_PREFIX + resource;
        String lockValue = UUID.randomUUID().toString();

        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockValue, ttl);

        return Boolean.TRUE.equals(acquired) ? lockValue : null;
    }

    /**
     * Release lock only if we own it (atomic via Lua script).
     */
    public boolean release(String resource, String lockValue) {
        String lockKey = LOCK_PREFIX + resource;

        String script = """
            if redis.call('GET', KEYS[1]) == ARGV[1] then
                return redis.call('DEL', KEYS[1])
            else
                return 0
            end
            """;

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        Long result = redisTemplate.execute(redisScript,
            Collections.singletonList(lockKey), lockValue);

        return Long.valueOf(1L).equals(result);
    }

    /**
     * Extend the TTL of an existing lock (lock renewal).
     */
    public boolean extend(String resource, String lockValue, Duration newTtl) {
        String lockKey = LOCK_PREFIX + resource;
        String script = """
            if redis.call('GET', KEYS[1]) == ARGV[1] then
                return redis.call('EXPIRE', KEYS[1], ARGV[2])
            else
                return 0
            end
            """;

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        Long result = redisTemplate.execute(redisScript,
            Collections.singletonList(lockKey),
            lockValue,
            String.valueOf(newTtl.getSeconds()));

        return Long.valueOf(1L).equals(result);
    }
}
```

### Lock Service with Auto-Renewal

```java
@Service
@Slf4j
public class LockService {

    @Autowired
    private RedisDistributedLock lock;

    /**
     * Execute work inside a distributed lock.
     * Automatically renews the lock if work takes longer than expected.
     */
    public <T> T withLock(String resource, Duration ttl,
                          Supplier<T> work) throws LockNotAcquiredException {

        String lockValue = lock.tryAcquire(resource, ttl);
        if (lockValue == null) {
            throw new LockNotAcquiredException("Could not acquire lock: " + resource);
        }

        ScheduledExecutorService renewalExecutor =
            Executors.newSingleThreadScheduledExecutor();

        try {
            // Renew lock at 2/3 of TTL interval
            long renewIntervalMs = ttl.toMillis() * 2 / 3;
            renewalExecutor.scheduleAtFixedRate(
                () -> lock.extend(resource, lockValue, ttl),
                renewIntervalMs, renewIntervalMs, TimeUnit.MILLISECONDS
            );

            return work.get();

        } finally {
            renewalExecutor.shutdownNow();
            lock.release(resource, lockValue);
        }
    }
}
```

### Usage in Business Logic

```java
@Service
public class InventoryService {

    @Autowired
    private LockService lockService;

    @Autowired
    private InventoryRepository inventoryRepository;

    public boolean purchaseItem(String itemId, int quantity) {
        return lockService.withLock(
            "inventory:" + itemId,
            Duration.ofSeconds(10),
            () -> {
                Item item = inventoryRepository.findById(itemId).orElseThrow();
                if (item.getStock() < quantity) return false;

                item.setStock(item.getStock() - quantity);
                inventoryRepository.save(item);
                return true;
            }
        );
    }
}
```

---

## Redisson: Production-Grade Distributed Lock

For production use, [Redisson](https://github.com/redisson/redisson) is the recommended library — it implements the Redlock algorithm and handles edge cases automatically.

```xml
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson-spring-boot-starter</artifactId>
    <version>3.27.0</version>
</dependency>
```

```java
@Service
public class RedissonLockService {

    @Autowired
    private RedissonClient redissonClient;

    public void processOrder(Long orderId) throws InterruptedException {
        RLock lock = redissonClient.getLock("order-lock:" + orderId);

        // Try to acquire with timeout and lease time
        boolean acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
        if (!acquired) {
            throw new RuntimeException("Could not acquire lock");
        }

        try {
            // critical section
            processOrderInternal(orderId);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    // Fair lock — FIFO ordering
    public void processWithFairLock(Long orderId) throws InterruptedException {
        RLock fairLock = redissonClient.getFairLock("fair-order:" + orderId);
        fairLock.lock(30, TimeUnit.SECONDS);
        try {
            processOrderInternal(orderId);
        } finally {
            fairLock.unlock();
        }
    }

    // Read-write lock
    public void readWriteExample(String resource) throws InterruptedException {
        RReadWriteLock rwLock = redissonClient.getReadWriteLock(resource);

        // Multiple readers allowed simultaneously
        rwLock.readLock().lock();
        try {
            // read
        } finally {
            rwLock.readLock().unlock();
        }

        // Only one writer, exclusive
        rwLock.writeLock().lock();
        try {
            // write
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

---

## Redlock Algorithm (Multi-Node)

For maximum fault tolerance, acquire the lock on the majority of `N` independent Redis nodes:

```
1. Get current timestamp T1
2. Try to acquire lock on all N nodes with short timeout
3. Lock acquired if > N/2 + 1 nodes succeeded AND total elapsed < TTL
4. If failed, release lock on all nodes that granted it
```

Redisson implements Redlock automatically:

```java
RLock lock1 = redissonClient1.getLock("my-lock");
RLock lock2 = redissonClient2.getLock("my-lock");
RLock lock3 = redissonClient3.getLock("my-lock");

RedissonRedLock redLock = new RedissonRedLock(lock1, lock2, lock3);
redLock.lock();
try {
    // critical section
} finally {
    redLock.unlock();
}
```

---

## Lock Best Practices

| Practice | Reason |
|---|---|
| Always set TTL on locks | Prevents deadlocks if process dies |
| Use unique lock values (UUID) | Prevent accidental release by another holder |
| Use Lua script for release | Atomic check-and-delete |
| Keep critical section short | Reduces lock contention |
| Implement lock renewal for long tasks | Prevents premature expiry |
| Prefer Redisson for production | Handles edge cases and Redlock |
| Handle `LockNotAcquiredException` | Retry, queue, or fail gracefully |

---

## Interview Questions

### Q: Why is lock ownership token mandatory in Redis locking?
**A:** It prevents one process from accidentally releasing another process's lock.

### Q: What is the main limitation of simple single-instance Redis locks?
**A:** They are vulnerable to node failures and clock/TTL edge cases in distributed environments.

### Q: When is Redlock appropriate and when is it not enough?
**A:** It improves fault tolerance across nodes, but strict correctness still needs fencing at the resource layer.

### Q: How do you prevent duplicate business side effects even with locks?
**A:** Combine locking with idempotency keys and deduplication at persistence boundaries.

### Q: What is a safe strategy for long-running critical sections?
**A:** Use bounded lease time with heartbeat renewal and clear timeout/fallback policy.

### Q: Which production signals indicate lock contention problems?
**A:** Increasing lock acquisition latency, high timeout rates, and elevated retry loops in critical paths.
