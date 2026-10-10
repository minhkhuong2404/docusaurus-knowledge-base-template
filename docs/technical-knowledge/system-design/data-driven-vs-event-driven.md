---
id: data-driven-vs-event-driven
title: "Data-Driven vs Event-Driven Architecture: Deep Dive & Decision Framework"
sidebar_label: Data-Driven vs Event-Driven
description: Comprehensive senior-principal architectural comparison of Data-Driven Architecture (DDA) and Event-Driven Architecture (EDA). Explores state vs stream paradigms, ACID vs eventual consistency, temporal coupling, polling tax, dual-write prevention with Transactional Outbox and CDC, and a battle-tested decision framework for production systems.
tags: [system-design, distributed-systems, event-driven, data-driven, architecture, kafka, cdc, cqrs, outbox-pattern]
---

import DataDrivenVsEventDrivenDiagram from '@site/src/components/DataDrivenVsEventDrivenDiagram';

# Data-Driven vs Event-Driven Architecture: Deep Dive & Decision Framework

In distributed systems engineering, one of the most foundational architectural decisions is choosing how state, compute, and inter-service communication are organized. Historically, systems were constructed around centralized relational databases where data state served as the single integration point—a **Data-Driven Architecture (DDA)**. Modern cloud-native and microservice ecosystems, by contrast, frequently adopt an **Event-Driven Architecture (EDA)**, treating immutable streams of business facts as the primary medium of integration.

However, viewing DDA and EDA as mutually exclusive opposites is an architectural anti-pattern. High-scale production systems almost never exist as purely data-driven or purely event-driven monoliths. Instead, principal engineers treat them as complementary architectural paradigms that solve distinct operational constraints across different boundaries of a distributed system.

---

## Interactive Architecture Explorer

Explore the architectural topology, data flow mechanics, coupling trade-offs, and hybrid integration patterns between Data-Driven and Event-Driven models:

<DataDrivenVsEventDrivenDiagram initialMode="data_driven" />

---

## 1. Core Philosophy & Conceptual Foundations

At its core, the division between Data-Driven Architecture and Event-Driven Architecture represents a fundamental tension between **state-at-rest** and **facts-in-flight**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARCHITECTURAL PARADIGM SPECTRUM                       │
├──────────────────────────────────────┬──────────────────────────────────────┤
│    DATA-DRIVEN ARCHITECTURE (DDA)    │    EVENT-DRIVEN ARCHITECTURE (EDA)   │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Focus: Current state of records    │ • Focus: History & occurrence of     │
│ • Integration: Shared store or APIs  │   immutable domain facts             │
│ • Flow: Request/response or poll     │ • Integration: Distributed commit log│
│ • Consistency: Immediate ACID        │ • Flow: Reactive asynchronous push   │
│ • Coupling: High temporal & schema   │ • Consistency: Eventual (BASE)       │
│ • Compute moves to the data          │ • Coupling: Loose temporal & spatial │
│                                      │ • Data streams past the compute      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### The Data-Driven Paradigm (State-First)
In a Data-Driven Architecture, the **central data store is the center of gravity**. Systems are organized around tables, schemas, relations, and the current snapshot of mutable records:
- **Primary Question:** *"What does the system look like right now?"* (e.g., `SELECT status, balance FROM accounts WHERE user_id = 42;`)
- **Execution Mechanism:** Compute is request-driven or schedule-driven. A client sends a synchronous request (HTTP, gRPC, SQL connection), the application queries or mutates state in the database, and returns a response. Downstream systems poll the database periodically or run batch ETL jobs to extract updates.
- **Data Locality:** Data rests stationary inside storage engines (PostgreSQL, Oracle, MySQL, Snowflake), and compute engines execute queries directly against those storage structures.

### The Event-Driven Paradigm (Fact-First)
In an Event-Driven Architecture, **business facts are first-class citizens**. State is not an overwritable cell in a database table; it is the cumulative result of an append-only stream of immutable domain events:
- **Primary Question:** *"What just happened in the business?"* (e.g., `AccountDebited { account_id: 42, amount: 150.00, timestamp: 1728500000 }`)
- **Execution Mechanism:** Compute is reactive and push-driven. When a domain event occurs, the producer publishes it to an append-only distributed log or message broker (Apache Kafka, RabbitMQ, AWS EventBridge). Autonomous consumer services subscribe to event streams and react asynchronously without the producer knowing or caring who is listening.
- **Data Locality:** Data is in continuous motion through topics and partitions. Compute workers (event handlers, stream processors like Apache Flink or Kafka Streams) observe the moving stream and derive localized state.

---

## 2. Deep Dive: Data-Driven Architecture (DDA)

### Architectural Mechanics & Engine Truth
A classic Data-Driven Architecture organizes services around persistent transactional databases. In a monolithic or service-oriented system, multiple modules or bounded contexts read from and write to a shared relational database (RDBMS), or query each other synchronously via request-response RPCs that directly proxy database queries.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Web/API Client  │       │ Billing Worker  │       │ Analytics ETL   │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │ Synchronous             │ Synchronous             │ Hourly Batch
         │ INSERT/UPDATE           │ SELECT / Lock           │ Polling Query
         ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 CENTRAL RELATIONAL DATABASE (RDBMS)                 │
│  • Storage Engine: InnoDB / PostgreSQL Heap & B+Tree Indexes        │
│  • Concurrency Control: MVCC + Two-Phase Locking (2PL)              │
│  • Consistency Guarantee: Strict ACID Transactions                  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Under-the-Hood Storage & Concurrency
Under the hood, relational data-driven systems rely on **Write-Ahead Logging (WAL)** and **Multi-Version Concurrency Control (MVCC)**:
1. When a write arrives, the database acquires row-level or table-level locks, writes the mutation to an in-memory buffer, and appends a record to the WAL on disk sequentially.
2. Background engine threads flush dirty buffer pool pages back to persistent tablespace B+Tree data pages.
3. Queries acquire read locks or construct point-in-time snapshots using transaction undo logs. Foreign-key constraints and unique indices are checked synchronously before the transaction commits.

### When Data-Driven Excels
1. **Strict Immediate Consistency (ACID):** Financial balance updates, double-entry bookkeeping ledgers, and atomic inventory checkout where temporary inconsistencies or phantom reads are illegal.
2. **Complex Multi-Table Joins & Relational Aggregations:** Ad-hoc reporting, multi-table SQL queries, and complex filtering across dozens of relational entities.
3. **Low Operational Overhead:** No message brokers, cluster rebalance coordinators, schema registries, or dead-letter queues to maintain. A single PostgreSQL cluster with high availability (HA) read replicas satisfies millions of requests per day.
4. **Intuitive Mental Model:** Developers reason easily about linear request-response lifecycles: call API $\rightarrow$ execute query in transaction $\rightarrow$ return HTTP 200 OK.

### Production Gotchas & Failure Modes

#### 1. The Connection Pool Exhaustion Trap
In synchronous data-driven systems, every active HTTP request thread holds a database connection open from a connection pool (e.g., HikariCP). 
- If a downstream table experiences lock contention or an unindexed query triggers a full table scan, database query latency spikes from 2ms to 2,000ms.
- As pending HTTP requests pile up, the connection pool is exhausted within seconds.
- Incoming requests to unrelated endpoints are rejected with `ConnectionTimeoutException` or HTTP 504 Gateway Timeout, causing a catastrophic cascade outage across the entire application.

#### 2. The Polling Tax & CPU Thrashing
When asynchronous downstream processing is shoehorned into a data-driven model, services implement background polling loops:
```sql
-- Worker polling query executed every 500ms by 50 worker pods:
SELECT * FROM background_jobs 
WHERE status = 'QUEUED' 
ORDER BY created_at ASC 
LIMIT 10 
FOR UPDATE SKIP LOCKED;
```
Even when no work is pending, hundreds of polling queries per second hit the database, burning CPU cycles, thrashing memory buffer pools, and maintaining active transaction logs.

#### 3. Schema Lockstep Coupling (The Shared Database Anti-Pattern)
When multiple services share a single database, changing a table schema (e.g., renaming a column or changing a nullability constraint) requires coordinated lockstep deployment across every dependent service. Database migrations become high-risk operational nightmares.

---

## 3. Deep Dive: Event-Driven Architecture (EDA)

### Architectural Mechanics & Broker Topology
An Event-Driven Architecture decouples services across time, space, and deployment lifecycles. Services interact exclusively by emitting domain events to a distributed message log or message broker.

```
┌──────────────────┐               ┌─────────────────────────────────────┐
│  Order Service   │──Publish─────▶│      DISTRIBUTED EVENT BROKER       │
└──────────────────┘ (OrderPlaced) │    (Apache Kafka / Apache Pulsar)   │
                                   │  • Topic: orders.events             │
                                   │  • Log Segments: Append-only on disk│
                                   │  • Partition Consumer Offsets       │
                                   └───────────────┬─────────────────────┘
                                                   │
                  ┌────────────────────────────────┼────────────────────────────────┐
                  │ Stream Subscription            │ Stream Subscription            │ Stream Subscription
                  ▼                                ▼                                ▼
       ┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
       │  Inventory Service  │          │   Payment Service   │          │ Notification Engine │
       └─────────────────────┘          └─────────────────────┘          └─────────────────────┘
```

#### Under-the-Hood Storage & Consumer Loop
Unlike traditional message queues (which delete messages upon acknowledgement), distributed commit logs (such as Apache Kafka or Redpanda) operate on **log-structured storage**:
1. Events are serialized (Avro, Protobuf, or JSON) and written to append-only disk segment files (`.log`).
2. Brokers leverage the Linux OS page cache and the `sendfile()` system call (Scatter-Gather DMA) to stream bytes directly from kernel page cache to network sockets without copying data into user-space memory.
3. Consumers track their own read position via committed offsets. Multiple independent consumer groups can read the exact same event stream at different speeds without degrading broker throughput.

### Event Anatomy: The Three Core Event Styles

Choosing the wrong event shape is one of the most frequent architectural failures in EDA:

| Event Style | Payload Characteristics | Trade-offs & Consequences |
| :--- | :--- | :--- |
| **Event Notification** *(Thin Event)* | Contains only the fact and entity ID:<br/>`{"id": "evt_1", "type": "OrderCreated", "orderId": 101}` | **Pro:** Minimal payload size, schema rarely breaks.<br/>**Con:** Every consumer must call back to the Order Service via HTTP/gRPC to fetch order details, reintroducing synchronous coupling and API stampedes. |
| **Event-Carried State Transfer** *(Fat Event)* | Contains the fact plus complete entity state:<br/>`{"orderId": 101, "customerId": 42, "items": [...], "total": 99.00}` | **Pro:** Consumers act completely autonomously without synchronous callbacks.<br/>**Con:** Heavy payload, potential PII exposure, and schema evolution requires strict backward-compatibility contracts. |
| **Event Sourcing** | The event stream **is** the single source of truth; entity state is reconstructed by replaying all historical events. | **Pro:** Perfect audit trail, historical time-travel debugging.<br/>**Con:** Extreme complexity, requires snapshotting, event schema migration across years of historical data is notoriously difficult. |

### When Event-Driven Excels
1. **High Throughput & Traffic Burst Absorption:** A distributed broker acts as a shock absorber. If 50,000 orders arrive per second during a flash sale, the event broker buffers the stream in memory/disk; downstream payment and shipping workers consume at their own sustainable processing rate without crashing.
2. **Autonomous Cross-Domain Choreography:** In complex distributed domains (e.g., e-commerce, banking), order processing requires coordination across 5+ independent domains. EDA enables event choreography where services react to events without centralized coupling.
3. **Extensibility & Decoupled Evolution:** Adding a new downstream capability (e.g., real-time fraud scoring, recommendation engines, clickstream tracking) requires zero modifications or deployments to the upstream Order Service. The new service simply subscribes to the existing topic.

### Production Hazards & The Complexity Tax

#### 1. The Dual-Write Trap (Silent Data Divergence)
The most common and dangerous bug in naive event-driven implementations is the **Dual-Write Anti-Pattern**:
```java
// CRITICAL BUG: Dual-Write Anti-Pattern
@Transactional
public void createOrder(OrderRequest request) {
    Order order = orderRepository.save(request.toEntity()); // Write 1: Local DB
    kafkaTemplate.send("orders.topic", new OrderCreatedEvent(order)); // Write 2: Kafka
}
```
**Why this breaks in production:**
- **Failure Mode A:** The database transaction commits successfully, but the network connection to Kafka times out. The database holds the order, but downstream services (Inventory, Billing) never receive the event. The order is permanently orphaned.
- **Failure Mode B:** The Kafka send succeeds, but the database transaction fails on commit (e.g., database constraint violation or transient lock timeout). Downstream services receive an event for an order that does not exist in the database!

#### 2. At-Least-Once Delivery & Duplicate Processing
Distributed brokers operate under **at-least-once delivery** semantics across network partitions and consumer rebalances. If a consumer processes an event but crashes before committing its partition offset, the replacement consumer receives the exact same event again.
- **Architectural Requirement:** All consumer event handlers **must be strictly idempotent**. Systems must maintain an idempotent deduplication table using the unique `eventId` or leverage natural business idempotency keys.

#### 3. Out-of-Order Message Delivery
While Kafka guarantees ordering within a single partition, network retries (`retries > 0` with `max.in.flight.requests.per.connection > 1` on older Kafka clients) or partitioned consumer processing can cause events to arrive out of order. A consumer may receive `OrderCancelled` before `OrderCreated`, leading to invalid entity state unless explicitly handled via state machines.

---

## 4. Multi-Dimensional Comparison Matrix

The following matrix synthesizes the comparative principles articulated in SitePoint's architectural analysis, expanded with senior-level distributed systems criteria:

| Evaluation Dimension | 💾 Data-Driven Architecture (DDA) | ⚡ Event-Driven Architecture (EDA) |
| :--- | :--- | :--- |
| **Primary Integration Point** | Central shared database or synchronous CRUD APIs | Distributed append-only log or message broker |
| **Trigger Mechanism** | Request-response (client pull) or scheduled cron/batch | Asynchronous event push (broker notifications) |
| **Temporal Coupling** | **Tight:** Caller blocks until the receiver or database completes execution | **Loose:** Producer returns immediately upon broker acknowledgement |
| **Spatial Coupling** | **Moderate to High:** Callers must know endpoint URIs or table schemas | **Very Low:** Producers publish to topics without knowledge of consumers |
| **Schema Evolution** | Database migrations (`ALTER TABLE`) can block tables or break callers | Schema Registries (Avro/Protobuf) enforce forward/backward compatibility |
| **Consistency Model** | **Strong Immediate Consistency (ACID)** via database engine locks | **Eventual Consistency (BASE)**; state converges over time |
| **Ad-Hoc Query Capabilities** | **Native & Powerful:** Arbitrary SQL joins, filtering, and aggregations | **Difficult:** Requires stream-table joins (`KStream-KTable`) or materialized views |
| **Scalability Bottleneck** | Database write locks, primary node CPU/IOPS, connection pools | Consumer processing lag, partition rebalances, broker storage retention |
| **Failure Blast Radius** | **High:** Database slowness or failure cascades to all dependent services | **Low:** Crashed consumers do not impact producers or peer consumers |
| **Observability & Tracing** | Straightforward: Single call stack trace or simple distributed trace | Complex: Asynchronous trace context propagation across message headers |
| **Replayability & Audit** | Difficult: Overwritten database rows require change-tracking tables | **Native:** Append-only log allows replaying events from any historical offset |
| **Initial Implementation Cost** | **Low to Moderate:** Standard ORM, MVC framework, single database | **High:** Requires broker infrastructure, schema registries, DLQs, idempotency |

---

## 5. The Hybrid Convergence: Unifying Both Paradigms

Senior architects recognize that modern enterprise platforms require both paradigms operating in harmony. A service should be **data-driven internally** (maintaining its own local transactional database with strict ACID guarantees) and **event-driven externally** (publishing domain events to communicate with other bounded contexts).

To bridge these two worlds without falling into the dual-write trap or suffering from polling lag, production systems rely on three battle-tested architectural patterns:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               HYBRID CONVERGENCE TOPOLOGY                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [ Order Service ]                                                                      │
│         │                                                                               │
│         ├─ 1. Single Local ACID Transaction                                             │
│         ▼                                                                               │
│  ┌───────────────────────────────┐                                                      │
│  │ PostgreSQL Local Database     │                                                      │
│  │  • orders table               │                                                      │
│  │  • outbox_events table        │                                                      │
│  │  • Write-Ahead Log (WAL)      │                                                      │
│  └──────────────┬────────────────┘                                                      │
│                 │                                                                       │
│                 │ 2. Asynchronous WAL Tailing (Zero App Overhead)                       │
│                 ▼                                                                       │
│  ┌───────────────────────────────┐                                                      │
│  │ Debezium CDC (Kafka Connect)  │                                                      │
│  └──────────────┬────────────────┘                                                      │
│                 │                                                                       │
│                 │ 3. Streaming Event Publish (Guaranteed At-Least-Once)                 │
│                 ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐                        │
│  │ Apache Kafka Event Broker                                   │                        │
│  └──────┬───────────────────────┬───────────────────────┬──────┘                        │
│         │                       │                       │                               │
│         ▼ 4. CQRS Projection    ▼ 4. Cache Sync         ▼ 4. OLAP Stream                │
│  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐                      │
│  │ Elasticsearch │       │  Redis Cache  │       │  ClickHouse   │                      │
│  │ (Search View) │       │ (Invalidation)│       │ (Analytics)   │                      │
│  └───────────────┘       └───────────────┘       └───────────────┘                      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pattern 1: Transactional Outbox + Change Data Capture (CDC)
To eliminate dual-write hazards while maintaining local ACID guarantees, the **Transactional Outbox Pattern** pairs with **Change Data Capture**:
1. When an order is created, the service inserts the order record into the `orders` table AND an event payload into an `outbox_events` table within the **exact same local database transaction**:
   ```sql
   BEGIN;
   INSERT INTO orders (id, customer_id, total, status) VALUES (101, 42, 99.00, 'PENDING');
   INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload)
   VALUES ('evt_101', 'Order', '101', 'OrderCreated', '{"orderId": 101, "total": 99.00}');
   COMMIT;
   ```
2. The local database engine guarantees atomic durability: either both rows exist, or neither does.
3. An independent CDC engine (**Debezium**) tails the database's internal transaction log (PostgreSQL WAL or MySQL binary log) and streams records from `outbox_events` into Apache Kafka.
4. **Result:** 100% reliable at-least-once event publication with zero dual-write vulnerabilities and zero database polling overhead.

### Pattern 2: CQRS (Command Query Responsibility Segregation)
Relational databases optimized for high-concurrency writes (normalized OLTP schemas) are inherently poor at complex, full-text, or analytical read queries.
- **Write Path (Data-Driven):** Commands mutate the normalized relational database under strict ACID constraints.
- **Dissemination (Event-Driven):** State changes stream through Kafka topics.
- **Read Path (Specialized Data-Driven Stores):** Downstream consumer workers consume the event stream and project denormalized read models into specialized datastores:
  - **Elasticsearch:** For sub-second full-text fuzzy catalog searches.
  - **Redis:** For sub-millisecond cached session/order lookups.
  - **ClickHouse / Apache Iceberg:** For multi-million-row real-time analytical slicing and dashboards.

---

## 6. Decision Framework: "How to Pick the Right One"

Choosing between Data-Driven, Event-Driven, or Hybrid architecture requires evaluating technical constraints, latency tolerances, and organizational topologies.

### Architectural Decision Tree

```
START: What is the primary operational requirement of the feature?
│
├── Financial ledger, double-entry accounting, strict atomic multi-row locking?
│   └── ▶ CHOOSE: DATA-DRIVEN ARCHITECTURE (RDBMS + ACID Transactions)
│
├── Heavy internal BI reporting, ad-hoc analytical queries, low concurrency?
│   └── ▶ CHOOSE: DATA-DRIVEN ARCHITECTURE (Data Warehouse / Lakehouse / SQL)
│
├── High-frequency streaming telemetry, IoT sensors, sub-second fraud detection?
│   └── ▶ CHOOSE: EVENT-DRIVEN ARCHITECTURE (Kafka / Flink / Reactive Streaming)
│
├── Cross-domain microservices requiring traffic buffering and loose temporal coupling?
│   │
│   ├── Is local transaction safety critical alongside decoupled downstream notifications?
│   │   └── ▶ CHOOSE: HYBRID ARCHITECTURE (Transactional Outbox + CDC + Kafka)
│   │
│   └── Are downstream consumers purely asynchronous background workers (emails, push alerts)?
│       └── ▶ CHOOSE: EVENT-DRIVEN ARCHITECTURE (Message Queue / SQS / RabbitMQ)
│
└── Early-stage MVP / startup with < 3 engineers and uncertain domain boundaries?
    └── ▶ CHOOSE: DATA-DRIVEN MONOLITH (PostgreSQL + Modular Monolith)
          *Avoid the distributed systems complexity tax until scale demands it.*
```

### Comprehensive Decision Checklist

#### Choose Data-Driven Architecture when:
- [x] **Immediate consistency is mandatory:** Business invariants require that a read performed 1 millisecond after a write reflects the newly committed state without exception.
- [x] **Data relationships are highly relational:** The domain requires complex multi-table joins, nested foreign keys, and cascading relational integrity.
- [x] **Team and operational scale is modest:** The engineering organization lacks dedicated infrastructure teams to manage Kafka clusters, partition balance, and distributed tracing.
- [x] **Workflows are synchronous request-response:** The client cannot proceed until the outcome of the transaction is known (e.g., synchronous credit card authorization gateway).

#### Choose Event-Driven Architecture when:
- [x] **Traffic is highly bursty:** Ingestion rates spike dramatically, requiring message brokers to buffer load and protect downstream services.
- [x] **Temporal and operational decoupling is required:** Downstream systems (e.g., logistics, marketing analytics) experience planned downtime or latency spikes that must never degrade user-facing checkout.
- [x] **Multiple autonomous consumers need the same data:** A single business action triggers 4+ independent operations across different organizational squads.
- [x] **Event history and replayability provide business value:** Auditing, machine learning model retraining, or retroactive bug fixes require replaying transactions from the beginning of time.

#### Choose Modern Hybrid Architecture when:
- [x] **Scaling microservices in an enterprise:** Each microservice requires full autonomy and local ACID safety, but the organization requires real-time data synchronization across domains.
- [x] **Powering CQRS read optimization:** The primary transactional database cannot handle read query volume, requiring real-time streaming projections to Elasticsearch, Redis, or analytical warehouses.
- [x] **Eliminating dual-write failure modes:** Your system must publish reliable event streams without risking silent database-to-broker data divergence.

---

## 7. Summary & Principal Takeaways

1. **State vs Facts:** Data-Driven Architecture prioritizes current state at rest; Event-Driven Architecture prioritizes immutable business facts in flight.
2. **Coupling Trade-Off:** DDA couples callers across time and shared schemas; EDA decouples services temporally and spatially at the expense of eventual consistency and operational complexity.
3. **The Complexity Tax:** Event-Driven Architecture is not a panacea. It introduces distributed tracing hurdles, out-of-order delivery risks, and mandatory idempotent consumer requirements.
4. **Beware Dual-Writes:** Never write to a database and emit to a message broker in the same application method without the **Transactional Outbox Pattern** or CDC.
5. **The Pragmatic Default:** Start simple with a clean Data-Driven model; evolve into an Event-Driven or Hybrid architecture as transaction throughput, team autonomy, and decoupled scaling demands emerge.

---

## Related Knowledge Base Guides
- [Event-Driven Microservices](/technical-knowledge/system-design/event-driven-microservices) - Domain events, choreography vs orchestration, and Spring Data implementations.
- [Transactional Outbox Pattern](/technical-knowledge/system-design/outbox-pattern) - Detailed engine implementation of the outbox table and CDC pipeline.
- [Kafka Architecture & Log Internals](/technical-knowledge/kafka/architecture) - Zero-copy `sendfile()`, partition segment mechanics, and consumer group rebalances.
- [CQRS Architecture Pattern](/technical-knowledge/system-design/cqrs) - Command Query Responsibility Segregation with denormalized read views.
