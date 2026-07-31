---
id: redis-pubsub
title: "Redis Pub/Sub"
slug: redis-pubsub
description: Redis Pub/Sub messaging — channels, patterns, fire-and-forget semantics, delivery guarantees, and production comparison with Redis Streams.
tags: [redis, pubsub, messaging, backend, event-driven]
---

import RedisPubSubVsStreamsDiagram from '@site/src/components/RedisPubSubVsStreamsDiagram';

# Redis Pub/Sub

Redis Pub/Sub implements the publish/subscribe messaging paradigm where publishers send messages to **channels**, and subscribers receive them in real time. It is a **fire-and-forget** system with no message persistence.

<RedisPubSubVsStreamsDiagram />

---

## Internal Mechanics

Understanding what actually happens inside Redis on `PUBLISH` clarifies most of the failure modes below.

- Redis maintains an **in-memory dictionary** mapping channel names to a list of subscribed client connections (`pubsub_channels`), and a separate radix-tree-like structure for pattern subscriptions (`pubsub_patterns`).
- `PUBLISH` is synchronous and O(N+M) where N is the number of matching direct subscribers and M is the number of matching patterns — Redis walks both structures and writes the message directly into each subscriber's **client output buffer** on the same event loop tick. There is no queue, no disk write, and no intermediate broker state.
- Because delivery is just "write to the socket buffer of every currently-connected subscriber," a message that arrives when zero clients are subscribed is discarded immediately — it is never held anywhere, even briefly.
- In Redis Cluster, `PUBLISH` (non-sharded) is propagated to **every node** via the cluster bus so that clients connected to any node can be subscribed to any channel — this is what causes the O(N-nodes) broadcast overhead described later.
- A single Redis instance is single-threaded for command execution, so a burst of large `PUBLISH` payloads to many subscribers can transiently block other commands (`GET`/`SET`) on the same instance — pub/sub is not isolated from your regular workload unless you run it on a dedicated Redis instance.

---

## Core Commands

```bash
# SUBSCRIBE — listen to one or more channels
SUBSCRIBE news:breaking news:sports

# PSUBSCRIBE — pattern subscribe (glob patterns)
PSUBSCRIBE news:*          # All news channels
PSUBSCRIBE user:*.events   # All user event channels

# PUBLISH — send a message to a channel
PUBLISH news:breaking "Redis 8.0 released"
# Returns: number of subscribers who received the message

# UNSUBSCRIBE
UNSUBSCRIBE news:sports     # Unsubscribe from specific channel
UNSUBSCRIBE                 # Unsubscribe from all channels

PUNSUBSCRIBE news:*         # Pattern unsubscribe
```

### Subscription Lifecycle

```
Subscriber A:  SUBSCRIBE chat:room1 chat:room2
                         → waiting for messages...

Publisher:     PUBLISH chat:room1 "Hello everyone!"
                         → Subscriber A receives:
                            ["message", "chat:room1", "Hello everyone!"]

Pattern sub:   PSUBSCRIBE chat:*
               PUBLISH chat:room2 "New user joined"
                         → Pattern subscriber receives:
                            ["pmessage", "chat:*", "chat:room2", "New user joined"]
```

---

## Delivery Semantics

| Property | Behavior |
|----------|----------|
| **Persistence** | ❌ Zero — messages not stored |
| **Delivery guarantee** | **At-most-once** — fire-and-forget |
| **Offline subscribers** | ❌ Miss all messages while disconnected |
| **History/replay** | ❌ Impossible — no message log |
| **Message ordering** | ✅ FIFO within a channel, per-publisher connection only |
| **Acknowledgment** | ❌ No ACK mechanism |

> **Critical:** If a subscriber disconnects and reconnects, it will miss all messages published during its absence. Pub/Sub is only appropriate when message loss is acceptable.

**A subtlety on ordering:** FIFO ordering holds for messages published from a *single* connection. If two different application instances publish concurrently to the same channel, subscribers see messages in the order Redis's event loop processed the two `PUBLISH` calls — not necessarily the order the two publishers intended, since there's no global sequence number to reconcile against (unlike a Kafka partition offset).

---

## Connection Modes

A subscriber connection enters a **blocking subscribe mode** — it can only receive messages. It cannot send other commands while subscribed (except SUBSCRIBE, UNSUBSCRIBE, PING, RESET, QUIT).

This has a direct architectural consequence for Spring apps: **never share a connection between subscribing and normal command execution.** `RedisMessageListenerContainer` manages this correctly by acquiring a dedicated connection from the pool for subscriptions, separate from the pool used by `RedisTemplate` for regular `GET`/`SET` calls. Manually reusing a raw `RedisConnection` for both will deadlock the connection the moment `SUBSCRIBE` is issued.

```java
// Spring Boot Redis Pub/Sub
@Configuration
public class PubSubConfig {

    @Bean
    public RedisMessageListenerContainer listenerContainer(
            RedisConnectionFactory factory,
            MessageListenerAdapter adapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(adapter, new PatternTopic("user:*.events"));
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(UserEventListener listener) {
        return new MessageListenerAdapter(listener, "onMessage");
    }
}

@Component
public class UserEventListener {
    public void onMessage(String message, String channel) {
        log.info("Received on {}: {}", channel, message);
    }
}

// Publisher
@Service
public class EventPublisher {
    private final RedisTemplate<String, String> redisTemplate;

    public void publishUserEvent(Long userId, String event) {
        redisTemplate.convertAndSend("user:" + userId + ".events", event);
    }
}
```

### Pattern Subscription with `@EventListener`

A cleaner Spring approach using `RedisMessageListenerContainer` + Spring events:

```java
@Service
public class DynamicSubscriberService {

    @Autowired
    private RedisMessageListenerContainer container;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    public void subscribe(String channel) {
        container.addMessageListener(
            (message, pattern) -> {
                String body = new String(message.getBody());
                eventPublisher.publishEvent(new RedisMessageEvent(channel, body));
            },
            new ChannelTopic(channel)
        );
    }
}

@Component
public class MessageHandler {

    @EventListener
    public void handleRedisMessage(RedisMessageEvent event) {
        System.out.println("Event on " + event.getChannel() + ": " + event.getBody());
    }
}
```

### Lettuce vs Jedis for Pub/Sub

Spring Boot defaults to **Lettuce**, and for pub/sub-heavy applications this matters more than it does for simple caching:

| | Lettuce (default) | Jedis |
|---|---|---|
| Threading model | Netty-based, async, single shared connection can multiplex pub/sub + commands | Blocking I/O, one thread per connection |
| Subscriber connection cost | Cheap — reuses shared netty event loop | Requires a dedicated thread per subscription |
| Reconnection on failover | Automatic, built-in reconnect with resubscription | Requires manual reconnect/resubscribe logic |
| Recommended for | Most Spring Boot apps, especially many concurrent subscriptions | Legacy codebases already standardized on Jedis |

If you're running many `PSUBSCRIBE` listeners per instance (e.g., per-tenant channels), Lettuce's multiplexing avoids the thread-per-subscription cost that Jedis incurs.

---

## Real-World Use Cases

| Use Case | Why Pub/Sub Fits |
|----------|-----------------|
| Live chat (in-memory only) | Users online — message loss on disconnect OK |
| Real-time notifications | Push to connected clients |
| Cache invalidation broadcast | All nodes invalidate cache entry simultaneously |
| Dashboard live updates | Emit metrics to connected dashboard (tolerate drops) |
| Debug events / logging broadcast | Development environment tracing |
| WebSocket fan-out via Redis | Horizontal scaling of WebSocket servers |

### Cache Invalidation Pattern

```
Service A updates product:123
→ PUBLISH cache:invalidate "product:123"

Service B (subscribed to cache:invalidate):
→ evict("product:123") from local in-process cache
→ ensures all nodes' L1 caches are invalidated on write

(Uses Pub/Sub for broadcast — doesn't need persistence)
```

```java
// Publisher: when a product is updated
@CachePut(value = "products", key = "#product.id")
public Product updateProduct(Product product) {
    Product saved = repository.save(product);
    // Notify all instances to evict their local cache
    redisTemplate.convertAndSend("cache-invalidation", "products:" + product.getId());
    return saved;
}

// Subscriber: all app instances listen
@Component
public class CacheInvalidationListener implements MessageListener {

    @Autowired
    private CacheManager cacheManager;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String key = new String(message.getBody());
        String[] parts = key.split(":", 2);
        if (parts.length == 2) {
            Cache cache = cacheManager.getCache(parts[0]);
            if (cache != null) {
                cache.evict(parts[1]);
            }
        }
    }
}
```

**Failure mode to know about this exact pattern:** if a service instance is restarting (rolling deploy) at the moment the invalidation is published, that instance misses the eviction entirely and serves a stale cached value from its local L1 cache until the entry naturally expires via TTL. Because Pub/Sub gives no delivery guarantee, cache-invalidation-via-pubsub should always be paired with a **short TTL as a correctness backstop** — pub/sub is a latency optimization on top of TTL expiry, not a substitute for it.

---

## Keyspace Notifications (Related but Distinct Mechanism)

Redis can also publish pub/sub events automatically when keys are modified or expire, via **keyspace notifications** — useful for reacting to TTL expiry without polling:

```bash
# Enable in redis.conf or via CONFIG SET
CONFIG SET notify-keyspace-events Ex   # E = keyevent events, x = expired events

# Subscribe to expiry events for a specific DB
PSUBSCRIBE __keyevent@0__:expired
```

```java
@Component
public class ExpiredKeyListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        if (expiredKey.startsWith("session:")) {
            log.info("Session expired, cleaning up: {}", expiredKey);
        }
    }
}
```

Two gotchas: keyspace notifications are **disabled by default** (`notify-keyspace-events ""`) because they add CPU overhead per write, and — like all pub/sub — an expiry event published while no listener is connected is lost forever, so this pattern is only appropriate for best-effort cleanup, never for correctness-critical logic (e.g., don't rely on this alone to release a distributed lock).

---

## Pub/Sub vs Streams

| | Pub/Sub | Streams |
|---|---|---|
| Persistence | ❌ None | ✅ Yes (configurable) |
| Replay history | ❌ | ✅ By ID range |
| Offline client support | ❌ (miss messages) | ✅ (reads from last consumed ID) |
| Consumer groups | ❌ (all get all) | ✅ (one-to-one distribution within group) |
| Message acknowledgment | ❌ | ✅ (XACK) |
| Pattern matching | ✅ (PSUBSCRIBE) | ❌ (use separate streams) |
| Throughput (simple fan-out) | Higher (no storage overhead) | Slightly lower |
| Use case | Real-time ephemeral fanout | Reliable event queues |

**Production guidance:** Unless you specifically need zero-overhead real-time broadcast and can tolerate message loss, **prefer Redis Streams** for production message passing.

### Pub/Sub vs Kafka (Decision Matrix)

Teams already running Kafka sometimes reach for Redis Pub/Sub out of convenience since Redis is already deployed for caching. Use this to decide:

| Requirement | Choose Redis Pub/Sub | Choose Kafka |
| :--- | :--- | :--- |
| Sub-millisecond fan-out to many ephemeral clients (WebSocket gateways) | ✅ | Overkill — consumer group rebalancing adds latency |
| Message must survive a broker restart | ❌ | ✅ |
| Need replay / reprocessing for a new consumer | ❌ | ✅ |
| Cross-service durable event sourcing | ❌ | ✅ |
| Simple broadcast where loss is acceptable (cache invalidation, presence) | ✅ | Unnecessary operational overhead |
| Already paying for Redis, no new infra budget, ephemeral use case | ✅ | — |

---

## Sharding Pub/Sub in Redis Cluster

Standard Pub/Sub in Redis Cluster broadcasts to ALL nodes — every PUBLISH is forwarded to all cluster nodes, creating O(N-nodes) overhead.

**Redis 7.0+: Sharded Pub/Sub**

```bash
SSUBSCRIBE channel     # Subscribe to sharded channel
SUNSUBSCRIBE channel   # Unsubscribe from sharded channel
SPUBLISH channel msg   # Publish to specific shard only
```

Sharded Pub/Sub routes channels to a specific hash slot — messages only go to the node owning that slot. Dramatically reduces cluster-wide broadcast overhead for high-volume apps.

```java
// Spring Data Redis (2.7+) sharded pub/sub support
@Bean
public RedisMessageListenerContainer shardedListenerContainer(RedisConnectionFactory factory) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(factory);
    // Note: as of most Spring Data Redis versions, sharded pub/sub support
    // may require using the Lettuce client directly (RedisClusterPubSubCommands)
    // rather than the standard RedisMessageListenerContainer — verify against
    // your Spring Data Redis version before assuming SSUBSCRIBE is wired up.
    return container;
}
```

---

## Observability

Pub/Sub is invisible by default — there's no consumer lag metric like Kafka, because there's no log to lag behind. Monitor these instead:

```bash
# Check active pub/sub channel and pattern counts
PUBSUB CHANNELS          # List all active channels with subscribers
PUBSUB NUMSUB ch1 ch2    # Subscriber count per channel
PUBSUB NUMPAT            # Total pattern subscriptions

# Server-level pub/sub stats
INFO stats | grep pubsub
# pubsub_channels: <n>
# pubsub_patterns: <n>
```

For Spring Boot, expose subscriber health as a custom Micrometer gauge rather than relying on Redis-side inspection alone — this catches the case where your application *thinks* it's subscribed but the underlying connection silently dropped:

```java
@Component
public class PubSubHealthMetrics {

    private final AtomicBoolean subscriptionActive = new AtomicBoolean(false);

    public PubSubHealthMetrics(MeterRegistry registry) {
        Gauge.builder("redis.pubsub.subscription.active", subscriptionActive, b -> b.get() ? 1 : 0)
                .description("Whether the expected Redis pub/sub listener container is connected")
                .register(registry);
    }

    @EventListener(RedisMessageListenerContainer.class)
    public void onListenerStarted() {
        subscriptionActive.set(true);
    }
}
```

Because there is no ACK and no lag metric, the only reliable way to detect "subscribers are silently missing messages" in production is an active **heartbeat channel**: publish a canary message on a fixed interval and alert if expected subscribers don't report receipt within a threshold.

---

## Production Limitations and Solutions

| Limitation | Problem | Solution |
|------------|---------|----------|
| No persistence | Message loss on disconnect | Redis Streams for reliability |
| No ACK | Can't confirm delivery | Streams with XACK |
| Cluster broadcast overhead | O(N) node fanout | Redis 7 Sharded Pub/Sub |
| Slow subscriber blocks | Publisher blocked if subscriber is slow (TCP backpressure) | Set `client-output-buffer-limit pubsub` |
| Memory pressure | Slow subscriber accumulates messages in send buffer | Limit buffer: `client-output-buffer-limit pubsub 8mb 2mb 60` |
| Silent message loss during failover | Redis Sentinel/Cluster failover drops all active subscriptions; messages published during the failover window are lost with no error to the publisher | Treat pub/sub as best-effort only; pair with a durable source of truth (DB row, Stream) for anything that must not be lost |
| No visibility into subscriber health | A "connected" subscriber may have a stalled consumer loop and never notice | Heartbeat/canary channel + Micrometer gauge as shown above |

```bash
# Redis config: disconnect slow pub/sub subscribers
client-output-buffer-limit pubsub 8mb 2mb 60
# Hard limit: 8mb (immediate disconnect)
# Soft limit: 2mb for 60 seconds → then disconnect
# Prevents one slow subscriber from consuming all server memory
```

---

## Common Gotchas & Anti-Patterns

1. **Treating Pub/Sub as a reliable queue.** The most common production incident: a team builds order-processing or payment notification logic on Pub/Sub, then loses events during a deploy or Redis failover. If losing a message is unacceptable, it does not belong on Pub/Sub — use Streams or Kafka.
2. **Sharing one connection for subscribe and regular commands.** Issuing `SUBSCRIBE` on a connection also used for `GET`/`SET` puts that connection into subscribe-only mode and breaks unrelated code paths using the same pooled connection. Let `RedisMessageListenerContainer` manage its own connection.
3. **Assuming cross-publisher ordering.** FIFO only holds per publishing connection; concurrent publishers from multiple app instances can interleave in a non-deterministic order.
4. **Forgetting the TTL backstop on cache invalidation.** Relying solely on pub/sub for cache coherence means any dropped message (deploy, network blip, failover) leaves a stale entry indefinitely. Always keep a TTL as the correctness guarantee.
5. **Enabling keyspace notifications globally without considering write overhead.** `notify-keyspace-events` adds a publish on every matching write; on a high-throughput instance this is a nontrivial CPU cost most teams don't budget for.
6. **No slow-subscriber protection configured.** Without `client-output-buffer-limit pubsub` tuned, a single slow consumer (e.g., a WebSocket gateway pod under GC pressure) can grow unbounded memory on the Redis server until it's forcibly disconnected or OOMs the instance.