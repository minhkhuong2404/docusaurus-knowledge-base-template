---
id: handling-contention
title: Handling Contention
sidebar_label: Handling Contention
description: Strategies for dealing with race conditions, concurrent writes, hot spots, and lock contention in distributed systems including optimistic locking, MVCC, distributed locks, and queue-based serialization.
tags: [contention, locking, mvcc, optimistic-locking, distributed-lock, race-condition, concurrency]
---

# Handling Contention

> Contention occurs when multiple processes compete for the same resource. It's the primary cause of performance degradation under load.

## Table of Contents

- [Types of Contention](#types-of-contention)
- [Pessimistic Locking](#pessimistic-locking)
  - [Deadlock Prevention](#deadlock-prevention)
  - [Lock Granularity](#lock-granularity)
  - [Lock Timeouts](#lock-timeouts)
- [Optimistic Locking](#optimistic-locking)
  - [Version-Based Optimistic Locking](#version-based-optimistic-locking)
  - [Timestamp-Based Optimistic Locking](#timestamp-based-optimistic-locking)
  - [Retry Strategies](#retry-strategies)
- [MVCC (Multi-Version Concurrency Control)](#mvcc-multi-version-concurrency-control)
  - [How MVCC Works](#how-mvcc-works)
  - [Isolation Levels](#isolation-levels)
  - [MVCC Implementations](#mvcc-implementations)
- [Distributed Locks](#distributed-locks)
  - [Redis-based (Redlock)](#redis-based-redlock)
  - [ZooKeeper-based Locks](#zookeeper-based-locks)
  - [etcd-based Locks](#etcd-based-locks)
  - [Fencing Tokens](#fencing-tokens)
  - [Lease-Based Locking](#lease-based-locking)
- [Queue-Based Serialization](#queue-based-serialization)
  - [Kafka-Based Serialization](#kafka-based-serialization)
  - [RabbitMQ-Based Serialization](#rabbitmq-based-serialization)
  - [Database Queue-Based Serialization](#database-queue-based-serialization)
- [Cache Stampede (Thundering Herd)](#cache-stampede-thundering-herd)
  - [Probabilistic Early Expiration (PER)](#probabilistic-early-expiration-per)
  - [Mutex / Single-Flight Pattern](#mutex--single-flight-pattern)
  - [Staggered TTL](#staggered-ttl)
  - [Request Coalescing](#request-coalescing)
- [Hot Partition Solutions](#hot-partition-solutions)
  - [Hot Kafka Partition](#hot-kafka-partition)
  - [Hot DB Shard](#hot-db-shard)
  - [Hot Cache Key](#hot-cache-key)
- [How Contention Detection Works](#how-contention-detection-works)
  - [Lock Wait Analysis](#lock-wait-analysis)
  - [Contention Metrics](#contention-metrics)
  - [Deadlock Detection](#deadlock-detection)
- [Contention Mitigation Patterns](#contention-mitigation-patterns)
  - [Partitioning Strategies](#partitioning-strategies)
  - [Sharding Strategies](#sharding-strategies)
  - [Load Balancing](#load-balancing)
  - [Rate Limiting](#rate-limiting)
  - [Backpressure](#backpressure)
- [Real-World Implementations](#real-world-implementations)
  - [Database-Level Contention Handling](#database-level-contention-handling)
  - [Application-Level Contention Handling](#application-level-contention-handling)
  - [Distributed System Contention Handling](#distributed-system-contention-handling)
- [Integration Patterns](#integration-patterns)
  - [Spring Integration](#spring-integration)
  - [Kafka Integration](#kafka-integration)
  - [Redis Integration](#redis-integration)
- [Pros and Cons](#pros-and-cons)
  - [Pessimistic Locking](#pessimistic-locking-1)
  - [Optimistic Locking](#optimistic-locking-1)
  - [MVCC](#mvcc)
  - [Distributed Locks](#distributed-locks-1)
  - [Queue-Based Serialization](#queue-based-serialization-1)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Lock-Free Algorithms](#lock-free-algorithms)
  - [Wait-Free Algorithms](#wait-free-algorithms)
  - [Compare-and-Swap (CAS)](#compare-and-swap-cas)
  - [Lock-Free Data Structures](#lock-free-data-structures)
  - [Contention-Aware Scheduling](#contention-aware-scheduling)
  - [Adaptive Locking](#adaptive-locking)
  - [Transactional Memory](#transactional-memory)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

---

## Types of Contention

| Type | Example | Symptom |
|---|---|---|
| **Database row-level lock** | Two transactions updating same account | High lock wait time |
| **Hot partition** | All writes go to same Kafka partition | One partition lags |
| **Hot shard** | Celebrity user's data on one shard | One DB overloaded |
| **Cache stampede** | Cache expires, 10,000 requests hit DB | DB spike on miss |
| **Resource exhaustion** | Connection pool full | `TimeoutException` |
| **Deadlock** | Two transactions waiting for each other | System hangs |
| **Live lock** | Transactions keep retrying without progress | High CPU, no progress |
| **Priority inversion** | Low-priority task holds high-priority resource | Performance degradation |

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

```java
@Transactional
public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
    // Always acquire locks in consistent order (by ID)
    Long firstId = Math.min(fromId, toId);
    Long secondId = Math.max(fromId, toId);

    Account first = accountRepository.findById(firstId,
        LockModeType.PESSIMISTIC_WRITE).orElseThrow();
    Account second = accountRepository.findById(secondId,
        LockModeType.PESSIMISTIC_WRITE).orElseThrow();

    if (fromId.equals(firstId)) {
        first.debit(amount);
        second.credit(amount);
    } else {
        second.debit(amount);
        first.credit(amount);
    }

    accountRepository.save(first);
    accountRepository.save(second);
}
```

### Lock Granularity

Choosing the right lock granularity is crucial for performance.

```java
// Coarse-grained lock (simple but high contention)
public class AccountService {
    private final Lock globalLock = new ReentrantLock();

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        globalLock.lock();
        try {
            // Transfer logic
        } finally {
            globalLock.unlock();
        }
    }
}

// Fine-grained lock (complex but low contention)
public class AccountService {
    private final Striped<Lock> locks = Striped.lock(1024);

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Lock fromLock = locks.get(fromId);
        Lock toLock = locks.get(toId);

        // Acquire locks in consistent order
        Lock firstLock = fromId < toId ? fromLock : toLock;
        Lock secondLock = fromId < toId ? toLock : fromLock;

        firstLock.lock();
        secondLock.lock();
        try {
            // Transfer logic
        } finally {
            secondLock.unlock();
            firstLock.unlock();
        }
    }
}
```

### Lock Timeouts

```java
@Transactional
public void debitAccountWithTimeout(Long accountId, BigDecimal amount) {
    try {
        Account account = accountRepository.findById(accountId,
            LockModeType.PESSIMISTIC_WRITE,
            javax.persistence.LockModeType.PESSIMISTIC_WRITE,
            Map.of("javax.persistence.lock.timeout", 5000)
        ).orElseThrow();

        account.debit(amount);
        accountRepository.save(account);
    } catch (PessimisticLockException e) {
        throw new ConcurrentModificationException("Could not acquire lock", e);
    }
}
```

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

### Version-Based Optimistic Locking

```java
@Entity
public class Product {
    @Id
    private Long id;
    private String name;
    private Integer stock;

    @Version
    private Long version;

    public void decreaseStock(int quantity) {
        if (this.stock < quantity) {
            throw new InsufficientStockException(this.stock, quantity);
        }
        this.stock -= quantity;
    }
}

@Service
public class ProductService {
    @Transactional
    @Retryable(
        value = OptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2)
    )
    public void purchaseProduct(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        product.decreaseStock(quantity);
        productRepository.save(product);
    }
}
```

### Timestamp-Based Optimistic Locking

```java
@Entity
public class Document {
    @Id
    private Long id;
    private String content;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public void updateContent(String newContent, Instant expectedUpdatedAt) {
        if (!this.updatedAt.equals(expectedUpdatedAt)) {
            throw new ConcurrentModificationException(
                "Document was modified by another transaction"
            );
        }
        this.content = newContent;
        this.updatedAt = Instant.now();
    }
}
```

### Retry Strategies

```java
@Service
public class RetryableService {
    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_BACKOFF_MS = 100;

    public <T> T executeWithRetry(Callable<T> operation) {
        int attempts = 0;
        long backoff = INITIAL_BACKOFF_MS;

        while (attempts < MAX_RETRIES) {
            try {
                return operation.call();
            } catch (OptimisticLockingFailureException e) {
                attempts++;
                if (attempts >= MAX_RETRIES) {
                    throw new MaxRetriesExceededException(
                        "Failed after " + MAX_RETRIES + " attempts", e
                    );
                }

                try {
                    Thread.sleep(backoff);
                    backoff *= 2; // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry", ie);
                }
            } catch (Exception e) {
                throw new RuntimeException("Operation failed", e);
            }
        }

        throw new RuntimeException("Should not reach here");
    }
}
```

---

## MVCC (Multi-Version Concurrency Control)

Databases maintain multiple versions of a row. Readers never block writers.

```
T1 reads:  Sees snapshot at T1 start → no blocking
T2 writes: Creates new version → T1 still reads old version
T1 reads:  Still sees old version (consistent snapshot)
```

**Used by**: PostgreSQL, Oracle, MySQL (InnoDB).

### How MVCC Works

MVCC maintains multiple versions of each row, allowing readers to access a consistent snapshot without blocking writers.

```
Row: accounts(id=1, balance=1000, version=1)

Transaction T1 (READ COMMITTED):
1. BEGIN
2. SELECT balance FROM accounts WHERE id=1 → 1000 (version 1)
3. -- T2 updates balance to 900 (version 2)
4. SELECT balance FROM accounts WHERE id=1 → 900 (version 2) -- sees new version
5. COMMIT

Transaction T2 (REPEATABLE READ):
1. BEGIN
2. SELECT balance FROM accounts WHERE id=1 → 1000 (version 1)
3. -- T3 updates balance to 900 (version 2)
4. SELECT balance FROM accounts WHERE id=1 → 1000 (version 1) -- still sees old version
5. COMMIT
```

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
public void processOrder(Long orderId) {
    // Transaction logic
}

// Custom isolation level
@Transactional(isolation = Isolation.SERIALIZABLE)
public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
    // Transaction logic
}
```

### MVCC Implementations

**PostgreSQL MVCC:**

```sql
-- PostgreSQL uses xmin and xmax for MVCC
SELECT id, balance, xmin, xmax FROM accounts WHERE id = 1;

-- xmin: transaction ID that created the row
-- xmax: transaction ID that deleted the row (0 if not deleted)
```

**MySQL InnoDB MVCC:**

```sql
-- MySQL InnoDB uses hidden columns
-- DB_TRX_ID: transaction ID that last modified the row
-- DB_ROLL_PTR: rollback pointer to previous version
-- DB_ROW_ID: hidden row ID

-- View transaction isolation level
SELECT @@transaction_isolation;
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

### ZooKeeper-based Locks

```java
@Service
public class ZooKeeperLockService {
    private final CuratorFramework curatorFramework;

    public void executeWithLock(String lockPath, Runnable action) {
        InterProcessMutex lock = new InterProcessMutex(curatorFramework, lockPath);

        try {
            if (lock.acquire(30, TimeUnit.SECONDS)) {
                try {
                    action.run();
                } finally {
                    lock.release();
                }
            } else {
                throw new ConcurrentModificationException("Could not acquire lock");
            }
        } catch (Exception e) {
            throw new RuntimeException("Lock operation failed", e);
        }
    }
}
```

### etcd-based Locks

```java
@Service
public class EtcdLockService {
    private final Client etcdClient;

    public void executeWithLock(String lockKey, Runnable action) {
        Lock lock = etcdClient.getLockClient()
            .lock(lockKey, 30, TimeUnit.SECONDS);

        try {
            action.run();
        } finally {
            lock.unlock();
        }
    }
}
```

### Fencing Tokens

Prevent stale lock holders from causing damage:

```
1. Client gets lock token (monotonically increasing)
2. Client sends token with each write
3. Storage only accepts writes with token >= last seen token
```

```java
@Service
public class FencingTokenService {
    private final AtomicLong tokenCounter = new AtomicLong(0);

    public long acquireToken() {
        return tokenCounter.incrementAndGet();
    }

    public boolean validateToken(long storedToken, long incomingToken) {
        return incomingToken >= storedToken;
    }
}

@Service
public class AccountService {
    private final FencingTokenService tokenService;
    private final AccountRepository accountRepository;

    @Transactional
    public void updateAccount(Long accountId, BigDecimal newBalance, long token) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (!tokenService.validateToken(account.getLastToken(), token)) {
            throw new StaleTokenException("Token is stale");
        }

        account.setBalance(newBalance);
        account.setLastToken(token);
        accountRepository.save(account);
    }
}
```

### Lease-Based Locking

```java
@Service
public class LeaseLockService {
    private final RedisTemplate<String, String> redisTemplate;

    public boolean tryAcquireLock(String lockKey, String ownerId, Duration leaseDuration) {
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, ownerId, leaseDuration);

        return Boolean.TRUE.equals(acquired);
    }

    public void renewLock(String lockKey, String ownerId, Duration leaseDuration) {
        String currentValue = redisTemplate.opsForValue().get(lockKey);
        if (ownerId.equals(currentValue)) {
            redisTemplate.opsForValue().set(lockKey, ownerId, leaseDuration);
        }
    }

    public void releaseLock(String lockKey, String ownerId) {
        String script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """;

        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(lockKey),
            ownerId
        );
    }
}
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

### Kafka-Based Serialization

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

### RabbitMQ-Based Serialization

```java
@Service
public class RabbitMQCommandService {
    private final RabbitTemplate rabbitTemplate;

    public void sendDebit(Long accountId, BigDecimal amount) {
        // Use routing key to ensure same queue
        String routingKey = "account." + accountId;
        rabbitTemplate.convertAndSend("account-exchange", routingKey,
            new DebitCommand(accountId, amount));
    }
}

@RabbitListener(queues = "account-#{T(java.util.UUID).randomUUID()}")
public void processCommand(DebitCommand cmd) {
    accountService.debit(cmd.getAccountId(), cmd.getAmount());
}
```

### Database Queue-Based Serialization

```java
@Entity
@Table(name = "account_commands")
public class AccountCommand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long accountId;
    private String commandType;
    private BigDecimal amount;
    private CommandStatus status;
    private Instant createdAt;
    private Instant processedAt;

    public enum CommandStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}

@Service
public class AccountCommandProcessor {
    @Scheduled(fixedRate = 100)
    @Transactional
    public void processCommands() {
        List<AccountCommand> commands = commandRepository
            .findTop10ByStatusOrderByCreatedAtAsc(CommandStatus.PENDING);

        for (AccountCommand command : commands) {
            try {
                command.setStatus(CommandStatus.PROCESSING);
                commandRepository.save(command);

                // Process command
                if ("DEBIT".equals(command.getCommandType())) {
                    accountService.debit(command.getAccountId(), command.getAmount());
                }

                command.setStatus(CommandStatus.COMPLETED);
                command.setProcessedAt(Instant.now());
                commandRepository.save(command);
            } catch (Exception e) {
                command.setStatus(CommandStatus.FAILED);
                commandRepository.save(command);
            }
        }
    }
}
```

---

## Cache Stampede (Thundering Herd)

Problem: Popular cache key expires → 10,000 simultaneous cache misses → DB overwhelmed.

### Probabilistic Early Expiration (PER)

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

### Mutex / Single-Flight Pattern

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

### Staggered TTL

```java
// Add jitter to prevent synchronized expiry
long ttl = baseTtl + (long)(Math.random() * jitterRange);
cache.set(key, value, ttl);
```

### Request Coalescing

```java
@Service
public class CoalescingCacheService {
    private final Cache<String, Object> cache;
    private final ConcurrentMap<String, CompletableFuture<Object>> inFlight = new ConcurrentHashMap<>();

    public Object get(String key, Supplier<Object> loader) {
        // Check cache first
        Object cached = cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        // Check if there's already a request in flight
        CompletableFuture<Object> future = inFlight.computeIfAbsent(key, k -> {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    Object value = loader.get();
                    cache.put(key, value);
                    return value;
                } finally {
                    inFlight.remove(k);
                }
            });
        });

        try {
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            inFlight.remove(key);
            throw new RuntimeException("Failed to load value", e);
        }
    }
}
```

---

## Hot Partition Solutions

| Problem | Solution |
|---|---|
| Hot Kafka partition | Use finer-grained partition key or add randomness suffix |
| Hot DB shard (celebrity) | Replicate hot data to multiple shards, route reads round-robin |
| Hot cache key | Local in-process cache for ultra-hot keys |

### Hot Kafka Partition

```java
@Service
public class KafkaPartitionService {
    public void sendEvent(String userId, Event event) {
        // Add random suffix to distribute load
        String partitionKey = userId + "-" + ThreadLocalRandom.current().nextInt(10);
        kafkaTemplate.send("events", partitionKey, event);
    }
}
```

### Hot DB Shard

```java
@Service
public class HotShardService {
    private final List<AccountRepository> shardRepositories;

    public Account getAccount(Long accountId) {
        // Check if account is hot
        if (isHotAccount(accountId)) {
            // Read from all shards and merge
            return readFromAllShards(accountId);
        } else {
            // Read from specific shard
            int shard = getShard(accountId);
            return shardRepositories.get(shard).findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));
        }
    }

    private Account readFromAllShards(Long accountId) {
        // Read from all shards and return the most recent version
        return shardRepositories.stream()
            .map(repo -> repo.findById(accountId))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .max(Comparator.comparing(Account::getUpdatedAt))
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    }
}
```

### Hot Cache Key

```java
@Service
public class HotKeyCacheService {
    private final Cache<String, Object> localCache;
    private final RedisTemplate<String, Object> redisCache;
    private final Set<String> hotKeys = new ConcurrentHashMap().newKeySet();

    public Object get(String key) {
        if (hotKeys.contains(key)) {
            // Check local cache first
            Object value = localCache.getIfPresent(key);
            if (value != null) {
                return value;
            }

            // Load from Redis and cache locally
            value = redisCache.opsForValue().get(key);
            if (value != null) {
                localCache.put(key, value);
            }
            return value;
        } else {
            return redisCache.opsForValue().get(key);
        }
    }

    public void markAsHot(String key) {
        hotKeys.add(key);
    }
}
```

---

## How Contention Detection Works

### Lock Wait Analysis

```java
@Service
public class LockWaitAnalyzer {
    private final MeterRegistry meterRegistry;

    public void recordLockWait(String resource, Duration waitTime) {
        meterRegistry.timer("lock.wait.time", "resource", resource)
            .record(waitTime);

        if (waitTime.compareTo(Duration.ofSeconds(5)) > 0) {
            meterRegistry.counter("lock.wait.long", "resource", resource)
                .increment();
        }
    }

    public LockWaitReport generateReport(String resource) {
        Timer timer = meterRegistry.timer("lock.wait.time", "resource", resource);
        Counter longWaits = meterRegistry.counter("lock.wait.long", "resource", resource);

        return LockWaitReport.builder()
            .resource(resource)
            .averageWait(Duration.ofNanos((long) timer.mean()))
            .maxWait(Duration.ofNanos((long) timer.max())))
            .longWaitCount(longWaits.count())
            .build();
    }
}
```

### Contention Metrics

```java
@Component
public class ContentionMetrics {
    private final MeterRegistry meterRegistry;
    private final AtomicLong contentionCount = new AtomicLong(0);

    public void recordContention(String resource) {
        contentionCount.incrementAndGet();
        meterRegistry.counter("contention.events", "resource", resource)
            .increment();
    }

    public double getContentionRate() {
        return meterRegistry.counter("contention.events").count() /
               (double) meterRegistry.counter("lock.acquisitions").count();
    }
}
```

### Deadlock Detection

```java
@Service
public class DeadlockDetector {
    private final Map<String, Set<String>> waitGraph = new ConcurrentHashMap<>();

    public void recordWait(String waiter, String holder) {
        waitGraph.computeIfAbsent(waiter, k -> new ConcurrentHashSet<>())
            .add(holder);
    }

    public void clearWait(String waiter, String holder) {
        Set<String> holders = waitGraph.get(waiter);
        if (holders != null) {
            holders.remove(holder);
        }
    }

    public Optional<List<String>> detectDeadlock() {
        for (String node : waitGraph.keySet()) {
            List<String> cycle = findCycle(node, new HashSet<>(), new ArrayList<>());
            if (cycle != null) {
                return Optional.of(cycle);
            }
        }
        return Optional.empty();
    }

    private List<String> findCycle(String node, Set<String> visited, List<String> path) {
        if (visited.contains(node)) {
            int index = path.indexOf(node);
            return new ArrayList<>(path.subList(index, path.size()));
        }

        visited.add(node);
        path.add(node);

        Set<String> holders = waitGraph.get(node);
        if (holders != null) {
            for (String holder : holders) {
                List<String> cycle = findCycle(holder, new HashSet<>(visited), new ArrayList<>(path));
                if (cycle != null) {
                    return cycle;
                }
            }
        }

        path.remove(path.size() - 1);
        return null;
    }
}
```

---

## Contention Mitigation Patterns

### Partitioning Strategies

```java
@Service
public class PartitioningService {
    private final int numPartitions;

    public int getPartition(String key) {
        return Math.abs(key.hashCode()) % numPartitions;
    }

    public void distributeWork(String key, Runnable work) {
        int partition = getPartition(key);
        ExecutorService executor = getExecutorForPartition(partition);
        executor.submit(work);
    }
}
```

### Sharding Strategies

```java
@Service
public class ShardingService {
    private final List<DataSource> dataSources;

    public DataSource getShard(String shardKey) {
        int shard = Math.abs(shardKey.hashCode()) % dataSources.size();
        return dataSources.get(shard);
    }

    public <T> T executeInShard(String shardKey, DataSourceCallback<T> callback) {
        DataSource dataSource = getShard(shardKey);
        return callback.execute(dataSource);
    }
}
```

### Load Balancing

```java
@Service
public class LoadBalancingService {
    private final List<ServiceInstance> instances;
    private final AtomicInteger counter = new AtomicInteger(0);

    public ServiceInstance getNextInstance() {
        int index = counter.getAndIncrement() % instances.size();
        return instances.get(index);
    }

    public ServiceInstance getLeastLoadedInstance() {
        return instances.stream()
            .min(Comparator.comparing(ServiceInstance::getLoad))
            .orElseThrow(() -> new NoAvailableInstanceException());
    }
}
```

### Rate Limiting

```java
@Service
public class RateLimitingService {
    private final RedisTemplate<String, String> redisTemplate;

    public boolean tryAcquire(String key, int permits, Duration window) {
        String script = """
            local current = redis.call("GET", KEYS[1])
            if current == false then
                current = 0
            else
                current = tonumber(current)
            end
            if current + tonumber(ARGV[1]) <= tonumber(ARGV[2]) then
                redis.call("INCRBY", KEYS[1], ARGV[1])
                redis.call("EXPIRE", KEYS[1], ARGV[3])
                return 1
            else
                return 0
            end
            """;

        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(key),
            String.valueOf(permits),
            String.valueOf(permits),
            String.valueOf(window.getSeconds())
        );

        return result != null && result == 1;
    }
}
```

### Backpressure

```java
@Service
public class BackpressureService {
    private final Semaphore semaphore;

    public BackpressureService(int maxConcurrency) {
        this.semaphore = new Semaphore(maxConcurrency);
    }

    public <T> CompletableFuture<T> executeWithBackpressure(Callable<T> task) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                semaphore.acquire();
                try {
                    return task.call();
                } finally {
                    semaphore.release();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted", e);
            } catch (Exception e) {
                throw new RuntimeException("Task failed", e);
            }
        });
    }
}
```

---

## Real-World Implementations

### Database-Level Contention Handling

**PostgreSQL:**

```sql
-- Advisory locks for application-level coordination
SELECT pg_advisory_lock(12345);

-- Row-level locks
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- Skip locked rows for job processing
SELECT * FROM jobs WHERE status = 'PENDING'
ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED;
```

**MySQL:**

```sql
-- Row-level locks
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- Shared locks
SELECT * FROM accounts WHERE id = 1 LOCK IN SHARE MODE;

-- Nowait option
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
```

### Application-Level Contention Handling

**Java Concurrent Utilities:**

```java
// ReentrantLock
public class AccountService {
    private final Map<Long, Lock> accountLocks = new ConcurrentHashMap<>();

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Lock fromLock = accountLocks.computeIfAbsent(fromId, k -> new ReentrantLock());
        Lock toLock = accountLocks.computeIfAbsent(toId, k -> new ReentrantLock());

        // Acquire locks in consistent order
        Lock firstLock = fromId < toId ? fromLock : toLock;
        Lock secondLock = fromId < toId ? toLock : fromLock;

        firstLock.lock();
        secondLock.lock();
        try {
            // Transfer logic
        } finally {
            secondLock.unlock();
            firstLock.unlock();
        }
    }
}

// StampedLock
public class AccountService {
    private final Map<Long, StampedLock> accountLocks = new ConcurrentHashMap<>();

    public BigDecimal getBalance(Long accountId) {
        StampedLock lock = accountLocks.get(accountId);
        long stamp = lock.readLock();
        try {
            return accountRepository.findById(accountId).getBalance();
        } finally {
            lock.unlockRead(stamp);
        }
    }

    public void updateBalance(Long accountId, BigDecimal newBalance) {
        StampedLock lock = accountLocks.get(accountId);
        long stamp = lock.writeLock();
        try {
            Account account = accountRepository.findById(accountId);
            account.setBalance(newBalance);
            accountRepository.save(account);
        } finally {
            lock.unlockWrite(stamp);
        }
    }
}
```

### Distributed System Contention Handling

**Redis:**

```java
// Distributed lock with Redis
public class RedisDistributedLock {
    private final RedisTemplate<String, String> redisTemplate;

    public boolean tryLock(String lockKey, String ownerId, Duration ttl) {
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, ownerId, ttl);
        return Boolean.TRUE.equals(acquired);
    }

    public void unlock(String lockKey, String ownerId) {
        String script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """;

        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(lockKey),
            ownerId
        );
    }
}
```

**ZooKeeper:**

```java
// Distributed lock with ZooKeeper
public class ZooKeeperDistributedLock {
    private final CuratorFramework client;
    private final InterProcessMutex lock;

    public ZooKeeperDistributedLock(CuratorFramework client, String lockPath) {
        this.client = client;
        this.lock = new InterProcessMutex(client, lockPath);
    }

    public boolean acquire(long timeout, TimeUnit unit) throws Exception {
        return lock.acquire(timeout, unit);
    }

    public void release() throws Exception {
        lock.release();
    }
}
```

---

## Integration Patterns

### Spring Integration

```java
@Configuration
@EnableRetry
public class ContentionConfig {

    @Bean
    public RetryTemplate retryTemplate() {
        return RetryTemplate.builder()
            .maxAttempts(3)
            .exponentialBackoff(100, 2, 10000)
            .retryOn(OptimisticLockingFailureException.class)
            .build();
    }
}

@Service
public class AccountService {
    private final RetryTemplate retryTemplate;

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        retryTemplate.execute(context -> {
            doTransfer(fromId, toId, amount);
            return null;
        });
    }
}
```

### Kafka Integration

```java
@Configuration
public class KafkaConfig {

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(config);
    }
}

@Service
public class KafkaCommandService {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendCommand(String key, Object command) {
        kafkaTemplate.send("commands", key, command);
    }
}
```

### Redis Integration

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}

@Service
public class RedisLockService {
    private final RedisTemplate<String, Object> redisTemplate;

    public boolean tryLock(String key, String value, Duration ttl) {
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(key, value, ttl);
        return Boolean.TRUE.equals(acquired);
    }
}
```

---

## Pros and Cons

### Pessimistic Locking

**Pros:**
- Simple to implement
- Guarantees consistency
- No retry logic needed
- Good for high contention scenarios

**Cons:**
- Serializes access
- Can cause deadlocks
- Poor performance under high contention
- Blocks readers

### Optimistic Locking

**Pros:**
- No blocking
- Better performance for read-heavy workloads
- No deadlocks
- Scales better

**Cons:**
- Requires retry logic
- Can fail under high contention
- More complex implementation
- Version management overhead

### MVCC

**Pros:**
- Readers don't block writers
- Better concurrency
- Consistent snapshots
- No read locks needed

**Cons:**
- Storage overhead for multiple versions
- Complex implementation
- Version cleanup required
- Potential for long-running transactions

### Distributed Locks

**Pros:**
- Coordinates across nodes
- Prevents concurrent access
- Simple API
- Good for critical sections

**Cons:**
- Network latency
- Single point of failure
- Clock synchronization issues
- Not truly linearizable

### Queue-Based Serialization

**Pros:**
- Guarantees ordering
- No concurrent modification
- Can handle backpressure
- Good for sequential processing

**Cons:**
- Adds latency
- Queue management overhead
- Single point of failure
- Limited throughput

---

## Interview Questions

### Q: What is the difference between optimistic and pessimistic locking? When do you use each?

**A:** Optimistic locking detects conflicts at commit (version check) and works best when contention is low. Pessimistic locking blocks early (`SELECT ... FOR UPDATE`) and is better for high-conflict, short critical sections.

### Q: How does MVCC work and why is it preferred over traditional locking?

**A:** MVCC keeps multiple row versions so readers see a consistent snapshot without blocking writers. It improves read concurrency and reduces lock contention in mixed workloads.

### Q: What is a distributed lock and what are its limitations?

**A:** A distributed lock coordinates ownership across nodes using a shared coordinator like etcd/ZooKeeper/Redis. It can still fail under partitions, pauses, or lease expiry, so it is not a substitute for idempotency and fencing.

### Q: How do you prevent deadlocks in a system with multiple shared resources?

**A:** Acquire resources in a global order, keep transactions short, and set lock timeouts with retry/backoff. Also monitor wait graphs to detect and remediate recurring cycles.

### Q: What is the thundering herd problem and how do you prevent it?

**A:** Many clients wake and hit the same dependency at once, causing overload. Use jittered retries, request coalescing/single-flight, and staggered cache expiry.

### Q: How would you design a ticket booking system to prevent overselling?

**A:** Use atomic inventory decrement with a guard (`remaining > 0`) in one transaction and idempotent reservation IDs. Optionally serialize by seat/event partition and expire unpaid holds.

### Q: What are fencing tokens and why are they needed even with distributed locks?

**A:** Fencing tokens are monotonic numbers attached to lock holders and validated by storage. They prevent stale owners (for example after GC pause) from writing after lease loss.

### Q: How do you handle hot partitions in Kafka?

**A:** Improve key distribution (salting/composite keys), increase partition count where feasible, and move heavy keys to dedicated topics/flows. Apply producer-side batching/compression and consumer parallelism.

### Q: What is the difference between lock-free and wait-free algorithms?

**A:** Lock-free algorithms guarantee that at least one thread makes progress, while wait-free algorithms guarantee that every thread makes progress in bounded time. Lock-free is easier to implement but wait-free provides stronger guarantees.

### Q: How do you detect and resolve deadlocks in a distributed system?

**A:** Use wait-for graphs to detect cycles, implement timeouts, and design systems to avoid circular dependencies. Resolve by aborting one transaction in the cycle and retrying.

### Q: What is the difference between read locks and write locks?

**A:** Read locks allow multiple readers but block writers. Write locks block both readers and other writers. Use read locks for read-heavy workloads and write locks for write-heavy workloads.

### Q: How do you implement backpressure in a high-throughput system?

**A:** Use rate limiting, queue-based processing, and flow control mechanisms. Monitor system metrics and dynamically adjust throughput based on capacity.

### Q: What is the difference between optimistic concurrency control and pessimistic concurrency control?

**A:** Optimistic concurrency control assumes conflicts are rare and checks for them at commit time. Pessimistic concurrency control assumes conflicts are common and prevents them by locking resources upfront.

### Q: How do you handle contention in a microservices architecture?

**A:** Use distributed locks, event-driven architecture, and idempotent operations. Implement circuit breakers and retries to handle transient failures.

### Q: What is the role of version numbers in optimistic locking?

**A:** Version numbers track the state of a resource and are checked on update to detect concurrent modifications. If the version has changed, the update is rejected and retried.

### Q: How do you choose between different isolation levels?

**A:** Consider the trade-off between consistency and performance. Use READ COMMITTED for most cases, REPEATABLE READ for transactions that need consistent reads, and SERIALIZABLE for critical operations.

### Q: What is the difference between a mutex and a semaphore?

**A:** A mutex is a locking mechanism that provides mutual exclusion, while a semaphore is a signaling mechanism that controls access to a fixed number of resources.

### Q: How do you implement rate limiting to prevent system overload?

**A:** Use token bucket or leaky bucket algorithms, implement distributed rate limiting with Redis, and apply rate limiting at multiple layers (API, service, database).

### Q: What is the difference between blocking and non-blocking I/O?

**A:** Blocking I/O waits for the operation to complete before returning, while non-blocking I/O returns immediately and notifies when the operation completes. Non-blocking I/O is better for high-concurrency systems.

### Q: How do you handle long-running transactions in a high-contention environment?

**A:** Break long transactions into smaller ones, use optimistic locking with retries, implement saga pattern for distributed transactions, and consider eventual consistency.

---

## Senior Deep Dive: Advanced Topics

### Lock-Free Algorithms

Lock-free algorithms provide progress guarantees without using locks.

```java
public class LockFreeCounter {
    private final AtomicLong counter = new AtomicLong(0);

    public long increment() {
        return counter.incrementAndGet();
    }

    public long get() {
        return counter.get();
    }
}
```

### Wait-Free Algorithms

Wait-free algorithms guarantee that every thread makes progress in bounded time.

```java
public class WaitFreeQueue<T> {
    private final AtomicReferenceArray<Node<T>> buffer;
    private final AtomicInteger tail = new AtomicInteger(0);
    private final AtomicInteger head = new AtomicInteger(0);
    private final int capacity;

    private static class Node<T> {
        volatile T value;
    }

    public WaitFreeQueue(int capacity) {
        this.capacity = capacity;
        this.buffer = new AtomicReferenceArray<>(capacity);
    }

    public boolean enqueue(T item) {
        int currentTail = tail.get();
        int nextTail = (currentTail + 1) % capacity;

        if (nextTail == head.get()) {
            return false; // Queue is full
        }

        Node<T> node = new Node<>();
        node.value = item;
        buffer.set(currentTail, node);
        tail.set(nextTail);
        return true;
    }

    public T dequeue() {
        int currentHead = head.get();

        if (currentHead == tail.get()) {
            return null; // Queue is empty
        }

        Node<T> node = buffer.get(currentHead);
        T value = node.value;
        node.value = null;
        head.set((currentHead + 1) % capacity);
        return value;
    }
}
```

### Compare-and-Swap (CAS)

CAS is the foundation of many lock-free algorithms.

```java
public class CasCounter {
    private final AtomicLong counter = new AtomicLong(0);

    public long increment() {
        long prev, next;
        do {
            prev = counter.get();
            next = prev + 1;
        } while (!counter.compareAndSet(prev, next));
        return next;
    }
}
```

### Lock-Free Data Structures

```java
public class LockFreeStack<T> {
    private final AtomicReference<Node<T>> head = new AtomicReference<>();

    private static class Node<T> {
        final T value;
        volatile Node<T> next;

        Node(T value) {
            this.value = value;
        }
    }

    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = head.get();
            newHead.next = oldHead;
        } while (!head.compareAndSet(oldHead, newHead));
    }

    public T pop() {
        Node<T> oldHead;
        Node<T> newHead;
        do {
            oldHead = head.get();
            if (oldHead == null) {
                return null;
            }
            newHead = oldHead.next;
        } while (!head.compareAndSet(oldHead, newHead));

        return oldHead.value;
    }
}
```

### Contention-Aware Scheduling

```java
public class ContentionAwareExecutor {
    private final ThreadPoolExecutor executor;
    private final AtomicInteger activeTasks = new AtomicInteger(0);

    public Future<?> submit(Runnable task) {
        if (activeTasks.get() > executor.getMaximumPoolSize() * 0.8) {
            // High contention - reject or queue
            throw new RejectedExecutionException("High contention");
        }

        activeTasks.incrementAndGet();
        return executor.submit(() -> {
            try {
                task.run();
            } finally {
                activeTasks.decrementAndGet();
            }
        });
    }
}
```

### Adaptive Locking

```java
public class AdaptiveLock {
    private final Lock lock = new ReentrantLock();
    private final AtomicInteger contentionCount = new AtomicInteger(0);
    private volatile boolean useOptimistic = true;

    public void lock(Runnable action) {
        if (useOptimistic) {
            try {
                action.run();
                contentionCount.set(0);
            } catch (OptimisticLockException e) {
                contentionCount.incrementAndGet();
                if (contentionCount.get() > 10) {
                    useOptimistic = false;
                }
                lock.lock();
                try {
                    action.run();
                } finally {
                    lock.unlock();
                }
            }
        } else {
            lock.lock();
            try {
                action.run();
            } finally {
                lock.unlock();
            }
        }
    }
}
```

### Transactional Memory

Transactional memory provides a programming model for concurrent operations.

```java
public class TransactionalMemory {
    private final Map<String, Object> memory = new ConcurrentHashMap<>();

    public void executeTransaction(Runnable transaction) {
        Map<String, Object> snapshot = new HashMap<>(memory);
        try {
            transaction.run();
            // Commit
            memory.putAll(snapshot);
        } catch (Exception e) {
            // Rollback
            memory.clear();
            memory.putAll(snapshot);
            throw e;
        }
    }
}
```

---

## Additional Resources

### Books
- "Java Concurrency in Practice" by Brian Goetz
- "Concurrency in Go" by Katherine Cox-Buday
- "The Art of Multiprocessor Programming" by Maurice Herlihy

### Papers
- "Lock-Free Data Structures" by Maurice Herlihy
- "Transactional Memory: Architectural Support for Lock-Free Data Structures" by Shavit and Touitou

### Tools
- **JProfiler**: Java profiling tool
- **VisualVM**: Java monitoring and profiling
- **JConsole**: Java monitoring console
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

### Standards
- **JSR-133**: Java Memory Model
- **JSR-166**: Concurrency Utilities

---

## Best Practices

### Lock Management
1. Keep lock scope as small as possible
2. Always release locks in finally blocks
3. Use try-with-resources for lock management
4. Implement lock timeouts
5. Monitor lock contention

### Transaction Design
1. Keep transactions short
2. Choose appropriate isolation levels
3. Implement retry logic for optimistic locking
4. Use idempotent operations
5. Handle deadlocks gracefully

### Performance Optimization
1. Profile before optimizing
2. Use lock-free algorithms when appropriate
3. Implement backpressure
4. Use connection pooling
5. Cache frequently accessed data

### Monitoring
1. Track lock wait times
2. Monitor deadlock occurrences
3. Measure contention rates
4. Alert on abnormal patterns
5. Analyze performance metrics

### Testing
1. Test concurrent access patterns
2. Simulate high contention scenarios
3. Verify deadlock prevention
4. Test retry logic
5. Measure performance under load

### Security
1. Validate lock ownership
2. Implement fencing tokens
3. Use secure distributed locks
4. Prevent lock exhaustion attacks
5. Audit lock operations

### Documentation
1. Document locking strategies
2. Explain contention handling approaches
3. Provide troubleshooting guides
4. Document performance characteristics
5. Share best practices with team
