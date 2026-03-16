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

---

## DynamoDB Enhanced Client (Java)

The Enhanced Client maps POJOs to DynamoDB items automatically:

```java
// Entity class
@DynamoDbBean
public class Order {
    private String orderId;
    private String customerId;
    private String status;
    private Instant createdAt;

    @DynamoDbPartitionKey
    public String getOrderId() { return orderId; }

    @DynamoDbSortKey
    public String getCustomerId() { return customerId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "status-index")
    public String getStatus() { return status; }
    
    // getters and setters...
}

// Create Enhanced Client
DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
    .dynamoDbClient(DynamoDbClient.create())
    .build();

DynamoDbTable<Order> orderTable = enhancedClient.table("Orders", 
    TableSchema.fromBean(Order.class));

// CRUD operations
orderTable.putItem(order);
Order fetched = orderTable.getItem(r -> r.key(k -> k
    .partitionValue("ord-123")
    .sortValue("cust-456")));
```

---

## Optimistic Locking (Version Numbers)

```java
@DynamoDbBean
public class Product {
    private String productId;
    private String name;
    private Long version;

    @DynamoDbPartitionKey
    public String getProductId() { return productId; }

    @DynamoDbVersionAttribute   // Automatically managed by Enhanced Client
    public Long getVersion() { return version; }
}

// Enhanced client auto-adds condition expression: version = :expected
// Throws TransactionCanceledException if version doesn't match
```

---

## DynamoDB Streams + Lambda Pipeline

```
DynamoDB Table
    ↓ (change event)
DynamoDB Stream (NEW_AND_OLD_IMAGES)
    ↓
Lambda ESM (batch of records)
    ↓
Process: index to OpenSearch, aggregate stats, audit trail
```

```java
public class StreamHandler implements RequestHandler<DynamodbEvent, Void> {
    public Void handleRequest(DynamodbEvent event, Context context) {
        for (DynamodbEvent.DynamodbStreamRecord record : event.getRecords()) {
            String eventName = record.getEventName(); // INSERT, MODIFY, REMOVE
            
            Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
            Map<String, AttributeValue> oldImage = record.getDynamodb().getOldImage();
            
            if ("INSERT".equals(eventName)) {
                handleNewOrder(newImage);
            } else if ("MODIFY".equals(eventName)) {
                handleOrderUpdate(oldImage, newImage);
            }
        }
        return null;
    }
}
```

---

## PartiQL (SQL-Compatible Queries)

```java
// SELECT with PartiQL
ExecuteStatementResponse response = dynamoDbClient.executeStatement(
    ExecuteStatementRequest.builder()
        .statement("SELECT * FROM Orders WHERE orderId = ?")
        .parameters(AttributeValue.fromS("ord-123"))
        .build());

// UPDATE with PartiQL
dynamoDbClient.executeStatement(ExecuteStatementRequest.builder()
    .statement("UPDATE Orders SET status = ? WHERE orderId = ?")
    .parameters(
        AttributeValue.fromS("SHIPPED"),
        AttributeValue.fromS("ord-123"))
    .build());
```

:::caution PartiQL SELECT scans
`SELECT * FROM Orders` without a WHERE on the partition key is a **full table scan**! Always include the partition key condition.
:::

---

## Write Sharding (Hot Partition Fix)

If you have a low-cardinality partition key causing hot partitions:

```java
// Instead of: partition key = "STATUS#ACTIVE" (all writes go to one shard)
// Use: partition key = "STATUS#ACTIVE#" + random(1-10)

String suffix = String.valueOf(ThreadLocalRandom.current().nextInt(1, 11));
String shardedKey = "STATUS#ACTIVE#" + suffix;
```

To query all shards, make 10 parallel queries and merge results.

---

## Single-Table Design Pattern

```
PK              SK                  Type       Data
────────────────────────────────────────────────────────
USER#u1         USER#u1             User       {name, email}
USER#u1         ORDER#o1            Order      {date, total}
USER#u1         ORDER#o2            Order      {date, total}
PRODUCT#p1      PRODUCT#p1          Product    {name, price}
ORDER#o1        PRODUCT#p1          OrderItem  {qty, price}
```

Single table stores multiple entity types — enables efficient access patterns.

---

## 🧪 Practice Questions

**Q1.** A Lambda ESM processes DynamoDB Stream records in batches of 100. One record causes the Lambda to throw an exception. What happens to the other 99 records by default?

A) The 99 records are successfully committed; only the failed one retries  
B) The **entire batch** is retried (including the 99 successful ones)  
C) The failed record goes to a DLQ immediately  
D) Lambda skips the failed record and commits the rest  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — DynamoDB Streams ESM retries the **entire batch** on failure. To avoid reprocessing successful records, use `ReportBatchItemFailures` in your Lambda response to return only the failed record's `sequenceNumber`.
</details>

---

**Q2.** Which DynamoDB Java Enhanced Client annotation enables **automatic optimistic locking** with version number management?

A) `@DynamoDbPartitionKey`  
B) `@DynamoDbConditional`  
C) `@DynamoDbVersionAttribute`  
D) `@DynamoDbOptimisticLock`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `@DynamoDbVersionAttribute` tells the Enhanced Client to automatically manage a version number and add condition expressions to prevent concurrent overwrites.
</details>

---

## 🔗 Resources

- [DynamoDB Enhanced Client](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/dynamodb-enhanced-client.html)
- [DynamoDB PartiQL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html)
- [Single-Table Design (Alex DeBrie)](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [The DynamoDB Book](https://www.dynamodbbook.com/)
