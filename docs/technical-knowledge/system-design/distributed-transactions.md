---
id: distributed-transactions
title: "Distributed Transactions: 2PC vs. Saga Pattern"
sidebar_label: "Distributed Transactions (2PC vs Saga)"
sidebar_position: 4
description: "Master guide to distributed transactions in microservices — Two-Phase Commit (2PC), Saga Pattern (Choreography vs. Orchestration), Transactional Outbox + CDC, and NewSQL architectures."
tags:
  - system-design
  - distributed-systems
  - transactions
  - 2pc
  - saga
  - eventual-consistency
  - outbox-pattern
  - microservices
---

import DistributedTransactionsComparisonDiagram from '@site/src/components/DistributedTransactionsComparisonDiagram';
import EcommerceDistributedFailureDiagram from '@site/src/components/EcommerceDistributedFailureDiagram';
import TwoPhaseCommitProtocolFlowDiagram from '@site/src/components/TwoPhaseCommitProtocolFlowDiagram';
import SagaCompensationLifecycleDiagram from '@site/src/components/SagaCompensationLifecycleDiagram';
import SagaChoreographyVsOrchestrationDiagram from '@site/src/components/SagaChoreographyVsOrchestrationDiagram';
import TwoPhaseCommitDiagram from '@site/src/components/TwoPhaseCommitDiagram';
import SagaCoreFlowDiagram from '@site/src/components/SagaCoreFlowDiagram';
import ChoreographySequenceDiagram from '@site/src/components/ChoreographySequenceDiagram';
import OrchestrationSequenceDiagram from '@site/src/components/OrchestrationSequenceDiagram';
import TransactionalOutboxDiagram from '@site/src/components/TransactionalOutboxDiagram';

# Distributed Transactions: 2PC vs. Saga Pattern

In a traditional monolithic architecture with a single relational database, maintaining data integrity is straightforward: wrap operations in `@Transactional` (`BEGIN ... COMMIT / ROLLBACK`), and the database enforces full **ACID guarantees** locally.

In a modern **Microservices Architecture with Database-per-Service**, transactions must span across multiple independent databases, message brokers, and third-party APIs (Stripe, SendGrid). If one step fails after earlier steps succeed, the system is left in a **partially committed, inconsistent state**.

:::tip For newcomers
Think of a single database transaction like paying at one cash register: either the whole purchase goes through, or none of it does — the register handles that atomically for you. A **distributed transaction** is like buying a bundle where the flight, hotel, and rental car are each booked by a *different, unrelated company*. There's no single register that can undo all three at once if one booking fails. Everything on this page is about how real systems handle that problem when there's no single "undo button" that spans multiple independent services.
:::

---

## Interactive Distributed Transactions Explorer

The interactive visualizer below compares **Two-Phase Commit (2PC)**, **Saga Choreography**, **Saga Orchestration**, and the **Transactional Outbox Pattern**:

<DistributedTransactionsComparisonDiagram />

---

## 1. The Core Distributed Transaction Problem

Consider an e-commerce checkout flow involving three independent microservices:

<EcommerceDistributedFailureDiagram />

### The Dual Failure Hazards:
1. **Partial Execution Failure**: If the Payment step fails (e.g. card declined), the Stock reservation and Order record already committed to disk. How do you roll back changes across separate physical databases?
2. **The Dual-Write Hazard**: If a service writes to its local database and publishes an event to Kafka in the same method, a network drop or crash between the two lines of code causes permanent state divergence:
   ```java
   // ❌ THE DUAL-WRITE DANGER ZONE
   orderRepository.save(order);       // Step 1: DB commit succeeds
   kafkaTemplate.send("orders", event); // Step 2: JVM crashes or Kafka broker unreachable!
   ```

**Why can't we just use a normal transaction across services?** Because each service owns its *own* database (a core rule of microservices — "database-per-service"), there is no single connection, no single WAL, and no single lock manager that spans Order DB, Inventory DB, and Stripe. Any solution has to coordinate across systems that don't know about each other and can fail independently, at different times, for different reasons.

---

## 2. Strategy 1: Two-Phase Commit (2PC) — Strong Consistency

Two-Phase Commit (2PC) is a synchronous protocol designed to achieve **atomic transaction commits** across multiple independent database nodes.

<TwoPhaseCommitProtocolFlowDiagram />

:::tip For newcomers
2PC works like a wedding with three separate officiants who all have to agree before the marriage is legally final. In Phase 1, the coordinator asks everyone "are you ready to say yes?" and each officiant privately commits to saying yes (but hasn't announced it yet). Only once *everyone* has privately agreed does the coordinator say "okay, everyone say it out loud now" — Phase 2. The dangerous part: if the coordinator has a heart attack right after everyone privately agreed but before telling them to say it out loud, all three officiants are stuck standing there indefinitely, unable to proceed *or* back out, because they don't know what the others decided.
:::

### Deep Dive: What "Prepare" Actually Does at the Storage Layer

The Prepare phase is not a no-op check — it is a real, expensive database operation:

- The participant executes the write as it normally would, acquiring row/table/gap locks exactly as in a local transaction.
- Crucially, it does **not** release those locks or make the change visible. Instead it persists an entry to its own WAL (`PREPARE ord_101`) so that even if the participant crashes and restarts, it remembers it voted YES and can honor that vote later.
- This is why 2PC participants must support **XA (eXtended Architecture)** — the standard interface (`XAResource.prepare()`, `.commit()`, `.rollback()`) that lets an external coordinator drive this two-step protocol. PostgreSQL, MySQL (InnoDB), and Java EE/JTA transaction managers (Atomikos, Bitronix) support XA; most managed cloud databases and virtually all third-party HTTP APIs (Stripe, Twilio) do not.

### Why 2PC Fails at Microservices Scale
While 2PC provides true ACID atomicity, it is practically unusable across distributed microservices:

1. **Synchronous Lock Amplification**: Every participant holds database row/table locks from Phase 1 until the end of Phase 2. Under concurrent traffic, throughput collapses and tail latency skyrockets.
2. **Coordinator Single Point of Failure (SPOF)**: If the coordinator crashes during Phase 2 after participants voted YES, participants enter an **In-Doubt state** holding locks indefinitely, blocking all other transactions. This is why 2PC is sometimes called a "blocking protocol" — a variant called **Three-Phase Commit (3PC)** adds a non-blocking "pre-commit" acknowledgment step to reduce (not eliminate) this window, at the cost of an extra network round trip; it's rarely used in practice because it still doesn't tolerate network partitions cleanly.
3. **Third-Party Incompatibility**: External APIs (Stripe, PayPal, AWS SES) do not support XA/2PC prepare-commit protocols.
4. **CAP Theorem Penalty**: 2PC chooses Consistency ($C$) over Availability ($A$). If a single network link is slow or partitioned, the entire transaction blocks.

---

## 3. Strategy 2: The Saga Pattern — Eventual Consistency (BASE)

The **Saga Pattern** breaks a distributed business transaction into a sequence of **independent, local ACID transactions**.

<SagaCompensationLifecycleDiagram />

:::tip For newcomers
Back to the travel-booking analogy: instead of one coordinator forcing the flight, hotel, and car companies to all agree upfront, a Saga just books each one in order — flight first, then hotel, then car. If the car rental fails, the system doesn't try to travel back in time and un-book the flight. Instead, it calls the flight company and says "please cancel this booking" — a normal, everyday cancellation request, not a magic rollback. That's the whole idea: **compensations are just new actions that undo the business effect of a previous action**, using the same APIs a human would use.
:::

### What Are Compensating Transactions?
- Compensations are **NOT database rollbacks**. They are new, forward-moving business operations that semantically undo the effects of previous steps (e.g. issuing a refund transaction, releasing reserved stock, or marking an order as `CANCELLED`).
- **Pivot Transaction**: The go/no-go boundary in a Saga. Once the pivot transaction commits, the Saga must run to completion (subsequent steps must be designed to be retryable until they succeed).

### Deep Dive: Idempotency Is Not Optional

Every saga step and every compensation must be **idempotent** — safe to execute more than once with the same effect as executing once. This isn't a nice-to-have; it's structurally required, because at-least-once delivery (retries, redelivered Kafka messages, orchestrator restarts) means every step *will* eventually be invoked more than once in production.

```java
// ❌ NOT idempotent — running this twice double-charges the customer
public void chargeCustomer(String orderId, BigDecimal amount) {
    stripeClient.charge(amount, "usd");
}

// ✅ Idempotent via a caller-supplied idempotency key, deduplicated by the payment provider
public void chargeCustomer(String orderId, BigDecimal amount) {
    // orderId doubles as the idempotency key — Stripe deduplicates
    // any retried request with the same key within a 24h window
    stripeClient.charge(amount, "usd", RequestOptions.builder()
            .setIdempotencyKey(orderId)
            .build());
}
```

For steps that don't call an external API with native idempotency-key support, the standard pattern is a **processed-events table**:

```java
@Transactional
public void applyInventoryReservation(String sagaId, String orderId, List<LineItem> items) {
    if (processedEventRepository.existsBySagaIdAndStep(sagaId, "RESERVE_INVENTORY")) {
        return; // already applied — safe no-op on redelivery
    }
    inventoryRepository.reserve(items);
    processedEventRepository.save(new ProcessedEvent(sagaId, "RESERVE_INVENTORY"));
}
```

### Deep Dive: Isolation Anomalies and Timeouts

Because saga steps commit locally and become visible immediately, two classic anomalies show up that senior engineers are expected to reason about explicitly:

- **Dirty reads across the saga**: another transaction reads `order.status = CONFIRMED` after the pivot step, but before a later compensating step rolls it back to `CANCELLED`. Mitigate with **semantic locks** (a `PENDING_*` status that other reads/writes explicitly check for) rather than pretending the intermediate state doesn't exist.
- **Lost updates**: a customer-initiated cancellation races with an in-flight saga step. Mitigate with **optimistic version checks** (`WHERE version = :expectedVersion`) on every saga step's `UPDATE`.
- **Stuck sagas**: a step's downstream service is unreachable indefinitely. Every saga step needs an explicit timeout policy — after N retries or T seconds, an orchestrated saga should transition to a `FAILED` state and trigger compensation rather than waiting forever; a choreographed saga needs a similar timeout watchdog per event consumer, since there's no central place to notice the whole flow has stalled.

---

## 4. Saga Choreography vs. Saga Orchestration

<SagaChoreographyVsOrchestrationDiagram />

### 4.1 Saga Choreography (Event-Driven)
In Choreography, services react autonomously to events:

<ChoreographySequenceDiagram />

```java
// Order Service: publishes an event, doesn't know or care who reacts to it
@Transactional
public void createOrder(CreateOrderRequest request) {
    Order order = orderRepository.save(Order.pending(request));
    outboxRepository.save(OutboxEvent.of("OrderCreated", order.getId(), order.toPayload()));
}

// Inventory Service: reacts independently, has no knowledge of the Order Service's internals
@KafkaListener(topics = "order-events")
public void onOrderCreated(OrderCreatedEvent event) {
    try {
        inventoryService.reserve(event.orderId(), event.items());
        outboxRepository.save(OutboxEvent.of("InventoryReserved", event.orderId(), null));
    } catch (InsufficientStockException e) {
        outboxRepository.save(OutboxEvent.of("InventoryReservationFailed", event.orderId(), null));
    }
}
```

- **Pros**: Loose coupling, high autonomy, natural fit for event-driven systems.
- **Cons**: High cognitive load, risk of cyclic event storms, difficult to debug or track end-to-end transaction state.

### 4.2 Saga Orchestration (State Machine)
In Orchestration, a central coordinator (e.g. **Temporal**, **AWS Step Functions**, **Camunda**, or a custom state machine) manages workflow execution:

<OrchestrationSequenceDiagram />

```java
// Simplified custom orchestrator — a real system typically uses Temporal or a
// persisted state machine (Spring Statemachine) rather than hand-rolled logic like this
@Service
public class CheckoutSagaOrchestrator {

    public void handle(SagaEvent event) {
        Saga saga = sagaRepository.findById(event.sagaId());
        switch (saga.getCurrentStep()) {
            case ORDER_CREATED -> {
                if (event instanceof InventoryReserved) {
                    saga.advanceTo(PAYMENT_PENDING);
                    commandGateway.send(new ChargePaymentCommand(saga.getOrderId()));
                } else if (event instanceof InventoryReservationFailed) {
                    saga.advanceTo(FAILED);
                    commandGateway.send(new CancelOrderCommand(saga.getOrderId())); // compensation
                }
            }
            case PAYMENT_PENDING -> {
                if (event instanceof PaymentCharged) {
                    saga.advanceTo(COMPLETED);
                } else if (event instanceof PaymentFailed) {
                    saga.advanceTo(COMPENSATING);
                    commandGateway.send(new ReleaseInventoryCommand(saga.getOrderId())); // compensation
                }
            }
        }
        sagaRepository.save(saga);
    }
}
```

- **Pros**: Single point of truth for workflow state, deterministic error handling, clear separation of business workflow logic from domain service logic.
- **Cons**: Requires managing orchestrator infrastructure; risk of centralizing too much domain logic into the orchestrator.

**Practical guidance:** most teams underestimate choreography's debugging cost until they're paged for a saga stuck at 2am with no single place to see "which step is it on." As a rule of thumb: 2–3 steps with simple failure handling → choreography is fine; 4+ steps, or any step needing a timeout/retry policy distinct from the others → orchestration pays for itself quickly.

---

## 5. Strategy 3: Transactional Outbox Pattern + CDC

To prevent the **Dual-Write Hazard** (writing to DB and publishing to message broker), production systems use the **Transactional Outbox Pattern**:

<TransactionalOutboxDiagram />

```sql
-- Local Database Transaction:
BEGIN;
  -- 1. Mutate domain entity
  INSERT INTO orders (id, user_id, total, status) VALUES ('ord_101', 'usr_1', 99.00, 'PENDING');
  
  -- 2. Insert event payload into outbox table in SAME local transaction
  INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload)
  VALUES (gen_random_uuid(), 'ORDER', 'ord_101', 'OrderCreated', '{"orderId":"ord_101","total":99.00}');
COMMIT;
```

```java
// Spring Boot: both writes share the same @Transactional boundary and local DB commit —
// there is no window where one succeeds and the other doesn't
@Transactional
public Order createOrder(CreateOrderRequest request) {
    Order order = orderRepository.save(Order.pending(request));
    outboxRepository.save(new OutboxEvent(
            UUID.randomUUID(), "ORDER", order.getId(), "OrderCreated", toJson(order)));
    return order;
}
```

### Log-Based Change Data Capture (CDC):
- **Debezium / Kafka Connect** tails the database Write-Ahead Log (PostgreSQL WAL / MySQL binlog).
- Outbox events are automatically published to Kafka with **zero dual-write risk** and **at-least-once delivery guarantees**.

### Deep Dive: The Fallback When You Can't Run Debezium

Not every team can run a Debezium/Kafka Connect pipeline (e.g., managed databases without logical replication enabled, or lower-throughput systems where the operational overhead isn't justified). A **polling publisher** is a legitimate, simpler alternative with a clear trade-off:

```java
@Scheduled(fixedDelay = 500)
@Transactional
public void publishPendingOutboxEvents() {
    List<OutboxEvent> batch = outboxRepository.findTop100ByPublishedFalseOrderByCreatedAtAsc();
    for (OutboxEvent event : batch) {
        kafkaTemplate.send(event.getAggregateType(), event.getPayload());
        event.markPublished(); // still within the same local transaction as the DB update
    }
}
```

Trade-off: polling adds latency (bounded by `fixedDelay`) and periodic query load on the outbox table proportional to poll frequency, whereas CDC-based publishing is near-real-time and reads the WAL rather than issuing `SELECT`s against live tables. For most internal workflows, 250–500ms polling latency is imperceptible; reach for CDC when you need sub-100ms propagation or very high write volume where repeated polling queries would compete with production traffic.

### At-Least-Once Means Consumers Must Deduplicate Too

The outbox guarantees the event is published at least once — it does not guarantee the *consumer* only processes it once. Pair outbox publishing with the same idempotent-consumer pattern shown in the Saga section above (a processed-events table, or a natural idempotency key on the downstream operation).

---

## 6. Modern Distributed Databases (NewSQL)

When your application genuinely requires **strong distributed ACID guarantees** across shards or regions:

> [!TIP]
> **Do not implement manual 2PC across microservices.** Instead, use a distributed NewSQL database (e.g. **Google Spanner**, **CockroachDB**, **TiDB**) that encapsulates 2PC and Raft/Paxos consensus internally beneath the storage engine layer.

- **Google Spanner**: Uses **TrueTime API** (atomic clocks + GPS receivers) and internal Paxos groups to provide globally consistent, serializable transactions without manual application coordinators.
- **CockroachDB**: Uses **Hybrid Logical Clocks (HLC)** and multi-raft consensus to achieve distributed ACID across geo-distributed nodes.

The important distinction for interviews and architecture reviews: NewSQL doesn't avoid 2PC-like coordination — it hides that coordination *inside a single logical database product*, so your application code writes ordinary SQL transactions while the database internally runs consensus across replicas. This only helps when all the data genuinely lives in one such system; it does not solve coordination between, say, your order database and Stripe.

---

## 7. Observability and Testing

A saga that "usually works" is not production-ready — the entire point of this pattern is handling the failure paths, so they need to be first-class, testable, and observable.

- **Correlate every step with a `sagaId`.** Propagate it through Kafka headers, log MDC, and tracing baggage (see the Distributed Tracing guide) so a single `sagaId` search reconstructs the whole flow across services.
- **Emit a metric per saga state transition** (`saga.step.completed{step="RESERVE_INVENTORY"}`, `saga.compensated{step="CHARGE_PAYMENT"}`) so compensation rate is visible on a dashboard, not just discoverable via logs after an incident.
- **Alert on sagas stuck in a non-terminal state** beyond an expected duration — this is the distributed-transaction equivalent of a Kafka consumer lag alert, and without it, stuck sagas are invisible until a customer complains.
- **Integration-test the compensation path explicitly**, not just the happy path — force the payment step to fail in a test and assert the order actually transitions to `CANCELLED` and inventory is actually released, not just that no exception was thrown.

```java
@Test
void paymentFailureShouldTriggerInventoryCompensation() {
    sagaOrchestrator.handle(new OrderCreated(orderId, items));
    sagaOrchestrator.handle(new InventoryReserved(orderId));
    sagaOrchestrator.handle(new PaymentFailed(orderId, "card_declined"));

    assertThat(orderRepository.findById(orderId).getStatus()).isEqualTo(CANCELLED);
    assertThat(inventoryRepository.findReservation(orderId)).isEmpty(); // compensation actually ran
}
```

---

## 8. Architectural Comparison Matrix

| Dimension | Two-Phase Commit (2PC) | Saga (Choreography) | Saga (Orchestration) | Transactional Outbox | Distributed NewSQL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Consistency** | Strong ACID | Eventual Consistency | Eventual Consistency | At-Least-Once Delivery | Strong Distributed ACID |
| **Locking Model** | Distributed Row Locks | Local ACID Locks Only | Local ACID Locks Only | Local ACID Locks Only | Internal MVCC + Raft |
| **Throughput** | Low (Blocking) | Very High | High | Ultra High | High |
| **Complexity** | Infrastructure / Protocol | Distributed Debugging | Workflow Orchestrator | CDC Pipeline (Debezium) | Managed Cloud Database |
| **Failure Handling** | Synchronous Abort | Compensating Events | Compensating Commands | CDC Re-delivery | Automatic Consensus Failover |
| **Best For** | Collocated DBs (`< 200 TPS`) | Simple 2–4 Step Events | Complex Multi-Step Flows | Dual-Write Elimination | Global Financial Ledgers |

---

## 9. Senior System Design Interview Q&A

### Q1: Why has the industry largely abandoned 2PC for microservices?
**Answer:**
2PC requires all participating databases to hold synchronous locks across network calls until Phase 2 completes. In a microservices architecture, network latency, independent deployments, third-party APIs (Stripe), and partial network partitions cause locks to be held for seconds, leading to cascading transaction queueing and system outages. Furthermore, if the 2PC coordinator crashes during Phase 2, participants are stranded in an "In-Doubt" state holding locks indefinitely.

---

### Q2: How do you handle isolation anomalies in the Saga Pattern?
**Answer:**
Because Sagas execute local transactions independently, intermediate states are visible to concurrent transactions (lacking the "I" in ACID). To mitigate this:
1. **Semantic Locks**: Set an entity status to `PENDING_APPROVAL` or `RESERVED` so other transactions know it is in-flight.
2. **Commutative Updates**: Design operations so order of execution does not matter (e.g. `balance += 100`).
3. **Pessimistic Read-Checks / Optimistic Versioning**: Check `version_id` before applying final commits.

---

### Q3: What is the Dual-Write Problem and how does the Outbox pattern resolve it?
**Answer:**
The dual-write problem occurs when an application updates its database and publishes a message to Kafka sequentially. If the process crashes or network fails between the two operations, data becomes permanently out of sync.
The **Transactional Outbox Pattern** saves both the domain entity and the outbound message into an `outbox` table within the **same local database ACID transaction**. A CDC tool like Debezium then reads the database WAL and publishes the event to Kafka asynchronously with at-least-once reliability.

---

### Q4: Why must every saga step be idempotent, and what happens if it isn't?
**Answer:**
Saga steps are invoked over unreliable networks with at-least-once semantics — orchestrator restarts, message redelivery, and client retries all mean a step can be executed more than once. If `chargeCustomer()` isn't idempotent, a retried command double-charges the customer. The fix is either a provider-native idempotency key (Stripe's `Idempotency-Key` header) or an application-level processed-events table that short-circuits a step if a record shows it already ran for that `sagaId`.

---

### Q5: How do you decide between choreography and orchestration for a given workflow?
**Answer:**
Count the steps and the complexity of failure handling, not just the service count. Choreography keeps services decoupled and is fine for 2–3 steps with straightforward compensation. Once a workflow needs conditional branching, per-step timeout policies, or a human needs to be able to answer "what state is order #4521's checkout in right now" without grepping five services' logs, the operational cost of choreography's implicit, distributed state exceeds the infrastructure cost of running an orchestrator (Temporal, Camunda, or a persisted state machine).

---

## Related References & Guides

- [Two-Phase Commit (2PC) & 3PC Deep Dive](./two-phase-commit.md) — Low-level WAL mechanics, XA protocols, and failure modes.
- [Saga Pattern (Distributed Workflows)](./saga-pattern.md) — Comprehensive guide to choreography vs orchestration, state machines, and compensation design.
- [Transactional Outbox Pattern](./outbox-pattern.md) — Preventing dual writes with Change Data Capture (CDC).
- [Database ACID Properties](../database/acid.md) — Atomicity, Consistency, Isolation, and Durability under the hood.
- [PostgreSQL Heap Storage Architecture](../database/postgresql-heap-storage-architecture.md) — 8KB slotted page layout, CTID, and MVCC.