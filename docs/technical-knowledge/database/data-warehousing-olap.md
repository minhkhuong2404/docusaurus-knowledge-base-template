---
id: data-warehousing-olap
title: Data Warehousing & OLAP
description: OLTP vs OLAP, dimensional modeling, star and snowflake schemas, ETL/ELT, materialized views, and modern data warehouse tools.
tags: [database, data-warehouse, olap, oltp, star-schema, dimensional-modeling, etl, elt, analytics]
sidebar_position: 17
---

# Data Warehousing & OLAP

## OLTP vs OLAP

| | OLTP (Transactional) | OLAP (Analytical) |
|--|---------------------|------------------|
| **Purpose** | Day-to-day operations | Business intelligence, reporting |
| **Query pattern** | Short, targeted reads/writes | Complex scans over large datasets |
| **Row count per query** | 1–100 rows | Millions–billions of rows |
| **Concurrency** | Thousands of concurrent users | Tens of concurrent analysts |
| **Schema** | Highly normalized (3NF) | Denormalized (star/snowflake) |
| **Data freshness** | Real-time | Hours / daily / near-real-time |
| **Storage** | Row-oriented | Column-oriented |
| **Examples** | MySQL, PostgreSQL | Redshift, BigQuery, Snowflake |

---

## Dimensional Modeling

Proposed by Ralph Kimball. Data is organized into:

- **Fact table**: central table containing measurable events (sales, clicks, orders). Contains foreign keys to dimensions + numeric measures.
- **Dimension tables**: describe the context of facts (who, what, where, when, how).

---

## Star Schema

The simplest and most widely used DW schema.

```
                ┌─────────────┐
                │ dim_date    │
                │ date_key PK │
                │ year        │
                │ quarter     │
                │ month       │
                └──────┬──────┘
                       │
┌──────────────┐        │        ┌───────────────┐
│ dim_customer │        │        │ dim_product   │
│ customer_key │──────┐ │ ┌──────│ product_key   │
│ name         │      │ │ │      │ name          │
│ region       │      ▼ ▼ ▼      │ category      │
└──────────────┘  ┌─────────────┐│ price         │
                  │ fact_sales  │└───────────────┘
                  │ sale_id PK  │
                  │ date_key FK │ ┌───────────────┐
                  │ customer_key│ │ dim_store     │
                  │ product_key │─│ store_key     │
                  │ store_key FK│ │ city          │
                  │ quantity    │ │ country       │
                  │ revenue     │ └───────────────┘
                  │ discount    │
                  └─────────────┘
```

**Characteristics:**
- One central fact table
- Dimension tables join directly to fact table (one hop)
- Denormalized dimensions (redundancy OK for query performance)
- Fast queries — fewer JOINs

---

## Snowflake Schema

Extension of star: dimension tables are further normalized.

```
dim_customer → dim_region → dim_country
dim_product  → dim_category → dim_department
```

**Trade-offs vs Star:**
- ✅ Less redundancy, smaller storage
- ❌ More JOINs per query (slower)
- ❌ More complex queries
- Generally: **prefer star schema** for DW (storage is cheap; query speed matters)

---

## Slowly Changing Dimensions (SCD)

How to handle changes to dimension values over time?

### Type 1 — Overwrite

```sql
UPDATE dim_customer SET region = 'West' WHERE customer_key = 42;
-- No history preserved
```
Use: when history doesn't matter (typo fix, non-analytical attribute).

### Type 2 — Add New Row (Most Common)

```sql
-- Original row
(42, 'Alice', 'East', '2020-01-01', '9999-12-31', TRUE)

-- After move to West
(42, 'Alice', 'East', '2020-01-01', '2024-06-30', FALSE)   -- expired
(99, 'Alice', 'West', '2024-07-01', '9999-12-31', TRUE)    -- current

-- Fact table joins via surrogate key (not natural customer ID)
-- Historical facts keep their original dimension row → accurate history
```

Add columns: `effective_date`, `expiry_date`, `is_current`.

### Type 3 — Add Column

```sql
ALTER TABLE dim_customer ADD COLUMN previous_region VARCHAR(50);
-- current_region = 'West', previous_region = 'East'
-- Only tracks ONE previous value — limited history
```

---

## Fact Table Types

| Type | Description | Example |
|------|-------------|---------|
| **Transaction** | One row per event | Each individual sale |
| **Periodic Snapshot** | One row per period | Daily account balance |
| **Accumulating Snapshot** | One row per process, updated as it progresses | Order lifecycle (created → paid → shipped → delivered) |

---

## ETL vs ELT

### ETL (Extract → Transform → Load)

Traditional approach:

```
Source DB → [Extract] → Staging → [Transform] → [Load] → Data Warehouse
```

Transform happens outside the warehouse — requires a dedicated ETL engine (Apache Spark, Talend, Informatica).

### ELT (Extract → Load → Transform)

Modern approach for cloud DW:

```
Source DB → [Extract & Load] → Data Warehouse → [Transform inside DW]
```

Load raw data first, then use SQL in the warehouse to transform. Leverages the warehouse's own compute power (BigQuery, Snowflake, Redshift are extremely powerful SQL engines).

**Tools:** dbt (data build tool) — SQL-based transformations with version control.

```sql
-- dbt model: models/marts/fct_orders.sql
WITH orders AS (
    SELECT * FROM {{ ref('stg_orders') }}    -- staging model reference
),
customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
)
SELECT
    o.order_id,
    c.customer_id,
    c.region,
    o.total_amount,
    o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
```

---

## Materialized Views

Pre-computed views stored on disk — query the result, not the underlying data.

```sql
-- PostgreSQL materialized view
CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT
    DATE_TRUNC('month', created_at) AS month,
    product_category,
    SUM(revenue)   AS total_revenue,
    COUNT(*)       AS order_count,
    AVG(revenue)   AS avg_order_value
FROM fact_orders
JOIN dim_product USING (product_key)
GROUP BY 1, 2;

CREATE UNIQUE INDEX ON monthly_revenue (month, product_category);

-- Refresh (manual or scheduled)
REFRESH MATERIALIZED VIEW monthly_revenue;             -- locks during refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue; -- no lock (requires unique index)

-- Query the view (fast!)
SELECT * FROM monthly_revenue WHERE month = '2024-01-01';
```

```sql
-- MySQL doesn't have native materialized views
-- Use summary tables + events/triggers instead
CREATE TABLE monthly_revenue_cache (
    month DATE, category VARCHAR(50), total DECIMAL(15,2),
    PRIMARY KEY (month, category)
);

-- Refresh via event
CREATE EVENT refresh_monthly_revenue
ON SCHEDULE EVERY 1 HOUR DO
REPLACE INTO monthly_revenue_cache
SELECT DATE_FORMAT(created_at, '%Y-%m-01'), category, SUM(revenue)
FROM orders GROUP BY 1, 2;
```

---

## Modern Cloud Data Warehouses

### BigQuery (Google)

```sql
-- Serverless; pay per TB scanned
-- Partitioned tables for cost control
CREATE TABLE `project.dataset.orders`
PARTITION BY DATE(created_at)
CLUSTER BY user_id, status
AS SELECT * FROM source_table;

-- Query (only scans matching partitions)
SELECT COUNT(*), SUM(total)
FROM `project.dataset.orders`
WHERE DATE(created_at) = '2024-01-15'
  AND status = 'completed';
```

### Snowflake

```sql
-- Virtual warehouses (compute) scale independently from storage
-- Time Travel: query historical data
SELECT * FROM orders AT (TIMESTAMP => '2024-01-15 12:00:00'::TIMESTAMP);

-- Zero-copy clones for dev/test
CREATE DATABASE dev_clone CLONE production_db;
```

### Amazon Redshift

```sql
-- Columnar storage, MPP (massively parallel processing)
-- Distribution styles affect performance
CREATE TABLE orders (...)
DISTSTYLE KEY DISTKEY (user_id)  -- rows with same user_id on same node
SORTKEY (created_at);            -- rows physically sorted by date
```

---

## OLAP Operations

| Operation | Description | SQL Example |
|-----------|-------------|-------------|
| **Roll-up** | Aggregate to higher level (day → month → year) | GROUP BY ROLLUP |
| **Drill-down** | Go to lower granularity | finer GROUP BY |
| **Slice** | Filter one dimension | WHERE country = 'US' |
| **Dice** | Filter multiple dimensions | WHERE country = 'US' AND year = 2024 |
| **Pivot** | Rotate dimensions | PIVOT / conditional aggregation |

```sql
-- ROLLUP: sub-totals at each level + grand total
SELECT region, product_category, SUM(revenue)
FROM fact_sales
GROUP BY ROLLUP (region, product_category);

-- CUBE: all possible combinations
SELECT region, product_category, EXTRACT(year FROM sale_date), SUM(revenue)
FROM fact_sales
GROUP BY CUBE (region, product_category, EXTRACT(year FROM sale_date));

-- GROUPING SETS: specific combinations
GROUP BY GROUPING SETS (
    (region, product_category),
    (region),
    ()  -- grand total
);
```

---

## 🎯 Interview Questions

**Q1. What is the difference between OLTP and OLAP?**
> OLTP (Online Transaction Processing) handles day-to-day operations with short, targeted queries updating few rows — optimized for concurrency and write performance. OLAP (Online Analytical Processing) handles complex analytical queries scanning millions of rows across many dimensions — optimized for read throughput. They have fundamentally different access patterns and are served by different database designs.

**Q2. What is a star schema and why is it preferred for data warehouses?**
> A star schema has one central fact table surrounded by denormalized dimension tables joined directly to it. Queries require only 1-2 JOINs to get all context, making them fast. Denormalization (redundancy) is acceptable in DW because storage is cheap and query speed is the priority. The snowflake schema normalizes dimensions further but requires more JOINs.

**Q3. What is a Slowly Changing Dimension (SCD) and what are the types?**
> SCDs handle changes to dimension attributes over time. Type 1: overwrite old value (no history). Type 2: add a new row with effective/expiry dates — preserves full history; most common in DW. Type 3: add a "previous value" column — tracks only one prior state. Type 2 is preferred when historical accuracy of reports matters.

**Q4. What is the difference between ETL and ELT?**
> ETL transforms data before loading into the warehouse — transformations happen in an external engine. ELT loads raw data first, then transforms within the warehouse using SQL — leverages the warehouse's powerful compute. ELT is preferred in modern cloud DW (BigQuery, Snowflake) because these systems are so fast at SQL that in-warehouse transformation is efficient and simpler to manage.

**Q5. What is a materialized view and when would you use one?**
> A materialized view is a pre-computed, cached query result stored on disk. Unlike a regular view (which re-runs the query), a materialized view stores the result and must be explicitly refreshed. Use when: queries are too slow for real-time computation; the underlying data changes infrequently; multiple users run the same expensive aggregation repeatedly.

**Q6. What is a fact table vs a dimension table?**
> Fact tables store measurable events (sales, clicks, page views) with numeric measures (revenue, quantity) and foreign keys to dimensions. They're typically wide and very tall (billions of rows). Dimension tables provide context (customer, product, date, geography) and are relatively small. Facts answer "how much/many"; dimensions answer "who, what, where, when."

**Q7. How does column-oriented storage benefit analytical queries?**
> Analytical queries typically aggregate a few columns across many rows. Column stores keep all values of a column together on disk — only the queried columns are read (less I/O). Homogeneous data in each column compresses extremely well (run-length encoding, dictionary encoding). Vectorized execution processes column values in CPU cache-friendly batches. Together, this can be 10-100x faster than row stores for analytics.

**Q8. What is dbt and how does it fit into a modern data stack?**
> dbt (data build tool) is a SQL-based transformation framework for ELT workflows. You write SELECT statements (models), and dbt materializes them as tables or views in the warehouse. It handles: dependency ordering, incremental updates, tests (not null, unique, ref integrity), documentation, and version control for transformations. It sits between the raw data layer and the reporting layer in the modern data stack.

---

## Advanced Editorial Pass: Analytical Systems and Data Freshness Economics

### Senior Engineering Focus
- Model dimensional schemas to match decision workflows and query grain.
- Balance freshness, cost, and complexity in ETL/ELT strategy.
- Govern semantic consistency across marts and reporting layers.

### Failure Modes to Anticipate
- Metric inconsistency from duplicated business logic.
- Pipeline delays unnoticed until business impact surfaces.
- Warehouse cost explosions from uncontrolled query patterns.

### Practical Heuristics
1. Define metric contracts and ownership in shared catalogs.
2. Track freshness SLA and data quality failures explicitly.
3. Use workload management to enforce query cost controls.

### Compare Next
- [Advanced SQL](./advanced-sql.md)
- [Performance & Monitoring](./performance-monitoring.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
