---
id: database-design
title: Database Design & Normalization
sidebar_label: Database Design
description: Entity-Relationship modeling, normal forms (1NF through BCNF), denormalization trade-offs, and schema design patterns.
tags: [database, design, normalization, erd, 1nf, 2nf, 3nf, bcnf, schema]
sidebar_position: 9
---

import DatabaseDesignNormalizationDiagram from '@site/src/components/DatabaseDesignNormalizationDiagram';

# Database Design & Normalization

---

## SQL vs NoSQL Decision Guide

Before designing a database schema, you must decide between a Relational (SQL) and Non-Relational (NoSQL) database.

| Criteria | SQL | NoSQL |
| :--- | :--- | :--- |
| **Schema** | Fixed, strictly enforced | Flexible, dynamic document |
| **Relationships** | Strong (JOINs, Foreign Keys) | Weak (denormalized / embedded) |
| **Transactions** | Strict ACID compliance | Eventual consistency (usually) |
| **Query Flexibility** | High (arbitrary SQL queries) | Low (query-by-design) |
| **Scaling Writes** | Hard (requires complex sharding) | Built-in horizontal scaling |
| **Best For** | Financial, transactional, relational data | Catalogs, user content, fast sessions |

---

## Entity-Relationship Modeling

An **ER diagram** models the domain before creating tables.

**Core concepts:**
- **Entity**: a thing with independent existence (User, Order, Product)
- **Attribute**: property of an entity (name, email, price)
- **Relationship**: association between entities (User *places* Order)
- **Cardinality**: 1:1, 1:N, M:N

### Relationship Types

```
One-to-One (1:1):
User ──────── UserProfile   (one user has one profile)

One-to-Many (1:N):
User ──────<< Order         (one user has many orders)

Many-to-Many (M:N):
Order >>────<< Product      (via junction table: order_items)
```

### Junction Table (Bridge Table) for M:N

```sql
CREATE TABLE order_items (
    order_id    BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id  BIGINT REFERENCES products(id),
    quantity    INT    NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
```

---

## Primary Key Strategy: Natural Keys vs Surrogate Keys

A crucial architectural decision in database design is selecting the **Primary Key (PK)** strategy:
- **Natural Keys**: Attributes that already exist in the real world (e.g., SSN, Email, ISBN).
  - *Pitfall*: Real-world identifiers change (users change email addresses, countries alter national tax IDs), triggering cascading updates across foreign keys and indices.
- **Surrogate Keys**: System-generated synthetic identifiers with zero business meaning (e.g., auto-increment integers, UUIDs).

### Surrogate Key Architecture: Auto-Increment vs. UUIDv4 vs. UUIDv7

As highlighted by Monis Yousuf in modern distributed system design, choosing the wrong primary key type degrades write throughput, fragments indexes, or leaks proprietary business metrics:

| Key Strategy | Storage Size | B-Tree Write Pattern | Coordination Overhead | IDOR / Security Risk | Best Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auto-Increment (`BIGINT`)** | 8 bytes | Append-only (right-edge leaf) | **High** (requires central DB lock/sequence) | **Extreme** (German Tank Problem, sequential enumeration) | Single-instance DBs with internal-only APIs |
| **Random UUID (`UUIDv4`)** | 16 bytes (or 36-char string) | Random insertion (frequent 50% page splits) | **None** (pure 122-bit client entropy) | **None** (unpredictable, cryptographically secure) | Ephemeral session tokens, password resets, trace IDs |
| **Time-Ordered UUID (`UUIDv7`)** | 16 bytes | Monotonic append (ordered by timestamp) | **None** (client-side generation, millisecond prefix) | **Low** (timestamp visible in prefix, 74 bits entropy) | **Modern distributed primary keys (RFC 9562)** |

#### 1. Why Auto-Increment Breaks in Distributed Systems
1. **Central Coordinator Bottleneck**: Every client write must contact the primary database node to acquire `nextval('seq')`. Distributed clients cannot generate IDs locally prior to network transmission.
2. **The German Tank Problem (Business Leakage)**: Because sequential IDs increase by $+1$, external attackers or competitors can easily gauge company growth metrics:
   $$\text{Total Orders in Period} = \text{ID}_{\text{current}} - \text{ID}_{\text{previous}}$$
3. **Insecure Direct Object Reference (IDOR)**: Predictable URLs like `/api/invoices/1042` allow simple scrapers to enumerate all customer records by incrementing the counter.

#### 2. The Physical Disaster of UUIDv4 on B-Tree Indexes
Because UUIDv4 has 122 bits of pure pseudorandom entropy, new IDs land unpredictably across random leaf pages of the database's clustered B-Tree index:
- **Leaf Page Splits**: When an 8KB/16KB leaf page fills up, inserting an out-of-order UUIDv4 forces the database engine to allocate a new page, split the existing keys 50/50, and rewrite parent pointer nodes.
- **50% Fill Factor Bloat**: Continuous page splits leave indexes only 50-60% full, effectively doubling the physical storage footprint on disk.
- **Buffer Pool Thrashing**: As the table grows beyond available RAM, random writes require pulling cold pages from SSD into the database buffer pool, evicting hot pages and causing severe write latency spikes.

#### 3. The Modern Standard: UUIDv7 (RFC 9562)
Published in May 2024, **RFC 9562** standardizes UUIDv7:
- **Bit 0–47 (48 bits)**: Unix epoch millisecond timestamp.
- **Bit 48–51 (4 bits)**: UUID Version (`0111` for v7).
- **Bit 52–63 (12 bits)**: Pseudorandom entropy (`rand_a`).
- **Bit 64–65 (2 bits)**: RFC variant (`10`).
- **Bit 66–127 (62 bits)**: Pseudorandom entropy (`rand_b`).

**Why UUIDv7 Wins for Database Schemas**:
1. **Append-Only B-Tree Writes**: Because the first 48 bits are monotonically increasing timestamps, inserts always append to the right-most leaf page, achieving 90-100% fill factor and eliminating random page splits.
2. **Client-Side Generation**: Distributed services, edge functions, and offline mobile apps can generate unique primary keys locally without network roundtrips.
3. **Free Created-At Index**: The record creation timestamp is physically encoded in the primary key, saving storage and indexing costs.

---

## Normal Forms

<DatabaseDesignNormalizationDiagram />

Normalization reduces **data redundancy** and prevents **update anomalies**.

### Anomaly Types (Why Normalize?)

```
Unnormalized table: Students
| student_id | student_name | course_id | course_name   | instructor |
|------------|-------------|-----------|---------------|------------|
| 1          | Alice        | CS101     | Intro to CS   | Prof. Lee  |
| 1          | Alice        | CS201     | Data Struct   | Prof. Kim  |
| 2          | Bob          | CS101     | Intro to CS   | Prof. Lee  |
```

- **Insert anomaly**: can't add a course without a student
- **Delete anomaly**: deleting last student in a course loses course info
- **Update anomaly**: changing "Prof. Lee" requires updating multiple rows

---

### First Normal Form (1NF)

**Rule**: Every column must contain atomic (indivisible) values; no repeating groups.

```sql
-- ❌ Violates 1NF (multi-value column)
| order_id | products          |
| 1        | "apple, banana"   |

-- ✅ 1NF compliant
| order_id | product   |
| 1        | apple     |
| 1        | banana    |
```

---

### Second Normal Form (2NF)

**Rule**: Must be in 1NF + every non-key attribute is **fully functionally dependent** on the **entire** primary key (no partial dependencies).

Only applies to tables with **composite primary keys**.

```sql
-- ❌ Violates 2NF
-- PK = (order_id, product_id), but product_name depends only on product_id
| order_id | product_id | product_name | quantity |
| 1        | P1         | Apple        | 5        |
| 2        | P1         | Apple        | 3        |  ← product_name duplicated

-- ✅ 2NF: split out product info
Table: order_items (order_id, product_id, quantity)    -- PK: both columns
Table: products    (product_id, product_name, price)   -- PK: product_id
```

---

### Third Normal Form (3NF)

**Rule**: Must be in 2NF + no **transitive dependencies** (non-key attributes must not depend on other non-key attributes).

```sql
-- ❌ Violates 3NF: zip_code → city (transitive: id → zip_code → city)
| customer_id | name  | zip_code | city     |
| 1           | Alice | 10001    | New York |
| 2           | Bob   | 90210    | LA       |

-- ✅ 3NF: separate zip/city
Table: customers    (customer_id, name, zip_code)
Table: zip_codes    (zip_code, city, state)
```

---

### Boyce-Codd Normal Form (BCNF)

**Rule**: Stricter than 3NF. For every non-trivial functional dependency X → Y, X must be a superkey.

Handles edge cases with overlapping candidate keys.

```sql
-- Example: professor teaches one course per room
-- (student, course) → professor
-- (student, professor) → course
-- professor → course (professor only teaches one course — violates BCNF)
```

---

### Normal Forms Summary

| Normal Form | Requirement |
|-------------|------------|
| 1NF | Atomic values, no repeating groups |
| 2NF | 1NF + no partial dependencies on PK |
| 3NF | 2NF + no transitive dependencies |
| BCNF | 3NF + every determinant is a superkey |
| 4NF | BCNF + no multi-valued dependencies |
| 5NF | 4NF + no join dependencies |

> In practice, **3NF is the target** for OLTP. BCNF and beyond are mainly academic.

---

## Denormalization

Intentionally violating normal forms for **performance**.

| Technique | Description | When |
|-----------|-------------|------|
| **Redundant columns** | Store derived/related data in same table | Avoid expensive JOINs |
| **Pre-aggregated columns** | `order_count`, `total_spent` on user table | Avoid `COUNT`/`SUM` aggregations |
| **Duplicate tables** | Materialized views, summary tables | OLAP reporting |
| **JSON columns** | Embed variable attributes | Sparse/dynamic attributes |

```sql
-- Denormalized: store order count on user to avoid JOIN + COUNT
ALTER TABLE users ADD COLUMN order_count INT DEFAULT 0;

-- Keep in sync with triggers or application logic
UPDATE users SET order_count = order_count + 1 WHERE id = :userId;
```

:::caution[Denormalization moves consistency responsibility to the application. Always have a clear update strategy.]
:::

---

## Schema Design Patterns

### Polymorphic Association

One table references multiple entity types:

```sql
-- ❌ Complex: single table for all entity types
CREATE TABLE comments (
    id          BIGINT PRIMARY KEY,
    body        TEXT,
    entity_type VARCHAR(50),  -- 'post', 'video', 'product'
    entity_id   BIGINT        -- no FK enforcement!
);

-- ✅ Better: separate tables per entity
CREATE TABLE post_comments    (id, post_id REFERENCES posts, body);
CREATE TABLE product_comments (id, product_id REFERENCES products, body);
```

### Soft Delete

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;

-- "Delete"
UPDATE users SET deleted_at = NOW() WHERE id = ?;

-- Query active users
SELECT * FROM users WHERE deleted_at IS NULL;

-- Add partial index to optimize
CREATE INDEX idx_active_users ON users (id) WHERE deleted_at IS NULL;
```

### Audit / History Table

```sql
CREATE TABLE orders_history (
    history_id  BIGSERIAL PRIMARY KEY,
    order_id    BIGINT,
    changed_at  TIMESTAMP DEFAULT NOW(),
    changed_by  VARCHAR(100),
    operation   CHAR(1),  -- 'I', 'U', 'D'
    old_data    JSONB,
    new_data    JSONB
);
```

### Vertical Partitioning

Vertical partitioning splits a table by columns, separating frequently accessed "hot" columns from rarely accessed "cold" columns to optimize memory/cache usage and reduce disk I/O.

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

Table partitioning splits a single logical table into multiple physical child tables based on ranges, lists, or hash keys. This is extremely useful for high-volume logs or time-series data.

```sql
-- Time-based range partitioning
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

-- Drop old partitions instantly (bypasses slow, locking DELETE queries)
DROP TABLE events_2023_q1;
```

### Hierarchical Data (Adjacency List)

```sql
CREATE TABLE categories (
    id        INT PRIMARY KEY,
    name      VARCHAR(100),
    parent_id INT REFERENCES categories(id)  -- self-referential
);

-- Recursive CTE to query full tree (PostgreSQL)
WITH RECURSIVE tree AS (
    SELECT id, name, parent_id, 0 AS depth
    FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, t.depth + 1
    FROM categories c JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree ORDER BY depth, name;
```

Alternative patterns: **Nested Sets**, **Closure Table**, **Materialized Path`.

### EAV — Entity-Attribute-Value

```sql
-- ❌ Flexible but querying is painful
CREATE TABLE product_attributes (
    product_id BIGINT,
    attr_name  VARCHAR(50),
    attr_value VARCHAR(200)
);
-- Finding products where color=red AND size=L requires multiple joins
```

Better alternative: **JSONB in PostgreSQL** for dynamic attributes.

---

## JPA Entity Relationship Annotations

```java
// One-to-Many
@Entity
public class User {
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
}

@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}

// Many-to-Many
@Entity
public class Order {
    @ManyToMany
    @JoinTable(
        name = "order_items",
        joinColumns = @JoinColumn(name = "order_id"),
        inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private Set<Product> products = new HashSet<>();
}
```

---

## Interview Questions

**Q1. What are the three types of anomalies that normalization prevents?**
> Insert anomaly: can't add data about an entity without adding another entity. Delete anomaly: deleting one entity unintentionally removes data about another. Update anomaly: the same fact is stored in multiple places and must be updated everywhere consistently.

**Q2. Explain 2NF and give an example of a violation.**
> 2NF requires no partial dependencies — every non-key column must depend on the entire composite PK. Example violation: a table with PK (order_id, product_id) that also stores product_name. product_name depends only on product_id (partial dependency). Fix: move product_name to a separate products table.

**Q3. What is the difference between 3NF and BCNF?**
> 3NF allows a non-key attribute to determine another non-key attribute if the determinant is a candidate key. BCNF is stricter: every determinant must be a superkey. Most violations of BCNF (beyond 3NF) involve tables with multiple overlapping candidate keys — relatively rare in practice.

**Q4. When should you denormalize a database?**
> Denormalize when JOINs become a measurable performance bottleneck; for pre-computed aggregates on frequently queried summary data; for OLAP/reporting workloads where read performance matters more than write consistency; or when the data model needs to match a specific access pattern (e.g., Cassandra requires denormalization by design).

**Q5. What is the EAV (Entity-Attribute-Value) pattern and what are its problems?**
> EAV stores arbitrary key-value pairs as rows rather than columns — allows dynamic attributes without schema changes. Problems: no data type enforcement, complex querying (pivoting EAV into columns requires many JOINs), poor query performance, no FK constraints. Better alternatives: JSONB columns in PostgreSQL, or a proper document store like MongoDB.

**Q6. How do you model a many-to-many relationship in a relational database?**
> Create a junction (bridge) table that holds FKs from both entities as a composite PK. The junction table can carry additional attributes of the relationship (e.g., quantity, unit_price in order_items). In JPA, use `@ManyToMany` with `@JoinTable`, or better — model the junction as its own `@Entity` if it has attributes.

**Q7. What is a soft delete and what are its trade-offs?**
> Soft delete marks records as deleted (deleted_at timestamp) rather than removing them. Pros: preserves history, supports undo. Cons: all queries must include `WHERE deleted_at IS NULL`; indexes become less effective unless partial indexes are used; related data integrity must be manually managed. Consider using an audit/history table instead.

**Q8. What are the options for storing hierarchical data in a relational database?**
> Adjacency list (parent_id FK): simple, but requires recursive CTEs for deep queries. Closure table: stores all ancestor-descendant pairs; fast queries, expensive inserts. Materialized path: stores path as string (`/1/5/12/`); easy queries with LIKE, but updates are expensive. Nested sets: left/right boundary values; very fast reads, complex writes. Choice depends on read/write ratio and tree depth.

---

## Advanced Editorial Pass: Schema Design as Evolution Strategy

### Senior Engineering Focus
- Design schemas for change frequency and ownership boundaries.
- Balance normalization against read-path simplicity and cost.
- Encode intent through constraints, naming, and relationship clarity.

### Failure Modes to Anticipate
- Schema drift from undocumented business rule changes.
- Accidental coupling between unrelated bounded contexts.
- Migration pain from ambiguous key and relationship choices.

### Practical Heuristics
1. Version schema decisions with rationale.
2. Use migration rehearsals on realistic snapshots.
3. Keep bounded context boundaries explicit in data ownership.

### Compare Next
- [Schema Migrations](./schema-migrations.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [Backup & Recovery](./backup-recovery.md)
