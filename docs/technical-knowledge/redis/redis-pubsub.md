---
id: redis-pubsub
title: "Redis Pub/Sub"
slug: redis-pubsub
description: Redis Pub/Sub messaging — channels, patterns, fire-and-forget semantics, delivery guarantees, and production comparison with Redis Streams.
tags: [redis, pubsub, messaging, backend, event-driven]
---

# Redis Pub/Sub

Redis Pub/Sub implements the publish/subscribe messaging paradigm where publishers send messages to **channels**, and subscribers receive them in real time. It is a **fire-and-forget** system with no message persistence.

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
| **Message ordering** | ✅ FIFO within a channel |
| **Acknowledgment** | ❌ No ACK mechanism |

> **Critical:** If a subscriber disconnects and reconnects, it will miss all messages published during its absence. Pub/Sub is only appropriate when message loss is acceptable.

---

## Connection Modes

A subscriber connection enters a **blocking subscribe mode** — it can only receive messages. It cannot send other commands while subscribed (except SUBSCRIBE, UNSUBSCRIBE, PING, RESET, QUIT).

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

---

## Production Limitations and Solutions

| Limitation | Problem | Solution |
|------------|---------|----------|
| No persistence | Message loss on disconnect | Redis Streams for reliability |
| No ACK | Can't confirm delivery | Streams with XACK |
| Cluster broadcast overhead | O(N) node fanout | Redis 7 Sharded Pub/Sub |
| Slow subscriber blocks | Publisher blocked if subscriber is slow (TCP backpressure) | Set `client-output-buffer-limit pubsub` |
| Memory pressure | Slow subscriber accumulates messages in send buffer | Limit buffer: `client-output-buffer-limit pubsub 8mb 2mb 60` |

```bash
# Redis config: disconnect slow pub/sub subscribers
client-output-buffer-limit pubsub 8mb 2mb 60
# Hard limit: 8mb (immediate disconnect)
# Soft limit: 2mb for 60 seconds → then disconnect
# Prevents one slow subscriber from consuming all server memory
```
