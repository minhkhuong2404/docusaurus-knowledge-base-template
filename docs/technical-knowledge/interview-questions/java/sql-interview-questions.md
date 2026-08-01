---
id: sql-interview-questions
title: SQL Interview Questions
sidebar_label: SQL Q&A
description: Essential SQL interview questions covering window ranking functions, B-Tree vs Hash indexing, composite index left-prefix rules, and EXPLAIN execution plan analysis.
tags: [sql, interview, database, backend]
---

# Top SQL Interview Questions & Answers

---

## Core SQL & Database Mechanics

### Q1. How do you find the Nth Highest Salary while correctly handling ties?
> Use the `DENSE_RANK()` window function inside a Common Table Expression (CTE). Unlike `ROW_NUMBER()` (which assigns unique sequential integers regardless of duplicates) or `RANK()` (which assigns identical ranks to duplicates but skips subsequent rank numbers), `DENSE_RANK()` assigns identical ranks to tied values without introducing rank gaps ($1, 1, 2, 3$).

```sql
WITH SalaryRanking AS (
    SELECT salary,
           DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
)
SELECT DISTINCT salary 
FROM SalaryRanking 
WHERE rnk = 3;
```

### Q2. What is the structural difference between a B-Tree Index and a Hash Index?
> A **B-Tree Index** maintains a balanced multi-way search tree where leaf nodes store sorted key pointers. It supports point lookups ($O(\log N)$), range queries (`BETWEEN`, `>`, `<`), prefix matching (`LIKE 'John%'`), and sorting (`ORDER BY`). A **Hash Index** uses a hash table bucket structure providing $O(1)$ average point lookups, but does **not** support range queries, prefix matching, or sorting.

### Q3. How does a Composite Index operate and what is the Left-Prefix Rule?
> A Composite Index indexes multiple columns simultaneously (`CREATE INDEX idx_user ON users(status, age)`). Under the **Left-Prefix Rule**, the B-Tree index can only be used by queries that filter by the leftmost indexed column (`status`). Filtering on `status AND age` or `status` alone utilizes the index; filtering on `age` alone skips the index and performs a full table scan.

```sql
-- Creates composite index on (status, age)
CREATE INDEX idx_users_status_age ON users(status, age);

-- OPTIMIZED: Uses Left Prefix (status)
SELECT * FROM users WHERE status = 'ACTIVE' AND age > 25;

-- UNOPTIMIZED: Skips Left Prefix -> Triggers Full Table Scan!
SELECT * FROM users WHERE age > 25;
```

### Q4. How do you diagnose and optimize slow queries using `EXPLAIN ANALYZE` execution plans?
> Prepend `EXPLAIN ANALYZE` to the query. Check the access method:
> - **Seq Scan (Full Table Scan)**: Re-scans every disk page. Indicates a missing index.
> - **Index Scan**: Traverses the B-Tree index to locate row IDs, then fetches data pages from disk heap.
> - **Index Only Scan**: Fetches all required columns directly from the index leaf nodes without accessing disk table heap files ($O(1)$ disk I/O).

---

## See Also

- [Spring Boot Real-Time Interview Questions](./spring-boot-real-time-questions.md)
- [Java Locks & Synchronization Primitives](../../java/java-locks.md)
- [Kafka Architecture Overview](../../kafka/intro.md)
