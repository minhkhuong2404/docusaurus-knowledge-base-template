---
id: relational-fundamentals
title: Relational Fundamentals
description: Core concepts of relational databases — tables, keys, joins, SQL basics, and the relational model.
tags: [database, sql, relational, fundamentals, joins, keys]
sidebar_position: 2
---

import DatabaseJoinAlgorithmsDiagram from '@site/src/components/DatabaseJoinAlgorithmsDiagram';

# Relational Fundamentals

---

## The Relational Model

A **relational database** organizes data into **tables** (relations) composed of rows (tuples) and columns (attributes). Proposed by E.F. Codd in 1970, the model is built on set theory and predicate logic.

Key properties:
- Each row is **unique** (enforced via primary key)
- Column values are **atomic** (no nested structures in strict relational model)
- Order of rows/columns is **irrelevant**
- Relationships expressed via **foreign keys**, not pointers

---

## Keys

| Key Type | Description |
|----------|-------------|
| **Primary Key (PK)** | Uniquely identifies each row; cannot be NULL |
| **Composite Key** | PK made of two or more columns |
| **Foreign Key (FK)** | References a PK in another table; enforces referential integrity |
| **Candidate Key** | Any column(s) that could serve as PK |
| **Surrogate Key** | Artificial key (e.g. auto-increment ID, UUIDv7) with no business meaning |
| **Natural Key** | Key derived from real-world data (e.g. SSN, email) |
| **Unique Key** | Enforces uniqueness but allows NULLs (unlike PK) |

### Primary Key Architecture: Auto-Increment vs. UUIDv4 vs. UUIDv7

Choosing the data type of your table's **Primary Key** is one of the most consequential architectural decisions in database design. In relational engines (InnoDB in MySQL, B+Tree indexes in PostgreSQL), tables are physically ordered by their primary key (Clustered Index).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRIMARY KEY SCHEME SPECTRUM                        │
├───────────────────┬──────────────────────┬──────────────────────────────────┤
│ PRIMARY KEY TYPE  │ PHYSICAL STORAGE     │ B-TREE & DISTRIBUTED TRADE-OFFS  │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ Auto-Increment    │ 4 or 8 Bytes         │ • Optimal B-Tree right appends   │
│ (INT / BIGINT)    │ (Compact index)      │ • Central coordinator required   │
│                   │                      │ • Predictable (German tank IDOR) │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ UUIDv4            │ 16 Bytes (UUID)      │ • Zero coordination required     │
│ (Random 128-bit)  │ (or 36-char string)  │ • Constant B-Tree page splits    │
│                   │                      │ • Destroys buffer pool cache     │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ UUIDv7 (RFC 9562) │ 16 Bytes (UUID)      │ • Time-ordered (Right appends)   │
│ (Time-Ordered)    │ (Native 128-bit)     │ • Zero coordination (Client gen) │
│                   │                      │ • Unguessable & secure           │
└───────────────────┴──────────────────────┴──────────────────────────────────┘
```

#### 1. Why Auto-Increment Breaks in Distributed Systems
- **Central Sequence Lock:** A single database primary must coordinate sequence generation. In multi-master or sharded clusters, this creates severe write serialization bottlenecks.
- **Network Latency:** Application pods cannot generate primary keys offline; every insert requires a blocking round-trip to the database before the ID is known.
- **The German Tank Problem (Predictability):** Sequential IDs leak business velocity (`/orders/1000` $\rightarrow$ `/orders/1100` tells competitors you processed exactly 100 orders). Furthermore, it invites **Insecure Direct Object Reference (IDOR)** attacks via simple URL enumeration.

#### 2. The B-Tree Fragmentation Catastrophe of UUIDv4
Because `UUIDv4` generates purely random 128-bit keys:
1. **Constant Page Splits:** Leaf pages in a B+Tree must maintain sorted order. A random key lands unpredictably in the middle of a full 8KB/16KB page, forcing the database engine to split the page into two 50% empty pages.
2. **50% Fill Factor & Index Bloat:** Half of every page remains empty space, nearly doubling table disk footprint and memory consumption.
3. **Buffer Pool Eviction:** Random inserts constantly read cold pages from NVMe disk into RAM, evicting frequently queried hot cache lines and destroying p99 insert throughput.

#### 3. Why UUIDv7 is the Gold Standard for Primary Keys
Standardized in **RFC 9562** (May 2024), **UUIDv7** embeds a 48-bit Unix millisecond timestamp in the most significant bits:
- **Right-Append B-Tree Efficiency:** Because the leading bits represent chronological time, new rows append sequentially to the right-most leaf page, achieving ~95%–100% fill factor with zero random page splits.
- **Zero Coordination:** Any microservice or mobile client generates valid, collision-free UUIDv7 keys in parallel without contacting the database.
- **Unguessable:** 74 bits of entropy prevent ID enumeration.
- **Timestamp Extraction:** The record's creation time can be read directly from the ID without an extra `created_at` column.

```sql
-- PostgreSQL 18+ Native UUIDv7
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL,
    total DECIMAL(10, 2) NOT NULL
);
```

---

## SQL Fundamentals

### DDL — Data Definition Language
```sql
CREATE TABLE orders (
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT NOT NULL,
    total      DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
DROP TABLE orders;
TRUNCATE TABLE orders; -- removes all rows, keeps structure
```

### DML — Data Manipulation Language
```sql
INSERT INTO orders (user_id, total) VALUES (1, 99.90);

UPDATE orders SET status = 'shipped' WHERE id = 42;

DELETE FROM orders WHERE status = 'cancelled';
```

### DQL — Data Query Language
```sql
SELECT u.name, COUNT(o.id) AS order_count, SUM(o.total) AS revenue
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY revenue DESC
LIMIT 10;
```

---

## Joins

<DatabaseJoinAlgorithmsDiagram />

| Table A Key | Table B Key | Matched in Inner Join? |
|---|---|---|
| `1` | `1` | ✅ Match (Key 1) |
| `2` | — | ❌ No match in B |
| `3` | `3` | ✅ Match (Key 3) |
| — | `4` | ❌ No match in A |

| Join Type | Returns |
|-----------|---------|
| `INNER JOIN` | Rows matching in **both** tables |
| `LEFT JOIN` | All rows from left + matching from right (NULL if no match) |
| `RIGHT JOIN` | All rows from right + matching from left |
| `FULL OUTER JOIN` | All rows from both tables |
| `CROSS JOIN` | Cartesian product (every combination) |
| `SELF JOIN` | Table joined to itself (e.g. employee → manager) |

```sql
-- Self join: employee with their manager
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Finding orphaned records (rows in A with no match in B)
SELECT a.* FROM orders a
LEFT JOIN users b ON a.user_id = b.id
WHERE b.id IS NULL;
```

---

## NULL Handling

NULL is not a value — it represents **unknown**. Key rules:
- `NULL = NULL` → **false** (use `IS NULL` / `IS NOT NULL`)
- Any arithmetic with NULL → NULL
- `COALESCE(a, b, c)` → returns first non-null value
- `NULLIF(a, b)` → returns NULL if a = b, else a

```sql
SELECT COALESCE(phone, email, 'no contact') AS contact FROM users;
```

---

## Constraints

```sql
CREATE TABLE products (
    id          INT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    price       DECIMAL(10,2) CHECK (price > 0),
    category    VARCHAR(50) DEFAULT 'general',
    sku         VARCHAR(50) UNIQUE
);
```

| Constraint | Purpose |
|-----------|---------|
| `NOT NULL` | Column must have a value |
| `UNIQUE` | No duplicate values (NULLs may be allowed) |
| `CHECK` | Custom validation expression |
| `DEFAULT` | Fallback value when none provided |
| `FOREIGN KEY` | Referential integrity |

---

## Aggregate Functions

```sql
SELECT
    COUNT(*)            AS total_rows,
    COUNT(DISTINCT uid) AS unique_users,
    SUM(amount)         AS total,
    AVG(amount)         AS average,
    MIN(amount)         AS minimum,
    MAX(amount)         AS maximum
FROM payments;
```

---

## Spring Data JPA Notes

```java
// Entity definition
@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;
}

// Repository with custom query
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE o.user.id = :userId AND o.total > :minTotal")
    List<Order> findHighValueOrders(@Param("userId") Long userId,
                                    @Param("minTotal") BigDecimal minTotal);
}
```

:::caution[N+1 Problem]
Using `FetchType.LAZY` on collections can trigger N+1 queries. Use `JOIN FETCH` in JPQL or `@EntityGraph` to eagerly load in specific queries.
:::

---

## Interview Questions

**Q1. What is the difference between `DELETE`, `TRUNCATE`, and `DROP`?**
> - `DELETE`: DML, removes rows one by one, can be rolled back, fires triggers, can have WHERE clause.
> - `TRUNCATE`: DDL (in most DBs), removes all rows faster by deallocating pages, minimal logging, typically cannot be rolled back in MySQL, resets auto-increment.
> - `DROP`: Removes the entire table structure and data permanently.

**Q2. What is referential integrity and how is it enforced?**
> Referential integrity ensures that a FK value always refers to an existing PK. Enforced via `FOREIGN KEY` constraints with `ON DELETE`/`ON UPDATE` actions: `CASCADE`, `SET NULL`, `RESTRICT`, `NO ACTION`.

**Q3. What is the difference between `WHERE` and `HAVING`?**
> `WHERE` filters rows **before** grouping; `HAVING` filters **after** `GROUP BY` on aggregated results. You cannot use aggregate functions in `WHERE`.

**Q4. What are the different types of JOINs? When would you use a LEFT JOIN instead of INNER JOIN?**
> Use `INNER JOIN` when you only want matching rows. Use `LEFT JOIN` when you need all rows from the left table even if there's no match in the right (e.g. customers who haven't placed orders yet).

**Q5. What is a surrogate key vs a natural key? Which is preferred?**
> Surrogate keys (auto-increment IDs, UUIDs) are preferred because natural keys can change, may be long, and can expose business logic. Surrogate keys keep joins efficient and stable.

**Q6. How does `NULL` behave in SQL comparisons and aggregates?**
> NULL is not equal to anything, including itself. Aggregates like `COUNT`, `SUM`, `AVG` ignore NULLs. Use `IS NULL`/`IS NOT NULL`. `COALESCE` is the idiomatic way to provide defaults.

**Q7. What is the difference between `UNION` and `UNION ALL`?**
> `UNION` removes duplicate rows (adds a sort/dedup step); `UNION ALL` keeps all rows and is faster. Use `UNION ALL` when you know the datasets are distinct.

**Q8. Explain the concept of a composite key and when you would use one.**
> A composite key uses multiple columns together as a PK. Used in junction tables (e.g. `order_items(order_id, product_id)`) or when a single column can't uniquely identify a row.

---

## Advanced Editorial Pass: Relational Fundamentals for Long-Lived Systems

### Senior Engineering Focus
- Model keys and constraints as business integrity guarantees.
- Design joins around expected cardinality and query paths.
- Keep normalization and denormalization decisions measurable.

### Failure Modes to Anticipate
- Weak constraints allowing silent data corruption.
- Join patterns that degrade unpredictably with growth.
- Over-normalization that pushes complexity into application logic.

### Practical Heuristics
1. Enforce domain invariants in schema, not only service code.
2. Track row growth and join selectivity trends.
3. Review schema changes with query plan impact.

### Compare Next
- [Database Design & Normalization](./database-design.md)
- [Advanced SQL](./advanced-sql.md)
- [Transactions & Concurrency](./transactions-concurrency.md)
