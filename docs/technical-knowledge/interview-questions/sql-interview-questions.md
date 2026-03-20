---
id: sql-interview-questions
title: SQL Interview Questions
sidebar_label: SQL Q&A
description: "Common SQL interview questions on ranking queries, indexing, and practical query optimization."
tags: [sql, interview, database, backend]
---

# Top SQL Interview Questions & Answers

These questions cover essential SQL techniques like finding the Nth highest salary and understanding database indexing as discussed in the Code Decode tutorial.

## 1. How to find the 3rd Highest Salary?
There are several ways to approach this. While nested subqueries work for small values, they are not scalable.

### Scalable Solution (using `LIMIT` and `OFFSET`)
The most efficient way is to sort the salaries in descending order and use the `LIMIT` clause:
```sql
SELECT salary 
FROM employee_test 
ORDER BY salary DESC 
LIMIT 2, 1;
```
* **Explanation:** `ORDER BY salary DESC` sorts the list from highest to lowest. `LIMIT 2, 1` tells the database to skip the first 2 rows and return only the next 1 row (the 3rd row).


## 2. What are Indexes and why are they used?
Indexes are special database objects created to help retrieve records more quickly and efficiently.
* **Purpose:** To reduce the time it takes to find a record (avoiding a **Full Table Scan**).
* **Internal Working:** SQL creates a data structure (typically a **B-Tree**) that stores a specific column (e.g., Name) in a sorted manner. Each entry in the index points to the actual row in the table memory.
* **Performance:** Looking up a record in a B-Tree takes **O(log n)** time, which is much faster than the **O(n)** time required to scan every row in a table.


### How to Create an Index:
```sql
CREATE INDEX name_index ON employee_test(name);
```

### How to Drop an Index:
```sql
DROP INDEX name_index ON employee_test;
```

## 3. What are the disadvantages of Indexing?
While indexes speed up retrieval, they have two main drawbacks:
1.  **Storage Space:** Indexes are separate objects and require additional disk space. The larger the table, the larger the index.
2.  **Slower Write Operations:** Every time you perform an `INSERT`, `UPDATE`, or `DELETE` on the table, the database must also update the corresponding index to keep it in sync.

## 4. Does dropping a table also drop related objects?
* **Yes:** Objects that exist *inside* the table scope are dropped, including **Constraints, Indexes, and Columns**.
* **No:** Objects that exist *outside* the table scope are not dropped, such as **Views and Stored Procedures**.

## 5. SQL Query Tuning Best Practices
To optimize performance, consider the following tips:
* **Avoid `SELECT *`**: Only fetch the columns you actually need.
* **Use Inner Joins**: Prefer explicit `JOIN` syntax over using `WHERE` for joins, as the latter can sometimes lead to unintentional cartesian products.
* **Avoid `SELECT DISTINCT`**: This is a costly operation; try to structure your data or query to avoid duplicates naturally.

---
