---
id: mongodb-deep-dive
title: NoSQL & MongoDB — Complete Guide
description: What MongoDB is, why to use it, core concepts, data modelling, CRUD, aggregation, indexes, advanced architecture, and schema patterns. Covers beginner through senior depth.
tags: [database, nosql, mongodb, document-store, aggregation, indexes, replica-set, sharding, bson, schema-design]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# NoSQL & MongoDB — Complete Guide

## What is MongoDB?

MongoDB is a **document-oriented NoSQL database** — the most popular one in the world. Instead of storing data in rows and columns like MySQL or PostgreSQL, it stores data as flexible **JSON-like documents** grouped into collections.

| Concept | Description |
|---------|-------------|
| **Documents, not rows** | Each record is a rich JSON/BSON document. Fields can be nested, arrays can hold objects — no rigid schema required. |
| **Collections, not tables** | Documents live in collections. Unlike SQL tables, a collection doesn't enforce that every document has the same fields. |
| **Horizontal scale** | Designed to shard across many servers rather than scale up to one bigger one. |
| **Flexible schema** | Add a new field to one document without a migration script. |

### A document looks like this

Forget rows with foreign-key joins. One user document holds everything about that user:

```json
// SQL: 3 tables (users, addresses, order_refs) + JOINs
// MongoDB: one self-contained document
{
  "_id": "ObjectId(\"64abc123...\")",
  "name": "Alice Tran",
  "email": "alice@example.com",
  "createdAt": "ISODate(\"2024-01-15T09:00:00Z\")",
  "address": {
    "city": "Ho Chi Minh City",
    "country": "VN"
  },
  "tags": ["premium", "verified"],
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

:::info[BSON vs JSON]
MongoDB stores documents as **BSON** (Binary JSON) — a superset of JSON with extra types like `ObjectId`, `Date`, `Decimal128`, and `BinData`. The driver converts between BSON and your language's native types automatically.
:::

---

## Why MongoDB?

### Problems it solves

| Problem | How MongoDB helps |
|---------|------------------|
| **Schema rigidity** | In SQL, adding a column to 500M rows requires a lock and hours of migration. In MongoDB you just start writing the new field — old documents simply won't have it. |
| **Impedance mismatch** | ORMs exist because objects don't map cleanly to tables. MongoDB documents *are* objects — nested structures map 1:1, eliminating the mapping layer. |
| **Write throughput at scale** | Horizontal sharding distributes writes across many nodes. A single SQL primary can't match the write throughput of a 10-shard cluster. |
| **Variable data shapes** | Product catalogs where a laptop has 40 fields and a T-shirt has 8 different ones. EAV in SQL is painful; MongoDB handles this naturally. |

### MongoDB vs. relational databases

| Topic | Relational (PostgreSQL) | MongoDB |
|-------|------------------------|---------|
| Data model | Tables, rows, columns | Collections, documents (JSON/BSON) |
| Schema | Fixed — DDL migrations required | Flexible — optional schema validation |
| Joins | Native SQL JOINs | `$lookup` (aggregation) or embedding |
| Transactions | Full ACID since the 1980s | ACID since v4.0 (single & multi-doc) |
| Horizontal scale | Hard; read replicas only (writes to one) | Native sharding across many nodes |
| Query language | SQL (declarative, universal) | MQL — MongoDB Query Language (JSON-based) |
| Best for | Complex queries, strict integrity, BI | Documents, scale-out, evolving schemas |

:::warning[When NOT to use MongoDB]
Financial ledgers, stock inventory, reservation systems — anywhere **strict ACID consistency across many related records** is the primary concern, a mature relational database is usually the better choice. MongoDB added multi-document transactions, but they carry a real performance cost.
:::

### Decision guide

```
Is data hierarchical / document-shaped?
  → MongoDB ✅

Do you need complex multi-table JOINs + referential integrity?
  → PostgreSQL

Is it high-volume time-series (IoT, monitoring)?
  → MongoDB time-series collections (v5+) or InfluxDB/TimescaleDB

Need full-text search as the primary feature?
  → Elasticsearch (or Atlas Search on top of MongoDB)

Need sub-millisecond caching?
  → Redis (MongoDB is a disk database)
```

---

## Core Concepts

### The hierarchy

| MongoDB | SQL equivalent | Description |
|---------|---------------|-------------|
| **Database** | Database | A namespace containing collections. One server can host many databases. |
| **Collection** | Table | A group of documents. No enforced schema by default. |
| **Document** | Row | A BSON record — a set of key-value pairs, can be nested. |
| **Field** | Column | A key-value pair inside a document. Value can be any BSON type. |
| **_id** | Primary key | Every document must have a unique `_id`. Auto-generated as `ObjectId` if omitted. |
| **Index** | Index | B-tree or special index on one or more fields to speed up queries. |

### ObjectId — the default primary key

MongoDB auto-generates a 12-byte `ObjectId` for every document's `_id`. It encodes timestamp + machine + random counter — globally unique, roughly time-sortable, no central counter needed:

```
ObjectId("64abc1230000000000000001")
//  ^^^^^^^^  ^^^^^^  ^^^^  ^^^^^^^^
//  4 bytes   3 bytes  2 b   3 bytes
//  Unix TS   machine  PID   counter
```

:::tip[ObjectId includes a timestamp]
You can extract the creation time of any document for free: `document._id.getTimestamp()` — no separate `createdAt` field needed.
:::

### BSON data types

| Type | BSON type string | Example use |
|------|-----------------|-------------|
| String | `string` | Names, descriptions |
| Integer (32/64-bit) | `int` / `long` | Counts, IDs |
| Double | `double` | Coordinates, ratings |
| **Decimal128** | `decimal` | **Money — use this, not double!** |
| Boolean | `bool` | Flags |
| Date | `date` | Timestamps — always UTC |
| ObjectId | `objectId` | Document IDs, references |
| Array | `array` | Tags, order items, addresses |
| Object (embedded doc) | `object` | Nested documents |
| Null | `null` | Optional absent field |
| Binary data | `binData` | File bytes, UUIDs |

### Schema validation (optional but recommended)

MongoDB can enforce a JSON Schema on a collection. This gives you flexible schema where needed, strict rules where important:

```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name:  { bsonType: "string", minLength: 1 },
        email: { bsonType: "string", pattern: "^.+@.+$" },
        age:   { bsonType: "int", minimum: 0, maximum: 150 }
      }
    }
  },
  validationAction: "error"  // or "warn" to log without rejecting
})
```

---

## Data Modelling

The most important MongoDB skill. The central question: should related data be **embedded** in the same document, or **referenced** across documents?

### Embedding (denormalization)

Store related data *inside* the parent document. One read fetches everything — no JOINs:

```json
{
  "_id": "ObjectId(\"...\")",
  "userId": "alice",
  "items": [
    { "sku": "LAPTOP-X1", "qty": 1, "price": 1299.00 },
    { "sku": "HDMI-CBL",  "qty": 2, "price":   14.99 }
  ],
  "shippingAddress": { "city": "HCMC", "zip": "70000" }
}
```

### Referencing (normalization)

Store a foreign key (usually an `ObjectId`) and look up the related document separately — more like SQL:

```js
// Order document
{ "_id": ObjectId("order1"), "userId": ObjectId("user1"), "total": 129.99 }

// User document (separate collection)
{ "_id": ObjectId("user1"), "name": "Alice", "email": "alice@..." }

// Query with $lookup (like a LEFT JOIN)
db.orders.aggregate([
  { $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
  }}
])
```

### The embed vs. reference decision

| Use **embed** when… | Use **reference** when… |
|--------------------|------------------------|
| Data is always read together | Data is accessed independently |
| Relationship is 1-to-few (≤ ~100 sub-items) | Relationship is 1-to-many (thousands+) |
| Sub-item has no lifecycle without the parent | Sub-item exists independently (e.g. a Product) |
| Sub-items rarely change individually | Sub-items are updated frequently |
| Document size stays under 16 MB | Embedding would exceed the 16 MB document limit |

:::warning[The 16 MB document limit]
MongoDB documents cannot exceed 16 MB. An order with 2 line items — fine to embed. A social post with unbounded comments — **never embed comments**. Use a separate `comments` collection referenced by `postId`.
:::

### Real-world examples

<Tabs>
  <TabItem value="embed" label="✅ Embed">

**Blog post + metadata** — tags and SEO are always read with the post, no independent lifecycle:
```json
{ "title": "...", "author": "...", "tags": [], "seo": { "slug": "...", "metaDesc": "..." } }
```

**Order + line items** — items are bounded (≤ 100) and always shown with the order:
```json
{ "userId": "...", "items": [{ "sku": "X1", "qty": 1, "price": 1299 }], "shippingAddress": {} }
```

  </TabItem>
  <TabItem value="reference" label="🔗 Reference">

**Blog post + comments** — comments are unbounded, referenced by `postId`:
```js
// comments collection
{ "postId": ObjectId("..."), "text": "Great post!", "author": "Bob" }
```

**Order line item → product** — products exist independently and change on their own:
```js
// item inside order references product
{ "productId": ObjectId("..."), "qty": 2, "unitPrice": 24.99 }
```

  </TabItem>
</Tabs>

---

<details>
<summary>🔬 Senior deep-dive: advanced schema patterns</summary>

### Bucket pattern

For time-series data, instead of one document per event (millions of tiny documents), **bucket** events into time windows. This dramatically reduces index size and improves scan performance:

```js
// Anti-pattern: one doc per sensor reading (millions of docs)
{ sensorId: "s1", ts: ISODate("..."), value: 22.5 }

// Bucket pattern: one doc per sensor per hour (thousands of docs)
{
  sensorId: "s1",
  hour: ISODate("2024-01-15T09:00:00Z"),
  count: 60,
  sum: 1350.0,
  readings: [
    { ts: ISODate("09:00:01"), v: 22.5 },
    { ts: ISODate("09:01:02"), v: 22.6 }
    // ... 58 more
  ]
}
```

### Extended reference pattern

Reference the foreign document's `_id`, but also duplicate the **most frequently read fields** into the referencing document. This trades some write complexity for zero-join reads on the hot path:

```js
// Order line item — productId is the reference,
// but name + imageUrl are duplicated to avoid $lookup on every order display
{
  productId: ObjectId("..."),
  name: "USB-C Charger 65W",       // duplicated field
  imageUrl: "/images/charger.jpg", // duplicated field
  qty: 2,
  unitPrice: 24.99
}
```

:::tip[Trade-off]
If `name` changes in the products collection, order history shows the old name — which is often *correct* for an order (you want the name at time of purchase). Choose deliberately.
:::

### Computed pattern

Pre-compute expensive aggregations and store the result directly on the document. Read the cached value instead of recomputing on every request:

```json
{ "productId": "P1", "totalReviews": 1847, "avgRating": 4.3, "lastComputed": "..." }
```
Recomputed via a background job or `$merge` pipeline periodically.

### Subset pattern

Store only the N most recently-accessed array items in the parent document; keep the full list in a separate collection. Keeps the working set small and hot in memory:

```js
// Product — only 5 most recent reviews embedded
{ "_id": "P1", "name": "...", "recentReviews": [/* last 5 */] }

// Full reviews in separate collection
{ "productId": "P1", "text": "...", "rating": 5, "createdAt": "..." }
```

### Outlier pattern

Most documents are "normal" (a book with 5 reviews). A few are outliers (a bestseller with 50,000). Use an overflow flag + overflow collection instead of bloating the main document:

```js
// Normal book: all reviews embedded
{ "_id": "B1", "reviews": [/* ≤ 200 */], "hasOverflow": false }

// Bestseller: truncated + overflow flag
{ "_id": "B2", "reviews": [/* first 200 */], "hasOverflow": true }

// Overflow docs
{ "bookId": "B2", "reviews": [/* next 200 */], "page": 2 }
```

</details>

---

## CRUD Operations

MongoDB Query Language (MQL) uses JSON objects for both filters and update specifications.

### Create

```js
// Insert one
db.users.insertOne({
  name: "Alice", email: "alice@example.com", age: 28
})
// → { acknowledged: true, insertedId: ObjectId("...") }

// Insert many (bulk)
db.users.insertMany([
  { name: "Bob",   age: 32 },
  { name: "Carol", age: 25 }
], { ordered: false })  // ordered:false = continue on partial failure
```

### Read

```js
// Find all documents
db.users.find({})

// Filter: age > 25 AND name starts with "A"
db.users.find({
  age:  { $gt: 25 },
  name: { $regex: /^A/i }
})

// Projection: return only name + email, exclude _id
db.users.find({ age: { $gte: 18 } }, { name: 1, email: 1, _id: 0 })

// Sort, skip, limit — pagination
db.users.find({})
  .sort({ createdAt: -1 })   // -1 = descending
  .skip(20)
  .limit(10)

// Query on embedded field (dot notation)
db.users.find({ "address.city": "HCMC" })

// Query on array: documents where tags contains "premium"
db.users.find({ tags: "premium" })
```

### Query operators cheat-sheet

| Operator | Meaning | Example |
|----------|---------|---------|
| `$eq` | Equals | `{ age: { $eq: 25 } }` |
| `$ne` | Not equals | `{ status: { $ne: "banned" } }` |
| `$gt` / `$gte` | Greater than / or equal | `{ price: { $gte: 100 } }` |
| `$lt` / `$lte` | Less than / or equal | `{ stock: { $lt: 5 } }` |
| `$in` | Value in array | `{ status: { $in: ["active", "trial"] } }` |
| `$nin` | Value not in array | `{ role: { $nin: ["admin"] } }` |
| `$and` | Logical AND | `{ $and: [{ age: { $gt: 18 } }, { verified: true }] }` |
| `$or` | Logical OR | `{ $or: [{ city: "HCM" }, { city: "HN" }] }` |
| `$exists` | Field exists | `{ phone: { $exists: true } }` |
| `$regex` | Regular expression | `{ email: { $regex: /@gmail/ } }` |
| `$elemMatch` | Array element matches all conditions | `{ items: { $elemMatch: { qty: { $gt: 1 }, sku: "X" } } }` |

### Update

```js
// Update one document
db.users.updateOne(
  { email: "alice@example.com" },           // filter
  { $set: { name: "Alice Tran" },           // update operator
    $currentDate: { updatedAt: true } }
)

// Increment a counter atomically
db.products.updateOne(
  { _id: ObjectId("...") },
  { $inc: { stock: -1 } }   // atomic — safe under concurrency
)

// Push to an array
db.users.updateOne(
  { _id: ObjectId("...") },
  { $push: { tags: "verified" } }
)

// Upsert: insert if not found
db.users.updateOne(
  { email: "new@example.com" },
  { $set: { name: "New User" } },
  { upsert: true }
)
```

### Update operators cheat-sheet

| Operator | Effect |
|----------|--------|
| `$set` | Set field value (creates if missing) |
| `$unset` | Remove a field from the document |
| `$inc` | Increment/decrement a number atomically |
| `$mul` | Multiply a field's value |
| `$rename` | Rename a field |
| `$push` | Append to an array |
| `$addToSet` | Append to array only if not already present |
| `$pull` | Remove matching elements from array |
| `$pop` | Remove first or last element of array |
| `$currentDate` | Set field to current date/timestamp |

### Delete

```js
// Delete one matching document
db.users.deleteOne({ email: "spam@example.com" })

// Delete all matching documents
db.sessions.deleteMany({ expiresAt: { $lt: new Date() } })

// findOneAndDelete: atomically retrieve + delete (useful for job queues)
const job = await db.jobs.findOneAndDelete(
  { status: "pending" },
  { sort: { createdAt: 1 } }
)
```

---

## Aggregation Pipeline

The aggregation pipeline transforms a collection through a series of stages — like Unix pipes for data. Each stage takes input documents and emits output to the next.

```
Collection → [$match] → [$group] → [$sort] → [$limit] → Result
```

### Example: revenue by category

```js
db.orders.aggregate([
  // Stage 1: only completed orders from 2024
  { $match: {
      status: "completed",
      createdAt: { $gte: ISODate("2024-01-01") }
  }},

  // Stage 2: unwind items array — one doc per line item
  { $unwind: "$items" },

  // Stage 3: join with products collection to get category
  { $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "product"
  }},

  // Stage 4: group by category, sum revenue
  { $group: {
      _id: "$product.category",
      totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
      orderCount:   { $sum: 1 }
  }},

  // Stage 5: sort highest revenue first
  { $sort: { totalRevenue: -1 }},

  // Stage 6: rename _id to category
  { $project: { category: "$_id", totalRevenue: 1, orderCount: 1, _id: 0 }}
])
```

### Key stages reference

| Stage | SQL equivalent | Use |
|-------|---------------|-----|
| `$match` | `WHERE` | Filter early — must come before expensive stages |
| `$project` | `SELECT cols` | Include/exclude/rename/compute fields |
| `$group` | `GROUP BY` | Aggregate with `$sum`, `$avg`, `$min`, `$max`, `$push`, `$addToSet` |
| `$sort` | `ORDER BY` | Sort (use index when possible — put right after `$match`) |
| `$limit` | `LIMIT` | Take first N documents |
| `$skip` | `OFFSET` | Skip N documents (avoid large skips) |
| `$unwind` | Explode JOIN | Deconstruct array — one doc per element |
| `$lookup` | `LEFT JOIN` | Join with another collection |
| `$addFields` | Computed column | Add computed fields without removing others |
| `$facet` | Multiple GROUP BY | Run multiple sub-pipelines in parallel on same input |
| `$bucket` | Histogram | Group by numeric range (price brackets, age ranges) |
| `$out` / `$merge` | `INSERT INTO` / UPSERT | Write pipeline results to a collection |

:::tip[Performance rule: `$match` and `$sort` early]
Place `$match` as the **first stage** so MongoDB can use an index and skip irrelevant documents. A `$match` after `$group` forces full-collection processing. A `$sort` immediately after `$match` can leverage a compound index covering the same fields.
:::

<details>
<summary>🔬 Senior deep-dive: `$facet` for multi-dimensional analytics</summary>

`$facet` runs multiple sub-pipelines in parallel on the *same* input — perfect for search pages that return results, category counts, and a total simultaneously:

```js
db.products.aggregate([
  { $match: { inStock: true } },
  { $facet: {
      // sub-pipeline 1: paginated results
      "results": [
        { $sort: { price: 1 } },
        { $skip: 0 }, { $limit: 20 }
      ],
      // sub-pipeline 2: category counts for faceted filters UI
      "categoryFacets": [
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ],
      // sub-pipeline 3: total count for pagination
      "total": [{ $count: "n" }]
  }}
])
```

</details>

---

## Indexes

Indexes are the single biggest lever for MongoDB performance. Without the right index, queries do a **full collection scan** — reading every document. With one, reads become **O(log n)**.

### Index types

<Tabs>
  <TabItem value="single" label="Single field">

```js
db.users.createIndex({ age: 1 })
// 1 = ascending, -1 = descending
```
Basic. Works for equality, range, and sort queries on that field.

  </TabItem>
  <TabItem value="compound" label="Compound">

```js
db.orders.createIndex({ userId: 1, createdAt: -1 })
```
Serves queries on `userId` alone **or** `userId + createdAt` together. Field order matters — see ESR rule below.

  </TabItem>
  <TabItem value="multikey" label="Multikey (array)">

```js
db.users.createIndex({ tags: 1 })
// auto-multikey when field is an array
```
Indexes each element of the array. Enables fast `{ tags: "premium" }` queries.

  </TabItem>
  <TabItem value="text" label="Text">

```js
db.articles.createIndex({ title: "text", body: "text" })
```
Tokenizes and stems words. Enables `{ $text: { $search: "mongodb sharding" } }` queries.

  </TabItem>
  <TabItem value="geo" label="Geospatial">

```js
db.shops.createIndex({ location: "2dsphere" })
```
Enables `$near`, `$geoWithin` queries for location-based searches.

  </TabItem>
  <TabItem value="unique" label="Unique">

```js
db.users.createIndex({ email: 1 }, { unique: true })
```
Enforces uniqueness. Inserting a duplicate throws `E11000 duplicate key error`.

  </TabItem>
</Tabs>

### The ESR rule for compound indexes

When designing a compound index, field order matters. Follow **Equality → Sort → Range**:

| Position | Type | Example field | Why |
|----------|------|--------------|-----|
| 1st | **Equality** | `userId` | Eliminates most documents immediately |
| 2nd | **Sort** | `createdAt` (used in `.sort()`) | Pre-sorts — avoids in-memory sort stage |
| 3rd | **Range** | `status` (used in `$in`) | Applied last after equality/sort narrow the set |

```js
// Query: orders for user X, sorted newest-first, only "shipped" or "delivered"
db.orders.find({ userId: "alice", status: { $in: ["shipped", "delivered"] } })
  .sort({ createdAt: -1 })

// Correct ESR compound index:
db.orders.createIndex({ userId: 1, createdAt: -1, status: 1 })
```

### Diagnosing with `explain()`

```js
db.orders.find({ userId: "alice" }).explain("executionStats")

// Key fields:
// winningPlan.stage:                   "IXSCAN" ✅   vs   "COLLSCAN" 🔴
// executionStats.nReturned             → documents returned
// executionStats.totalDocsExamined     → documents scanned
// → good ratio: nReturned ≈ totalDocsExamined
// executionStats.executionTimeMillis   → wall time
```

:::warning[Index overhead on writes]
Every index costs write overhead — MongoDB must update every index on every insert, update, and delete. Don't create indexes speculatively. Measure first with `explain()`, then add the minimum indexes needed.
:::

<details>
<summary>🔬 Senior deep-dive: partial indexes and covered queries</summary>

### Partial indexes

Index only documents matching a filter. Dramatically reduces index size when most queries target a subset:

```js
// Only index orders that are NOT yet delivered.
// "Active order" queries are 95% of traffic; delivered orders rarely queried.
db.orders.createIndex(
  { userId: 1, createdAt: -1 },
  { partialFilterExpression: { status: { $ne: "delivered" } } }
)

// Sparse unique index: unique email, but null/missing is allowed
db.users.createIndex({ email: 1 }, { unique: true, sparse: true })
```

### Covered queries

A query is "covered" when all requested fields are **in the index** — MongoDB never touches the actual documents. Fastest possible read: O(log n) with zero document I/O.

```js
// Index: { userId: 1, status: 1, total: 1 }
// Query + projection only uses indexed fields → fully covered
db.orders.find(
  { userId: "alice", status: "shipped" },
  { total: 1, _id: 0 }     // must exclude _id to be covered!
)
// explain() → winningPlan.stage: "PROJECTION_COVERED"
```

</details>

---

## Use Cases

### Where MongoDB excels

| Use case | Why MongoDB fits |
|----------|-----------------|
| **E-commerce product catalog** | Products in different categories have completely different attributes. A laptop has RAM and CPU; a T-shirt has size and colour. Flexible schema handles this naturally — no EAV tables needed. |
| **User profiles and preferences** | User data is a natural document — profile info, settings, social links. Most reads fetch the whole profile at once, making embedding ideal. |
| **Real-time event logging** | Clickstream, activity feeds, analytics events — high write throughput with flexible schemas. Time-series collections (v5.0+) improve storage and query efficiency further. |
| **Geospatial applications** | Native `2dsphere` indexes enable "find restaurants within 2 km" with one query. GeoJSON support is first-class. |
| **CMS / content management** | Articles, recipes, landing pages all have variable structure. No schema migration when editors add a new content type. |
| **Gaming: player state & leaderboards** | Player inventory, progress, and achievements are natural documents. Flexible schema means adding a new game feature doesn't require migrating 10M player records. |

### Geospatial example

```js
db.restaurants.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [106.66, 10.78] },
      $maxDistance: 2000  // metres
    }
  }
})
```

### Where to think twice

| Scenario | Better choice | Why |
|----------|--------------|-----|
| Financial ledger, double-entry accounting | PostgreSQL | Complex transactions, strict integrity, audit trails |
| Complex reporting with ad-hoc JOINs | PostgreSQL / data warehouse | SQL is vastly better for multi-table analytics |
| Very high-volume IoT / monitoring | InfluxDB / TimescaleDB | Dedicated time-series engines outperform general-purpose on compression and query speed |
| Full-text search as primary feature | Elasticsearch | Better relevance scoring, richer text analysis |
| Sub-millisecond caching | Redis | In-memory; MongoDB is a disk database |

---

## Advanced Topics (Senior)

### Replica sets

A replica set is a group of MongoDB instances that maintain the same dataset. Typical production setup: **1 primary + 2 secondaries**. All writes go to the primary; secondaries replicate asynchronously via the **oplog**.

```java
// Java driver: read from secondary for analytics queries
MongoCollection<Document> col = db.getCollection("orders")
    .withReadPreference(ReadPreference.secondary())
    .withReadConcern(ReadConcern.MAJORITY);
```

**Read preference options:**

| Option | Behaviour |
|--------|----------|
| `primary` (default) | All reads to primary — consistent, no replication lag |
| `primaryPreferred` | Read from primary when available, fallback to secondary |
| `secondary` | Always read from a secondary — may be slightly stale |
| `secondaryPreferred` | Read from secondary when available, fallback to primary |
| `nearest` | Read from the node with lowest network latency |

### Sharding

Sharding partitions data across multiple replica sets ("shards"). A **mongos** router directs queries to the correct shard(s) based on the **shard key**.

| Shard key strategy | Pros | Cons / gotchas |
|-------------------|------|---------------|
| Hashed (e.g. `_id` hashed) | Even distribution, no hotspots | Range queries scatter across all shards |
| Ranged (e.g. `createdAt`) | Range queries hit one shard | Monotonic keys (time, ObjectId) cause write hotspots |
| Compound (e.g. `userId + date`) | Locality per user, efficient range queries | Complex to choose; requires high cardinality |

:::danger[The shard key is permanent]
The shard key is a **permanent architectural decision**. MongoDB 5.0+ allows limited updates, but practically speaking a poor shard key — causing hotspots or scatter-gather on every read — requires a full reshard. Design carefully before sharding.
:::

### Write concern and read concern

| Setting | Value | Meaning |
|---------|-------|---------|
| `writeConcern: w` | `"majority"` | Write acknowledged by a majority of nodes — durable, survives primary failure |
| `writeConcern: w` | `1` | Acknowledged by primary only — faster, but risks data loss on primary crash |
| `writeConcern: w` | `0` | Fire-and-forget — no acknowledgement |
| `readConcern` | `"local"` | Read what's on this node (default) — may be rolled back |
| `readConcern` | `"majority"` | Read data that a majority has acknowledged — safe |
| `readConcern` | `"linearizable"` | Strongest — reflects all writes before this read. Slowest. |

### Multi-document ACID transactions

Since v4.0, MongoDB supports multi-document ACID transactions. Use them when you must atomically update **multiple documents across collections**:

```js
const session = client.startSession();
try {
  session.startTransaction({
    readConcern:  { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  // Both ops succeed or both roll back
  await db.collection("accounts").updateOne(
    { _id: "alice" }, { $inc: { balance: -100 } }, { session }
  );
  await db.collection("accounts").updateOne(
    { _id: "bob" }, { $inc: { balance: 100 } }, { session }
  );

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
} finally {
  session.endSession();
}
```

:::warning[Transactions are expensive in MongoDB]
MongoDB transactions add significant latency and acquire collection-level locks with a 60-second timeout by default. Use them **sparingly** — only when atomicity across multiple documents is truly required. If you're reaching for transactions everywhere, your data model is likely wrong. Consider embedding the related data instead.
:::

### Change streams

Change streams let applications subscribe to real-time data change notifications — like CDC (Change Data Capture) — built on top of the oplog and fully resumable:

```js
const changeStream = db.collection("orders").watch([
  { $match: { "fullDocument.status": "payment_received" } }
], { fullDocument: "updateLookup" });

changeStream.on("change", (event) => {
  // Trigger fulfillment workflow
  fulfillmentService.process(event.fullDocument);
});
```

**Common use cases:** event sourcing, real-time dashboards, cache invalidation, CDC pipelines to a data warehouse.

---

## Advanced Schema Patterns (Senior)

### Named patterns reference

| Pattern | Core idea | Best for |
|---------|-----------|---------|
| **Polymorphic** | Store different entity shapes in one collection with a `type` discriminator | Product catalogs, assets with common query paths |
| **Computed** | Pre-compute and cache expensive aggregations on the document | Read-heavy aggregates (avg rating, total reviews) |
| **Subset** | Embed only the N most recent/relevant sub-items; full list in a separate collection | Posts with many comments, products with many reviews |
| **Outlier** | Use an overflow flag + overflow collection for documents that would exceed normal bounds | Social posts by celebrities, viral content |
| **Extended reference** | Reference by `_id` but duplicate frequently-read fields to avoid `$lookup` on hot reads | Order line items (duplicate product name, image URL) |
| **Bucket** | Group time-series events into time-window documents | IoT sensor data, clickstream, metrics |

### Tree structures

| Pattern | Best for |
|---------|---------|
| Parent reference | Simple parent lookup; listing children |
| Children references | Direct children fast; deep traversal slow |
| Array of ancestors | Fast "all ancestors" query — good for breadcrumbs |
| Materialized path | Regex prefix match on path string — simple subtree queries |
| Nested sets | Fast subtree reads; very expensive writes |

---

## Spring Data MongoDB

```java
@Document(collection = "users")
public class User {
    @Id private String id;
    private String name;
    private String email;
    private List<Address> addresses;  // embedded documents
    private LocalDateTime createdAt;
}

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    // Spring derives query from method name
    List<User> findByAddressesCity(String city);

    // Custom MQL query
    @Query("{ 'orders.status': ?0 }")
    List<User> findByOrderStatus(String status);

    // Paginated result
    Page<User> findByAgeGreaterThan(int age, Pageable pageable);
}
```

---

## Interview Questions

**Q1. What is MongoDB and how does it differ from a relational database?**
> MongoDB is a document-oriented NoSQL database that stores data as BSON documents in collections rather than rows in tables. Key differences: schema is flexible (documents in a collection can have different fields), relationships are handled by embedding or referencing rather than JOINs, it scales horizontally via sharding while SQL scales vertically, and hierarchical data maps 1:1 to documents. The trade-off is giving up some relational guarantees for flexibility and scalability.

**Q2. When would you embed data vs. reference it?**
> **Embed** when: data is always read together, the relationship is 1-to-few (bounded count), and the sub-document has no lifecycle outside the parent (e.g. order line items, address inside a user). **Reference** when: the relationship is 1-to-many with unbounded growth (e.g. comments on a post), the sub-document is accessed or updated independently, it's shared by multiple parents, or embedding would exceed 16 MB. The guiding principle: *design for your application's access patterns, not for normalisation*.

**Q3. What is the aggregation pipeline and how does it work?**
> The aggregation pipeline transforms a collection through a series of stages, each taking the output of the previous stage as input — similar to Unix pipes. Common stages: `$match` (filter), `$group` (aggregate), `$sort`, `$lookup` (join), `$unwind` (explode arrays), `$project` (reshape). For performance, always put `$match` first so MongoDB can use an index early.

**Q4. How do indexes work in MongoDB? What is the ESR rule?**
> MongoDB uses B-tree indexes (plus specialised types like 2dsphere and text). An index stores a sorted structure of field values with pointers to documents, enabling O(log n) lookup instead of O(n) collection scan. The ESR rule for compound indexes: **Equality** fields first (narrows the scan set most), then **Sort** fields (allows index-ordered traversal, avoiding in-memory sort), then **Range** fields last (`$gt`, `$in`, `$lt`). Verify with `explain("executionStats")` — look for `IXSCAN`, not `COLLSCAN`.

**Q5. How does MongoDB support ACID transactions? When should you use them?**
> Since v4.0, MongoDB supports multi-document ACID transactions across collections and (since v4.2) across shards. They use snapshot isolation and `writeConcern: "majority"` for durability. However, they add significant overhead — lock contention, longer latency, coordination cost. Best practice: use transactions only when you *must* atomically update multiple documents across collections. For most use cases, a well-designed document model (embedding related data) eliminates the need for transactions entirely — which is both faster and simpler.

**Q6. What is a replica set and how does failover work?**
> A replica set is a group of MongoDB instances (typically 3) that keep identical data. One node is the primary (handles all writes); secondaries replicate via the oplog asynchronously. If the primary becomes unreachable, the remaining nodes hold an election — the node with the most up-to-date oplog and majority votes becomes the new primary. Failover typically takes 10–30 seconds. `writeConcern: "majority"` ensures writes are on a majority of nodes before acknowledging, so they survive primary failure without data loss.

**Q7 (Senior). What is sharding and how do you choose a shard key?**
> Sharding horizontally partitions data across multiple replica sets. A `mongos` router maps each document to a shard based on the shard key. A good shard key must: (1) have **high cardinality** — many distinct values to spread data; (2) avoid **monotonic growth** — time-based keys concentrate all writes on the "last" shard; (3) match your **query patterns** — if most queries filter by `userId`, shard on `userId` to avoid scatter-gather. The shard key is permanent — get it wrong and you face a costly reshard operation.

**Q8 (Senior). What is the oplog and how do change streams use it?**
> The oplog (operations log) is a capped collection in the `local` database that records all write operations as idempotent entries. Secondaries tail the oplog to replicate. Change streams are a user-facing API built on the oplog — they translate raw oplog entries into user-friendly change events with a **resume token**. Change streams are resumable: if your consumer crashes, it restarts from the last processed token. They support pipeline filtering and deliver full document state with `fullDocument: "updateLookup"`. Use cases: event sourcing, real-time dashboards, cache invalidation, CDC pipelines.

---

## See Also

- [Architecture Fundamentals — CAP, Replication & Partitioning](./architecture-fundamentals.md)
- [Microservices Patterns — Database-per-Service](./microservices-patterns.md)
- [Caching Strategies](./caching-strategies.md)
- [Observability](./observability.md)
