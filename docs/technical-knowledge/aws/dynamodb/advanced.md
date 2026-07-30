---
id: advanced
title: DynamoDB Advanced — Streams, PartiQL & Enhanced Client
sidebar_label: "🗃️ DynamoDB Advanced"
description: >
  Advanced DynamoDB topics for DVA-C02. DynamoDB Streams with Lambda,
  PartiQL, Enhanced Client for Java, optimistic locking, single-table
  design patterns, and Write Sharding.
tags:
  - dynamodb
  - streams
  - partiql
  - java-sdk
  - enhanced-client
  - optimistic-locking
  - single-table-design
  - dva-c02
  - domain-1
---

# DynamoDB Advanced

> **Senior-level topics**: Single-table design, Enhanced Client patterns, Global Tables architecture, and production-grade stream processing.

---

## DynamoDB Enhanced Client (Java)

The Enhanced Client provides a **type-safe, annotation-driven** way to interact with DynamoDB — mapping POJOs directly to items.

### Entity Definition

```java
@DynamoDbBean
public class Order {
    private String orderId;
    private String customerId;
    private String status;
    private Instant createdAt;
    private BigDecimal totalAmount;
    private Long version;  // For optimistic locking

    @DynamoDbPartitionKey
    public String getOrderId() { return orderId; }

    @DynamoDbSortKey
    public String getCustomerId() { return customerId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "status-index")
    public String getStatus() { return status; }

    @DynamoDbSecondarySortKey(indexNames = "status-index")
    public Instant getCreatedAt() { return createdAt; }

    @DynamoDbVersionAttribute  // Auto-managed optimistic locking
    public Long getVersion() { return version; }

    // All getters and setters...
}
```

### Client Setup & CRUD Operations

```java
// Create Enhanced Client (reuse as static singleton!)
private static final DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
    .dynamoDbClient(DynamoDbClient.create())
    .build();

private static final DynamoDbTable<Order> orderTable = enhancedClient.table(
    "Orders", TableSchema.fromBean(Order.class));

// CREATE
Order newOrder = new Order();
newOrder.setOrderId("ORD-001");
newOrder.setCustomerId("CUST-123");
newOrder.setStatus("PENDING");
newOrder.setCreatedAt(Instant.now());
newOrder.setTotalAmount(new BigDecimal("149.99"));
orderTable.putItem(newOrder);

// READ
Order fetched = orderTable.getItem(r -> r.key(k -> k
    .partitionValue("ORD-001")
    .sortValue("CUST-123")));

// UPDATE (conditional with version)
fetched.setStatus("SHIPPED");
orderTable.updateItem(fetched);
// Enhanced client auto-adds: ConditionExpression: version = :oldVersion

// DELETE
orderTable.deleteItem(r -> r.key(k -> k
    .partitionValue("ORD-001")
    .sortValue("CUST-123")));
```

### Querying with Enhanced Client

```java
// Query by partition key with sort key condition
QueryConditional queryConditional = QueryConditional.sortBeginsWith(k -> k
    .partitionValue("CUST-123")
    .sortValue("2024-"));

PageIterable<Order> results = orderTable.query(r -> r
    .queryConditional(queryConditional)
    .scanIndexForward(false)  // Descending order
    .limit(10));

results.items().forEach(order -> System.out.println(order.getOrderId()));

// Query a GSI
DynamoDbIndex<Order> statusIndex = orderTable.index("status-index");
SdkIterable<Page<Order>> indexResults = statusIndex.query(r -> r
    .queryConditional(QueryConditional.keyEqualTo(k -> k.partitionValue("SHIPPED")))
    .limit(25));
```

### Batch Operations

```java
// Batch write across multiple tables
WriteBatch orderBatch = WriteBatch.builder(Order.class)
    .mappedTableResource(orderTable)
    .addPutItem(order1)
    .addPutItem(order2)
    .addDeleteItem(r -> r.key(k -> k.partitionValue("ORD-OLD").sortValue("CUST-1")))
    .build();

BatchWriteResult result = enhancedClient.batchWriteItem(r -> r.writeBatches(orderBatch));

// Handle unprocessed items (IMPORTANT — exam topic!)
if (!result.unprocessedPutItemsForTable(orderTable).isEmpty()) {
    // Retry with exponential backoff
    List<Order> unprocessed = result.unprocessedPutItemsForTable(orderTable);
    retryWithBackoff(unprocessed);
}
```

:::tip[Senior Best Practice]
Always handle `UnprocessedItems` in batch operations. DynamoDB may not process all items if capacity is insufficient. Implement **exponential backoff** for retries.
:::

---

## Optimistic Locking Deep Dive

### How @DynamoDbVersionAttribute Works

```
Thread A reads: { orderId: "ORD-1", status: "PENDING", version: 1 }
Thread B reads: { orderId: "ORD-1", status: "PENDING", version: 1 }

Thread A updates: SET status = "PROCESSING", version = 2
                  WHERE version = 1  ✅ Success

Thread B updates: SET status = "CANCELLED", version = 2
                  WHERE version = 1  ❌ ConditionalCheckFailedException!
                  (version is now 2, not 1)
```

### Manual Optimistic Locking (Low-Level Client)

```java
// Without Enhanced Client — manual condition expression
dynamoDbClient.updateItem(UpdateItemRequest.builder()
    .tableName("Orders")
    .key(Map.of("orderId", AttributeValue.fromS("ORD-001")))
    .updateExpression("SET #s = :newStatus, #v = #v + :inc")
    .conditionExpression("#v = :expectedVersion")
    .expressionAttributeNames(Map.of("#s", "status", "#v", "version"))
    .expressionAttributeValues(Map.of(
        ":newStatus", AttributeValue.fromS("SHIPPED"),
        ":inc", AttributeValue.fromN("1"),
        ":expectedVersion", AttributeValue.fromN("3")))
    .build());
```

---

## DynamoDB Streams + Lambda Pipeline

### Architecture

```
DynamoDB Table (source of truth)
    ↓ item-level changes (INSERT, MODIFY, REMOVE)
DynamoDB Stream (ordered log, 24h retention)
    ↓ Event Source Mapping
Lambda Function (consumer)
    ↓ processes changes
OpenSearch / S3 / SNS / Another DynamoDB Table
```

### Stream Processing with Error Handling

```java
public class OrderStreamHandler implements RequestHandler<DynamodbEvent, StreamsEventResponse> {

    private static final OpenSearchClient searchClient = createOpenSearchClient();

    public StreamsEventResponse handleRequest(DynamodbEvent event, Context context) {
        List<StreamsEventResponse.BatchItemFailure> failures = new ArrayList<>();

        for (DynamodbEvent.DynamodbStreamRecord record : event.getRecords()) {
            try {
                String eventName = record.getEventName(); // INSERT, MODIFY, REMOVE
                Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
                Map<String, AttributeValue> oldImage = record.getDynamodb().getOldImage();

                switch (eventName) {
                    case "INSERT":
                        indexToOpenSearch(newImage);
                        break;
                    case "MODIFY":
                        if (statusChanged(oldImage, newImage)) {
                            sendNotification(oldImage, newImage);
                        }
                        updateSearchIndex(newImage);
                        break;
                    case "REMOVE":
                        removeFromSearchIndex(oldImage);
                        break;
                }
            } catch (Exception e) {
                // Report only this record as failed
                failures.add(StreamsEventResponse.BatchItemFailure.builder()
                    .itemIdentifier(record.getDynamodb().getSequenceNumber())
                    .build());
            }
        }

        return StreamsEventResponse.builder()
            .batchItemFailures(failures)
            .build();
    }
}
```

### DynamoDB Streams vs Kinesis Data Streams for DynamoDB

| Feature | DynamoDB Streams | Kinesis Data Streams |
|---|---|---|
| **Retention** | 24 hours | Up to 365 days |
| **Consumers** | 2 simultaneous | Multiple (enhanced fan-out) |
| **Cost** | Free (included) | Additional Kinesis charges |
| **Data access** | Via DynamoDB Streams API | Via Kinesis API |
| **Use case** | Simple trigger/replication | Multiple consumers, long retention |

---

## DynamoDB Transactions

### TransactWriteItems Example

```java
// Scenario: Transfer funds between accounts
dynamoDbClient.transactWriteItems(TransactWriteItemsRequest.builder()
    .transactItems(
        // 1. Debit source account (with balance check)
        TransactWriteItem.builder().update(Update.builder()
            .tableName("Accounts")
            .key(Map.of("accountId", AttributeValue.fromS("ACC-001")))
            .updateExpression("SET balance = balance - :amount")
            .conditionExpression("balance >= :amount")
            .expressionAttributeValues(Map.of(":amount", AttributeValue.fromN("500")))
            .build()).build(),

        // 2. Credit destination account
        TransactWriteItem.builder().update(Update.builder()
            .tableName("Accounts")
            .key(Map.of("accountId", AttributeValue.fromS("ACC-002")))
            .updateExpression("SET balance = balance + :amount")
            .expressionAttributeValues(Map.of(":amount", AttributeValue.fromN("500")))
            .build()).build(),

        // 3. Create audit record
        TransactWriteItem.builder().put(Put.builder()
            .tableName("Transfers")
            .item(Map.of(
                "transferId", AttributeValue.fromS(UUID.randomUUID().toString()),
                "from", AttributeValue.fromS("ACC-001"),
                "to", AttributeValue.fromS("ACC-002"),
                "amount", AttributeValue.fromN("500"),
                "timestamp", AttributeValue.fromS(Instant.now().toString())))
            .build()).build(),

        // 4. Condition check (no write, just validate)
        TransactWriteItem.builder().conditionCheck(ConditionCheck.builder()
            .tableName("AccountLimits")
            .key(Map.of("accountId", AttributeValue.fromS("ACC-001")))
            .conditionExpression("dailyTransferTotal + :amount <= :limit")
            .expressionAttributeValues(Map.of(
                ":amount", AttributeValue.fromN("500"),
                ":limit", AttributeValue.fromN("10000")))
            .build()).build()
    ).build());
```

### Transaction Limits & Costs

| Limit | Value |
|---|---|
| Max items per transaction | **100** |
| Max data per transaction | **4 MB** |
| RCU cost | **2× standard** |
| WCU cost | **2× standard** |
| Cross-region | ❌ Not supported |
| Cross-table | ✅ Supported (same region) |

---

## DAX (DynamoDB Accelerator) Deep Dive

### DAX Architecture

```
Application → DAX Cluster (in VPC) → DynamoDB Table
                  ↓ cache miss
              DynamoDB Table
              
Write path:  App → DAX → DynamoDB (write-through)
Read path:   App → DAX cache hit → return immediately
             App → DAX cache miss → DynamoDB → cache result → return
```

### DAX Caches

| Cache | Description | TTL |
|---|---|---|
| **Item Cache** | Individual GetItem results | Default 5 min |
| **Query Cache** | Query/Scan results (parameters as key) | Default 5 min |

### When NOT to Use DAX

- **Write-heavy workloads** — DAX adds latency to writes (write-through)
- **Strongly consistent reads** — DAX doesn't support them
- **Infrequently accessed data** — cache miss ratio too high
- **Application not in VPC** — DAX requires VPC access

---

## Global Tables

Multi-region, fully managed, **active-active** replication:

```
US-East-1 Table ←→ EU-West-1 Table ←→ AP-Southeast-1 Table
(read/write)        (read/write)        (read/write)

Conflict resolution: Last Writer Wins (based on timestamp)
```

### Requirements
- DynamoDB Streams must be enabled
- Table must use On-Demand or have auto-scaling configured
- Same table name in all regions

### Use Cases
- **Disaster recovery** — automatic failover across regions
- **Low-latency global access** — users read/write to nearest region
- **Data residency** — keep data in specific regions

---

## TTL (Time to Live) Deep Dive

```java
// Set TTL when creating an item
Map<String, AttributeValue> item = Map.of(
    "sessionId", AttributeValue.fromS("sess-abc123"),
    "userId", AttributeValue.fromS("user-456"),
    "data", AttributeValue.fromS("...session data..."),
    "expiresAt", AttributeValue.fromN(String.valueOf(
        Instant.now().plus(Duration.ofHours(24)).getEpochSecond()  // SECONDS, not millis!
    ))
);
```

:::caution[TTL Gotchas]
1. **Format**: Must be **Unix epoch in seconds**, NOT milliseconds
2. **Precision**: Deletions happen within **48 hours** of expiry (not immediate!)
3. **Queries**: Expired items are still returned until deleted — always filter
4. **Streams**: TTL deletions appear as `REMOVE` events (useful for cleanup triggers)
5. **Cost**: Free — no WCU consumed
:::

---

## PartiQL (SQL-Compatible Queries)

```java
// SELECT
ExecuteStatementResponse response = dynamoDbClient.executeStatement(
    ExecuteStatementRequest.builder()
        .statement("SELECT orderId, status, totalAmount FROM Orders WHERE orderId = ?")
        .parameters(AttributeValue.fromS("ORD-123"))
        .build());

// INSERT
dynamoDbClient.executeStatement(ExecuteStatementRequest.builder()
    .statement("INSERT INTO Orders VALUE {'orderId': ?, 'status': ?, 'totalAmount': ?}")
    .parameters(
        AttributeValue.fromS("ORD-456"),
        AttributeValue.fromS("PENDING"),
        AttributeValue.fromN("299.99"))
    .build());

// UPDATE
dynamoDbClient.executeStatement(ExecuteStatementRequest.builder()
    .statement("UPDATE Orders SET status = ? WHERE orderId = ?")
    .parameters(AttributeValue.fromS("SHIPPED"), AttributeValue.fromS("ORD-123"))
    .build());

// Batch with PartiQL
dynamoDbClient.batchExecuteStatement(BatchExecuteStatementRequest.builder()
    .statements(
        BatchStatementRequest.builder()
            .statement("UPDATE Inventory SET quantity = quantity - ? WHERE productId = ?")
            .parameters(AttributeValue.fromN("1"), AttributeValue.fromS("PROD-001"))
            .build(),
        BatchStatementRequest.builder()
            .statement("UPDATE Inventory SET quantity = quantity - ? WHERE productId = ?")
            .parameters(AttributeValue.fromN("2"), AttributeValue.fromS("PROD-002"))
            .build())
    .build());
```

:::caution[PartiQL Performance Trap]
`SELECT * FROM Orders` without a WHERE clause on the **partition key** is a **full table scan**! PartiQL uses the same capacity and performance characteristics as the DynamoDB API.
:::

---

## Write Sharding (Hot Partition Fix)

### The Problem

```
PK = "STATUS#ACTIVE" → 90% of all writes → ONE partition → THROTTLING
```

### The Solution

```java
// Shard the partition key with a random suffix
int shardCount = 10;
String suffix = String.valueOf(ThreadLocalRandom.current().nextInt(0, shardCount));
String shardedKey = "STATUS#ACTIVE#" + suffix;
// Produces: STATUS#ACTIVE#0, STATUS#ACTIVE#1, ..., STATUS#ACTIVE#9
```

```java
// Query all shards (scatter-gather pattern)
List<CompletableFuture<QueryResponse>> futures = IntStream.range(0, shardCount)
    .mapToObj(i -> asyncClient.query(QueryRequest.builder()
        .tableName("Orders")
        .keyConditionExpression("PK = :pk")
        .expressionAttributeValues(Map.of(":pk",
            AttributeValue.fromS("STATUS#ACTIVE#" + i)))
        .build()))
    .collect(Collectors.toList());

// Merge results from all shards
List<Map<String, AttributeValue>> allItems = futures.stream()
    .map(CompletableFuture::join)
    .flatMap(r -> r.items().stream())
    .collect(Collectors.toList());
```

---

## Single-Table Design Pattern

### Why Single Table?

| Benefit | Description |
|---|---|
| **Fewer API calls** | Fetch related entities in one Query |
| **Lower cost** | Fewer tables = fewer provisioned capacities |
| **Atomic transactions** | Related items in same table can be transacted |

### Example: E-Commerce Schema

```
PK                SK                   Type        Attributes
─────────────────────────────────────────────────────────────
USER#u1           USER#u1              User        {name: "Alice", email: "a@b.com"}
USER#u1           ORDER#2024-01-15#o1  Order       {total: 149.99, status: "SHIPPED"}
USER#u1           ORDER#2024-02-20#o2  Order       {total: 89.00, status: "PENDING"}
ORDER#o1          PRODUCT#p1           OrderItem   {qty: 2, unitPrice: 29.99}
ORDER#o1          PRODUCT#p2           OrderItem   {qty: 1, unitPrice: 89.99}
PRODUCT#p1        PRODUCT#p1           Product     {name: "Widget", price: 29.99}

Access Patterns:
1. Get user profile:     Query PK=USER#u1, SK=USER#u1
2. Get user's orders:    Query PK=USER#u1, SK begins_with("ORDER#")
3. Get order items:      Query PK=ORDER#o1, SK begins_with("PRODUCT#")
4. Get product:          Query PK=PRODUCT#p1, SK=PRODUCT#p1
```

### GSI Overloading

```
GSI1:
  PK = GSI1PK    SK = GSI1SK

Table Item                      GSI1PK           GSI1SK
─────────────────────────────────────────────────────────
User (USER#u1)                  EMAIL#a@b.com    USER#u1
Order (ORDER#o1)                STATUS#SHIPPED   2024-01-15
Product (PRODUCT#p1)            CATEGORY#ELEC    PRICE#29.99

Access Patterns via GSI1:
5. Find user by email:   Query GSI1PK=EMAIL#a@b.com
6. Orders by status:     Query GSI1PK=STATUS#SHIPPED, SK between dates
7. Products by category: Query GSI1PK=CATEGORY#ELEC, SK sorted by price
```

---

## 🏆 Best Practices

### Enhanced Client
1. **Use `@DynamoDbVersionAttribute`** for all entities that can be concurrently modified
2. **Reuse the `DynamoDbEnhancedClient` as a singleton** — expensive to create
3. **Use `@DynamoDbImmutable`** for read-only entities (better performance)

### Streams
1. **Use `ReportBatchItemFailures`** to avoid reprocessing entire batches
2. **Choose the right view type** — `KEYS_ONLY` if you'll look up the full item anyway
3. **Handle duplicate events** — streams guarantee at-least-once delivery

### Single-Table Design
1. **Map all access patterns first** — then design keys to support them
2. **Use `begins_with` on sort key** for hierarchical queries
3. **GSI overloading** — reuse GSI columns for different entity types
4. **Don't force it** — if you have simple, independent entities, separate tables are fine

---

## 🎯 DVA-C02 Exam Tips

:::tip[Advanced DynamoDB Exam Cheat Sheet]
1. **Global Tables** = multi-region active-active, Last Writer Wins, needs Streams enabled
2. **Transactions** = 2× cost, max 100 items, 4 MB, same region only
3. **Streams retention** = 24 hours. For longer, use Kinesis Data Streams for DynamoDB
4. **PartiQL** without PK in WHERE = **full table scan** (same cost as Scan API)
5. **@DynamoDbVersionAttribute** = automatic optimistic locking via Enhanced Client
6. **DAX** = microsecond reads, eventually consistent only, write-through, VPC required
7. **Write sharding** = add random suffix to PK for hot partition fix
8. **UnprocessedItems** in batch operations = must retry with backoff
9. **TTL** = free deletions, Unix epoch seconds, up to 48h delay
10. **Single-table design** = fewer API calls, lower cost, but higher complexity
:::

---

## Practice Questions

**Q1.** A Lambda ESM processes DynamoDB Stream records in batches of 100. One record causes an exception. What happens to the other 99 by default?

A) Only successful records are committed  
B) **The entire batch is retried**  
C) Failed record goes to DLQ immediately  
D) Lambda skips the failed record  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — By default, the entire batch retries. Use `ReportBatchItemFailures` to report only the failed record's sequence number.
</details>

---

**Q2.** Which Enhanced Client annotation enables automatic optimistic locking?

A) `@DynamoDbPartitionKey`  
B) `@DynamoDbConditional`  
C) **`@DynamoDbVersionAttribute`**  
D) `@DynamoDbOptimisticLock`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `@DynamoDbVersionAttribute` auto-manages version numbers and adds condition expressions to prevent concurrent overwrites.
</details>

---

**Q3.** Global Tables use which conflict resolution strategy?

A) First Writer Wins  
B) **Last Writer Wins (timestamp-based)**  
C) Manual conflict resolution  
D) Merge both writes  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Global Tables use **Last Writer Wins** based on the item's timestamp. The most recent write across all regions is the final value.
</details>

---

**Q4.** A table has a hot partition key "STATUS#ACTIVE". How should you fix this?

A) Increase WCU provisioning  
B) **Add a random suffix to the partition key (write sharding)**  
C) Create a GSI  
D) Switch to On-Demand mode  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Write sharding distributes writes across multiple partitions (e.g., `STATUS#ACTIVE#0` through `STATUS#ACTIVE#9`). On-Demand adapts to overall throughput but doesn't fix per-partition limits.
</details>

---

**Q5.** A `BatchWriteItem` of 25 items returns 5 `UnprocessedItems`. What should the application do?

A) Throw an error  
B) Ignore the unprocessed items  
C) **Retry the unprocessed items with exponential backoff**  
D) Reduce batch size to 1  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `UnprocessedItems` means DynamoDB couldn't process them due to capacity constraints. Retry with **exponential backoff** to avoid further throttling.
</details>

---

## 🔗 Resources

- [DynamoDB Enhanced Client](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/dynamodb-enhanced-client.html)
- [DynamoDB PartiQL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Single-Table Design (Alex DeBrie)](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [The DynamoDB Book](https://www.dynamodbbook.com/)
