---
id: kafka-exactly-once
title: Kafka Exactly-Once Semantics (EOS)
sidebar_label: Exactly-Once (EOS)
description: A complete guide to Kafka exactly-once semantics — delivery guarantees, idempotent producer, transactions, read_committed consumers, Kafka Streams EOS, zombie producer fencing, two-phase commit internals, and production patterns. Beginner through senior depth.
tags: [kafka, exactly-once, eos, idempotent-producer, transactions, kafka-streams, distributed-systems, messaging]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Kafka Exactly-Once Semantics (EOS)

:::info[Who this guide is for]
- **New learners** — start at [The Delivery Guarantee Problem](#the-delivery-guarantee-problem) and [Why Exactly-Once is Hard](#why-exactly-once-is-hard) to understand the distributed systems challenge before looking at the solution.
- **Senior engineers** — jump to [Idempotent Producer Internals](#pillar-1--idempotent-producer), [Transaction Protocol](#pillar-2--kafka-transactions), [Zombie Producer Fencing](#zombie-producer-fencing), [Kafka Streams EOS](#kafka-streams-eos), or [Failure Scenarios](#failure-scenarios).
:::

---

## The Delivery Guarantee Problem

Whenever a distributed system sends a message, three things can go wrong:

```
Producer                      Network                     Broker
   │                             │                            │
   ├── sends message ────────────►────────────────────────────►
   │                             │                            │ stores message
   │                             │◄── ACK ────────────────────┤
   │                             │         ← network drop →   │
   │   never receives ACK        │                            │
   │                             │                            │
   │   What does the producer do?
   │   Option A: give up  → at-most-once  (message may be lost)
   │   Option B: retry    → at-least-once (message may be duplicated)
   │   Option C: exactly-once semantics needed
```

### Delivery guarantee comparison

| Guarantee | How it works | Risk | Use case |
|-----------|-------------|------|---------|
| **At-most-once** | Send once, no retry on failure | Message **loss** possible | Metrics, telemetry where occasional loss is acceptable |
| **At-least-once** | Retry until ACK received | **Duplicate** messages possible | Most business events — handle duplicates in consumer |
| **Exactly-once** | Message delivered and processed exactly one time | Neither loss nor duplicates | Payments, inventory updates, financial ledgers |

### The email analogy

```
At-most-once:
  You write an email, click Send.
  If Gmail crashes mid-send: email is gone — you never know it didn't arrive.
  Trade-off: fast, but you might lose messages.

At-least-once:
  You write an email, click Send. No delivery confirmation?
  You send it again. And again. Until you get a receipt.
  Trade-off: email arrives (maybe 3 times). Recipient must handle duplicates.

Exactly-once:
  Gmail uses a transaction: the email is sent AND a delivery receipt is atomically
  linked. If either fails, both are rolled back. The email arrives exactly once.
  Trade-off: slowest, requires coordination — but guaranteed correctness.
```

---

## Why Exactly-Once is Hard

In a distributed system, achieving exactly-once is non-trivial because failures happen between components at unpredictable moments:

```
Scenario: Payment service sends "charge user $100" to Kafka

Failure A — producer crash after write, before ACK:
  Broker stored the message ✅
  Producer retries → second "charge $100" sent → duplicate charge ❌

Failure B — broker stored message, consumer processed, consumer crashed before offset commit:
  Consumer restarts → re-reads the same message → processes "charge $100" again ❌

Failure C — consumer processed, produced result to output topic, then crashed:
  Offset not committed → consumer restarts → re-processes input → duplicate output ❌

Failure D — network partition splits producer from broker:
  Producer thinks write failed → retries → broker may have stored both ❌
```

**Exactly-once requires solving all four failure scenarios simultaneously.** Kafka's EOS does this through three cooperating mechanisms:

```
Three pillars of Kafka EOS:

1. Idempotent Producer    → solves Failure A (deduplicates retries at the broker)
2. Transactions           → solves Failures B, C, D (atomic multi-partition writes)
3. read_committed Consumer → prevents consumers from seeing uncommitted/aborted data
```

---

## Pillar 1 — Idempotent Producer

### The problem: duplicate writes from retries

Without idempotence:

```
Producer sends batch [msg1, msg2] with sequence=42
Broker stores [msg1, msg2], sends ACK
Network drops the ACK
Producer never receives ACK → retries
Broker stores [msg1, msg2] AGAIN → now msg1 and msg2 are duplicated  ❌
```

### The solution: Producer ID + sequence numbers

When `enable.idempotence=true`, the broker assigns each producer a **PID** (Producer ID) and each partition a monotonically increasing **sequence number**. The broker deduplicates based on (PID, partition, sequence):

```
Producer gets PID=101 from the broker (assigned at startup)

Producer sends: PID=101, partition=0, seq=42, data=[msg1, msg2]
Broker stores:  seq=42 stored, ACK sent
Network drops ACK

Producer retries: PID=101, partition=0, seq=42, data=[msg1, msg2]
Broker sees:      seq=42 already stored for PID=101, partition=0
                  → DUPLICATE DETECTED → ACK without storing again  ✅
                  No duplicate in the log!
```

### What idempotence guarantees (and doesn't)

```
✅ Guarantees:
  - No duplicates within a single producer session
  - Preserves message ordering even with retries (seq numbers are in order)
  - Works transparently — no consumer-side changes needed

❌ Does NOT guarantee:
  - Exactly-once across multiple partitions (need transactions for that)
  - Survival across producer restarts (PID resets on restart → new session)
  - Exactly-once to external systems (DB, HTTP endpoints, etc.)
```

### Idempotent producer configuration

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

// Enable idempotence — automatically sets acks=all and retries=MAX_VALUE
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

// These are set automatically by enable.idempotence=true, but explicit is clearer:
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
// max in-flight = 5 is safe for idempotent producers (broker reorders if needed)
// without idempotence: max in-flight must be 1 to preserve order on retry

KafkaProducer<String, Order> producer = new KafkaProducer<>(props);
```

---

## Pillar 2 — Kafka Transactions

Idempotent producer alone only prevents retry duplicates within one partition of one session. **Transactions** provide:
- Atomic writes across **multiple partitions** (all succeed or all are aborted)
- Atomic pairing of **output production + consumer offset commit** (the consume-transform-produce pattern)

### Transaction anatomy

```
BEGIN TRANSACTION (producer registers with transaction coordinator)
  │
  ├── Write to partition orders-0:         [msg: order-1 processed]
  ├── Write to partition payments-0:       [msg: payment-1 charged]
  ├── Write to partition notifications-0:  [msg: notify user-1]
  ├── Commit consumer offset for raw-orders-0 (via sendOffsetsToTransaction)
  │
COMMIT TRANSACTION
  │
  Transaction coordinator writes COMMIT marker to all affected partitions
  Consumers with read_committed isolation can now see all messages atomically
```

### How the transaction coordinator works

Kafka maintains an internal topic `__transaction_state` (default 50 partitions) that stores transaction state. Each producer with a `transactional.id` is assigned to one partition of `__transaction_state` — its **transaction coordinator** is the broker that leads that partition.

```
Transaction flow:
  1. initTransactions()
     Producer contacts transaction coordinator
     Gets assigned epoch E for transactional.id "payment-app-1"
     Epoch fences any previous incarnation of this transactional.id (zombie fencing)

  2. beginTransaction()
     Local marker only — no broker communication yet

  3. send() calls
     Producer registers each affected partition with the coordinator:
     "I am writing to orders-0, payments-0, notifications-0"
     Coordinator writes AddPartitionsToTxn to __transaction_state

  4. sendOffsetsToTransaction()
     Coordinator atomically includes consumer offset in the transaction

  5. commitTransaction()
     Producer sends COMMIT request to coordinator
     Coordinator writes PREPARE_COMMIT to __transaction_state
     Coordinator sends WriteTxnMarkers to each affected partition's leader
     Each leader writes a COMMIT marker at the end of its log
     Coordinator writes COMPLETE_COMMIT to __transaction_state
     commitTransaction() returns to caller — transaction is done

  If failure at step 5 (before leaders receive markers):
     Next initTransactions() by the same transactional.id detects incomplete state
     Coordinator completes or aborts the pending transaction before starting new one
```

### Full transactional producer example

```java
@Service
public class PaymentTransactionService {

    private final KafkaProducer<String, Object> producer;

    public PaymentTransactionService() {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "payment-processor-" +
            InetAddress.getLocalHost().getHostName());   // unique per instance!
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);

        this.producer = new KafkaProducer<>(props);
        producer.initTransactions();   // registers with transaction coordinator; blocks until ready
    }

    // Process one payment: consume raw-payment → produce result + commit offset atomically
    public void processPayment(ConsumerRecord<String, RawPayment> record,
                                KafkaConsumer<String, RawPayment> consumer) {
        producer.beginTransaction();
        try {
            // 1. Business logic
            ProcessedPayment result = chargeCard(record.value());

            // 2. Produce output — part of the transaction
            producer.send(new ProducerRecord<>("processed-payments", record.key(), result));
            producer.send(new ProducerRecord<>("payment-audit-log", record.key(), result));

            // 3. Commit input offset ATOMICALLY with the output
            Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
            offsets.put(
                new TopicPartition(record.topic(), record.partition()),
                new OffsetAndMetadata(record.offset() + 1)
            );
            producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());
            // groupMetadata() is preferred over just groupId — carries generation info
            // for accurate zombie fencing (KIP-447)

            // 4. Commit — all sends and offset commit are atomic
            producer.commitTransaction();

        } catch (AuthorizationException | UnsupportedVersionException | ProducerFencedException e) {
            // Fatal — cannot recover; producer must be recreated
            log.error("Fatal transaction error — shutting down producer", e);
            producer.close();
            throw new RuntimeException("Unrecoverable producer error", e);

        } catch (KafkaException e) {
            // Transient — abort and retry
            log.warn("Transient error — aborting transaction", e);
            producer.abortTransaction();
            // Caller should retry the processing of this record
            throw e;
        }
    }
}
```

---

## Pillar 3 — read_committed Consumer

### The problem: reading uncommitted data

Without `read_committed` isolation, consumers read all messages as soon as they are appended to the log — including messages from transactions that are later aborted:

```
t=0: Producer starts transaction, writes msg1 to orders-0 (in-flight, not committed)
t=1: Consumer reads orders-0 → sees msg1 (even though transaction not committed yet!)
t=2: Producer crashes → transaction aborted → coordinator writes ABORT marker
t=3: Consumer already processed msg1 → cannot undo the processing  ❌

With read_committed:
t=0: Producer writes msg1 (in-flight)
t=1: Consumer reads orders-0 → msg1 is withheld (pending transaction)
t=2: Producer commits → COMMIT marker written
t=3: Consumer now sees msg1 → processes it safely  ✅

OR:
t=2: Producer crashes → ABORT marker written
t=3: Consumer never sees msg1 → skips it entirely  ✅
```

### Last Stable Offset (LSO)

With `read_committed`, consumers can only read up to the **Last Stable Offset (LSO)** — the offset just below the earliest open (uncommitted) transaction:

```
Partition log:
  Offset 0: [msg-a, committed]
  Offset 1: [msg-b, committed]
  Offset 2: [msg-c, transaction TXN-1, in-flight] ← LSO is here
  Offset 3: [msg-d, committed]
  Offset 4: [msg-e, transaction TXN-1, in-flight]
  Offset 5: [msg-f, committed]

read_committed consumer can read: offsets 0, 1 only
  Offsets 3, 5 are "hidden" behind the stalled LSO from TXN-1

If TXN-1 takes 10 seconds to commit:
  read_committed consumers are stuck for 10 seconds  ← LATENCY IMPACT
  Monitored via: consumer.metrics()["records-lag-max"]
```

### Consumer configuration

```java
Properties consumerProps = new Properties();
consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");
consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "payment-processor");

// Critical for EOS: only read committed transaction data
consumerProps.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");

// Critical for EOS: manual offset commit (offset committed via sendOffsetsToTransaction)
consumerProps.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

// Group metadata needed for accurate fencing (KIP-447)
consumerProps.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, "payment-processor-instance-1");
// Static membership — reduces rebalances; useful for long-running EOS consumers
```

---

## The Consume-Transform-Produce Pattern

This is the core EOS use case: read from Kafka → transform → write back to Kafka, exactly-once.

```
┌──────────────────────────────────────────────────────────────────┐
│                    One Transaction Boundary                       │
│                                                                   │
│  Consumer reads record from "raw-orders"                         │
│       offset 42 on partition 0                                    │
│           │                                                       │
│           ▼                                                       │
│    Business logic (transform/enrich/validate)                    │
│           │                                                       │
│           ▼                                                       │
│  Producer sends to "processed-orders" (part of transaction)      │
│  Producer sends to "order-audit"     (part of transaction)       │
│           │                                                       │
│  sendOffsetsToTransaction:                                        │
│    raw-orders-0 → offset 43 (committed IN the transaction)       │
│           │                                                       │
│    commitTransaction() ────────────────────────────────────────► │
│         Atomically:                                               │
│           ✅ processed-orders message visible to consumers        │
│           ✅ order-audit message visible to consumers             │
│           ✅ raw-orders offset advanced to 43                     │
│                                                                   │
│    On failure before commit:                                      │
│         abortTransaction()                                        │
│           ✅ processed-orders message NOT visible (rolled back)   │
│           ✅ order-audit message NOT visible (rolled back)        │
│           ✅ offset stays at 42 (record will be re-processed)    │
└──────────────────────────────────────────────────────────────────┘
```

### Spring Kafka EOS implementation

```java
@Configuration
public class KafkaEosConfig {

    @Bean
    public ProducerFactory<String, Object> eosProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-processor-");
        // Spring appends a suffix per listener thread to make it unique
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> eosKafkaTemplate(
            ProducerFactory<String, Object> factory) {
        return new KafkaTemplate<>(factory);
    }

    @Bean
    public ConsumerFactory<String, RawOrder> eosConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "order-processor");
        config.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, RawOrder> eosListenerFactory(
            ConsumerFactory<String, RawOrder> consumerFactory,
            KafkaTemplate<String, Object> kafkaTemplate) {

        ConcurrentKafkaListenerContainerFactory<String, RawOrder> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);

        // V2 mode: one producer per listener thread (better than V1's per-partition producer)
        factory.getContainerProperties().setEosMode(ContainerProperties.EOSMode.V2);

        // Link template to container so Spring manages transactions automatically
        factory.getContainerProperties().setKafkaTemplate(kafkaTemplate);

        return factory;
    }
}

@Service
@RequiredArgsConstructor
public class OrderProcessingService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(
        topics = "raw-orders",
        groupId = "order-processor",
        containerFactory = "eosListenerFactory"
    )
    // Spring Kafka automatically wraps this method in a Kafka transaction
    // when EOSMode is configured — no manual beginTransaction/commitTransaction needed
    public void process(ConsumerRecord<String, RawOrder> record) {

        // Business logic
        ProcessedOrder processed = transformOrder(record.value());

        // Send output — automatically part of the transaction managed by Spring
        kafkaTemplate.send("processed-orders", record.key(), processed);
        kafkaTemplate.send("order-audit-log",  record.key(), new AuditEvent(processed));

        // Spring automatically calls sendOffsetsToTransaction and commitTransaction
        // If this method throws an exception: Spring abortTransaction() automatically
    }

    private ProcessedOrder transformOrder(RawOrder raw) {
        // Business transformation logic
        return new ProcessedOrder(raw.orderId(), raw.userId(),
                                  calculateTotal(raw.items()), "PROCESSING");
    }
}
```

### EOSMode V1 vs V2

| | V1 (ALPHA) | V2 (BETA — default since Spring Kafka 2.6) |
|-|:----------:|:-----------------------------------------:|
| **Producer per** | Consumer group + topic + partition | Listener container thread |
| **Performance** | More producers = more overhead | Fewer producers = better |
| **Supported since** | Spring Kafka 2.3 | Spring Kafka 2.6 |
| **Recommendation** | Legacy only | ✅ Always use V2 |

---

## Kafka Streams EOS

Kafka Streams makes exactly-once much simpler — it manages the transaction lifecycle automatically.

### Enabling EOS in Kafka Streams

```java
Properties streamsProps = new Properties();
streamsProps.put(StreamsConfig.APPLICATION_ID_CONFIG, "payment-stream-app");
streamsProps.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");

// Enable exactly-once (V2 is the recommended mode, requires Kafka 2.5+)
streamsProps.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG,
    StreamsConfig.EXACTLY_ONCE_V2);   // "exactly_once_v2"

// Optional: tune commit interval (default 100ms for EOS)
streamsProps.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);

// Optional: reduce standby replicas for faster failover
streamsProps.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);

StreamsBuilder builder = new StreamsBuilder();

KStream<String, RawPayment> rawPayments = builder.stream("raw-payments");

rawPayments
    .filter((key, payment) -> payment.getAmount().compareTo(BigDecimal.ZERO) > 0)
    .mapValues(PaymentProcessor::process)
    .peek((key, processed) -> log.info("Processing payment {}", key))
    .to("processed-payments");

// Kafka Streams automatically:
// - Wraps each poll-process-produce cycle in a Kafka transaction
// - Commits consumer offsets via sendOffsetsToTransaction
// - Aborts transaction and retries on failure
// - Handles producer fencing across task migrations
KafkaStreams streams = new KafkaStreams(builder.build(), streamsProps);
streams.start();
```

### What Kafka Streams EOS manages automatically

```
For each stream task (one task per partition assigned to this instance):

  Internal producer transactional.id:
    "{application.id}-{thread.client.id}-{partition}"
    e.g. "payment-stream-app-StreamThread-1-0"

  Every 100ms (commit.interval.ms):
    1. beginTransaction() — on the task's producer
    2. Process all records received in this poll cycle
    3. Send all output records to output topics
    4. sendOffsetsToTransaction() — for all input offsets consumed
    5. commitTransaction() — atomically visible to downstream consumers

  On task migration (rebalance):
    New instance uses same transactional.id → fences the old instance's producer
    Old instance's pending transaction is aborted
    New instance starts fresh → re-processes from last committed offset
```

### Exactly-once V1 vs V2 in Kafka Streams

| | exactly_once (V1) | exactly_once_v2 (V2) |
|-|:-----------------:|:--------------------:|
| **Producer per** | Thread | Thread (same as V1 externally) |
| **Internal mechanism** | KIP-98 | KIP-447 (uses consumer group metadata for fencing) |
| **Requires Kafka** | 0.11+ | 2.5+ |
| **Performance** | Baseline | ~20% better throughput |
| **Zombie fencing** | transactional.id based | transactional.id + consumer generation |
| **Recommendation** | Legacy | ✅ Use V2 for new systems |

---

## Zombie Producer Fencing

One of the most subtle EOS challenges: what happens when a producer instance is presumed dead but then comes back (a "zombie")?

### The zombie scenario

```
t=0:  Producer instance A (transactional.id="payment-app-1") is healthy
t=1:  A starts transaction, writes partial output, hangs (GC pause, network issue)
t=2:  Kubernetes restarts A (timeout exceeded) → new instance A' starts
t=3:  A' calls initTransactions() → transaction coordinator assigns new epoch E+1
t=4:  A' starts normal processing...
t=5:  Old A wakes up (GC pause ended), still has epoch E
      A tries to continue its transaction
      → Broker rejects: "ProducerFencedException: producer epoch is not current"
      → A cannot write anything — zombie is fenced  ✅
t=6:  A' processes and commits correctly
```

```
Epoch mechanism:
  transactional.id = "payment-app-1"
  Version 1: epoch=0  → registered by A
  Version 2: epoch=1  → registered by A' (A is now fenced at epoch 0)
  Version 3: epoch=2  → registered by A'' (A' is now fenced at epoch 1)

Any producer with an outdated epoch for a given transactional.id is immediately rejected.
```

### Transactional ID uniqueness is critical

```java
// ❌ WRONG: all instances share the same transactional.id
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "payment-processor");
// When two instances start simultaneously: each fences the other → neither can produce!

// ✅ CORRECT: unique per instance
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG,
    "payment-processor-" + InetAddress.getLocalHost().getHostName());
// or:
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG,
    "payment-processor-" + System.getenv("POD_NAME"));
// or: use a UUID stored in a durable store to survive restarts
```

### KIP-447 — consumer group metadata for better fencing

The original zombie fencing (KIP-98) only used the transactional.id. This missed a window: what if the zombie completes its transaction before the new instance registers?

KIP-447 adds consumer group generation to fencing. `sendOffsetsToTransaction(offsets, consumer.groupMetadata())` includes the consumer group's current generation. If a zombie tries to commit offsets from an old consumer generation, the broker rejects it even if the epoch hasn't been bumped yet.

```java
// ✅ Preferred: pass full consumer group metadata (KIP-447, Kafka 2.5+)
producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());

// ❌ Legacy: only passes group ID, no generation info
producer.sendOffsetsToTransaction(offsets, "my-consumer-group");
```

---

## EOS Internals: Two-Phase Commit

Kafka's transaction protocol is a form of two-phase commit (2PC) adapted for a distributed log:

```
Phase 1 — Prepare:
  Transaction coordinator receives commitTransaction() from producer
  Coordinator writes "PREPARE_COMMIT txn=TXN-1" to __transaction_state
  This is durable — even if the coordinator crashes, the commit will complete

Phase 2 — Commit:
  Coordinator sends WriteTxnMarkers RPC to all affected partition leaders:
    → orders-0 leader: write COMMIT marker at offset 45
    → payments-0 leader: write COMMIT marker at offset 12
    → __consumer_offsets-0: write COMMIT marker for offset commit
  Each broker acknowledges
  Coordinator writes "COMPLETE_COMMIT txn=TXN-1" to __transaction_state

If coordinator crashes between Phase 1 and Phase 2:
  New coordinator reads PREPARE_COMMIT from __transaction_state
  Completes Phase 2 automatically — the transaction commits eventually

If coordinator crashes before Phase 1:
  Transaction was never prepared — aborted automatically after transaction.timeout.ms
```

### Transaction timeout

```properties
# Producer:
transaction.timeout.ms=60000   # default 60s — abort if transaction takes longer
                                # Keep short: long transactions delay LSO → consumer lag

# Broker:
transaction.max.timeout.ms=900000  # broker rejects transactions with longer timeout
```

---

## EOS Limitations

### EOS is Kafka-internal only

```
✅ EOS covers:
  Producer → Broker (idempotent writes)
  Broker → Broker (transactional replication)
  Consumer offset commit ↔ Producer write (atomic via sendOffsetsToTransaction)

❌ EOS does NOT cover:
  Kafka → External Database   ← you need idempotent writes or 2PC at the DB level
  Kafka → REST API calls      ← external calls inside a transaction are NOT rolled back
  Kafka → File system writes  ← files written before transaction abort are NOT undone
```

```java
// ❌ DANGEROUS: side effects outside the transaction
@KafkaListener(topics = "raw-orders")
public void process(RawOrder order) {
    kafkaTemplate.executeInTransaction(t -> {
        // This DB write is NOT part of the Kafka transaction
        // If the Kafka transaction aborts, the DB write is NOT rolled back  ❌
        orderRepository.save(new Order(order));

        t.send("processed-orders", order.getId(), processOrder(order));
        return null;
    });
}

// ✅ Better: idempotent DB write keyed on order ID
@KafkaListener(topics = "raw-orders")
public void process(RawOrder order) {
    kafkaTemplate.executeInTransaction(t -> {
        // Upsert: INSERT ... ON CONFLICT DO UPDATE
        // Safe to retry because duplicate calls produce the same result
        orderRepository.upsertByExternalId(order.getId(), new Order(order));

        t.send("processed-orders", order.getId(), processOrder(order));
        return null;
    });
}
```

### Non-idempotent operations inside transactions

```java
// ❌ WRONG: sending an email is NOT idempotent — abort doesn't un-send it
@KafkaListener(topics = "raw-orders")
public void process(RawOrder order) {
    kafkaTemplate.executeInTransaction(t -> {
        t.send("processed-orders", order.getId(), processOrder(order));
        emailService.sendConfirmation(order.getUserEmail());  // if txn aborts, email already sent!
        return null;
    });
}

// ✅ Correct pattern: publish an event for the email, let a separate service send it
@KafkaListener(topics = "raw-orders")
public void process(RawOrder order) {
    kafkaTemplate.executeInTransaction(t -> {
        t.send("processed-orders", order.getId(), processOrder(order));
        t.send("email-notifications", order.getUserEmail(), new EmailEvent(order));
        // Email notification is transactional — only sent if this transaction commits
        return null;
    });
}
```

---

## Failure Scenarios

### Scenario 1 — Producer crashes mid-transaction

```
t=0: Producer starts transaction (epoch=3, txn.id="payment-app-1")
t=1: Producer writes to processed-payments-0
t=2: Producer writes to payment-audit-0
t=3: Producer CRASHES (no commitTransaction called)

What happens:
  Transaction coordinator has registered the transaction as OPEN
  After transaction.timeout.ms (60s default): coordinator marks it TIMED_OUT
  Coordinator sends WriteTxnMarkers to all affected partitions: ABORT
  Partitions write ABORT markers
  read_committed consumers never see the partial writes ✅

When producer restarts:
  initTransactions() contacts coordinator
  Coordinator sees previous incomplete transaction → cleans it up
  Assigns epoch=4 → producer proceeds with fresh state
```

### Scenario 2 — Consumer rebalance during transaction

```
t=0: Consumer group has 2 members: C1 (owns partition 0), C2 (owns partition 1)
t=1: C1 is processing partition 0, record offset=42
     C1 is in the middle of a transaction...
t=2: C2 crashes → rebalance triggers
     Partition 1 is reassigned to C1 (now C1 owns 0 and 1)
     Partition 0 is still owned by C1 — no change

Impact: Kafka Streams handles this automatically.
        For manual consumer/producer: avoid long transactions across rebalances.
        Use consumer.poll() timeout < max.poll.interval.ms to prevent heartbeat timeout.

If C1 itself crashes during rebalance:
  Both partitions assigned to C3
  C3 uses same transactional.id as C1 → fences C1's zombie (if it recovers)
  C3 re-processes from last committed offset
```

### Scenario 3 — Broker crash with pending transaction

```
t=0: Producer sends to broker-1 (leader of processed-payments-0)
t=1: Broker-1 stores the record but crashes before sending ACK
     The record is also on broker-2 and broker-3 (replicas)
t=2: Leader election: broker-2 becomes leader of processed-payments-0
t=3: Producer retries → broker-2 receives the record again
     Producer uses same sequence number → DUPLICATE DETECTED → ack without storing ✅
     Idempotent producer deduplication works across leader switches!
t=4: Producer continues transaction normally
```

---

## Performance Considerations

### EOS overhead analysis

| Component | Overhead | Cause |
|-----------|---------|-------|
| Idempotent producer | ~3–5% | Sequence number tracking, retry deduplication |
| Transactions (commit) | 2 extra broker round trips | PREPARE_COMMIT + WriteTxnMarkers |
| read_committed consumer | Variable LSO lag | Waiting for transaction commit before exposing records |
| **Total EOS overhead** | **~10–20% throughput reduction** | vs at-least-once baseline |

### Performance tuning

```java
// ── Batch multiple messages in one transaction ─────────────────────────
// Anti-pattern: one transaction per message
for (RawOrder order : orders) {
    producer.beginTransaction();
    producer.send(...);
    producer.commitTransaction();   // 2 round trips × 1000 orders = 2000 round trips ❌
}

// Best practice: batch within a transaction
producer.beginTransaction();
for (RawOrder order : orders) {
    producer.send(...);   // all sends buffered, sent in one batch
}
producer.commitTransaction();   // 2 round trips for 1000 messages ✅
```

```properties
# Producer tuning for EOS
linger.ms=10              # wait 10ms to fill batches (reduces commit overhead)
batch.size=65536          # 64KB batch size (larger = fewer commits needed)
compression.type=lz4      # compress batches — smaller network payload per commit

# Kafka Streams: tune commit interval
commit.interval.ms=100    # default for EOS (100ms = 10 commits/sec)
# Increasing to 500ms: fewer commits, higher throughput, more reprocessing on failure
# commit.interval.ms=500
```

### When to use EOS vs at-least-once + idempotent consumer

| Scenario | Choose | Why |
|---------|--------|-----|
| Financial: charge cards, transfer money | EOS | Duplicates cause real financial harm |
| Inventory: reserve/release stock | EOS | Stock levels must be exact |
| Analytics: count events for a dashboard | At-least-once + idempotent consumer | Slightly off count is acceptable; avoid EOS overhead |
| Log aggregation: ship logs to Elasticsearch | At-least-once | Duplicate logs are tolerable; EOS adds latency |
| Kafka to DB with unique constraints | At-least-once + idempotent writes | `INSERT ... ON CONFLICT DO NOTHING` is cheaper than EOS |
| Kafka Streams pure topology | EOS (`exactly_once_v2`) | Built-in; low overhead with Streams |

---

## Broker & Topic Configuration

```properties
# ── Transaction coordinator topic ─────────────────────────────────────────
transaction.state.log.replication.factor=3    # 3 replicas for durability
transaction.state.log.min.isr=2               # require 2 ISR for transaction commits
transaction.state.log.num.partitions=50       # default — enough for most clusters

# ── Consumer offset topic ─────────────────────────────────────────────────
offsets.topic.replication.factor=3
offsets.topic.num.partitions=50

# ── Per-broker ────────────────────────────────────────────────────────────
unclean.leader.election.enable=false   # never elect an out-of-sync replica as leader
min.insync.replicas=2                  # require 2 ISR for writes (must be < RF)
default.replication.factor=3          # all new topics default to RF=3

# ── Transaction timeouts ──────────────────────────────────────────────────
transaction.max.timeout.ms=900000     # max allowed transaction.timeout.ms (15 min)
transaction.abort.timed.out.transaction.cleanup.interval.ms=10000  # check every 10s
```

---

## Complete EOS Configuration Cheat Sheet

```properties
# ── Producer ──────────────────────────────────────────────────────────────
enable.idempotence=true
transactional.id=<app-name>-<unique-suffix>   # unique per producer instance
acks=all
retries=2147483647                            # Integer.MAX_VALUE
max.in.flight.requests.per.connection=5
transaction.timeout.ms=30000                  # 30s — fail fast on stall

# ── Consumer ──────────────────────────────────────────────────────────────
isolation.level=read_committed
enable.auto.commit=false
group.id=<consumer-group>

# ── Kafka Streams ─────────────────────────────────────────────────────────
processing.guarantee=exactly_once_v2
commit.interval.ms=100
replication.factor=3

# ── Broker ────────────────────────────────────────────────────────────────
transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2
min.insync.replicas=2
unclean.leader.election.enable=false
```

---

## Testing EOS

```java
@SpringBootTest
@EmbeddedKafka(
    partitions = 3,
    topics = {"raw-orders", "processed-orders"},
    brokerProperties = {
        "transaction.state.log.replication.factor=1",  // single broker for tests
        "transaction.state.log.min.isr=1"
    }
)
class EosOrderProcessingTest {

    @Autowired private KafkaTemplate<String, Object> kafkaTemplate;
    @Autowired private OrderProcessingService orderService;

    @Test
    void processedOrderIsVisibleOnlyAfterCommit() throws Exception {
        // Arrange: send a raw order
        kafkaTemplate.send("raw-orders", "order-1", new RawOrder("order-1", "user-1", 99.99));

        // Act: let the service process it
        Thread.sleep(2000);

        // Assert: result is visible to read_committed consumer
        Properties consumerProps = new Properties();
        consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, embeddedKafka.getBrokersAsString());
        consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "test-verifier");
        consumerProps.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        KafkaConsumer<String, ProcessedOrder> verifier = new KafkaConsumer<>(consumerProps);
        verifier.subscribe(List.of("processed-orders"));

        ConsumerRecords<String, ProcessedOrder> records = verifier.poll(Duration.ofSeconds(5));
        assertThat(records.count()).isEqualTo(1);
        assertThat(records.iterator().next().value().orderId()).isEqualTo("order-1");
    }

    @Test
    void duplicateRawOrderProducesExactlyOneProcessedOrder() throws Exception {
        // Simulate retry by sending the same raw order twice
        RawOrder order = new RawOrder("order-42", "user-5", 149.99);
        kafkaTemplate.send("raw-orders", "order-42", order);
        kafkaTemplate.send("raw-orders", "order-42", order);   // "duplicate" from retry

        Thread.sleep(3000);

        // Consumer should produce exactly one processed-orders result
        // (service must be idempotent on order ID — upsert, not insert)
        List<ProcessedOrder> results = consumeAll("processed-orders", 5);
        long order42Count = results.stream()
            .filter(r -> r.orderId().equals("order-42"))
            .count();
        assertThat(order42Count).isEqualTo(1L);   // exactly once, not twice
    }
}
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Shared `transactional.id` across instances | All instances fence each other → none can produce | Use unique ID per instance (`hostname`, `POD_NAME`) |
| `enable.auto.commit=true` with EOS | Auto-commit races with `sendOffsetsToTransaction` → double commit → undefined behaviour | Always `enable.auto.commit=false` with EOS |
| `isolation.level=read_uncommitted` on EOS consumer | Consumer reads aborted transaction data — sees phantom records | Always `read_committed` for EOS consumers |
| Side effects (HTTP calls, DB writes) inside transaction | External calls not rolled back on transaction abort | Keep side effects outside; publish events inside the transaction for another service to handle |
| `transaction.timeout.ms` too long | Stalled transaction holds LSO → consumer lag grows | Set to 30s; fix slow processing rather than extending timeout |
| Not handling `ProducerFencedException` | Old zombie producer tries to continue → exception is swallowed → data loss | Catch and fail hard — recreate the producer on this error |
| `exactly_once` instead of `exactly_once_v2` in Kafka Streams | Legacy mode — lower throughput, weaker fencing | Use `exactly_once_v2` (requires Kafka 2.5+) |
| Calling `System.gc()` or long pauses in producer thread | GC pause > `max.poll.interval.ms` or `transaction.timeout.ms` → fenced as zombie | Use ZGC or Shenandoah; keep producer thread free of heavy computation |
| Using EOS for every topic regardless of need | 10–20% throughput overhead on all topics | Apply EOS only to topics that genuinely require it (financial data, inventory) |
| Not monitoring transaction abort rate | Silent data quality issues if aborts spike | Alert on `kafka.producer.metrics.transaction-abort-rate > 0` |

---

## 🎯 Interview Questions

**Q1. What are the three delivery guarantees in Kafka, and when do you choose each?**
> At-most-once: producer sends once, no retry on failure — message may be lost. Use for metrics and telemetry where some loss is acceptable. At-least-once: producer retries until ACK received — message may be duplicated. Use for most business events where the consumer can handle duplicates (idempotent writes). Exactly-once: message delivered and processed precisely one time, no loss or duplicates. Use for financial transactions, inventory, and any case where duplicates cause real business harm. EOS carries ~10–20% throughput overhead so apply it selectively.

**Q2. What are the three pillars required for end-to-end exactly-once in Kafka?**
> (1) Idempotent producer (`enable.idempotence=true`): the broker assigns each producer a PID and tracks sequence numbers per partition, deduplicating retries without storing them twice. (2) Transactions (`transactional.id` + `beginTransaction/commitTransaction`): enables atomic writes across multiple partitions and atomically pairs output production with consumer offset commits via `sendOffsetsToTransaction`. (3) `read_committed` consumer isolation: consumers only see records from committed transactions — records from in-progress or aborted transactions are withheld until the transaction resolves.

**Q3. What is `sendOffsetsToTransaction` and why is it the key to EOS?**
> `sendOffsetsToTransaction` includes consumer offset advances inside the current Kafka transaction. This makes input offset consumption and output production atomic: if the transaction commits, both the output records AND the consumer offsets advance together. If the transaction aborts, neither is visible — the message will be re-processed. Without this atomic pairing, you could commit output but fail to advance the offset (causing reprocessing) or advance the offset but lose the output (causing data loss). It is the bridge between the consumer and producer sides of the consume-transform-produce pattern.

**Q4. What is zombie producer fencing and why is it necessary for EOS?**
> A zombie producer is an old producer instance that was presumed dead (timeout, GC pause, network partition) but later recovers. Without fencing, the zombie could complete a transaction that conflicts with work already done by the new instance. Kafka fences zombies using an epoch: every time a producer with a given `transactional.id` calls `initTransactions()`, the broker assigns a new epoch (incrementing the previous one). Any produce or commit request with an old epoch is rejected with `ProducerFencedException`. KIP-447 strengthens this further by including consumer group generation in `sendOffsetsToTransaction` — rejecting old generations even if the epoch hasn't been bumped yet.

**Q5. How does Kafka Streams implement EOS compared to manual consumer/producer?**
> Kafka Streams automatically wraps each poll-process-produce cycle in a Kafka transaction. For each stream task, it creates an internal producer with a `transactional.id` derived from the application ID and partition (`{app-id}-{thread}-{partition}`). Every `commit.interval.ms` (default 100ms): it calls `beginTransaction`, processes accumulated records, sends outputs, calls `sendOffsetsToTransaction` for all consumed offsets, and `commitTransaction`. Developers just set `processing.guarantee=exactly_once_v2` — no manual transaction management. On task migration (rebalance), the new owner uses the same `transactional.id`, fencing the old owner's zombie producer automatically.

**Q6. Why doesn't Kafka EOS cover writes to external systems (like a database)?**
> Kafka's transaction protocol uses the Kafka broker as the coordinator — it can atomically write to multiple Kafka partitions because all operations go through the Kafka transaction protocol. External systems (databases, REST APIs, file systems) are not participants in the Kafka transaction. If you write to a database inside a Kafka transaction and the transaction aborts, the Kafka broker rolls back the Kafka writes but has no mechanism to roll back the database write. Solutions: (1) make database writes idempotent (`INSERT ... ON CONFLICT DO UPDATE`) so retries produce the same result; (2) use the outbox pattern — write to a Kafka topic within the transaction, let a separate service consume from that topic and write to the database; (3) use a distributed transaction coordinator (expensive, complex).

**Q7. (Senior) What happens to consumers when a long-running transaction stalls the Last Stable Offset?**
> The LSO (Last Stable Offset) is the offset below the earliest open transaction on a partition. `read_committed` consumers can only read up to the LSO — messages at higher offsets are withheld even if they are from committed transactions, because the LSO cannot advance past an open transaction. A stalled transaction (slow producer, long processing time, GC pause, deadlock) holds the LSO in place. Consumers appear stuck — their lag grows even though no new messages need processing. This is particularly dangerous because committed messages from other producers at higher offsets are also hidden. Mitigation: set `transaction.timeout.ms` short (30s); monitor `kafka_consumer_group_lag` and alert on unexpected growth; use `read_uncommitted` for non-EOS consumers that don't need the guarantee (they won't be affected by LSO).

---

## See Also

- [Kafka Broker — Complete Guide](../core/broker.md)
- [Kafka Producer — Deep Dive](../producer/producer-overview.md)
- [Kafka Consumer — Deep Dive](../consumer/consumer-overview.md)
- [Spring Batch — Complete Guide](../../spring/spring-batch.md)
- [Database Connection Pooling](../../database/connection-pooling.md)