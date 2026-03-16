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

> **Exam focus**: DynamoDB is one of the **top 3 most tested services** in DVA-C02. Know the key design, capacity, and consistency options cold.

---

## Core Concepts

### Primary Key Types

| Type | Description | When to use |
|---|---|---|
| **Partition Key** (Hash Key) | Single attribute, must be unique | Simple lookups by ID |
| **Partition Key + Sort Key** | Composite key — partition must be unique per sort key combo | Hierarchical data (userId + timestamp) |

:::tip Key Design Rule
Design your partition key for **even distribution**. Bad partition keys (like `status = "active"`) create hot partitions and throttling.

✅ Good: `userId`, `orderId` (unique, uniform)  
❌ Bad: `country`, `status` (low cardinality, hot partitions)
:::

---

## Read/Write Capacity Modes

| Mode | Description | Best For |
|---|---|---|
| **Provisioned** | Set RCUs and WCUs manually | Predictable, steady workloads |
| **On-Demand** | Auto-scales, pay per request | Unpredictable, spiky workloads |

### Capacity Units

```
1 RCU = 1 strongly consistent read of ≤4KB/s
      = 2 eventually consistent reads of ≤4KB/s
      = ½ transactional read of ≤4KB/s

1 WCU = 1 write of ≤1KB/s
      = ½ transactional write of ≤1KB/s
```

**Example**: Read 10 items of 6KB each per second, strongly consistent  
→ Each item needs: ceil(6/4) = 2 RCUs  
→ Total: 10 × 2 = **20 RCUs**

---

## Read Consistency

| Mode | Latency | Freshness |
|---|---|---|
| **Eventually Consistent** | Low | May return stale data (replicated within ~1s) |
| **Strongly Consistent** | Higher | Always returns the latest data — costs 2× RCUs |
| **Transactional** | Highest | ACID guarantee across multiple items |

---

## Secondary Indexes

### Local Secondary Index (LSI)

- Same partition key, **different sort key**
- Must be created at **table creation time**
- Shares the table's RCU/WCU
- Max **5 LSIs** per table

### Global Secondary Index (GSI)

- **Different partition key and/or sort key**
- Can be created or deleted **any time**
- Has **its own** RCU/WCU provisioning
- Supports **eventual consistency only**
- Max **20 GSIs** per table

:::tip Exam Rule
Need to query on a non-key attribute? → **GSI**  
Need a different sort key for the same partition? → **LSI**  
:::

---

## DynamoDB Streams

- Captures **item-level changes** (INSERT, MODIFY, REMOVE)
- Records available for **24 hours**
- Can trigger Lambda (Event Source Mapping)

### Stream View Types

| View Type | Content |
|---|---|
| `KEYS_ONLY` | Only the key attributes |
| `NEW_IMAGE` | The entire new item after change |
| `OLD_IMAGE` | The entire old item before change |
| `NEW_AND_OLD_IMAGES` | Both before and after (most expensive) |

### Use Cases
- Replicate table to another region
- Trigger Lambda on data change
- Audit trail
- Build materialized views / aggregations

---

## DAX (DynamoDB Accelerator)

- **In-memory cache** — microsecond latency (vs milliseconds for DynamoDB)
- **Write-through**: writes go to both DAX and DynamoDB
- **Cluster** sits in front of DynamoDB — app uses DAX client
- Best for **read-heavy** workloads
- Does **not** support strongly consistent reads or transactions

:::note DAX vs ElastiCache
- **DAX** — DynamoDB-specific, transparent drop-in cache, AWS-managed
- **ElastiCache** — General-purpose cache (Redis/Memcached), used for any DB
:::

---

## Transactions

```java
// All-or-nothing: debit one account, credit another
var result = dynamoDbClient.transactWriteItems(TransactWriteItemsRequest.builder()
    .transactItems(
        TransactWriteItem.builder()
            .update(Update.builder()
                .tableName("Accounts")
                .key(Map.of("accountId", AttributeValue.fromS("ACC-001")))
                .updateExpression("SET balance = balance - :amount")
                .expressionAttributeValues(Map.of(":amount", AttributeValue.fromN("100")))
                .conditionExpression("balance >= :amount")
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
    )
    .build());
```

- Up to **100 items** or **4MB** per transaction
- Consumes **2× the RCUs/WCUs** of non-transactional operations

---

## Key API Operations

| Operation | Description |
|---|---|
| `PutItem` | Create or replace item |
| `GetItem` | Read single item by key |
| `UpdateItem` | Update specific attributes |
| `DeleteItem` | Delete item by key |
| `Query` | Read items with same partition key (and optional sort key filter) |
| `Scan` | Read **all** items in table (expensive, avoid in production) |
| `BatchGetItem` | Up to 100 items from multiple tables |
| `BatchWriteItem` | Up to 25 PutItem/DeleteItem operations |
| `TransactGetItems` | Atomic reads from multiple items |
| `TransactWriteItems` | Atomic writes to multiple items |

:::caution Scan is expensive
`Scan` reads the **entire table** — use filters but they don't reduce RCU cost (filtering happens after read). Always prefer `Query` or design GSIs to avoid scans.
:::

---

## TTL (Time to Live)

```json
{
  "userId": "user-123",
  "sessionData": "...",
  "expiresAt": 1734567890  // Unix epoch — DynamoDB deletes when this timestamp passes
}
```

- Free, no RCU/WCU consumed for deletions
- Deletions happen within **48 hours** of expiry (eventually consistent)
- **Expired items are not immediately deleted** — filter `expiresAt > now()` in your queries

---

## Conditional Writes

```java
// Only update if version matches (Optimistic Locking)
dynamoDbClient.updateItem(UpdateItemRequest.builder()
    .tableName("Products")
    .key(Map.of("productId", AttributeValue.fromS("P-001")))
    .updateExpression("SET price = :newPrice, version = version + :inc")
    .conditionExpression("version = :expectedVersion")
    .expressionAttributeValues(Map.of(
        ":newPrice", AttributeValue.fromN("99.99"),
        ":inc", AttributeValue.fromN("1"),
        ":expectedVersion", AttributeValue.fromN("5")
    ))
    .build());
```

---

## 🧪 Practice Questions

**Q1.** A developer needs to find all orders for a specific customer sorted by date. The table has `customerId` as partition key and `orderId` as sort key. What is the MOST efficient approach?

A) Scan with filter expression  
B) Query on partition key = customerId, sort by date  
C) Create a GSI with partition key = customerId, sort key = orderDate, then Query  
D) GetItem for each orderId  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — The current sort key is `orderId`, so you can't sort by date with just a Query. A **GSI** with partition key = `customerId` and sort key = `orderDate` allows efficient queries sorted by date. (B is almost right, but the sort key is `orderId` not date.)
</details>

---

**Q2.** A table has 10 items of 10KB each. A developer runs a Scan operation. How many RCUs are consumed with eventually consistent reads?

A) 5  
B) 10  
C) 20  
D) 25  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — Each 10KB item needs ceil(10/4) = 3 RCUs for strongly consistent, 1.5 (round up to 2?) wait — let me recalculate:  
- 10KB per item / 4KB per RCU = 2.5 → ceil = **3 RCUs** per item (strongly consistent)  
- Eventually consistent = 3/2 = 1.5 → ceil = **2 RCUs** per item  
- 10 items × 2 = **20 RCUs**  
Answer: **C — 20 RCUs**
</details>

---

**Q3.** Which DynamoDB Stream view type captures both the old and new item state for every change?

A) `KEYS_ONLY`  
B) `NEW_IMAGE`  
C) `OLD_IMAGE`  
D) `NEW_AND_OLD_IMAGES`  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — `NEW_AND_OLD_IMAGES` captures both states, useful for auditing what changed.
</details>

---

**Q4.** A team needs sub-millisecond read latency on DynamoDB. What should they use?

A) ElastiCache Redis  
B) Read Replicas  
C) DAX  
D) Strongly Consistent Reads  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **DAX** provides **microsecond latency** for DynamoDB reads (it's an in-memory write-through cache). Strongly consistent reads are slower, not faster.
</details>

---

## 🔗 Resources

- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Enhanced Client for Java](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/dynamodb-enhanced-client.html)
- [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html)
- [The DynamoDB Book (Alex DeBrie)](https://www.dynamodbbook.com/)
