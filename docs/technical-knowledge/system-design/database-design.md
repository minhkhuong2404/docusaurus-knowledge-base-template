---
id: database-design
title: Database Design
sidebar_label: Database Design
description: Comprehensive database design patterns including normalization, indexing strategies, partitioning, replication, query optimization, and choosing between SQL and NoSQL solutions.
tags: [database, sql, nosql, indexing, partitioning, replication, schema-design, query-optimization]
---

# Database Design

---

## SQL vs NoSQL Decision Guide

| Criteria | SQL | NoSQL |
|---|---|---|
| Schema | Fixed, enforced | Flexible, document |
| Relationships | Strong (JOINs, FKs) | Weak (denormalized) |
| Transactions | ACID | Eventual consistency (often) |
| Query flexibility | High (arbitrary queries) | Low (query-by-design) |
| Scaling writes | Hard (sharding complex) | Built for horizontal scale |
| Best for | Financial, relational data | Catalog, user content, sessions |

---

## Normalization

### Normal Forms
| Form | Rule | Violation Example |
|---|---|---|
| 1NF | Atomic columns, no repeating groups | `tags = "java,spring,kafka"` |
| 2NF | No partial dependencies on composite PK | `order_item` stores `product_name` (depends on product_id only) |
| 3NF | No transitive dependencies | `zip_code → city → state` in same table |

### When to Denormalize
- Read performance is critical and JOINs are expensive
- Data doesn't change often
- Query patterns are predictable
- Example: Pre-computed user feed, analytics tables

---

## Indexing

### B-Tree Index (Default)
Good for: equality, range queries, ORDER BY.

```sql
-- Single column
CREATE INDEX idx_user_email ON users(email);

-- Composite — column order matters!
-- Supports: WHERE user_id = ? AND created_at > ?
-- Does NOT support: WHERE created_at > ? (without user_id)
CREATE INDEX idx_posts_user_ts ON posts(user_id, created_at DESC);

-- Covering index (no table lookup needed)
CREATE INDEX idx_post_cover ON posts(user_id, created_at, title)
    INCLUDE (preview_text);
```

### Index Types
| Type | Use Case | DB Support |
|---|---|---|
| B-Tree | General purpose, range queries | All |
| Hash | Exact equality only | PostgreSQL |
| GIN | Full-text search, arrays, JSONB | PostgreSQL |
| GiST | Geometric, range types | PostgreSQL |
| Partial | Index subset of rows | PostgreSQL, MySQL |
| Composite | Multi-column queries | All |

### Partial Index
```sql
-- Only index active users (ignore deleted)
CREATE INDEX idx_active_users ON users(email)
    WHERE deleted_at IS NULL;

-- Only index unprocessed orders
CREATE INDEX idx_pending_orders ON orders(created_at)
    WHERE status = 'PENDING';
```

### Index Anti-Patterns
- Indexing every column (slows writes, wastes storage)
- Low-cardinality index on boolean/status columns with skewed data
- Missing index on foreign keys (causes full scan on JOIN)
- Leading wildcard: `LIKE '%pattern'` — cannot use B-tree index

---

## Query Optimization

### EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE SELECT * FROM orders
WHERE user_id = 123 AND status = 'PENDING'
ORDER BY created_at DESC;

-- Look for:
-- "Seq Scan" → missing index
-- "Nested Loop" with large loops → wrong join strategy
-- "Sort" on large dataset → add index for ORDER BY
```

### N+1 Query Problem
```java
// BAD — N+1 queries
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> {
    List<Item> items = itemRepository.findByOrderId(o.getId()); // N queries!
});

// GOOD — JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.userId = :userId")
List<Order> findWithItems(@Param("userId") Long userId);

// Or use @EntityGraph
@EntityGraph(attributePaths = {"items", "items.product"})
List<Order> findByUserId(Long userId);
```

---

## Partitioning Strategies

### Horizontal Partitioning (Sharding)
See [Scaling Writes](./scaling-writes) for full coverage.

### Vertical Partitioning
```sql
-- Hot columns (frequently accessed)
CREATE TABLE user_core (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    last_login TIMESTAMPTZ
);

-- Cold columns (rarely accessed)
CREATE TABLE user_profile (
    user_id BIGINT REFERENCES user_core(id),
    bio TEXT,
    avatar_url TEXT,
    preferences JSONB
);
```

### Table Partitioning (PostgreSQL)
```sql
-- Time-based partitioning (most common for events/logs)
CREATE TABLE events (
    id BIGSERIAL,
    user_id BIGINT,
    event_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL,
    data JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_q1 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE events_2024_q2 PARTITION OF events
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Drop old partitions instantly (no slow DELETE)
DROP TABLE events_2023_q1;
```

---

## Connection Pool Sizing

```
Optimal pool size = (Core count × 2) + Effective spindle count
```

For typical cloud VMs with SSD:
- 4-core VM → pool size ~10
- Don't over-provision — idle connections waste DB resources

```yaml
# HikariCP (Spring Boot)
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 3
      connection-timeout: 3000
```

---

## Event Sourcing

Store events, not state. Derive current state by replaying events.

```java
// Events are the source of truth
@Entity
public class AccountEvent {
    UUID id;
    Long accountId;
    String type;     // DEPOSIT, WITHDRAWAL, TRANSFER
    BigDecimal amount;
    Instant occurredAt;
}

// Current balance = replay all events
public BigDecimal getBalance(Long accountId) {
    return eventRepository.findByAccountId(accountId)
        .stream()
        .map(e -> "DEPOSIT".equals(e.getType()) ? e.getAmount() : e.getAmount().negate())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

**Benefits**: Full audit trail, temporal queries, easy debugging.  
**Downsides**: Complex queries, need snapshots for performance.

---

## Read Model / Projection

For event-sourced systems, maintain read-optimized projections.

```java
@EventHandler
public void on(DepositEvent event) {
    AccountBalance balance = balanceRepo.findByAccountId(event.getAccountId());
    balance.credit(event.getAmount());
    balanceRepo.save(balance); // Read model always up to date
}
```

---

## Common Schema Design Patterns

### Polymorphic Association
```sql
-- Single table inheritance
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,  -- 'email', 'sms', 'push'
    recipient_id BIGINT,
    -- Email fields (null for SMS/push)
    email_subject TEXT,
    email_body TEXT,
    -- SMS fields (null for email/push)
    phone_number VARCHAR(20),
    sms_body TEXT,
    -- Push fields
    fcm_token TEXT,
    created_at TIMESTAMPTZ
);
```

### Soft Delete
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- Query always filters deleted
SELECT * FROM users WHERE deleted_at IS NULL AND email = ?;

-- Partial index for performance
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

### Audit Columns (Standard)
```sql
-- Always add to every table
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by    BIGINT REFERENCES users(id),
updated_by    BIGINT REFERENCES users(id)
```

---

## Interview Questions

1. When would you choose NoSQL over SQL and vice versa?
2. Explain the difference between 1NF, 2NF, and 3NF. When would you intentionally denormalize?
3. How do composite indexes work? What's the order rule?
4. What is the N+1 query problem and how do you fix it with Spring Data JPA?
5. How does table partitioning work and when should you use it?
6. What is a covering index?
7. How do you approach schema migration in a system with zero downtime requirement?
8. What is event sourcing and what are its trade-offs?
9. How do you handle soft deletes efficiently?
10. What is connection pool sizing and how do you tune HikariCP?
