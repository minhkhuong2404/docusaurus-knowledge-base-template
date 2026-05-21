---
id: scaling-writes
title: Scaling Writes
sidebar_label: Scaling Writes
description: Techniques for handling high write throughput including sharding, partitioning, write-ahead logging, append-only patterns, batching, and async write pipelines.
tags: [scaling, writes, sharding, partitioning, kafka, wal, async, performance]
---

# Scaling Writes

> Write scaling is harder than read scaling — writes mutate state and require consistency guarantees.

## Table of Contents

- [Write Bottleneck Diagnosis](#write-bottleneck-diagnosis)
- [Async Write Pipelines](#async-write-pipelines)
  - [When to Use](#when-to-use)
  - [Spring Boot + Kafka Producer](#spring-boot--kafka-producer)
  - [Message Queue Options](#message-queue-options)
- [Batching Writes](#batching-writes)
  - [Manual Batching](#manual-batching)
  - [Spring Batch](#spring-batch)
  - [Bulk Insert Performance](#bulk-insert-performance)
- [Write-Ahead Log (WAL)](#write-ahead-log-wal)
  - [How WAL Works](#how-wal-works)
  - [WAL Implementations](#wal-implementations)
  - [WAL Performance](#wal-performance)
- [Sharding (Horizontal Partitioning)](#sharding-horizontal-partitioning)
- [Append-Only Patterns](#append-only-patterns)
  - [Event Sourcing](#event-sourcing)
  - [Ledger Pattern](#ledger-pattern)
  - [Immutable Data](#immutable-data)
- [Backpressure & Rate Limiting Writes](#backpressure--rate-limiting-writes)
  - [Token Bucket](#token-bucket)
  - [Leaky Bucket](#leaky-bucket)
  - [Adaptive Throttling](#adaptive-throttling)
- [Connection Pooling](#connection-pooling)
  - [HikariCP Configuration](#hikaricp-configuration)
  - [Connection Pool Best Practices](#connection-pool-best-practices)
- [Idempotent Writes](#idempotent-writes)
  - [Idempotency Keys](#idempotency-keys)
  - [Optimistic Concurrency](#optimistic-concurrency)
  - [Deduplication](#deduplication)
- [Database Write Optimization](#database-write-optimization)
  - [Indexing Trade-offs](#indexing-trade-offs)
  - [Bulk Insert Performance](#bulk-insert-performance-1)
  - [Partitioned Tables](#partitioned-tables)
  - [Write Optimization Techniques](#write-optimization-techniques)
- [Consistent Hashing Deep Dive](#consistent-hashing-deep-dive)
  - [Beginner View](#beginner-view)
  - [Senior Deep Dive](#senior-deep-dive)
  - [Rebalance Math Intuition](#rebalance-math-intuition)
  - [Failure Modes and Guardrails](#failure-modes-and-guardrails)
  - [Decision Checklist](#decision-checklist)
- [Write Scaling Decision Tree](#write-scaling-decision-tree)
- [How Write Scaling Works Internally]((#how-write-scaling-works-internally)
  - [Write Path](#write-path)
  - [Commit Protocol](#commit-protocol)
  - [Replication](#replication)
  - [Durability](#durability)
- [Real-World Implementations](#real-world-implementations)
  - [Kafka](#kafka)
  - [Cassandra](#cassandra)
  - [DynamoDB](#dynamodb)
  - [MongoDB](#mongodb)
  - [PostgreSQL](#postgresql)
- [Integration Patterns](#integration-patterns)
  - [Spring Kafka Integration](#spring-kafka-integration)
  - [Spring Batch Integration](#spring-batch-integration)
  - [Database Sharding Integration](#database-sharding-integration)
- [Pros and Cons](#pros-and-cons)
  - [Async Write Pipelines](#async-write-pipelines-1)
  - [Batching](#batching)
  - [Sharding](#sharding)
  - [Append-Only](#append-only)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Write-Ahead Logging Internals](#write-ahead-logging-internals)
  - [LSM Trees](#lsm-trees)
  - [B-Tree vs LSM Tree](#b-tree-vs-lsm-tree)
  - [Write Amplification](#write-amplification)
  - [Compaction Strategies](#compaction-strategies)
  - [Distributed Transactions](#distributed-transactions)
  - [Two-Phase Commit](#two-phase-commit)
  - [Three-Phase Commit](#three-phase-commit)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

---

## Write Bottleneck Diagnosis

Before adding complexity, measure:
- Is the bottleneck **CPU**, **I/O**, **network**, or **lock contention**?
- What's the current write QPS vs the DB's limit?
- Are writes synchronous or could they be async?

```java
@Service
public class WriteBottleneckAnalyzer {
    private final MeterRegistry meterRegistry;

    public WriteBottleneckReport analyze() {
        WriteBottleneckReport report = new WriteBottleneckReport();

        // CPU usage
        double cpuUsage = getCpuUsage();
        report.setCpuUsage(cpuUsage);

        // I/O usage
        double ioUsage = getIoUsage();
        report.setIoUsage(ioUsage);

        // Network usage
        double networkUsage = getNetworkUsage();
        report.setNetworkUsage(networkUsage);

        // Lock contention
        double lockContention = getLockContention();
        report.setLockContention(lockContention);

        // Write QPS
        double writeQps = meterRegistry.counter("write.operations").count();
        report.setWriteQps(writeQps);

        return report;
    }

    private double getCpuUsage() {
        // Implementation to get CPU usage
        return 0.0;
    }

    private double getIoUsage() {
        // Implementation to get I/O usage
        return 0.0;
    }

    private double getNetworkUsage() {
        // Implementation to get network usage
        return 0.0;
    }

    private double getLockContention() {
        // Implementation to get lock contention
        return 0.0;
    }
}
```

---

## Async Write Pipelines

The first optimization: **don't make users wait for writes to persist**.

```
Client → API → Message Queue (Kafka) → Consumer → DB
                    ↑ ack immediately
```

### When to Use
- Writes don't need to be read back immediately
- Non-financial: activity logs, analytics events, notifications

### Spring Boot + Kafka Producer

```java
@Service
public class EventService {
    @Autowired private KafkaTemplate<String, ActivityEvent> kafkaTemplate;

    public void recordActivity(ActivityEvent event) {
        // Return immediately; Kafka handles delivery
        kafkaTemplate.send("activity-events", event.getUserId().toString(), event);
    }

    @KafkaListener(topics = "activity-events")
    public void processActivity(ActivityEvent event) {
        activityRepository.save(event); // Async, batched by Kafka consumer
    }
}
```

### Message Queue Options

| Queue | Use Case | Pros | Cons |
|---|---|---|---|
| **Kafka** | High throughput, event streaming | High throughput, durable, ordered | Complex setup |
| **RabbitMQ** | Reliable messaging, work queues | Flexible routing, reliable | Lower throughput |
| **AWS SQS** | Simple queue, cloud-native | Managed, scalable | Not ordered |
| **Redis Streams** | Lightweight streaming | Fast, simple | Limited features |

---

## Batching Writes

Accumulate writes in memory and flush as one batch.

### Manual Batching

```java
@Service
public class BatchWriteService {
    private final List<Event> batch = new ArrayList<>();
    private final int batchSize = 100;

    @Scheduled(fixedRate = 1000)
    public void flushBatch() {
        if (batch.isEmpty()) {
            return;
        }

        List<Event> eventsToWrite = new ArrayList<>(batch);
        batch.clear();

        jdbcTemplate.batchUpdate(
            "INSERT INTO events(user_id, type, ts) VALUES (?, ?, ?)",
            eventsToWrite,
            batchSize,
            (ps, e) -> {
                ps.setLong(1, e.getUserId());
                ps.setString(2, e.getType());
                ps.setTimestamp(3, Timestamp.from(e.getTimestamp()));
            }
        );
    }

    public void addEvent(Event event) {
        batch.add(event);

        if (batch.size() >= batchSize) {
            flushBatch();
        }
    }
}
```

### Spring Batch

```java
@Configuration
@EnableBatchProcessing
public class BatchConfig {

    @Bean
    public Job importEventsJob(JobBuilderFactory jobs, Step step1) {
        return jobs.get("importEventsJob")
            .incrementer(new RunIdIncrementer())
            .flow(step1)
            .end()
            .build();
    }

    @Bean
    public Step step1(StepBuilderFactory stepBuilderFactory,
                      ItemReader<Event> reader,
                      ItemWriter<Event> writer) {
        return stepBuilderFactory.get("step1")
            .<Event, Event>chunk(100)
            .reader(reader)
            .writer(writer)
            .build();
    }
}
```

### Bulk Insert Performance

```sql
-- Use COPY in PostgreSQL (fastest bulk load)
COPY events(user_id, type, ts) FROM '/data/events.csv' CSV;

-- Or multi-row VALUES
INSERT INTO events(user_id, type, ts) VALUES
  (1, 'click', now()), (2, 'view', now()), ...;
```

**Performance gain**: 10–100× fewer round trips to DB.

---

## Write-Ahead Log (WAL)

Append writes to a sequential log first (fast), apply to storage later (async).

```
Write → WAL (append-only, sequential I/O) → ACK to client
              ↓ (async)
         Apply to B-Tree / Storage Engine
```

**Used in**: PostgreSQL, MySQL (InnoDB redo log), Kafka itself.  
**Why fast**: Sequential I/O is 10–100× faster than random I/O.

### How WAL Works

```
1. Client sends write request
2. DB appends write to WAL (sequential)
3. DB acknowledges to client
4. DB applies write to data structures (async)
5. Checkpoint: flush dirty pages to disk
```

### WAL Implementations

**PostgreSQL WAL:**

```sql
-- Check WAL settings
SHOW wal_level;
SHOW max_wal_size;
SHOW wal_buffers;

-- Force WAL flush
SELECT pg_current_wal_lsn();
```

**MySQL InnoDB Redo Log:**

```sql
-- Check InnoDB log settings
SHOW VARIABLES LIKE 'innodb_log%';
SHOW VARIABLES LIKE 'innodb_flush_log%';
```

### WAL Performance

```java
@Service
public class WalPerformanceService {
    private final MeterRegistry meterRegistry;

    public void recordWrite(Duration writeTime) {
        meterRegistry.timer("write.time").record(writeTime);
    }

    public void recordWalFlush(Duration flushTime) {
        meterRegistry.timer("wal.flush.time").record(flushTime);
    }

    public void recordCheckpoint(Duration checkpointTime) {
        meterRegistry.timer("checkpoint.time").record(checkpointTime);
    }
}
```

---

## Sharding (Horizontal Partitioning)

Split data across multiple DB instances. Each shard handles a subset of writes.

:::info[Deep Dive: Sharding & Partitioning]
The detailed guide on Horizontal Partitioning, Sharding Strategies (Hash, Range, Consistent Hashing), Cross-Shard complexity, and Snowflake IDs has been moved to its own centralized page. 
Please see the **[Database Sharding & Partitioning](./sharding-partitioning.md)** guide.
:::

---

## Append-Only Patterns

Instead of updating records, append new state. Enables high write throughput.

```sql
-- Instead of UPDATE account SET balance = balance - 100
-- Use append-only ledger:
INSERT INTO ledger(account_id, delta, ts) VALUES (42, -100, now());

-- Balance = SUM(delta) for account_id = 42
```

**Used by**: Event sourcing, accounting systems, Kafka.

### Event Sourcing

```java
@Entity
public class AccountEvent {
    @Id
    private Long id;
    private String accountId;
    private String eventType;
    private BigDecimal amount;
    private Instant timestamp;
}

@Service
public class AccountService {
    private final AccountEventRepository eventRepository;

    public void deposit(String accountId, BigDecimal amount) {
        AccountEvent event = new AccountEvent();
        event.setAccountId(accountId);
        event.setEventType("DEPOSIT");
        event.setAmount(amount);
        event.setTimestamp(Instant.now());

        eventRepository.save(event);
    }

    public BigDecimal getBalance(String accountId) {
        return eventRepository.findByAccountId(accountId).stream()
            .map(event -> {
                if ("DEPOSIT".equals(event.getEventType())) {
                    return event.getAmount();
                } else if ("WITHDRAWAL".equals(event.getEventType())) {
                    return event.getAmount().negate();
                }
                return BigDecimal.ZERO;
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

### Ledger Pattern

```java
@Entity
public class LedgerEntry {
    @Id
    private Long id;
    private String accountId;
    private BigDecimal delta;
    private Instant timestamp;
    private String description;
}

@Service
public class LedgerService {
    private final LedgerEntryRepository ledgerRepository;

    @Transactional
    public void recordTransaction(String accountId, BigDecimal delta, String description) {
        LedgerEntry entry = new LedgerEntry();
        entry.setAccountId(accountId);
        entry.setDelta(delta);
        entry.setTimestamp(Instant.now());
        entry.setDescription(description);

        ledgerRepository.save(entry);
    }

    public BigDecimal getBalance(String accountId) {
        return ledgerRepository.findByAccountId(accountId).stream()
            .map(LedgerEntry::getDelta)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

### Immutable Data

```java
@Immutable
public class ImmutableUser {
    private final String id;
    private final String name;
    private final String email;

    public ImmutableUser withName(String newName) {
        return new ImmutableUser(this.id, newName, this.email);
    }

    public ImmutableUser withEmail(String newEmail) {
        return new ImmutableUser(this.id, this.name, newEmail);
    }
}
```

---

## Backpressure & Rate Limiting Writes

Prevent upstream from overwhelming downstream.

### Token Bucket

```java
@Service
public class TokenBucketRateLimiter {
    private final long capacity;
    private final long refillRate;
    private final AtomicLong tokens;
    private final AtomicLong lastRefillTime;

    public TokenBucketRateLimiter(long capacity, long refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = new AtomicLong(capacity);
        this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
    }

    public boolean tryAcquire() {
        refillTokens();

        long currentTokens = tokens.get();
        if (currentTokens > 0) {
            return tokens.compareAndSet(currentTokens, currentTokens - 1);
        }
        return false;
    }

    private void refillTokens() {
        long now = System.currentTimeMillis();
        long lastRefill = lastRefillTime.get();
        long elapsed = now - lastRefill;

        if (elapsed > 0) {
            long newTokens = (elapsed * refillRate) / 1000;
            if (newTokens > 0) {
                tokens.updateAndGet(current -> Math.min(capacity, current + newTokens));
                lastRefillTime.compareAndSet(lastRefill, now);
            }
        }
    }
}
```

### Leaky Bucket

```java
@Service
public class LeakyBucketRateLimiter {
    private final long capacity;
    private final long leakRate;
    private final AtomicLong volume;
    private final AtomicLong lastLeakTime;

    public LeakyBucketRateLimiter(long capacity, long leakRate) {
        this.capacity = capacity;
        this.leakRate = leakRate;
        this.volume = new AtomicLong(0);
        this.lastLeakTime = new AtomicLong(System.currentTimeMillis());
    }

    public boolean tryAcquire() {
        leak();

        long currentVolume = volume.get();
        if (currentVolume < capacity) {
            return volume.compareAndSet(currentVolume, currentVolume + 1);
        }
        return false;
    }

    private void leak() {
        long now = System.currentTimeMillis();
        long lastLeak = lastLeakTime.get();
        long elapsed = now - lastLeak;

        if (elapsed > 0) {
            long leaked = (elapsed * leakRate) / 1000;
            if (leaked > 0) {
                volume.updateAndGet(current -> Math.max(0, current - leaked));
                lastLeakTime.compareAndSet(lastLeak, now);
            }
        }
    }
}
```

### Adaptive Throttling

```java
@Service
public class AdaptiveThrottler {
    private final AtomicLong successCount = new AtomicLong(0);
    private final AtomicLong failureCount = new AtomicLong(0);
    private final AtomicInteger currentLimit = new AtomicInteger(100);

    public boolean tryAcquire() {
        int limit = currentLimit.get();

        if (limit <= 0) {
            return false;
        }

        if (currentLimit.decrementAndGet() >= 0) {
            return true;
        } else {
            currentLimit.incrementAndGet();
            return false;
        }
    }

    public void recordSuccess() {
        successCount.incrementAndGet();
        adjustLimit();
    }

    public void recordFailure() {
        failureCount.incrementAndGet();
        adjustLimit();
    }

    private void adjustLimit() {
        long successes = successCount.get();
        long failures = failureCount.get();
        long total = successes + failures;

        if (total == 0) {
            return;
        }

        double successRate = (double) successes / total;

        if (successRate > 0.9) {
            // Increase limit
            currentLimit.updateAndGet(limit -> Math.min(1000, limit + 10));
        } else if (successRate < 0.5) {
            // Decrease limit
            currentLimit.updateAndGet(limit -> Math.max(10, limit - 10));
        }
    }
}
```

---

## Connection Pooling

DB connections are expensive. Pool and reuse them.

### HikariCP Configuration

```yaml
# application.yml — HikariCP (Spring Boot default)
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 3000    # 3s max wait for connection
      idle-timeout: 600000        # 10 min
      max-lifetime: 1800000       # 30 min
```

**Rule of thumb**: `pool_size = (core_count * 2) + effective_spindle_count`

### Connection Pool Best Practices

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource primaryDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://primary:5432/db");
        config.setUsername("user");
        config.setPassword("password");
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(3000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setPoolName("PrimaryPool");

        return new HikariDataSource(config);
    }

    @Bean
    public DataSource replicaDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://replica:5432/db");
        config.setUsername("user");
        config.setPassword("password");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(3000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setPoolName("ReplicaPool");

        return new HikariDataSource(config);
    }
}
```

---

## Idempotent Writes

Ensure retrying a write doesn't cause duplicates.

### Idempotency Keys

```java
// Idempotency key in DB
@Transactional
public OrderResult placeOrder(PlaceOrderCommand cmd) {
    // Check if already processed
    if (orderRepository.existsByIdempotencyKey(cmd.getIdempotencyKey())) {
        return orderRepository.findByIdempotencyKey(cmd.getIdempotencyKey());
    }
    Order order = new Order(cmd);
    order.setIdempotencyKey(cmd.getIdempotencyKey());
    return orderRepository.save(order);
}
```

### Optimistic Concurrency

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
    @Retryable(value = OptimisticLockingFailureException.class, maxAttempts = 3)
    public void purchaseProduct(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        product.decreaseStock(quantity);
        productRepository.save(product);
    }
}
```

### Deduplication

```java
@Service
public class DeduplicationService {
    private final RedisTemplate<String, String> redisTemplate;

    public boolean isDuplicate(String idempotencyKey) {
        String key = "dedup:" + idempotencyKey;
        Boolean exists = redisTemplate.hasKey(key);

        if (Boolean.FALSE.equals(exists)) {
            redisTemplate.opsForValue().set(key, "1", Duration.ofHours(24));
            return false;
        }

        return true;
    }
}
```

---

## Database Write Optimization

### Indexing Trade-offs

- **Every index slows writes** (must update index on every insert/update)
- Audit indexes regularly; drop unused ones
- Partial indexes for filtered writes

```sql
-- Partial index for active records only
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- Covering index (includes all columns needed)
CREATE INDEX idx_post_cover ON posts(user_id, created_at, title, preview);
```

### Bulk Insert Performance

```sql
-- Use COPY in PostgreSQL (fastest bulk load)
COPY events(user_id, type, ts) FROM '/data/events.csv' CSV;

-- Or multi-row VALUES
INSERT INTO events(user_id, type, ts) VALUES
  (1, 'click', now()), (2, 'view', now()), ...;
```

### Partitioned Tables

```sql
CREATE TABLE events (
    id BIGSERIAL,
    ts TIMESTAMPTZ NOT NULL,
    data JSONB
) PARTITION BY RANGE (ts);

CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

Drop old partitions instantly instead of slow DELETEs.

### Write Optimization Techniques

```java
@Service
public class WriteOptimizationService {
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void batchInsert(List<Event> events) {
        jdbcTemplate.batchUpdate(
            "INSERT INTO events(user_id, type, ts) VALUES (?, ?, ?)",
            events,
            100,
            (ps, event) -> {
                ps.setLong(1, event.getUserId());
                ps.setString(2, event.getType());
                ps.setTimestamp(3, Timestamp.from(event.getTimestamp()));
            }
        );
    }

    @Transactional
    public void bulkInsert(List<Event> events) {
        String sql = "INSERT INTO events(user_id, type, ts) VALUES ";

        List<String> values = events.stream()
            .map(event -> String.format("(%d, '%s', '%s')",
                event.getUserId(),
                event.getType(),
                event.getTimestamp()))
            .toList();

        sql += String.join(", ", values);

        jdbcTemplate.update(sql);
    }
}
```

---

## Consistent Hashing Deep Dive

:::info[Deep Dive: Consistent Hashing]
For a deep dive into the math, rebalancing, and virtual nodes, see the centralized **[Consistent Hashing](./consistent-hashing.md)** page.
:::

---

## Write Scaling Decision Tree

```
Is write throughput the bottleneck?
  ├─ Can writes be async? → Use queue (Kafka)
  ├─ Can writes be batched? → Batch + WAL
  ├─ Single DB maxed out?
  │    ├─ < 5,000 wps → Optimize queries, add indexes
  │    ├─ 5,000–50,000 wps → Connection pool, caching, async
  │    └─ > 50,000 wps → Sharding or specialized DB
  └─ Hot rows/tables? → See Handling Contention
```

---

## How Write Scaling Works Internally

### Write Path

```
1. Client sends write request
2. Application validates request
3. Application generates write operation
4. Write operation sent to database
5. Database acquires locks
6. Database writes to WAL
7. Database acknowledges to client
8. Database applies write to data structures
9. Database releases locks
```

### Commit Protocol

```
1. Begin transaction
2. Execute write operations
3. Write to WAL
4. Commit transaction
5. Release locks
6. Acknowledge to client
```

### Replication

```
Primary:
1. Receive write request
2. Write to WAL
3. Apply to data structures
4. Send replication stream to replicas

Replica:
1. Receive replication stream
2. Apply changes
3. Update replication position
```

### Durability

```
1. Write to WAL (durable)
2. Flush WAL to disk
3. Acknowledge to client
4. Apply to data structures (async)
5. Checkpoint: flush dirty pages
```

---

## Real-World Implementations

### Kafka

Kafka uses append-only logs for high write throughput:

- **Partitioning**: Data partitioned across multiple brokers
- **Replication**: Each partition replicated for durability
- **Batching**: Messages batched for efficiency
- **Compression**: Messages compressed to reduce I/O

### Cassandra

Cassandra uses LSM trees for high write throughput:

- **No master**: All nodes can accept writes
- **Tunable consistency**: Choose consistency level per operation
- **Automatic sharding**: Data automatically distributed
- **Write path**: Write to commit log, memtable, then SSTable

### DynamoDB

DynamoDB uses partitioning for high write throughput:

- **Partition key**: Determines which partition stores data
- **Sort key**: Enables range queries within partition
- **Auto-scaling**: Automatically adjusts capacity
- **Write capacity**: Provisioned or on-demand

### MongoDB

MongoDB uses document model for flexible writes:

- **Sharding**: Data distributed across shards
- **Replica sets**: Each shard has replicas
- **Write concern**: Control write durability
- **Journaling**: WAL for durability

### PostgreSQL

PostgreSQL uses MVCC for high concurrency:

- **WAL**: Write-ahead log for durability
- **MVCC**: Multi-version concurrency control
- **Replication**: Streaming replication
- **Partitioning**: Table partitioning for large tables

---

## Integration Patterns

### Spring Kafka Integration

```java
@Configuration
@EnableKafka
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

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}

@Service
public class EventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendEvent(String topic, Object event) {
        kafkaTemplate.send(topic, event);
    }
}
```

### Spring Batch Integration

```java
@Configuration
@EnableBatchProcessing
public class BatchConfig {

    @Bean
    public Job importEventsJob(JobBuilderFactory jobs, Step step1) {
        return jobs.get("importEventsJob")
            .incrementer(new RunIdIncrementer())
            .flow(step1)
            .end()
            .build();
    }

    @Bean
    public Step step1(StepBuilderFactory stepBuilderFactory,
                      ItemReader<Event> reader,
                      ItemWriter<Event> writer) {
        return stepBuilderFactory.get("step1")
            .<Event, Event>chunk(100)
            .reader(reader)
            .writer(writer)
            .build();
    }
}
```

### Database Sharding Integration

```java
@Configuration
public class ShardingConfig {

    @Bean
    public ShardingDataSource shardingDataSource() {
        Map<String, DataSource> dataSourceMap = new HashMap<>();
        dataSourceMap.put("shard0", createDataSource("shard0"));
        dataSourceMap.put("shard1", createDataSource("shard1"));
        dataSourceMap.put("shard2", createDataSource("shard2"));

        return new ShardingDataSource(dataSourceMap);
    }

    private DataSource createDataSource(String shardName) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://" + shardName + ":5432/db");
        config.setUsername("user");
        config.setPassword("password");
        return new HikariDataSource(config);
    }
}
```

---

## Pros and Cons

### Async Write Pipelines

**Pros:**
- High throughput
- Low latency
- Decouples producers and consumers
- Handles backpressure

**Cons:**
- Eventual consistency
- Complex error handling
- Requires message broker
- Monitoring complexity

### Batching

**Pros:**
- Reduced database round trips
- Improved throughput
- Lower resource usage
- Better transaction efficiency

**Cons:**
- Increased latency
- Memory overhead
- Complex error handling
- Batch size tuning required

### Sharding

**Pros:**
- Horizontal scalability
- Improved write throughput
- Geographic distribution
- Reduced contention

**Cons:**
- Complex routing
- Cross-shard transactions
- Rebalancing complexity
- Operational overhead

### Append-Only

**Pros:**
- High write throughput
- Simple concurrency
- Natural audit trail
- Easy replication

**Cons:**
- Read performance overhead
- Storage growth
- Compaction required
- Query complexity

---

## Interview Questions

### Q: How would you scale a system from 1,000 writes/sec to 100,000 writes/sec?

**A:** Remove single-writer bottlenecks first, then partition by a high-cardinality key and batch writes. Add queue-based buffering, async processing, and tuned storage engines before over-splitting services.

### Q: What is a write-ahead log and why does it speed up writes?

**A:** WAL appends intent sequentially before applying changes to main structures. Sequential disk writes are much faster than random in-place updates, improving throughput and crash recovery.

### Q: How do you choose a shard key, and what makes a bad one?

**A:** Choose a key with high cardinality, even distribution, and query locality. Bad keys are low-cardinality, time-hot, or misaligned with access patterns, creating hotspots.

### Q: What is consistent hashing and why is it used for sharding?

**A:** Consistent hashing maps keys and nodes on a ring so adding/removing nodes moves only a small key subset. It reduces rebalancing cost versus modulo-based partitioning.

### Q: How do you handle cross-shard transactions?

**A:** Prefer schema/workflow design that keeps transactions shard-local. For unavoidable cross-shard workflows, use saga/compensation or 2PC only for narrow critical paths.

### Q: Why are append-only writes faster than in-place updates?

**A:** Appends avoid random read-modify-write and minimize page rewrites. They also simplify concurrency and batching, then compaction reconciles old versions later.

### Q: How do you generate globally unique IDs without a centralized coordinator?

**A:** Use Snowflake/ULID-style IDs combining time and node entropy, or UUIDv7 for sortable uniqueness. Ensure clock skew handling and per-node sequence safeguards.

### Q: What is backpressure and how do you implement it?

**A:** Backpressure limits producers when consumers/storage are saturated to prevent collapse. Implement bounded queues, rate limits, adaptive throttling, and explicit retry-after signals.

### Q: What is the difference between LSM trees and B-trees for write performance?

**A:** LSM trees optimize writes by appending to memtables and flushing to SSTables, making writes fast but reads slower. B-trees provide balanced read/write performance but with higher write amplification.

### Q: How do you handle write amplification in high-throughput systems?

**A:** Use LSM trees, compression, and efficient compaction strategies. Monitor write amplification metrics and tune compaction parameters based on workload characteristics.

### Q: What is the role of partitioning in write scaling?

**A:** Partitioning distributes writes across multiple storage units, reducing contention and improving parallelism. Time-based partitioning enables efficient data lifecycle management.

### Q: How do you implement idempotent writes in a distributed system?

**A:** Use idempotency keys stored in a unique constraint table, or embed version/timestamp in data and check before applying changes. Ensure idempotency across retries and failures.

### Q: What is the difference between synchronous and asynchronous replication?

**A:** Synchronous replication waits for acknowledgment from replicas before committing, ensuring consistency but adding latency. Asynchronous replication commits immediately and replicates later, providing lower latency but potential data loss.

### Q: How do you optimize database connection pooling for high write throughput?

**A:** Tune pool size based on workload, use connection validation, set appropriate timeouts, and monitor pool metrics. Consider separate pools for read and write operations.

### Q: What is the impact of indexes on write performance?

**A:** Every index must be updated on write, increasing write amplification and reducing throughput. Balance read performance benefits against write performance costs, and use partial indexes when possible.

### Q: How do you handle write failures in a distributed system?

**A:** Implement retry logic with exponential backoff, use dead letter queues for failed messages, implement compensation transactions, and provide monitoring and alerting for failure scenarios.

---

## Senior Deep Dive: Advanced Topics

### Write-Ahead Logging Internals

```java
public class WriteAheadLog {
    private final FileChannel logFile;
    private final ByteBuffer buffer;
    private final AtomicLong lsn = new AtomicLong(0);

    public void append(LogRecord record) throws IOException {
        long currentLsn = lsn.getAndIncrement();
        record.setLsn(currentLsn);

        buffer.clear();
        record.serialize(buffer);
        buffer.flip();

        logFile.write(buffer);
        logFile.force(true); // fsync
    }

    public List<LogRecord> read(long startLsn, long endLsn) throws IOException {
        List<LogRecord> records = new ArrayList<>();

        buffer.clear();
        logFile.position(startLsn);
        logFile.read(buffer);
        buffer.flip();

        while (buffer.hasRemaining()) {
            LogRecord record = LogRecord.deserialize(buffer);
            if (record.getLsn() >= startLsn && record.getLsn() <= endLsn) {
                records.add(record);
            }
        }

        return records;
    }
}
```

### LSM Trees

```java
public class LSMTree {
    private final MemTable memTable;
    private final List<SSTable> sstables;
    private final CompactionStrategy compactionStrategy;

    public void put(Key key, Value value) {
        memTable.put(key, value);

        if (memTable.size() > MEMTABLE_THRESHOLD) {
            flush();
        }
    }

    public Value get(Key key) {
        // Check memtable first
        Value value = memTable.get(key);
        if (value != null) {
            return value;
        }

        // Check SSTables in reverse order (newest first)
        for (int i = sstables.size() - 1; i >= 0; i--) {
            value = sstables.get(i).get(key);
            if (value != null) {
                return value;
            }
        }

        return null;
    }

    private void flush() {
        SSTable sstable = new SSTable(memTable);
        sstables.add(sstable);
        memTable.clear();

        // Trigger compaction if needed
        compactionStrategy.compact(sstables);
    }
}
```

### B-Tree vs LSM Tree

| Aspect | B-Tree | LSM Tree |
|---|---|---|
| Write Performance | Slower (random I/O) | Faster (sequential I/O) |
| Read Performance | Faster (single lookup) | Slower (multiple lookups) |
| Write Amplification | Higher | Lower |
| Space Amplification | Lower | Higher |
| Use Case | Read-heavy | Write-heavy |

### Write Amplification

```java
@Service
public class WriteAmplificationAnalyzer {
    private final MeterRegistry meterRegistry;

    public void recordWrite(int bytesWritten) {
        meterRegistry.counter("write.bytes").increment(bytesWritten);
    }

    public void recordFlush(int bytesFlushed) {
        meterRegistry.counter("flush.bytes").increment(bytesFlushed);
    }

    public double getWriteAmplification() {
        long bytesWritten = meterRegistry.counter("write.bytes").count();
        long bytesFlushed = meterRegistry.counter("flush.bytes").count();

        return bytesWritten > 0 ? (double) bytesFlushed / bytesWritten : 0;
    }
}
```

### Compaction Strategies

```java
public interface CompactionStrategy {
    void compact(List<SSTable> sstables);
}

public class SizeTieredCompaction implements CompactionStrategy {
    private final int maxSSTablesPerTier;

    @Override
    public void compact(List<SSTable> sstables) {
        // Group SSTables by size tiers
        Map<Integer, List<SSTable>> tiers = groupBySizeTiers(sstables);

        // Compact each tier
        for (List<SSTable> tier : tiers.values()) {
            if (tier.size() >= maxSSTablesPerTier) {
                compactTier(tier);
            }
        }
    }

    private void compactTier(List<SSTable> tier) {
        // Merge SSTables in the tier
        SSTable merged = mergeSSTables(tier);

        // Replace old SSTables with merged one
        tier.clear();
        tier.add(merged);
    }
}
```

### Distributed Transactions

```java
@Service
public class DistributedTransactionService {
    private final List<TransactionParticipant> participants;

    @Transactional
    public void executeTransaction(List<Operation> operations) {
        // Two-phase commit
        if (!prepare(operations)) {
            rollback(operations);
            throw new TransactionException("Prepare phase failed");
        }

        commit(operations);
    }

    private boolean prepare(List<Operation> operations) {
        for (Operation operation : operations) {
            TransactionParticipant participant = getParticipant(operation);
            if (!participant.prepare(operation)) {
                return false;
            }
        }
        return true;
    }

    private void commit(List<Operation> operations) {
        for (Operation operation : operations) {
            TransactionParticipant participant = getParticipant(operation);
            participant.commit(operation);
        }
    }

    private void rollback(List<Operation> operations) {
        for (Operation operation : operations) {
            TransactionParticipant participant = getParticipant(operation);
            participant.rollback(operation);
        }
    }
}
```

### Two-Phase Commit

```java
@Service
public class TwoPhaseCommitService {
    private final List<TransactionParticipant> participants;

    public void executeTransaction(List<Operation> operations) {
        // Phase 1: Prepare
        List<TransactionParticipant> preparedParticipants = new ArrayList<>();

        for (Operation operation : operations) {
            TransactionParticipant participant = getParticipant(operation);

            if (participant.prepare(operation)) {
                preparedParticipants.add(participant);
            } else {
                // Rollback all prepared participants
                for (TransactionParticipant prepared : preparedParticipants) {
                    prepared.rollback(operation);
                }
                throw new TransactionException("Prepare phase failed");
            }
        }

        // Phase 2: Commit
        for (TransactionParticipant participant : preparedParticipants) {
            participant.commit(operation);
        }
    }
}
```

### Three-Phase Commit

```java
@Service
public class ThreePhaseCommitService {
    private final List<TransactionParticipant> participants;

    public void executeTransaction(List<Operation> operations) {
        // Phase 1: CanCommit
        List<TransactionParticipant> canCommitParticipants = new ArrayList<>();

        for (Operation operation : operations) {
            TransactionParticipant participant = getParticipant(operation);

            if (participant.canCommit(operation)) {
                canCommitParticipants.add(participant);
            } else {
                // Abort all participants
                for (TransactionParticipant canCommit : canCommitParticipants) {
                    canCommit.abort(operation);
                }
                throw new TransactionException("CanCommit phase failed");
            }
        }

        // Phase 2: PreCommit
        List<TransactionParticipant> preCommitParticipants = new ArrayList<>();

        for (TransactionParticipant participant : canCommitParticipants) {
            if (participant.preCommit(operation)) {
                preCommitParticipants.add(participant);
            } else {
                // Abort all participants
                for (TransactionParticipant preCommit : preCommitParticipants) {
                    preCommit.abort(operation);
                }
                throw new TransactionException("PreCommit phase failed");
            }
        }

        // Phase 3: DoCommit
        for (TransactionParticipant participant : preCommitParticipants) {
            participant.doCommit(operation);
        }
    }
}
```

---

## Additional Resources

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Database Internals" by Alex Petrov
- "High Performance MySQL" by Baron Schwartz

### Papers
- "The Log: What every software engineer should know about real-time data's unifying abstraction" by Jay Kreps
- "Dynamo: Amazon's Highly Available Key-value Store" by DeCandia et al.

### Tools
- **Kafka**: Distributed streaming platform
- **Cassandra**: Distributed NoSQL database
- **PostgreSQL**: Relational database with WAL
- **HikariCP**: JDBC connection pool

### Standards
- **ACID**: Database transaction properties
- **WAL**: Write-ahead logging standard
- **LSM**: Log-structured merge trees

---

## Best Practices

### Write Optimization
1. Use async writes when possible
2. Batch writes to reduce round trips
3. Implement proper connection pooling
4. Use WAL for durability
5. Monitor write performance

### Sharding
1. Choose appropriate shard key
2. Use consistent hashing for rebalancing
3. Implement cross-shard transaction handling
4. Monitor shard distribution
5. Plan for shard rebalancing

### Idempotency
1. Use idempotency keys
2. Implement retry logic
3. Handle duplicate requests gracefully
4. Monitor duplicate rates
5. Document idempotency behavior

### Error Handling
1. Implement retry with exponential backoff
2. Use dead letter queues
3. Implement compensation transactions
4. Monitor error rates
5. Alert on critical failures

### Monitoring
1. Track write throughput
2. Monitor write latency
3. Measure write amplification
4. Track error rates
5. Monitor resource usage

### Testing
1. Test write performance under load
2. Test failure scenarios
3. Test idempotency
4. Test cross-shard transactions
5. Test rebalancing

### Security
1. Validate write permissions
2. Implement rate limiting
3. Use encryption for sensitive data
4. Audit write operations
5. Implement access controls
