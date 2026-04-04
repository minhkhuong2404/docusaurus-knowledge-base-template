---
id: handling-contention
title: Handling Contention
sidebar_label: Handling Contention
description: Strategies for dealing with race conditions, concurrent writes, hot spots, and lock contention in distributed systems including optimistic locking, MVCC, distributed locks, and queue-based serialization.
tags: [contention, locking, mvcc, optimistic-locking, distributed-lock, race-condition, concurrency]
---

# Handling Contention

> Contention occurs when multiple processes compete for the same resource. It's the primary cause of performance degradation under load.

---

## Types of Contention

| Type | Example | Symptom |
|---|---|---|
| **Database row-level lock** | Two transactions updating same account | High lock wait time |
| **Hot partition** | All writes go to same Kafka partition | One partition lags |
| **Hot shard** | Celebrity user's data on one shard | One DB overloaded |
| **Cache stampede** | Cache expires, 10,000 requests hit DB | DB spike on miss |
| **Resource exhaustion** | Connection pool full | `TimeoutException` |

---

## Pessimistic Locking

Lock the resource before reading; release after write.

```java
// JPA/Hibernate pessimistic lock
@Transactional
public void debitAccount(Long accountId, BigDecimal amount) {
    // SELECT ... FOR UPDATE — blocks other transactions
    Account account = accountRepository.findById(accountId,
        LockModeType.PESSIMISTIC_WRITE);
    account.debit(amount);
    accountRepository.save(account);
}
```

**Pros**: Simple, correct.  
**Cons**: Serializes all access. Deadlock risk. Bad for high contention.

### Deadlock Prevention
- Always acquire locks in the same order
- Use lock timeouts: `@Lock(timeout = 5000)`
- Minimize transaction scope

---

## Optimistic Locking

Read without lock. On write, check if version has changed. Retry on conflict.

```java
@Entity
public class Account {
    @Id Long id;
    BigDecimal balance;

    @Version  // JPA manages this automatically
    Long version;
}

@Transactional
public void debitAccount(Long accountId, BigDecimal amount) {
    // No lock on read
    Account account = accountRepository.findById(accountId).orElseThrow();
    account.debit(amount);
    // On save: UPDATE account SET balance=?, version=version+1
    //          WHERE id=? AND version=?
    // Throws OptimisticLockingFailureException if version mismatch
    accountRepository.save(account);
}

// Retry on conflict
@Retryable(value = OptimisticLockingFailureException.class, maxAttempts = 3)
public void debitWithRetry(Long accountId, BigDecimal amount) {
    debitAccount(accountId, amount);
}
```

**Best for**: Low to medium contention. Read-heavy workflows.  
**Avoid when**: High contention (many retries = high load).

---

## MVCC (Multi-Version Concurrency Control)

Databases maintain multiple versions of a row. Readers never block writers.

```
T1 reads:  Sees snapshot at T1 start → no blocking
T2 writes: Creates new version → T1 still reads old version
T1 reads:  Still sees old version (consistent snapshot)
```

**Used by**: PostgreSQL, Oracle, MySQL (InnoDB).

### Isolation Levels
| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | ✓ possible | ✓ possible | ✓ possible |
| READ COMMITTED | ✗ prevented | ✓ possible | ✓ possible |
| REPEATABLE READ | ✗ | ✗ | ✓ possible (MySQL: prevented) |
| SERIALIZABLE | ✗ | ✗ | ✗ prevented |

```java
// Spring — explicit isolation level
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void processOrder(Long orderId) { ... }
```

---

## Distributed Locks

When you need to coordinate across multiple service instances.

### Redis-based (Redlock)
```java
// Spring Boot + Redisson
@Service
public class InventoryService {
    @Autowired private RedissonClient redisson;

    public void reserveItem(Long itemId) {
        RLock lock = redisson.getLock("inventory:lock:" + itemId);
        try {
            // Wait max 5s, release after 30s (prevents deadlock on crash)
            if (lock.tryLock(5, 30, TimeUnit.SECONDS)) {
                try {
                    processReservation(itemId);
                } finally {
                    lock.unlock();
                }
            } else {
                throw new ConcurrentModificationException("Could not acquire lock");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

**Redlock caveats**: Not safe across clock skew scenarios (see Martin Kleppmann's critique). For critical sections, prefer DB-level serialization or Zookeeper.

### Fencing Tokens
Prevent stale lock holders from causing damage:
```
1. Client gets lock token (monotonically increasing)
2. Client sends token with each write
3. Storage only accepts writes with token >= last seen token
```

---

## Queue-Based Serialization

Funnel all writes for a hot resource through a single queue.

```
Multiple clients
    ↓ (all writes)
Queue (FIFO)
    ↓
Single consumer → processes sequentially
    ↓
Account / resource
```

**Used for**: Ticket sales, flash sales, sequential seat booking.

```java
// Kafka with single-partition topic for a specific account
@Service
public class AccountCommandService {
    public void sendDebit(Long accountId, BigDecimal amount) {
        // Key = accountId ensures same partition → ordered processing
        kafkaTemplate.send("account-commands", accountId.toString(),
            new DebitCommand(accountId, amount));
    }
}

@KafkaListener(topics = "account-commands")
public void processCommand(DebitCommand cmd) {
    // Sequential within a partition — no concurrent modification
    accountService.debit(cmd.getAccountId(), cmd.getAmount());
}
```

---

## Cache Stampede (Thundering Herd)

Problem: Popular cache key expires → 10,000 simultaneous cache misses → DB overwhelmed.

### Solutions

**1. Probabilistic Early Expiration (PER)**
```java
public Value get(String key, long ttlMs) {
    CacheEntry entry = cache.get(key);
    if (entry == null) return loadAndCache(key);

    // Re-fetch early with probability proportional to remaining TTL
    double remainingFraction = (double) entry.remainingTtl() / ttlMs;
    if (Math.random() > remainingFraction) {
        loadAndCacheAsync(key); // Refresh in background
    }
    return entry.getValue();
}
```

**2. Mutex / Single-Flight Pattern**
```java
// Only one thread fetches, others wait
private final Map<String, CompletableFuture<Value>> inflight = new ConcurrentHashMap<>();

public Value get(String key) {
    Value cached = cache.get(key);
    if (cached != null) return cached;

    CompletableFuture<Value> future = inflight.computeIfAbsent(key,
        k -> CompletableFuture.supplyAsync(() -> {
            Value v = db.load(k);
            cache.set(k, v);
            inflight.remove(k);
            return v;
        })
    );
    return future.join();
}
```

**3. Staggered TTL**
```java
// Add jitter to prevent synchronized expiry
long ttl = baseTtl + (long)(Math.random() * jitterRange);
cache.set(key, value, ttl);
```

---

## Hot Partition Solutions

| Problem | Solution |
|---|---|
| Hot Kafka partition | Use finer-grained partition key or add randomness suffix |
| Hot DB shard (celebrity) | Replicate hot data to multiple shards, route reads round-robin |
| Hot cache key | Local in-process cache for ultra-hot keys |

---

## Interview Questions

1. What is the difference between optimistic and pessimistic locking? When do you use each?
2. How does MVCC work and why is it preferred over traditional locking?
3. What is a distributed lock and what are its limitations?
4. How do you prevent deadlocks in a system with multiple shared resources?
5. What is the thundering herd problem and how do you prevent it?
6. How would you design a ticket booking system to prevent overselling?
7. What are fencing tokens and why are they needed even with distributed locks?
8. How do you handle hot partitions in Kafka?
