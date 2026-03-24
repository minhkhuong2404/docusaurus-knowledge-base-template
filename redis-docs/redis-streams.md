---
id: redis-streams
title: "Redis Streams"
slug: redis-streams
description: Complete guide to Redis Streams — append-only logs, consumer groups, message acknowledgement, and comparison with Kafka for senior engineers.
tags: [redis, streams, messaging, backend, event-driven]
---

# Redis Streams

Introduced in Redis 5.0, Streams are a log-like data structure providing persistent, ordered, multi-consumer message delivery. Think of it as a lightweight alternative to Kafka built into Redis.

---

## Core Concepts

```
Stream: user-events
────────────────────────────────────────────────────────────────
ID              | Fields
────────────────────────────────────────────────────────────────
1700000001000-0 | event=login, userId=123, ip=192.168.1.1
1700000002000-0 | event=purchase, userId=456, amount=29.99
1700000003000-0 | event=login, userId=789, ip=10.0.0.1
────────────────────────────────────────────────────────────────
```

Each entry has:
- **Stream ID:** `{milliseconds}-{sequence}` — auto-generated or custom
- **Fields:** Key-value pairs (like a Hash)

---

## Writing to a Stream

```bash
# XADD: append entry, auto-generate ID with *
XADD user-events * event login userId 123 ip 192.168.1.1
# Returns: "1700000001000-0"

# XADD with explicit ID (for replication or idempotency)
XADD user-events 1700000001000-0 event login userId 123

# Cap stream at 1000 entries (trimming)
XADD user-events MAXLEN 1000 * event purchase userId 456 amount 29.99
XADD user-events MAXLEN ~ 1000 * ...  # ~ means approximate trim (more efficient)

# XLEN — stream length
XLEN user-events
```

---

## Reading from a Stream

```bash
# XREAD — read new messages (fan-out broadcast — all readers get all messages)
XREAD COUNT 10 STREAMS user-events 0         # Read from beginning
XREAD COUNT 10 STREAMS user-events $         # Read only NEW messages from now
XREAD COUNT 10 BLOCK 0 STREAMS user-events $ # Block forever until new message

# XRANGE — read a range by ID
XRANGE user-events - +                       # All entries
XRANGE user-events 1700000001000-0 +         # From ID to end
XRANGE user-events - + COUNT 10             # First 10 entries

# XREVRANGE — reverse order
XREVRANGE user-events + - COUNT 10          # Last 10 entries
```

---

## Consumer Groups — Coordinated Message Processing

Consumer groups enable **work distribution**: multiple consumers in a group collaborate, with each message delivered to exactly one consumer in the group (like a queue).

```bash
# Create consumer group starting from the beginning
XGROUP CREATE user-events payment-processors 0
# or from "now" (ignore historical messages)
XGROUP CREATE user-events payment-processors $ MKSTREAM

# Consumer reads from group — ">" means "give me undelivered messages"
XREADGROUP GROUP payment-processors worker-1 COUNT 10 STREAMS user-events >

# Acknowledge message processed successfully
XACK user-events payment-processors 1700000001000-0

# Check pending messages (delivered but not ACKed)
XPENDING user-events payment-processors - + 10
```

### Consumer Group Architecture

```
Stream: user-events
│
├── Consumer Group: payment-processors
│   ├── worker-1 (processing 1700000001-0)
│   ├── worker-2 (processing 1700000002-0)
│   └── worker-3 (idle — waiting)
│
└── Consumer Group: analytics-pipeline   (gets ALL messages independently)
    ├── analytics-1 (at 1700000001-0)
    └── analytics-2 (at 1700000002-0)
```

**Key semantics:**
- Within a group: each message → one consumer (load distribution)
- Between groups: each group independently reads all messages (fan-out)
- Without a group: `XREAD` is pure fan-out (every reader gets every message)

---

## Message Acknowledgment and Recovery

```bash
# PEL (Pending Entries List) — tracks unACKed messages per consumer
XPENDING user-events payment-processors - + 10
# Returns: [id, consumer-name, idle-ms, delivery-count]

# Claim messages that have been idle >30 seconds (consumer crashed)
XAUTOCLAIM user-events payment-processors recovery-worker 30000 0-0 COUNT 10
# or manually:
XCLAIM user-events payment-processors recovery-worker 30000 1700000001000-0

# XDEL — remove specific entries
XDEL user-events 1700000001000-0

# Dead-letter: after N delivery attempts → move to dead-letter stream
XPENDING user-events payment-processors - + 10
# delivery-count > 3 → XDEL original, XADD dead-letter
```

### Reliable Consumer Pattern

```python
# Worker with exactly-once processing
while True:
    # First: check for messages previously delivered to me but not ACKed
    pending = redis.xpending_range('user-events', 'payment-processors',
                                   id='-', range='+', consumer='worker-1')
    if pending:
        messages = [(p['message_id'], {'retry': True}) for p in pending]
    else:
        # Get new messages
        messages = redis.xreadgroup(
            groupname='payment-processors',
            consumername='worker-1',
            streams={'user-events': '>'},
            count=10,
            block=5000  # block 5 seconds
        )

    for stream, entries in (messages or []):
        for msg_id, fields in entries:
            success = process_message(fields)
            if success:
                redis.xack('user-events', 'payment-processors', msg_id)
            # If failed: stays in PEL for retry or recovery
```

---

## Stream Trimming and Retention

```bash
# Trim to exact count (slower — must find trim point)
XTRIM user-events MAXLEN 10000

# Trim approximately (uses listpack node boundaries — faster)
XTRIM user-events MAXLEN ~ 10000

# Trim by minimum ID (delete messages older than a timestamp)
XTRIM user-events MINID 1700000000000-0   # Delete all before this ID

# Auto-trim on XADD
XADD user-events MAXLEN ~ 100000 * event login userId 123
```

**Memory footprint:** A stream entry with 5 fields ≈ 250 bytes. 1 million entries ≈ 250 MB — plan trimming accordingly.

---

## Redis Streams vs Kafka

| | Redis Streams | Apache Kafka |
|---|---|---|
| **Persistence** | Optional (RDB/AOF) | Durable (disk-first) |
| **Message replay** | Yes (by ID range) | Yes (by offset) |
| **Consumer groups** | Yes | Yes (Consumer Groups) |
| **Ordering** | Per key (one stream) | Per partition |
| **Partitioning** | Manual (multiple streams) | Built-in partitions |
| **Throughput** | 100K–1M msgs/sec | 1M–10M msgs/sec |
| **Retention** | Memory-limited | Disk (configurable) |
| **Operational complexity** | Low | High |
| **Message replay history** | Limited by memory | Configurable (days/weeks) |
| **Best for** | Simple event queues, internal events | High-throughput event streaming |

**Choose Redis Streams when:**
- Already using Redis and need simple message queuing
- Message volume is moderate and memory-bound retention is acceptable
- Low operational complexity is a priority
- Messages are relatively small

**Choose Kafka when:**
- Need TB of message history
- Multiple teams consume the same events
- Sub-millisecond latency matters at high throughput
- Built-in partitioning for parallelism

---

## XINFO — Stream Inspection

```bash
XINFO STREAM user-events        # General stream info (length, first/last ID)
XINFO GROUPS user-events        # List all consumer groups
XINFO CONSUMERS user-events payment-processors  # Consumer details + pending count
```

---

## Spring Boot Integration

```java
// Producer
@Service
public class EventPublisher {
    private final RedisTemplate<String, String> redisTemplate;
    private final StreamOperations<String, String, String> streamOps;

    public String publishEvent(String userId, String event) {
        Map<String, String> fields = Map.of(
            "userId", userId,
            "event", event,
            "timestamp", Instant.now().toString()
        );
        RecordId id = streamOps.add("user-events", fields);
        return id.getValue();
    }
}

// Consumer with Consumer Group
@Component
@Slf4j
public class EventConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        log.info("Processing: {} - {}", record.getId(), record.getValue());
        // ... process
    }
}

@Configuration
public class StreamConfig {
    @Bean
    public Subscription subscription(RedisConnectionFactory factory, EventConsumer consumer) {
        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
            StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                .pollTimeout(Duration.ofSeconds(1))
                .build();

        var container = StreamMessageListenerContainer.create(factory, options);
        var sub = container.receive(
            Consumer.from("payment-processors", "worker-1"),
            StreamOffset.create("user-events", ReadOffset.lastConsumed()),
            consumer
        );
        container.start();
        return sub;
    }
}
```
