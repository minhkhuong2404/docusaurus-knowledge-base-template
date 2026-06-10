---
id: nosql-distributed
title: NoSQL & Distributed Databases
description: From first principles to production — key-value, document, wide-column, and graph databases with deep dives into MongoDB and Cassandra for Java/Spring engineers.
tags: [database, nosql, mongodb, cassandra, redis, dynamodb, graph, distributed, eventual-consistency, spring-data]
sidebar_position: 7
---

# NoSQL & Distributed Databases

:::info[Who this guide is for]
- **New learners** — start at [Why NoSQL?](#why-nosql) and read top-to-bottom. Every concept is explained from scratch before code appears.
- **Senior engineers** — jump to [Deep Dives](#-deep-dive-mongodb-internals), [Failure Modes](#️-failure-modes-and-operational-concerns), or [Advanced Patterns](#-advanced-patterns).
:::

---

## Why NoSQL?

### The Problem with Pure SQL at Scale

Imagine you are building Twitter. Every user has followers, posts, likes, and hashtags. In PostgreSQL you'd end up with something like:

```sql
users → posts → likes → hashtags → post_hashtags
```

Now imagine 400 million daily active users. What breaks?

1. **Schema is rigid** — Adding a `poll` field to `posts` means an `ALTER TABLE` that locks 10 billion rows for hours.
2. **Joins get expensive** — Rendering a single timeline requires joining `users`, `posts`, `follows`, and `likes`. At scale this kills latency.
3. **Vertical scaling hits a wall** — You can only put so much RAM and CPU in one server. A single PostgreSQL instance tops out around 100K writes/sec under ideal conditions.
4. **Everything lives in one box** — One region, one failure domain.

NoSQL databases emerged to solve these specific problems. They are not "better" than SQL — they make different trade-offs:

| They give up... | To gain... |
|----------------|-----------|
| Strict ACID guarantees | Horizontal write scalability |
| Rigid schemas | Schema flexibility / evolution |
| Universal query patterns | Speed for a specific access pattern |
| Joins | Simpler distributed architecture |

> **Mental model**: SQL is a Swiss Army knife — great for many tasks, good at all of them. NoSQL databases are specialist tools — excellent at their specific job, intentionally limited elsewhere.

---

## NoSQL Categories at a Glance

| Category | Think of it as... | Examples | Best For |
|----------|------------------|----------|----------|
| **Key-Value** | Distributed HashMap | Redis, DynamoDB, Memcached | Sessions, caching, leaderboards |
| **Document** | Distributed JSON file cabinet | MongoDB, Couchbase, Firestore | Catalogs, user profiles, CMS |
| **Wide-Column** | Distributed sorted map of maps | Cassandra, HBase, Bigtable | Time-series, event logs, IoT |
| **Graph** | Whiteboard diagram, queryable | Neo4j, Amazon Neptune | Social graphs, fraud detection |
| **Time-Series** | Append-only metrics log | InfluxDB, TimescaleDB | Monitoring, IoT sensors |
| **Search** | Indexed text engine | Elasticsearch, OpenSearch | Full-text search, log analytics |

---

## Key-Value Stores (Redis)

### What is it?

The simplest possible model: a giant distributed hash map. You store a value under a key; you retrieve it by that key. The database has no idea what's inside the value — it's just bytes to store and return.

```
SET  key   value   [expiry]
GET  key
DEL  key
```

### Why use it?

- **Sub-millisecond latency** — everything lives in RAM
- **Dead simple API** — no schema, no migrations
- **Horizontal scaling** — cluster mode shards keys across nodes

### When NOT to use it

- You need to query by value fields (e.g., "find all users where country = VN")
- Data is too large to fit in RAM
- You need multi-row ACID transactions

### Redis — Beyond Simple Get/Set

Redis extends the pure key-value model with rich data structures. This is what makes it uniquely useful:

```bash
# ── String ──────────────────────────────────────────────
SET  visits:homepage  1042
INCR visits:homepage         # atomic increment → 1043
INCRBY visits:homepage 10    # → 1053

# ── Hash (object fields without fetching the whole thing) ──
HSET user:1001  name "Alice"  email "alice@example.com"  country "VN"
HGET user:1001 name            # → "Alice"
HMGET user:1001 name country   # → ["Alice", "VN"]

# ── List (queue / timeline) ──────────────────────────────
LPUSH  notifications:1001  "You have a new follower"
LPUSH  notifications:1001  "Your post was liked"
LRANGE notifications:1001 0 9   # latest 10 notifications

# ── Set (unique membership) ──────────────────────────────
SADD  post:555:likes  "user:1"  "user:2"  "user:3"
SCARD post:555:likes   # count → 3
SISMEMBER post:555:likes "user:2"  # → 1 (true)

# ── Sorted Set (leaderboard / ranked feed) ───────────────
ZADD leaderboard  5000 "alice"
ZADD leaderboard  8200 "bob"
ZADD leaderboard  7100 "carol"
ZREVRANGE leaderboard 0 9 WITHSCORES  # top 10 with scores
ZRANK leaderboard "alice"             # rank (0-indexed from bottom)
ZREVRANK leaderboard "alice"          # rank from top → 2
```

### Spring Boot + Redis (Practical)

```java
// application.yml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 10
          max-idle: 5

// --- Simple cache-aside pattern ---
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repo;
    private final RedisTemplate<String, Product> redisTemplate;
    private static final Duration TTL = Duration.ofMinutes(30);

    public Product findById(Long id) {
        String key = "product:" + id;
        ValueOperations<String, Product> ops = redisTemplate.opsForValue();

        Product cached = ops.get(key);
        if (cached != null) return cached;

        Product product = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Product " + id));

        ops.set(key, product, TTL);
        return product;
    }

    public void invalidate(Long id) {
        redisTemplate.delete("product:" + id);
    }
}

// --- Spring Cache abstraction (simpler, less control) ---
@Service
public class UserService {

    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public User findById(Long id) { /* hits DB only on cache miss */ }

    @CacheEvict(value = "users", key = "#user.id")
    public User update(User user) { /* evicts on update */ }

    @CachePut(value = "users", key = "#result.id")
    public User create(User user) { /* writes through to cache */ }
}
```

:::tip[Cache-Aside vs Write-Through]
**Cache-aside** (lazy loading): populate cache only on read miss. Risk: cache stampede on cold start.
**Write-through**: write to cache on every DB write. Risk: cache bloat with rarely-read data.
**Write-behind**: write to cache first, async flush to DB. Risk: data loss on crash.
:::

---

## Document Databases (MongoDB)

### What is it?

A document database stores data as self-contained documents — typically JSON or a binary variant of it (BSON). Each document can have a different structure. There is no table schema to define upfront.

```json
// No predefined schema — each document can look different
{ "_id": "usr_001", "name": "Alice", "plan": "premium", "verified": true }
{ "_id": "usr_002", "name": "Bob",   "plan": "free",    "region": "VN", "referrer": "carol" }
```

### Why use it?

1. **Domain objects map naturally** — A Java `User` with a nested `List<Address>` becomes a single document. No ORM gymnastics.
2. **Schema evolution is cheap** — Adding a new field to documents doesn't require `ALTER TABLE`.
3. **Rich queries inside documents** — Unlike Redis, you can query and index on any field inside the document.
4. **Horizontal sharding** — MongoDB shards collections across nodes using a shard key.

### Real Use Cases

| Domain | Why MongoDB fits |
|--------|----------------|
| E-commerce product catalog | Each product category has different attributes (a shirt has size/color, a laptop has RAM/CPU) |
| User profiles | Arbitrary preferences, feature flags, nested metadata vary per user |
| CMS / blog | Articles have variable fields; comments embedded naturally |
| IoT device data | Device telemetry schema varies per device type |
| Game player state | Complex nested state (inventory, quests, achievements) |

### MongoDB Data Model — The Core Decision

The most important design decision in MongoDB is **embed vs reference**:

```
Embed → store related data inside the parent document (like JOIN already done)
Reference → store only an ID and look up separately (like a foreign key)
```

```json
// ── EMBEDDED: Order items inside an order document ──────
{
  "_id": "ORD-001",
  "userId": "usr_001",
  "status": "shipped",
  "items": [
    { "productId": "prod_abc", "name": "MacBook Air", "qty": 1, "price": 1299.00 },
    { "productId": "prod_xyz", "name": "USB-C Hub",   "qty": 2, "price": 29.99  }
  ],
  "shippingAddress": {
    "street": "123 Nguyen Van Linh",
    "city": "Ho Chi Minh City",
    "country": "VN"
  },
  "createdAt": "2024-11-01T08:30:00Z"
}

// ── REFERENCED: Blog post references author by ID ────────
{
  "_id": "post_001",
  "title": "Understanding NoSQL",
  "authorId": "usr_001",       // ← just an ID, not embedded
  "tags": ["database", "nosql"],
  "content": "..."
}
```

**Decision rules:**

| Embed when... | Reference when... |
|--------------|------------------|
| Data is always read together | Data is accessed independently |
| 1-to-few relationship (< ~20 items) | 1-to-many (unbounded list) |
| Child has no life beyond parent | Child is updated frequently on its own |
| You want single-document atomicity | Many parents share the same child |

:::warning[The Unbounded Array Anti-Pattern]
Never embed a list that can grow without limit. A `comments` array inside a blog post document will eventually hit MongoDB's 16MB document limit or cause massive read amplification.

**Fix**: create a separate `comments` collection and reference `postId`.
:::

### MongoDB CRUD & Aggregation

```javascript
// ── Insert ────────────────────────────────────────────────
db.products.insertOne({
  name: "MacBook Air M3",
  price: 1299,
  category: "laptop",
  specs: { ram: 16, storage: 512, chip: "M3" },
  tags: ["apple", "ultrabook"]
})

// ── Find with projection ──────────────────────────────────
db.products.find(
  { category: "laptop", price: { $lte: 1500 } },
  { name: 1, price: 1, _id: 0 }        // project: include name & price, exclude _id
).sort({ price: 1 }).limit(10)

// ── Update ────────────────────────────────────────────────
db.products.updateOne(
  { _id: ObjectId("64abc...") },
  {
    $set:  { price: 1199 },            // set specific fields
    $push: { tags: "sale" },           // append to array
    $inc:  { "stats.viewCount": 1 }    // atomic increment nested field
  }
)

// ── Aggregation Pipeline ──────────────────────────────────
// "What is the average order value per customer, for orders shipped in 2024?"
db.orders.aggregate([
  { $match: {
      status: "shipped",
      createdAt: { $gte: ISODate("2024-01-01"), $lt: ISODate("2025-01-01") }
  }},
  { $group: {
      _id: "$userId",
      avgOrderValue: { $avg: "$total" },
      orderCount:    { $sum: 1 }
  }},
  { $lookup: {                          // JOIN users collection
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
  }},
  { $unwind: "$user" },
  { $project: {
      customerName: "$user.name",
      avgOrderValue: { $round: ["$avgOrderValue", 2] },
      orderCount: 1
  }},
  { $sort: { avgOrderValue: -1 } },
  { $limit: 20 }
])
```

### Spring Data MongoDB — Full Example

```java
// ── Domain model ─────────────────────────────────────────
@Document(collection = "products")
@CompoundIndex(name = "cat_price_idx", def = "{'category': 1, 'price': 1}")
public class Product {

    @Id
    private String id;

    @Indexed
    private String category;

    private String name;
    private BigDecimal price;
    private ProductSpecs specs;          // embedded document
    private List<String> tags;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

@Value                                   // Lombok immutable
public class ProductSpecs {
    int ram;
    int storage;
    String chip;
}

// ── Repository ────────────────────────────────────────────
@Repository
public interface ProductRepository extends MongoRepository<Product, String> {

    // Derived query — Spring generates the query from method name
    List<Product> findByCategoryAndPriceLessThanEqual(String category, BigDecimal maxPrice);

    // Custom query with @Query
    @Query("{ 'tags': { $in: ?0 }, 'price': { $lte: ?1 } }")
    List<Product> findByTagsInAndPriceAtMost(List<String> tags, BigDecimal maxPrice);

    // Pagination
    Page<Product> findByCategory(String category, Pageable pageable);

    // Exists / count
    boolean existsByName(String name);
    long countByCategory(String category);
}

// ── Complex queries with MongoTemplate ───────────────────
@Service
@RequiredArgsConstructor
public class ProductQueryService {

    private final MongoTemplate mongo;

    public List<CategorySummary> getTopCategoriesByRevenue(int topN) {
        Aggregation agg = newAggregation(
            match(where("status").is("sold")),
            group("category")
                .sum("price").as("totalRevenue")
                .count().as("unitsSold"),
            sort(Sort.by(DESC, "totalRevenue")),
            limit(topN),
            project("totalRevenue", "unitsSold")
                .and("_id").as("category")
        );

        return mongo.aggregate(agg, "products", CategorySummary.class)
                    .getMappedResults();
    }

    public void incrementViewCount(String productId) {
        Query query = query(where("id").is(productId));
        Update update = new Update().inc("stats.viewCount", 1);
        mongo.updateFirst(query, update, Product.class);
    }

    // Bulk write — efficient for batch updates
    public BulkWriteResult applyDiscount(String category, double discountPct) {
        BulkOperations ops = mongo.bulkOps(BulkMode.UNORDERED, Product.class);

        Query q = query(where("category").is(category));
        Update u = new Update().multiply("price", 1 - discountPct / 100);
        ops.updateMulti(q, u);

        return ops.execute();
    }
}
```

### Indexing Strategy

```java
// ── Single field index ────────────────────────────────────
@Indexed(unique = true)
private String email;

// ── Compound index (order matters!) ──────────────────────
// Supports: category, category+price, category+price+status
// Does NOT support: price alone, status alone
@CompoundIndex(def = "{'category': 1, 'price': 1, 'status': 1}")

// ── Text index for full-text search ──────────────────────
@TextIndexed(weight = 2)  // higher weight = more relevance
private String name;

@TextIndexed
private String description;

// Query: db.products.find({ $text: { $search: "macbook air" } })

// ── TTL index — auto-delete expired documents ─────────────
@Indexed(expireAfterSeconds = 3600)
private Instant expiresAt;   // document deleted after this time + 1hr

// ── Wildcard index — for dynamic fields ───────────────────
// Useful for product specs that differ per category
// db.products.createIndex({ "specs.$**": 1 })
```

:::tip[Index Design Rules]
1. **Index fields you filter or sort on frequently**
2. **Compound index field order**: equality fields first, then range/sort fields
3. **Don't over-index**: each index costs write performance and RAM
4. **Use `explain("executionStats")`** to verify index usage before going to production
:::

---

## Wide-Column Stores (Cassandra)

### What is it?

Think of Cassandra as a distributed, sorted map of maps:

```
Table = Map<PartitionKey, SortedMap<ClusteringKey, Row>>
```

Data is spread across nodes by hashing the partition key. Within a partition, rows are physically sorted by the clustering key.

### Why use it?

- **Massive write throughput** — Cassandra can sustain millions of writes/second across a cluster
- **Linear horizontal scaling** — add nodes, get proportionally more capacity
- **No single point of failure** — truly masterless, every node is equal
- **Tunable consistency** — trade consistency for speed per operation

### When to use Cassandra

| ✅ Great fit | ❌ Poor fit |
|-------------|------------|
| Time-series data (IoT, metrics, events) | Ad-hoc queries with unknown access patterns |
| Append-heavy workloads | Frequent updates to existing rows |
| Multi-region active-active writes | Complex transactions across many rows |
| Known, fixed access patterns | Aggregations like SUM/GROUP BY at scale |

### Data Model — Think in Queries First

In SQL you normalize first and query later. **In Cassandra, start with your queries and design tables to serve exactly those queries**.

```sql
-- Query 1: "Get all orders for user X, newest first"
CREATE TABLE orders_by_user (
    user_id     UUID,
    created_at  TIMESTAMP,
    order_id    UUID,
    total       DECIMAL,
    status      TEXT,
    items       LIST<FROZEN<order_item>>,
    PRIMARY KEY ((user_id), created_at, order_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Query 2: "Get all orders with status=shipped (for ops dashboard)"
-- Needs a SEPARATE table — Cassandra doesn't filter by non-primary-key columns efficiently
CREATE TABLE orders_by_status (
    status      TEXT,
    created_at  TIMESTAMP,
    order_id    UUID,
    user_id     UUID,
    total       DECIMAL,
    PRIMARY KEY ((status), created_at, order_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Efficient: hits exactly one partition
SELECT * FROM orders_by_user
WHERE user_id = ? AND created_at >= ? AND created_at <= ?;
```

### Consistency Levels

```
Replication factor N = 3 (data exists on 3 nodes)

WRITE consistency levels:
  ANY      → at least 1 node (including hinted handoff) acked — fastest, weakest
  ONE      → at least 1 replica acked
  QUORUM   → majority (⌊N/2⌋ + 1 = 2) acked → strong with QUORUM reads
  ALL      → all 3 replicas acked — strongest, slowest, unavailable if any node down

READ consistency levels:
  ONE      → 1 replica responds (may be stale)
  QUORUM   → majority responds, coordinator picks freshest value
  ALL      → all replicas respond

Strong consistency: W + R > N
  QUORUM + QUORUM = 2 + 2 > 3 ✅
  ONE + ONE       = 1 + 1 > 3 ❌ (stale reads possible)
```

---

## Graph Databases (Neo4j)

### What is it?

A graph database stores data as nodes (things) and edges (relationships between things), both with arbitrary properties.

```
(Alice:User)-[:FOLLOWS {since: "2023-01"}]->(Bob:User)
(Bob:User)-[:AUTHORED]->(Post:Post {title: "NoSQL Guide"})
(Alice:User)-[:LIKED]->(Post)
```

### Why use it?

In SQL, "find all friends of friends" requires a self-join — and "friends 3 hops away" means 3 self-joins, which explodes exponentially. In a graph DB, each hop is `O(1)` — just follow an edge pointer.

### Use Cases

- **Social networks** — friends, followers, mutual connections
- **Fraud detection** — find accounts connected to known fraud accounts within N hops
- **Recommendation engines** — "users who bought X also bought Y"
- **Knowledge graphs** — semantic relationships between concepts
- **Network topology** — which servers depend on which services

```cypher
// Friends of friends I don't already follow
MATCH (me:User {id: $userId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(fof:User)
WHERE NOT (me)-[:FOLLOWS]->(fof) AND me <> fof
RETURN fof.name, COUNT(*) AS mutualFriends
ORDER BY mutualFriends DESC LIMIT 10;

// Fraud ring detection — accounts connected within 3 hops to a known fraudster
MATCH path = (suspect:Account {flagged: true})-[:TRANSFERRED_TO|SHARES_DEVICE*1..3]->(acc:Account)
WHERE acc.flagged = false
RETURN acc, length(path) AS hops
ORDER BY hops;

// Shortest path between two users
MATCH p = shortestPath(
  (alice:User {name: "Alice"})-[*]-(bob:User {name: "Bob"})
)
RETURN p, length(p) AS degrees;
```

---

## DynamoDB (AWS)

### What is it?

DynamoDB is AWS's fully managed, serverless key-value and document database. You pay per read/write unit, not per server.

Primary key is either:
- **Partition Key only** (simple primary key) — like `userId`
- **Partition Key + Sort Key** (composite primary key) — like `userId` + `orderId`

### Single-Table Design

The most powerful (and mind-bending) DynamoDB pattern. Store multiple entity types in one table using generic `PK`/`SK` attributes:

```
PK                | SK               | GSI1PK          | Attributes
------------------|------------------|-----------------|------------------
USER#alice        | PROFILE          | STATUS#active   | name, email, plan
USER#alice        | ORDER#2024-001   | ORDER#2024-001  | total, status
USER#alice        | ORDER#2024-002   | ORDER#2024-002  | total, status
PRODUCT#mac-air   | DETAILS          | CAT#laptop      | price, stock
PRODUCT#mac-air   | REVIEW#rev-001   |                 | rating, comment
```

Access patterns all served from one table:
- Get user profile → `PK = USER#alice, SK = PROFILE`
- Get all orders for user → `PK = USER#alice, SK begins_with ORDER#`
- Get all orders (global) → query `GSI1` where `GSI1PK = ORDER#...`

### Spring + DynamoDB (Enhanced Client)

```java
@DynamoDbBean
public class Order {

    private String pk;          // USER#<userId>
    private String sk;          // ORDER#<orderId>
    private BigDecimal total;
    private String status;
    private Instant createdAt;

    @DynamoDbPartitionKey
    public String getPk() { return pk; }

    @DynamoDbSortKey
    public String getSk() { return sk; }
}

@Service
@RequiredArgsConstructor
public class OrderDynamoService {

    private final DynamoDbEnhancedClient dynamo;
    private final DynamoDbTable<Order> table;

    public List<Order> getOrdersForUser(String userId) {
        QueryConditional condition = QueryConditional
            .sortBeginsWith(Key.builder()
                .partitionValue("USER#" + userId)
                .sortValue("ORDER#")
                .build());

        return table.query(condition)
                    .items()
                    .stream()
                    .toList();
    }
}
```

---

## BASE vs ACID

Most NoSQL systems trade strict relational guarantees for scale and horizontal availability by following the **BASE** model instead of the classic **[ACID](./acid.md)** model:

```
ACID                              BASE
────────────────────────────────────────────────────────
Atomic    — all or nothing        Basically Available
Consistent — always valid state   Soft State — may be stale
Isolated  — transactions          Eventually Consistent
Durable   — survives crashes
```

For a comprehensive comparison of how these properties differ under concurrency, failure modes, and architectural designs, see the **[Database ACID Properties](./acid.md)** guide.

**Eventually consistent** means: if no new writes come in, all replicas will *eventually* converge to the same value. But there's a window where reads may return stale data.

```
Timeline:
  t=0  Writer updates X=5 on Node A
  t=1  Reader queries Node B → returns X=3  ← stale!
  t=2  Replication propagates to Node B
  t=3  Reader queries Node B → returns X=5  ← consistent
```

**Application strategies to handle eventual consistency:**

```java
// 1. Read-your-writes: always read from same node you wrote to
// DynamoDB: use strongly consistent reads immediately after writes
GetItemRequest req = GetItemRequest.builder()
    .tableName("orders")
    .key(key)
    .consistentRead(true)     // ← forces consistent read, doubles RCU cost
    .build();

// 2. Optimistic concurrency: use version numbers to detect stale writes
@Document
public class BankAccount {
    @Id private String id;
    private BigDecimal balance;

    @Version                  // Spring Data auto-increments, throws on conflict
    private Long version;
}

// 3. UI messaging: set expectations with the user
// "Your changes are saved. They may take a moment to appear everywhere."
```

---

## 🔬 Deep Dive: MongoDB Internals

*For senior engineers who need to reason about performance and correctness at depth.*

### Storage Engine: WiredTiger

MongoDB uses WiredTiger by default. Key characteristics:

- **B-Tree for indexes** — every index is a separate B-Tree; `_id` index always exists
- **Document-level concurrency** — multiple writes to different documents in the same collection don't block each other
- **MVCC (Multi-Version Concurrency Control)** — readers don't block writers; each reader sees a consistent snapshot
- **Compression** — documents are snappy/zstd compressed on disk by default

```
Write path:
  1. Write to in-memory cache (WiredTiger cache, default 50% of RAM)
  2. Write to journal (WAL file) for durability — synced every 100ms by default
  3. Async checkpoint to data files every 60 seconds

Read path:
  1. Check WiredTiger cache
  2. If miss: read from data files into cache
  3. If cache full: evict least-recently-used pages (can cause latency spikes!)
```

:::warning[WiredTiger Cache Pressure]
If your working set (hot data) exceeds the WiredTiger cache, you'll see latency spikes as MongoDB evicts pages and reads from disk. Monitor `serverStatus.wiredTiger.cache["pages read into cache"]` — a high rate signals cache thrashing.

Fix: increase `storage.wiredTiger.engineConfig.cacheSizeGB`, upgrade RAM, or archive cold data.
:::

### Replication: Replica Sets

```
       ┌──────────────────────────────────────────┐
       │              Replica Set                  │
       │                                           │
       │  ┌─────────┐   Replication    ┌────────┐  │
       │  │ Primary │ ──────────────► │Secondary│  │
       │  │ (writes)│    oplog         │(reads) │  │
       │  └────┬────┘                 └────────┘  │
       │       │ oplog                            │
       │       ▼                      ┌────────┐  │
       │  ┌─────────┐                 │Arbiter │  │
       │  │Secondary│ ◄─────────────  │(votes) │  │
       │  │         │                 └────────┘  │
       │  └─────────┘                             │
       └──────────────────────────────────────────┘
```

- **oplog** (operations log): a capped collection on the primary recording every write as an idempotent operation
- **Replication lag**: secondaries apply oplog entries asynchronously — lag can be seconds to minutes under heavy load
- **Automatic failover**: if primary is unreachable for `electionTimeoutMillis` (default 10s), secondaries elect a new primary
- **Write concern**: controls how many nodes must acknowledge a write

```java
// Write concern — controls durability guarantee
MongoClientSettings settings = MongoClientSettings.builder()
    .writeConcern(WriteConcern.MAJORITY)   // waits for majority ack before returning
    // vs WriteConcern.W1 — ack from primary only (faster, less safe)
    // vs WriteConcern.UNACKNOWLEDGED — fire-and-forget (dangerous)
    .readPreference(ReadPreference.secondaryPreferred())  // read from secondaries when possible
    .readConcern(ReadConcern.MAJORITY)    // only return data acked by majority
    .build();
```

### Sharding

Sharding splits a collection across multiple `mongod` instances (shards) using a **shard key**:

```
                    mongos (query router)
                    /          |          \
               Shard A      Shard B      Shard C
             [a - h]      [i - p]      [q - z]  ← hashed ranges
```

```java
// Choosing a shard key — critical, cannot be changed without resharding

// ❌ Bad: low cardinality — all docs end up on one shard ("hotspot")
{ shardKey: "status" }   // only 3 values: active/inactive/banned

// ❌ Bad: monotonically increasing — all writes go to the last shard
{ shardKey: "_id" }      // ObjectId is time-ordered

// ✅ Good: high cardinality + even distribution
{ shardKey: "userId" }   // millions of users, writes spread evenly

// ✅ Good for time-series: compound shard key
{ shardKey: { "deviceId": 1, "timestamp": 1 } }
// deviceId spreads writes; timestamp keeps time-range queries on one shard
```

### Transactions (ACID across documents)

MongoDB 4.0+ supports multi-document ACID transactions on replica sets:

```java
@Service
@RequiredArgsConstructor
public class TransferService {

    private final MongoClient client;
    private final MongoTemplate mongo;

    public void transfer(String fromId, String toId, BigDecimal amount) {
        ClientSession session = client.startSession();
        session.startTransaction(TransactionOptions.builder()
            .writeConcern(WriteConcern.MAJORITY)
            .readConcern(ReadConcern.SNAPSHOT)
            .build());
        try {
            Query fromQuery = query(where("id").is(fromId));
            Query toQuery   = query(where("id").is(toId));

            // Both operations inside one ACID transaction
            mongo.updateFirst(fromQuery,
                new Update().inc("balance", amount.negate()), Account.class);
            mongo.updateFirst(toQuery,
                new Update().inc("balance", amount), Account.class);

            session.commitTransaction();
        } catch (Exception e) {
            session.abortTransaction();
            throw e;
        } finally {
            session.close();
        }
    }
}
```

:::warning[Transactions Are Expensive in MongoDB]
Use transactions sparingly. MongoDB is optimized for **single-document operations** (which are always atomic). Multi-document transactions:
- Add latency (distributed locking)
- Abort if they run longer than 60 seconds
- Hurt throughput at scale

**Prefer** embedding related data so one write covers everything atomically.
:::

### Change Streams — React to Data Changes

```java
// Listen to all inserts/updates in the orders collection
@Component
@RequiredArgsConstructor
public class OrderChangeListener implements CommandLineRunner {

    private final MongoClient client;

    @Override
    public void run(String... args) {
        MongoCollection<Document> orders =
            client.getDatabase("shop").getCollection("orders");

        List<Bson> pipeline = List.of(
            Aggregates.match(
                Filters.in("operationType", List.of("insert", "update"))
            )
        );

        // Non-blocking: use reactive MongoDB driver in production
        orders.watch(pipeline).forEach(event -> {
            String type   = event.getOperationType().getValue();
            Document full = event.getFullDocument();
            log.info("Order {} was {}", full.get("_id"), type);
            // Trigger downstream: notify warehouse, update analytics, etc.
        });
    }
}
```

---

## ⚡ Advanced Patterns

### Outbox Pattern (MongoDB + Kafka)

Guarantee that a DB write and a message publication are atomic — even if Kafka is down.

:::info[Deep Dive: Outbox Pattern]
The standard way to avoid the dual-write problem is the **Transactional Outbox Pattern**. 
For a complete guide with code examples, polling vs CDC (Debezium) trade-offs, and failure mitigation, see the dedicated **[Transactional Outbox Pattern Guide](../system-design/outbox-pattern.md)**.
:::

### Materialized View with Aggregation Pipeline on a Schedule

```java
// Pre-compute expensive analytics into a summary collection
// Run nightly via @Scheduled or a cron job

public void refreshDailySalesSummary() {
    Aggregation agg = newAggregation(
        match(where("status").is("completed")
                             .and("createdAt").gte(startOfDay())),
        group("category")
            .sum("total").as("revenue")
            .count().as("orderCount")
            .avg("total").as("avgOrderValue"),
        project("revenue", "orderCount", "avgOrderValue")
            .and("_id").as("category")
            .and(DateOperators.dateOf("$$NOW")).as("computedAt")
    );

    List<DailySummary> results = mongo
        .aggregate(agg, "orders", DailySummary.class)
        .getMappedResults();

    // Replace entire summary collection atomically
    mongo.dropCollection("daily_sales_summary");
    mongo.insertAll(results);
}
```

### Bucket Pattern (for Time-Series in MongoDB)

Instead of one document per event (millions of tiny docs), group events into buckets:

```json
// ❌ One document per sensor reading — poor performance
{ "sensorId": "s1", "timestamp": "2024-11-01T00:00:01Z", "value": 22.3 }
{ "sensorId": "s1", "timestamp": "2024-11-01T00:00:02Z", "value": 22.4 }
// ... 86,400 docs/day/sensor

// ✅ Bucket: one document per sensor per hour
{
  "sensorId": "s1",
  "hour": "2024-11-01T00:00:00Z",
  "count": 3600,
  "min": 21.8, "max": 23.1, "sum": 80640.0,
  "readings": [22.3, 22.4, 22.4, 22.5, ...]   // array of 3600 values
}
```

Benefits: 3600× fewer documents, index is 3600× smaller, range queries scan far fewer docs.

---

## ⚠️ Failure Modes and Operational Concerns

### MongoDB

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Working set > RAM** | Disk reads spike, p99 latency balloons | Add RAM or archive cold data |
| **Index not used** | `COLLSCAN` in `explain()` output | Add index or rewrite query |
| **Unbounded array** | Document approaching 16MB limit | Split into separate collection |
| **Replication lag** | Secondaries fall behind | Reduce write load, add secondaries, investigate slow oplog appliers |
| **Chunk imbalance** | One shard handles 80% of traffic | Choose a better shard key, manual chunk migration |
| **Too many collections** | Slow startup, RAM pressure | Consolidate; each collection has a min WiredTiger overhead |

### Redis

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Cache stampede** | DB overwhelmed after cache expiry | Use probabilistic early expiration or mutex lock |
| **Memory eviction** | Keys silently deleted | Set `maxmemory-policy` intentionally, monitor `evicted_keys` |
| **Hot key** | One key receives all traffic | Use key sharding (`key:shard:{0..N}`) |
| **Blocking commands** | `KEYS *` or `SORT` blocks entire Redis | Use `SCAN` instead of `KEYS`; never `SORT` large sets in prod |

### Cassandra

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Hot partition** | One node at 100% CPU | Better partition key distribution |
| **Tombstone accumulation** | Read latency grows over time | Tune `gc_grace_seconds`, run compaction |
| **Partition too large** | Reads slow, OOMKiller on nodes | Split partition (e.g., by time bucket) |
| **Allow filtering** | `ALLOW FILTERING` in query | Create a dedicated table for that query pattern |

---

## Choosing the Right Database — Decision Tree

```
Start here: What is the primary access pattern?
│
├─ Cache a result / session / leaderboard?
│   └─ Redis
│
├─ Full-text search / log analysis?
│   └─ Elasticsearch / OpenSearch
│
├─ Graph traversal (friends-of-friends, fraud rings)?
│   └─ Neo4j / Amazon Neptune
│
├─ Time-series (IoT, metrics, monitoring)?
│   └─ InfluxDB / TimescaleDB / Cassandra
│
├─ Massive append-only writes + known query patterns?
│   └─ Cassandra
│
├─ Complex relational queries + ACID transactions?
│   └─ PostgreSQL / MySQL
│
├─ Flexible schema + rich document queries + moderate scale?
│   └─ MongoDB
│
├─ AWS serverless + auto-scaling + single-digit ms latency?
│   └─ DynamoDB
│
└─ Multiple concerns in one system?
    └─ Probably MongoDB + Redis (cache layer) is 80% of use cases
```

---

## 🎯 Interview Questions

### For New Learners

**Q: What is NoSQL and why does it exist?**
> NoSQL databases emerged to solve problems that relational databases struggle with at scale: rigid schemas that are costly to change, the inability to scale horizontally across many servers, and poor fit for data shapes like documents, graphs, or time-series. NoSQL trades some ACID guarantees (like strict consistency) for flexibility, scalability, and specialized performance characteristics.

**Q: What is the difference between a key-value store and a document store?**
> A key-value store treats values as opaque bytes — you can only get/set by key, not query inside the value. A document store (like MongoDB) understands the structure of values (JSON) and lets you query, index, and update individual fields within documents.

**Q: What is eventual consistency?**
> In an eventually consistent system, when you write to one node, other nodes may briefly return the old value until replication completes. The guarantee is that all nodes *will eventually* agree, but there's a window where reads may be stale.

### For Senior Engineers

**Q: How do you decide between embedding and referencing in MongoDB?**
> Embed when data is always read together, the relationship is 1-to-few, and the child has no independent lifecycle. Reference when the list is unbounded, the child is updated frequently on its own, or many parents share the same child. A key signal: if embedding would cause a document to grow indefinitely (comments, events, logs), use referencing.

**Q: A MongoDB query that was fast last month is now slow. Walk me through your diagnosis.**
> First, run `explain("executionStats")` and look at: `stage` (COLLSCAN = no index used), `totalDocsExamined` vs `totalDocsReturned` (large ratio = poor selectivity), and `executionTimeMillis`. Check if an index exists with `getIndexes()`. If the index exists but isn't used, check field order in compound indexes (ESR rule: equality → sort → range). Check for collection scan due to type mismatch (string vs int in query). Finally, check if the WiredTiger cache is under pressure — use `db.serverStatus().wiredTiger.cache`.

**Q: How does Cassandra achieve high write throughput?**
> Cassandra writes are append-only to an in-memory structure (MemTable) plus a commit log (WAL). No random disk seeks. When MemTable is full, it's flushed as an immutable SSTable to disk. Reads must merge across SSTables (plus Bloom filters to skip irrelevant files). This trade-off makes writes fast at the cost of more complex reads and compaction overhead.

**Q: When would you use MongoDB transactions, and what are the trade-offs?**
> Use multi-document transactions when atomicity across multiple documents/collections is a hard business requirement (e.g., transferring funds between accounts). The trade-offs: transactions acquire locks, increasing latency and reducing throughput; they abort after 60 seconds; and they add complexity. The preferred approach is to design documents so a single write covers all related data atomically (embedding), reserving transactions for cases where that's truly not possible.



---

## Summary Cheat Sheet

| Database | Model | Consistency | Horizontal Scale | Java/Spring Integration |
|----------|-------|-------------|-----------------|------------------------|
| MongoDB | Document | Tunable (majority/local) | ✅ Sharding | `spring-boot-starter-data-mongodb` |
| Redis | Key-Value + Structures | Single-node: strong; Cluster: eventual | ✅ Cluster/Sentinel | `spring-boot-starter-data-redis` |
| Cassandra | Wide-Column | Tunable (ONE/QUORUM/ALL) | ✅ Linear | `spring-boot-starter-data-cassandra` |
| Neo4j | Graph | Strong (single instance) | Limited | `spring-boot-starter-data-neo4j` |
| DynamoDB | KV + Document | Eventual / Strong (cost) | ✅ Serverless | AWS SDK v2 + `aws-sdk-java-v2` |

## Further Reading

- [Replication & Partitioning](./replication-partitioning.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [Time-Series Databases](./time-series-databases.md)
- [MongoDB official docs: Data Modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [Cassandra: The Definitive Guide (O'Reilly)](https://www.oreilly.com/library/view/cassandra-the-definitive/9781492097136/)