---
id: sql-interview-questions
title: SQL Interview Questions
sidebar_label: SQL Q&A
description: "Common SQL interview questions on ranking queries, indexing, and practical query optimization."
tags: [sql, interview, database, backend]
---

# Top SQL Interview Questions & Answers

These questions cover essential SQL techniques, database index architectures, execution plan analysis, and query optimization.

---

## 1. How to find the Nth Highest Salary? (With duplicate handling)

Using `LIMIT offset, limit` is simple but has a major flaw: **it does not handle duplicates (ties) correctly**. If two employees share the highest salary, the 2nd highest salary query would return the same value.

### Standard Solution: Using Window Functions (DENSE_RANK)
To find the 3rd highest salary handling duplicates correctly, use `DENSE_RANK()`. This function assigns ranks without gaps (e.g. 1, 2, 2, 3):

```sql
WITH SalaryRanking AS (
    SELECT salary,
           DENSE_RANK() OVER (ORDER BY salary DESC) as rnk
    FROM employee
)
SELECT salary 
FROM SalaryRanking 
WHERE rnk = 3;
```

### Rank vs. Dense Rank vs. Row Number

If salaries are: `[100, 100, 90, 80]`

| Function | Row 1 (100) | Row 2 (100) | Row 3 (90) | Row 4 (80) |
|:---------|:------------|:------------|:------------|:------------|
| `ROW_NUMBER()` | 1 | 2 | 3 | 4 |
| `RANK()` | 1 | 1 | 3 (skips 2) | 4 |
| `DENSE_RANK()`| 1 | 1 | **2** | **3** (no gaps) |

- **`ROW_NUMBER()`**: Assigns a unique sequential integer starting from 1 (does not care about duplicates).
- **`RANK()`**: Assigns identical ranks to duplicates but skips subsequent ranks.
- **`DENSE_RANK()`**: Assigns identical ranks to duplicates without skipping ranks. **Always use DENSE_RANK for Nth highest queries.**

---

## 2. Under the Hood: B-Tree vs. Hash Indexing

Databases use indices to speed up query execution. The two most common indexing structures are B-Trees and Hash Tables.

### B-Tree Index (Default in most RDBMS)
A B-Tree (Balanced Tree) stores index data in a sorted, self-balancing tree structure.

- **Time Complexity:** O(log n) for lookups, insertions, and deletions.
- **Why preferred:** B-Trees store data sequentially. This allows them to support **Range Queries** (`WHERE age BETWEEN 20 AND 30` or `WHERE age > 25`) and sorting (`ORDER BY`).
- **Equality search:** Yes (`=`).

### Hash Index
A Hash Index uses a hash table structure where columns are hashed into bucket pointers.

- **Time Complexity:** O(1) average lookup time (extremely fast).
- **Limitations:** Does NOT support range queries, sorting, or partial key lookups (e.g., prefix match like `LIKE 'John%'`). It only supports **Exact Match** equality lookups (`=`).

---

## 3. What is a Composite Index and the Left-Prefix Rule?

A Composite Index is an index created on multiple columns:
```sql
CREATE INDEX idx_user_status_age ON users(status, age);
```

### The Left-Prefix Rule
For a composite index to be utilized, queries must filter by columns starting from the **leftmost** index column.

Using the index `(status, age)`:
- `WHERE status = 'ACTIVE' AND age = 25` -> **Uses index** (both columns).
- `WHERE status = 'ACTIVE'` -> **Uses index** (left prefix).
- `WHERE age = 25` -> **Does NOT use index** (leftmost column `status` is missing. Performs full table scan).

### Index Selectivity
When creating composite indexes, place the column with the **highest selectivity** (highest number of unique values, e.g. `user_id` or `email` vs `gender`) as the leftmost column to filter out the maximum number of rows early.

---

## 4. How to analyze and optimize a query? (Execution Plans)

To optimize a slow query, do not guess. Generate and read the **Execution Plan** using the `EXPLAIN` keyword:

```sql
EXPLAIN ANALYZE 
SELECT * FROM users WHERE email = 'test@example.com';
```

### Key Execution Plan Indicators to Check

| Scan Type | Cost / Quality | Meaning |
|:----------|:---------------|:--------|
| **Seq Scan** (Full Table Scan) | ❌ Poor | The database scans every row in the table. Sign of a missing index. |
| **Index Scan** | limit_icon | The database traverses the index B-Tree to find the row. Fast. |
| **Index Only Scan** | limit_icon Excellent | The database reads the index only (the requested columns exist entirely within the index, avoiding reading the table heap). |

### Query Tuning Best Practices
- **Avoid `SELECT *`**: Fetching unnecessary columns increases network overhead and prevents the optimizer from choosing an **Index Only Scan**.
- **Avoid wildcard prefixes:** `LIKE '%term'` prevents index utilization. `LIKE 'term%'` can use indexes.
- **Use Union All instead of Union:** `UNION` removes duplicates using an expensive sort operation. If duplicates aren't possible or don't matter, use `UNION ALL` (no sorting).
