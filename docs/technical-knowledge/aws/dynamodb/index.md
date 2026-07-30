---
id: index
title: Amazon DynamoDB
sidebar_label: "🗃️ DynamoDB"
description: >
  DynamoDB mastery for DVA-C02. Covers partition keys, sort keys, GSI vs LSI,
  read/write capacity modes, DynamoDB Streams, DAX, TTL, transactions, and
  the most common exam scenarios and anti-patterns.
tags:
  - dynamodb
  - database
  - nosql
  - partition-key
  - gsi
  - lsi
  - streams
  - dax
  - transactions
  - dva-c02
  - domain-1
---

# Amazon DynamoDB

> **Exam focus**: DynamoDB is one of the **top 3 most tested services** in DVA-C02. Know key design, capacity, and consistency options cold.

---

## 🔰 What Is DynamoDB?

DynamoDB is a **fully managed, serverless, key-value and document NoSQL database** designed for single-digit millisecond performance at any scale.

**Analogy**: Think of DynamoDB like a massive filing cabinet. Each drawer is a **partition** (identified by a partition key), and within each drawer, files are sorted by **sort key**. You can instantly find any file if you know which drawer (partition key) and which file label (sort key) to look for.

### DynamoDB vs Relational Databases

| Feature | DynamoDB (NoSQL) | RDS/Aurora (SQL) |
|---|---|---|
| **Schema** | Flexible (each item can have different attributes) | Fixed schema |
| **Scaling** | Horizontal (automatic partitioning) | Vertical (bigger instance) |
| **Joins** | ❌ Not supported | ✅ Native |
| **Transactions** | ✅ Limited (100 items, 4MB) | ✅ Full ACID |
| **Query flexibility** | By primary key + indexes only | Any SQL query |
| **Performance** | Consistent single-digit ms at any scale | Varies with load |
| **Cost model** | Pay per request or capacity | Pay per instance hour |

---

## Core Concepts

### Primary Key Types

| Type | Description | When to Use |
|---|---|---|
| **Partition Key** (Hash Key) | Single attribute, must be unique per item | Simple lookups by ID |
| **Partition Key + Sort Key** | Composite — PK groups items, SK orders them within group | Hierarchical data (userId + timestamp) |

### Partition Key Design (Critical!)

```
✅ Good partition keys (high cardinality, uniform distribution):
   userId, orderId, sessionId, deviceId

❌ Bad partition keys (low cardinality, hot partitions):
   status ("active"/"inactive"), country, date

Hot partition example:
   PK = "status" → 90% of items have status="active"
   → One partition handles 90% of all traffic → THROTTLING!
```

:::tip[Key Design Golden Rule]
Choose a partition key that has **many distinct values** and **uniform request distribution**. If you must use a low-cardinality key, add a **random suffix** (write sharding) to spread load.
:::

### Item Size Limit

- Max item size: **400 KB** (including attribute names)
- For larger objects, store data in S3 and keep a reference in DynamoDB

---

## Read/Write Capacity Modes

| Mode | Description | Best For | Switching |
|---|---|---|---|
| **Provisioned** | Set RCUs/WCUs manually (or auto-scale) | Predictable, steady workloads | Once per 24 hours |
| **On-Demand** | Auto-scales, pay per request | Unpredictable, spiky workloads | Once per 24 hours |

### Capacity Unit Calculations

```
READ CAPACITY UNITS (RCU):
  1 RCU = 1 strongly consistent read of item ≤ 4 KB/sec
        = 2 eventually consistent reads of items ≤ 4 KB/sec
        = ½ transactional read of item ≤ 4 KB/sec

WRITE CAPACITY UNITS (WCU):
  1 WCU = 1 write of item ≤ 1 KB/sec
        = ½ transactional write of item ≤ 1 KB/sec
```

### RCU Calculation Examples

**Example 1**: Read 10 items, 6 KB each, strongly consistent
```
Each item: ceil(6 KB / 4 KB) = 2 RCUs per item
Total: 10 × 2 = 20 RCUs
```

**Example 2**: Read 10 items, 6 KB each, eventually consistent
```
Each item: ceil(6 KB / 4 KB) = 2 RCUs strongly → 2/2 = 1 RCU eventually
Total: 10 × 1 = 10 RCUs
```

**Example 3**: Read 5 items, 17 KB each, transactional
```
Each item: ceil(17 KB / 4 KB) = 5 RCUs strongly → 5 × 2 = 10 RCUs transactional
Total: 5 × 10 = 50 RCUs
```

### WCU Calculation Examples

**Example 1**: Write 6 items, 2.5 KB each per second
```
Each item: ceil(2.5 KB / 1 KB) = 3 WCUs per item
Total: 6 × 3 = 18 WCUs
```

### Auto Scaling (Provisioned Mode)

```yaml
# CloudFormation auto scaling
TableWriteCapacityScaling:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    MinCapacity: 5
    MaxCapacity: 100
    ResourceId: !Sub "table/${MyTable}"
    ScalableDimension: dynamodb:table:WriteCapacityUnits
    ServiceNamespace: dynamodb
```

---

## Read Consistency

| Mode | Latency | Freshness | Cost |
|---|---|---|---|
| **Eventually Consistent** | Low | May return stale data (~1s replication) | 1× (default) |
| **Strongly Consistent** | Higher | Always latest data | 2× RCUs |
| **Transactional** | Highest | ACID across multiple items | 4× RCUs |

:::caution[Exam Trap]
`GetItem` and `Query` default to **eventually consistent**. You must explicitly set `ConsistentRead: true` for strong consistency. `Scan` also defaults to eventually consistent.
:::

---

## Secondary Indexes

### Local Secondary Index (LSI)

| Property | Value |
|---|---|
| **Key** | Same partition key, **different sort key** |
| **Creation** | At table creation time **only** |
| **Capacity** | Shares the table's RCU/WCU |
| **Consistency** | Supports **strong and eventual** consistency |
| **Max per table** | 5 |
| **Projections** | KEYS_ONLY, INCLUDE, ALL |

### Global Secondary Index (GSI)

| Property | Value |
|---|---|
| **Key** | **Different partition key** and/or sort key |
| **Creation** | Any time (add/delete) |
| **Capacity** | Has **its own** RCU/WCU (separate from table) |
| **Consistency** | **Eventually consistent only** |
| **Max per table** | 20 |
| **Projections** | KEYS_ONLY, INCLUDE, ALL |

```
Table:     PK = userId, SK = orderId
LSI:       PK = userId, SK = orderDate     (same PK, different SK)
GSI:       PK = status,  SK = orderDate    (completely different PK)
```

:::tip[Decision Tree]
- Need to query on a **non-key attribute**? → **GSI**
- Need a **different sort key** for the same partition? → **LSI**
- Need **strong consistency** on the index? → **LSI** (GSI is always eventually consistent)
- Table already exists and you need a new index? → **GSI** (LSI must be defined at creation)
:::

### GSI Throttling (Important!)

If a GSI's WCU is throttled, the **base table is also throttled** — even if the base table has enough capacity. Always provision GSI WCUs to match your write patterns.

---

## DynamoDB Streams

- Captures **item-level changes** (INSERT, MODIFY, REMOVE) in near real-time
- Records available for **24 hours**
- Can trigger Lambda (Event Source Mapping)
- Records are **ordered within a shard** (same partition key)

### Stream View Types

| View Type | Content | Use Case |
|---|---|---|
| `KEYS_ONLY` | Only key attributes | Lightweight trigger (lookup full item if needed) |
| `NEW_IMAGE` | Complete new item | Replicate to another table/service |
| `OLD_IMAGE` | Complete old item | Audit what was there before |
| `NEW_AND_OLD_IMAGES` | Both before and after | Diff changes, full audit trail |

### Stream Use Cases
- **Cross-region replication** → Global Tables (built on Streams)
- **Trigger Lambda** on data change → real-time processing
- **Audit trail** → record all changes
- **Materialized views** → aggregate data into summary tables
- **Search indexing** → sync to OpenSearch/Elasticsearch

---

## DAX (DynamoDB Accelerator)

| Property | Value |
|---|---|
| **Type** | In-memory write-through cache |
| **Latency** | Microseconds (vs milliseconds for DynamoDB) |
| **Deployment** | Cluster of nodes in your VPC |
| **API** | Drop-in replacement for DynamoDB client |
| **Consistency** | Eventually consistent only |

```java
// Switch from DynamoDB client to DAX client — no code change!
DynamoDbClient daxClient = DynamoDbClient.builder()
    .endpointOverride(URI.create("dax://my-cluster.abc123.dax-clusters.us-east-1.amazonaws.com:8111"))
    .build();
```

:::note[DAX vs ElastiCache — Exam Classic!]
| Feature | DAX | ElastiCache |
|---|---|---|
| **Use with** | DynamoDB only | Any database/application |
| **Integration** | Drop-in (API compatible) | Requires application code changes |
| **Caching** | Individual items + query results | Any data you store (key-value) |
| **Management** | AWS fully managed | You manage cluster/replication |
| **Use case** | DynamoDB read acceleration | Session store, leaderboards, general cache |
:::

---

## Transactions

```java
// All-or-nothing: debit one account, credit another
dynamoDbClient.transactWriteItems(TransactWriteItemsRequest.builder()
    .transactItems(
        TransactWriteItem.builder()
            .update(Update.builder()
                .tableName("Accounts")
                .key(Map.of("accountId", AttributeValue.fromS("ACC-001")))
                .updateExpression("SET balance = balance - :amount")
                .conditionExpression("balance >= :amount")
                .expressionAttributeValues(Map.of(":amount", AttributeValue.fromN("100")))
                .build())
            .build(),
        TransactWriteItem.builder()
            .update(Update.builder()
                .tableName("Accounts")
                .key(Map.of("accountId", AttributeValue.fromS("ACC-002")))
                .updateExpression("SET balance = balance + :amount")
                .expressionAttributeValues(Map.of(":amount", AttributeValue.fromN("100")))
                .build())
            .build()
    ).build());
```

- Up to **100 items** or **4 MB** per transaction
- Consumes **2× RCUs/WCUs** of non-transactional operations
- Cannot target items in **different AWS regions** (use Global Tables for multi-region)

---

## Key API Operations

| Operation | Description | RCU/WCU |
|---|---|---|
| `PutItem` | Create or replace entire item | WCU based on item size |
| `GetItem` | Read single item by primary key | RCU based on item size |
| `UpdateItem` | Update specific attributes (partial) | WCU based on item size |
| `DeleteItem` | Delete item by primary key | WCU based on item size |
| `Query` | Items with same PK, filter by SK | RCU based on **all items read** |
| `Scan` | Read **all** items in table | RCU for **entire table** |
| `BatchGetItem` | Up to 100 items, multiple tables | Sum of individual RCUs |
| `BatchWriteItem` | Up to 25 Put/Delete operations | Sum of individual WCUs |
| `TransactGetItems` | Atomic reads (up to 100 items) | 2× RCUs |
| `TransactWriteItems` | Atomic writes (up to 100 items) | 2× WCUs |

:::caution[Scan Is Expensive!]
`Scan` reads the **entire table** — filters are applied **after** reading, so they don't reduce RCU consumption. Always prefer `Query` or design GSIs to avoid scans. Use **parallel scan** with `Segment` and `TotalSegments` if scan is unavoidable.
:::

---

## TTL (Time to Live)

```json
{
  "userId": "user-123",
  "sessionData": "...",
  "expiresAt": 1734567890
}
```

| Property | Details |
|---|---|
| **Cost** | Free — no WCU consumed for TTL deletions |
| **Deletion timing** | Within **48 hours** of expiry (background process) |
| **Format** | Unix epoch in **seconds** (not milliseconds!) |
| **Expired items** | Still returned in queries until deleted — filter them! |
| **Streams** | TTL deletions appear in DynamoDB Streams (event type = REMOVE) |

---

## Conditional Writes & Expressions

```java
// Optimistic locking — only update if version matches
dynamoDbClient.updateItem(UpdateItemRequest.builder()
    .tableName("Products")
    .key(Map.of("productId", AttributeValue.fromS("P-001")))
    .updateExpression("SET price = :newPrice, #v = #v + :inc")
    .conditionExpression("#v = :expectedVersion")
    .expressionAttributeNames(Map.of("#v", "version"))
    .expressionAttributeValues(Map.of(
        ":newPrice", AttributeValue.fromN("99.99"),
        ":inc", AttributeValue.fromN("1"),
        ":expectedVersion", AttributeValue.fromN("5")))
    .build());
// Throws ConditionalCheckFailedException if version doesn't match
```

### Expression Types

| Expression | Purpose | Example |
|---|---|---|
| **ConditionExpression** | Conditional writes | `attribute_exists(email)` |
| **UpdateExpression** | Modify attributes | `SET #s = :val, ADD quantity :inc` |
| **ProjectionExpression** | Select attributes to return | `orderId, #s, createdAt` |
| **FilterExpression** | Filter Query/Scan results (post-read) | `status = :active` |
| **KeyConditionExpression** | Query key conditions | `userId = :uid AND orderDate > :date` |

---

## 🏆 Best Practices

### Key Design
1. **High-cardinality partition keys** — userId, orderId, not status or country
2. **Composite keys** for hierarchical data — `PK=USER#123, SK=ORDER#2024-01-15`
3. **Write sharding** for hot keys — append random suffix to spread load

### Performance
1. **Use DAX** for read-heavy workloads needing microsecond latency
2. **ProjectionExpression** — fetch only attributes you need
3. **Avoid Scans** — design GSIs for all access patterns
4. **BatchGetItem/BatchWriteItem** — reduce API calls (but handle `UnprocessedItems`!)

### Cost
1. **On-Demand mode** for unpredictable workloads — no over-provisioning
2. **Use TTL** for auto-expiring data — free deletions
3. **Choose GSI projections wisely** — `KEYS_ONLY` or `INCLUDE` saves storage costs

---

## 🎯 DVA-C02 Exam Tips

:::tip[DynamoDB Exam Cheat Sheet]
1. **RCU/WCU calculations** appear on almost every exam — practice these
2. **GSI throttling** affects base table — always provision GSI capacity adequately
3. **LSI = table creation only**; GSI = any time
4. **DAX = microsecond reads** for DynamoDB; ElastiCache = general purpose
5. **Transactions = 2× cost** (2× RCU for reads, 2× WCU for writes)
6. **TTL format**: Unix epoch in **seconds**. Deletions happen within 48 hours
7. **Scan** costs RCUs for entire table — FilterExpression doesn't reduce cost
8. **`Query` always requires partition key** in KeyConditionExpression
9. **Conditional writes** prevent race conditions — use `ConditionExpression`
10. **BatchWriteItem** max 25 items; **BatchGetItem** max 100 items
:::

---

## Practice Questions

**Q1.** Find all orders for customer "C-100" sorted by date. Table: PK=customerId, SK=orderId. Best approach?

A) Scan with filter  
B) Query on PK=C-100, sort by date  
C) **Create GSI: PK=customerId, SK=orderDate, then Query**  
D) GetItem for each orderId  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Current SK is orderId, not date. A GSI with SK=orderDate enables sorted date queries. Alternatively, an LSI could work if you define it at table creation.
</details>

---

**Q2.** Read 10 items of 10 KB each, eventually consistent. How many RCUs?

A) 10  
B) 15  
C) **15**  
D) 30  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Each 10KB item: ceil(10/4) = 3 RCU (strongly). Eventually consistent = 3/2 = 1.5 → **round up to 2**? No — for eventually consistent, you halve the strongly consistent result: 3 RCU ÷ 2 = 1.5 RCU per item. Total = 10 × 1.5 = **15 RCUs**.
</details>

---

**Q3.** Which Stream view captures both old and new item state?

A) `KEYS_ONLY`  
B) `NEW_IMAGE`  
C) `OLD_IMAGE`  
D) **`NEW_AND_OLD_IMAGES`**  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — `NEW_AND_OLD_IMAGES` captures both states, ideal for auditing changes and computing diffs.
</details>

---

**Q4.** Sub-millisecond read latency on DynamoDB. What to use?

A) ElastiCache Redis  
B) Read Replicas  
C) **DAX**  
D) Strongly Consistent Reads  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **DAX** provides microsecond latency for DynamoDB reads. ElastiCache works but requires code changes. DynamoDB doesn't have read replicas. Strong consistency is slower.
</details>

---

**Q5.** A GSI is throttled. What else is affected?

A) Only the GSI queries are throttled  
B) **Base table writes are also throttled**  
C) Other GSIs on the same table are throttled  
D) Nothing else is affected  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — When a GSI is throttled, DynamoDB **throttles writes to the base table** to prevent the GSI from falling behind. Always ensure GSI WCUs match your write patterns.
</details>

---

## 🔗 Resources

- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Enhanced Client for Java](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/dynamodb-enhanced-client.html)
- [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html)
- [The DynamoDB Book (Alex DeBrie)](https://www.dynamodbbook.com/)
